/**
 * Listes de valeurs — copie exacte des enums de backend/prisma/schema.prisma (OKARE_SPEC.md 4.11).
 * TypeScript pur : aucun import de React, Next.js, NestJS ou Prisma.
 */

const values = <T extends string>(...v: T[]) => v;

export const ROLES = values('CLIENT', 'VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN');
export type Role = (typeof ROLES)[number];

export const POS_TYPES = values('PARTICULIER', 'MAQUIS', 'RESTAURANT');
export type PosType = (typeof POS_TYPES)[number];

export const POS_STATUSES = values('PUBLISHED', 'PENDING', 'SUSPENDED', 'ARCHIVED');
export type PosStatus = (typeof POS_STATUSES)[number];

export const DISH_STATUSES = values('PUBLISHED', 'PENDING');
export type DishStatus = (typeof DISH_STATUSES)[number];

export const MEAL_MOMENTS = values('BREAKFAST', 'LUNCH', 'DINNER', 'ALL_DAY');
export type MealMoment = (typeof MEAL_MOMENTS)[number];

export const HOLIDAY_POLICIES = values('OPEN', 'CLOSED', 'UNKNOWN');
export type HolidayPolicy = (typeof HOLIDAY_POLICIES)[number];

export const DAY_STATUS_SOURCES = values('TEAM', 'VENDOR', 'CLIENT_REPORTS', 'AUTO');
export type DayStatusSource = (typeof DAY_STATUS_SOURCES)[number];

export const CLAIM_STATUSES = values('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const MEDIA_OWNERS = values('POS', 'DISH', 'USER', 'REVIEW', 'REPORT');
export type MediaOwner = (typeof MEDIA_OWNERS)[number];

export const MEDIA_STATUSES = values('PROCESSING', 'READY', 'REJECTED');
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export const CONTACT_CHANNELS = values('WHATSAPP', 'CALL');
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export const CONTACT_SOURCES = values('HOME', 'SEARCH', 'MAP', 'DISH_PAGE', 'POS_PAGE', 'FAVORITES', 'QR', 'PUSH');
export type ContactSource = (typeof CONTACT_SOURCES)[number];

export const FOLLOW_UP_ANSWERS = values('YES', 'NOT_YET', 'NO');
export type FollowUpAnswer = (typeof FOLLOW_UP_ANSWERS)[number];

export const ORDER_ITEM_ORIGINS = values('DISH_BUTTON', 'DECLARED');
export type OrderItemOrigin = (typeof ORDER_ITEM_ORIGINS)[number];

export const REVIEW_STATUSES = values('PUBLISHED', 'HIDDEN', 'REMOVED');
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REPORT_TARGETS = values('POS', 'DISH', 'REVIEW', 'USER');
export type ReportTarget = (typeof REPORT_TARGETS)[number];

export const REPORT_REASONS = values(
  'WRONG_INFO', 'WRONG_PRICE', 'CLOSED_TODAY', 'WRONG_HOURS', 'CLOSED_PERMANENTLY', 'NO_ANSWER',
  'FAKE_REVIEW', 'FOOD_SAFETY', 'INAPPROPRIATE', 'FRAUD', 'OTHER',
);
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = values('OPEN', 'RESOLVED', 'REJECTED');
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const AD_PLANS = values('DAY', 'PERIOD', 'MONTH', 'PREMIUM');
export type AdPlan = (typeof AD_PLANS)[number];

export const ORDER_STATUSES = values('PENDING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED');
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SUBSCRIPTION_STATUSES = values('PENDING_PAYMENT', 'PAID', 'ENDED', 'CANCELLED', 'EXPIRED', 'REFUNDED');
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const PAYMENT_METHODS = values('MTN', 'MOOV', 'CELTIIS', 'CARD', 'OTHER');
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = values('PENDING', 'APPROVED', 'DECLINED', 'CANCELED', 'EXPIRED', 'REFUNDED');
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_ORIGINS = values('VENDOR_APP', 'PAYMENT_LINK');
export type PaymentOrigin = (typeof PAYMENT_ORIGINS)[number];

export const WAITLIST_STATUSES = values('WAITING', 'OFFERED', 'CONVERTED', 'EXPIRED', 'LEFT');
export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];

export const NOTICE_CHANNELS = values('WHATSAPP', 'EMAIL', 'IN_APP');
export type NoticeChannel = (typeof NOTICE_CHANNELS)[number];

export const NOTICE_KINDS = values('ANNOUNCEMENT', 'REMINDER', 'LAST_DAY', 'NOTICE_ENDED', 'RECEIPT');
export type NoticeKind = (typeof NOTICE_KINDS)[number];

export const NOTICE_STATUSES = values('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED');
export type NoticeStatus = (typeof NOTICE_STATUSES)[number];

export const NOTIFICATION_TYPES = values(
  'FAVORITE_SPECIAL', 'FOLLOW_UP', 'PAYMENT_APPROVED', 'PAYMENT_FAILED', 'SUBSCRIPTION_NOTICE',
  'SUBSCRIPTION_ENDING', 'REVIEW_RECEIVED', 'REPORT_RESOLVED', 'SYSTEM',
);
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Libellés français affichés dans l'interface. */
export const POS_TYPE_LABEL: Record<PosType, string> = {
  PARTICULIER: 'Particulier',
  MAQUIS: 'Maquis',
  RESTAURANT: 'Restaurant',
};

export const MEAL_MOMENT_LABEL: Record<MealMoment, string> = {
  BREAKFAST: 'Petit-déjeuner',
  LUNCH: 'Déjeuner',
  DINNER: 'Dîner',
  ALL_DAY: 'Toute la journée',
};

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  WRONG_INFO: 'Information fausse',
  WRONG_PRICE: 'Prix faux',
  CLOSED_TODAY: "Fermé aujourd'hui",
  WRONG_HOURS: 'Horaires faux',
  CLOSED_PERMANENTLY: 'Fermé définitivement',
  NO_ANSWER: 'Ne répond pas',
  FAKE_REVIEW: 'Faux avis',
  FOOD_SAFETY: 'Problème de santé après le repas',
  INAPPROPRIATE: 'Contenu choquant',
  FRAUD: 'Arnaque',
  OTHER: 'Autre',
};
