'use client';

/** Un favori avec son plat du jour et son statut d'ouverture : ligne mobile (écran 14), carte desktop (D3). */
import { Heart, Phone } from 'lucide-react';
import Link from 'next/link';
import type { FavoriteToday } from '@/lib/api';
import { useContact } from '@/components/customer/contact/useContact';
import { WhatsAppIcon } from '@/components/customer/contact/icons';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { OpenBadge, OpenText, Price } from '@/components/ui/Badges';
import { DishImage } from '@/components/ui/DishImage';
import { formatDistance } from '@/shared/format';
import { isOpenNow } from '@/shared/open-status';

const hrefOf = (f: FavoriteToday) => (f.special ? `/p/${f.pos.slug}/dish/${f.special.slug}` : `/p/${f.pos.slug}`);
const where = (f: FavoriteToday) => [f.pos.neighborhoodName ?? f.pos.zoneName, formatDistance(f.pos.distanceM)].filter(Boolean).join(' · ');

export function FavoriteRow({ fav }: { fav: FavoriteToday }) {
  const closed = !isOpenNow(fav.pos.openStatus.state) && fav.pos.openStatus.state !== 'OPENS_LATER_TODAY';
  return (
    <Link href={hrefOf(fav)} className={`flex gap-3 rounded-card border border-trait bg-white p-3 text-charbon no-underline ${closed ? 'opacity-75' : ''}`}>
      <span className="block h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[14px]">
        <DishImage illustrationKey={fav.special?.illustrationKey} imageUrl={fav.special?.imageUrl} closed={!fav.special} alt="" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex justify-between gap-2"><b className="truncate text-[15px]">{fav.pos.name}</b>
          <span className="whitespace-nowrap text-xs"><OpenText status={fav.pos.openStatus} short /></span></span>
        <span className="text-[13px] text-encre">
          {fav.special ? <>Plat du jour : {fav.special.name} · <Price xof={fav.special.priceXof} /></> : 'Pas de plat du jour publié'}
        </span>
        <span className="text-xs text-ardoise">{where(fav)}</span>
      </span>
    </Link>
  );
}

export function FavoriteCard({ fav }: { fav: FavoriteToday }) {
  const { toggle } = useFavorites();
  const { contact, warningDialog } = useContact();
  const state = fav.pos.openStatus.state;
  const target = (channel: 'WHATSAPP' | 'CALL') => ({
    pos: { id: fav.pos.id, name: fav.pos.name, openState: state },
    dish: fav.special ? { id: fav.special.id, name: fav.special.name, priceXof: fav.special.priceXof, illustrationKey: fav.special.illustrationKey } : null,
    channel, source: 'FAVORITES' as const,
  });
  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-trait bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <div className="relative h-[150px]">
        <Link href={hrefOf(fav)} tabIndex={-1} aria-hidden className="block h-full">
          <DishImage illustrationKey={fav.special?.illustrationKey} imageUrl={fav.special?.imageUrl} closed={!fav.special} alt="" />
        </Link>
        <span className="absolute bottom-3 left-3"><OpenBadge status={fav.pos.openStatus} short /></span>
        <button type="button" aria-label="Retirer des favoris" onClick={() => toggle(fav.pos.id, fav.pos.name)}
          className="absolute right-2.5 top-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-piment shadow">
          <Heart size={18} className="fill-piment" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-3.5">
        <div className="flex items-baseline justify-between gap-2.5">
          <Link href={hrefOf(fav)} className="text-base font-bold text-charbon no-underline">{fav.special?.name ?? 'Pas de plat du jour'}</Link>
          {fav.special ? <Price xof={fav.special.priceXof} className="text-lg" /> : <span className="text-ardoise">—</span>}
        </div>
        <div className="text-[13px] text-ardoise"><b className="font-semibold text-charbon">{fav.pos.name}</b> · {where(fav)}</div>
        <div className="mt-auto flex gap-2">
          {fav.special && !fav.special.isSoldOut ? (
            <button type="button" onClick={() => contact(target('WHATSAPP'))}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-feuille text-sm font-bold text-white">
              <WhatsAppIcon /> Commander
            </button>
          ) : (
            <Link href={`/p/${fav.pos.slug}`} className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-argile text-sm font-bold text-charbon no-underline">
              Voir le menu
            </Link>
          )}
          {/* Boutons liés au plat seulement : sans plat du jour, on passe par la page du point de vente (9.1). */}
          {fav.special && !fav.special.isSoldOut && (
            <button type="button" aria-label={`Appeler pour ${fav.special.name}`} onClick={() => contact(target('CALL'))}
              className="flex min-h-11 w-11 items-center justify-center rounded-xl border border-trait"><Phone size={18} /></button>
          )}
        </div>
      </div>
      {warningDialog}
    </article>
  );
}
