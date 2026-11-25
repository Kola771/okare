/** Résumé d'un point de vente avec le bouton « Gestion » (accueil 15, liste 15b). Composant serveur. */
import Link from 'next/link';
import type { ManagedPos } from '@/lib/api';
import { formatPrice, openStatusLabel } from '@/shared/format';
import { POS_TYPE_LABEL } from '@/shared/enums';

export const STATUS_LABEL: Record<string, string> = { PUBLISHED: 'publié', PENDING: 'en attente', SUSPENDED: 'suspendu', ARCHIVED: 'archivé' };

export function PosSummary({ pos, withZone = false }: { pos: ManagedPos; withZone?: boolean }) {
  const label = openStatusLabel(pos.openStatus);
  const open = label.tone === 'open' || label.tone === 'soon';
  const pending = pos.status !== 'PUBLISHED';
  const sub = withZone ? `${POS_TYPE_LABEL[pos.type]} · ${pos.zoneName} · ${STATUS_LABEL[pos.status]}` : `${POS_TYPE_LABEL[pos.type]} · ${pos.contacts30} contacts ce mois`;
  return (
    <article className="flex flex-col gap-2.5 rounded-card border border-trait bg-surface p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0"><div className="text-base font-bold">{pos.name}</div><div className="text-xs text-ardoise">{sub}</div></div>
        <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-bold ${pending ? 'bg-attention-soft text-attention' : open ? 'bg-feuille-soft text-feuille-ink' : 'bg-argile text-encre'}`}>
          {pending ? 'En attente' : label.short}</span>
      </div>
      {pending ? (
        <div className="rounded-xl bg-argile px-3 py-2.5 text-[13px] text-ardoise">Masqué aux clients · tu peux le remettre en ligne</div>
      ) : pos.special ? (
        <div className="rounded-xl bg-feuille-pale px-3 py-2.5 text-[13px] text-feuille-ink">
          Plat du jour : <b>{pos.special.name} · {formatPrice(pos.special.priceXof)}</b>{withZone && ` · ${pos.contacts30} contacts ce mois`}
        </div>
      ) : (
        <div className="rounded-xl bg-argile px-3 py-2.5 text-[13px] text-ardoise">Pas encore de plat du jour publié{withZone && ` · ${pos.contacts30} contacts ce mois`}</div>
      )}
      <Link href={`/seller/points/${pos.id}`}
        className="flex min-h-11 items-center justify-center rounded-xl bg-inverse text-sm font-bold text-on-inverse no-underline hover:text-on-inverse">Gestion</Link>
    </article>
  );
}
