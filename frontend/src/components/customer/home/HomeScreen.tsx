'use client';

/**
 * Accueil — écran 1 (mobile) et D1 (desktop : liste 58 % à gauche, carte à droite, synchronisées au survol).
 */
import { useMemo, useState } from 'react';
import { MapPanel } from '@/components/customer/map/MapPanel';
import { useViewer } from '@/components/providers/ViewerProvider';
import { useIsDesktop } from '@/components/ui/useMediaQuery';
import type { FeedPage } from '@/lib/api';
import type { MealMoment } from '@/shared/enums';
import type { DishCategory } from '@/shared/types';
import { BudgetChips, CategoryChips, MomentTabs, OpenNowChip } from './Filters';
import { FeedList } from './FeedList';
import { MobileHomeHeader, momentQuestion } from './MobileHomeHeader';
import { useFeed } from './useFeed';

const WEEKDAYS = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const MOMENT_UPPER: Record<string, string> = { BREAKFAST: 'PETIT-DÉJEUNER', LUNCH: 'DÉJEUNER', DINNER: 'DÎNER' };

interface Props {
  /** Première page, moment et jour calculés par le serveur (spec 0ter.9). */
  initialFeed: FeedPage;
  initialMoment: MealMoment;
  weekday: number;
  categories: DishCategory[];
}

export function HomeScreen({ initialFeed, initialMoment, weekday, categories }: Props) {
  const { zone } = useViewer();
  const isDesktop = useIsDesktop();
  const [moment, setMoment] = useState<MealMoment>(initialMoment);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [hovered, setHovered] = useState<string | null>(null);
  const filters = useMemo(() => ({ moment, categoryId }), [moment, categoryId]);
  const feed = useFeed(filters, 12, initialFeed);

  return (
    <>
      <MobileHomeHeader moment={moment} />
      <div className="flex flex-1 lg:h-[calc(100dvh-71px)] lg:overflow-hidden">
        <main className="flex w-full min-w-0 flex-col gap-3.5 px-5 pb-6 pt-4 md:gap-5 md:px-8 lg:w-[58%] lg:max-w-[58%] lg:shrink-0 lg:overflow-y-auto lg:pt-[26px]">
          <div className="hidden flex-wrap items-end justify-between gap-4 lg:flex">
            <div>
              <div className="text-[13px] font-bold tracking-[0.5px] text-piment">
                {WEEKDAYS[weekday % 7]} · {MOMENT_UPPER[moment]}
              </div>
              <h1 className="m-0 mt-1 font-display text-4xl font-extrabold leading-tight">{momentQuestion(moment)}</h1>
              <div className="mt-1.5 text-[15px] text-ardoise">
                {feed.loading ? 'Recherche des points ouverts…' : `${feed.total} point${feed.total > 1 ? 's' : ''} autour de ${zone?.name ?? 'toi'}, avec leurs prix du jour.`}
              </div>
            </div>
            <MomentTabs value={moment} onChange={setMoment} />
          </div>
          <div className="hidden md:block"><CategoryChips value={categoryId} onChange={setCategoryId} categories={categories} /></div>
          <div className="hidden flex-wrap items-center gap-2 rounded-2xl border border-trait bg-white/85 px-3 py-2.5 md:flex">
            <span className="mx-1 text-[13px] font-bold text-ardoise">Budget</span>
            <BudgetChips variant="dark" />
            <span className="mx-1 h-[26px] w-px bg-trait" />
            <OpenNowChip />
          </div>
          <div className="flex items-baseline justify-between">
            <h2 className="m-0 font-display text-[19px] font-semibold md:font-sans md:text-xl md:font-extrabold">Plats du jour près de toi</h2>
            {!feed.loading && !feed.error && <span className="text-[13px] text-ardoise">{feed.total} résultat{feed.total > 1 ? 's' : ''}</span>}
          </div>
          <FeedList feed={feed} hoveredId={hovered} onHover={setHovered} withFavorites />
        </main>
        {isDesktop && (
          <section aria-label="Carte des points de vente" className="min-w-0 flex-1 border-l border-trait">
            <MapPanel filters={filters} selectedId={hovered} onSelect={setHovered} variant="desktop" />
          </section>
        )}
      </div>
    </>
  );
}
