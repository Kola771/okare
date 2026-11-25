import type { Metadata } from 'next';
import { ClaimScreen } from '@/components/customer/account/ClaimScreen';
import { ClientShell } from '@/components/customer/layout/ClientShell';

export const metadata: Metadata = { title: 'Je suis vendeur', robots: { index: false } };

/** Rattacher sa fiche vendeur à son compte (section 14). */
export default function AccountClaimPage() {
  return (
    <ClientShell>
      <ClaimScreen />
    </ClientShell>
  );
}
