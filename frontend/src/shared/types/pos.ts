/** Tables « Vendeurs, points de vente » et « Menus » (schema.prisma sections 3 et 4). */
import type {
  ClaimStatus, DayStatusSource, DishStatus, HolidayPolicy, MealMoment, MediaOwner, MediaStatus, PosStatus, PosType,
} from '../enums';
import type { BusinessDate, IsoDateTime, Uuid } from './accounts';
import type { GeoPoint } from './geo';

/** Plage horaire 'HH:mm' → 'HH:mm' (peut passer minuit). */
export type TimeRange = [string, string];
/** Horaires par jour de la semaine : '1' = lundi … '7' = dimanche ; jour absent = fermé. */
export type OpeningHours = Partial<Record<'1' | '2' | '3' | '4' | '5' | '6' | '7', TimeRange[]>>;

export interface Vendor {
  id: Uuid;
  displayName: string;
  contactName: string | null;
  contactPhone: string;
  email: string | null;
  userId: Uuid | null;
  followedById: Uuid | null;
  notes: string | null;
  mainPosId: Uuid | null;
  mainPosComputedAt: IsoDateTime | null;
  firstPublishedAt: IsoDateTime | null;
  subscriptionNoticeAt: IsoDateTime | null;
  subscriptionRequiredFrom: IsoDateTime | null;
  createdById: Uuid;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  deletedAt: IsoDateTime | null;
}

export interface PointOfSale {
  id: Uuid;
  vendorId: Uuid;
  slug: string;
  name: string;
  description: string | null;
  type: PosType;
  status: PosStatus;
  version: number;
  qrCode: string;
  zoneId: Uuid;
  neighborhoodId: Uuid | null;
  location: GeoPoint;
  locationAccuracyM: number | null;
  hasPublicPlace: boolean;
  publicPoint: GeoPoint | null;
  landmark: string | null;
  whatsappPhone: string;
  whatsappVerifiedAt: IsoDateTime | null;
  callPhone: string | null;
  openingHours: OpeningHours;
  hoursConfirmedAt: IsoDateTime | null;
  holidayPolicy: HolidayPolicy;
  servesOnSite: boolean;
  servesTakeaway: boolean;
  delivers: boolean;
  deliveryZoneIds: Uuid[];
  acceptsCash: boolean;
  acceptsMomo: boolean;
  coverMediaId: Uuid | null;
  vendorOffer: string | null;
  identityCheckedAt: IsoDateTime | null;
  kitchenVisitedAt: IsoDateTime | null;
  consentAt: IsoDateTime;
  consentById: Uuid;
  publishedAt: IsoDateTime | null;
  pricesCheckedAt: IsoDateTime | null;
  responseRate: number | null;
  ratingAvg: number | null;
  ratingCount: number;
  createdById: Uuid;
  updatedById: Uuid | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  deletedAt: IsoDateTime | null;
}

export interface PosDayOverride {
  id: Uuid;
  posId: Uuid;
  businessDate: BusinessDate;
  isClosed: boolean;
  ranges: TimeRange[] | null;
  reason: string | null;
  source: DayStatusSource;
  createdById: Uuid | null;
  createdAt: IsoDateTime;
}

export interface ClaimRequest {
  id: Uuid;
  vendorId: Uuid;
  userId: Uuid;
  code: string;
  status: ClaimStatus;
  reviewedById: Uuid | null;
  expiresAt: IsoDateTime;
  createdAt: IsoDateTime;
}

export interface MediaVariants {
  thumb?: string;
  card?: string;
  full?: string;
  blurhash?: string;
}

export interface Media {
  id: Uuid;
  ownerType: MediaOwner;
  ownerId: Uuid;
  sortOrder: number;
  originalKey: string;
  variants: MediaVariants;
  width: number | null;
  height: number | null;
  status: MediaStatus;
  rejectionReason: string | null;
  uploadedById: Uuid;
  createdAt: IsoDateTime;
  deletedAt: IsoDateTime | null;
}

export interface DishCategory {
  id: Uuid;
  name: string;
  slug: string;
  aliases: string[];
  family: string | null;
  illustrationKey: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Dish {
  id: Uuid;
  posId: Uuid;
  categoryId: Uuid | null;
  slug: string;
  name: string;
  description: string | null;
  priceXof: number;
  moment: MealMoment;
  status: DishStatus;
  soldOutOn: BusinessDate | null;
  sortOrder: number;
  publishedAt: IsoDateTime | null;
  createdById: Uuid;
  updatedById: Uuid | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  deletedAt: IsoDateTime | null;
}

export interface DailySpecial {
  id: Uuid;
  posId: Uuid;
  dishId: Uuid;
  businessDate: BusinessDate;
  priceTodayXof: number | null;
  createdById: Uuid;
  createdAt: IsoDateTime;
}
