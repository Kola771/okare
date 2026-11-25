'use client';

/** Tableau des zones (DB5) : catégorie, places par jour, points, statut ; un clic ouvre la fenêtre de modification. */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { errorMessage, setZoneActive, updateZone, type AdminZoneRow } from '@/lib/api';
import { btn, Pill } from '@/components/admin/AdminParts';
import { Field, inputCls } from '@/components/admin/Controls';
import { Pager, usePaged } from '@/components/admin/Pager';
import { useToast } from '@/components/providers/ToastProvider';
import { Sheet } from '@/components/ui/Sheet';
import { CatPill } from './ZoneClient';

const CATS = ['A', 'B', 'C'] as const;

export function CategoryPicker({ value, onChange }: { value: 'A' | 'B' | 'C'; onChange: (v: 'A' | 'B' | 'C') => void }) {
  return (
    <div className="flex gap-2">{CATS.map((c) => (
      <button key={c} type="button" aria-pressed={value === c} onClick={() => onChange(c)}
        className={`min-h-11 flex-1 rounded-xl text-sm font-bold ${value === c ? 'bg-inverse text-on-inverse' : 'border border-trait bg-surface'}`}>Catégorie {c}</button>))}
    </div>
  );
}

export function ZonesTable({ zones, canEdit }: { zones: AdminZoneRow[]; canEdit: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [edit, setEdit] = useState<AdminZoneRow | null>(null);
  const { items, pager } = usePaged(zones);
  const [form, setForm] = useState({ name: '', category: 'A' as 'A' | 'B' | 'C', slots: '' });
  const open = (z: AdminZoneRow) => { setEdit(z); setForm({ name: z.name, category: z.category, slots: String(z.slots) }); };
  const toggle = (z: AdminZoneRow) => setZoneActive(z.id, !z.active).then(() => router.refresh()).catch((e) => toast(errorMessage(e), 'error'));
  const save = () => edit && updateZone(edit.id, { name: form.name, category: form.category, slots: form.slots === '' ? null : Number(form.slots) })
    .then(() => { toast('Zone enregistrée', 'success'); setEdit(null); router.refresh(); }).catch((e) => toast(errorMessage(e), 'error'));

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] border-collapse text-left text-sm">
          <thead><tr className="bg-surface-inset text-xs text-ardoise">
            <th className="px-4 py-3 font-semibold">Zone</th><th className="px-2 py-3 font-semibold">Cat.</th><th className="px-2 py-3 font-semibold">Places / jour</th>
            <th className="px-2 py-3 font-semibold">Points</th><th className="px-4 py-3 font-semibold">Statut</th>
          </tr></thead>
          <tbody>{items.map((z) => (
            <tr key={z.id} className="border-t border-trait">
              <td className="px-4 py-3">
                {canEdit ? <button type="button" onClick={() => open(z)} className="text-left font-bold hover:text-piment">{z.name}</button> : <b>{z.name}</b>}
                <span className="block text-xs text-ardoise">{z.neighborhoods.join(', ')}</span>
              </td>
              <td className="px-2"><CatPill code={z.category} /></td>
              <td className="px-2">{z.slots}</td>
              <td className="px-2">{z.points}</td>
              <td className="px-4">{canEdit
                ? <button type="button" onClick={() => toggle(z)} aria-label={`${z.active ? 'Désactiver' : 'Activer'} ${z.name}`}><Pill tone={z.active ? 'ok' : 'neutral'}>{z.active ? 'Active' : 'Inactive'}</Pill></button>
                : <Pill tone={z.active ? 'ok' : 'neutral'}>{z.active ? 'Active' : 'Inactive'}</Pill>}</td>
            </tr>))}</tbody>
        </table>
      </div>
      <Pager {...pager} />
      <Sheet open={!!edit} onClose={() => setEdit(null)} labelledBy="zone-edit-title">
        <h2 id="zone-edit-title" className="m-0 text-xl font-bold">Zone {edit?.name}</h2>
        <Field label="Nom"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Catégorie (prix des pubs)"><CategoryPicker value={form.category} onChange={(category) => setForm({ ...form, category })} /></Field>
        <Field label="Places de pub par jour">
          <input className={inputCls} inputMode="numeric" value={form.slots} onChange={(e) => setForm({ ...form, slots: e.target.value.replace(/\D/g, '') })} />
        </Field>
        <p className="m-0 text-xs text-ardoise">Quartiers : {edit?.neighborhoods.join(', ') || 'aucun'} — à gérer dans « Pays, villes et quartiers ».</p>
        <button type="button" className={btn.primary} onClick={save}>Enregistrer</button>
      </Sheet>
    </>
  );
}
