'use client';

/** Journal d'audit (DB10). Mediatheque (DB11) : media/MediaScreen. Menu Plus : more/MoreScreen. Parametres (DB12) : settings/SettingsScreen. */
import { listAudit } from '@/lib/api';
import { btn, PageHead } from '@/components/admin/AdminParts';
import { DataTable } from '@/components/admin/DataTable';
import { useApi } from '@/components/admin/useApi';
import { ErrorState, LoadingList } from '@/components/ui/States';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function AuditScreen() {
  const list = useApi(listAudit, []);
  if (list.error) return <ErrorState message={list.error} onRetry={list.reload} />;
  return (
    <>
      <PageHead title="Journal d'audit" sub="Toutes les actions de l'equipe et des vendeurs sur les donnees sensibles. Lecture seule, impossible a modifier." actions={<button type="button" className={btn.secondary}>Exporter CSV</button>} />
      {!list.data ? <LoadingList count={4} className="h-12" /> : <>
        {/* Mobile : cartes */}
        <div className="flex flex-col gap-2 md:hidden">
          {list.data.map((r) => (
            <div key={r.id} className="rounded-xl border border-[#E7E5E4] bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-charbon">{r.who}</p>
                  <p className="text-xs text-ardoise">{r.role}</p>
                </div>
                <span className="shrink-0 text-xs text-pierre">{fmtDate(r.at)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <code className="rounded bg-[#F5F5F4] px-1.5 py-0.5 text-xs text-charbon">{r.action}</code>
                <span className="text-xs font-medium text-ardoise">{r.object}</span>
              </div>
              {r.detail && <p className="mt-2 line-clamp-2 text-xs text-ardoise">{r.detail}</p>}
            </div>
          ))}
        </div>
        {/* Desktop : tableau */}
        <div className="hidden md:block">
          <DataTable rows={list.data} columns={[
            { key: 'd', label: 'Date', render: (r) => fmtDate(r.at) },
            { key: 'w', label: 'Auteur', render: (r) => <><b>{r.who}</b><span className="block text-xs text-ardoise">{r.role}</span></> },
            { key: 'a', label: 'Action', render: (r) => <code className="text-xs">{r.action}</code> },
            { key: 'x', label: 'Detail', render: (r) => <span className="text-ardoise">{r.detail}</span> },
            { key: 'o', label: 'Objet', render: (r) => r.object },
          ]} />
        </div>
      </>}
    </>
  );
}
