import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ClientShell } from '@/components/customer/layout/ClientShell';
import { PosScreen } from '@/components/customer/pos/PosScreen';
import { getPos, isApiError } from '@/lib/api';
import { mockClock } from '@/lib/clock-server';
import { readViewer } from '@/lib/viewer-server';

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ src?: string }> };

async function load(slug: string, point?: { lat: number; lng: number } | null) {
  try {
    return await getPos(slug, point);
  } catch (e) {
    if (isApiError(e) && e.status === 404) notFound();
    throw e;
  }
}

/** Aperçu Open Graph (partage WhatsApp, 13.6). */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  const special = data.menu.find((d) => d.isSpecial);
  const description = special
    ? `Plat du jour : ${special.name} à ${special.priceXof} F. Menu, prix et horaires sur OKARE.`
    : `Menu, prix du jour et horaires de ${data.pos.name} sur OKARE.`;
  return {
    title: data.pos.name,
    description,
    openGraph: { title: data.pos.name, description, type: 'website', images: [`/plats/${special?.illustrationKey ?? 'riz'}.svg`] },
  };
}

/** Écran 2 (mobile) et D2 (desktop), rendu serveur. `?src=qr` : arrivée par le QR code (12.6). */
export default async function PosPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const { src } = await searchParams;
  const [{ point }, clock] = await Promise.all([readViewer(), mockClock()]);
  const data = await load(slug, point);
  return (
    <ClientShell bottomNav={false}>
      <PosScreen initial={data} source={src === 'qr' ? 'QR' : 'POS_PAGE'} nowIso={clock.toISOString()} />
    </ClientShell>
  );
}
