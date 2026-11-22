import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DishScreen } from '@/components/customer/dish/DishScreen';
import { ClientShell } from '@/components/customer/layout/ClientShell';
import { getDish, isApiError } from '@/lib/api';
import { mockClock } from '@/lib/clock-server';
import { readViewer } from '@/lib/viewer-server';

type Params = { params: Promise<{ slug: string; dishSlug: string }> };

async function load(slug: string, dishSlug: string, point?: { lat: number; lng: number } | null) {
  try {
    return await getDish(slug, dishSlug, point);
  } catch (e) {
    if (isApiError(e) && e.status === 404) notFound();
    throw e;
  }
}

/** Aperçu Open Graph : partager un plat amène un nouveau client (13.6). */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, dishSlug } = await params;
  const { dish, pos } = await load(slug, dishSlug);
  const title = `${dish.name} · ${dish.priceXof} F`;
  const description = `${dish.name} chez ${pos.name}, ${dish.priceXof} F. Commande directement sur WhatsApp avec OKARE.`;
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', images: [dish.photos[0] ?? `/plats/${dish.illustrationKey ?? 'riz'}.svg`] },
  };
}

/** Écran 22 (mobile) et D8 (desktop), rendu serveur. */
export default async function DishPageRoute({ params }: Params) {
  const { slug, dishSlug } = await params;
  const [{ point }, clock] = await Promise.all([readViewer(), mockClock()]);
  const data = await load(slug, dishSlug, point);
  return (
    <ClientShell bottomNav={false}>
      <DishScreen initial={data} nowIso={clock.toISOString()} />
    </ClientShell>
  );
}
