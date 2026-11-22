/**
 * Authentification et compte — POST /auth/register · /auth/login · GET /auth/google · POST /auth/logout ·
 * POST /auth/forgot · GET/PATCH/DELETE /me.
 */
import 'server-only';
import { db, DEMO_PASSWORD } from '@/mocks';

import { loginSchema, profileSchema, registerSchema, type ProfileInput } from '@/shared/schemas';
import type { User } from '@/shared/types';
import { maskPhone } from '@/shared/format';
import type { Me } from '../dto';
import { ApiError, ERR } from '../errors';
import { currentUser, hydrate, newId, persist, requireUser, setSession, simulate } from './mock/runtime';

/** Mots de passe des comptes créés pendant la démo (jamais persistés en clair en production). */
const passwords = new Map<string, string>();

function toMe(u: User): Me {
  const zone = db.zones.find((z) => z.id === u.homeZoneId);
  return {
    id: u.id, phoneMasked: maskPhone(u.phone), phoneVerified: !!u.phoneVerifiedAt, email: u.email, fullName: u.fullName,
    roles: u.roles, homeZoneId: u.homeZoneId, homeZoneName: zone?.name ?? null, budgetMaxXof: u.budgetMaxXof,
    notifyFavorites: u.notifyFavorites, askFollowUp: u.askFollowUp, notifyNews: u.notifyNews, createdAt: u.createdAt,
    hasGoogle: !!u.googleSub,
    stats: {
      contacts: db.contacts.filter((c) => c.userId === u.id).length,
      favorites: db.favorites.filter((f) => f.userId === u.id).length,
      reviews: db.reviews.filter((r) => r.userId === u.id).length,
    },
  };
}

function validationError(issues: { message: string; path: PropertyKey[] }[]): ApiError {
  const details = Object.fromEntries(issues.map((i) => [String(i.path[0] ?? 'form'), i.message]));
  return new ApiError(ERR.VALIDATION, issues[0]?.message ?? 'Formulaire invalide.', 400, details);
}

export function register(input: { phone: string; password: string }): Promise<Me> {
  return simulate(() => {
    hydrate();
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) throw validationError(parsed.error.issues);
    if (db.users.some((u) => u.phone === parsed.data.phone)) {
      throw new ApiError(ERR.PHONE_TAKEN, 'Ce numéro a déjà un compte. Connecte-toi.', 409, { phone: 'Numéro déjà utilisé.' });
    }
    const now = new Date().toISOString();
    const user: User = {
      id: newId(), phone: parsed.data.phone, email: null, googleSub: null, passwordHash: 'mock', fullName: null,
      avatarMediaId: null, roles: ['CLIENT'], homeZoneId: null, budgetMaxXof: null, notifyFavorites: true,
      askFollowUp: true, notifyNews: false, phoneVerifiedAt: null, totpSecret: null, totpEnabledAt: null,
      isBlocked: false, blockedReason: null, lastSeenAt: now, createdAt: now, updatedAt: now, deletedAt: null,
    };
    db.users.push(user);
    passwords.set(user.id, parsed.data.password);
    persist();
    setSession(user.id);
    return toMe(user);
  });
}

export function login(input: { phone: string; password: string }): Promise<Me> {
  return simulate(() => {
    hydrate();
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) throw validationError(parsed.error.issues);
    const user = db.users.find((u) => u.phone === parsed.data.phone && !u.deletedAt);
    const ok = user && (passwords.get(user.id) ?? DEMO_PASSWORD) === parsed.data.password;
    if (!user || !ok) throw new ApiError(ERR.INVALID_CREDENTIALS, 'Numéro ou mot de passe incorrect.', 401);
    if (user.isBlocked) throw new ApiError(ERR.FORBIDDEN, 'Ce compte est bloqué. Contacte OKARE.', 403);
    setSession(user.id);
    return toMe(user);
  });
}

/** Phase 1 : simule le retour de Google en connectant la cliente de démonstration. */
export function loginWithGoogle(): Promise<Me> {
  return simulate(() => {
    hydrate();
    const user = db.users.find((u) => u.roles.length === 1 && u.roles[0] === 'CLIENT')!;
    setSession(user.id);
    return toMe(user);
  });
}

export const logout = () => simulate(() => setSession(null));

export function forgotPassword(phone: string): Promise<{ ok: true }> {
  return simulate(() => {
    if (!registerSchema.shape.phone.safeParse(phone).success) {
      throw new ApiError(ERR.VALIDATION, 'Numéro invalide : 10 chiffres commençant par 01.', 400);
    }
    return { ok: true as const };
  });
}

/** Compte connecté, ou null (visiteur). */
export function getMe(): Promise<Me | null> {
  return simulate(() => {
    hydrate();
    const u = currentUser();
    return u ? toMe(u) : null;
  });
}

export function updateMe(input: ProfileInput): Promise<Me> {
  return simulate(() => {
    const u = requireUser();
    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) throw validationError(parsed.error.issues);
    Object.assign(u, parsed.data, { email: parsed.data.email || u.email, updatedAt: new Date().toISOString() });
    persist();
    return toMe(u);
  });
}

export function deleteMe(): Promise<{ ok: true }> {
  return simulate(() => {
    const u = requireUser();
    Object.assign(u, { deletedAt: new Date().toISOString(), phone: null, email: null });
    db.favorites = db.favorites.filter((f) => f.userId !== u.id);
    persist();
    setSession(null);
    return { ok: true as const };
  });
}


/** Rôles de démonstration (page /pages, phase 1 seulement) : se connecter d'un clic avec un compte fictif. */
export type DemoRole = 'VISITOR' | 'CLIENT' | 'VENDOR' | 'FIELD_AGENT' | 'ADMIN' | 'SUPER_ADMIN';

export function demoLoginAs(role: DemoRole): Promise<Me | null> {
  return simulate(() => {
    hydrate();
    if (role === 'VISITOR') {
      setSession(null);
      return null;
    }
    const user = role === 'CLIENT'
      ? db.users.find((u) => u.roles.length === 1 && u.roles[0] === 'CLIENT')!
      : db.users.find((u) => u.roles.includes(role))!;
    setSession(user.id);
    return toMe(user);
  });
}
