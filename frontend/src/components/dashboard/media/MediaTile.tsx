'use client';

/** Vignette de la médiathèque (DB11) : image, nom du fichier, point de vente, statut. */
import { ImageIcon, MessageCircle, Store } from 'lucide-react';
import type { MediaRow, MediaState } from '@/lib/api';
import { Pill } from '@/components/admin/AdminParts';

export const STATE: Record<MediaState, [string, 'ok' | 'warn' | 'neutral' | 'bad']> = {
  PUBLISHED: ['Publiée', 'ok'], TO_REVIEW: ['À relire', 'warn'], PROCESSING: ['En traitement', 'neutral'], REJECTED: ['Refusée', 'bad'],
};

export function MediaThumb({ m, className = '' }: { m: MediaRow; className?: string }) {
  if (m.src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={m.src} alt={m.fileName} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  }
  const Icon = m.unassigned ? MessageCircle : m.kind === 'FACADE' ? Store : ImageIcon;
  return (
    <span className={`flex h-full w-full flex-col items-center justify-center gap-1 bg-[#F1E4D6] text-piment-ink/70 ${className}`}>
      <Icon size={24} strokeWidth={1.5} />
      <span className="text-[11px] font-semibold">{m.unassigned ? 'WhatsApp' : m.kind === 'FACADE' ? 'Façade' : 'Photo'}</span>
    </span>
  );
}

export function MediaTile({ m, onOpen }: { m: MediaRow; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white text-left hover:shadow-[0_8px_24px_-12px_rgba(28,25,23,0.35)]">
      <span className="block aspect-[4/3] w-full overflow-hidden"><MediaThumb m={m} /></span>
      <span className="flex min-w-0 flex-col gap-0.5 p-2.5">
        <b className="truncate text-[13px]">{m.fileName}</b>
        <span className="truncate text-xs text-ardoise">{m.owner}</span>
        <span className="mt-0.5 flex flex-wrap gap-1"><Pill tone={STATE[m.state][1]}>{STATE[m.state][0]}</Pill>{m.unassigned && <Pill tone="bad">Non associée</Pill>}</span>
      </span>
    </button>
  );
}
