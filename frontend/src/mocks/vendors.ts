/** Vendeurs fictifs (titulaires). Chez Maman a 2 points ; La cuisine de Sènami est Particulier (un seul point). */
import type { Vendor } from '@/shared/types';
import { isoDaysAgo, mockId, POS, T0, USER } from './ids';

function vendor(n: number, displayName: string, contactName: string, contactPhone: string, userId: string | null,
  mainPosId: string, ageDays: number): Vendor {
  return {
    id: mockId(3, n), displayName, contactName, contactPhone, email: null, userId, followedById: USER.agentGanhi,
    notes: null, mainPosId, mainPosComputedAt: T0, firstPublishedAt: isoDaysAgo(ageDays),
    subscriptionNoticeAt: null, subscriptionRequiredFrom: null, createdById: USER.agentGanhi,
    createdAt: isoDaysAgo(ageDays), updatedAt: T0, deletedAt: null,
  };
}

export const VENDOR = {
  maman: mockId(3, 1), rose: mockId(3, 2), senami: mockId(3, 3), bio: mockId(3, 4), bonGout: mockId(3, 5),
  aiko: mockId(3, 6), benedicte: mockId(3, 7), palmier: mockId(3, 8), rachida: mockId(3, 9),
};

export const VENDORS: Vendor[] = [
  vendor(1, 'Chez Maman', 'Maman Afi', '+2290197000001', USER.vendorMaman, POS.mamanGanhi, 75),
  vendor(2, 'Tantie Rose', 'Rose Hounkpè', '+2290197000003', USER.vendorRose, POS.tantieRose, 50),
  vendor(3, 'La cuisine de Sènami', 'Sènami Dossou', '+2290197000005', USER.vendorSenami, POS.senami, 40),
  vendor(4, 'Le Coin de Bio', 'Bio Guéra', '+2290197000004', USER.vendorBio, POS.coinBio, 12),
  vendor(5, 'Le Bon Goût', 'Gérard Ahouansou', '+2290197000006', null, POS.bonGout, 64),
  vendor(6, 'Tantie Aïko', 'Aïko Zinsou', '+2290197000007', null, POS.tantieAiko, 33),
  vendor(7, 'Mama Bénédicte', 'Bénédicte Agossou', '+2290197000008', null, POS.etalBenedicte, 21),
  vendor(8, 'Le Palmier', 'Jean Akplogan', '+2290197000009', null, POS.palmier, 90),
  vendor(9, 'Chez Rachida', 'Rachida Bello', '+2290197000010', null, POS.rachida, 8),
];
