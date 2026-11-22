/** Données d'exemple du dashboard : signalements et journal d'audit. */
import type { AuditLog, Report } from '@/shared/types';
import { businessDate } from '@/shared/time';
import { isoDaysAgo, mockId, POS, USER } from './ids';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const today = businessDate(new Date());
type ReportSeed = [n: number, posId: string, reason: Report['reason'], comment: string | null, at: string, status?: Report['status']];
const REPORTS: ReportSeed[] = [
  [1, POS.senami, 'FRAUD', 'Elle a demandé de payer avant de livrer, puis ne répond plus.', minutesAgo(120)],
  [2, POS.coinBio, 'CLOSED_TODAY', '2 clients le même jour', minutesAgo(240)],
  [3, POS.palmier, 'WRONG_PRICE', 'Le riz est à 1 200, pas 1 000.', isoDaysAgo(1)],
  [4, POS.mamanAkpakpa, 'NO_ANSWER', '3e signalement en 7 jours', isoDaysAgo(1)],
  [5, POS.etalBenedicte, 'WRONG_HOURS', 'Ouvert le dimanche en fait.', isoDaysAgo(5), 'RESOLVED'],
];

export const SAMPLE_REPORTS: Report[] = REPORTS.map(([n, posId, reason, comment, at, status]) => ({
  id: mockId(7, 300 + n), targetType: 'POS', posId, dishId: null, reviewId: null, targetUserId: null, userId: USER.clientKoffi, reason, comment,
  businessDate: today, status: status ?? 'OPEN', resolvedById: status ? USER.admin : null, resolvedAt: status ? at : null,
  resolution: status ? 'Horaires corrigés avec le vendeur.' : null, createdAt: at,
}));

type AuditSeed = [actorId: string | null, role: AuditLog['actorRole'], action: string, type: string, entityId: string, after: unknown, at: string];
const AUDIT: AuditSeed[] = [
  [USER.vendorMaman, 'VENDOR', 'special.publish', 'PointOfSale', POS.mamanGanhi, { plat: 'Riz sauce arachide + poisson', prix: 900 }, minutesAgo(50)],
  [USER.agentGanhi, 'FIELD_AGENT', 'dish.sold-out', 'Dish', mockId(5, 3), { plat: 'Amiwo + poulet', épuisé: true }, minutesAgo(90)],
  [USER.agentGanhi, 'FIELD_AGENT', 'dish.update', 'Dish', mockId(5, 2), { prix: '400 → 500 F' }, isoDaysAgo(2)],
  [USER.agentGanhi, 'FIELD_AGENT', 'pos.create', 'PointOfSale', POS.rachida, { nom: 'Chez Rachida', consentement: true }, isoDaysAgo(8)],
  [USER.superAdmin, 'SUPER_ADMIN', 'role.assign', 'User', USER.agentGanhi, { rôle: 'Agent terrain', zones: 'Ganhi, Missébô' }, isoDaysAgo(20)],
];

export const SAMPLE_AUDIT: AuditLog[] = AUDIT.map(([actorId, actorRole, action, entityType, entityId, after, at], i) => ({
  id: mockId(8, 400 + i), actorId, actorRole, action, entityType, entityId, before: null, after, ipHash: null, createdAt: at,
}));
