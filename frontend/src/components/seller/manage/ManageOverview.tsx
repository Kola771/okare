/** Gestion d'un point — écran 15c : 3 chiffres, entrées vers chaque section, actions. Composant serveur. */
import Link from 'next/link';
import type { ManagedPos } from '@/lib/api';
import { openStatusLabel } from '@/shared/format';
import { POS_TYPE_LABEL } from '@/shared/enums';
import { hoursSummary } from '@/components/customer/pos/hours';
import { PosActions } from './PosActions';

export function ManageOverview({ pos, base }: { pos: ManagedPos; base: string }) {
  const status = pos.status === 'PUBLISHED' ? 'publié' : 'en attente';
  const entries: [string, string, string][] = [
    ['info', 'Informations', 'nom, type, photos, numéros, emplacement'],
    ['menu', 'Menu et plats du jour', `${pos.dishCount} plat${pos.dishCount > 1 ? 's' : ''} · ${pos.special ? '1 plat du jour aujourd’hui' : 'pas de plat du jour aujourd’hui'}`],
    ['hours', 'Horaires et fermetures', hoursSummary(pos.openingHours)],
    ['qr', 'QR code', `affiche à imprimer · ${pos.qrScans7d} scans cette semaine`],
    ['stats', 'Statistiques', 'contacts, plats demandés, commandes'],
    ['reviews', 'Avis', pos.rating ? `${pos.rating.count} avis · répondre` : 'pas encore d’avis'],
  ];
  const numbers: [string, string][] = [
    [String(pos.contacts30), 'contacts (30 j)'],
    [pos.responseRate != null ? `${Math.round(pos.responseRate * 100)} %` : '—', 'réponse'],
    [pos.rating ? String(pos.rating.avg).replace('.', ',') : '—', pos.rating ? `${pos.rating.count} avis` : 'avis'],
  ];
  return (
    <div className="flex flex-col gap-3.5">
      <div className="lg:hidden">
        <h1 className="m-0 font-display text-[22px] font-extrabold">{pos.name}</h1>
        <div className="text-[13px] text-ardoise">{POS_TYPE_LABEL[pos.type]} · {status}{pos.status === 'PUBLISHED' && ` · ${openStatusLabel(pos.openStatus).short.toLowerCase()}`}</div>
      </div>
      <div className="grid grid-cols-3 gap-2 lg:max-w-[640px]">
        {numbers.map(([v, l]) => (
          <div key={l} className="rounded-[14px] border border-trait bg-white p-3"><div className="font-display text-[22px] font-extrabold">{v}</div><div className="text-xs text-ardoise">{l}</div></div>
        ))}
      </div>
      <div className="flex flex-col rounded-2xl border border-trait bg-white px-3.5 lg:grid lg:grid-cols-2 lg:gap-x-6">
        {entries.map(([k, title, sub]) => (
          <Link key={k} href={`${base}/${k}`} className="flex min-h-14 items-center justify-between gap-2.5 border-t border-trait py-2 text-charbon no-underline first:border-0 lg:[&:nth-child(2)]:border-0">
            <span><b className="block text-[15px]">{title}</b><span className="text-xs text-ardoise">{sub}</span></span>
            <span aria-hidden className="text-lg text-ardoise">›</span>
          </Link>
        ))}
      </div>
      <div className="flex flex-col gap-2 lg:hidden">
        <Link href={`/p/${pos.slug}`} className="flex min-h-[46px] items-center justify-center rounded-xl bg-argile text-sm font-semibold text-charbon no-underline">Voir ma page</Link>
        <PosActions posId={pos.id} status={pos.status} />
      </div>
    </div>
  );
}
