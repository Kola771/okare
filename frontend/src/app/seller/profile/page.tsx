import { SellerProfile } from '@/components/seller/profile/SellerProfile';
import { ErrorState } from '@/components/ui/States';
import { getVendorMe } from '@/lib/api';
import { load } from '@/lib/api/server-page';

/** Écran 16 (mobile) et VD6 (desktop). */
export default async function SellerProfilePage() {
  const home = await load(getVendorMe());
  if (!home.data) return <ErrorState message={home.error} />;
  return <SellerProfile home={home.data} />;
}
