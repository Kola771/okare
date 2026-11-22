/** Formes des réponses de l'espace vendeur (et des écrans de l'équipe qui gèrent les mêmes points). */
import type { AdPlan, DishStatus, MealMoment, OrderStatus, PaymentMethod, PaymentStatus, PosStatus, PosType } from '@/shared/enums';
import type { OpenStatus } from '@/shared/open-status';
import type { Quote } from '@/shared/pricing';
import type { BusinessDate, OpeningHours, TimeRange } from '@/shared/types';
import type { VisibilityClass } from '@/shared/visibility';

export interface ManagedPos {
  id: string;
  slug: string;
  name: string;
  type: PosType;
  status: PosStatus;
  zoneId: string;
  zoneName: string;
  zoneCategory: 'A' | 'B' | 'C';
  neighborhoodId: string | null;
  isMainPos: boolean;
  openStatus: OpenStatus;
  openingHours: OpeningHours;
  holidayPolicy: 'OPEN' | 'CLOSED' | 'UNKNOWN';
  todayOverride: { isClosed: boolean; ranges: TimeRange[] | null } | null;
  special: { dishId: string; name: string; priceXof: number } | null;
  delivers: boolean;
  qrCode: string;
  pricesCheckedAt: string | null;
  hoursConfirmedAt: string | null;
  contacts7d: number;
  contacts30: number;
  qrScans7d: number;
  /** Contacts venus d'un scan sur 7 jours. */
  qrOrders7d: number;
  dishCount: number;
  rating: { avg: number; count: number } | null;
  responseRate: number | null;
  version: number;
}

export interface VendorHome {
  vendorId: string;
  displayName: string;
  contactName: string | null;
  agentName: string | null;
  vendorAgeDays: number;
  contactsToday: number;
  contactsYesterday: number;
  points: ManagedPos[];
  isParticulier: boolean;
  /** Zones où se trouvent ses points de vente. */
  zones: { id: string; name: string; category: 'A' | 'B' | 'C'; center: { lat: number; lng: number } | null; neighborhoods: string[]; points: string[] }[];
}

export interface MenuDish {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceXof: number;
  moment: MealMoment;
  categoryId: string | null;
  status: DishStatus;
  isSpecial: boolean;
  isSoldOut: boolean;
  illustrationKey: string | null;
  specialYesterday: boolean;
}

export interface DishInput {
  name: string;
  priceXof: number;
  moment: MealMoment;
  categoryId: string | null;
  description?: string | null;
  isSpecial?: boolean;
  available?: boolean;
}

export interface StatsReport {
  from: BusinessDate;
  to: BusinessDate;
  contacts: number;
  previousContacts: number;
  uniqueClients: number;
  confirmedOrders: number;
  views: number;
  whatsapp: number;
  calls: number;
  qrScans: number;
  responseRate: number | null;
  byDay: { date: BusinessDate; contacts: number }[];
  byDish: { name: string; contacts: number; confirmed: number }[];
  byPos: { posId: string; name: string; contacts: number; responseRate: number | null; openDays: number; days: number }[];
}

export interface SubscriptionStatusView {
  enabled: boolean;
  concerned: boolean;
  vendorAgeDays: number;
  minVendorAgeDays: number;
  concernedFrom: BusinessDate | null;
  requiredFrom: string | null;
  daysLeft: number | null;
  noticeDays: number;
  lastMonthContacts: number;
  perPos: { posId: string; name: string; isMainPos: boolean; visibilityClass: VisibilityClass }[];
}

export interface ZoneOffer {
  zoneId: string;
  name: string;
  category: 'A' | 'B' | 'C';
  dayPriceXof: number;
  freeSlots: number;
  capacity: number;
  fullDates: BusinessDate[];
}

export interface OrderLineInput {
  posId: string;
  plan: AdPlan;
  startDate: BusinessDate;
  days?: number;
  zoneIds: string[];
}

export interface OrderLineView extends OrderLineInput {
  posName: string;
  isMainPos: boolean;
  endDate: BusinessDate;
  zoneNames: string[];
  topZoneName: string;
  quote: Quote;
}

export interface OrderView {
  id: string;
  number: string;
  status: OrderStatus;
  subtotalXof: number;
  discountXof: number;
  totalXof: number;
  holdUntil: string | null;
  lines: OrderLineView[];
  payment: { id: string; status: PaymentStatus; method: PaymentMethod | null; phone: string | null; failureReason: string | null;
    providerTransactionId: string | null; receiptNumber: string | null } | null;
}

export interface ReceiptView {
  id: string;
  date: string;
  label: string;
  amountXof: number;
  status: PaymentStatus;
  receiptNumber: string | null;
}
