'use client';

/**
 * Boutons liés au plat : « Commander ce plat » (WhatsApp, message qui cite le plat) et « Appeler pour ce plat ».
 * Mobile : barre fixée en bas ; desktop : dans la carte de droite.
 */
import { Phone } from 'lucide-react';
import type { DishPage } from '@/lib/api';
import { useContact } from '@/components/customer/contact/useContact';
import { WhatsAppIcon } from '@/components/customer/contact/icons';
import { formatPrice } from '@/shared/format';

export function DishOrder({ data, variant }: { data: DishPage; variant: 'bar' | 'card' }) {
  const { contact, busy, warningDialog } = useContact();
  const { dish, pos } = data;
  const go = (channel: 'WHATSAPP' | 'CALL') => contact({
    pos: { id: pos.id, name: pos.name, openState: pos.openStatus.state },
    dish: { id: dish.id, name: dish.name, priceXof: dish.priceXof, illustrationKey: dish.illustrationKey },
    channel, source: 'DISH_PAGE',
  });
  const note = <div className="text-center text-xs text-ardoise">Le message dira au vendeur que tu veux « {dish.name} ».</div>;

  if (dish.isSoldOut) {
    const box = variant === 'bar'
      ? 'sticky bottom-0 z-[400] border-t border-trait bg-surface px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-2.5 lg:hidden'
      : '';
    return (
      <div className={box}>
        <div className="flex min-h-[54px] items-center justify-center rounded-btn bg-argile text-[15px] font-bold text-erreur">
          Épuisé aujourd’hui — reviens demain
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <>
        <button type="button" disabled={busy} onClick={() => go('WHATSAPP')}
          className="flex min-h-14 items-center justify-center gap-2.5 rounded-btn bg-feuille text-base font-bold text-white">
          <WhatsAppIcon size={20} /> Commander ce plat sur WhatsApp
        </button>
        <button type="button" disabled={busy} onClick={() => go('CALL')}
          className="flex min-h-[50px] items-center justify-center gap-2.5 rounded-[14px] border border-bordure text-[15px] font-bold">
          <Phone size={18} /> Appeler pour ce plat
        </button>
        {note}
        {warningDialog}
      </>
    );
  }
  return (
    <div className="sticky bottom-0 z-[400] flex flex-col gap-2 border-t border-trait bg-surface px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-2.5 lg:hidden">
      <div className="flex gap-2.5">
        <button type="button" disabled={busy} onClick={() => go('CALL')} aria-label="Appeler pour ce plat"
          className="flex min-h-[54px] w-[54px] items-center justify-center rounded-btn border border-bordure">
          <Phone size={20} />
        </button>
        <button type="button" disabled={busy} onClick={() => go('WHATSAPP')}
          className="flex min-h-[54px] flex-1 items-center justify-center gap-2.5 rounded-btn bg-feuille text-base font-bold text-white">
          <WhatsAppIcon size={20} /> Commander ce plat · {formatPrice(dish.priceXof)}
        </button>
      </div>
      {note}
      {warningDialog}
    </div>
  );
}
