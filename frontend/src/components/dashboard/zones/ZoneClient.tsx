'use client';

/** Parties interactives de DB5 : carte chargée seulement ici (sans rendu serveur), bouton « Dessiner une zone ». */
import dynamic from 'next/dynamic';
import { btn } from '@/components/admin/AdminParts';
import { useToast } from '@/components/providers/ToastProvider';
import { Skeleton } from '@/components/ui/States';

export const ZonesMapLazy = dynamic(() => import('./ZonesMap'), { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-none" /> });

export function DrawZoneButton() {
  const toast = useToast();
  return (
    <button type="button" className={btn.secondary} onClick={() => toast('Dessin des contours sur la carte : prochaine étape (outil de dessin Leaflet).')}>
      Dessiner une zone
    </button>
  );
}

/** Pastille de catégorie : A piment, B maïs, C neutre (maquette DB5). */
export function CatPill({ code }: { code: 'A' | 'B' | 'C' }) {
  const cls = code === 'A' ? 'bg-piment-soft text-piment-dark' : code === 'B' ? 'bg-mais text-charbon' : 'bg-argile text-encre';
  return <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${cls}`}>{code}</span>;
}
