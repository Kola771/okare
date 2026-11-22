'use client';

/** Boutons ronds posés sur la photo : retour, partager, favori (pages du point de vente et du plat). */
import { ArrowLeft, Heart, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useToast } from '@/components/providers/ToastProvider';

const round = 'flex h-11 w-11 items-center justify-center rounded-full bg-white text-charbon shadow-[0_1px_4px_rgba(28,25,23,0.18)]';

export function BackButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  return (
    <button type="button" aria-label="Retour" className={`${round} ${className}`}
      onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}>
      <ArrowLeft size={20} />
    </button>
  );
}

export function ShareButton({ title, path }: { title: string; path: string }) {
  const toast = useToast();
  return (
    <button type="button" aria-label="Partager" className={round}
      onClick={async () => {
        const url = `${window.location.origin}${path}`;
        try {
          if (navigator.share) await navigator.share({ title, url });
          else {
            await navigator.clipboard.writeText(url);
            toast('Lien copié : colle-le dans WhatsApp.', 'success');
          }
        } catch {
          /* partage annulé */
        }
      }}>
      <Share2 size={19} />
    </button>
  );
}

export function FavoriteButton({ posId, posName, label = 'Ajouter aux favoris' }: { posId: string; posName: string; label?: string }) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(posId);
  return (
    <button type="button" aria-pressed={fav} aria-label={fav ? 'Retirer des favoris' : label} className={`${round} text-piment`}
      onClick={() => toggle(posId, posName)}>
      <Heart size={19} className={fav ? 'fill-piment' : ''} />
    </button>
  );
}
