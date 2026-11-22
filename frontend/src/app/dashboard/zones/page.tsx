import { ZonesScreen } from '@/components/dashboard/zones/ZonesScreen';
import { ErrorState } from '@/components/ui/States';
import { getGeography, getPriceGrid, listZonesAdmin } from '@/lib/api';
import { load } from '@/lib/api/server-page';

export const metadata = { title: 'Zones, tarifs et places' };

/** DB5 — rendu serveur. Accès libre en phase 1 : réglages modifiables. */
export default async function DashboardZonesPage() {
  const [zones, grid, geo] = await Promise.all([load(listZonesAdmin()), load(getPriceGrid()), load(getGeography())]);
  if (!zones.data || !grid.data || !geo.data) return <ErrorState message={zones.error ?? grid.error ?? geo.error ?? ''} />;
  return <ZonesScreen zones={zones.data} grid={grid.data} geo={geo.data} canEdit />;
}
