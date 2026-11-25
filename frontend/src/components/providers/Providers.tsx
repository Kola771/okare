'use client';

/**
 * Fournisseurs de l'application. Les fenêtres (inscription, suivi, démo) sont chargées à la demande
 * pour ne pas alourdir le JavaScript initial de chaque page (spec 0ter).
 */
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import type { Me, ZoneOption } from '@/lib/api';
import type { ViewerPrefs } from '@/lib/viewer';
import { FavoritesProvider } from './FavoritesProvider';
import { SessionProvider, useSession } from './SessionProvider';
import { ToastProvider } from './ToastProvider';
import { ViewerProvider } from './ViewerProvider';

const SignupSheet = dynamic(() => import('@/components/customer/auth/SignupSheet').then((m) => m.SignupSheet), { ssr: false });
const FollowUpGate = dynamic(() => import('@/components/customer/followup/FollowUpGate').then((m) => m.FollowUpGate), { ssr: false });
const DemoTrigger = dynamic(() => import('@/components/demo/DemoTrigger').then((m) => m.DemoTrigger), { ssr: false });
// `beforeinstallprompt` n'est émis qu'une fois par chargement, souvent avant que InstallPrompt (chargé à la demande)
// soit monté : on le garde dès le chargement du bundle principal pour pouvoir proposer l'installation plus tard.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as Window & { __okareInstallEvent?: Event }).__okareInstallEvent = e;
  });
}
const InstallPrompt = dynamic(() => import('./InstallPrompt').then((m) => m.InstallPrompt), { ssr: false });

function Overlays() {
  const { me, pendingIntent } = useSession();
  const [demo, setDemo] = useState(false);
  useEffect(() => setDemo(window.location.search.includes('demo=')), []);
  return (
    <>
      {pendingIntent && <SignupSheet />}
      {me && <FollowUpGate />}
      {demo && <DemoTrigger />}
      <InstallPrompt />
    </>
  );
}

export function Providers({ children, initialMe, viewer, zones }: {
  children: React.ReactNode; initialMe: Me | null; viewer: ViewerPrefs; zones: ZoneOption[];
}) {
  return (
    <ToastProvider>
      <SessionProvider initialMe={initialMe}>
        <ViewerProvider initialPrefs={viewer} zones={zones}>
          <FavoritesProvider>
            {children}
            <Overlays />
          </FavoritesProvider>
        </ViewerProvider>
      </SessionProvider>
    </ToastProvider>
  );
}
