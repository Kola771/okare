import { DishFormScreen } from '@/components/seller/menu/DishForm';

/** Écran 8 : publier (`/menu/new`) ou modifier un plat. */
export default async function SellerDishPage({ params }: { params: Promise<{ posId: string; dishId: string }> }) {
  const { posId, dishId } = await params;
  return <DishFormScreen posId={posId} dishId={dishId === 'new' ? null : dishId} />;
}
