'use client';

import { CreatePosWizard } from '@/components/seller/create/CreatePosWizard';

/** Écran 6 (terrain, mobile) et formulaire « Nouveau point de vente » de DB3 (desktop). */
export default function DashboardNewPosPage() {
  return <CreatePosWizard title="Nouveau point de vente (terrain)" back={['Points de vente', '/dashboard/points']} byTeam afterCreate={(id) => `/dashboard/points/${id}?tab=menu`} />;
}
