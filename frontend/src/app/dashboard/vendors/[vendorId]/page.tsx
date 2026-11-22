import { VendorDetail } from '@/components/dashboard/vendors/VendorsScreen';

/** Écran 9 « Un vendeur et ses points » (et détail de DB8). */
export default async function DashboardVendorPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  return <VendorDetail vendorId={vendorId} />;
}
