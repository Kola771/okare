'use client';

/**
 * Rôles et permissions — DB7 : liste des rôles à gauche, permissions du rôle choisi à droite (par groupe),
 * enregistrées d'un coup. Les rôles publics (client, vendeur) sont fixes.
 */
import { useEffect, useState } from 'react';
import { errorMessage, getRolePermissions, listUsers, setRolePermission } from '@/lib/api';
import { btn, PageHead } from '@/components/admin/AdminParts';
import { Crumbs } from '@/components/admin/Card';
import { useApi } from '@/components/admin/useApi';
import { useToast } from '@/components/providers/ToastProvider';
import { ErrorState, LoadingList } from '@/components/ui/States';
import type { Role } from '@/shared/enums';
import type { Permission } from '@/shared/permissions';
import { PERM_GROUPS, ROLE_INFO } from './roles-data';
import { ROLE_FR } from './UsersScreen';

export function RolesScreen() {
  const toast = useToast();
  const table = useApi(getRolePermissions, []);
  const users = useApi(listUsers, []);
  const [role, setRole] = useState<Role>('FIELD_AGENT');
  const [draft, setDraft] = useState<Set<Permission>>(new Set());
  const [busy, setBusy] = useState(false);
  const granted = (r: Role) => new Set((Object.entries(table.data ?? {}) as [Permission, Role[]][]).filter(([, rs]) => rs.includes(r)).map(([p]) => p));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (table.data) setDraft(granted(role)); }, [table.data, role]);
  if (table.error) return <ErrorState message={table.error} onRetry={table.reload} />;
  if (!table.data) return <LoadingList count={4} className="h-14" />;
  const info = ROLE_INFO[role];
  const count = users.data?.filter((u) => u.roles.includes(role)).length;

  async function save() {
    const before = granted(role);
    const changes = PERM_GROUPS.flatMap((g) => g.items.map(([p]) => p)).filter((p) => before.has(p) !== draft.has(p));
    setBusy(true);
    try {
      for (const p of changes) await setRolePermission(role, p, draft.has(p));
      toast(changes.length ? 'Permissions enregistrées' : 'Aucun changement', 'success');
      await table.reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Crumbs items={['Administration', 'Rôles et permissions']} />
        <PageHead title="Rôles et permissions" sub="Chaque rôle est un ensemble de permissions. Seul le super-admin modifie les rôles d’équipe."
          actions={<button type="button" className={btn.primary} onClick={() => toast('Rôles d’équipe personnalisés : branchés avec le backend.')}>+ Nouveau rôle d’équipe</button>} />
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)]">
        <section className="overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white">
          <h2 className="m-0 px-5 pb-3.5 pt-5 text-[17px] font-bold">Rôles</h2>
          {(Object.keys(ROLE_INFO) as Role[]).map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)} aria-pressed={r === role}
              className={`flex w-full items-center justify-between gap-3 border-t border-[#E7E5E4] px-4 py-3 text-left ${r === role ? 'bg-piment-soft' : 'hover:bg-[#FAFAF9]'}`}>
              <span><b className="block text-[16px]">{ROLE_FR[r]}</b><span className="text-xs text-ardoise">{ROLE_INFO[r].desc}</span></span>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${ROLE_INFO[r].team ? 'bg-piment-soft text-piment-dark' : 'bg-argile text-encre'}`}>
                {ROLE_INFO[r].team ? 'équipe' : 'public'}</span>
            </button>))}
        </section>
        <section className="overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7E5E4] px-5 py-4">
            <h2 className="m-0 text-[17px] font-bold">{ROLE_FR[role]}{count != null ? ` · ${count} personne${count > 1 ? 's' : ''}` : ''}</h2>
            <span className="rounded-full bg-piment-soft px-2.5 py-1 text-xs font-bold text-piment-dark">périmètre : {info.scope}</span>
          </div>
          {PERM_GROUPS.map((g) => (
            <div key={g.title} className="border-b border-[#E7E5E4] px-5 py-4">
              <div className="mb-1 text-xs font-bold tracking-[1px] text-ardoise">{g.title}</div>
              {g.items.map(([p, label]) => (
                <label key={p} className="flex min-h-[42px] items-center justify-between gap-3 text-[15px]">{label}
                  <input type="checkbox" className="h-5 w-5 accent-piment" disabled={!info.team} checked={draft.has(p)}
                    onChange={(e) => { const next = new Set(draft); if (e.target.checked) next.add(p); else next.delete(p); setDraft(next); }} />
                </label>))}
            </div>))}
          <div className="flex flex-col items-start gap-3 px-5 py-4">
            <p className="m-0 text-[13px] text-ardoise">Les permissions publiques (client, vendeur) sont fixes. Toute modification est inscrite au journal d’audit.</p>
            {info.team && <button type="button" className={btn.primary} disabled={busy} onClick={save}>Enregistrer</button>}
          </div>
        </section>
      </div>
    </>
  );
}
