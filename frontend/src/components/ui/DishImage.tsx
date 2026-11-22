/**
 * Image d'un plat : vraie photo si elle existe (next/image, WebP, tailles fixées), sinon l'assiette dessinée
 * de sa catégorie (/plats/{key}.svg, servie telle quelle). Chargement différé sauf la première image (spec 0ter.5).
 */
import Image from 'next/image';

const KEYS = ['riz', 'pate', 'atassi', 'igname', 'spaghetti', 'aloko', 'attieke'];

export function dishIllustration(key: string | null | undefined): string {
  return `/plats/${key && KEYS.includes(key) ? key : 'riz'}.svg`;
}

interface Props {
  imageUrl?: string | null;
  illustrationKey?: string | null;
  alt: string;
  className?: string;
  /** Première image visible : chargée tout de suite. */
  priority?: boolean;
  closed?: boolean;
  /** Largeur d'affichage approximative (choix de la variante WebP). */
  sizes?: string;
}

export function DishImage({ imageUrl, illustrationKey, alt, className = '', priority = false, closed = false, sizes = '(max-width: 768px) 100vw, 400px' }: Props) {
  const src = closed ? '/plats/ferme.svg' : imageUrl ?? dishIllustration(illustrationKey);
  return (
    <Image src={src} alt={alt} width={400} height={300} sizes={sizes} priority={priority}
      unoptimized={src.endsWith('.svg') || src.startsWith('data:')} className={`block h-full w-full object-cover ${className}`} />
  );
}
