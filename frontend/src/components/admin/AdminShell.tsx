'use client';

/**
 * Coquille « admin template » (VD1–VD9, DB1–DB12) : barre latérale à sections, en-tête (recherche, sélecteur,
 * notifications, avatar), fond gris clair. Sous 1024 px : titre en haut et barre de navigation en bas (mobile d'abord).
 */
import { Bell, Search, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  /** Préfixe d'adresse qui rend l'entrée active (défaut : href). */
  match?: string;
  exact?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

interface Props {
  tag: string;
  sections: NavSection[];
  mobileNav: NavItem[];
  aside?: React.ReactNode;
  headerExtra?: React.ReactNode;
  user: { initials: string; name: string; role: string };
  searchPlaceholder: string;
  children: React.ReactNode;
}

const isActive = (path: string, it: NavItem) => {
  const m = it.match ?? it.href;
  return it.exact ? path === m : path === m || path.startsWith(`${m}/`);
};

export function AdminShell({ tag, sections, mobileNav, aside, headerExtra, user, searchPlaceholder, children }: Props) {
  const path = usePathname();
  return (
    <div className="bg-motif flex min-h-dvh">
      <nav aria-label={`Menu ${tag.toLowerCase()}`}
        className="sticky top-0 hidden h-dvh w-[272px] shrink-0 flex-col gap-[18px] overflow-y-auto border-r border-trait bg-surface px-4 py-[22px] lg:flex">
        <Link href={mobileNav[0]?.href ?? '/'} className="flex items-baseline gap-2 px-2.5 no-underline">
          <span className="font-display text-[28px] font-extrabold tracking-[-0.5px] text-piment">okare</span>
          <span className="text-xs font-bold text-ardoise">{tag}</span>
        </Link>
        {sections.map((s) => (
          <div key={s.title} className="flex flex-col gap-0.5">
            <div className="px-2.5 pb-1.5 text-[11px] font-bold tracking-[1px] text-pierre">{s.title}</div>
            {s.items.map((it) => {
              const on = isActive(path, it);
              return (
                <Link key={it.href} href={it.href} aria-current={on ? 'page' : undefined}
                  className={`flex min-h-[42px] items-center gap-3 rounded-[10px] px-2.5 text-sm no-underline ${on ? 'bg-piment-soft font-bold text-piment' : 'font-medium text-charbon hover:bg-argile'}`}>
                  <it.icon size={18} /><span className="flex-1">{it.label}</span>
                  {it.badge ? <span className="rounded-full bg-piment px-2 py-0.5 text-[11px] font-bold text-white">{it.badge}</span> : null}
                </Link>
              );
            })}
          </div>
        ))}
        <div className="mt-auto flex flex-col gap-2">
          <ThemeToggle className="self-start" />
          {aside && <div className="rounded-[14px] bg-argile p-3.5 text-xs leading-normal text-ardoise">{aside}</div>}
        </div>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col pb-[76px] lg:pb-0">
        <header className="hidden flex-wrap items-center gap-3.5 border-b border-trait bg-surface px-7 py-3 lg:flex">
          <label className="flex min-h-11 max-w-[440px] flex-[1_1_260px] items-center gap-2.5 rounded-xl border border-trait px-3">
            <Search size={18} className="text-ardoise" />
            <input placeholder={searchPlaceholder} aria-label="Recherche" className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none" />
            <span className="rounded-md border border-trait px-1.5 py-0.5 text-xs text-pierre">Ctrl K</span>
          </label>
          <div className="flex-1" />
          {headerExtra}
          <ThemeToggle />
          <button type="button" aria-label="Notifications" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-trait">
            <Bell size={18} /><span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-[#F04438]" />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-piment-pale text-[15px] font-extrabold text-piment-ink">{user.initials}</span>
            <div className="text-[13px]"><div className="font-bold">{user.name}</div><div className="text-ardoise">{user.role}</div></div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-5 px-5 py-5 lg:px-7 lg:pb-8 lg:pt-6">{children}</main>
      </div>
      <nav aria-label={`Navigation ${tag.toLowerCase()}`}
        className="fixed inset-x-0 bottom-0 z-[500] flex justify-around border-t border-trait bg-surface pb-[max(14px,env(safe-area-inset-bottom))] pt-2 lg:hidden">
        {mobileNav.map((it) => {
          const on = isActive(path, it);
          return (
            <Link key={it.href} href={it.href} aria-current={on ? 'page' : undefined}
              className={`flex min-h-11 min-w-16 flex-col items-center justify-center gap-[3px] text-xs font-semibold no-underline ${on ? 'text-piment' : 'text-ardoise'}`}>
              <it.icon size={22} />{it.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
