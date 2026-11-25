import type { Metadata } from 'next';
import { AccountScreen } from '@/components/customer/account/AccountScreen';
import { ClientShell } from '@/components/customer/layout/ClientShell';

export const metadata: Metadata = { title: 'Mon compte', robots: { index: false } };

/** Écran 13 (mobile) et D7 (desktop). */
export default function AccountPage() {
  return (
    <ClientShell>
      <AccountScreen />
    </ClientShell>
  );
}
