/**
 * Formes des réponses de l'API (vues calculées par le serveur à partir des tables).
 * Jamais de numéro de vendeur ni d'adresse exacte d'un Particulier dans ces réponses (27.5, 12.5).
 */
import type { MealMoment, PosType, FollowUpAnswer, Role } from '@/shared/enums';
import type { OpenStatus } from '@/shared/open-status';
import type { GeoPoint, OpeningHours, Uuid } from '@/shared/types';
import type { VisibilityClass } from '@/shared/visibility';

export interface ZoneOption {
  id: Uuid;
  name: string;
  code: string;
  neighborhoods: string[];
  center: GeoPoint;
}

export interface DishCard {
  id: Uuid;
  slug: string;
  name: string;
  description: string | null;
  priceXof: number;
  moment: MealMoment;
  categoryId: Uuid | null;
  isSpecial: boolean;
  isSoldOut: boolean;
  imageUrl: string | null;
  illustrationKey: string | null;
}

export interface PosSummary {
  id: Uuid;
  slug: string;
  name: string;
  type: PosType;
  zoneName: string;
  neighborhoodName: string | null;
  distanceM: number | null;
  openStatus: OpenStatus;
  servesOnSite: boolean;
  servesTakeaway: boolean;
  delivers: boolean;
  acceptsCash: boolean;
  acceptsMomo: boolean;
  hasPublicPlace: boolean;
}

export interface FeedItem {
  pos: PosSummary;
  dish: DishCard;
  visibilityClass: VisibilityClass;
  isPromoted: boolean;
  /** Position affichée : exacte, ou décalée (Particulier sans lieu public). */
  point: GeoPoint;
  isApproximate: boolean;
}

export interface FeedPage {
  items: FeedItem[];
  nextCursor: string | null;
  total: number;
}

export interface FeedQuery {
  zoneId: Uuid;
  lat?: number;
  lng?: number;
  budgetMin?: number | null;
  budgetMax?: number | null;
  moment?: MealMoment;
  categoryId?: Uuid;
  type?: PosType;
  openNow?: boolean;
  q?: string;
  cursor?: string;
  limit?: number;
  /** Carte : boîte englobante [ouest, sud, est, nord] (« Rechercher quand je déplace la carte »). */
  bbox?: [number, number, number, number];
}

export interface MapMarker {
  posId: Uuid;
  dishId: Uuid;
  slug: string;
  dishSlug: string;
  lat: number;
  lng: number;
  price: number;
  label: string;
  posName: string;
  distanceM: number | null;
  visibilityClass: VisibilityClass;
  openState: OpenStatus['state'];
  isApproximate: boolean;
  illustrationKey: string | null;
}

export interface ReviewView {
  id: Uuid;
  rating: number;
  comment: string | null;
  authorName: string;
  dishName: string | null;
  createdAt: string;
  vendorReply: string | null;
}

export interface PosPage {
  pos: PosSummary & {
    description: string | null;
    landmark: string | null;
    point: GeoPoint;
    isApproximate: boolean;
    openingHours: OpeningHours;
    pricesCheckedAt: string | null;
    identityChecked: boolean;
    /** null tant qu'il y a moins de 5 avis publiés. */
    rating: { avg: number; count: number } | null;
    qrCode: string;
    /** Photo de l'entrée validée (null : aucune, ou en relecture). */
    coverUrl: string | null;
  };
  menu: DishCard[];
  recentReviews: ReviewView[];
}

export interface DishPage {
  dish: DishCard & { photos: string[] };
  pos: Pick<PosSummary, 'id' | 'slug' | 'name' | 'type' | 'distanceM' | 'openStatus' | 'servesOnSite' | 'servesTakeaway' | 'delivers' | 'acceptsCash' | 'acceptsMomo' | 'hasPublicPlace'>;
  others: DishCard[];
  pricesCheckedAt: string | null;
  rating: { avg: number; count: number } | null;
}

export interface ContactResult {
  contactId: Uuid;
  url: string;
}

export interface PendingFollowUp {
  contactId: Uuid;
  posId: Uuid;
  posName: string;
  posSlug: string;
  askDish: boolean;
  dish: { id: Uuid; name: string; priceXof: number; illustrationKey: string | null } | null;
  createdAt: string;
  /** Plats du menu au moment du contact (« Tu as pris quoi ? »). */
  menu: { id: Uuid; name: string }[];
}

export interface FavoriteToday {
  pos: PosSummary;
  special: DishCard | null;
  notifyDaily: boolean;
}

export interface MyContact {
  id: Uuid;
  createdAt: string;
  posName: string;
  posSlug: string;
  dishName: string | null;
  answer: FollowUpAnswer | null;
  canAnswer: boolean;
}

export interface Me {
  id: Uuid;
  phoneMasked: string;
  phoneVerified: boolean;
  email: string | null;
  fullName: string | null;
  roles: Role[];
  homeZoneId: Uuid | null;
  homeZoneName: string | null;
  budgetMaxXof: number | null;
  notifyFavorites: boolean;
  askFollowUp: boolean;
  notifyNews: boolean;
  createdAt: string;
  hasGoogle: boolean;
  stats: { contacts: number; favorites: number; reviews: number };
}
