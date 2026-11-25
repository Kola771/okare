'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useViewer } from '@/components/providers/ViewerProvider';
import { Sheet } from '@/components/ui/Sheet';

const RANGE_FACTOR = 0.3;

function computeRange(amount: number): [number, number] {
  const min = Math.round(amount * (1 - RANGE_FACTOR) / 50) * 50;
  const max = Math.round(amount * (1 + RANGE_FACTOR) / 50) * 50;
  return [Math.max(0, min), max];
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n).replace(/ /g, ' ');

export function PriceFilterSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { budgetMin, budgetMax, setBudgetRange, setBudget } = useViewer();
  const isRange = budgetMin != null;
  const [amount, setAmount] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && isRange && budgetMin != null && budgetMax != null) {
      const mid = Math.round((budgetMin + budgetMax) / 2);
      setAmount(String(mid));
    } else if (open && !isRange) {
      setAmount('');
    }
  }, [open, isRange, budgetMin, budgetMax]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const parsed = amount.trim() ? parseInt(amount.replace(/\s/g, ''), 10) : NaN;
  const valid = !isNaN(parsed) && parsed >= 100;
  const range = valid ? computeRange(parsed) : null;

  const apply = useCallback(() => {
    if (!range) return;
    setBudgetRange(range[0], range[1]);
    onClose();
  }, [range, setBudgetRange, onClose]);

  const reset = useCallback(() => {
    setBudget(null);
    setAmount('');
    onClose();
  }, [setBudget, onClose]);

  return (
    <Sheet open={open} onClose={onClose} labelledBy="price-filter-title" maxWidth="lg:max-w-[420px]">
      <h2 id="price-filter-title" className="font-display text-[22px] font-bold text-charbon">Budget pr&eacute;cis</h2>
      <p className="text-[15px] text-ardoise">
        Entre un montant et on te montre les plats autour de ce prix (&plusmn;&nbsp;30&nbsp;%).
      </p>

      <div className="flex flex-col gap-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d\s]/g, ''))}
            onKeyDown={(e) => { if (e.key === 'Enter' && valid) apply(); }}
            placeholder="Ex : 5 000"
            aria-label="Montant en francs CFA"
            className="h-14 w-full rounded-field border border-bordure-douce bg-surface pl-4 pr-16 text-lg font-semibold text-charbon placeholder:text-pierre"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-ardoise">F CFA</span>
        </div>

        {range && (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-feuille-pale px-4 py-3">
            <SlidersHorizontal size={16} className="text-feuille" />
            <span className="text-[15px] font-semibold text-feuille-ink">
              {fmt(range[0])} F &mdash; {fmt(range[1])} F
            </span>
          </div>
        )}

        {!valid && amount.trim().length > 0 && (
          <p className="text-center text-[13px] text-piment">Entre un montant d&apos;au moins 100 F.</p>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={apply} disabled={!valid}
            className="flex h-12 flex-1 items-center justify-center rounded-btn bg-piment text-[15px] font-bold text-white transition-colors hover:bg-piment-dark disabled:opacity-40">
            Rechercher
          </button>
          {isRange && (
            <button type="button" onClick={reset}
              className="flex h-12 items-center justify-center rounded-btn border border-bordure px-5 text-[15px] font-bold text-charbon transition-colors hover:bg-argile">
              R&eacute;initialiser
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}

export function PriceFilterChip() {
  const { budgetMin, budgetMax } = useViewer();
  const [open, setOpen] = useState(false);
  const isRange = budgetMin != null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 font-semibold transition-colors min-h-[40px] text-sm ${isRange
          ? 'bg-piment text-white border-piment'
          : 'bg-surface text-charbon border-bordure-douce hover:border-ardoise'}`}>
        <SlidersHorizontal size={15} />
        {isRange ? `${fmt(budgetMin!)} – ${fmt(budgetMax!)} F` : 'Budget précis'}
      </button>
      <PriceFilterSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function PriceFilterChipCompact() {
  const { budgetMin, budgetMax } = useViewer();
  const [open, setOpen] = useState(false);
  const isRange = budgetMin != null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 font-semibold transition-colors min-h-[38px] text-[13px] ${isRange
          ? 'bg-piment text-white border-piment'
          : 'bg-surface text-charbon border-bordure-douce hover:border-ardoise'}`}>
        <SlidersHorizontal size={14} />
        {isRange ? `${fmt(budgetMin!)} – ${fmt(budgetMax!)}` : 'Précis'}
      </button>
      <PriceFilterSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
