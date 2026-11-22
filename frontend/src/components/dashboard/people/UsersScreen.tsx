'use client';

/** Utilisateurs et rôles — DB6 : comptes (rôles cumulables, double authentification, périmètre, activité), droits par rôle. */
import { useState } from 'react';
import { errorMessage, listUsers, setUserBlocked, setUserRoles, type AdminUserRow } from '@/lib/api';
import { btn, PageHead, Pill } from '@/components/admin/AdminParts';
import { Avatar, Card, Crumbs } from '@/components/admin/Card';
import { DataTable, FilterChips, type Column } from '@/components/admin/DataTable';
import { useApi } from '@/components/admin/useApi';
import { useToast } from '@/components/providers/ToastProvider';
import { Sheet } from '@/components/ui/Sheet';
import { ErrorState, LoadingList } from '@/components/ui/States';
import { ROLES, type Role } from '@/shared/enums';
import { RoleRightsCard } from './RoleRightsCard';

export const ROLE_FR: Record<Role, string> = { CLIENT: 'Client', VENDOR: 'Vendeur', FIELD_AGENT: 'Agent terrain', ADMIN: 'Admin', SUPER_ADMIN: 'Super-admin' };
const ROLE_TONE: Record<Role, 'neutral' | 'ok' | 'piment' | 'warn'> = { CLIENT: 'neutral', VENDOR: 'ok', FIELD_AGENT: 'warn', ADMIN: 'warn', SUPER_ADMIN: 'piment' };
type F = 'all' | Role | 'blocked';

/** « il y a 2 min », « il y a 1 h », « hier », « il y a 3 j ». */
export function ago(iso: string | null, now = Date.now()): string {
  if (!iso) return '—';
  const min = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (min < 60) return `il y a ${Math.max(1, min)} min`;
  if (min < 6 * 60) return `il y a ${Math.round(min / 60)} h`;
  if (min < 24 * 60) return 'aujourd’hui';
  const d = Math.round(min / 1440);
  return d === 1 ? 'hier' : `il y a ${d} j`;
}

export function UsersScreen() {
  const toast = useToast();
  const list = useApi(listUsers, []);
  const [f, setF] = useState<F>('all');
  const [edit, setEdit] = useState<AdminUserRow | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  if (list.error) return <ErrorState message={list.error} onRetry={list.reload} />;
  if (list.loading || !list.data) return <LoadingList count={4} className="h-14" />;
  const rows = list.data.filter((u) => (f === 'all' ? true : f === 'blocked' ? u.blocked : u.roles.includes(f)));
  const done = (msg: string) => { toast(msg, 'success'); setEdit(null); void list.reload(); };

  const cols: Column<AdminUserRow>[] = [
    { key: 'n', label: 'Utilisateur', render: (u) => <span className="flex items-center gap-3"><Avatar name={u.name} />
      <span><b className="block">{u.name}</b><span className="text-xs text-ardoise">{u.contact}</span></span></span> },
    { key: 'r', label: 'Rôles', render: (u) => <span className="flex gap-1">{[...u.roles].reverse().map((r) => <Pill key={r} tone={ROLE_TONE[r]}>{ROLE_FR[r]}</Pill>)}</span> },
    { key: 'l', label: 'Connexion', render: (u) => u.login },
    { key: 't', label: 'Double authentification', render: (u) => (u.totp === '—' ? <Pill>—</Pill> : <Pill tone={u.totp === 'Activée' ? 'ok' : 'bad'}>{u.totp}</Pill>) },
    { key: 's', label: 'Périmètre', render: (u) => u.scope },
    { key: 'd', label: 'Dernière activité', render: (u) => ago(u.lastSeen) },
    { key: 'a', label: '', render: (u) => <button type="button" className="text-sm font-semibold text-piment underline" onClick={() => { setEdit(u); setRoles(u.roles); }}>Gérer</button> },
  ];

  return (
    <>
      <div className="flex flex-col gap-2">
        <Crumbs items={['Administration', 'Utilisateurs et rôles']} />
        <PageHead title="Utilisateurs et rôles" sub="Tout le monde a un compte. Une personne peut cumuler plusieurs rôles (ex. vendeur et client)."
          actions={<>
            <button type="button" className={btn.secondary} onClick={() => toast('Export CSV : branché avec le backend.')}>Exporter</button>
            <button type="button" className={btn.primary} onClick={() => toast('Invitation par lien à usage unique : branchée avec le backend.')}>+ Inviter un membre d’équipe</button>
          </>} />
      </div>
      <Card title="Comptes" flush right={<span className="text-[13px] text-ardoise">Données d’exemple</span>}>
        <div className="px-5 pb-4">
          <FilterChips value={f} onChange={setF} options={[['all', 'Tous'], ['CLIENT', 'Clients'], ['VENDOR', 'Vendeurs'], ['FIELD_AGENT', 'Agents'], ['ADMIN', 'Admins'], ['blocked', 'Bloqués']]} />
        </div>
        <DataTable bare columns={cols} rows={rows} />
      </Card>
      <RoleRightsCard />
      <Sheet open={!!edit} onClose={() => setEdit(null)} labelledBy="roles-title">
        <h2 id="roles-title" className="m-0 text-xl font-bold">{edit?.name}</h2>
        <p className="m-0 text-sm text-ardoise">Rôles cumulables. Réservé au super-admin ; jamais d’auto-attribution d’un rôle d’équipe.</p>
        {ROLES.map((r) => (
          <label key={r} className="flex items-center gap-3 text-[15px]"><input type="checkbox" checked={roles.includes(r)} className="h-5 w-5 accent-piment"
            onChange={(e) => setRoles(e.target.checked ? [...roles, r] : roles.filter((x) => x !== r))} />{ROLE_FR[r]}</label>))}
        <button type="button" className={btn.primary} onClick={() => edit && setUserRoles(edit.id, roles).then(() => done('Rôles mis à jour')).catch((e) => toast(errorMessage(e), 'error'))}>
          Enregistrer les rôles</button>
        <button type="button" className={btn.secondary} onClick={() => edit && setUserBlocked(edit.id, !edit.blocked, 'Décision de l’équipe')
          .then(() => done(edit.blocked ? 'Compte débloqué' : 'Compte bloqué')).catch((e) => toast(errorMessage(e), 'error'))}>
          {edit?.blocked ? 'Débloquer le compte' : 'Bloquer le compte'}</button>
      </Sheet>
    </>
  );
}
