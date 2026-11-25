/**
 * Briques des maquettes du dashboard : carte à en-tête (tableaux collés aux bords), fil d'Ariane, avatar, coche de tableau.
 */
import Link from 'next/link';

export function Card({ title, right, children, flush = false, className = '', id }: {
  title?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; flush?: boolean; className?: string; id?: string;
}) {
  return (
    <section id={id} className={`min-w-0 overflow-hidden rounded-2xl border border-trait bg-surface ${className}`}>
      {(title || right) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3.5 pt-5">
          {title && <h2 className="m-0 text-[17px] font-bold">{title}</h2>}{right}
        </div>
      )}
      <div className={flush ? '' : 'px-5 pb-5'}>{children}</div>
    </section>
  );
}

/** « Administration › Zones et carte » : chaque élément est un texte ou [texte, adresse]. */
export function Crumbs({ items }: { items: (string | [string, string])[] }) {
  return (
    <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-1 text-[13px] text-ardoise">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden>›</span>}
          {typeof it === 'string' ? <span>{it}</span> : <Link href={it[1]} className="text-ardoise no-underline hover:text-piment">{it[0]}</Link>}
        </span>
      ))}
    </nav>
  );
}

/** Pastille d'initiale (carré pour les comptes, rond pour les vendeurs). */
export function Avatar({ name, round = false }: { name: string; round?: boolean }) {
  const letter = name.replace(/[^\p{L}]/gu, '')[0]?.toUpperCase() ?? '?';
  return (
    <span aria-hidden className={`flex h-10 w-10 shrink-0 items-center justify-center bg-piment-pale text-[15px] font-extrabold text-piment-ink ${round ? 'rounded-full' : 'rounded-[10px]'}`}>
      {letter}
    </span>
  );
}

/** Cellule « ✓ », « — » ou texte (« ✓ ses zones ») des tableaux de droits. */
export function Mark({ v }: { v: string }) {
  if (v === '-') return <span className="text-pierre">—</span>;
  return <span>{v.startsWith('✓') ? <><span className="font-bold text-charbon">✓</span>{v.slice(1)}</> : v}</span>;
}
