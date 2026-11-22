/** Tables « Clients » et « Statistiques » (schema.prisma sections 5 et 6). */
import type {
  ContactChannel, ContactSource, FollowUpAnswer, OrderItemOrigin, ReportReason, ReportStatus, ReportTarget, ReviewStatus,
} from '../enums';
import type { BusinessDate, IsoDateTime, Uuid } from './accounts';

export interface Favorite {
  userId: Uuid;
  posId: Uuid;
  notifyDaily: boolean;
  createdAt: IsoDateTime;
}

export interface ContactEvent {
  id: Uuid;
  posId: Uuid;
  vendorId: Uuid;
  userId: Uuid;
  dishId: Uuid | null;
  dishNameSnap: string | null;
  dishPriceSnap: number | null;
  dishCategoryId: Uuid | null;
  channel: ContactChannel;
  source: ContactSource;
  posZoneId: Uuid;
  viewerZoneId: Uuid | null;
  subscriptionId: Uuid | null;
  deviceId: string | null;
  ipHash: string | null;
  isCounted: boolean;
  notCountedReason: string | null;
  createdAt: IsoDateTime;
}

export interface ContactFollowUp {
  contactId: Uuid;
  posId: Uuid;
  userId: Uuid;
  askDish: boolean;
  askCount: number;
  askedAt: IsoDateTime | null;
  nextAskAt: IsoDateTime | null;
  answer: FollowUpAnswer | null;
  answeredAt: IsoDateTime | null;
}

export interface ContactOrderItem {
  id: Uuid;
  contactId: Uuid;
  dishId: Uuid | null;
  dishNameSnap: string;
  dishCategoryId: Uuid | null;
  origin: OrderItemOrigin;
  createdAt: IsoDateTime;
}

export interface Review {
  id: Uuid;
  posId: Uuid;
  dishId: Uuid | null;
  userId: Uuid;
  contactId: Uuid;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  hiddenReason: string | null;
  hiddenById: Uuid | null;
  vendorReply: string | null;
  vendorRepliedAt: IsoDateTime | null;
  vendorRepliedById: Uuid | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface Report {
  id: Uuid;
  targetType: ReportTarget;
  posId: Uuid | null;
  dishId: Uuid | null;
  reviewId: Uuid | null;
  targetUserId: Uuid | null;
  userId: Uuid;
  reason: ReportReason;
  comment: string | null;
  businessDate: BusinessDate;
  status: ReportStatus;
  resolvedById: Uuid | null;
  resolvedAt: IsoDateTime | null;
  resolution: string | null;
  createdAt: IsoDateTime;
}

export interface ResponseTest {
  id: Uuid;
  posId: Uuid;
  agentId: Uuid;
  sentAt: IsoDateTime;
  answeredWithinMin: number | null;
  note: string | null;
  createdAt: IsoDateTime;
}

export interface PosDailyStat {
  posId: Uuid;
  businessDate: BusinessDate;
  impressions: number;
  promotedImpressions: number;
  views: number;
  dishViews: number;
  qrScans: number;
  whatsappContacts: number;
  callContacts: number;
  uniqueClients: number;
  confirmedOrders: number;
}

export interface PosDishDailyStat {
  posId: Uuid;
  dishId: Uuid;
  businessDate: BusinessDate;
  views: number;
  contacts: number;
  confirmed: number;
}

export interface StatsShareLink {
  token: string;
  posId: Uuid;
  createdById: Uuid;
  expiresAt: IsoDateTime;
  revokedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
}
