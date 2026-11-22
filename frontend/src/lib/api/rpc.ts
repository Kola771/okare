'use server';

/**
 * Point d'entrée serveur unique de la phase 1 : les écrans (client ou serveur) appellent les fonctions de l'API
 * par cette Server Action. Les données fictives restent sur le serveur (spec 0ter.4).
 * Les erreurs métier sont renvoyées sous forme { error } (en production, Next masque les messages des exceptions).
 */
import { cookies } from 'next/headers';
import { ApiError, ERR } from './errors';
import { context, DEVICE_COOKIE, ERROR_COOKIE, NOW_COOKIE, SESSION_COOKIE, type CallContext } from './server/mock/runtime';
import { registry } from './server/registry';

/** Pas d'export de type ici : un fichier 'use server' ne doit exporter que des fonctions (Turbopack). */
type RpcResult = { data: unknown } | { error: { code: string; message: string; status: number; details?: unknown } };

const YEAR = 365 * 86_400;

export async function rpc(name: string, args: unknown[]): Promise<RpcResult> {
  const fn = (registry as Record<string, unknown>)[name];
  if (typeof fn !== 'function') return { error: { code: ERR.NOT_FOUND, message: 'Fonction inconnue.', status: 404 } };
  const jar = await cookies();
  const ctx: CallContext = {
    sessionId: jar.get(SESSION_COOKIE)?.value ?? null,
    now: jar.get(NOW_COOKIE)?.value ?? null,
    mockError: jar.get(ERROR_COOKIE)?.value === '1',
    deviceId: jar.get(DEVICE_COOKIE)?.value ?? 'inconnu',
    writes: [],
  };
  try {
    const data = await context.run(ctx, () => (fn as (...a: unknown[]) => Promise<unknown>)(...args));
    for (const w of ctx.writes) {
      // Écriture possible seulement dans une action (pas pendant le rendu d'une page) : ignorée sinon.
      try {
        if (w.value === null) jar.delete(w.name);
        else jar.set(w.name, w.value, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 30 * 86_400 });
      } catch { /* rendu serveur : lecture seule */ }
    }
    if (!jar.get(DEVICE_COOKIE)) {
      try { jar.set(DEVICE_COOKIE, crypto.randomUUID(), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: YEAR }); } catch { /* lecture seule */ }
    }
    return { data };
  } catch (e) {
    if (e instanceof ApiError) return { error: { code: e.code, message: e.message, status: e.status, details: e.details } };
    console.error(`[rpc] ${name}`, e);
    return { error: { code: ERR.SERVER, message: 'Une erreur est survenue. Réessaie dans un instant.', status: 500 } };
  }
}

