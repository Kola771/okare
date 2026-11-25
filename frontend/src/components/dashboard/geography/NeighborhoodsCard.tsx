'use client';

/** Quartiers d'une ville : filtre par zone, recherche, ajout, modification (nom, autres orthographes, zone), suppression. */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteNeighborhood, errorMessage, isApiError, saveNeighborhood, type GeoCityRow, type GeoNeighborhoodRow } from '@/lib/api';
import { btn } from '@/components/admin/AdminParts';
import { Card } from '@/components/admin/Card';
import { Field, inputCls } from '@/components/admin/Controls';
import { FilterChips } from '@/components/admin/DataTable';
import { Pager, usePaged } from '@/components/admin/Pager';
import { useToast } from '@/components/providers/ToastProvider';
import { Sheet } from '@/components/ui/Sheet';
import { initialPlace, PlacePicker, type GeoLists, type Place } from './PlacePicker';

type Form = { id?: string; name: string; place: Place; aliases: string };

export function NeighborhoodsCard({ city, geo, zones, neighborhoods }: {
  city: GeoCityRow; geo: GeoLists; zones: { id: string; name: string }[]; neighborhoods: GeoNeighborhoodRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [zone, setZone] = useState('all');
  const [q, setQ] = useState('');
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const needle = q.trim().toLowerCase();
  const rows = neighborhoods.filter((n) => (zone === 'all' || n.zoneId === zone)
    && (!needle || n.name.toLowerCase().includes(needle) || n.aliases.some((a) => a.includes(needle))));
  const { items, pager } = usePaged(rows);

  async function save() {
    if (!form) return;
    setErrors({});
    try {
      await saveNeighborhood({ id: form.id, name: form.name, zoneId: form.place.zoneId, aliases: form.aliases });
      toast(form.id ? 'Quartier modifié' : 'Quartier ajouté', 'success');
      setForm(null);
      router.refresh();
    } catch (e) {
      if (isApiError(e) && e.details) setErrors(e.details as Record<string, string>);
      toast(errorMessage(e), 'error');
    }
  }
  const remove = (n: GeoNeighborhoodRow) => window.confirm(`Supprimer le quartier ${n.name} ?`)
    && deleteNeighborhood(n.id).then(() => { toast('Quartier supprimé', 'success'); router.refresh(); }).catch((e) => toast(errorMessage(e), 'error'));

  return (
    <Card title={`Quartiers · ${city.name}`} flush
      right={<button type="button" className={btn.primary} onClick={() => setForm({ name: '', place: initialPlace(geo, city.id, zone === 'all' ? undefined : zone), aliases: '' })}>+ Nouveau quartier</button>}>
      <div className="flex flex-col gap-3 px-5 pb-4">
        <input className={`${inputCls} max-w-[360px]`} placeholder="Chercher un quartier…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Chercher un quartier" />
        <FilterChips value={zone} onChange={setZone} options={[['all', `Toutes les zones (${neighborhoods.length})`], ...zones.map((z) => [z.id, z.name] as [string, string])]} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead><tr className="bg-surface-inset text-xs text-ardoise">
            <th className="px-4 py-3 font-semibold">Quartier</th><th className="px-4 py-3 font-semibold">Autres orthographes</th>
            <th className="px-4 py-3 font-semibold">Zone</th><th className="px-4 py-3 font-semibold">Points</th><th className="px-4 py-3" />
          </tr></thead>
          <tbody>{items.length ? items.map((n) => (
            <tr key={n.id} className="border-t border-trait">
              <td className="px-4 py-3 font-bold">{n.name}</td>
              <td className="px-4 py-3 text-ardoise">{n.aliases.join(', ') || '—'}</td>
              <td className="px-4 py-3">{n.zoneName}</td>
              <td className="px-4 py-3">{n.points}</td>
              <td className="px-4 py-3 text-right"><span className="inline-flex gap-3">
                <button type="button" className="text-[13px] font-semibold text-piment underline" onClick={() => setForm({ id: n.id, name: n.name, place: initialPlace(geo, n.cityId, n.zoneId), aliases: n.aliases.join(', ') })}>Modifier</button>
                <button type="button" className="text-[13px] font-semibold text-ardoise underline" onClick={() => remove(n)}>Supprimer</button>
              </span></td>
            </tr>)) : <tr><td colSpan={5} className="px-4 py-8 text-center text-ardoise">Aucun quartier.</td></tr>}</tbody>
        </table>
      </div>
      <Pager {...pager} />
      <Sheet open={!!form} onClose={() => setForm(null)} labelledBy="nb-title">
        <h2 id="nb-title" className="m-0 text-xl font-bold">{form?.id ? `Quartier ${form.name}` : 'Nouveau quartier'}</h2>
        {form && <PlacePicker geo={geo} value={form.place} onChange={(place) => setForm({ ...form, place })} levels="zone" errors={errors} />}
        <Field label="Nom" error={errors.name}><input className={inputCls} value={form?.name ?? ''} onChange={(e) => form && setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Autres orthographes (séparées par des virgules)">
          <input className={inputCls} value={form?.aliases ?? ''} placeholder="ex. tokpa, dantokpa" onChange={(e) => form && setForm({ ...form, aliases: e.target.value })} />
        </Field>
        <p className="m-0 text-xs text-ardoise">Les autres orthographes aident la recherche (« cadjehoun » trouve Cadjèhoun).</p>
        <button type="button" className={btn.primary} onClick={save}>Enregistrer</button>
      </Sheet>
    </Card>
  );
}
