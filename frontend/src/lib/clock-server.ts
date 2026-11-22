import 'server-only';
import { cookies } from 'next/headers';

/** Heure courante côté serveur (ou horloge fixe de démonstration du cookie `okare_mock_now`). */
export async function mockClock(): Promise<Date> {
  const raw = (await cookies()).get('okare_mock_now')?.value;
  const d = raw ? new Date(decodeURIComponent(raw)) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
