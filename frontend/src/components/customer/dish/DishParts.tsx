/** Morceaux de la page du plat : pastilles, lien vers le point de vente (sans emplacement), autres plats. */
import { ChevronRight, Store } from 'lucide-react';
import Link from 'next/link';
import type { DishCard, DishPage } from '@/lib/api';
import { OpenText, Price, Tag } from '@/components/ui/Badges';
import { DishImage } from '@/components/ui/DishImage';
import { daysAgoLabel, formatDistance } from '@/shared/format';
import { MEAL_MOMENT_LABEL, POS_TYPE_LABEL } from '@/shared/enums';
import { paymentsText } from '@/components/customer/pos/PosInfo';

export function DishTags({ data, now }: { data: DishPage; now: Date }) {
  const checked = daysAgoLabel(data.pricesCheckedAt, now);
  return (
    <div className="flex flex-wrap gap-1.5">
      {data.dish.isSpecial && <Tag tone="piment">Plat du jour</Tag>}
      {data.dish.moment !== 'ALL_DAY' && <Tag>{MEAL_MOMENT_LABEL[data.dish.moment]}</Tag>}
      {checked && <Tag tone="ok">Prix vérifié {checked}</Tag>}
    </div>
  );
}

export function ServiceTags({ pos }: { pos: DishPage['pos'] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {pos.servesOnSite && <Tag>Sur place</Tag>}
      {pos.servesTakeaway && <Tag>À emporter</Tag>}
      {pos.delivers && <Tag>Livraison</Tag>}
      {paymentsText(pos) && <Tag>{paymentsText(pos)}</Tag>}
    </div>
  );
}

/** Nom, type, distance et ouverture du point de vente — jamais d'adresse ni de carte sur cette page. */
export function DishPosLink({ pos, variant }: { pos: DishPage['pos']; variant: 'mobile' | 'desktop' }) {
  const dist = formatDistance(pos.distanceM);
  return (
    <Link href={`/p/${pos.slug}`}
      className={`flex items-center gap-3 border border-trait bg-white text-charbon no-underline ${variant === 'desktop' ? 'rounded-card px-4 py-3.5' : 'rounded-2xl p-3'}`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-piment-soft text-piment"><Store size={20} /></span>
      <span className="min-w-0 flex-1">
        <b className="block text-[15px]">{pos.name}</b>
        <span className="text-xs text-ardoise lg:text-[13px]">{POS_TYPE_LABEL[pos.type]}{dist && ` · ${dist}`} · </span>
        <span className="text-xs lg:text-[13px]"><OpenText status={pos.openStatus} /></span>
      </span>
      {variant === 'desktop'
        ? <span className="whitespace-nowrap text-[13px] font-bold text-piment">Voir le point de vente →</span>
        : <ChevronRight size={20} className="text-ardoise" />}
    </Link>
  );
}

export function OtherDishes({ posSlug, dishes, variant }: { posSlug: string; dishes: DishCard[]; variant: 'mobile' | 'desktop' }) {
  if (!dishes.length) return null;
  if (variant === 'mobile') {
    return (
      <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5">
        {dishes.map((d) => (
          <Link key={d.id} href={`/p/${posSlug}/dish/${d.slug}`}
            className={`w-[150px] shrink-0 overflow-hidden rounded-2xl border border-trait bg-white text-charbon no-underline ${d.isSoldOut ? 'opacity-60' : ''}`}>
            <span className="block h-[90px]"><DishImage imageUrl={d.imageUrl} illustrationKey={d.illustrationKey} alt="" /></span>
            <span className="flex flex-col gap-0.5 px-2.5 py-2">
              <b className="text-[13px] leading-snug">{d.name}</b>
              <Price xof={d.priceXof} className="text-[13px]" />
              {d.isSoldOut && <span className="text-[11px] text-erreur">Épuisé aujourd’hui</span>}
            </span>
          </Link>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
      {dishes.map((d) => (
        <Link key={d.id} href={`/p/${posSlug}/dish/${d.slug}`}
          className={`overflow-hidden rounded-2xl border border-trait bg-white text-charbon no-underline ${d.isSoldOut ? 'opacity-60' : ''}`}>
          <span className="block h-[120px]"><DishImage imageUrl={d.imageUrl} illustrationKey={d.illustrationKey} alt="" /></span>
          <span className="flex items-baseline justify-between gap-2 px-3.5 py-3"><b className="text-sm">{d.name}</b><Price xof={d.priceXof} /></span>
          {d.isSoldOut && <span className="block px-3.5 pb-3 text-xs font-semibold text-erreur">Épuisé aujourd’hui</span>}
        </Link>
      ))}
    </div>
  );
}
