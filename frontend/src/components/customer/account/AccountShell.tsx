'use client';

/**
 * Coquille « Mon compte » desktop (D3, D7) : carte profil avec 3 chiffres + navigation, contenu à droite.
 * Affiche une invitation à se connecter pour un visiteur.
 */
import { Bell, Heart, LogOut, MessageCircle, Store, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Me } from '@/lib/api';
import { useSession } from '@/components/providers/SessionProvider';
import { EmptyState, LoadingList } from '@/components/ui/States';

export const initials = (name: string | null) =>
  name ? name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() : '?';

export function sinceLabel(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(new Date(iso));
}

function Sidebar({ me }: { me: Me }) {
  const path = usePathname();
  const router = useRouter();
  const { logout } = useSession();
  const items = [
    { href: '/favorites', label: 'Favoris', Icon: Heart, count: me.stats.favorites, active: path === '/favorites' },
    { href: '/favorites#contacts', label: 'Derniers contacts', Icon: MessageCircle, active: false },
    { href: '/account', label: 'Mon profil', Icon: UserRound, active: path === '/account' },
    { href: '/account#notifications', label: 'Notifications', Icon: Bell, active: false },
  ];
  const stat = (n: number, label: string) => (
    <div className="rounded-xl bg-sable px-1 py-2.5"><div className="text-lg font-extrabold">{n}</div><div className="text-[11px] text-ardoise">{label}</div></div>
  );
  return (
    <aside className="flex w-[280px] shrink-0 flex-col gap-4">
      <div className="flex flex-col gap-3.5 rounded-[20px] border border-trait bg-surface p-5">
        <div className="flex items-center gap-3.5">
          <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-piment-pale text-xl font-extrabold text-piment-ink">{initials(me.fullName)}</span>
          <div className="min-w-0">
            <div className="truncate text-[17px] font-extrabold">{me.fullName ?? 'Mon compte'}</div>
            <div className="text-[13px] text-ardoise">{me.phoneMasked}</div>
            <div className="mt-0.5 text-xs text-ardoise">Sur OKARE depuis {sinceLabel(me.createdAt)}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {stat(me.stats.contacts, 'commandes')}{stat(me.stats.favorites, 'favoris')}{stat(me.stats.reviews, 'avis donnés')}
        </div>
      </div>
      <nav aria-label="Mon compte" className="flex flex-col gap-0.5 rounded-[20px] border border-trait bg-surface p-2">
        {items.map(({ href, label, Icon, count, active }) => (
          <Link key={href} href={href} className={`flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 text-sm no-underline ${
            active ? 'bg-piment-soft font-bold text-piment' : 'font-medium text-charbon'}`}>
            <Icon size={18} /><span className="flex-1">{label}</span>
            {count ? <span className="rounded-full bg-piment px-2 py-0.5 text-xs font-bold text-white">{count}</span> : null}
          </Link>
        ))}
        <div className="mx-2 my-1.5 h-px bg-trait" />
        <Link href={me.roles.includes('VENDOR') ? '/seller' : '/account/claim'} className="flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 text-sm text-charbon no-underline">
          <Store size={18} />{me.roles.includes('VENDOR') ? 'Espace vendeur' : 'Je suis vendeur'}
        </Link>
        <button type="button" onClick={async () => { await logout(); router.push('/login'); }}
          className="flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 text-left text-sm text-ardoise">
          <LogOut size={18} />Me déconnecter
        </button>
      </nav>
    </aside>
  );
}

/** Invitation à se connecter (visiteur) ou chargement. Renvoie null si le compte est prêt. */
export function AccountGate({ next }: { next: string }) {
  const { me, loading } = useSession();
  if (loading) return <LoadingList count={3} />;
  if (me) return null;
  return (
    <EmptyState title="Connecte-toi pour voir ton compte" text="Tes favoris, tes derniers contacts et tes préférences t’attendent."
      action={<Link href={`/login?next=${encodeURIComponent(next)}`} className="flex min-h-11 items-center rounded-btn bg-piment px-5 text-sm font-bold text-white no-underline">Me connecter</Link>} />
  );
}

export function AccountShell({ children, next }: { children: (me: Me) => React.ReactNode; next: string }) {
  const { me } = useSession();
  return (
    <div className="mx-auto flex w-full max-w-[1240px] items-start gap-7 p-8">
      {me && <Sidebar me={me} />}
      <main className="flex min-w-0 flex-1 flex-col gap-[22px]">{me ? children(me) : <AccountGate next={next} />}</main>
    </div>
  );
}
