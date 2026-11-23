import type { Metadata } from 'next';
import { SearchScreen } from '@/components/customer/home/SearchScreen';
import { ClientShell } from '@/components/customer/layout/ClientShell';
import { search } from '@/lib/api';
import { readViewer } from '@/lib/viewer-server';

export const metadata: Metadata = { title: 'Recherche' };

/** Recherche : premiers résultats calculés sur le serveur. */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const { prefs, point } = await readViewer();
  const initial = q && prefs.zoneId
    ? await search({ q, zoneId: prefs.zoneId, lat: point?.lat, lng: point?.lng, budgetMin: prefs.budgetMin, budgetMax: prefs.budgetMax, openNow: prefs.openNow, limit: 24 }).catch(() => undefined)
    : undefined;
  return (
    <ClientShell>
      <SearchScreen key={q} q={q} initial={initial} />
    </ClientShell>
  );
}
