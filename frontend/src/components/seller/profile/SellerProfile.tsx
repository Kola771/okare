'use client';

/** Profil vendeur — écran 16 (mobile) et VD6 (desktop) : infos du compte, mot de passe, notifications, agent qui le suit. */
import { LogOut, Phone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { errorMessage, updateVendorProfile, type VendorHome } from '@/lib/api';
import { btn, PageHead, Panel } from '@/components/admin/AdminParts';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Switch, TextField } from '@/components/ui/Fields';

export function SellerProfile({ home }: { home: VendorHome }) {
  const router = useRouter();
  const toast = useToast();
  const { me, logout } = useSession();
  const [name, setName] = useState(home.displayName);
  const [notif, setNotif] = useState({ evening: true, reminder: true });

  return (
    <>
      <PageHead kicker={<span className="hidden lg:inline">Espace vendeur › Profil</span>} title="Profil"
        sub={`${home.contactName ?? home.displayName} · vendeur depuis ${home.vendorAgeDays} jours · ${home.points.length} point${home.points.length > 1 ? 's' : ''} de vente`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Mes infos">
          <TextField label="Nom affiché" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Téléphone personnel" value={me?.phoneMasked ?? ''} readOnly hint="Pour le changer, contacte ton agent." />
          <div className="flex flex-wrap justify-between gap-2">
            <Link href="/login?forgot=1" className={btn.secondary}>Changer le mot de passe</Link>
            <button type="button" className={btn.primary} disabled={name === home.displayName}
              onClick={() => updateVendorProfile({ displayName: name }).then(() => { toast('Enregistré', 'success'); router.refresh(); })
                .catch((e) => toast(errorMessage(e), 'error'))}>Enregistrer</button>
          </div>
        </Panel>
        <Panel title="Notifications">
          <label className="flex min-h-12 items-center justify-between gap-3 text-[15px]"><span>Résumé du soir<span className="block text-xs text-ardoise">contacts de la journée, vers 18h</span></span>
            <Switch checked={notif.evening} onChange={(x) => setNotif({ ...notif, evening: x })} label="Résumé du soir" /></label>
          <label className="flex min-h-12 items-center justify-between gap-3 text-[15px]"><span>Rappel plat du jour<span className="block text-xs text-ardoise">si rien n’est publié à 9h</span></span>
            <Switch checked={notif.reminder} onChange={(x) => setNotif({ ...notif, reminder: x })} label="Rappel plat du jour" /></label>
        </Panel>
      </div>
      <Panel title={`Ton agent OKARE : ${home.agentName ?? 'à venir'}`}
        sub="Ton agent peut t’aider à créer ou mettre à jour tes points de vente. Tu peux aussi lui envoyer ton menu sur WhatsApp.">
        <div className="flex flex-wrap gap-2">
          <a href="tel:+2290190000003" className={btn.secondary}><Phone size={16} /> Appeler l’agent</a>
          <a href="https://wa.me/2290190000003" target="_blank" rel="noopener noreferrer" className={btn.secondary}>WhatsApp de l’agent</a>
          <button type="button" className={`${btn.secondary} text-ardoise`} onClick={async () => { await logout(); router.push('/login'); }}>
            <LogOut size={16} /> Me déconnecter</button>
        </div>
      </Panel>
    </>
  );
}
