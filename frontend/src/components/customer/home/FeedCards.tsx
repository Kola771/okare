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
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 ${selected
        ? 'ring-2 ring-piment shadow-[0_10px_28px_rgba(194,65,12,0.16)]' : 'shadow-[0_2px_12px_rgba(28,25,23,0.07)] hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(28,25,23,0.13)]'}`}>
      {/* Image avec overlay gradient */}
      <Link href={dishHref(item)} className="relative block h-[190px] overflow-hidden" tabIndex={-1} aria-hidden>
        <span className="block h-full transition-transform duration-500 ease-out group-hover:scale-105">
          <DishImage imageUrl={item.dish.imageUrl} illustrationKey={item.dish.illustrationKey} alt="" priority={priority} />
        </span>
        <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {/* Prix sur l'image */}
        <span className="absolute bottom-3 right-3.5 rounded-lg bg-white/95 px-2.5 py-1 shadow-sm backdrop-blur-sm">
          <Price xof={item.dish.priceXof} className="text-[17px]" />
        </span>
        {/* Badge ouvert sur l'image */}
        <span className="absolute bottom-3 left-3.5"><OpenBadge status={item.pos.openStatus} /></span>
      </Link>
      {/* Coeur */}
      <button type="button" onClick={() => toggle(item.pos.id, item.pos.name)} aria-pressed={fav}
        aria-label={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-110 ${fav ? 'bg-piment text-white' : 'bg-white/80 text-piment'}`}>
        <Heart size={16} className={fav ? 'fill-white' : ''} />
      </button>
      {/* Contenu */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <Link href={dishHref(item)} className="line-clamp-1 text-[16px] font-bold text-charbon no-underline transition-colors group-hover:text-piment">{item.dish.name}</Link>
        <div className="mt-1 flex items-center gap-x-1.5 text-[13px] text-ardoise">
          <span className="truncate font-semibold text-encre">{item.pos.name}</span>
          <span aria-hidden className="text-bordure-douce">·</span>
          <span className="whitespace-nowrap">{POS_TYPE_LABEL[item.pos.type]}</span>
          {item.pos.distanceM != null && <>
            <span aria-hidden className="text-bordure-douce">·</span>
            <span className="inline-flex items-center gap-0.5 whitespace-nowrap"><MapPin size={12} />{formatDistance(item.pos.distanceM)}</span>
          </>}
        </div>
        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => contact(target('WHATSAPP'))} aria-label={`Commander ${item.dish.name} sur WhatsApp`}
            className="flex h-11 flex-1 items-center justify-center gap-2.5 rounded-xl bg-feuille text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(21,128,61,0.3)] transition-all hover:shadow-[0_4px_16px_rgba(21,128,61,0.4)] active:scale-[0.98]">
            <WhatsAppIcon size={18} /> Commander
          </button>
          <button type="button" onClick={() => contact(target('CALL'))} aria-label={`Appeler pour ${item.dish.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-trait text-ardoise transition-all hover:border-charbon hover:text-charbon active:scale-95">
            <Phone size={18} />
          </button>
        </div>
      </div>
      {warningDialog}
    </article>
  );
}
