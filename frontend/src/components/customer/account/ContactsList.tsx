'use client';

/** « Derniers contacts » (D3 tableau, écran 13 liste) avec la réponse du vendeur et « Il t'a répondu ? ». */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { errorMessage, getMyContacts, type MyContact } from '@/lib/api';
import { Pager, usePaged } from '@/components/admin/Pager';
import { ErrorState, LoadingList } from '@/components/ui/States';
import type { FollowUpAnswer } from '@/shared/enums';
import { formatHour } from '@/shared/format';
import { toLocal } from '@/shared/time';

const ANSWER: Record<FollowUpAnswer | 'NONE', { text: string; cls: string }> = {
  YES: { text: 'Répondu', cls: 'bg-ok-soft text-ok' },
  NO: { text: 'Pas de réponse', cls: 'bg-erreur-soft text-erreur' },
  NOT_YET: { text: 'À confirmer', cls: 'bg-attention-soft text-attention' },
  NONE: { text: 'À confirmer', cls: 'bg-attention-soft text-attention' },
};

function when(iso: string): string {
  const l = toLocal(new Date(iso));
  const today = toLocal(new Date()).date;
  const hm = formatHour(`${String(Math.floor(l.minutes / 60)).padStart(2, '0')}:${String(l.minutes % 60).padStart(2, '0')}`);
  if (l.date === today) return `Aujourd’hui · ${hm}`;
  return `${new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(iso))} · ${hm}`;
}

const askFollowUp = (id: string) => window.dispatchEvent(new CustomEvent('okare:followup', { detail: id }));

function Action({ c }: { c: MyContact }) {
  if (c.canAnswer) return <button type="button" onClick={() => askFollowUp(c.id)} className="text-[13px] font-bold text-piment">Il t’a répondu ?</button>;
  if (c.answer === 'NO') return <Link href={`/p/${c.posSlug}`} className="text-[13px] font-bold">Signaler</Link>;
  return <Link href={`/p/${c.posSlug}`} className="text-[13px] font-bold">Recommander</Link>;
}

export function ContactsList({ variant, initial = null }: { variant: 'table' | 'list'; initial?: MyContact[] | null }) {
  const [items, setItems] = useState<MyContact[] | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const load = () => getMyContacts().then(setItems).catch((e) => setError(errorMessage(e)));
  useEffect(() => { if (!initial) void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { items: shown, pager } = usePaged(items ?? []);

  if (error) return <ErrorState message={error} onRetry={() => { setError(null); void load(); }} />;
  if (!items) return <LoadingList count={2} className="h-14" />;
  if (!items.length) return <p className="m-0 text-sm text-ardoise">Aucun contact pour l’instant. Commande un plat depuis l’accueil.</p>;

  if (variant === 'list') {
    return (
      <>
      <ul className="m-0 flex list-none flex-col p-0">
        {shown.map((c) => {
          const a = ANSWER[c.answer ?? 'NONE'];
          return (
            <li key={c.id} className="flex items-center justify-between gap-3 border-t border-trait py-3 first:border-0">
              <div className="min-w-0"><b className="block truncate text-sm">{c.posName}</b>
                <span className="text-xs text-ardoise">{when(c.createdAt)}{c.dishName && ` · ${c.dishName}`}</span></div>
              <div className="flex shrink-0 flex-col items-end gap-1"><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${a.cls}`}>{a.text}</span><Action c={c} /></div>
            </li>
          );
        })}
      </ul>
      <Pager {...pager} />
      </>
    );
  }
  return (
    <div className="overflow-x-auto rounded-card border border-trait bg-surface">
      <table className="w-full border-collapse text-left text-sm">
        <thead><tr className="text-xs text-ardoise">
          {['Quand', 'Point de vente', 'Plat commandé', 'Réponse du vendeur', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
        </tr></thead>
        <tbody>
          {shown.map((c) => {
            const a = ANSWER[c.answer ?? 'NONE'];
            return (
              <tr key={c.id} className="border-t border-trait">
                <td className="px-4 py-3 text-ardoise">{when(c.createdAt)}</td>
                <td className="px-4 py-3 font-semibold">{c.posName}</td>
                <td className="px-4 py-3">{c.dishName ?? '—'}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${a.cls}`}>{a.text}</span></td>
                <td className="px-4 py-3 text-right"><Action c={c} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Pager {...pager} />
    </div>
  );
}
