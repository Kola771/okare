'use client';

/** /account — écran 13 (mobile) ; D7 « Mon profil » dans la coquille « Mon compte » (desktop). */
import { useState } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { useIsDesktop } from '@/components/ui/useMediaQuery';
import { AccountGate, AccountShell } from './AccountShell';
import { AccountMobile } from './AccountMobile';
import { DeleteAccountSheet } from './DeleteAccount';
import { InfoSection, PrefsSection, SecuritySection } from './ProfileSections';

function Completion({ done }: { done: number }) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-piment-pale bg-piment-soft px-5 py-4">
      <div className="flex-1">
        <b className="text-[15px] text-piment-ink">Profil complété à {done} %</b>
        <div className="text-[13px] text-piment-ink/80">Ajoute ton nom : les vendeurs répondent plus vite quand ils savent qui leur écrit.</div>
      </div>
      <div className="h-2 w-40 overflow-hidden rounded-full bg-surface"><div className="h-full bg-piment" style={{ width: `${done}%` }} /></div>
    </div>
  );
}

export function AccountScreen() {
  const isDesktop = useIsDesktop();
  const { me } = useSession();
  const [deleting, setDeleting] = useState(false);

  if (!isDesktop) return me ? <AccountMobile me={me} /> : <div className="px-5 py-[22px]"><AccountGate next="/account" /></div>;

  return (
    <AccountShell next="/account">
      {(user) => {
        const done = 20 + (user.fullName ? 40 : 0) + (user.email ? 20 : 0) + (user.homeZoneId ? 20 : 0);
        return (
          <>
            <div>
              <h1 className="m-0 font-display text-[32px] font-extrabold">Mon profil</h1>
              <div className="mt-1 text-[15px] text-ardoise">Ce que les vendeurs voient quand tu leur écris, et tes préférences.</div>
            </div>
            {done < 100 && <Completion done={done} />}
            <InfoSection me={user} />
            <PrefsSection me={user} />
            <SecuritySection me={user} onDelete={() => setDeleting(true)} />
            <p id="aide" className="m-0 text-[13px] text-ardoise">
              OKARE met en relation les clients et les vendeurs : il ne prépare ni ne vend les repas. Ton numéro n’est jamais transmis au vendeur : c’est toi qui lui écris.
            </p>
            <DeleteAccountSheet open={deleting} onClose={() => setDeleting(false)} />
          </>
        );
      }}
    </AccountShell>
  );
}
