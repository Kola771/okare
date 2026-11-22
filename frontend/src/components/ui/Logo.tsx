import Link from 'next/link';

/** Logotype « okare » en Bricolage Grotesque 800. */
export function Logo({ size = 28, light = false, href = '/' }: { size?: number; light?: boolean; href?: string | null }) {
  const cls = `font-display font-extrabold tracking-[-0.5px] no-underline ${light ? 'text-white hover:text-white' : 'text-piment hover:text-piment'}`;
  const style = { fontSize: size, lineHeight: 1 };
  if (!href) return <span className={cls} style={style}>okare</span>;
  return <Link href={href} className={cls} style={style} aria-label="OKARE, accueil">okare</Link>;
}
