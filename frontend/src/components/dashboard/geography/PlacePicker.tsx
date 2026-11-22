'use client';

/**
 * Choix en cascade Pays → Ville → Zone pour les fenêtres de création (ville, zone, quartier).
 * Changer de pays remet la ville (et la zone) sur la première disponible.
 */
import type { GeoCityRow, GeoCountryRow } from '@/lib/api';
import { Field, inputCls } from '@/components/admin/Controls';

export interface Place { countryId: string; cityId: string; zoneId: string }
export interface GeoLists { countries: GeoCountryRow[]; cities: GeoCityRow[]; zones: { id: string; name: string; cityId: string }[] }

/** Lieu de départ : la ville donnée (ou la première du premier pays) et sa première zone. */
export function initialPlace(geo: GeoLists, cityId?: string, zoneId?: string): Place {
  const city = geo.cities.find((c) => c.id === cityId) ?? geo.cities.find((c) => c.countryId === geo.countries[0]?.id);
  const zone = geo.zones.find((z) => z.id === zoneId && z.cityId === city?.id) ?? geo.zones.find((z) => z.cityId === city?.id);
  return { countryId: city?.countryId ?? geo.countries[0]?.id ?? '', cityId: city?.id ?? '', zoneId: zone?.id ?? '' };
}

export function PlacePicker({ geo, value, onChange, levels, errors = {} }: {
  geo: GeoLists; value: Place; onChange: (p: Place) => void; levels: 'country' | 'city' | 'zone'; errors?: Record<string, string>;
}) {
  const cities = geo.cities.filter((c) => c.countryId === value.countryId);
  const zones = geo.zones.filter((z) => z.cityId === value.cityId);
  const setCountry = (countryId: string) => {
    const cityId = geo.cities.find((c) => c.countryId === countryId)?.id ?? '';
    onChange({ countryId, cityId, zoneId: geo.zones.find((z) => z.cityId === cityId)?.id ?? '' });
  };
  const setCity = (cityId: string) => onChange({ ...value, cityId, zoneId: geo.zones.find((z) => z.cityId === cityId)?.id ?? '' });

  return (
    <>
      <Field label="Pays" error={errors.countryId}>
        <select className={inputCls} value={value.countryId} onChange={(e) => setCountry(e.target.value)}>
          {geo.countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      {levels !== 'country' && (
        <Field label="Ville" error={errors.cityId}>
          <select className={inputCls} value={value.cityId} onChange={(e) => setCity(e.target.value)} disabled={!cities.length}>
            {cities.length ? cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>) : <option value="">Aucune ville dans ce pays</option>}
          </select>
        </Field>
      )}
      {levels === 'zone' && (
        <Field label="Zone" error={errors.zoneId}>
          <select className={inputCls} value={value.zoneId} onChange={(e) => onChange({ ...value, zoneId: e.target.value })} disabled={!zones.length}>
            {zones.length ? zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>) : <option value="">Aucune zone dans cette ville</option>}
          </select>
        </Field>
      )}
    </>
  );
}
