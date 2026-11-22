'use client';

/** Sections du profil desktop (D7) : informations, préférences, notifications, connexion et sécurité. */
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Me } from '@/lib/api';
import { BudgetChips } from '@/components/customer/home/Filters';
import { ZonePicker } from '@/components/customer/layout/ZonePicker';
import { useViewer } from '@/components/providers/ViewerProvider';
import { Switch, TextField } from '@/components/ui/Fields';
import { initials } from './AccountShell';
import { useProfileSave } from './useProfile';

export function Card({ id, title, sub, children }: { id?: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-4 rounded-[20px] border border-trait bg-white p-6">
      <div><h2 className="m-0 text-lg font-extrabold">{title}</h2>{sub && <div className="mt-0.5 text-[13px] text-ardoise">{sub}</div>}</div>
      {children}
    </section>
  );
}

export function InfoSection({ me }: { me: Me }) {
  const { save, busy, errors } = useProfileSave();
  const { zones } = useViewer();
  const [fullName, setFullName] = useState(me.fullName ?? '');
  const [email, setEmail] = useState(me.email ?? '');
  const [zoneOpen, setZoneOpen] = useState(false);
  return (
    <Card title="Informations" sub="Ton nom et ton numéro apparaissent dans le message envoyé au vendeur.">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-piment-pale text-xl font-extrabold text-piment-ink">{initials(me.fullName)}</span>
        <span className="text-[13px] text-ardoise">Photo facultative.<br />Elle n’est jamais montrée publiquement.</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ex. Aïcha Houngbo"
          error={errors.fullName} hint={me.fullName ? undefined : 'À compléter'} />
        <TextField label="Téléphone" value={me.phoneMasked} readOnly hint={me.phoneVerified ? 'Vérifié. Pour le changer, contacte OKARE.' : 'Non vérifié'} />
        <TextField label="E-mail (facultatif)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" error={errors.email} />
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-encre">Zone habituelle</span>
          <button type="button" onClick={() => setZoneOpen(true)}
            className="flex min-h-[52px] items-center justify-between rounded-[14px] border border-bordure-douce px-3.5 text-left text-base">
            {zones.find((z) => z.id === me.homeZoneId)?.name ?? 'Choisir'} <span aria-hidden>▾</span>
          </button>
          <span className="text-xs text-ardoise">Utilisée quand ta position n’est pas disponible.</span>
        </div>
      </div>
      <ZonePickerSaving open={zoneOpen} onClose={() => setZoneOpen(false)} />
      <button type="button" disabled={busy} onClick={() => save({ fullName: fullName.trim() || undefined, email: email.trim() })}
        className="min-h-12 self-start rounded-btn bg-piment px-6 font-bold text-white disabled:opacity-60">
        {busy ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </Card>
  );
}

/** Choisir sa zone habituelle : met à jour l'affichage et le compte (User.homeZoneId). */
export function ZonePickerSaving({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { zoneId } = useViewer();
  const { save } = useProfileSave();
  const armed = useRef<string | null>(null);
  useEffect(() => {
    if (open) armed.current = zoneId;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (armed.current && zoneId && zoneId !== armed.current) {
      armed.current = null;
      void save({ homeZoneId: zoneId }, 'Zone habituelle enregistrée');
    }
  }, [zoneId, save]);
  return <ZonePicker open={open} onClose={onClose} />;
}

export function PrefsSection({ me }: { me: Me }) {
  const { save } = useProfileSave();
  const { budgetMax } = useViewer();
  const toggle = (key: 'notifyFavorites' | 'askFollowUp' | 'notifyNews', label: string, sub: string) => (
    <label className="flex items-center justify-between gap-4 border-t border-trait py-3 first:border-0">
      <span><b className="block text-[15px] font-semibold">{label}</b><span className="text-[13px] text-ardoise">{sub}</span></span>
      <Switch checked={me[key]} label={label} onChange={(v) => void save({ [key]: v })} />
    </label>
  );
  return (
    <>
      <Card title="Préférences" sub="Pour te montrer d’abord ce qui te convient.">
        <div className="flex flex-col gap-2"><span className="text-[13px] font-semibold text-encre">Budget habituel</span>
          <div className="flex flex-wrap gap-2"><BudgetChips variant="dark" /></div></div>
        <button type="button" onClick={() => save({ budgetMaxXof: budgetMax }, 'Budget habituel enregistré')}
          className="self-start text-sm font-bold text-piment">Garder ce budget dans mon compte</button>
      </Card>
      <Card id="notifications" title="Notifications">
        <div className="flex flex-col">
          {toggle('notifyFavorites', 'Plats du jour de mes favoris', 'Une notification vers 10h15, seulement s’ils ont publié.')}
          {toggle('askFollowUp', '« Le vendeur t’a répondu ? »', 'On te pose la question après chaque commande.')}
          {toggle('notifyNews', 'Nouveautés OKARE', 'Au plus une par mois.')}
        </div>
      </Card>
    </>
  );
}

export function SecuritySection({ me, onDelete }: { me: Me; onDelete: () => void }) {
  const row = (title: string, sub: string, action: React.ReactNode) => (
    <div className="flex items-center justify-between gap-4 border-t border-trait py-3 first:border-0">
      <span><b className="block text-[15px] font-semibold">{title}</b><span className="text-[13px] text-ardoise">{sub}</span></span>{action}
    </div>
  );
  return (
    <Card title="Connexion et sécurité" sub="Comment tu te connectes à OKARE.">
      <div className="flex flex-col">
        {row('Mot de passe', 'Oublié ? L’équipe OKARE vérifie par appel.', <Link href="/login?forgot=1" className="text-sm font-bold">Changer</Link>)}
        {row('Compte Google', me.hasGoogle ? 'Relié' : 'Non relié : relie-le pour te connecter en un geste', <span className="text-sm text-ardoise">Bientôt</span>)}
        {row('Supprimer mon compte', 'Tes favoris et ton historique seront effacés sous 30 jours.',
          <button type="button" onClick={onDelete} className="min-h-10 rounded-xl border border-red-300 px-4 text-sm font-bold text-red-700">Supprimer</button>)}
      </div>
    </Card>
  );
}
