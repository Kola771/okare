import { CoverPhotoCard } from '@/components/seller/manage/CoverPhotoCard';
import { InfoForm } from '@/components/seller/manage/InfoForm';
import { ErrorState } from '@/components/ui/States';
import { getPosInfo, getVendorMe } from '@/lib/api';
import { load } from '@/lib/api/server-page';

/** Informations du point. */
export default async function InfoPage({ params }: { params: Promise<{ posId: string }> }) {
  const { posId } = await params;
  const [info, home] = await Promise.all([load(getPosInfo(posId)), load(getVendorMe())]);
  if (!info.data) return <ErrorState message={info.error} />;
  return (
    <>
      <CoverPhotoCard posId={posId} />
      <InfoForm posId={posId} initial={info.data} canBeParticulier={(home.data?.points.length ?? 1) <= 1} />
    </>
  );
}
