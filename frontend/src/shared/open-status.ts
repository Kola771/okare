/**
 * Statut d'ouverture — calcul unique `getOpenStatus(pos, now)` (OKARE_SPEC.md 12.4), partagé front / API / tests.
 * Priorité : exception du jour (PosDayOverride) > jour férié (holidayPolicy) > horaires habituels.
 */
import { BUSINESS_RULES, type BusinessRules } from './business-rules';
import type { HolidayPolicy } from './enums';
import { addDays, hmToMinutes, toLocal, weekdayOf } from './time';
import type { BusinessDate, OpeningHours, PosDayOverride, TimeRange } from './types';

export type OpenState =
  | 'OPEN' | 'CLOSING_SOON' | 'OPENS_LATER_TODAY' | 'CLOSED_TODAY' | 'CLOSED_EXCEPTIONALLY' | 'MAYBE_CLOSED' | 'UNKNOWN';

export interface OpenStatusInput {
  openingHours: OpeningHours;
  holidayPolicy: HolidayPolicy;
  /** Exceptions connues (au moins aujourd'hui et les 7 prochains jours). */
  overrides?: Pick<PosDayOverride, 'businessDate' | 'isClosed' | 'ranges'>[];
  /** Jours fériés du pays (dates métier). */
  holidays?: BusinessDate[];
  /** Signalements « fermé aujourd'hui » distincts du jour (hors équipe, comptes > 24 h). */
  closedReportsToday?: number;
  /** Plat du jour publié ou confirmation du vendeur / de l'équipe aujourd'hui : annule MAYBE_CLOSED. */
  confirmedOpenToday?: boolean;
}

export interface NextOpen {
  date: BusinessDate;
  weekday: number;
  time: string;
}

export interface OpenStatus {
  state: OpenState;
  /** Heure de fermeture de la plage en cours ('HH:mm'). */
  closesAt: string | null;
  /** Prochaine ouverture (jusqu'à 7 jours). */
  nextOpenAt: NextOpen | null;
  todayRanges: TimeRange[];
}

type DayPlan = { kind: 'ranges'; ranges: TimeRange[] } | { kind: 'exception-closed' } | { kind: 'holiday-unknown' };

function dayPlan(pos: OpenStatusInput, date: BusinessDate): DayPlan {
  const override = pos.overrides?.find((o) => o.businessDate === date);
  if (override) {
    if (override.isClosed) return { kind: 'exception-closed' };
    if (override.ranges) return { kind: 'ranges', ranges: override.ranges };
  }
  if (pos.holidays?.includes(date)) {
    if (pos.holidayPolicy === 'CLOSED') return { kind: 'ranges', ranges: [] };
    if (pos.holidayPolicy === 'UNKNOWN') return { kind: 'holiday-unknown' };
  }
  const key = String(weekdayOf(date)) as keyof OpeningHours;
  return { kind: 'ranges', ranges: pos.openingHours[key] ?? [] };
}

const rangesOf = (plan: DayPlan) => (plan.kind === 'ranges' ? plan.ranges : []);

/** Fin d'une plage en minutes depuis le début de son jour (une plage qui passe minuit dépasse 1 440). */
function rangeEnd([start, end]: TimeRange): number {
  const s = hmToMinutes(start);
  const e = hmToMinutes(end);
  return e <= s ? e + 1440 : e;
}

function findNextOpen(pos: OpenStatusInput, today: BusinessDate, afterMinutes: number): NextOpen | null {
  for (let i = 0; i <= 7; i++) {
    const date = addDays(today, i);
    const starts = rangesOf(dayPlan(pos, date))
      .map(([s]) => s)
      .filter((s) => i > 0 || hmToMinutes(s) > afterMinutes)
      .sort();
    if (starts.length) return { date, weekday: weekdayOf(date), time: starts[0] };
  }
  return null;
}

export function getOpenStatus(pos: OpenStatusInput, now: Date, rules: BusinessRules = BUSINESS_RULES): OpenStatus {
  const { date: today, minutes } = toLocal(now);
  const plan = dayPlan(pos, today);
  const todayRanges = rangesOf(plan);
  const base = { closesAt: null, nextOpenAt: null, todayRanges };
  const hasAnyHours = Object.values(pos.openingHours).some((r) => r && r.length > 0);

  if (!hasAnyHours && !pos.overrides?.some((o) => o.businessDate === today)) return { state: 'UNKNOWN', ...base };

  // Plage d'hier qui passe minuit et n'est pas finie.
  const yesterday = rangesOf(dayPlan(pos, addDays(today, -1)));
  const lateRange = yesterday.find((r) => rangeEnd(r) > 1440 && minutes < rangeEnd(r) - 1440);

  const current = lateRange
    ? { end: rangeEnd(lateRange) - 1440, label: lateRange[1] }
    : todayRanges
        .filter((r) => minutes >= hmToMinutes(r[0]) && minutes < rangeEnd(r))
        .map((r) => ({ end: rangeEnd(r), label: r[1] }))[0];

  if (!current) {
    if (plan.kind === 'exception-closed') {
      return { state: 'CLOSED_EXCEPTIONALLY', ...base, nextOpenAt: findNextOpen(pos, today, 1440) };
    }
    if (plan.kind === 'holiday-unknown') return { state: 'UNKNOWN', ...base };
  }

  const reports = pos.closedReportsToday ?? 0;
  if (reports >= rules.hours.closedTodayReportThreshold && !pos.confirmedOpenToday) {
    return { state: 'MAYBE_CLOSED', ...base, nextOpenAt: findNextOpen(pos, today, 1440) };
  }

  if (current) {
    const soon = current.end - minutes <= rules.hours.closingSoonMinutes;
    return { state: soon ? 'CLOSING_SOON' : 'OPEN', ...base, closesAt: current.label };
  }

  const later = findNextOpen(pos, today, minutes);
  if (later && later.date === today) return { state: 'OPENS_LATER_TODAY', ...base, nextOpenAt: later };
  return { state: 'CLOSED_TODAY', ...base, nextOpenAt: findNextOpen(pos, today, 1440) };
}

/** Un client voit-il ce point avec « Ouvert maintenant » (8.1, 12.4) ? */
export const isOpenNow = (s: OpenState) => s === 'OPEN' || s === 'CLOSING_SOON';
/** Avertir avant d'ouvrir WhatsApp (12.4 Effets). */
export const needsClosedWarning = (s: OpenState) =>
  s === 'CLOSED_TODAY' || s === 'CLOSED_EXCEPTIONALLY' || s === 'MAYBE_CLOSED';
