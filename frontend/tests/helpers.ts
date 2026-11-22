import type { BrowserContext } from '@playwright/test';

export const IDS = {
  client: '0193a200-0000-7000-8000-000000000014',
  client2: '0193a200-0000-7000-8000-000000000015',
  vendor: '0193a200-0000-7000-8000-00000000000a',
  agent: '0193a200-0000-7000-8000-000000000003',
  superAdmin: '0193a200-0000-7000-8000-000000000001',
};

/** Aujourd'hui à 12h, heure de Porto-Novo (les plats du jour fictifs sont posés sur le jour courant). */
export const NOON = () => `${new Date(Date.now() + 3_600_000).toISOString().slice(0, 10)}T12:00:00+01:00`;

/** Session et horloge de démonstration : cookies lus par le serveur (lib/api/rpc.ts). */
export async function prepare(context: BrowserContext, baseURL: string, sessionId?: string | null) {
  const cookies = [{ name: 'okare_mock_now', value: encodeURIComponent(NOON()), url: baseURL }];
  // Sans compte : cookie « visitor » (sinon, en accès libre, on est la cliente de démonstration).
  cookies.push({ name: 'okare_session', value: sessionId ?? 'visitor', url: baseURL });
  await context.clearCookies();
  await context.addCookies(cookies);
}
