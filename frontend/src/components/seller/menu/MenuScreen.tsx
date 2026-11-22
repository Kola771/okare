'use client';

/** Menu et plats du jour — écran 7 (mobile) et VD3 (desktop). Mêmes gestes pour le vendeur, l'agent et l'admin. */
import { Plus, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { dishAction, errorMessage, getManagedPos, getMenu, markPricesChecked, repeatYesterdaySpecials, setDayStatus, type DishAction, type ManagedPos, type MenuDish } from '@/lib/api';
import { btn, PageHead, Tabs } from '@/components/admin/AdminParts';
import { useApi } from '@/components/admin/useApi';
import { useToast } from '@/components/providers/ToastProvider';
import { EmptyState, ErrorState, LoadingList } from '@/components/ui/States';
import { daysAgoLabel, openStatusLabel } from '@/shared/format';
import { DishRow } from './DishRow';

type Filter = 'today' | 'all' | 'hidden';

export function MenuScreen({ posId, base = `/seller/points/${posId}/menu`, initialMenu, initialPos }: {
  posId: string; base?: string; initialMenu?: MenuDish[]; initialPos?: ManagedPos;
}) {
  const toast = useToast();
  const menu = useApi(() => getMenu(posId), [posId], initialMenu);
  const pos = useApi(() => getManagedPos(posId), [posId], initialPos);
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast(ok, 'success');
      await Promise.all([menu.reload(), pos.reload()]);
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  const MSG: Record<DishAction, string> = {
    publish: 'Plat remis en ligne', hold: 'Plat masqué aux clients', 'sold-out': 'Indiqué épuisé pour aujourd’hui',
    'back-in-stock': 'De nouveau disponible', delete: 'Plat supprimé', 'special-on': 'Publié en plat du jour', 'special-off': 'Retiré des plats du jour',
  };
  const dishes = menu.data ?? [];
  const shown = dishes.filter((d) => (filter === 'today' ? d.isSpecial : filter === 'hidden' ? d.status === 'PENDING' : true));
  const p = pos.data;
  const closed = p?.todayOverride?.isClosed;

  return (
    <>
      <PageHead title="Menu et plats du jour" sub="Les clients voient ces prix tout de suite."
        actions={<>
          <button type="button" disabled={busy} className={btn.secondary} onClick={() => run(() => repeatYesterdaySpecials(posId), 'Plats d’hier republiés')}>
            <RotateCcw size={16} /> <span className="hidden sm:inline">Republier les plats d’hier</span><span className="sm:hidden">Hier</span>
          </button>
          <Link href={`${base}/new`} className={btn.primary}><Plus size={16} /> Ajouter</Link>
        </>} />
      {p && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7E5E4] bg-white px-4 py-3">
          <div className="text-sm"><b>Aujourd’hui : {closed ? 'fermé' : openStatusLabel(p.openStatus).short.toLowerCase()}</b>
            <span className="text-ardoise"> · prix vérifiés {daysAgoLabel(p.pricesCheckedAt, new Date()) ?? 'jamais'}</span></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} className={btn.secondary} onClick={() => run(() => markPricesChecked(posId), 'Prix marqués comme vérifiés')}>Prix vérifiés, rien n’a changé</button>
            <button type="button" disabled={busy} className={closed ? btn.dark : btn.secondary}
              onClick={() => run(() => setDayStatus(posId, closed ? null : { isClosed: true }), closed ? 'Réouvert aujourd’hui' : 'Fermé aujourd’hui')}>
              {closed ? 'Rouvrir aujourd’hui' : 'Fermé aujourd’hui'}
            </button>
          </div>
        </div>
      )}
      <Tabs value={filter} onChange={setFilter} tabs={[
        ['today', `Aujourd’hui (${dishes.filter((d) => d.isSpecial).length})`], ['all', `Tous les plats (${dishes.length})`],
        ['hidden', `Masqués (${dishes.filter((d) => d.status === 'PENDING').length})`]]} />
      {menu.error ? <ErrorState message={menu.error} onRetry={menu.reload} />
        : menu.loading ? <LoadingList count={4} className="h-20" />
        : !shown.length ? <EmptyState title={filter === 'today' ? 'Pas encore de plat du jour' : 'Aucun plat ici'}
            text={filter === 'today' ? 'Touche « Du jour » sur un plat, ou republie ceux d’hier en un geste.' : 'Ajoute ton premier plat : il est publié tout de suite.'} />
        : <div className="flex flex-col gap-2.5">{shown.map((d) => (
            <DishRow key={d.id} dish={d} editHref={`${base}/${d.id}`} busy={busy} onAction={(a) => run(() => dishAction(posId, d.id, a), MSG[a])} />))}</div>}
      <p className="m-0 rounded-xl bg-piment-soft px-3.5 py-2.5 text-[13px] text-piment-ink">
        Astuce : un plat du jour publié avant 10h est vu par plus de monde à l’heure du déjeuner.
      </p>
    </>
  );
}
