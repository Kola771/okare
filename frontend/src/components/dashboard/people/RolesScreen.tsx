'use client';

/**
 * Rôles et permissions — DB7 : CRUD complet sur les rôles d'équipe,
 * affectation de permissions par case à cocher, création/édition/suppression fonctionnels.
 * Les rôles système (Client, Vendeur) sont en lecture seule. Les rôles d'équipe sont modifiables.
 */
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { errorMessage, getRolePermissions, listUsers, setRolePermission } from '@/lib/api';
import { btn, PageHead, Pill } from '@/components/admin/AdminParts';
import { Crumbs } from '@/components/admin/Card';
import { useApi } from '@/components/admin/useApi';
import { useToast } from '@/components/providers/ToastProvider';
import { Sheet } from '@/components/ui/Sheet';
import { ErrorState, LoadingList } from '@/components/ui/States';
import type { Role } from '@/shared/enums';
import type { Permission } from '@/shared/permissions';
import { PERM_GROUPS, ROLE_INFO } from './roles-data';
import { ROLE_FR } from './UsersScreen';

type RoleStatus = 'active' | 'pending' | 'archived';
const STATUS_LABEL: Record<RoleStatus, string> = { active: 'Actif', pending: 'En attente', archived: 'Archivé' };
const STATUS_TONE: Record<RoleStatus, 'ok' | 'warn' | 'neutral'> = { active: 'ok', pending: 'warn', archived: 'neutral' };
const ROLE_SCOPES = ['son compte', 'ses points', 'ses zones', 'toutes zones', 'tout'] as const;

interface CustomRole {
  id: string;
  name: string;
  desc: string;
  scope: string;
  status: RoleStatus;
  permissions: Set<Permission>;
}

interface CustomPerm {
  id: string;
  key: string;
  label: string;
  group: string;
}

type SelectedRole = { kind: 'system'; role: Role } | { kind: 'custom'; id: string };

let nextId = 1;

export function RolesScreen() {
  const toast = useToast();
  const table = useApi(getRolePermissions, []);
  const users = useApi(listUsers, []);

  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [customPerms, setCustomPerms] = useState<CustomPerm[]>([]);
  const [selected, setSelected] = useState<SelectedRole>({ kind: 'system', role: 'FIELD_AGENT' });
  const [draft, setDraft] = useState<Set<Permission>>(new Set());
  const [busy, setBusy] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<CustomRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomRole | null>(null);
  const [showAddPerm, setShowAddPerm] = useState(false);
  const [editPerm, setEditPerm] = useState<CustomPerm | null>(null);
  const [deletePermTarget, setDeletePermTarget] = useState<CustomPerm | null>(null);

  const systemGranted = useCallback((r: Role) =>
    new Set((Object.entries(table.data ?? {}) as [Permission, Role[]][]).filter(([, rs]) => rs.includes(r)).map(([p]) => p)),
  [table.data]);

  const selectedCustom = selected.kind === 'custom' ? customRoles.find((c) => c.id === selected.id) ?? null : null;
  const selectedSystem = selected.kind === 'system' ? selected.role : null;
  const isCustom = selected.kind === 'custom';
  const isTeam = isCustom || (selectedSystem != null && ROLE_INFO[selectedSystem].team);

  const mergedGroups = useMemo(() => {
    const groups = PERM_GROUPS.map((g) => ({
      title: g.title,
      items: g.items.map(([p, label]) => ({ key: p, label, customId: null as string | null })),
    }));
    for (const cp of customPerms) {
      const existing = groups.find((g) => g.title === cp.group);
      if (existing) {
        existing.items.push({ key: cp.key as Permission, label: cp.label, customId: cp.id });
      } else {
        groups.push({ title: cp.group, items: [{ key: cp.key as Permission, label: cp.label, customId: cp.id }] });
      }
    }
    return groups;
  }, [customPerms]);

  useEffect(() => {
    if (selectedSystem && table.data) setDraft(systemGranted(selectedSystem));
    else if (selectedCustom) setDraft(new Set(selectedCustom.permissions));
  }, [selectedSystem, selectedCustom, table.data, systemGranted]);

  if (table.error) return <ErrorState message={table.error} onRetry={table.reload} />;
  if (!table.data) return <LoadingList count={4} className="h-14" />;

  const displayName = isCustom ? (selectedCustom?.name ?? '') : ROLE_FR[selectedSystem!];
  const displayDesc = isCustom ? (selectedCustom?.desc ?? '') : ROLE_INFO[selectedSystem!].desc;
  const displayScope = isCustom ? (selectedCustom?.scope ?? 'ses zones') : ROLE_INFO[selectedSystem!].scope;
  const displayStatus: RoleStatus = isCustom ? (selectedCustom?.status ?? 'active') : 'active';
  const count = selectedSystem ? users.data?.filter((u) => u.roles.includes(selectedSystem)).length : 0;

  async function saveSystem() {
    if (!selectedSystem) return;
    const before = systemGranted(selectedSystem);
    const changes = PERM_GROUPS.flatMap((g) => g.items.map(([p]) => p)).filter((p) => before.has(p) !== draft.has(p));
    setBusy(true);
    try {
      for (const p of changes) await setRolePermission(selectedSystem, p, draft.has(p));
      toast(changes.length ? 'Permissions enregistrées' : 'Aucun changement', 'success');
      await table.reload();
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  function saveCustomPerms() {
    if (!selectedCustom) return;
    setCustomRoles((prev) => prev.map((c) => c.id === selectedCustom.id ? { ...c, permissions: new Set(draft) } : c));
    toast('Permissions enregistrées', 'success');
  }

  function openCreate() {
    setFormTarget(null);
    setFormOpen(true);
  }

  function openEditCustom(c: CustomRole) {
    setFormTarget(c);
    setFormOpen(true);
  }

  function handleFormSave(data: { name: string; desc: string; scope: string; status: RoleStatus }) {
    if (formTarget) {
      setCustomRoles((prev) => prev.map((c) => c.id === formTarget.id ? { ...c, ...data } : c));
      toast(`Rôle « ${data.name} » modifié`, 'success');
    } else {
      const id = `custom-${nextId++}`;
      const newRole: CustomRole = { id, ...data, permissions: new Set() };
      setCustomRoles((prev) => [...prev, newRole]);
      setSelected({ kind: 'custom', id });
      toast(`Rôle « ${data.name} » créé`, 'success');
    }
    setFormOpen(false);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setCustomRoles((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    if (selected.kind === 'custom' && selected.id === deleteTarget.id) {
      setSelected({ kind: 'system', role: 'FIELD_AGENT' });
    }
    toast(`Rôle « ${deleteTarget.name} » supprimé`, 'success');
    setDeleteTarget(null);
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Crumbs items={['Administration', 'Rôles et permissions']} />
        <PageHead title="Rôles et permissions" sub="Chaque rôle est un ensemble de permissions. Seul le super-admin modifie les rôles d’équipe."
          actions={<button type="button" className={btn.primary} onClick={openCreate}><Plus size={16} /> Nouveau rôle d&apos;équipe</button>} />
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)]">
        {/* ---- Liste des rôles ---- */}
        <section className="overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white">
          <h2 className="m-0 px-5 pb-3.5 pt-5 text-[17px] font-bold">Rôles</h2>
          {/* Rôles système */}
          {(Object.keys(ROLE_INFO) as Role[]).map((r) => {
            const ri = ROLE_INFO[r];
            const isSel = selected.kind === 'system' && selected.role === r;
            return (
              <div key={r}
                className={`flex items-center gap-2 border-t border-[#E7E5E4] px-4 py-3 ${isSel ? 'bg-piment-soft' : 'hover:bg-[#FAFAF9]'}`}>
                <button type="button" onClick={() => setSelected({ kind: 'system', role: r })} className="flex min-w-0 flex-1 flex-col text-left">
                  <b className="text-[15px]">{ROLE_FR[r]}</b>
                  <span className="text-xs text-ardoise">{ri.desc}</span>
                </button>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ri.team ? 'bg-piment-soft text-piment-dark' : 'bg-argile text-encre'}`}>
                    {ri.team ? 'équipe' : 'public'}
                  </span>
                  {ri.team && <>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelected({ kind: 'system', role: r }); setFormTarget({ id: r, name: ROLE_FR[r], desc: ri.desc, scope: ri.scope, status: 'active', permissions: new Set() }); setFormOpen(true); }}
                      aria-label={`Modifier ${ROLE_FR[r]}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ardoise hover:bg-argile hover:text-charbon">
                      <Pencil size={14} />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: r, name: ROLE_FR[r], desc: ri.desc, scope: ri.scope, status: 'active', permissions: new Set() }); }}
                      aria-label={`Supprimer ${ROLE_FR[r]}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ardoise hover:bg-erreur-soft hover:text-erreur">
                      <Trash2 size={14} />
                    </button>
                  </>}
                </div>
              </div>
            );
          })}
          {/* Rôles personnalisés */}
          {customRoles.map((c) => {
            const isSel = selected.kind === 'custom' && selected.id === c.id;
            return (
              <div key={c.id}
                className={`flex items-center gap-2 border-t border-[#E7E5E4] px-4 py-3 ${isSel ? 'bg-piment-soft' : 'hover:bg-[#FAFAF9]'}`}>
                <button type="button" onClick={() => setSelected({ kind: 'custom', id: c.id })} className="flex min-w-0 flex-1 flex-col text-left">
                  <b className="text-[15px]">{c.name}</b>
                  <span className="text-xs text-ardoise">{c.desc}</span>
                </button>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Pill tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Pill>
                  <button type="button" onClick={(e) => { e.stopPropagation(); openEditCustom(c); }}
                    aria-label={`Modifier ${c.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ardoise hover:bg-argile hover:text-charbon">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                    aria-label={`Supprimer ${c.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ardoise hover:bg-erreur-soft hover:text-erreur">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* ---- Panneau permissions ---- */}
        <section className="overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7E5E4] px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 className="m-0 text-[17px] font-bold">{displayName}{count ? ` · ${count} personne${count > 1 ? 's' : ''}` : ''}</h2>
              <Pill tone={STATUS_TONE[displayStatus]}>{STATUS_LABEL[displayStatus]}</Pill>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-piment-soft px-2.5 py-1 text-xs font-bold text-piment-dark">périmètre : {displayScope}</span>
              {isCustom && selectedCustom && (
                <button type="button" onClick={() => openEditCustom(selectedCustom)}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-[#E7E5E4] px-3 text-[13px] font-semibold text-charbon transition-colors hover:bg-argile">
                  <Pencil size={13} /> Modifier
                </button>
              )}
            </div>
          </div>
          {mergedGroups.map((g) => (
            <div key={g.title} className="border-b border-[#E7E5E4] px-5 py-4">
              <div className="mb-1 text-xs font-bold tracking-[1px] text-ardoise">{g.title}</div>
              {g.items.map((item) => (
                <div key={item.key} className="flex min-h-[42px] items-center gap-3">
                  <label className="flex flex-1 items-center justify-between gap-3 text-[15px]">{item.label}
                    <input type="checkbox" className="h-5 w-5 accent-piment" disabled={!isTeam} checked={draft.has(item.key as Permission)}
                      onChange={(e) => { const next = new Set(draft); if (e.target.checked) next.add(item.key as Permission); else next.delete(item.key as Permission); setDraft(next); }} />
                  </label>
                  {item.customId && isTeam && (
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button type="button" onClick={() => { const cp = customPerms.find((c) => c.id === item.customId); if (cp) { setEditPerm(cp); setShowAddPerm(true); } }}
                        aria-label={`Modifier ${item.label}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-ardoise hover:bg-argile hover:text-charbon">
                        <Pencil size={12} />
                      </button>
                      <button type="button" onClick={() => { const cp = customPerms.find((c) => c.id === item.customId); if (cp) setDeletePermTarget(cp); }}
                        aria-label={`Supprimer ${item.label}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-ardoise hover:bg-erreur-soft hover:text-erreur">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>))}
            </div>))}
          <div className="flex flex-col gap-3 px-5 py-4">
            <p className="m-0 text-[13px] text-ardoise">
              {isTeam
                ? 'Coche les permissions à accorder à ce rôle, puis enregistre.'
                : 'Les permissions des rôles publics (client, vendeur) sont fixes.'}
            </p>
            {isTeam && (
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btn.secondary} onClick={() => setShowAddPerm(true)}>
                  <Plus size={14} /> Ajouter une permission
                </button>
                <button type="button" className={btn.primary} disabled={busy}
                  onClick={isCustom ? saveCustomPerms : saveSystem}>
                  Enregistrer les permissions
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Sheet création / édition */}
      <RoleFormSheet open={formOpen} onClose={() => setFormOpen(false)} target={formTarget} onSave={handleFormSave} />

      {/* Sheet suppression */}
      <Sheet open={!!deleteTarget} onClose={() => setDeleteTarget(null)} labelledBy="delete-role-title" maxWidth="lg:max-w-[420px]">
        <h2 id="delete-role-title" className="m-0 text-xl font-bold">Supprimer le rôle</h2>
        <p className="m-0 text-[15px] text-ardoise">
          Tu es sur le point de supprimer le rôle <b>{deleteTarget?.name}</b> et toutes ses permissions.
          Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <button type="button"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-erreur px-4 text-sm font-bold text-white"
            onClick={confirmDelete}>
            Supprimer définitivement
          </button>
          <button type="button" className={btn.secondary} onClick={() => setDeleteTarget(null)}>Annuler</button>
        </div>
      </Sheet>

      {/* Sheet suppression de permission */}
      <Sheet open={!!deletePermTarget} onClose={() => setDeletePermTarget(null)} labelledBy="delete-perm-title" maxWidth="lg:max-w-[420px]">
        <h2 id="delete-perm-title" className="m-0 text-xl font-bold">Supprimer la permission</h2>
        <p className="m-0 text-[15px] text-ardoise">
          Tu es sur le point de supprimer la permission <b>{deletePermTarget?.label}</b> ({deletePermTarget?.key}).
        </p>
        <div className="flex gap-3">
          <button type="button"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-erreur px-4 text-sm font-bold text-white"
            onClick={() => { if (deletePermTarget) { setCustomPerms((prev) => prev.filter((c) => c.id !== deletePermTarget.id)); toast(`Permission « ${deletePermTarget.label} » supprimée`, 'success'); setDeletePermTarget(null); } }}>
            Supprimer
          </button>
          <button type="button" className={btn.secondary} onClick={() => setDeletePermTarget(null)}>Annuler</button>
        </div>
      </Sheet>

      {/* Sheet ajout / édition de permission */}
      <AddPermissionSheet open={showAddPerm} onClose={() => { setShowAddPerm(false); setEditPerm(null); }} roleName={displayName}
        target={editPerm}
        onSave={(data) => {
          if (editPerm) {
            setCustomPerms((prev) => prev.map((c) => c.id === editPerm.id ? { ...c, ...data } : c));
            toast(`Permission « ${data.label} » modifiée`, 'success');
          } else {
            const id = `perm-${Date.now()}`;
            setCustomPerms((prev) => [...prev, { id, ...data }]);
            toast(`Permission « ${data.label} » ajoutée`, 'success');
          }
          setShowAddPerm(false);
          setEditPerm(null);
        }} />
    </>
  );
}

function RoleFormSheet({ open, onClose, target, onSave }: {
  open: boolean;
  onClose: () => void;
  target: CustomRole | null;
  onSave: (data: { name: string; desc: string; scope: string; status: RoleStatus }) => void;
}) {
  const isEdit = target != null;
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [scope, setScope] = useState('ses zones');
  const [status, setStatus] = useState<RoleStatus>('active');

  useEffect(() => {
    if (!open) return;
    if (target) {
      setName(target.name);
      setDesc(target.desc);
      setScope(target.scope);
      setStatus(target.status);
    } else {
      setName('');
      setDesc('');
      setScope('ses zones');
      setStatus('active');
    }
  }, [open, target]);

  const valid = name.trim().length >= 2;

  return (
    <Sheet open={open} onClose={onClose} labelledBy="role-form-title" maxWidth="lg:max-w-[480px]">
      <h2 id="role-form-title" className="m-0 text-xl font-bold">{isEdit ? `Modifier : ${target.name}` : 'Nouveau rôle d’équipe'}</h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role-name" className="text-[13px] font-semibold text-encre">Nom du rôle *</label>
          <input id="role-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Modérateur"
            className="h-12 rounded-field border border-bordure-douce px-4 text-[15px]" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role-desc" className="text-[13px] font-semibold text-encre">Description</label>
          <input id="role-desc" type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Rôle et attribution"
            className="h-12 rounded-field border border-bordure-douce px-4 text-[15px]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="role-scope" className="text-[13px] font-semibold text-encre">Périmètre</label>
            <select id="role-scope" value={scope} onChange={(e) => setScope(e.target.value)}
              className="h-12 rounded-field border border-bordure-douce px-4 text-[15px]">
              {ROLE_SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="role-status" className="text-[13px] font-semibold text-encre">État</label>
            <select id="role-status" value={status} onChange={(e) => setStatus(e.target.value as RoleStatus)}
              className="h-12 rounded-field border border-bordure-douce px-4 text-[15px]">
              <option value="active">Actif</option>
              <option value="pending">En attente</option>
              <option value="archived">Archivé</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" className={btn.primary} disabled={!valid}
          onClick={() => onSave({ name: name.trim(), desc: desc.trim(), scope, status })}>
          {isEdit ? 'Enregistrer' : 'Créer le rôle'}
        </button>
        <button type="button" className={btn.secondary} onClick={onClose}>Annuler</button>
      </div>
    </Sheet>
  );
}

function AddPermissionSheet({ open, onClose, roleName, target, onSave }: {
  open: boolean; onClose: () => void; roleName: string;
  target?: CustomPerm | null;
  onSave: (data: { key: string; label: string; group: string }) => void;
}) {
  const isEdit = !!target;
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [group, setGroup] = useState(PERM_GROUPS[0].title);

  useEffect(() => {
    if (!open) return;
    if (target) {
      setKey(target.key);
      setLabel(target.label);
      setGroup(target.group);
    } else {
      setKey('');
      setLabel('');
      setGroup(PERM_GROUPS[0].title);
    }
  }, [open, target]);

  const valid = key.trim().length > 0 && label.trim().length > 0;

  return (
    <Sheet open={open} onClose={onClose} labelledBy="add-perm-title" maxWidth="lg:max-w-[420px]">
      <h2 id="add-perm-title" className="m-0 text-xl font-bold">{isEdit ? 'Modifier la permission' : 'Ajouter une permission'}</h2>
      <p className="m-0 text-[15px] text-ardoise">
        {isEdit ? <>Modification de la permission pour le r&ocirc;le <b>{roleName}</b>.</> : <>Nouvelle permission pour le r&ocirc;le <b>{roleName}</b>.</>}
      </p>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="perm-key" className="text-[13px] font-semibold text-encre">Cl&eacute; *</label>
          <input id="perm-key" type="text" value={key} onChange={(e) => setKey(e.target.value)}
            placeholder="Ex : pos.export"
            className="h-12 rounded-field border border-bordure-douce px-4 text-[15px]" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="perm-label" className="text-[13px] font-semibold text-encre">Libell&eacute; *</label>
          <input id="perm-label" type="text" value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex : Exporter les points de vente"
            className="h-12 rounded-field border border-bordure-douce px-4 text-[15px]" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="perm-group" className="text-[13px] font-semibold text-encre">Groupe</label>
          <select id="perm-group" value={group} onChange={(e) => setGroup(e.target.value)}
            className="h-12 rounded-field border border-bordure-douce px-4 text-[15px]">
            {PERM_GROUPS.map((g) => <option key={g.title} value={g.title}>{g.title}</option>)}
          </select>
        </div>
      </div>
      <button type="button" className={btn.primary} disabled={!valid}
        onClick={() => onSave({ key: key.trim(), label: label.trim(), group })}>
        {isEdit ? 'Enregistrer' : 'Ajouter la permission'}
      </button>
    </Sheet>
  );
}
