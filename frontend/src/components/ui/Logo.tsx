import Link from 'next/link';

/** Proportions de l'épingle OKARE (viewBox 316 × 428). */
const PIN_RATIO = 316 / 428;

/** Épingle OKARE (pin + bol fumant), décorative. `light` : version blanche pour fond piment. */
export function LogoPin({ height, light = false }: { height: number; light?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- petit SVG statique, next/image n'apporte rien ici
    <img src={light ? '/logos/okare-epingle-blanc.svg' : '/logos/okare-epingle.svg'} alt="" aria-hidden="true"
      width={Math.round(height * PIN_RATIO)} height={height} className="block shrink-0" />
  );
}

/** Logotype « okare » en Bricolage Grotesque 800, précédé de l'épingle si `pin`. */
export function Logo({ size = 28, light = false, href = '/', pin = false }: { size?: number; light?: boolean; href?: string | null; pin?: boolean }) {
  const cls = `inline-flex items-center gap-[0.22em] font-display font-extrabold tracking-[-0.5px] no-underline ${light ? 'text-white hover:text-white' : 'text-piment hover:text-piment'}`;
  const style = { fontSize: size, lineHeight: 1 };
  const content = <>{pin && <LogoPin height={Math.round(size * 1.05)} light={light} />}okare</>;
  if (!href) return <span className={cls} style={style}>{content}</span>;
  return <Link href={href} className={cls} style={style} aria-label="OKARE, accueil">{content}</Link>;
}
