'use client';

/** Utilisateurs et rôles — CRUD complet : liste, création, édition, suppression, affectation de rôles, blocage. */
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createUser, deleteUser, errorMessage, listUsers, setUserBlocked, setUserRoles, updateUser, type AdminUserRow } from '@/lib/api';
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

export function ago(iso: string | null, now = Date.now()): string {
  if (!iso) return '—';
  const min = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (min < 60) return `il y a ${Math.max(1, min)} min`;
  if (min < 6 * 60) return `il y a ${Math.round(min / 60)} h`;
  if (min < 24 * 60) return 'aujourd\'hui';
  const d = Math.round(min / 1440);
  return d === 1 ? 'hier' : `il y a ${d} j`;
}

export function UsersScreen() {
  const toast = useToast();
  const list = useApi(listUsers, []);
  const [f, setF] = useState<F>('all');
  const [manage, setManage] = useState<AdminUserRow | null>(null);
  const [role, setRole] = useState<Role>('CLIENT');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);

  if (list.error) return <ErrorState message={list.error} onRetry={list.reload} />;
  if (list.loading || !list.data) return <LoadingList count={4} className="h-14" />;
  const rows = list.data.filter((u) => (f === 'all' ? true : f === 'blocked' ? u.blocked : u.roles.includes(f)));
  const done = (msg: string) => { toast(msg, 'success'); setManage(null); setFormOpen(false); setEditTarget(null); setDeleteTarget(null); void list.reload(); };

  const cols: Column<AdminUserRow>[] = [
    { key: 'n', label: 'Utilisateur', render: (u) => <span className="flex items-center gap-3"><Avatar name={u.name} />
      <span><b className="block">{u.name}</b><span className="text-xs text-ardoise">{u.phone}</span></span></span> },
    { key: 'e', label: 'E-mail', render: (u) => <span className="text-sm text-ardoise">{u.email || '—'}</span> },
    { key: 'r', label: 'Rôle', render: (u) => { const r = u.roles[0]; return r ? <Pill tone={ROLE_TONE[r]}>{ROLE_FR[r]}</Pill> : <Pill>—</Pill>; } },
    { key: 'l', label: 'Connexion', render: (u) => u.login },
    { key: 't', label: '2FA', render: (u) => (u.totp === '—' ? <Pill>—</Pill> : <Pill tone={u.totp === 'Activée' ? 'ok' : 'bad'}>{u.totp}</Pill>) },
    { key: 's', label: 'Périmètre', render: (u) => u.scope },
    { key: 'd', label: 'Activité', render: (u) => ago(u.lastSeen) },
    { key: 'a', label: '', render: (u) => (
      <span className="flex gap-2">
        <button type="button" className="text-sm font-semibold text-piment underline" onClick={() => { setEditTarget(u); setFormOpen(true); }}>Modifier</button>
        <button type="button" className="text-sm font-semibold text-piment underline" onClick={() => { setManage(u); setRole(u.roles[0] ?? 'CLIENT'); }}>Rôle</button>
        <button type="button" className="text-sm font-semibold text-erreur underline" onClick={() => setDeleteTarget(u)}>Supprimer</button>
      </span>
    ) },
  ];

  return (
    <>
      <div className="flex flex-col gap-2">
        <Crumbs items={['Administration', 'Utilisateurs et rôles']} />
        <PageHead title="Utilisateurs et rôles" sub="Tout le monde a un compte. Chaque personne a un seul rôle."
          actions={<button type="button" className={btn.primary} onClick={() => { setEditTarget(null); setFormOpen(true); }}><Plus size={16} /> Créer un utilisateur</button>} />
      </div>
      <Card title="Comptes" flush right={<span className="text-[13px] text-ardoise">{list.data.length} utilisateur{list.data.length > 1 ? 's' : ''}</span>}>
        <div className="px-5 pb-4">
          <FilterChips value={f} onChange={setF} options={[['all', 'Tous'], ['CLIENT', 'Clients'], ['VENDOR', 'Vendeurs'], ['FIELD_AGENT', 'Agents'], ['ADMIN', 'Admins'], ['blocked', 'Bloqués']]} />
        </div>
        <DataTable bare columns={cols} rows={rows} />
      </Card>
      <RoleRightsCard />

      {/* Sheet affectation de rôle */}
      <Sheet open={!!manage} onClose={() => setManage(null)} labelledBy="roles-title">
        <h2 id="roles-title" className="m-0 text-xl font-bold">{manage?.name}</h2>
        <p className="m-0 text-sm text-ardoise">Chaque utilisateur a un seul rôle. Réservé au super-admin.</p>
        {ROLES.map((r) => (
          <label key={r} className="flex items-center gap-3 text-[15px]"><input type="radio" name="user-role" checked={role === r} className="h-5 w-5 accent-piment"
            onChange={() => setRole(r)} />{ROLE_FR[r]}</label>))}
        <div className="flex justify-end gap-3">
          <button type="button" className={btn.secondary} onClick={() => manage && setUserBlocked(manage.id, !manage.blocked, 'Décision de l\'équipe')
            .then(() => done(manage.blocked ? 'Compte débloqué' : 'Compte bloqué')).catch((e) => toast(errorMessage(e), 'error'))}>
            {manage?.blocked ? 'Débloquer le compte' : 'Bloquer le compte'}</button>
          <button type="button" className={btn.primary} onClick={() => manage && setUserRoles(manage.id, [role]).then(() => done('Rôle mis à jour')).catch((e) => toast(errorMessage(e), 'error'))}>
            Enregistrer le rôle</button>
        </div>
      </Sheet>

      {/* Sheet création / édition */}
      <UserFormSheet open={formOpen} onClose={() => { setFormOpen(false); setEditTarget(null); }} target={editTarget} onDone={done} />

      {/* Sheet suppression */}
      <Sheet open={!!deleteTarget} onClose={() => setDeleteTarget(null)} labelledBy="delete-user-title" maxWidth="lg:max-w-[420px]">
        <h2 id="delete-user-title" className="m-0 text-xl font-bold">Supprimer l&apos;utilisateur</h2>
        <p className="m-0 text-[15px] text-ardoise">
          Tu es sur le point de supprimer le compte de <b>{deleteTarget?.name}</b>. Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" className={btn.secondary} onClick={() => setDeleteTarget(null)}>Annuler</button>
          <button type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-erreur px-4 text-sm font-bold text-white"
            onClick={() => deleteTarget && deleteUser(deleteTarget.id).then(() => done('Utilisateur supprimé')).catch((e) => toast(errorMessage(e), 'error'))}>
            Supprimer définitivement
          </button>
        </div>
      </Sheet>
    </>
  );
}

function UserFormSheet({ open, onClose, target, onDone }: {
  open: boolean; onClose: () => void; target: AdminUserRow | null; onDone: (msg: string) => void;
}) {
  const toast = useToast();
  const isEdit = target != null;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('CLIENT');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (target) {
      setName(target.name);
      setPhone(target.phone);
      setEmail(target.email);
      setRole(target.roles[0] ?? 'CLIENT');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setRole('CLIENT');
    }
  }, [open, target]);

  const valid = name.trim().length >= 2;

  async function handleSubmit() {
    if (!valid) return;
    setBusy(true);
    try {
      if (isEdit) {
        await updateUser(target.id, { fullName: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined, roles: [role] });
        onDone('Utilisateur modifié');
      } else {
        await createUser({ fullName: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined, roles: [role] });
        onDone('Utilisateur créé');
      }
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="user-form-title" maxWidth="lg:max-w-[480px]">
      <h2 id="user-form-title" className="m-0 text-xl font-bold">{isEdit ? `Modifier : ${target.name}` : 'Créer un utilisateur'}</h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-name" className="text-[13px] font-semibold text-encre">Nom complet *</label>
          <input id="user-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom et prénom"
            className="h-12 rounded-field border border-bordure-douce px-4 text-[15px]" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-phone" className="text-[13px] font-semibold text-encre">Téléphone</label>
          <input id="user-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+2290197000001"
            className="h-12 rounded-field border border-bordure-douce px-4 text-[15px]" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="user-email" className="text-[13px] font-semibold text-encre">E-mail</label>
          <input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nom@exemple.com"
            className="h-12 rounded-field border border-bordure-douce px-4 text-[15px]" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-encre">Rôle</span>
          <div className="flex flex-col gap-2">
            {ROLES.map((r) => (
              <label key={r} className="flex items-center gap-3 text-[15px]">
                <input type="radio" name="user-form-role" checked={role === r} className="h-5 w-5 accent-piment"
                  onChange={() => setRole(r)} />
                {ROLE_FR[r]}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className={btn.secondary} onClick={onClose}>Annuler</button>
        <button type="button" className={btn.primary} disabled={!valid || busy} onClick={handleSubmit}>
          {isEdit ? 'Enregistrer' : 'Créer l\'utilisateur'}
        </button>
      </div>
    </Sheet>
  );
}
