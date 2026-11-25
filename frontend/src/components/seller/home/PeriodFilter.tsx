'use client';

/** Filtres de période de l'accueil vendeur : année, mois, ou date de début – date de fin (les dates l'emportent). */
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MONTHS, type Period } from '@/shared/period';

const ctl = 'min-h-11 w-full min-w-0 rounded-xl border border-trait bg-surface px-3 text-sm font-semibold text-charbon';
const lbl = 'flex min-w-0 flex-col gap-1 text-xs font-bold text-ardoise';

function today() { return new Date().toISOString().slice(0, 10); }
function thirtyDaysAgo() { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); }

export function PeriodFilter({ period, years }: { period: Period; years: number[] }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const go = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) if (v) p.set(k, v); else p.delete(k);
    router.replace(`${path}${p.size ? `?${p}` : ''}`, { scroll: false });
  };
  const ym = (year: number, month: number | null) => go({ year: String(year), month: month ? String(month) : 'all', from: null, to: null });

  const fromVal = period.custom ? period.from : thirtyDaysAgo();
  const toVal = period.custom ? period.to : today();

  return (
    <section aria-label="Période" className="@container rounded-2xl border border-trait bg-surface p-4">
      <div className="grid grid-cols-1 gap-3 @min-[500px]:grid-cols-4">
        <label className={lbl}>Année
          <select className={ctl} value={period.custom ? '' : period.year} onChange={(e) => ym(Number(e.target.value), period.month)}>
            {period.custom && <option value="">—</option>}{years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label className={lbl}>Mois
          <select className={ctl} value={period.custom ? '' : period.month ?? 'all'} onChange={(e) => ym(period.year, e.target.value === 'all' ? null : Number(e.target.value))}>
            {period.custom && <option value="">—</option>}<option value="all">Tous les mois</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </label>
        <label className={lbl}>Date de début
          <input type="date" className={ctl} value={fromVal} max={toVal}
            onChange={(e) => go({ from: e.target.value || null, year: null, month: null })} />
        </label>
        <label className={lbl}>Date de fin
          <input type="date" className={ctl} value={toVal} min={fromVal}
            onChange={(e) => go({ to: e.target.value || null, year: null, month: null })} />
        </label>
      </div>
    </section>
  );
}
