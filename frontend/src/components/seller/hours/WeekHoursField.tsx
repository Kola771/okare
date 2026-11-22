'use client';

/**
 * Horaires de la semaine, jour par jour, plusieurs plages possibles (spec 0ter.4, 12.1, 12.4).
 * Même composant à la création (17b, VD7, écran 6) et dans « Horaires et fermetures » (19, VD3, DB3).
 */
import { Copy } from 'lucide-react';
import { WEEKDAY_LONG } from '@/shared/format';
import type { OpeningHours, TimeRange } from '@/shared/types';

const DAYS = ['1', '2', '3', '4', '5', '6', '7'] as const;
type Day = (typeof DAYS)[number];
const MAX_RANGES = 3;
const time = 'min-h-10 w-[100px] rounded-[10px] border border-[#E7E5E4] bg-white px-2 text-center text-[15px] font-medium';

/** Ranges proposées quand on ouvre un jour ou qu'on ajoute une plage. */
const firstRange = (h: OpeningHours): TimeRange => DAYS.map((d) => h[d]?.[0]).find(Boolean) ?? ['07:00', '15:00'];
const nextRange = (ranges: TimeRange[]): TimeRange => (ranges.length ? ['18:00', '22:00'] : ['11:30', '15:00']);

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors ${on ? 'bg-feuille' : 'bg-bordure'}`}>
      <span className={`absolute top-[3px] h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-[25px]' : 'left-[3px]'}`} />
    </button>
  );
}

export function WeekHoursField({ value, onChange }: { value: OpeningHours; onChange: (h: OpeningHours) => void }) {
  const set = (d: Day, ranges: TimeRange[]) => onChange({ ...value, [d]: ranges });
  const copyFrom = (d: Day) => onChange(Object.fromEntries(DAYS.map((x) => [x, value[x]?.length ? [...(value[d] ?? [])] : value[x] ?? []])) as OpeningHours);
  const copyMondayAll = () => onChange(Object.fromEntries(DAYS.map((x) => [x, x === '7' && !value['7']?.length ? [] : [...(value['1'] ?? [])]])) as OpeningHours);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E7E5E4]">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAFAF9] px-4 py-2.5">
        <span className="text-[13px] text-ardoise">Plusieurs plages par jour possibles (midi et soir)</span>
        <button type="button" onClick={copyMondayAll} className="min-h-9 rounded-[10px] border border-[#E7E5E4] bg-white px-3 text-xs font-bold">Copier lundi partout</button>
      </div>
      {DAYS.map((d, i) => {
        const ranges = value[d] ?? [];
        const day = WEEKDAY_LONG[i + 1];
        return (
          <div key={d} className="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-t border-[#E7E5E4] px-4 py-3">
            <div className="flex w-[136px] shrink-0 items-center gap-3">
              <Toggle on={ranges.length > 0} label={`Ouvert le ${day}`} onChange={(on) => set(d, on ? [firstRange(value)] : [])} />
              <b className="text-[15px]">{day}</b>
            </div>
            <div className={`flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:w-auto sm:flex-1 ${ranges.length ? 'w-full' : 'flex-1'}`}>
              {!ranges.length && <span className="text-sm text-ardoise">Fermé</span>}
              {ranges.map((r, j) => (
                <div key={j} className="flex items-center gap-1.5">
                  <input type="time" value={r[0]} aria-label={`${day} début plage ${j + 1}`} className={time}
                    onChange={(e) => set(d, ranges.map((x, k) => (k === j ? [e.target.value, x[1]] : x)))} />
                  <span className="text-ardoise" aria-hidden>→</span>
                  <input type="time" value={r[1]} aria-label={`${day} fin plage ${j + 1}`} className={time}
                    onChange={(e) => set(d, ranges.map((x, k) => (k === j ? [x[0], e.target.value] : x)))} />
                  <button type="button" aria-label={`Retirer la plage ${j + 1} du ${day}`} onClick={() => set(d, ranges.filter((_, k) => k !== j))}
                    className="h-8 w-8 shrink-0 rounded-full bg-[#F5F5F4] text-base text-ardoise">×</button>
                </div>
              ))}
              {ranges.length > 0 && ranges.length < MAX_RANGES && (
                <button type="button" aria-label={`Ajouter une plage le ${day}`} onClick={() => set(d, [...ranges, nextRange(ranges)])}
                  className="whitespace-nowrap py-1.5 text-[13px] font-bold text-piment">+ plage</button>
              )}
            </div>
            {ranges.length > 0 && (
              <button type="button" onClick={() => copyFrom(d)} title="Copier sur les autres jours" aria-label={`Copier les horaires du ${day} sur les autres jours`}
                className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ardoise hover:bg-[#F5F5F4] hover:text-charbon sm:flex">
                <Copy size={16} /></button>
            )}
          </div>
        );
      })}
      <p className="m-0 border-t border-[#E7E5E4] px-4 py-2.5 text-xs text-ardoise">Une plage peut passer minuit (ex. 18:00 → 02:00).</p>
    </div>
  );
}
