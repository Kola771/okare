'use client';

/** Filtres de l'accueil : budget, moment du repas, catégories de plats en pastilles, ouvert maintenant. */
import { Clock } from 'lucide-react';
import { useMemo } from 'react';
import { useViewer } from '@/components/providers/ViewerProvider';
import { Chip } from '@/components/ui/Chip';
import { DishImage } from '@/components/ui/DishImage';
import { BUDGET_STEPS } from '@/shared/business-rules';
import type { MealMoment } from '@/shared/enums';
import type { DishCategory } from '@/shared/types';

const budgetLabel = (b: number | null, compact: boolean) =>
  b == null ? (compact ? '+' : 'Tout') : `≤ ${new Intl.NumberFormat('fr-FR').format(b).replace(/ /g, ' ')}${compact ? '' : ' F'}`;

export function BudgetChips({ compact = false, variant = 'piment' }: { compact?: boolean; variant?: 'piment' | 'dark' }) {
  const { budgetMin, budgetMax, setBudget } = useViewer();
  const isRange = budgetMin != null;
  return (
    <>
      {BUDGET_STEPS.map((b) => (
        <Chip key={String(b)} active={!isRange && budgetMax === b} variant={variant} onClick={() => setBudget(b)}
          aria-label={b == null ? 'Tous les budgets' : `Budget jusqu'à ${b} francs`}>
          {budgetLabel(b, compact)}
        </Chip>
      ))}
    </>
  );
}

export function OpenNowChip({ variant = 'dark' }: { variant?: 'piment' | 'dark' }) {
  const { openNow, setOpenNow } = useViewer();
  return (
    <Chip active={openNow} variant={variant} onClick={() => setOpenNow(!openNow)}>
      <Clock size={15} /> Ouvert maintenant
    </Chip>
  );
}

const MOMENTS: [Exclude<MealMoment, 'ALL_DAY'>, string][] = [['BREAKFAST', 'Petit-déj'], ['LUNCH', 'Déjeuner'], ['DINNER', 'Dîner']];

export function MomentTabs({ value, onChange }: { value: MealMoment; onChange: (m: MealMoment) => void }) {
  return (
    <div role="tablist" aria-label="Moment du repas" className="flex rounded-[14px] border border-bordure-douce bg-white p-1">
      {MOMENTS.map(([m, label]) => (
        <button key={m} role="tab" aria-selected={value === m} type="button" onClick={() => onChange(m)}
          className={`min-h-[38px] rounded-[10px] px-3.5 text-[13px] font-semibold ${value === m ? 'bg-piment text-white' : 'text-charbon'}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

const CHIP_LABELS: Record<string, string> = {
  riz: 'Riz', pate: 'Pâte', atassi: 'Atassi', igname: 'Igname pilée', spaghetti: 'Spaghetti', aloko: 'Aloko', attieke: 'Attiéké',
};

/** Pastilles rondes illustrées (D1) : une par dessin de plat ; un second clic désélectionne. */
export function CategoryChips({ value, onChange, categories }: { value?: string; onChange: (categoryId?: string) => void; categories: DishCategory[] }) {
  const cats = categories;
  const chips = useMemo(() => {
    const seen = new Map<string, DishCategory>();
    for (const c of cats) if (c.illustrationKey && !seen.has(c.illustrationKey)) seen.set(c.illustrationKey, c);
    return [...seen.entries()];
  }, [cats]);
  const selectedKey = cats.find((c) => c.id === value)?.illustrationKey;

  return (
    <div className="no-scrollbar -mx-1 flex min-h-24 gap-2.5 overflow-x-auto px-1 pb-1">
      {chips.map(([key, cat]) => {
        const on = selectedKey === key;
        return (
          <button key={key} type="button" aria-pressed={on} onClick={() => onChange(on ? undefined : cat.id)}
            className="flex min-w-[74px] flex-col items-center gap-1.5 text-charbon">
            <span className={`block h-16 w-16 overflow-hidden rounded-full ${on ? 'border-[3px] border-piment' : 'border border-trait'}`}>
              <DishImage illustrationKey={key} alt="" />
            </span>
            <span className={`text-[13px] ${on ? 'font-bold' : 'font-medium'}`}>{CHIP_LABELS[key] ?? cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
