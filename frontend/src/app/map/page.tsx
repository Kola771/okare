import type { Metadata } from 'next';
import { ClientShell } from '@/components/customer/layout/ClientShell';
import { MapScreen } from '@/components/customer/map/MapScreen';

export const metadata: Metadata = {
  title: 'Carte',
  description: 'Trouve les maquis et restaurants ouverts près de toi sur la carte OKARE.',
};

/** Écran 11 (carte client). */
export default function MapPage() {
  return (
    <ClientShell>
      {/* Tuiles de la carte : connexion ouverte à l'avance (affichage plus rapide de la carte). */}
      <link rel="preconnect" href="https://a.tile.openstreetmap.org" crossOrigin="" />
      <MapScreen />
    </ClientShell>
  );
}
