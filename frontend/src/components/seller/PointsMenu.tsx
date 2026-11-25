'use client';

/**
 * « Tous mes points ▾ » (en-tête vendeur) : liste des points de vente du vendeur. Choisir un point ouvre sa Gestion
 * (/seller/points/{id}) ; « Tous mes points » ouvre la liste. Le bouton affiche le point dans lequel on se trouve.
 */
import { Check, ChevronDown, Store } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export interface MenuPoint { id: string; name: string; zone: string }

export function PointsMenu({ points }: { points: MenuPoint[] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const selected = points.find((p) => path === `/seller/points/${p.id}` || path.startsWith(`/seller/points/${p.id}/`));

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  useEffect(() => setOpen(false), [path]);

  const item = 'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-charbon no-underline hover:bg-argile';

  return (
    <div ref={box} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}
        className="flex min-h-11 max-w-[240px] items-center gap-2 rounded-xl border border-trait bg-surface px-3.5 text-sm font-semibold text-charbon">
        <Store size={16} className="shrink-0 text-ardoise" /><span className="truncate">{selected?.name ?? 'Tous mes points'}</span><ChevronDown size={16} className="shrink-0" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-[600] flex w-[300px] flex-col gap-0.5 rounded-2xl border border-trait bg-surface p-2 shadow-[0_16px_40px_-12px_rgba(28,25,23,0.3)]">
          <Link role="menuitem" href="/seller/points" className={`${item} font-semibold`}>
            <span className="flex-1">Tous mes points</span>{!selected && <Check size={16} className="text-piment" />}</Link>
          <div className="mx-2 my-1 h-px bg-trait" />
          {points.map((p) => (
            <Link key={p.id} role="menuitem" href={`/seller/points/${p.id}`} className={item}>
              <span className="min-w-0 flex-1"><b className="block truncate font-semibold">{p.name}</b><span className="text-xs text-ardoise">{p.zone}</span></span>
              {selected?.id === p.id && <Check size={16} className="text-piment" />}
            </Link>))}
        </div>
      )}
    </div>
  );
}
