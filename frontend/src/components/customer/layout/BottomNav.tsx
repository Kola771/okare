'use client';

/** Navigation basse mobile à 4 onglets (< 1024 px) : Accueil, Carte, Favoris, Compte. */
import { Heart, Home, Map, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Accueil', Icon: Home },
  { href: '/map', label: 'Carte', Icon: Map },
  { href: '/favorites', label: 'Favoris', Icon: Heart },
  { href: '/account', label: 'Compte', Icon: User },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-[500] flex justify-around border-t border-trait bg-surface pb-[max(14px,env(safe-area-inset-bottom))] pt-2 lg:hidden">
      {TABS.map(({ href, label, Icon }) => {
        const active = href === '/' ? path === '/' : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 min-w-16 flex-col items-center justify-center gap-[3px] text-xs font-semibold no-underline ${
              active ? 'text-piment' : 'text-ardoise hover:text-charbon'}`}>
            <Icon size={22} strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
