'use client';

/**
 * En-tête desktop (≥ 1024 px, coquille D1 à D8) : logo, zone, recherche « Chercher », liens,
 * puis « Se connecter » / « Créer un compte » ou avatar.
 */
import { Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { Logo } from '@/components/ui/Logo';
import { ZoneButton } from './ZonePicker';

function initials(name: string | null): string {
  if (!name) return '?';
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export function DesktopHeader() {
  const path = usePathname();
  const router = useRouter();
  const { me } = useSession();
  const [q, setQ] = useState('');
  useEffect(() => {
    setQ(new URLSearchParams(window.location.search).get('q') ?? '');
  }, [path]);

  const link = (href: string, label: string, active: boolean, muted = false) => (
    <Link href={href} className={`flex min-h-11 items-center px-3 text-sm no-underline ${
      active ? 'font-bold text-piment shadow-[inset_0_-2px_0_var(--color-piment)]' : `font-semibold ${muted ? 'text-ardoise' : 'text-charbon'}`}`}>
      {label}
    </Link>
  );

  return (
    <header className="relative z-[600] hidden flex-wrap items-center gap-3.5 border-b border-trait bg-white/95 px-8 py-3 lg:flex">
      <span className="mr-1.5"><Logo size={30} pin /></span>
      <ZoneButton variant="desktop" />
      <form role="search" className="flex min-h-[46px] max-w-[520px] flex-[1_1_300px] items-center gap-2.5 rounded-[14px] border border-bordure-douce bg-white pl-3.5 pr-1.5"
        onSubmit={(e) => { e.preventDefault(); router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/'); }}>
        <Search size={18} className="text-ardoise" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Un plat, un maquis, un quartier…" aria-label="Rechercher"
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none" />
        <button type="submit" className="rounded-[10px] bg-piment px-3.5 py-2 text-[13px] font-bold text-white">Chercher</button>
      </form>
      <nav aria-label="Principal" className="ml-auto flex items-center gap-0.5">
        {link('/', 'Accueil et carte', path === '/' || path.startsWith('/search'))}
        {link('/favorites', 'Favoris', path.startsWith('/favorites'))}
        {link('/seller', 'Tu vends à manger ?', false, true)}
      </nav>
      {me ? (
        <Link href="/account" aria-label="Mon compte"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-piment-pale text-sm font-extrabold text-piment-ink no-underline">
          {initials(me.fullName)}
        </Link>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/login" className="flex min-h-11 items-center px-3.5 text-sm font-semibold text-charbon no-underline">Se connecter</Link>
          <Link href="/login?signup=1" className="flex min-h-11 items-center rounded-[14px] bg-charbon px-[18px] text-sm font-bold text-white no-underline hover:text-white">
            Créer un compte
          </Link>
        </div>
      )}
    </header>
  );
}
