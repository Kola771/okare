'use client';

/**
 * Pays, villes et quartiers : la géographie qui sert à découper les zones (DB5).
 * Choisir un pays → ses villes ; choisir une ville → ses quartiers, rangés par zone.
 */
import { useState } from 'react';
import type { Geography } from '@/lib/api';
import { PageHead } from '@/components/admin/AdminParts';
import { Crumbs } from '@/components/admin/Card';
import { CitiesCard, CountriesCard } from './CountriesCities';
import { NeighborhoodsCard } from './NeighborhoodsCard';

export function GeographyScreen({ geo }: { geo: Geography }) {
  const [countryId, setCountryId] = useState(geo.countries[0]?.id ?? '');
  const cities = geo.cities.filter((c) => c.countryId === countryId);
  const [cityId, setCityId] = useState(cities[0]?.id ?? '');
  const city = cities.find((c) => c.id === cityId) ?? cities[0];

  return (
    <>
      <div className="flex flex-col gap-2">
        <Crumbs items={['Administration', ['Zones et carte', '/dashboard/zones'], 'Pays, villes et quartiers']} />
        <PageHead title="Pays, villes et quartiers"
          sub="Chaque quartier appartient à une zone. Les clients cherchent par quartier ; les zones servent aux pubs et aux agents." />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <CountriesCard countries={geo.countries} cities={geo.cities} selected={countryId}
          onSelect={(id) => { setCountryId(id); setCityId(geo.cities.find((c) => c.countryId === id)?.id ?? ''); }} />
        <CitiesCard countryId={countryId} countries={geo.countries} cities={cities} selected={city?.id ?? ''} onSelect={setCityId} />
      </div>
      {city ? <NeighborhoodsCard city={city} geo={geo} zones={geo.zones.filter((z) => z.cityId === city.id)}
        neighborhoods={geo.neighborhoods.filter((n) => n.cityId === city.id)} />
        : <p className="m-0 text-sm text-ardoise">Ajoute une ville pour gérer ses quartiers.</p>}
    </>
  );
}
