import { GeographyScreen } from '@/components/dashboard/geography/GeographyScreen';
import { ErrorState } from '@/components/ui/States';
import { getGeography } from '@/lib/api';
import { load } from '@/lib/api/server-page';

export const metadata = { title: 'Pays, villes et quartiers' };

/** Gestion des pays, villes et quartiers (rattachés aux zones de DB5) — rendu serveur. */
export default async function DashboardGeographyPage() {
  const geo = await load(getGeography());
  if (!geo.data) return <ErrorState message={geo.error ?? ''} />;
  return <GeographyScreen geo={geo.data} />;
}
