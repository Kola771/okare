import type { Metadata } from 'next';
import { ScreensIndex } from '@/components/demo/ScreensIndex';

export const metadata: Metadata = { title: 'Tous les écrans', robots: { index: false } };

/** Index de tous les écrans (revue de la maquette, phase 1). */
export default function PagesIndex() {
  return <ScreensIndex />;
}
