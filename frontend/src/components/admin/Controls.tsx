'use client';

/** Contrôles des écrans de réglages (DB12, DB5) : interrupteur, liste déroulante, ligne « libellé + réglage à droite ». */

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-piment' : 'bg-bordure'}`}>
      <span className={`absolute h-6 w-6 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[25px]' : 'translate-x-[3px]'}`} />
    </button>
  );
}

export function Select<T extends string | number>({ value, onChange, options, label }: {
  value: T; onChange: (v: T) => void; options: [T, string][]; label: string;
}) {
  return (
    <select aria-label={label} value={String(value)}
      onChange={(e) => onChange((typeof value === 'number' ? Number(e.target.value) : e.target.value) as T)}
      className="min-h-11 rounded-xl border border-[#E7E5E4] bg-white px-3 text-sm font-semibold text-charbon">
      {options.map(([v, l]) => <option key={String(v)} value={String(v)}>{l}</option>)}
    </select>
  );
}

/** Ligne de réglage : titre en gras, explication grise, contrôle à droite (passe dessous sur mobile). */
export function SettingRow({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-[#E7E5E4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className="text-sm font-bold">{title}</div>
        {sub && <div className="mt-0.5 text-[13px] leading-snug text-ardoise">{sub}</div>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Champ de formulaire façon maquette (libellé au-dessus, cadre clair). */
export function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-sm font-bold">
      {label}{children}
      {error && <span className="text-xs font-semibold text-erreur">{error}</span>}
    </label>
  );
}

export const inputCls = 'min-h-12 w-full rounded-xl border border-[#E7E5E4] bg-white px-3.5 text-[15px] font-normal text-charbon';
