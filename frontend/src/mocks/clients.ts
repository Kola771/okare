/** Favoris, contacts, suivis et avis fictifs (cliente de démonstration : Aïcha). */
import type { ContactEvent, ContactFollowUp, Favorite, Review } from '@/shared/types';
import { DISHES } from './dishes';
import { isoDaysAgo, mockId, POS, T0, USER, ZONE } from './ids';
import { POINTS_OF_SALE } from './points-of-sale';

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const FAVORITES: Favorite[] = [POS.tantieAiko, POS.bonGout, POS.mamanGanhi].map((posId) => ({
  userId: USER.clientAicha, posId, notifyDaily: true, createdAt: T0,
}));

function contact(n: number, posId: string, dishName: string | null, createdAt: string, userId = USER.clientAicha): ContactEvent {
  const pos = POINTS_OF_SALE.find((p) => p.id === posId)!;
  const dish = dishName ? DISHES.find((d) => d.posId === posId && d.name === dishName)! : null;
  return {
    id: mockId(7, n), posId, vendorId: pos.vendorId, userId, dishId: dish?.id ?? null,
    dishNameSnap: dish?.name ?? null, dishPriceSnap: dish?.priceXof ?? null, dishCategoryId: dish?.categoryId ?? null,
    channel: 'WHATSAPP', source: dish ? 'DISH_PAGE' : 'POS_PAGE', posZoneId: pos.zoneId, viewerZoneId: ZONE.GANHI,
    subscriptionId: null, deviceId: 'demo-device', ipHash: null, isCounted: true, notCountedReason: null, createdAt,
  };
}

export const CONTACTS: ContactEvent[] = [
  contact(1, POS.mamanGanhi, 'Riz sauce arachide + poisson', hoursAgo(2)),
  contact(2, POS.bonGout, 'Pâte rouge + poulet', hoursAgo(20)),
  contact(3, POS.tantieAiko, 'Atassi + friture', isoDaysAgo(2)),
  contact(4, POS.palmier, null, isoDaysAgo(5)),
];

export const FOLLOW_UPS: ContactFollowUp[] = [
  { contactId: mockId(7, 1), posId: POS.mamanGanhi, userId: USER.clientAicha, askDish: false, askCount: 0,
    askedAt: null, nextAskAt: null, answer: null, answeredAt: null },
  { contactId: mockId(7, 2), posId: POS.bonGout, userId: USER.clientAicha, askDish: false, askCount: 1,
    askedAt: hoursAgo(19), nextAskAt: null, answer: 'YES', answeredAt: hoursAgo(19) },
  { contactId: mockId(7, 3), posId: POS.tantieAiko, userId: USER.clientAicha, askDish: false, askCount: 1,
    askedAt: isoDaysAgo(2), nextAskAt: null, answer: 'YES', answeredAt: isoDaysAgo(2) },
  { contactId: mockId(7, 4), posId: POS.palmier, userId: USER.clientAicha, askDish: true, askCount: 1,
    askedAt: isoDaysAgo(5), nextAskAt: null, answer: 'NO', answeredAt: isoDaysAgo(5) },
];

const REVIEW_SEEDS: [number, string | null, number][] = [
  [5, 'Toujours aussi bon, la sauce arachide est parfaite.', 1],
  [4, 'Copieux, un peu d\'attente à midi.', 3],
  [5, 'Elle a répondu en 2 minutes sur WhatsApp. Top.', 6],
  [5, null, 8],
  [4, 'Bon rapport qualité-prix.', 12],
  [5, 'Le meilleur riz arachide de Ganhi.', 15],
  [4, 'Très bien, piment à part comme promis.', 20],
];

export const REVIEWS: Review[] = REVIEW_SEEDS.map(([rating, comment, days], i) => ({
  id: mockId(7, 100 + i), posId: POS.mamanGanhi, dishId: i % 2 === 0 ? DISHES[0].id : null,
  userId: USER.clientKoffi, contactId: mockId(7, 200 + i), rating, comment, status: 'PUBLISHED',
  hiddenReason: null, hiddenById: null,
  vendorReply: i === 2 ? 'Merci beaucoup, à bientôt chez Maman !' : null,
  vendorRepliedAt: i === 2 ? isoDaysAgo(days) : null, vendorRepliedById: i === 2 ? USER.vendorMaman : null,
  createdAt: isoDaysAgo(days), updatedAt: isoDaysAgo(days),
}));

/** Prénoms affichés sur les avis (en production : prénom du compte, jamais le téléphone). */
export const REVIEW_AUTHORS = ['Koffi', 'Mireille', 'Sèna', 'Ibrahim', 'Aïcha', 'Romuald', 'Fifamè'];
