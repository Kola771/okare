/**
 * Environnement simulé de la phase 1, **côté serveur uniquement** (0ter.4) : les données fictives ne partent jamais
 * dans le JavaScript du navigateur. Le contexte de chaque appel (session, horloge, erreurs de test) vient des cookies,
 * lus par l'action `rpc` et transmis par AsyncLocalStorage.
 *
 * Réglages de test (cookies) : okare_mock_now (horloge fixe ISO), okare_mock_error = 1 (erreur serveur).
 * Délai simulé : variable d'environnement MOCK_DELAY_MS (défaut 0, 150 au plus).
 *
 * Accès libre en phase 1 (demande du porteur) : aucune page ne demande de connexion. Sans cookie de session,
 * on est la cliente de démonstration ; les pages vendeur et dashboard montrent les données de démonstration.
 * Les contrôles d'accès seront faits avec le backend (phase 2).
 */
import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { db } from '@/mocks';
import type { User } from '@/shared/types';
import { ApiError, ERR } from '../../errors';

export const SESSION_COOKIE = 'okare_session';
export const NOW_COOKIE = 'okare_mock_now';
export const ERROR_COOKIE = 'okare_mock_error';
export const DEVICE_COOKIE = 'okare_device';

export interface CallContext {
  sessionId: string | null;
  now: string | null;
  mockError: boolean;
  deviceId: string;
  /** Cookies à écrire à la fin de l'appel (connexion, déconnexion). */
  writes: { name: string; value: string | null }[];
}

export const context = new AsyncLocalStorage<CallContext>();

function ctx(): CallContext {
  return context.getStore() ?? { sessionId: null, now: null, mockError: false, deviceId: 'server', writes: [] };
}

/** Heure courante (ou horloge fixe de test). */
export function mockNow(): Date {
  const fixed = ctx().now;
  const d = fixed ? new Date(fixed) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

const DELAY = Math.min(150, Number(process.env.MOCK_DELAY_MS ?? 0));

/** Simule un aller-retour vers l'API puis exécute `fn` (ou lève l'erreur provoquée). */
export async function simulate<T>(fn: () => T): Promise<T> {
  if (DELAY > 0) await new Promise((r) => setTimeout(r, DELAY));
  if (ctx().mockError) throw new ApiError(ERR.SERVER, 'Le serveur ne répond pas. Réessaie.', 500);
  return fn();
}

/** Valeur du cookie de session pour « visiteur sans compte » (bouton Visiteur de /pages, déconnexion). */
export const VISITOR = 'visitor';
const DEMO_CLIENT_ID = '0193a200-0000-7000-8000-000000000014';

export const demoUser = (id: string) => db.users.find((u) => u.id === id)!;

export function currentUser(): User | null {
  const id = ctx().sessionId;
  if (id === VISITOR) return null;
  if (!id) return demoUser(DEMO_CLIENT_ID);
  return db.users.find((u) => u.id === id && !u.deletedAt && !u.isBlocked) ?? demoUser(DEMO_CLIENT_ID);
}

/** Accès libre : sans compte, les actions se font au nom de la cliente de démonstration. */
export function requireUser(): User {
  return currentUser() ?? demoUser(DEMO_CLIENT_ID);
}

export function setSession(userId: string | null): void {
  const c = ctx();
  c.sessionId = userId ?? VISITOR;
  c.writes.push({ name: SESSION_COOKIE, value: userId ?? VISITOR });
}

/** Phase 1 : la base fictive vit en mémoire du serveur (gardée entre les requêtes, remise à zéro au redémarrage). */
export function hydrate(): void {}
export function persist(): void {}

export function deviceId(): string {
  return ctx().deviceId;
}

/** UUID v7 pour les lignes créées en phase 1. */
export function newId(): string {
  const hex = Date.now().toString(16).padStart(12, '0');
  const rnd = randomUUID().replace(/-/g, '');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-7${rnd.slice(0, 3)}-8${rnd.slice(3, 6)}-${rnd.slice(6, 18)}`;
}
