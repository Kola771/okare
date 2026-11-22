'use client';

/**
 * Cartes de plats du fil (liées au plat : un toucher ouvre la page du plat).
 * - FeedCardFeatured / FeedRow : mobile (écran 1), sans bouton (on commande depuis la page du plat).
 * - FeedCard : tablette et desktop (D1), avec « Commander sur WhatsApp », appel et cœur.
 */
import { Heart, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import type { FeedItem } from '@/lib/api';
import { useContact } from '@/components/customer/contact/useContact';
import { WhatsAppIcon } from '@/components/customer/contact/icons';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { OpenBadge, OpenText, Price } from '@/components/ui/Badges';
import { DishImage } from '@/components/ui/DishImage';
import { POS_TYPE_LABEL, type ContactSource } from '@/shared/enums';
import { formatDistance } from '@/shared/format';

export const dishHref = (it: FeedItem) => `/p/${it.pos.slug}/dish/${it.dish.slug}`;

export function FeedCardFeatured({ item, priority = false }: { item: FeedItem; priority?: boolean }) {
  return (
    <Link href={dishHref(item)} className="flex flex-col overflow-hidden rounded-card border border-trait bg-white text-charbon no-underline">
      <span className="relative block h-[120px]">
        <DishImage imageUrl={item.dish.imageUrl} illustrationKey={item.dish.illustrationKey} alt={item.dish.name} priority={priority} />
      </span>
      <span className="flex flex-col gap-1.5 px-3.5 py-3">
        <span className="flex items-center justify-between gap-2">
          <b className="text-base">{item.dish.name}</b>
          <Price xof={item.dish.priceXof} className="text-base" />
        </span>
        <span className="flex flex-wrap items-center gap-x-2.5 text-[13px] text-ardoise">
          <span>{item.pos.name}</span>
          {item.pos.distanceM != null && <><span aria-hidden>·</span><span>{formatDistance(item.pos.distanceM)}</span></>}
          <span aria-hidden>·</span><OpenText status={item.pos.openStatus} />
        </span>
      </span>
    </Link>
  );
}

export function FeedRow({ item }: { item: FeedItem }) {
  return (
    <Link href={dishHref(item)} className="flex overflow-hidden rounded-card border border-trait bg-white text-charbon no-underline">
      <span className="relative block w-[104px] shrink-0">
        <DishImage imageUrl={item.dish.imageUrl} illustrationKey={item.dish.illustrationKey} alt={item.dish.name} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 px-3.5 py-3">
        <b className="text-[15px]">{item.dish.name}</b>
        <span className="text-[13px] text-ardoise">
          {item.pos.name}{item.pos.distanceM != null && ` · ${formatDistance(item.pos.distanceM)}`} · <OpenText status={item.pos.openStatus} short />
        </span>
        <Price xof={item.dish.priceXof} className="text-[15px]" />
      </span>
    </Link>
  );
}

interface CardProps {
  item: FeedItem;
  selected?: boolean;
  onHover?: (posId: string | null) => void;
  priority?: boolean;
  source?: ContactSource;
}

export function FeedCard({ item, selected = false, onHover, priority = false, source = 'HOME' }: CardProps) {
  const { contact, warningDialog } = useContact();
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(item.pos.id);
  const target = (channel: 'WHATSAPP' | 'CALL') => ({
    pos: { id: item.pos.id, name: item.pos.name, openState: item.pos.openStatus.state },
    dish: { id: item.dish.id, name: item.dish.name, priceXof: item.dish.priceXof, illustrationKey: item.dish.illustrationKey },
    channel, source,
  });
  return (
    <article onMouseEnter={() => onHover?.(item.pos.id)} onMouseLeave={() => onHover?.(null)}
      className={`flex flex-col overflow-hidden rounded-card bg-white ${selected
        ? 'border-2 border-piment shadow-[0_10px_28px_rgba(194,65,12,0.16)]' : 'border border-trait shadow-[0_1px_2px_rgba(28,25,23,0.04)]'}`}>
      <div className="relative h-[150px]">
        <Link href={dishHref(item)} className="block h-full" tabIndex={-1} aria-hidden>
          <DishImage imageUrl={item.dish.imageUrl} illustrationKey={item.dish.illustrationKey} alt="" priority={priority} />
        </Link>
        <span className="absolute bottom-3 left-3"><OpenBadge status={item.pos.openStatus} /></span>
        <button type="button" onClick={() => toggle(item.pos.id, item.pos.name)} aria-pressed={fav}
          aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="absolute right-2.5 top-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-piment shadow">
          <Heart size={18} className={fav ? 'fill-piment' : ''} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-3.5">
        <div className="flex items-baseline justify-between gap-2.5">
          <Link href={dishHref(item)} className="text-base font-bold text-charbon no-underline hover:underline">{item.dish.name}</Link>
          <Price xof={item.dish.priceXof} className="text-lg" />
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-ardoise">
          <b className="font-semibold text-charbon">{item.pos.name}</b><span aria-hidden>·</span>{POS_TYPE_LABEL[item.pos.type]}
          {item.pos.distanceM != null && <><span aria-hidden>·</span><MapPin size={13} />{formatDistance(item.pos.distanceM)}</>}
        </div>
        <div className="mt-auto flex gap-2">
          <button type="button" onClick={() => contact(target('WHATSAPP'))}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-feuille text-sm font-bold text-white">
            <WhatsAppIcon /> Commander sur WhatsApp
          </button>
          <button type="button" onClick={() => contact(target('CALL'))} aria-label={`Appeler pour ${item.dish.name}`}
            className="flex min-h-11 w-11 items-center justify-center rounded-xl border border-trait text-charbon">
            <Phone size={18} />
          </button>
        </div>
      </div>
      {warningDialog}
    </article>
  );
}
