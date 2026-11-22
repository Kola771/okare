'use client';

/** Éléments posés sur la carte : carte résumé du point touché, légende, « Me localiser ». */
import { LocateFixed } from 'lucide-react';
import Link from 'next/link';
import type { MapMarker } from '@/lib/api';
import { Price } from '@/components/ui/Badges';
import { DishImage } from '@/components/ui/DishImage';
import { formatDistance } from '@/shared/format';

/** Carte résumé (photo, plat, prix, distance, « Voir le plat »). */
export function MapSummary({ marker, statusText, className = '' }: { marker: MapMarker; statusText?: string; className?: string }) {
  return (
    <div className={`flex gap-3 rounded-[20px] bg-white p-3 shadow-[0_4px_16px_rgba(28,25,23,0.2)] ${className}`}>
      <span className="block h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[14px]">
        <DishImage illustrationKey={marker.illustrationKey} alt="" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <b className="truncate text-[15px]">{marker.posName}</b>
        <div className="text-[13px] text-encre">{marker.label} · <Price xof={marker.price} /></div>
        <div className="text-xs text-ardoise">
          {marker.distanceM != null && `${formatDistance(marker.distanceM)} · `}
          {statusText && <span className="font-semibold text-feuille">{statusText}</span>}
        </div>
        <Link href={`/p/${marker.slug}/dish/${marker.dishSlug}`} className="text-[13px] font-bold">Voir le plat</Link>
      </div>
    </div>
  );
}

export function MapLegend({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3.5 rounded-xl bg-white/95 px-3 py-2 text-xs text-ardoise ${className}`}>
      <span className="flex items-center gap-1.5"><span className="h-3 w-[22px] rounded-full border border-[#D6D3D1] bg-white" />Prix du plat</span>
      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#A8A29E]" />Autres points</span>
    </div>
  );
}

export function LocateButton({ onClick, busy, label = false, className = '' }: { onClick: () => void; busy: boolean; label?: boolean; className?: string }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} aria-label="Me localiser"
      className={`flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-3 text-[13px] font-semibold text-charbon shadow-[0_1px_4px_rgba(28,25,23,0.25)] disabled:opacity-60 ${label ? 'rounded-xl px-3.5' : 'w-12 h-12'} ${className}`}>
      <LocateFixed size={18} /> {label && (busy ? 'Recherche…' : 'Me localiser')}
    </button>
  );
}

