/**
 * Création d'un point de vente — POST /vendors (équipe) + POST /pos (12.1). Publié immédiatement, sans validation.
 * Règles : zone calculée depuis la position (POS_OUTSIDE_ZONES), Particulier = un seul point (409 PARTICULIER_SINGLE_POS),
 * consentement obligatoire, doublon possible = simple avertissement.
 */
import 'server-only';
import { storePhoto } from './admin-media';
import { db } from '@/mocks';
import { slugify } from '@/shared/format';
import type { PosType } from '@/shared/enums';
import type { OpeningHours } from '@/shared/types';
import { ApiError, ERR } from '../errors';
import { audit } from './mock/manage';
import { newId, persist, requireUser, simulate } from './mock/runtime';
import { distanceM } from './mock/views';

export interface NewPosInput {
  /** Vendeur existant (équipe) ; sinon le vendeur du compte, créé au besoin. */
  vendorId?: string;
  contactName: string;
  contactPhone: string;
  name: string;
  type: PosType;
  lat: number;
  lng: number;
  accuracyM?: number;
  landmark: string;
  hasPublicPlace: boolean;
  whatsappPhone: string;
  openingHours: OpeningHours;
  servesOnSite: boolean;
  servesTakeaway: boolean;
  delivers: boolean;
  acceptsMomo: boolean;
  consent: boolean;
  /** Photo de l'entrée (facultative), compressée sur l'appareil. */
  facadePhoto?: string | null;
  /** Autres photos (intérieur, plats…), 5 au plus. */
  otherPhotos?: string[];
  /** Créé depuis le dashboard (accès libre en phase 1 ; en phase 2, déduit du rôle du compte). */
  byTeam?: boolean;
}

function zoneAt(lat: number, lng: number) {
  return db.zones.find((z) => {
    const ring = z.boundary?.[0][0];
    if (!ring) return false;
    const xs = ring.map((p) => p[0]);
    const ys = ring.map((p) => p[1]);
    return lng >= Math.min(...xs) && lng <= Math.max(...xs) && lat >= Math.min(...ys) && lat <= Math.max(...ys);
  });
}

/** Points proches (< 50 m) au nom proche ou au même WhatsApp : « Ce point existe peut-être déjà ». */
export function checkDuplicates(input: { name: string; lat: number; lng: number; whatsappPhone: string }): Promise<string[]> {
  return simulate(() => db.pointsOfSale.filter((p) => !p.deletedAt && (p.whatsappPhone === input.whatsappPhone
    || (distanceM(p.location, input) < 50 && slugify(p.name).includes(slugify(input.name).slice(0, 6))))).map((p) => p.name));
}

export function createPos(input: NewPosInput): Promise<{ id: string; slug: string }> {
  return simulate(() => {
    const user = requireUser();
    if (!input.consent) throw new ApiError(ERR.VALIDATION, 'Coche l’accord du vendeur pour publier.', 400, { consent: 'Obligatoire.' });
    if (input.name.trim().length < 2) throw new ApiError(ERR.VALIDATION, 'Nom du point de vente trop court.', 400, { name: '2 caractères au moins.' });
    const zone = zoneAt(input.lat, input.lng);
    if (!zone) throw new ApiError('POS_OUTSIDE_ZONES', 'Cette position est hors des zones couvertes par OKARE.', 400);
    const now = new Date().toISOString();
    let vendor = input.vendorId ? db.vendors.find((v) => v.id === input.vendorId) : db.vendors.find((v) => v.userId === user.id);
    if (!vendor) {
      vendor = { id: newId(), displayName: input.name.trim(), contactName: input.contactName || null, contactPhone: input.contactPhone,
        email: null, userId: user.roles.some((r) => r === 'FIELD_AGENT' || r === 'ADMIN' || r === 'SUPER_ADMIN') ? null : user.id,
        followedById: null, notes: null, mainPosId: null, mainPosComputedAt: null, firstPublishedAt: null, subscriptionNoticeAt: null,
        subscriptionRequiredFrom: null, createdById: user.id, createdAt: now, updatedAt: now, deletedAt: null };
      db.vendors.push(vendor);
    }
    const existing = db.pointsOfSale.filter((p) => p.vendorId === vendor!.id && !p.deletedAt);
    if (existing.length && (input.type === 'PARTICULIER' || existing.some((p) => p.type === 'PARTICULIER'))) {
      throw new ApiError('PARTICULIER_SINGLE_POS', 'Un vendeur Particulier n’a qu’un seul point de vente.', 409);
    }
    let slug = slugify(input.name);
    if (db.pointsOfSale.some((p) => p.slug === slug)) slug = `${slug}-${zone.code.toLowerCase().replace('_', '-')}`;
    const id = newId();
    const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    const qr = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    const angle = Math.random() * 2 * Math.PI;
    db.pointsOfSale.push({
      id, vendorId: vendor.id, slug, name: input.name.trim(), description: null, type: input.type, status: 'PUBLISHED', version: 1, qrCode: qr,
      zoneId: zone.id, neighborhoodId: db.neighborhoods.find((n) => n.zoneId === zone.id)?.id ?? null,
      location: { lat: input.lat, lng: input.lng }, locationAccuracyM: input.accuracyM ?? null, hasPublicPlace: input.hasPublicPlace,
      publicPoint: input.hasPublicPlace ? null : { lat: input.lat + 0.003 * Math.sin(angle), lng: input.lng + 0.003 * Math.cos(angle) },
      landmark: input.landmark || null, whatsappPhone: input.whatsappPhone, whatsappVerifiedAt: null, callPhone: null,
      openingHours: input.openingHours, hoursConfirmedAt: now, holidayPolicy: 'UNKNOWN', servesOnSite: input.servesOnSite,
      servesTakeaway: input.servesTakeaway, delivers: input.delivers, deliveryZoneIds: [], acceptsCash: true, acceptsMomo: input.acceptsMomo,
      coverMediaId: null, vendorOffer: null, identityCheckedAt: null, kitchenVisitedAt: null, consentAt: now, consentById: user.id,
      publishedAt: now, pricesCheckedAt: now, responseRate: null, ratingAvg: null, ratingCount: 0, createdById: user.id, updatedById: null,
      createdAt: now, updatedAt: now, deletedAt: null,
    });
    // Photos facultatives : envoyées par l'équipe → publiées ; par le vendeur → relues avant publication.
    const trusted = !!input.byTeam || user.roles.some((r) => r === 'FIELD_AGENT' || r === 'ADMIN' || r === 'SUPER_ADMIN');
    if (input.facadePhoto) storePhoto(id, 'FACADE', input.facadePhoto, `facade-${slug}.jpg`, user.id, trusted);
    (input.otherPhotos ?? []).slice(0, 5).forEach((p, i) => storePhoto(id, 'OTHER', p, `${slug}-${i + 1}.jpg`, user.id, trusted));
    vendor.firstPublishedAt ??= now;
    vendor.mainPosId ??= id;
    if (vendor.userId === user.id && !user.roles.includes('VENDOR')) user.roles = [...user.roles, 'VENDOR'];
    audit(user, 'pos.create', 'PointOfSale', id, null, { name: input.name, zone: zone.name });
    persist();
    return { id, slug };
  });
}
