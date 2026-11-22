/**
 * Registre des fonctions de l'API simulée (phase 1), appelables depuis l'action `rpc`.
 * Phase 3 : ces modules appellent l'API NestJS au lieu de la base fictive ; rien ne change pour les écrans.
 */
import 'server-only';
import * as adminDashboard from './admin-dashboard';
import * as adminGeo from './admin-geo';
import * as adminMedia from './admin-media';
import * as adminPeople from './admin-people';
import * as adminPos from './admin-pos';
import * as adminSheet from './admin-sheet';
import * as adminZones from './admin-zones';
import * as auth from './auth';
import * as catalog from './catalog';
import * as claims from './claims';
import * as contacts from './contacts';
import * as favorites from './favorites';
import * as menu from './menu';
import * as posCreate from './pos-create';
import * as posManage from './pos-manage';
import * as seller from './seller';
import * as vendorProfile from './vendor-profile';

export const registry = {
  ...catalog, ...auth, ...contacts, ...favorites, ...seller, ...menu, ...vendorProfile, ...posCreate, ...posManage,
  ...adminDashboard, ...adminPos, ...adminZones, ...adminPeople, ...adminGeo, ...adminSheet, ...claims, ...adminMedia,
};

export type Registry = typeof registry;
