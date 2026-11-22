/**
 * Page du point de vente — écran 2 (mobile) et D2 (desktop). Seule page avec l'emplacement (carte, repère, itinéraire).
 * Composant serveur : données (distance comprise) calculées par le serveur avec la position du client.
 */
import type { PosPage } from '@/lib/api';
import { DishImage } from '@/components/ui/DishImage';
import type { ContactSource } from '@/shared/enums';
import { toLocal } from '@/shared/time';
import { BackButton, FavoriteButton, ShareButton } from './HeroActions';
import { HoursCard } from './HoursCard';
import { LocationCard } from './LocationCard';
import { MenuList } from './MenuList';
import { PosContact } from './PosContact';
import { PosInfo } from './PosInfo';
import { ReportLink } from './ReportSheet';
import { ReviewsBlock } from './ReviewsBlock';

/** Données et heure calculées par le serveur (distance avec la position du client) : aucun rechargement. */
export function PosScreen({ initial, source, nowIso }: { initial: PosPage; source: ContactSource; nowIso: string }) {
  const data = initial;
  const clock = new Date(nowIso);
  const { pos, menu } = data;
  const cover = menu.find((d) => d.isSpecial) ?? menu[0];


  const actions = (
    <div className="flex gap-2">
      <ShareButton title={pos.name} path={`/p/${pos.slug}`} />
      <FavoriteButton posId={pos.id} posName={pos.name} />
    </div>
  );

  return (
    <>
      <div className="relative h-[170px] shrink-0 lg:hidden">
        <DishImage illustrationKey={cover?.illustrationKey} imageUrl={pos.coverUrl ?? cover?.imageUrl} alt={`${pos.name}`} priority />
        <div className="absolute inset-x-4 top-3.5 flex justify-between"><BackButton />{actions}</div>
      </div>
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 px-5 pb-6 pt-4 lg:gap-[22px] lg:px-8 lg:pb-10 lg:pt-6">
        <div className="relative hidden h-[240px] overflow-hidden rounded-[22px] lg:block">
          <DishImage illustrationKey={cover?.illustrationKey} imageUrl={pos.coverUrl ?? cover?.imageUrl} alt={`${pos.name}`} priority />
          <div className="absolute right-4 top-4">{actions}</div>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-7">
          <main className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-[18px]">
            <PosInfo pos={pos} now={clock} />
            <div className="lg:hidden"><LocationCard pos={pos} variant="mobile" /></div>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="m-0 text-[17px] font-bold lg:text-[21px] lg:font-extrabold">Au menu aujourd’hui</h2>
              <span className="text-right text-xs text-ardoise lg:text-[13px]">
                <span className="lg:hidden">touche un plat pour le voir</span>
                <span className="hidden lg:inline">Clique sur un plat pour le voir, ou commande-le directement</span>
              </span>
            </div>
            <MenuList pos={pos} menu={menu} source={source} />
            <div className="lg:hidden"><HoursCard hours={pos.openingHours} today={toLocal(clock).weekday} /></div>
            <ReviewsBlock slug={pos.slug} rating={pos.rating} initial={data.recentReviews} />
            <div className="flex lg:hidden"><ReportLink posId={pos.id} posName={pos.name} /></div>
          </main>
          <aside className="hidden w-[380px] shrink-0 flex-col gap-4 lg:sticky lg:top-6 lg:flex">
            <PosContact pos={pos} variant="card" source={source} />
            <LocationCard pos={pos} variant="desktop" />
            <HoursCard hours={pos.openingHours} today={toLocal(clock).weekday} />
            <ReportLink posId={pos.id} posName={pos.name} />
          </aside>
        </div>
      </div>
      <PosContact pos={pos} variant="bar" source={source} />
    </>
  );
}
