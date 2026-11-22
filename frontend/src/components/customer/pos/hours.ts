/** Mise en forme des horaires de la semaine (page du point de vente). */
import { formatHour, WEEKDAY_LONG } from '@/shared/format';
import type { OpeningHours, TimeRange } from '@/shared/types';

const SHORT = ['', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
const DAYS = ['1', '2', '3', '4', '5', '6', '7'] as const;

export const rangesText = (ranges: TimeRange[] | undefined) =>
  ranges?.length ? ranges.map(([a, b]) => `${formatHour(a)} – ${formatHour(b)}`).join(' · ') : 'Fermé';

/** Lignes « Lundi : 7h – 15h » pour les 7 jours. */
export function weekRows(hours: OpeningHours): { day: number; label: string; text: string; closed: boolean }[] {
  return DAYS.map((d, i) => ({ day: i + 1, label: WEEKDAY_LONG[i + 1], text: rangesText(hours[d]), closed: !hours[d]?.length }));
}

/** Résumé compact : « lun–sam 7h–15h » (jours consécutifs aux mêmes horaires du premier jour ouvert). */
export function hoursSummary(hours: OpeningHours): string {
  const open = DAYS.filter((d) => hours[d]?.length);
  if (!open.length) return 'Horaires non confirmés';
  const ref = JSON.stringify(hours[open[0]]);
  const same = open.filter((d) => JSON.stringify(hours[d]) === ref);
  const first = Number(same[0]);
  const last = Number(same[same.length - 1]);
  const days = first === last ? SHORT[first] : `${SHORT[first]}–${SHORT[last]}`;
  const r = hours[open[0]]!.map(([a, b]) => `${formatHour(a)}–${formatHour(b)}`).join(', ');
  return `${days} ${r}`;
}
