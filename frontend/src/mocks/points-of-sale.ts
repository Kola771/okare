/** Points de vente fictifs (Cotonou). Les positions sont réelles à quelques centaines de mètres près. */
import type { PosType } from '@/shared/enums';
import type { OpeningHours, PointOfSale, TimeRange } from '@/shared/types';
import { neighborhoodByName } from './geo';
import { isoDaysAgo, POS, T0, USER, ZONE } from './ids';
import { VENDOR } from './vendors';

const every = (days: string[], ranges: TimeRange[]): OpeningHours =>
  Object.fromEntries(days.map((d) => [d, ranges])) as OpeningHours;
const WEEK = ['1', '2', '3', '4', '5'];
const ALL = ['1', '2', '3', '4', '5', '6', '7'];

export const HOURS = {
  maquis: { ...every(WEEK, [['07:00', '15:00']]), '6': [['08:00', '14:00']] } as OpeningHours,
  resto: { ...every(WEEK, [['11:30', '15:00'], ['18:30', '23:00']]), '6': [['18:30', '23:30']] } as OpeningHours,
  maison: every(WEEK, [['10:00', '19:00']]),
  journee: every(ALL, [['10:00', '22:00']]),
  etal: every(ALL, [['06:00', '21:00']]),
  nuit: every(ALL, [['17:00', '01:00']]),
};

interface PosSeed {
  id: string; vendorId: string; slug: string; name: string; type: PosType; zoneId: string; neighborhood: string;
  lat: number; lng: number; landmark: string; whatsapp: string; hours: OpeningHours; description?: string;
  hasPublicPlace?: boolean; delivers?: boolean; acceptsMomo?: boolean; pricesCheckedDaysAgo?: number;
  publishedDaysAgo: number; ratingAvg?: number; ratingCount?: number; responseRate?: number;
}

const SEEDS: PosSeed[] = [
  { id: POS.mamanGanhi, vendorId: VENDOR.maman, slug: 'chez-maman-ganhi', name: 'Chez Maman · Ganhi', type: 'MAQUIS',
    zoneId: ZONE.GANHI, neighborhood: 'Ganhi', lat: 6.3581, lng: 2.4296, landmark: 'Derrière la BOA, à côté du kiosque MTN',
    whatsapp: '+2290197000001', hours: HOURS.maquis, acceptsMomo: true, pricesCheckedDaysAgo: 0, publishedDaysAgo: 75,
    ratingAvg: 4.6, ratingCount: 7, responseRate: 0.9,
    description: 'Cuisine familiale depuis 2009. Sauces maison, piment servi à part.' },
  { id: POS.mamanAkpakpa, vendorId: VENDOR.maman, slug: 'chez-maman-akpakpa', name: 'Chez Maman · Akpakpa', type: 'MAQUIS',
    zoneId: ZONE.AKPAKPA, neighborhood: 'Sègbèya', lat: 6.3662, lng: 2.4515, landmark: 'Marché de Sègbèya, entrée côté pharmacie',
    whatsapp: '+2290197000002', hours: HOURS.maquis, delivers: true, pricesCheckedDaysAgo: 3, publishedDaysAgo: 60 },
  { id: POS.tantieRose, vendorId: VENDOR.rose, slug: 'restaurant-tantie-rose', name: 'Restaurant Tantie Rose', type: 'RESTAURANT',
    zoneId: ZONE.CADJEHOUN, neighborhood: 'Cadjèhoun', lat: 6.3602, lng: 2.384, landmark: 'Face à la pharmacie Cadjèhoun',
    whatsapp: '+2290197000003', hours: HOURS.resto, acceptsMomo: true, pricesCheckedDaysAgo: 2, publishedDaysAgo: 50 },
  { id: POS.senami, vendorId: VENDOR.senami, slug: 'la-cuisine-de-senami', name: 'La cuisine de Sènami', type: 'PARTICULIER',
    zoneId: ZONE.AGLA, neighborhood: 'Agla', lat: 6.3818, lng: 2.3795, landmark: 'Livraison ou retrait sur rendez-vous',
    whatsapp: '+2290197000005', hours: HOURS.maison, hasPublicPlace: false, delivers: true, acceptsMomo: true,
    pricesCheckedDaysAgo: 1, publishedDaysAgo: 40 },
  { id: POS.coinBio, vendorId: VENDOR.bio, slug: 'le-coin-de-bio', name: 'Le Coin de Bio', type: 'MAQUIS',
    zoneId: ZONE.GBEGAMEY, neighborhood: 'Gbégamey', lat: 6.3703, lng: 2.4045, landmark: 'Carrefour Gbégamey, sous le manguier',
    whatsapp: '+2290197000004', hours: HOURS.etal, pricesCheckedDaysAgo: 16, publishedDaysAgo: 12 },
  { id: POS.bonGout, vendorId: VENDOR.bonGout, slug: 'maquis-le-bon-gout', name: 'Maquis Le Bon Goût', type: 'MAQUIS',
    zoneId: ZONE.GANHI, neighborhood: 'Ganhi', lat: 6.3612, lng: 2.4331, landmark: "Rue de l'hôtel du Port, porte bleue",
    whatsapp: '+2290197000006', hours: HOURS.journee, acceptsMomo: true, pricesCheckedDaysAgo: 1, publishedDaysAgo: 64 },
  { id: POS.tantieAiko, vendorId: VENDOR.aiko, slug: 'tantie-aiko', name: 'Tantie Aïko', type: 'PARTICULIER',
    zoneId: ZONE.CADJEHOUN, neighborhood: 'Cadjèhoun', lat: 6.3618, lng: 2.3871, landmark: 'Étal devant la maison jaune',
    whatsapp: '+2290197000007', hours: HOURS.etal, pricesCheckedDaysAgo: 0, publishedDaysAgo: 33 },
  { id: POS.etalBenedicte, vendorId: VENDOR.benedicte, slug: 'etal-mama-benedicte', name: 'Étal Mama Bénédicte', type: 'MAQUIS',
    zoneId: ZONE.GANHI, neighborhood: 'Xwlacodji', lat: 6.3569, lng: 2.4282, landmark: 'Sortie du marché, côté lagune',
    whatsapp: '+2290197000008', hours: HOURS.etal, pricesCheckedDaysAgo: 4, publishedDaysAgo: 21 },
  { id: POS.palmier, vendorId: VENDOR.palmier, slug: 'restaurant-le-palmier', name: 'Restaurant Le Palmier', type: 'RESTAURANT',
    zoneId: ZONE.HAIE_VIVE, neighborhood: 'Haie Vive', lat: 6.3546, lng: 2.3951, landmark: 'Haie Vive, à côté du supermarché',
    whatsapp: '+2290197000009', hours: HOURS.journee, acceptsMomo: true, pricesCheckedDaysAgo: 6, publishedDaysAgo: 90 },
  { id: POS.rachida, vendorId: VENDOR.rachida, slug: 'chez-rachida', name: 'Chez Rachida', type: 'MAQUIS',
    zoneId: ZONE.MISSEBO, neighborhood: 'Missébô', lat: 6.3676, lng: 2.4248, landmark: 'Derrière la station Total',
    whatsapp: '+2290197000010', hours: HOURS.nuit, pricesCheckedDaysAgo: 1, publishedDaysAgo: 8 },
];

export const POINTS_OF_SALE: PointOfSale[] = SEEDS.map((s, i) => ({
  id: s.id, vendorId: s.vendorId, slug: s.slug, name: s.name, description: s.description ?? null, type: s.type,
  status: 'PUBLISHED', version: 1, qrCode: ['K7M2QA', 'P4XH8N', 'R9TB3C', 'W2ZG6E', 'H5NC7Q', 'M3JV9U', 'T8KD2Y', 'B6RX4F', 'G9QW3M', 'N2PE7K'][i],
  zoneId: s.zoneId, neighborhoodId: neighborhoodByName(s.neighborhood).id,
  location: { lat: s.lat, lng: s.lng }, locationAccuracyM: 15,
  hasPublicPlace: s.hasPublicPlace ?? true,
  publicPoint: s.hasPublicPlace === false ? { lat: s.lat + 0.0019, lng: s.lng + 0.0019 } : null,
  landmark: s.landmark, whatsappPhone: s.whatsapp, whatsappVerifiedAt: T0, callPhone: null,
  openingHours: s.hours, hoursConfirmedAt: T0, holidayPolicy: 'UNKNOWN',
  servesOnSite: s.hasPublicPlace ?? true, servesTakeaway: true, delivers: s.delivers ?? false, deliveryZoneIds: [],
  acceptsCash: true, acceptsMomo: s.acceptsMomo ?? false, coverMediaId: null, vendorOffer: null,
  identityCheckedAt: s.type === 'PARTICULIER' ? T0 : null, kitchenVisitedAt: null,
  consentAt: isoDaysAgo(s.publishedDaysAgo), consentById: USER.agentGanhi,
  publishedAt: isoDaysAgo(s.publishedDaysAgo),
  pricesCheckedAt: s.pricesCheckedDaysAgo == null ? null : isoDaysAgo(s.pricesCheckedDaysAgo),
  responseRate: s.responseRate ?? null, ratingAvg: s.ratingAvg ?? null, ratingCount: s.ratingCount ?? 0,
  createdById: USER.agentGanhi, updatedById: null, createdAt: isoDaysAgo(s.publishedDaysAgo), updatedAt: T0, deletedAt: null,
}));
