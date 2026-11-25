'use client';

/** Page /pages : tous les écrans, avec connexion de démonstration en un clic (phase 1 seulement). */
import { ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { demoLoginAs, type DemoRole } from '@/lib/api';
import { useSession } from '@/components/providers/SessionProvider';
import { Logo } from '@/components/ui/Logo';
import { SCREEN_GROUPS, type ScreenEntry } from './screens';

const ROLE_LABEL: Record<DemoRole, string> = {
  VISITOR: 'Visiteur', CLIENT: 'Client', VENDOR: 'Vendeur', FIELD_AGENT: 'Agent', ADMIN: 'Admin', SUPER_ADMIN: 'Super-admin',
};

export function ScreensIndex() {
  const router = useRouter();
  const { me, refresh } = useSession();
  const [busy, setBusy] = useState(false);
  const current: DemoRole = !me ? 'VISITOR'
    : me.roles.includes('SUPER_ADMIN') ? 'SUPER_ADMIN' : me.roles.includes('ADMIN') ? 'ADMIN'
    : me.roles.includes('FIELD_AGENT') ? 'FIELD_AGENT' : me.roles.includes('VENDOR') ? 'VENDOR' : 'CLIENT';

  async function open(s: ScreenEntry) {
    if (s.as && s.as !== current) {
      setBusy(true);
      await demoLoginAs(s.as);
      await refresh();
      setBusy(false);
    }
    router.push(s.href);
  }

  return (
    <div className="bg-motif min-h-dvh">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-6 px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><Logo size={34} /><h1 className="m-0 mt-2 font-display text-[28px] font-extrabold">Tous les écrans</h1>
            <p className="m-0 text-sm text-ardoise">Données fictives (phase 1). Un écran marqué d’un rôle te connecte avec un compte de démonstration.</p></div>
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-trait bg-surface p-1.5">
            {(Object.keys(ROLE_LABEL) as DemoRole[]).map((r) => (
              <button key={r} type="button" disabled={busy} onClick={async () => { setBusy(true); await demoLoginAs(r); await refresh(); setBusy(false); }}
                className={`min-h-9 rounded-xl px-3 text-[13px] font-semibold ${current === r ? 'bg-inverse text-on-inverse' : 'text-charbon'}`}>
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
        {SCREEN_GROUPS.map((g) => (
          <section key={g.title} className="flex flex-col gap-2">
            <h2 className="m-0 text-lg font-extrabold">{g.title}
              <span className="ml-2 text-sm font-semibold text-ardoise">{g.screens.filter((s) => s.ready).length} / {g.screens.length}</span></h2>
            <div className="overflow-hidden rounded-card border border-trait bg-surface">
              {g.screens.map((s) => (
                <button key={s.href} type="button" disabled={busy} onClick={() => open(s)}
                  className="flex min-h-12 w-full items-center gap-3 border-t border-trait px-4 py-2 text-left first:border-0 hover:bg-sable">
                  <span className="w-24 shrink-0 text-xs font-bold text-piment">{s.code}</span>
                  <span className="flex-1 text-sm font-semibold">{s.title}
                    <span className="block text-xs font-normal text-ardoise">{s.href}</span></span>
                  {s.as && <span className="hidden rounded-full bg-argile px-2 py-0.5 text-[11px] font-semibold sm:inline">{ROLE_LABEL[s.as]}</span>}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${s.ready ? 'bg-ok-soft text-ok' : 'bg-attention-soft text-attention'}`}>
                    {s.ready ? 'Prêt' : 'À faire'}</span>
                  <ExternalLink size={15} className="text-ardoise" />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
