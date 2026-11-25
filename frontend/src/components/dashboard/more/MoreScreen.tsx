'use client';

/**
 * Menu « Plus » du dashboard mobile : toutes les entrées du menu latéral (sauf celles déjà dans la barre du bas),
 * groupées par section, avec icône et flèche. Accès libre en phase 1 : mêmes entrées que l'en-tête (super-admin par défaut).
 */
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/components/providers/SessionProvider';
import { dashboardRoles, visibleSections } from '../DashboardShell';

const IN_BOTTOM_BAR = ['/dashboard', '/dashboard/points'];

export function MoreScreen() {
  const { me } = useSession();
  const sections = visibleSections(dashboardRoles(me))
    .map((s) => ({ ...s, items: s.items.filter((i) => !IN_BOTTOM_BAR.includes(i.href)) }))
    .filter((s) => s.items.length);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="m-0 font-display text-[26px] font-extrabold">Plus</h1>
      {sections.map((s) => (
        <section key={s.title} className="flex flex-col gap-2">
          <h2 className="m-0 px-1 text-[11px] font-bold tracking-[1px] text-pierre">{s.title}</h2>
          <div className="overflow-hidden rounded-2xl border border-trait bg-surface">
            {s.items.map((i) => (
              <Link key={i.href} href={i.href}
                className="flex min-h-[56px] items-center gap-3.5 border-t border-trait px-4 text-[15px] font-semibold text-charbon no-underline first:border-0 active:bg-surface-inset">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-inset text-ardoise"><i.icon size={18} /></span>
                <span className="flex-1">{i.label}</span>
                {i.badge ? <span className="rounded-full bg-piment px-2 py-0.5 text-[11px] font-bold text-white">{i.badge}</span> : null}
                <ChevronRight size={18} className="text-pierre" />
              </Link>))}
          </div>
        </section>
      ))}
    </div>
  );
}
