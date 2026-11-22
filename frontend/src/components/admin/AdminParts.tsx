/** Briques des écrans vendeur et dashboard : titre de page, panneau, carte de chiffre, pastille d'état, onglets, barres. */
import type { LucideIcon } from 'lucide-react';

export function PageHead({ kicker, title, sub, actions }: { kicker?: React.ReactNode; title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 lg:flex-nowrap">
      <div className="min-w-0">
        {kicker && <div className="mb-1 text-[13px] text-ardoise">{kicker}</div>}
        <h1 className="m-0 font-display text-[26px] font-extrabold leading-tight lg:font-sans lg:font-bold">{title}</h1>
        {sub && <div className="mt-1 text-sm text-ardoise">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5 lg:shrink-0">{actions}</div>}
    </div>
  );
}

export function Panel({ title, sub, actions, children, className = '', id }: {
  title?: string; sub?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; id?: string;
}) {
  return (
    <section id={id} className={`flex min-w-0 flex-col gap-4 rounded-2xl border border-[#E7E5E4] bg-white p-5 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>{title && <h2 className="m-0 text-[17px] font-bold">{title}</h2>}{sub && <div className="mt-0.5 text-[13px] text-ardoise">{sub}</div>}</div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ icon: Icon, label, value, delta, tone = 'ok' }: {
  icon: LucideIcon; label: string; value: React.ReactNode; delta?: string; tone?: 'ok' | 'bad' | 'neutral';
}) {
  const t = tone === 'ok' ? 'bg-ok-soft text-ok' : tone === 'bad' ? 'bg-erreur-soft text-erreur' : 'bg-argile text-encre';
  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-[#E7E5E4] bg-white p-5">
      <span className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-[#F5F5F4]"><Icon size={20} /></span>
      <div className="flex items-end justify-between gap-2">
        <div><div className="text-[13px] text-ardoise">{label}</div><div className="mt-1 text-[26px] font-bold">{value}</div></div>
        {delta && <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${t}`}>{delta}</span>}
      </div>
    </div>
  );
}

const PILL = {
  ok: 'bg-ok-soft text-ok', warn: 'bg-attention-soft text-attention', bad: 'bg-erreur-soft text-erreur',
  neutral: 'bg-argile text-encre', piment: 'bg-piment-soft text-piment-dark', mais: 'bg-mais text-charbon', dark: 'bg-charbon text-white',
};

export function Pill({ tone = 'neutral', children }: { tone?: keyof typeof PILL; children: React.ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${PILL[tone]}`}>{children}</span>;
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: [T, string][] }) {
  return (
    <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-[#E7E5E4]">
      {tabs.map(([k, label]) => (
        <button key={k} type="button" role="tab" aria-selected={value === k} onClick={() => onChange(k)}
          className={`min-h-11 shrink-0 px-3.5 text-sm ${value === k ? 'font-bold text-piment shadow-[inset_0_-2px_0_var(--color-piment)]' : 'font-semibold text-ardoise'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

/** Histogramme simple (barres verticales) aux couleurs OKARE. */
export function Bars({ data, height = 140 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5" style={{ height }} role="img" aria-label={`Histogramme : ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}>
      {data.map((d, i) => (
        <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10px] font-semibold text-ardoise">{d.value}</span>
          <div className={`w-full rounded-t-md ${i === data.length - 1 ? 'bg-piment' : 'bg-piment-pale'}`} style={{ height: `${(d.value / max) * 80}%` }} />
          <span className="truncate text-[10px] text-pierre">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Barres horizontales (contacts par plat). */
export function HBars({ rows, unit }: { rows: { label: string; value: number; muted?: boolean }[]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col gap-1">
          <div className="flex justify-between text-[13px]"><span className={r.muted ? 'text-ardoise' : 'font-semibold'}>{r.label}</span>
            <span><b>{r.value}</b> {unit}</span></div>
          <div className="h-2 rounded-full bg-argile"><div className={`h-2 rounded-full ${r.muted ? 'bg-bordure' : 'bg-feuille'}`} style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export const btn = {
  primary: 'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-piment px-4 text-sm font-bold text-white no-underline hover:text-white disabled:opacity-60',
  secondary: 'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#E7E5E4] bg-white px-4 text-sm font-semibold text-charbon no-underline disabled:opacity-60',
  dark: 'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-charbon px-4 text-sm font-bold text-white no-underline hover:text-white disabled:opacity-60',
};
