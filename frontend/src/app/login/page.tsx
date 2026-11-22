import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginScreen } from '@/components/customer/auth/LoginScreen';

export const metadata: Metadata = { title: 'Connexion' };

/** Écran 12 (mobile) et D4 (desktop). L'inscription avant contact reste une feuille modale (écran 3 / D5). */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  );
}
