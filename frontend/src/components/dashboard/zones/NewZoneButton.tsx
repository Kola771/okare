'use client';

/** « + Nouvelle zone » (DB5) : pays, ville, nom, catégorie, places par jour. Le contour se dessine ensuite sur la carte. */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createZone, errorMessage, isApiError } from '@/lib/api';
import { btn } from '@/components/admin/AdminParts';
import { Field, inputCls } from '@/components/admin/Controls';
import { useToast } from '@/components/providers/ToastProvider';
import { Sheet } from '@/components/ui/Sheet';
import { initialPlace, PlacePicker, type GeoLists, type Place } from '../geography/PlacePicker';
import { CategoryPicker } from './ZonesTable';

export function NewZoneButton({ geo }: { geo: GeoLists }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ name: '', category: 'B' as 'A' | 'B' | 'C', slots: '' });
  const [place, setPlace] = useState<Place>(() => initialPlace(geo));
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function save() {
    setErrors({});
    try {
      await createZone({ name: v.name, cityId: place.cityId, category: v.category, slots: v.slots ? Number(v.slots) : null });
      toast('Zone créée : dessine maintenant son contour.', 'success');
      setOpen(false);
      setV({ ...v, name: '', slots: '' });
      router.refresh();
    } catch (e) {
      if (isApiError(e) && e.details) setErrors(e.details as Record<string, string>);
      toast(errorMessage(e), 'error');
    }
  }

  return (
    <>
      <button type="button" className={btn.primary} onClick={() => setOpen(true)}>+ Nouvelle zone</button>
      <Sheet open={open} onClose={() => setOpen(false)} labelledBy="new-zone-title">
        <h2 id="new-zone-title" className="m-0 text-xl font-bold">Nouvelle zone</h2>
        <PlacePicker geo={geo} value={place} onChange={setPlace} levels="city" errors={errors} />
        <Field label="Nom de la zone" error={errors.name}>
          <input className={inputCls} value={v.name} placeholder="Ex. Zogbo" onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        <Field label="Catégorie"><CategoryPicker value={v.category} onChange={(category) => setV({ ...v, category })} /></Field>
        <Field label="Places de pub par jour (vide = valeur de la catégorie)">
          <input className={inputCls} inputMode="numeric" value={v.slots} onChange={(e) => setV({ ...v, slots: e.target.value.replace(/\D/g, '') })} />
        </Field>
        <button type="button" className={btn.primary} onClick={save}>Créer la zone</button>
      </Sheet>
    </>
  );
}
