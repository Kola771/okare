'use client';

/** Journal d'audit (DB10). Médiathèque (DB11) : media/MediaScreen. Menu « Plus » : more/MoreScreen. Paramètres (DB12) : settings/SettingsScreen. */
import { listAudit } from '@/lib/api';
import { btn, PageHead } from '@/components/admin/AdminParts';
import { DataTable } from '@/components/admin/DataTable';
import { useApi } from '@/components/admin/useApi';
import { ErrorState, LoadingList } from '@/components/ui/States';

export function AuditScreen() {
  const list = useApi(listAudit, []);
  if (list.error) return <ErrorState message={list.error} onRetry={list.reload} />;
  return (
    <>
      <PageHead title="Journal d’audit" sub="Toutes les actions de l’équipe et des vendeurs sur les données sensibles. Lecture seule, impossible à modifier." actions={<button type="button" className={btn.secondary}>Exporter CSV</button>} />
      {!list.data ? <LoadingList count={4} className="h-12" /> : <DataTable rows={list.data} columns={[
        { key: 'd', label: 'Date', render: (r) => new Date(r.at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) },
        { key: 'w', label: 'Auteur', render: (r) => <><b>{r.who}</b><span className="block text-xs text-ardoise">{r.role}</span></> },
        { key: 'a', label: 'Action', render: (r) => <code className="text-xs">{r.action}</code> },
        { key: 'x', label: 'Détail', render: (r) => <span className="text-ardoise">{r.detail}</span> },
        { key: 'o', label: 'Objet', render: (r) => r.object },
      ]} />}
    </>
  );
}
