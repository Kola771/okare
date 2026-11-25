'use client';

/** Compte et profil — écran 13 (mobile). */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Me } from '@/lib/api';
import { useSession } from '@/components/providers/SessionProvider';
import { TextField } from '@/components/ui/Fields';
import { Sheet } from '@/components/ui/Sheet';
import { ContactsList } from './ContactsList';
import { DeleteAccountSheet } from './DeleteAccount';
import { ZonePickerSaving } from './ProfileSections';
import { useProfileSave } from './useProfile';

const box = 'flex flex-col rounded-2xl border border-trait bg-surface px-3.5 py-1';
const sep = <div className="h-px bg-trait" />;

function Row({ label, value, onClick, href }: { label: string; value?: string; onClick?: () => void; href?: string }) {
  const cls = 'flex min-h-12 w-full items-center justify-between text-left text-[15px] text-charbon no-underline';
  const inner = <><span>{label}</span><span className="text-ardoise">{value ? `${value} ›` : '›'}</span></>;
  return href ? <Link href={href} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

function Check({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-[52px] items-center justify-between gap-2.5 text-[15px]">
      <span>{label}{sub && <span className="block text-xs text-ardoise">{sub}</span>}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-[22px] w-[22px] shrink-0 accent-piment" />
    </label>
  );
}

export function AccountMobile({ me }: { me: Me }) {
  const router = useRouter();
  const { logout } = useSession();
  const { save, busy, errors } = useProfileSave();
  const [sheet, setSheet] = useState<'name' | 'zone' | 'contacts' | 'delete' | null>(null);
  const [name, setName] = useState(me.fullName ?? '');

  return (
    <div className="flex flex-col gap-3.5 px-5 py-[22px]">
      <div className="flex items-center gap-3.5">
        <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-piment-pale font-display text-[22px] font-extrabold text-piment-ink">
          {me.fullName ? me.fullName[0].toUpperCase() : '?'}
        </span>
        <div className="flex flex-col gap-0.5">
          <h1 className="m-0 font-display text-[22px] font-extrabold">{me.fullName ?? 'Mon compte'}</h1>
          <div className="text-sm text-ardoise">{me.phoneMasked} · connecté par téléphone</div>
        </div>
      </div>
      {!me.fullName && (
        <div className="flex items-center gap-2.5 rounded-[14px] bg-piment-soft px-3.5 py-3">
          <div className="flex-1 text-sm leading-snug text-piment-ink">Ajoute ton nom pour que les vendeurs sachent qui leur écrit.</div>
          <button type="button" onClick={() => setSheet('name')} className="min-h-10 rounded-[10px] bg-piment px-3 text-[13px] font-bold text-white">Ajouter</button>
        </div>
      )}
      <div className={box}>
        <div className="pb-1 pt-2.5 text-xs font-bold tracking-[1px] text-ardoise">PROFIL</div>
        <Row label="Nom complet" value={me.fullName ?? 'À compléter'} onClick={() => setSheet('name')} />{sep}
        <Row label="Ma zone habituelle" value={me.homeZoneName ?? 'Choisir'} onClick={() => setSheet('zone')} />{sep}
        <Row label="Mot de passe" value="Modifier" href="/login?forgot=1" />
      </div>
      <div className={box} id="notifications">
        <div className="pb-1 pt-2.5 text-xs font-bold tracking-[1px] text-ardoise">NOTIFICATIONS</div>
        <Check label="Plats du jour de mes favoris" sub="chaque matin vers 10h" checked={me.notifyFavorites} onChange={(v) => void save({ notifyFavorites: v })} />{sep}
        <Check label="Me demander si le vendeur a répondu" checked={me.askFollowUp} onChange={(v) => void save({ askFollowUp: v })} />
      </div>
      <div className={box}>
        <Row label="Mes derniers contacts" onClick={() => setSheet('contacts')} />{sep}
        <Row label={me.roles.includes('VENDOR') ? 'Mon espace vendeur' : 'Je suis vendeur : relier mon compte'} href={me.roles.includes('VENDOR') ? '/seller' : '/account/claim'} />{sep}
        <Row label="Aide · conditions · confidentialité" href="/account#aide" />
      </div>
      <div className="flex justify-between px-1">
        <button type="button" onClick={async () => { await logout(); router.push('/login'); }} className="text-sm font-bold text-charbon underline">Me déconnecter</button>
        <button type="button" onClick={() => setSheet('delete')} className="text-sm font-semibold text-red-700 underline">Supprimer mon compte</button>
      </div>

      <Sheet open={sheet === 'name'} onClose={() => setSheet(null)} labelledBy="name-title">
        <h2 id="name-title" className="m-0 font-display text-[22px] font-extrabold">Ton nom complet</h2>
        <TextField label="Nom complet" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Aïcha Houngbo" error={errors.fullName} autoFocus />
        <button type="button" disabled={busy} className="min-h-[52px] rounded-btn bg-piment font-bold text-white disabled:opacity-60"
          onClick={async () => { if (await save({ fullName: name.trim() })) setSheet(null); }}>Enregistrer</button>
      </Sheet>
      <ZonePickerSaving open={sheet === 'zone'} onClose={() => setSheet(null)} />
      <Sheet open={sheet === 'contacts'} onClose={() => setSheet(null)} labelledBy="contacts-title">
        <h2 id="contacts-title" className="m-0 font-display text-[22px] font-extrabold">Mes derniers contacts</h2>
        <ContactsList variant="list" />
      </Sheet>
      <DeleteAccountSheet open={sheet === 'delete'} onClose={() => setSheet(null)} />
    </div>
  );
}
