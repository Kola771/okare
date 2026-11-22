/**
 * Temps métier : heure de Porto-Novo (UTC+1, sans heure d'été), quel que soit le fuseau de la machine.
 */
import { TZ_OFFSET_MINUTES } from './business-rules';
import type { BusinessDate } from './types';

const DAY_MS = 86_400_000;

/** Heure locale de Porto-Novo décomposée. `weekday` : 1 = lundi … 7 = dimanche. */
export interface LocalTime {
  date: BusinessDate;
  weekday: number;
  minutes: number;
}

export function toLocal(now: Date): LocalTime {
  const shifted = new Date(now.getTime() + TZ_OFFSET_MINUTES * 60_000);
  const date = shifted.toISOString().slice(0, 10);
  const jsDay = shifted.getUTCDay();
  return {
    date,
    weekday: jsDay === 0 ? 7 : jsDay,
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

/** Jour métier courant, décalé de `offsetDays`. */
export function businessDate(now: Date, offsetDays = 0): BusinessDate {
  return toLocal(new Date(now.getTime() + offsetDays * DAY_MS)).date;
}

/** Ajoute des jours à une date 'YYYY-MM-DD'. */
export function addDays(date: BusinessDate, days: number): BusinessDate {
  const d = new Date(`${date}T00:00:00Z`);
  return new Date(d.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** Nombre de jours entre deux dates, bornes incluses (fin − début + 1). */
export function daysInclusive(start: BusinessDate, end: BusinessDate): number {
  const a = new Date(`${start}T00:00:00Z`).getTime();
  const b = new Date(`${end}T00:00:00Z`).getTime();
  return Math.round((b - a) / DAY_MS) + 1;
}

/** Jour de la semaine (1 = lundi) d'une date 'YYYY-MM-DD'. */
export function weekdayOf(date: BusinessDate): number {
  const js = new Date(`${date}T00:00:00Z`).getUTCDay();
  return js === 0 ? 7 : js;
}

/** 'HH:mm' → minutes depuis minuit. */
export function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

/** Instant UTC correspondant à une date métier et une heure locale en minutes (peut dépasser 24 h). */
export function localToInstant(date: BusinessDate, minutes: number): Date {
  const midnightLocal = new Date(`${date}T00:00:00Z`).getTime() - TZ_OFFSET_MINUTES * 60_000;
  return new Date(midnightLocal + minutes * 60_000);
}

/** Moment du repas déduit de l'heure (8.1) : 5h–10h30 petit-déj, 10h30–16h déjeuner, 16h–23h dîner. */
export function momentOfDay(now: Date): 'BREAKFAST' | 'LUNCH' | 'DINNER' {
  const { minutes } = toLocal(now);
  if (minutes >= 300 && minutes < 630) return 'BREAKFAST';
  if (minutes >= 630 && minutes < 960) return 'LUNCH';
  return 'DINNER';
}
