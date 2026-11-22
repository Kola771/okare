/** Mes points de vente — écran 15b (mobile, cartes) et VD2 (desktop, tableau), bouton « Gestion » par ligne. Serveur. */
import Link from 'next/link';
import type { VendorHome } from '@/lib/api';
import { btn, PageHead } from '@/components/admin/AdminParts';
import { PointsTable } from './PointsTable';
import { PosSummary } from './PosSummary';

export function PointsList({ home, filters }: { home: VendorHome; filters?: React.ReactNode }) {
  const n = home.points.length;
  const add = !home.isParticulier && <Link href="/seller/points/new" className={btn.primary}>+ Ajouter un point de vente</Link>;
  return (
    <>
      <PageHead kicker={<span className="hidden lg:inline">Espace vendeur › Mes points de vente</span>} title="Mes points de vente"
        sub={`${n} point${n > 1 ? 's' : ''} de vente · chacun a sa page, son menu, ses horaires et ses statistiques.`}
        actions={<span className="hidden lg:block">{add}</span>} />
      {filters}
      {!n && <p className="m-0 rounded-2xl border lg:hidden border-[#E7E5E4] bg-white p-5 text-sm text-ardoise">Aucun point de vente pour ce lieu.</p>}
      <div className="flex flex-col gap-3 lg:hidden">
        {home.points.map((p) => <PosSummary key={p.id} pos={p} withZone />)}
        {!home.isParticulier && (
          <Link href="/seller/points/new" className="flex min-h-[50px] items-center justify-center rounded-btn border-2 border-dashed border-[#A8A29E] text-[15px] font-bold text-charbon no-underline">
            + Ajouter un point de vente</Link>
        )}
      </div>
      <div className="hidden lg:block"><PointsTable points={home.points} /></div>
      <p className="m-0 text-[13px] text-ardoise">« Gestion » ouvre tout ce qui concerne ce point : informations, menu et plats du jour, horaires et fermetures, QR code,
        statistiques, avis ; et les actions mettre en attente, supprimer.{home.isParticulier ? ' Un vendeur Particulier (vente en ligne) n’a qu’un seul point de vente.' : ''}</p>
    </>
  );
}
