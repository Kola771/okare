'use client';

/** Ligne d'un plat dans le menu (écran 7, VD3) : gestes en un clic, effet immédiat (rien ne bloque, 12.3). */
import { EyeOff, Pencil, Star } from 'lucide-react';
import Link from 'next/link';
import type { DishAction, MenuDish } from '@/lib/api';
import { Pill } from '@/components/admin/AdminParts';
import { DishImage } from '@/components/ui/DishImage';
import { formatPrice, MOMENT_SHORT } from './labels';

export function DishRow({ dish, editHref, onAction, busy }: {
  dish: MenuDish; editHref: string; onAction: (a: DishAction) => void; busy: boolean;
}) {
  const hidden = dish.status === 'PENDING';
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border bg-surface p-3 sm:flex-row sm:items-center ${dish.isSpecial ? 'border-piment-pale' : 'border-trait'} ${hidden ? 'opacity-70' : ''}`}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="block h-14 w-14 shrink-0 overflow-hidden rounded-xl"><DishImage illustrationKey={dish.illustrationKey} alt="" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-[15px]">{dish.name}</b>
            {dish.isSpecial && <Pill tone="piment">PLAT DU JOUR</Pill>}
            {hidden && <Pill>Masqué</Pill>}
          </div>
          <div className="mt-0.5 text-[13px]">
            <b className="text-feuille">{formatPrice(dish.priceXof)}</b>
            <span className={dish.isSoldOut ? 'font-semibold text-erreur' : 'text-ardoise'}>
              {' · '}{dish.isSoldOut ? 'Épuisé pour aujourd’hui' : `Disponible · ${MOMENT_SHORT[dish.moment]}`}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" disabled={busy} onClick={() => onAction(dish.isSpecial ? 'special-off' : 'special-on')}
          aria-pressed={dish.isSpecial} className={`flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold ${dish.isSpecial ? 'bg-piment text-white' : 'bg-argile'}`}>
          <Star size={14} /> Du jour
        </button>
        <button type="button" disabled={busy} onClick={() => onAction(dish.isSoldOut ? 'back-in-stock' : 'sold-out')}
          className={`min-h-10 rounded-xl px-3 text-[13px] font-semibold ${dish.isSoldOut ? 'bg-feuille-soft text-feuille-ink' : 'bg-argile'}`}>
          {dish.isSoldOut ? 'Remettre dispo' : 'Épuisé'}
        </button>
        <button type="button" disabled={busy} onClick={() => onAction(hidden ? 'publish' : 'hold')} aria-label={hidden ? 'Remettre en ligne' : 'Masquer'}
          className="flex min-h-10 items-center gap-1.5 rounded-xl bg-argile px-3 text-[13px] font-semibold">
          <EyeOff size={14} /> {hidden ? 'Publier' : 'Masquer'}
        </button>
        <Link href={editHref} aria-label={`Modifier ${dish.name}`}
          className="flex min-h-10 items-center gap-1.5 rounded-xl border border-trait px-3 text-[13px] font-semibold text-charbon no-underline">
          <Pencil size={14} /> Modifier
        </Link>
      </div>
    </div>
  );
}
