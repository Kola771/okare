'use client';

/** Cartes « Pays » et « Villes » : liste cliquable, ajout, activation d'une ville. */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createCity, createCountry, errorMessage, isApiError, setCityActive, type GeoCityRow, type GeoCountryRow } from '@/lib/api';
import { btn, Pill } from '@/components/admin/AdminParts';
import { Card } from '@/components/admin/Card';
import { Field, inputCls, Toggle } from '@/components/admin/Controls';
import { useToast } from '@/components/providers/ToastProvider';
import { Sheet } from '@/components/ui/Sheet';
import { PlacePicker, type Place } from './PlacePicker';

const rowCls = (on: boolean) => `flex w-full items-center justify-between gap-3 border-t border-trait px-5 py-3 text-left ${on ? 'bg-piment-soft' : 'hover:bg-surface-inset'}`;

function useSave() {
  const router = useRouter();
  const toast = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const run = async (p: Promise<unknown>, done: string, close: () => void) => {
    setErrors({});
    try { await p; toast(done, 'success'); close(); router.refresh(); } catch (e) {
      if (isApiError(e) && e.details) setErrors(e.details as Record<string, string>);
      toast(errorMessage(e), 'error');
    }
  };
  return { errors, run, router, toast };
}

export function CountriesCard({ countries, cities, selected, onSelect }: {
  countries: GeoCountryRow[]; cities: GeoCityRow[]; selected: string; onSelect: (id: string) => void;
}) {
  const { errors, run } = useSave();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ code: '', name: '', currency: 'XOF', timezone: 'Africa/Porto-Novo' });
  return (
    <Card title="Pays" flush right={<button type="button" className={btn.secondary} onClick={() => setOpen(true)}>+ Ajouter un pays</button>}>
      {countries.map((c) => (
        <button key={c.id} type="button" className={rowCls(c.id === selected)} onClick={() => onSelect(c.id)} aria-pressed={c.id === selected}>
          <span className="flex items-center gap-3"><span className="rounded-md bg-argile px-2 py-1 text-xs font-bold">{c.code}</span>
            <span><b className="block">{c.name}</b><span className="text-xs text-ardoise">{c.currency} · {c.timezone}</span></span></span>
          <span className="text-[13px] text-ardoise">{cities.filter((x) => x.countryId === c.id).length} ville(s)</span>
        </button>))}
      <Sheet open={open} onClose={() => setOpen(false)} labelledBy="new-country">
        <h2 id="new-country" className="m-0 text-xl font-bold">Nouveau pays</h2>
        <Field label="Code (2 lettres)" error={errors.code}><input className={inputCls} maxLength={2} value={v.code} placeholder="TG" onChange={(e) => setV({ ...v, code: e.target.value })} /></Field>
        <Field label="Nom" error={errors.name}><input className={inputCls} value={v.name} placeholder="Togo" onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
        <Field label="Monnaie"><input className={inputCls} value={v.currency} onChange={(e) => setV({ ...v, currency: e.target.value })} /></Field>
        <Field label="Fuseau horaire"><input className={inputCls} value={v.timezone} onChange={(e) => setV({ ...v, timezone: e.target.value })} /></Field>
        <button type="button" className={btn.primary} onClick={() => run(createCountry(v), 'Pays ajouté', () => setOpen(false))}>Ajouter</button>
      </Sheet>
    </Card>
  );
}

export function CitiesCard({ countryId, countries, cities, selected, onSelect }: {
  countryId: string; countries: GeoCountryRow[]; cities: GeoCityRow[]; selected: string; onSelect: (id: string) => void;
}) {
  const { errors, run, router, toast } = useSave();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [place, setPlace] = useState<Place>({ countryId, cityId: '', zoneId: '' });
  const openSheet = () => { setPlace({ countryId, cityId: '', zoneId: '' }); setOpen(true); };
  return (
    <Card title="Villes" flush right={<button type="button" className={btn.secondary} onClick={openSheet}>+ Ajouter une ville</button>}>
      {!cities.length && <p className="m-0 border-t border-trait px-5 py-4 text-sm text-ardoise">Aucune ville dans ce pays.</p>}
      {cities.map((c) => (
        <div key={c.id} className={rowCls(c.id === selected)}>
          <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onSelect(c.id)} aria-pressed={c.id === selected}>
            <b className="block">{c.name}</b>
            <span className="text-xs text-ardoise">{c.zones} zones · {c.neighborhoods} quartiers · {c.points} points de vente</span>
          </button>
          <span className="flex items-center gap-2.5"><Pill tone={c.active ? 'ok' : 'neutral'}>{c.active ? 'Ouverte' : 'Fermée'}</Pill>
            <Toggle label={`Ville ${c.name} ouverte`} checked={c.active}
              onChange={(on) => setCityActive(c.id, on).then(() => router.refresh()).catch((e) => toast(errorMessage(e), 'error'))} /></span>
        </div>))}
      <Sheet open={open} onClose={() => setOpen(false)} labelledBy="new-city">
        <h2 id="new-city" className="m-0 text-xl font-bold">Nouvelle ville</h2>
        <PlacePicker geo={{ countries, cities: [], zones: [] }} value={place} onChange={setPlace} levels="country" errors={errors} />
        <Field label="Nom" error={errors.name}><input className={inputCls} value={name} placeholder="Porto-Novo" onChange={(e) => setName(e.target.value)} /></Field>
        <p className="m-0 text-xs text-ardoise">Les catégories A, B et C sont créées avec la ville ; ajoute ensuite ses zones et ses quartiers.</p>
        <button type="button" className={btn.primary} onClick={() => run(createCity({ countryId: place.countryId, name }), 'Ville ajoutée', () => { setOpen(false); setName(''); })}>Ajouter</button>
      </Sheet>
    </Card>
  );
}
