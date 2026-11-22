/**
 * Tableau de bord — DB1 (desktop) et DM1 (mobile). Composant serveur, filtré (pays, ville, zone, quartier, période) :
 * chiffres clés, objectif de points publiés, contacts par jour, plats les plus demandés, points à surveiller, activité.
 */
import { MessageCircle, ShoppingBag, Star, Store } from 'lucide-react';
import Link from 'next/link';
import type { AdminDashboard, Geography } from '@/lib/api';
import { Bars, btn, HBars, PageHead, Panel, Pill, StatCard } from '@/components/admin/AdminParts';
import { POS_TYPE_LABEL, type PosType } from '@/shared/enums';
import { FiltersBar } from '../filters/FiltersBar';

const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : 0);
const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : `il y a ${Math.round(m / 1440)} j`;
};

const day = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export function DashboardHome({ d, geo }: { d: AdminDashboard; geo: Geography }) {
  const period = `du ${day(d.period.from)} au ${day(d.period.to)}`;
  const n = `${d.period.days} j`;
  const evo = pct(d.contacts30, d.contactsPrev30);
  const evoC = pct(d.confirmed30, d.confirmedPrev30);
  const progress = Math.min(100, Math.round((d.publishedPos / d.objectivePos) * 100));
  return (
    <>
      <PageHead kicker={`Tableau de bord · ${d.place} · ${period}`} title="Tableau de bord" sub={`Bonjour ${d.greetName}, voici l’activité d’OKARE (${d.place}, ${period}).`}
        actions={<><span className={`${btn.secondary} hidden sm:inline-flex`}>Exporter</span><Link href="/dashboard/points/new" className={btn.primary}>+ Nouveau point de vente</Link></>} />
      <FiltersBar geo={geo} dateHint="Période des chiffres : 30 derniers jours par défaut, comparée à la période de même durée juste avant." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={MessageCircle} label={`Contacts (${n})`} value={d.contacts30.toLocaleString('fr-FR')} delta={`${evo >= 0 ? '+' : ''}${evo} %`} tone={evo >= 0 ? 'ok' : 'bad'} />
        <StatCard icon={ShoppingBag} label={`Commandes confirmées (${n})`} value={d.confirmed30.toLocaleString('fr-FR')} delta={`${evoC >= 0 ? '+' : ''}${evoC} %`} tone={evoC >= 0 ? 'ok' : 'bad'} />
        <StatCard icon={Star} label="Note moyenne" value={d.rating ? `${String(d.rating.avg).replace('.', ',')} / 5` : '—'} delta={d.rating ? `${d.rating.count} avis` : undefined} tone="neutral" />
        <StatCard icon={Store} label="Points de vente publiés" value={d.publishedPos} delta={`+${d.newPos7d} en 7 j`} tone="ok" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel title="Contacts par jour" sub={d.period.days > 31 ? `31 derniers jours de la période` : period}><Bars data={d.byDay.map((x) => ({ label: x.date.slice(8), value: x.contacts }))} height={180} /></Panel>
        <Panel title="Objectif : points de vente publiés">
          <div className="flex items-end justify-between"><span className="text-3xl font-bold">{d.publishedPos}</span><span className="text-sm text-ardoise">objectif {d.objectivePos}</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-argile"><div className="h-full rounded-full bg-feuille" style={{ width: `${progress}%` }} /></div>
          <div className="flex justify-between text-sm"><span className="text-ardoise">Publiés</span><b>{d.publishedPos}</b></div>
          <div className="flex justify-between text-sm"><span className="text-ardoise">Cette semaine</span><b className="text-feuille">+{d.newPos7d}</b></div>
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Panel title="Points de vente à surveiller" actions={<Link href="/dashboard/points" className="text-sm font-semibold">Tous les points</Link>}>
          {!d.watchlist.length ? <p className="m-0 text-sm text-ardoise">Rien à signaler.</p> : (
            <ul className="m-0 flex list-none flex-col divide-y divide-trait p-0">{d.watchlist.map((w) => (
              <li key={w.posId} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="min-w-0"><b>{w.name}</b> <span className="text-ardoise">· {POS_TYPE_LABEL[w.type as PosType]} · {w.zone}</span></span>
                <span className="flex items-center gap-2"><Pill tone="warn">{w.problem}</Pill><Link href={`/dashboard/points/${w.posId}`} className="font-semibold">Ouvrir</Link></span>
              </li>))}</ul>
          )}
        </Panel>
        <Panel title="Plats les plus demandés"><HBars unit="contacts" rows={d.topDishes.map((t) => ({ label: t.name, value: t.contacts }))} /></Panel>
      </div>
      <Panel title="Activité récente" actions={<Link href="/dashboard/audit" className="text-sm font-semibold">Journal d’audit</Link>}>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">{d.activity.map((a) => (
          <li key={a.id} className="flex gap-2.5 text-sm"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-piment-pale text-xs font-bold text-piment-ink">{a.who[0]}</span>
            <span className="min-w-0"><b>{a.who}</b> <span className="text-ardoise">· {a.what}</span><span className="block text-xs text-pierre">{ago(a.at)}</span></span></li>))}</ul>
      </Panel>
    </>
  );
}
