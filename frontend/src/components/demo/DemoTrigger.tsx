'use client';

/**
 * Ouvre une fenêtre de démonstration depuis l'adresse (`?demo=signup|followup|followup-pos|zone`), pour la revue.
 * Contacts fictifs : 1 = bouton d'un plat (Chez Maman), 4 = bouton du point de vente (Le Palmier).
 */
import { useEffect, useState } from 'react';
import { ZonePicker } from '@/components/customer/layout/ZonePicker';
import { useSession } from '@/components/providers/SessionProvider';

const CONTACT = { followup: '0193a700-0000-7000-8000-000000000001', 'followup-pos': '0193a700-0000-7000-8000-000000000004' };

export function DemoTrigger() {
  const { requireAuth, me, loading } = useSession();
  const [zone, setZone] = useState(false);

  useEffect(() => {
    if (loading) return;
    const demo = new URLSearchParams(window.location.search).get('demo');
    if (!demo) return;
    if (demo === 'zone') setZone(true);
    if (demo === 'signup' && !me) {
      requireAuth({ title: 'Riz sauce arachide + poisson · 900 F', subtitle: 'Chez Maman · Ganhi', illustrationKey: 'riz', run: () => undefined });
    }
    if ((demo === 'followup' || demo === 'followup-pos') && me) {
      window.dispatchEvent(new CustomEvent('okare:followup', { detail: CONTACT[demo] }));
    }
  }, [loading, me, requireAuth]);

  return <ZonePicker open={zone} onClose={() => setZone(false)} />;
}
