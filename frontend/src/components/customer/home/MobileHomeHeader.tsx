'use client';

/** En-tête de l'accueil mobile (écran 1) : logo, zone, question du moment, recherche, budget. */
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ZoneButton } from '@/components/customer/layout/ZonePicker';
import { Logo } from '@/components/ui/Logo';
import type { MealMoment } from '@/shared/enums';
import { BudgetChips } from './Filters';

export const momentQuestion = (m: MealMoment) =>
  m === 'BREAKFAST' ? 'Tu manges quoi ce matin ?' : m === 'DINNER' ? 'Tu manges quoi ce soir ?' : 'Tu manges quoi ce midi ?';

export function MobileHomeHeader({ moment }: { moment: MealMoment }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <div className="flex flex-col gap-3.5 border-b border-trait bg-white px-5 pb-3 pt-5 lg:hidden">
      <div className="flex items-center justify-between">
        <Logo size={28} />
        <ZoneButton />
      </div>
      <h1 className="m-0 font-display text-2xl font-semibold leading-tight">{momentQuestion(moment)}</h1>
      <form role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`); }}
        className="flex min-h-12 items-center gap-2.5 rounded-[14px] bg-argile px-3.5">
        <Search size={18} className="text-ardoise" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Plat, maquis, quartier…" aria-label="Rechercher"
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none" />
      </form>
      <div className="flex flex-col gap-2 md:hidden">
        <div className="text-[13px] font-semibold text-ardoise">Mon budget</div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto"><BudgetChips compact /></div>
      </div>
    </div>
  );
}
