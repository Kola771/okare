/** Schémas de validation zod partagés (formulaires du front et corps de requête de l'API). */
import { z } from 'zod';
import { AD_PLANS, CONTACT_CHANNELS, CONTACT_SOURCES, FOLLOW_UP_ANSWERS, REPORT_REASONS, REPORT_TARGETS } from './enums';
import { normalizePhone } from './format';
import { PHONE_ERROR, passwordError } from './validate';

export const uuid = z.string().uuid();

/** Téléphone saisi « 01 XX XX XX XX » → E.164. */
export const phoneSchema = z
  .string()
  .transform((v, ctx) => {
    const e164 = normalizePhone(v);
    if (!e164) {
      ctx.addIssue({ code: 'custom', message: PHONE_ERROR });
      return z.NEVER;
    }
    return e164;
  });


export const passwordSchema = z
  .string()
  .superRefine((v, ctx) => {
    const err = passwordError(v);
    if (err) ctx.addIssue({ code: 'custom', message: err });
  });

export const registerSchema = z.object({ phone: phoneSchema, password: passwordSchema });
export const loginSchema = z.object({ phone: phoneSchema, password: z.string().min(1, 'Entre ton mot de passe.') });

export const contactSchema = z.object({
  posId: uuid,
  /** Bouton d'un plat (dishId obligatoire) ou bouton du point de vente (dishId interdit) — 9.1. */
  button: z.enum(['DISH', 'POS']),
  channel: z.enum(CONTACT_CHANNELS),
  dishId: uuid.optional(),
  source: z.enum(CONTACT_SOURCES),
  viewerZoneId: uuid.optional(),
});

export const followUpAnswerSchema = z.object({
  answer: z.enum(FOLLOW_UP_ANSWERS),
  orderedDishIds: z.array(uuid).optional(),
  other: z.boolean().optional(),
});

export const reviewSchema = z.object({
  contactId: uuid,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  mediaIds: z.array(uuid).optional(),
});

export const reportSchema = z.object({
  targetType: z.enum(REPORT_TARGETS),
  posId: uuid.optional(),
  dishId: uuid.optional(),
  reviewId: uuid.optional(),
  targetUserId: uuid.optional(),
  reason: z.enum(REPORT_REASONS),
  comment: z.string().max(500).optional(),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, '2 caractères minimum.').max(80).optional(),
  email: z.string().email('E-mail invalide.').optional().or(z.literal('')),
  homeZoneId: uuid.optional(),
  budgetMaxXof: z.number().int().positive().nullable().optional(),
  notifyFavorites: z.boolean().optional(),
  askFollowUp: z.boolean().optional(),
  notifyNews: z.boolean().optional(),
});

export const orderLineSchema = z.object({
  posId: uuid,
  plan: z.enum(AD_PLANS),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.number().int().optional(),
  zoneIds: z.array(uuid).min(1),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type FollowUpAnswerInput = z.infer<typeof followUpAnswerSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type OrderLineInput = z.infer<typeof orderLineSchema>;
