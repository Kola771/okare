'use client';

/**
 * Boutons liés au point de vente (« Écrire au vendeur », « Appeler ») — seulement sur cette page (9.1).
 * Mobile : barre fixée en bas ; desktop : carte « Contacter le vendeur » de la colonne de droite.
 */
import { Phone } from 'lucide-react';
import type { PosPage } from '@/lib/api';
import { useContact } from '@/components/customer/contact/useContact';
import { WhatsAppIcon } from '@/components/customer/contact/icons';
import type { ContactSource } from '@/shared/enums';

export function PosContact({ pos, variant, source = 'POS_PAGE' }: { pos: PosPage['pos']; variant: 'bar' | 'card'; source?: ContactSource }) {
  const { contact, busy, warningDialog } = useContact();
  const go = (channel: 'WHATSAPP' | 'CALL') =>
    contact({ pos: { id: pos.id, name: pos.name, openState: pos.openStatus.state }, channel, source });

  if (variant === 'card') {
    return (
      <section className="flex flex-col gap-3 rounded-[20px] border border-trait bg-surface p-5">
        <b className="text-[17px]">Contacter le vendeur</b>
        <p className="m-0 text-[13px] leading-normal text-ardoise">Pour une question ou plusieurs plats. Pour un seul plat, utilise son bouton dans le menu.</p>
        <button type="button" disabled={busy} onClick={() => go('WHATSAPP')}
          className="flex min-h-[52px] items-center justify-center gap-2.5 rounded-[14px] bg-charbon text-[15px] font-bold text-white">
          <WhatsAppIcon /> Écrire au vendeur
        </button>
        <button type="button" disabled={busy} onClick={() => go('CALL')}
          className="flex min-h-12 items-center justify-center gap-2.5 rounded-[14px] border border-bordure text-[15px] font-bold">
          <Phone size={18} /> Appeler
        </button>
        {warningDialog}
      </section>
    );
  }
  return (
    <div className="sticky bottom-0 z-[400] flex flex-col gap-1.5 border-t border-trait bg-surface px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-2.5 lg:hidden">
      <div className="text-xs text-ardoise">Une question, une commande de plusieurs plats ? Contacte le vendeur :</div>
      <div className="flex gap-2.5">
        <button type="button" disabled={busy} onClick={() => go('CALL')}
          className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-[14px] border border-bordure text-[15px] font-bold">
          <Phone size={18} /> Appeler
        </button>
        <button type="button" disabled={busy} onClick={() => go('WHATSAPP')}
          className="flex min-h-[50px] flex-[1.4] items-center justify-center gap-2 rounded-[14px] bg-charbon text-[15px] font-bold text-white">
          <WhatsAppIcon /> Écrire au vendeur
        </button>
      </div>
      {warningDialog}
    </div>
  );
}
