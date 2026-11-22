/**
 * Accueil vendeur — écran 15 (mobile) et VD1 (desktop) : statistiques de **tous** ses points, puis un résumé par point
 * avec un bouton « Gestion » (spec 14). Composant serveur : aucune donnée chargée dans le navigateur.
 */
import { MessageCircle, QrCode, ShoppingBag, Star } from 'lucide-react';
import Link from 'next/link';
import type { StatsReport, VendorHome } from '@/lib/api';
import type { Period } from '@/shared/period';
import { Bars, HBars, PageHead, Panel, StatCard } from '@/components/admin/AdminParts';
import { PosSummary } from '../points/PosSummary';
import { PeriodFilter } from './PeriodFilter';
import { ZonesCard } from './ZonesCard';

const dayLabel = (d: string) => ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][new Date(`${d}T12:00:00Z`).getUTCDay()];

export function SellerHome({ home, stats, period, years, posName }: { home: VendorHome; stats: StatsReport; period: Period; years: number[]; posName: string | null }) {
  const evo = stats.previousContacts ? Math.round(((stats.contacts - stats.previousContacts) / stats.previousContacts) * 100) : 0;
  const ratings = home.points.map((p) => p.rating).filter((r): r is { avg: number; count: number } => !!r);
  const ratingCount = ratings.reduce((n, r) => n + r.count, 0);
  const ratingAvg = ratingCount ? Math.round((ratings.reduce((n, r) => n + r.avg * r.count, 0) / ratingCount) * 10) / 10 : null;
  const confirmRate = stats.contacts ? Math.round((stats.confirmedOrders / stats.contacts) * 100) : 0;
  const mini = [[stats.contacts, 'contacts'], [stats.confirmedOrders, 'commandes confirmées'],
    [ratingAvg ? `${String(ratingAvg).replace('.', ',')} / 5` : '—', `note moyenne · ${ratingCount} avis`], [stats.qrScans, 'scans du QR code']] as const;

  return (
    <>
      <PageHead kicker="Espace vendeur" title={`Bonjour ${home.contactName ?? home.displayName}`}
        sub={<span className="hidden lg:inline">{posName ? `Les chiffres de ${posName}` : 'Les chiffres de tous tes points de vente'} · {period.label}.</span>}
        actions={<Link href="/" className="text-[13px] font-semibold lg:hidden">Vue client</Link>} />
      <PeriodFilter period={period} years={years} />

      <div className="flex flex-col gap-1 rounded-[20px] bg-charbon p-4 text-white lg:hidden">
        <div className="text-[13px] text-[#E7E5E4]">Aujourd’hui, OKARE t’a envoyé</div>
        <div className="font-display text-4xl font-extrabold leading-none">{home.contactsToday} clients</div>
        <div className="text-[13px] text-[#E7E5E4]">sur tes {home.points.length} point{home.points.length > 1 ? 's' : ''} de vente</div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:hidden">
        {mini.map(([v, l]) => (
          <div key={l} className="rounded-2xl border border-trait bg-white p-3"><div className="font-display text-xl font-extrabold">{v}</div><div className="text-xs text-ardoise">{l}</div></div>
        ))}
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-4">
        <StatCard icon={MessageCircle} label="Contacts" value={stats.contacts} delta={`${evo >= 0 ? '+' : ''}${evo} %`} tone={evo >= 0 ? 'ok' : 'bad'} />
        <StatCard icon={ShoppingBag} label="Commandes confirmées" value={stats.confirmedOrders} delta={`${confirmRate} % des contacts`} tone="neutral" />
        <StatCard icon={Star} label="Note moyenne" value={ratingAvg ? `${String(ratingAvg).replace('.', ',')} / 5` : '—'} delta={`${ratingCount} avis`} tone="neutral" />
        <StatCard icon={QrCode} label="Scans du QR code" value={stats.qrScans} />
      </div>
      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
        <Panel title="Contacts par jour" sub={`${posName ?? 'Tous tes points de vente'} · ${stats.byDay.length < 31 || period.month ? period.label : '31 derniers jours de la période'}`}>
          <Bars data={stats.byDay.map((d) => ({ label: stats.byDay.length > 10 ? d.date.slice(8) : dayLabel(d.date), value: d.contacts }))} />
        </Panel>
        <Panel title="Plats les plus demandés" sub={period.label}>
          <HBars unit="contacts" rows={stats.byDish.slice(0, 5).map((d) => ({ label: d.name, value: d.contacts, muted: d.name === 'Plat non précisé' }))} />
        </Panel>
      </div>

      <ZonesCard zones={home.zones} />

      <div className="flex items-baseline justify-between">
        <h2 className="m-0 text-[13px] font-bold text-encre lg:text-[17px] lg:text-charbon">Par point de vente</h2>
        <Link href="/seller/points" className="text-[13px] font-semibold">Tout voir</Link>
      </div>
      <div className="grid gap-3.5 lg:grid-cols-2">
        {home.points.map((p) => <PosSummary key={p.id} pos={p} />)}
      </div>
    </>
  );
}
