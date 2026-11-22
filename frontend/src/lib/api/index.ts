/**
 * Point d'entrée unique de l'accès aux données. Les écrans importent `@/lib/api`, jamais `@/mocks`.
 * Phase 1 : les fonctions passent par l'action serveur `rpc` (données fictives côté serveur).
 * Phase 3 : `server/*` appelle l'API NestJS `/api/v1` ; signatures identiques.
 */
export * from './client';
export * from './errors';
export { now } from './clock';
export type * from './dto';
export type * from './seller-dto';
export type { AdminDashboard } from './server/admin-dashboard';
export type { AdminPosRow, AdminVendorRow, ModerationAction, PosFilter } from './server/admin-pos';
export type { AdminZoneRow, PriceGridRow, ZoneInput } from './server/admin-zones';
export type { Geography, GeoCityRow, GeoCountryRow, GeoNeighborhoodRow } from './server/admin-geo';
export type { AdRow, PosSheet } from './server/admin-sheet';
export type { AdminClaimRow, MyClaim } from './server/claims';
export type { MediaLibrary, MediaRow, MediaState } from './server/admin-media';
export type { TeamFilter } from '@/shared/team-filter';
export type { AdminReportRow, AdminUserRow } from './server/admin-people';
export type { DemoRole } from './server/auth';
export type { DishAction } from './server/menu';
export type { NewPosInput } from './server/pos-create';
export type { ManagedReview, PosInfo } from './server/pos-manage';
