'use client';

/**
 * Carte plein écran (écran 11, < 1024 px). Sur desktop, la carte est intégrée à l'accueil (D1) : on y redirige.
 * Basculer liste ↔ carte garde les filtres (budget, ouvert maintenant, moment).
 */
import { List, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { now } from '@/lib/api';
import { useViewer } from '@/components/providers/ViewerProvider';
import { useIsDesktop } from '@/components/ui/useMediaQuery';
import { MEAL_MOMENT_LABEL, type MealMoment } from '@/shared/enums';
import { formatPrice } from '@/shared/format';
import { momentOfDay } from '@/shared/time';
import { MapPanel } from './MapPanel';

const pill = (on: boolean) =>
  `min-h-[38px] shrink-0 rounded-full px-3.5 text-[13px] font-semibold ${on ? 'bg-piment text-white' : 'bg-white text-charbon shadow-[0_1px_3px_rgba(28,25,23,0.15)]'}`;

export function MapScreen() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const { zone, budgetMax, setBudget, openNow, setOpenNow } = useViewer();
  const [moment, setMoment] = useState<MealMoment>(() => momentOfDay(new Date()));
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const filters = useMemo(() => ({ moment }), [moment]);
  const nextMoment: Record<string, MealMoment> = { BREAKFAST: 'LUNCH', LUNCH: 'DINNER', DINNER: 'BREAKFAST' };

  useEffect(() => setMoment(momentOfDay(now())), []);
  useEffect(() => {
    if (isDesktop) router.replace('/');
  }, [isDesktop, router]);

  return (
    <div className="relative h-[calc(100dvh-76px)] w-full overflow-hidden bg-[#EEE9E0]">
      <MapPanel filters={filters} selectedId={selected} onSelect={setSelected} variant="mobile" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex flex-col gap-2.5 px-4 pt-[18px]">
        <div className="pointer-events-auto flex gap-2">
          <form role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`); }}
            className="flex min-h-12 flex-1 items-center gap-2 rounded-[14px] bg-white px-3 shadow-[0_1px_3px_rgba(28,25,23,0.15)]">
            <Search size={18} className="text-ardoise" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={zone ? `${zone.name}, Cotonou` : 'Rechercher'}
              aria-label="Rechercher un lieu ou un plat" className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-medium outline-none" />
          </form>
          <Link href="/" className="flex min-h-12 items-center gap-1.5 rounded-[14px] bg-white px-3.5 text-sm font-bold text-charbon no-underline shadow-[0_1px_3px_rgba(28,25,23,0.15)]">
            <List size={18} /> Liste
          </Link>
        </div>
        <div className="no-scrollbar pointer-events-auto flex gap-2 overflow-x-auto pb-1">
          <button type="button" className={pill(budgetMax != null)} onClick={() => setBudget(budgetMax == null ? 1000 : null)}>
            {budgetMax != null ? `≤ ${formatPrice(budgetMax)}` : 'Tous les budgets'}
          </button>
          <button type="button" aria-pressed={openNow} className={pill(openNow)} onClick={() => setOpenNow(!openNow)}>Ouvert maintenant</button>
          <button type="button" className={pill(false)} onClick={() => setMoment(nextMoment[moment] ?? 'LUNCH')}>
            {MEAL_MOMENT_LABEL[moment]}
          </button>
        </div>
      </div>
    </div>
  );
}
