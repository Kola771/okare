/** Horaires de la semaine, jour courant en gras (12.4). */
import type { OpeningHours } from '@/shared/types';
import { weekRows } from './hours';

export function HoursCard({ hours, today }: { hours: OpeningHours; today: number }) {
  const rows = weekRows(hours);
  const empty = rows.every((r) => r.closed);
  return (
    <section className="rounded-[20px] border border-trait bg-surface px-5 py-4" aria-labelledby="hours-title">
      <b id="hours-title" className="text-[17px]">Horaires</b>
      {empty ? (
        <p className="m-0 mt-2 text-sm text-ardoise">Horaires non confirmés.</p>
      ) : (
        <dl className="m-0 mt-2">
          {rows.map((r) => (
            <div key={r.day} className={`flex justify-between py-1.5 text-sm ${r.day === today ? 'font-bold' : ''} ${r.closed && r.day !== today ? 'text-ardoise' : ''}`}>
              <dt>{r.label}{r.day === today && ' (aujourd’hui)'}</dt>
              <dd className="m-0">{r.text}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
