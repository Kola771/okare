/**
 * Période des statistiques vendeur : année + mois (« Tous les mois » = l'année entière) ou dates de début et de fin.
 * Les dates l'emportent sur l'année et le mois. Par défaut : le mois en cours. Les chiffres s'arrêtent à la veille.
 * Adresse : ?year=2026&month=11 ou ?from=2026-10-01&to=2026-10-31.
 */
import { addDays } from './time';

export const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export interface Period { from: string; to: string; label: string; year: number; month: number | null; custom: boolean }

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const pad = (n: number) => String(n).padStart(2, '0');
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const fr = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** `today` : jour ouvré AAAA-MM-JJ. */
export function periodFromParams(get: (k: string) => string | null | undefined, today: string): Period {
  const yesterday = addDays(today, -1);
  const clip = (d: string) => (d > yesterday ? yesterday : d);
  const from = get('from');
  const to = get('to');
  const [ty, tm] = today.split('-').map(Number) as [number, number];
  if ((from && DATE.test(from)) || (to && DATE.test(to))) {
    const f = from && DATE.test(from) ? from : addDays(clip(to!), -29);
    const t = clip(to && DATE.test(to) ? to : yesterday);
    const ok = f <= t ? f : t;
    return { from: ok, to: t, label: `du ${fr(ok)} au ${fr(t)}`, year: Number(ok.slice(0, 4)), month: null, custom: true };
  }
  const year = Number(get('year')) || ty;
  const rawMonth = get('month');
  const month = rawMonth === 'all' ? null : Number(rawMonth) || (get('year') ? null : tm);
  const start = month ? `${year}-${pad(month)}-01` : `${year}-01-01`;
  const end = month ? `${year}-${pad(month)}-${pad(lastDay(year, month))}` : `${year}-12-31`;
  const t = clip(end);
  const f = start <= t ? start : addDays(t, -29); // mois en cours commencé aujourd'hui : 30 derniers jours
  return { from: f, to: t, label: month ? `${MONTHS[month - 1]} ${year}` : `Année ${year}`, year, month, custom: false };
}
