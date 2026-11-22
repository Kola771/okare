import { Suspense } from 'react';
import { PointDetail } from '@/components/dashboard/points/PointDetail';

/** DB3 (desktop), DM3 (mobile) ; `?tab=menu` = DM5. */
export default async function DashboardPointPage({ params }: { params: Promise<{ posId: string }> }) {
  const { posId } = await params;
  return <Suspense><PointDetail posId={posId} /></Suspense>;
}
