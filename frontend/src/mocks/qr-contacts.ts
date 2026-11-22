/**
 * Contacts d'exemple arrivés par le QR code (source = QR, 12.6) sur les 7 derniers jours : environ 4 scans sur 10
 * finissent en commande. Sert au chiffre « commandes après un scan » (écran 18), calculé comme le fera le backend.
 */
import type { ContactEvent } from '@/shared/types';
import { mockId, USER, ZONE } from './ids';
import { POINTS_OF_SALE } from './points-of-sale';
import { POS_DAILY_STATS } from './stats';

const recent = (d: string) => Date.now() - new Date(`${d}T12:00:00Z`).getTime() < 7 * 86_400_000;

let n = 500;
export const QR_CONTACTS: ContactEvent[] = POS_DAILY_STATS.filter((s) => recent(s.businessDate)).flatMap((s) => {
  const pos = POINTS_OF_SALE.find((p) => p.id === s.posId)!;
  return Array.from({ length: Math.round(s.qrScans * 0.4) }, (_, i) => ({
    id: mockId(7, n++), posId: pos.id, vendorId: pos.vendorId, userId: USER.clientKoffi, dishId: null,
    dishNameSnap: null, dishPriceSnap: null, dishCategoryId: null, channel: 'WHATSAPP' as const, source: 'QR' as const,
    posZoneId: pos.zoneId, viewerZoneId: ZONE.GANHI, subscriptionId: null, deviceId: `qr-demo-${i}`, ipHash: null,
    isCounted: true, notCountedReason: null, createdAt: `${s.businessDate}T${String(11 + (i % 3)).padStart(2, '0')}:30:00.000Z`,
  }));
});
