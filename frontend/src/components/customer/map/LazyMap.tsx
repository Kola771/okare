'use client';

/** Leaflet a besoin de `window` : la carte est chargée seulement côté navigateur. */
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/States';

export const LazyMap = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});
