'use client';

/**
 * Pagination des tableaux : « 1–10 sur 23 », lignes par page, boutons « Précédent » / « Suivant » et pages numérotées (avec « … ».
 * `usePaged` découpe la liste et revient à la page 1 quand la liste change (filtre, recherche).
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export const PAGE_SIZES = [10, 25, 50];

export function usePaged<T>(rows: T[], initialSize = 10) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(initialSize);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  useEffect(() => setPage(1), [rows.length, size]);
  const current = Math.min(page, pages);
  return {
    items: rows.slice((current - 1) * size, current * size),
    pager: { page: current, pages, total: rows.length, size, onPage: setPage, onSize: setSize },
  };
}

/** Numéros affichés : 1 … 4 5 6 … 12 */
function numbers(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const around = [page - 1, page, page + 1].filter((n) => n > 1 && n < pages);
  return [1, ...(around[0]! > 2 ? ['…' as const] : []), ...around, ...(around[around.length - 1]! < pages - 1 ? ['…' as const] : []), pages];
}

const nav = 'flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold disabled:opacity-35';

export function Pager({ page, pages, total, size, onPage, onSize, bordered = true }: {
  page: number; pages: number; total: number; size: number; onPage: (p: number) => void; onSize: (s: number) => void; bordered?: boolean;
}) {
  if (!total) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(total, page * size);
  return (
    <nav aria-label="Pagination" className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[13px] text-ardoise ${bordered ? 'border-t border-trait' : ''}`}>
      <div className="flex items-center gap-3">
        <span><b className="text-charbon">{from}–{to}</b> sur {total}</span>
        <label className="hidden items-center gap-2 sm:flex">Lignes par page
          <select value={size} onChange={(e) => onSize(Number(e.target.value))}
            className="h-9 rounded-lg border border-trait bg-surface px-2 text-[13px] font-semibold text-charbon">
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" className={`${nav} gap-1 border border-trait bg-surface pl-1.5 pr-3 text-charbon hover:bg-surface-inset`} disabled={page === 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={18} />Précédent</button>
        <span className="hidden items-center gap-1 sm:flex">
          {numbers(page, pages).map((n, i) => (n === '…'
            ? <span key={`e${i}`} className="px-1">…</span>
            : <button key={n} type="button" aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)}
                className={`${nav} ${n === page ? 'bg-inverse text-on-inverse' : 'text-charbon hover:bg-surface-inset'}`}>{n}</button>))}
        </span>
        <span className="px-2 font-semibold text-charbon sm:hidden">{page} / {pages}</span>
        <button type="button" className={`${nav} gap-1 border border-trait bg-surface pl-3 pr-1.5 text-charbon hover:bg-surface-inset`} disabled={page === pages} onClick={() => onPage(page + 1)}>
          Suivant<ChevronRight size={18} /></button>
      </div>
    </nav>
  );
}
