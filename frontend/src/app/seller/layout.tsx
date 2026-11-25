import type { Metadata } from 'next';
import { SellerShell } from '@/components/seller/SellerShell';
import { getVendorMe } from '@/lib/api';

export const metadata: Metadata = {
  title: { default: 'Espace vendeur', template: '%s · Espace vendeur OKARE' },
  robots: { index: false },
};

/** Les points du vendeur alimentent la liste « Tous mes points » de l'en-tête. */
export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const me = await getVendorMe().catch(() => null);
  const points = me?.points.map((p) => ({ id: p.id, name: p.name, zone: `${p.zoneName} · ${p.zoneCategory}` })) ?? [];
  return <SellerShell points={points}>{children}</SellerShell>;
}
