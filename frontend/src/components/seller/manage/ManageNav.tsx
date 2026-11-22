'use client';

/**
 * En-tête de la « Gestion » d'un point (15c ; onglets VD3–VD5) : fil d'Ariane, nom, statut, actions
 * « Voir ma page / Mettre en attente / Supprimer », onglets sur ordinateur ; retour vers la gestion sur téléphone.
 */
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Pill } from '@/components/admin/AdminParts';
import { PosActions } from './PosActions';

export const SECTIONS: [string, string][] = [
  ['info', 'Informations'], ['menu', 'Menu et plats du jour'], ['hours', 'Horaires et fermetures'],
  ['qr', 'QR code'], ['stats', 'Statistiques'], ['reviews', 'Avis'],
];

export interface ManageHeader { id: string; slug: string; name: string; status: string; typeLabel: string; openText: string; isOpen: boolean }

export function ManageNav({ pos, base }: { pos: ManageHeader; base: string }) {
  const path = usePathname();
  const section = SECTIONS.find(([k]) => path.startsWith(`${base}/${k}`));
  const pending = pos.status !== 'PUBLISHED';
  return (
    <>
      {section && (
        <Link href={base} className="flex items-center gap-2 text-sm font-semibold text-charbon no-underline lg:hidden">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-trait bg-white"><ArrowLeft size={18} /></span>
          <span className="min-w-0"><span className="block truncate">{pos.name}</span><span className="block text-xs font-normal text-ardoise">{section[1]}</span></span>
        </Link>
      )}
      <div className="hidden flex-col gap-4 lg:flex">
        <div className="text-[13px] text-ardoise">
          <Link href="/seller">Espace vendeur</Link> › <Link href="/seller/points">Mes points de vente</Link> › {section ? <Link href={base}>{pos.name}</Link> : pos.name}
          {section && ` › ${section[1]}`}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="m-0 text-[26px] font-bold">{pos.name}</h1>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Pill tone={pending ? 'warn' : 'ok'}>{pending ? 'En attente' : 'Publié'}</Pill><Pill>{pos.typeLabel}</Pill>
              {!pending && <Pill tone={pos.isOpen ? 'ok' : 'neutral'}>{pos.openText}</Pill>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/p/${pos.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#E7E5E4] bg-white px-4 text-sm font-semibold text-charbon no-underline">
              <ExternalLink size={16} /> Voir ma page</Link>
            <PosActions posId={pos.id} status={pos.status} compact />
          </div>
        </div>
        <nav aria-label="Gestion du point" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-[#E7E5E4]">
          {SECTIONS.map(([k, label]) => {
            const on = section?.[0] === k;
            return (
              <Link key={k} href={`${base}/${k}`} aria-current={on ? 'page' : undefined}
                className={`flex min-h-11 shrink-0 items-center px-3.5 text-sm no-underline ${on ? 'font-bold text-piment shadow-[inset_0_-2px_0_var(--color-piment)]' : 'font-semibold text-ardoise'}`}>
                {label}</Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
