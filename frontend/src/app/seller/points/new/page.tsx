'use client';

import { CreatePosWizard } from '@/components/seller/create/CreatePosWizard';

/** Écran 17 (mobile) et VD7 (desktop). */
export default function SellerNewPosPage() {
  return <CreatePosWizard afterCreate={(id) => `/seller/points/${id}/menu`} />;
}
