/** Tables « Pubs et paiements FedaPay » et « Administration » (schema.prisma sections 7 et 8). */
import type {
  AdPlan, NoticeChannel, NoticeKind, NoticeStatus, OrderStatus, PaymentMethod, PaymentOrigin, PaymentStatus, PosType,
  Role, SubscriptionStatus, WaitlistStatus,
} from '../enums';
import type { BusinessDate, IsoDateTime, Json, Uuid } from './accounts';

export interface PriceGrid {
  id: Uuid;
  categoryId: Uuid;
  posType: PosType;
  dayPriceXof: number;
  updatedById: Uuid | null;
  updatedAt: IsoDateTime;
}

export interface SubscriptionOrder {
  id: Uuid;
  number: string;
  vendorId: Uuid;
  origin: PaymentOrigin;
  status: OrderStatus;
  subtotalXof: number;
  discountXof: number;
  totalXof: number;
  holdUntil: IsoDateTime | null;
  paidAt: IsoDateTime | null;
  receiptUrl: string | null;
  createdById: Uuid;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface Subscription {
  id: Uuid;
  orderId: Uuid | null;
  posId: Uuid;
  vendorId: Uuid;
  plan: AdPlan;
  startDate: BusinessDate;
  endDate: BusinessDate;
  days: number;
  isMainPos: boolean;
  baseXof: number;
  discountPct: number;
  totalXof: number;
  status: SubscriptionStatus;
  isComplimentary: boolean;
  complimentaryReason: string | null;
  renewedFromId: Uuid | null;
  createdById: Uuid;
  paidAt: IsoDateTime | null;
  cancelledAt: IsoDateTime | null;
  cancelledById: Uuid | null;
  cancelReason: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface SubscriptionZone {
  subscriptionId: Uuid;
  zoneId: Uuid;
  priceXof: number;
}

export interface ZoneDaySlot {
  zoneId: Uuid;
  businessDate: BusinessDate;
  subscriptionId: Uuid;
}

export interface Payment {
  id: Uuid;
  orderId: Uuid;
  vendorId: Uuid;
  amountXof: number;
  feeXof: number | null;
  currency: string;
  provider: string;
  providerTransactionId: string | null;
  providerReference: string | null;
  checkoutUrl: string | null;
  method: PaymentMethod | null;
  payerPhone: string | null;
  payerName: string | null;
  payerEmail: string | null;
  status: PaymentStatus;
  origin: PaymentOrigin;
  initiatedById: Uuid;
  approvedAt: IsoDateTime | null;
  failedAt: IsoDateTime | null;
  failureReason: string | null;
  refundedAt: IsoDateTime | null;
  refundedById: Uuid | null;
  refundReason: string | null;
  receiptNumber: string | null;
  lastProviderStatus: Json | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface PaymentEvent {
  id: Uuid;
  provider: string;
  providerEventId: string | null;
  name: string;
  providerTransactionId: string;
  paymentId: Uuid | null;
  payload: Json;
  signatureValid: boolean;
  receivedAt: IsoDateTime;
  processedAt: IsoDateTime | null;
  error: string | null;
}

export interface WaitlistEntry {
  id: Uuid;
  zoneId: Uuid;
  posId: Uuid;
  plan: AdPlan;
  wantedStart: BusinessDate;
  wantedEnd: BusinessDate;
  status: WaitlistStatus;
  offeredAt: IsoDateTime | null;
  offerExpiresAt: IsoDateTime | null;
  createdAt: IsoDateTime;
}

export interface SubscriptionLaunch {
  id: Uuid;
  activatedById: Uuid;
  activatedAt: IsoDateTime;
  minVendorAgeDays: number;
  noticeDays: number;
  channels: NoticeChannel[];
  messageTemplate: string;
  vendorsNotified: number;
  deactivatedAt: IsoDateTime | null;
  deactivatedById: Uuid | null;
  deactivationReason: string | null;
}

export interface VendorNotice {
  id: Uuid;
  vendorId: Uuid;
  launchId: Uuid | null;
  kind: NoticeKind;
  channel: NoticeChannel;
  status: NoticeStatus;
  body: string;
  providerRef: string | null;
  error: string | null;
  createdAt: IsoDateTime;
  sentAt: IsoDateTime | null;
}

export interface AuditLog {
  id: Uuid;
  actorId: Uuid | null;
  actorRole: Role | null;
  action: string;
  entityType: string;
  entityId: Uuid;
  before: Json | null;
  after: Json | null;
  ipHash: string | null;
  createdAt: IsoDateTime;
}

export interface Setting {
  key: string;
  value: Json;
  updatedById: Uuid | null;
  updatedAt: IsoDateTime;
}
