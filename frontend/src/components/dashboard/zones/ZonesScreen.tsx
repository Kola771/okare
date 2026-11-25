/**
 * Zones, tarifs et places — DB5 : carte des zones, tableau (catégorie, places par jour, points, statut), grille des prix des pubs.
 * Composant serveur ; parties interactives dans ZonesTable, NewZoneButton, PriceGridCard.
 */
import Link from 'next/link';
import type { AdminZoneRow, Geography, PriceGridRow } from '@/lib/api';
import { btn, PageHead } from '@/components/admin/AdminParts';
import { Card, Crumbs } from '@/components/admin/Card';
import { NewZoneButton } from './NewZoneButton';
import { PriceGridCard } from './PriceGridCard';
import { DrawZoneButton, ZonesMapLazy } from './ZoneClient';
import { ZonesTable } from './ZonesTable';

export function ZonesScreen({ zones, grid, geo, canEdit }: { zones: AdminZoneRow[]; grid: PriceGridRow[]; geo: Geography; canEdit: boolean }) {
  const city = geo.cities[0];
  const mapZones = zones.filter((z) => z.center && z.cityId === city?.id)
    .map((z) => ({ id: z.id, name: z.name, center: z.center!, category: z.category }));
  return (
    <>
      <div className="flex flex-col gap-2">
        <Crumbs items={['Administration', 'Zones et carte']} />
        <PageHead title="Zones, tarifs et places" sub="Dessine les zones, classe-les en catégorie A, B ou C, fixe les prix et le nombre de places par jour."
          actions={<>
            <Link href="/dashboard/geography" className={btn.secondary}>Pays, villes et quartiers</Link>
            {canEdit && <NewZoneButton geo={geo} />}
          </>} />
      </div>
      <div className="grid gap-5 items-start xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card title={`Carte des zones · ${city?.name ?? ''}`} right={canEdit ? <DrawZoneButton /> : undefined}>
          <div className="relative z-0 h-[306px] overflow-hidden rounded-xl bg-argile">
            <ZonesMapLazy zones={mapZones} center={mapZones[0]?.center} />
          </div>
        </Card>
        <Card title="Zones" flush >
          <ZonesTable zones={zones} canEdit={canEdit} />
        </Card>
      </div>
      <PriceGridCard rows={grid} canEdit={canEdit} />
    </>
  );
}
