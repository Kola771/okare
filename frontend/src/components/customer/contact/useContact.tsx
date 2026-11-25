'use client';

/**
 * Contact mesuré (9.1) : connexion requise (reprise après inscription), avertissement si le point est indiqué
 * fermé (12.4), enregistrement `POST /contacts`, puis ouverture de WhatsApp ou de l'appel.
 * Deux sortes de boutons à ne jamais mélanger : bouton d'un plat (`dish` fourni) ou bouton du point de vente.
 */
import { useCallback, useState } from 'react';
import { createContact, errorMessage } from '@/lib/api';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useViewer } from '@/components/providers/ViewerProvider';
import { Sheet } from '@/components/ui/Sheet';
import type { ContactChannel, ContactSource } from '@/shared/enums';
import { formatPrice } from '@/shared/format';
import { needsClosedWarning, type OpenState } from '@/shared/open-status';

export interface ContactTarget {
  pos: { id: string; name: string; openState: OpenState };
  dish?: { id: string; name: string; priceXof: number; illustrationKey: string | null } | null;
  channel: ContactChannel;
  source: ContactSource;
}

export function useContact() {
  const { requireAuth } = useSession();
  const { zoneId } = useViewer();
  const toast = useToast();
  const [warning, setWarning] = useState<ContactTarget | null>(null);
  const [busy, setBusy] = useState(false);

  const send = useCallback(async (t: ContactTarget) => {
    setBusy(true);
    try {
      const res = await createContact({
        posId: t.pos.id, channel: t.channel, source: t.source, button: t.dish ? 'DISH' : 'POS',
        dishId: t.dish?.id, viewerZoneId: zoneId ?? undefined,
      });
      if (res.url.startsWith('tel:')) window.location.href = res.url;
      else window.open(res.url, '_blank', 'noopener');
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }, [zoneId, toast]);

  const contact = useCallback((t: ContactTarget) => {
    requireAuth({
      title: t.dish ? `${t.dish.name} · ${formatPrice(t.dish.priceXof)}` : t.pos.name,
      subtitle: t.dish ? t.pos.name : 'Écrire au vendeur',
      illustrationKey: t.dish?.illustrationKey ?? null,
      run: () => {
        if (needsClosedWarning(t.pos.openState)) setWarning(t);
        else void send(t);
      },
    });
  }, [requireAuth, send]);

  const warningDialog = (
    <Sheet open={!!warning} onClose={() => setWarning(null)} labelledBy="closed-warning-title" maxWidth="lg:max-w-[420px]">
      <h2 id="closed-warning-title" className="m-0 font-display text-[22px] font-extrabold">Il est indiqué fermé aujourd’hui</h2>
      <p className="m-0 text-[15px] text-ardoise">{warning?.pos.name} n’ouvre peut-être pas aujourd’hui. Écrire quand même ?</p>
      <div className="flex gap-2.5">
        <button onClick={() => setWarning(null)} className="min-h-[50px] flex-1 rounded-[14px] border border-bordure font-bold">Annuler</button>
        <button
          onClick={() => { const t = warning; setWarning(null); if (t) void send(t); }}
          className="min-h-[50px] flex-1 rounded-[14px] bg-inverse font-bold text-on-inverse"
        >
          Écrire quand même
        </button>
      </div>
    </Sheet>
  );

  return { contact, busy, warningDialog };
}
