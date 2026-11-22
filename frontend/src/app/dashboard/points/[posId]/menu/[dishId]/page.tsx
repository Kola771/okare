import { DishFormScreen } from '@/components/seller/menu/DishForm';

/** Plat d'un point de vente, depuis le dashboard (mêmes gestes que le vendeur). */
export default async function DashboardDishPage({ params }: { params: Promise<{ posId: string; dishId: string }> }) {
  const { posId, dishId } = await params;
  return <DishFormScreen posId={posId} dishId={dishId === 'new' ? null : dishId} back={`/dashboard/points/${posId}?tab=menu`} />;
}
