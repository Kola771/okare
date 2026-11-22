/**
 * Médiathèque fictive (table `media`) : photos de plats, façades, photos reçues sur WhatsApp pas encore associées.
 * Champs en plus de la table (à ajouter au schéma en phase 2, voir design/ECARTS.md) : `review` (relecture des photos
 * envoyées par les vendeurs), `source`, `kind`, `fileName`, `sizeKb` ; `ownerId` null = photo pas encore associée.
 */
import type { Media } from '@/shared/types';
import { DISH_CATEGORIES } from './dish-categories';
import { DISHES } from './dishes';
import { isoDaysAgo, mockId, USER } from './ids';
import { POINTS_OF_SALE } from './points-of-sale';

export type MediaKind = 'DISH' | 'FACADE' | 'OTHER';

export interface MockMedia extends Omit<Media, 'ownerId'> {
  ownerId: string | null;
  fileName: string;
  kind: MediaKind;
  review: 'PENDING' | 'DONE';
  source: 'UPLOAD' | 'WHATSAPP';
  sizeKb: number;
}

let n = 0;
function media(p: Partial<MockMedia> & Pick<MockMedia, 'ownerType' | 'ownerId' | 'fileName' | 'kind'>): MockMedia {
  n += 1;
  return {
    id: mockId(10, n), sortOrder: 0, originalKey: `uploads/${p.fileName}`, variants: {}, width: 1200, height: 900,
    status: 'READY', rejectionReason: null, uploadedById: USER.agentGanhi, createdAt: isoDaysAgo((n * 7) % 75),
    deletedAt: null, review: 'DONE', source: 'UPLOAD', sizeKb: 60 + ((n * 37) % 70), ...p,
  };
}

const keyOf = (categoryId: string | null) => DISH_CATEGORIES.find((c) => c.id === categoryId)?.illustrationKey ?? 'riz';

const DISH_MEDIA = DISHES.slice(0, 16).map((d, i) => media({
  ownerType: 'DISH', ownerId: d.id, kind: 'DISH', fileName: `${d.slug}.webp`, variants: { card: `/plats/${keyOf(d.categoryId)}.svg` },
  ...(i % 6 === 3 ? { review: 'PENDING' as const } : {}), ...(i === 11 ? { status: 'PROCESSING' as const } : {}),
  ...(i === 14 ? { status: 'REJECTED' as const, rejectionReason: 'Photo floue' } : {}),
}));

const FACADE_MEDIA = POINTS_OF_SALE.map((p, i) => media({
  ownerType: 'POS', ownerId: p.id, kind: 'FACADE', fileName: `facade-${p.slug}.webp`, ...(i === 4 ? { review: 'PENDING' as const } : {}),
}));

const WHATSAPP_MEDIA = ['menu-photo.jpg', 'plat-du-jour.jpg', 'devanture.jpg', 'IMG-20261119.jpg'].map((fileName, i) => media({
  ownerType: 'POS', ownerId: null, kind: i === 2 ? 'FACADE' : 'OTHER', fileName, source: 'WHATSAPP', review: 'PENDING',
  status: i === 0 ? 'PROCESSING' : 'READY', createdAt: isoDaysAgo(i),
}));

export const MEDIA: MockMedia[] = [...DISH_MEDIA, ...FACADE_MEDIA, ...WHATSAPP_MEDIA];
