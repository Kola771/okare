'use client';

/** Emplacement du point de vente : mini-carte, zone et distance, repère, horaires résumés, itinéraire. */
import { Navigation, ShieldAlert } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { PosPage } from '@/lib/api';
import { Skeleton } from '@/components/ui/States';
import { formatDistance } from '@/shared/format';
import { hoursSummary } from './hours';

const MiniMap = dynamic(() => import('./MiniMap'), { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-none" /> });

export function directionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function LocationCard({ pos, variant }: { pos: PosPage['pos']; variant: 'mobile' | 'desktop' }) {
  const place = [pos.neighborhoodName ?? pos.zoneName, variant === 'desktop' ? 'Cotonou' : null].filter(Boolean).join(', ');
  const dist = formatDistance(pos.distanceM);
  const mapHeight = variant === 'desktop' ? 'h-[190px]' : 'h-[120px]';

  return (
    <section className={`flex flex-col gap-2.5 border border-trait bg-white ${variant === 'desktop' ? 'overflow-hidden rounded-[20px]' : 'rounded-card p-3'}`}>
      <div className={variant === 'desktop' ? 'px-3 pt-3' : ''}>
        <div className={`relative z-0 overflow-hidden rounded-[14px] bg-[#ECE7DE] ${mapHeight}`}>
          <MiniMap lat={pos.point.lat} lng={pos.point.lng} approximate={pos.isApproximate} />
        </div>
      </div>
      {pos.isApproximate ? (
        <div className={`flex flex-col gap-2 text-[13px] ${variant === 'desktop' ? 'px-4 pb-4' : ''}`}>
          <b>{place} · zone approximative</b>
          <span className="text-ardoise">{pos.delivers ? 'Livraison' : ''}{pos.delivers ? ' · ' : ''}Retrait sur rendez-vous. L’adresse exacte se donne sur WhatsApp.</span>
          <span className="flex items-start gap-2 rounded-xl bg-attention-soft px-3 py-2 font-semibold text-attention">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" /> Ne paie jamais avant d’avoir vu ta commande.
          </span>
        </div>
      ) : variant === 'desktop' ? (
        <div className="flex flex-col gap-1 px-4 pb-4 text-sm">
          <b>{place}{dist && ` · ${dist}`}</b>
          {pos.landmark && <span className="text-ardoise">Repère : {pos.landmark}</span>}
          <a href={directionsUrl(pos.point.lat, pos.point.lng)} target="_blank" rel="noopener noreferrer" className="mt-1 font-bold">Itinéraire</a>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0 text-[13px] leading-snug">
            <b>{place}{dist && ` · ${dist}`}</b><br />
            <span className="text-ardoise">{pos.landmark ? `${pos.landmark} · ` : ''}{hoursSummary(pos.openingHours)}</span>
          </div>
          <a href={directionsUrl(pos.point.lat, pos.point.lng)} target="_blank" rel="noopener noreferrer"
            className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-trait px-3 text-[13px] font-bold text-charbon no-underline">
            <Navigation size={15} /> Itinéraire
          </a>
        </div>
      )}
    </section>
  );
}
