'use client';

/** Ligne « modèle de message » de DB12 : aperçu sur une ligne, « Modifier » ouvre la zone de texte. */
import { useState } from 'react';
import { btn } from '@/components/admin/AdminParts';
import { SettingRow } from '@/components/admin/Controls';

export function TemplateRow({ title, value, onChange, vars }: { title: string; value: string; onChange: (v: string) => void; vars: string }) {
  const [open, setOpen] = useState(false);
  const preview = value.length > 90 ? `${value.slice(0, 90)}…` : value;
  return (
    <>
      <SettingRow title={title} sub={<>{preview} Variables : {vars}.</>}>
        <button type="button" className={btn.secondary} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Fermer' : 'Modifier'}</button>
      </SettingRow>
      {open && (
        <div className="px-5 pb-4">
          <textarea aria-label={title} value={value} rows={4} onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-trait p-3 text-[15px]" />
        </div>
      )}
    </>
  );
}
