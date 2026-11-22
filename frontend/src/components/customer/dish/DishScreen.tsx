/**
 * Page du plat — écran 22 (mobile) et D8 (desktop) : visuels, prix, description, point de vente (nom, distance,
 * ouvert ou non), autres plats du même point, boutons liés au plat. Pas d'emplacement ni de carte.
 */
import Link from 'next/link';
import type { DishPage } from '@/lib/api';
import { Price } from '@/components/ui/Badges';
import { BackButton, FavoriteButton, ShareButton } from '@/components/customer/pos/HeroActions';
import { DishGallery } from './DishGallery';
import { DishOrder } from './DishOrder';
import { DishPosLink, DishTags, OtherDishes, ServiceTags } from './DishParts';

/** Données et heure calculées par le serveur : aucun rechargement après l'affichage. */
export function DishScreen({ initial, nowIso }: { initial: DishPage; nowIso: string }) {
  const data = initial;
  const clock = new Date(nowIso);
  const { dish, pos } = data;
  const short = pos.name.split(' · ')[0];
  const path = `/p/${pos.slug}/dish/${dish.slug}`;


  return (
    <>
      {/* Mobile */}
      <div className="flex flex-1 flex-col lg:hidden">
        <DishGallery photos={dish.photos} illustrationKey={dish.illustrationKey} name={dish.name} variant="mobile"
          overlay={<div className="absolute inset-x-4 top-4 flex justify-between"><BackButton />
            <div className="flex gap-2"><ShareButton title={dish.name} path={path} />
              <FavoriteButton posId={pos.id} posName={short} label="Ajouter le point de vente aux favoris" /></div></div>} />
        <div className="relative -mt-[18px] flex flex-1 flex-col gap-3.5 rounded-t-[22px] bg-white px-5 pb-4 pt-[18px]">
          <DishTags data={data} now={clock} />
          <div className="flex items-start justify-between gap-3">
            <h1 className="m-0 font-display text-[25px] font-extrabold leading-tight">{dish.name}</h1>
            <Price xof={dish.priceXof} className="text-2xl" />
          </div>
          {dish.description && <p className="m-0 text-sm leading-relaxed text-encre">{dish.description}</p>}
          <DishPosLink pos={pos} variant="mobile" />
          <ServiceTags pos={pos} />
          {data.others.length > 0 && (
            <div className="flex items-baseline justify-between">
              <b className="text-base">Aussi chez {short}</b>
              <Link href={`/p/${pos.slug}`} className="text-[13px] font-bold">Tout le menu</Link>
            </div>
          )}
          <OtherDishes posSlug={pos.slug} dishes={data.others} variant="mobile" />
        </div>
        <DishOrder data={data} variant="bar" />
      </div>

      {/* Desktop */}
      <div className="mx-auto hidden w-full max-w-[1240px] flex-col gap-[22px] px-8 pb-10 pt-6 lg:flex">
        <nav aria-label="Fil d'Ariane" className="text-[13px] text-ardoise">
          <Link href="/">Accueil</Link> › <Link href={`/p/${pos.slug}`}>{pos.name}</Link> › {dish.name}
        </nav>
        <div className="flex items-start gap-7">
          <DishGallery photos={dish.photos} illustrationKey={dish.illustrationKey} name={dish.name} variant="desktop"
            overlay={<div className="absolute right-4 top-4"><FavoriteButton posId={pos.id} posName={short} label="Ajouter le point de vente aux favoris" /></div>} />
          <aside className="flex w-[420px] shrink-0 flex-col gap-4">
            <section className="flex flex-col gap-3.5 rounded-[22px] border border-trait bg-white p-6 shadow-[0_12px_30px_rgba(28,25,23,0.06)]">
              <DishTags data={data} now={clock} />
              <h1 className="m-0 font-display text-[32px] font-extrabold leading-tight">{dish.name}</h1>
              <Price xof={dish.priceXof} className="text-[32px]" />
              {dish.description && <p className="m-0 text-[15px] leading-relaxed text-encre">{dish.description}</p>}
              <ServiceTags pos={pos} />
              <DishOrder data={data} variant="card" />
            </section>
            <DishPosLink pos={pos} variant="desktop" />
          </aside>
        </div>
        {data.others.length > 0 && (
          <>
            <div className="flex items-baseline justify-between">
              <h2 className="m-0 text-[21px] font-extrabold">Aussi chez {short} aujourd’hui</h2>
              <Link href={`/p/${pos.slug}`} className="text-sm font-bold">Tout le menu</Link>
            </div>
            <OtherDishes posSlug={pos.slug} dishes={data.others} variant="desktop" />
          </>
        )}
      </div>
    </>
  );
}
