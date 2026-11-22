'use client';

/**
 * Fiche d'un point de vente — DB3 (desktop) et DM3 (mobile) ; onglet Menu = DM5.
 * Onglets : Informations, Menu, Horaires, Statistiques, Avis, QR code, Historique (mêmes gestes que le vendeur).
 * Onglet Pubs et bouton « Mettre en avant » masqués à la demande du porteur (AdsTab gardé dans DetailTabs pour plus tard).
 */
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getManagedPos, getPosReviews, getPosSheet, getPosStats } from '@/lib/api';
import { btn, PageHead, Pill, Tabs } from '@/components/admin/AdminParts';
import { Crumbs } from '@/components/admin/Card';
import { useApi } from '@/components/admin/useApi';
import { MenuScreen } from '@/components/seller/menu/MenuScreen';
import { HoursEditor } from '@/components/seller/hours/HoursEditor';
import { ReviewsManager } from '@/components/seller/manage/ReviewsManager';
import { QrPanel } from '@/components/seller/points/QrPanel';
import { StatsView } from '@/components/seller/stats/StatsView';
import { ErrorState, LoadingList } from '@/components/ui/States';
import { POS_TYPE_LABEL } from '@/shared/enums';
import { HistoryTab } from './DetailTabs';
import { STATUS_PILL } from './PointsList';
import { SHEET_FORM, SheetInfo, shortDate } from './SheetInfo';

type Tab = 'info' | 'menu' | 'hours' | 'stats' | 'reviews' | 'qr' | 'history';

function Stats({ posId }: { posId: string }) {
  const s = useApi(() => getPosStats(posId, 30), [posId]);
  return s.data ? <StatsView report={s.data} periodLabel="Ces 30 jours" /> : <LoadingList count={2} className="h-40" />;
}

function Reviews({ posId }: { posId: string }) {
  const r = useApi(() => getPosReviews(posId), [posId]);
  return r.data ? <ReviewsManager posId={posId} reviews={r.data} /> : <LoadingList count={2} className="h-24" />;
}

export function PointDetail({ posId }: { posId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const tab = (params.get('tab') as Tab) ?? 'info';
  const { data: pos, error, loading, reload } = useApi(() => getManagedPos(posId), [posId]);
  const sheet = useApi(() => getPosSheet(posId), [posId]);
  const featured = sheet.data?.featuredUntil ? shortDate(sheet.data.featuredUntil) : null;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !pos) return <LoadingList count={3} className="h-32" />;
  const [tone, label] = STATUS_PILL[pos.status];
  const go = (t: Tab) => router.replace(`/dashboard/points/${posId}?tab=${t}`, { scroll: false });

  return (
    <>
      <div className="flex flex-col gap-2">
        <Crumbs items={['Terrain', ['Points de vente', '/dashboard/points'], pos.name]} />
        <PageHead title={pos.name}
          sub={<span className="mt-1 flex flex-wrap items-center gap-2"><Pill tone={tone}>{label}</Pill><Pill>{POS_TYPE_LABEL[pos.type]}</Pill>
            {featured && <Pill tone="mais">Mis en avant jusqu’au {featured}</Pill>}</span>}
          actions={<>
            <Link href={`/p/${pos.slug}`} className={btn.secondary}>Voir la page client</Link>
            {tab === 'info' && <button type="submit" form={SHEET_FORM} className={btn.primary}>Enregistrer</button>}
          </>} />
      </div>
      <Tabs value={tab} onChange={go}
        tabs={[['info', 'Informations'], ['menu', `Menu (${pos.dishCount})`], ['hours', 'Horaires'], ['stats', 'Statistiques'], ['reviews', 'Avis'],
          ['qr', 'QR code'], ['history', 'Historique']]} />
      {tab === 'info' && (sheet.data ? <SheetInfo key={pos.version} pos={pos} sheet={sheet.data} onChange={() => { void reload(); void sheet.reload(); }} />
        : <LoadingList count={3} className="h-32" />)}
      {tab === 'menu' && <MenuScreen posId={posId} base={`/dashboard/points/${posId}/menu`} />}
      {tab === 'hours' && <HoursEditor key={pos.version} pos={pos} onSaved={reload} />}
      {tab === 'stats' && <Stats posId={posId} />}
      {tab === 'reviews' && <Reviews posId={posId} />}
      {tab === 'qr' && <QrPanel pos={pos} />}
      {tab === 'history' && <HistoryTab posId={posId} />}
    </>
  );
}
