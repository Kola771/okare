import { ReviewsManager } from '@/components/seller/manage/ReviewsManager';
import { ErrorState } from '@/components/ui/States';
import { getPosReviews } from '@/lib/api';
import { load } from '@/lib/api/server-page';

/** Avis du point : lecture et réponse. */
export default async function ReviewsPage({ params }: { params: Promise<{ posId: string }> }) {
  const { posId } = await params;
  const reviews = await load(getPosReviews(posId));
  if (!reviews.data) return <ErrorState message={reviews.error} />;
  return <ReviewsManager posId={posId} reviews={reviews.data} />;
}
