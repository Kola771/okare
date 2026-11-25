/**
 * Affichage d'un rapport de statistiques (écran 4, VD4, rapport partagé /r/[token]).
 * Libellés honnêtes : « contacts, dont commandes confirmées », jamais « ventes » (9.4).
 */
import { MessageCircle, Phone, QrCode, ShoppingBag, Users } from 'lucide-react';
import type { StatsReport } from '@/lib/api';
import { Bars, HBars, Panel, StatCard } from '@/components/admin/AdminParts';

const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : 0);
const dayLabel = (d: string) => ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'][new Date(`${d}T12:00:00Z`).getUTCDay()];

export function StatsView({ report, periodLabel }: { report: StatsReport; periodLabel: string }) {
  const evo = pct(report.contacts, report.previousContacts);
  const confirmRate = report.contacts ? Math.round((report.confirmedOrders / report.contacts) * 100) : 0;
  return (
    <>
      <div className="flex flex-col gap-1 rounded-[20px] bg-inverse p-4 text-on-inverse lg:hidden">
        <div className="text-[13px] text-[#E7E5E4]">{periodLabel}, OKARE t’a envoyé</div>
        <div className="font-display text-4xl font-extrabold leading-none">{report.contacts} clients</div>
        <div className="text-[13px] text-[#E7E5E4]">qui t’ont écrit sur WhatsApp ou appelé depuis l’appli
          {report.responseRate != null && ` · répond à ${Math.round(report.responseRate * 100)} % des clients`}</div>
      </div>
      <div className="grid grid-cols-3 gap-2.5 lg:hidden">
        {[[report.views, 'vues de ta fiche'], [report.whatsapp, 'messages WhatsApp'], [report.calls, 'appels']].map(([v, l]) => (
          <div key={l} className="rounded-2xl border border-trait bg-surface p-3"><div className="text-xl font-bold">{v}</div><div className="text-xs text-ardoise">{l}</div></div>
        ))}
      </div>
      <div className="hidden gap-4 lg:grid lg:grid-cols-4">
        <StatCard icon={MessageCircle} label="Contacts" value={report.contacts} delta={`${evo >= 0 ? '+' : ''}${evo} %`} tone={evo >= 0 ? 'ok' : 'bad'} />
        <StatCard icon={Users} label="Clients uniques" value={report.uniqueClients} />
        <StatCard icon={ShoppingBag} label="Commandes confirmées" value={report.confirmedOrders} delta={`${confirmRate} % des contacts`} tone="neutral" />
        <StatCard icon={QrCode} label="Scans du QR code" value={report.qrScans} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Contacts par jour" sub="14 derniers jours">
          <Bars data={report.byDay.map((d) => ({ label: dayLabel(d.date), value: d.contacts }))} />
          <div className="flex gap-4 text-[13px] text-ardoise"><span className="flex items-center gap-1.5"><MessageCircle size={14} /> {report.whatsapp} WhatsApp</span>
            <span className="flex items-center gap-1.5"><Phone size={14} /> {report.calls} appels</span></div>
        </Panel>
        {report.byDish.length > 0 && (
          <Panel title="Par plat" sub={periodLabel}>
            <HBars unit="contacts" rows={report.byDish.slice(0, 6).map((d) => ({ label: d.name, value: d.contacts, muted: d.name === 'Plat non précisé' }))} />
          </Panel>
        )}
      </div>
      {report.byPos.length > 1 && (
        <Panel title="Par point de vente">
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead><tr className="text-xs text-ardoise"><th className="py-2 font-semibold">Point</th><th className="font-semibold">Contacts</th><th className="font-semibold">Réponse</th><th className="font-semibold">Jours avec contacts</th></tr></thead>
            <tbody>{report.byPos.map((p) => (
              <tr key={p.posId} className="border-t border-trait"><td className="py-2.5 font-semibold">{p.name}</td><td>{p.contacts}</td>
                <td>{p.responseRate != null ? `${Math.round(p.responseRate * 100)} %` : '—'}</td><td>{p.openDays} / {p.days}</td></tr>))}
            </tbody></table></div>
        </Panel>
      )}
      <p className="m-0 text-[13px] text-ardoise">
        {report.contacts} contacts, dont {report.confirmedOrders} commandes confirmées par les clients. Contacts = clients qui t’ont écrit ou appelé depuis OKARE.
        Commandes confirmées = clients qui ont dit avoir commandé. OKARE ne voit pas ta caisse.
      </p>
    </>
  );
}
