'use client';

/**
 * Menu du jour : une ligne par plat (lien vers la page du plat) + bouton « Commander » lié au plat.
 * Un plat épuisé reste affiché « Épuisé aujourd'hui », sans bouton.
 */
import type { ContactSource } from '@/shared/enums';
import Link from 'next/link';
import type { DishCard, PosPage } from '@/lib/api';
import { useContact } from '@/components/customer/contact/useContact';
import { WhatsAppIcon } from '@/components/customer/contact/icons';
import { Price } from '@/components/ui/Badges';
import { DishImage } from '@/components/ui/DishImage';

function MenuRow({ dish, pos, onOrder }: { dish: DishCard; pos: PosPage['pos']; onOrder: (d: DishCard) => void }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-trait bg-surface p-2 ${dish.isSoldOut ? 'opacity-60' : ''}`}>
      <Link href={`/p/${pos.slug}/dish/${dish.slug}`} className="flex min-w-0 flex-1 items-center gap-3 text-charbon no-underline">
        <span className="block h-14 w-14 shrink-0 overflow-hidden rounded-xl">
          <DishImage imageUrl={dish.imageUrl} illustrationKey={dish.illustrationKey} alt="" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <b className="text-sm leading-snug">{dish.name}</b>
          {dish.isSoldOut ? (
            <span className="text-xs font-semibold text-erreur">Épuisé aujourd’hui</span>
          ) : dish.isSpecial ? (
            <span className="text-xs font-semibold text-piment">Plat du jour</span>
          ) : null}
        </span>
        <Price xof={dish.priceXof} className="text-[15px]" />
      </Link>
      {dish.isSoldOut ? (
        <span className="w-11 shrink-0 lg:w-[132px]" />
      ) : (
        <button type="button" onClick={() => onOrder(dish)} aria-label={`Commander ${dish.name} sur WhatsApp`}
          className="flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-feuille-soft text-sm font-bold text-feuille-ink lg:w-auto lg:px-3.5">
          <WhatsAppIcon /> <span className="hidden lg:inline">Commander</span>
        </button>
      )}
    </div>
  );
}

export function MenuList({ pos, menu, source = 'POS_PAGE' }: { pos: PosPage['pos']; menu: DishCard[]; source?: ContactSource }) {
  const { contact, warningDialog } = useContact();
  const order = (d: DishCard) => contact({
    pos: { id: pos.id, name: pos.name, openState: pos.openStatus.state },
    dish: { id: d.id, name: d.name, priceXof: d.priceXof, illustrationKey: d.illustrationKey },
    channel: 'WHATSAPP', source,
  });
  if (!menu.length) {
    return <div className="rounded-card border border-trait bg-surface p-4 text-sm text-ardoise">Pas encore de plat publié aujourd’hui.</div>;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {menu.map((d) => <MenuRow key={d.id} dish={d} pos={pos} onOrder={order} />)}
      {warningDialog}
    </div>
  );
}
