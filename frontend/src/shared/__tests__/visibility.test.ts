import { describe, expect, it } from 'vitest';
import { getVisibilityClass, type PosAd, type VisibilityInput } from '../visibility';
import { canOnPos, hasPermission } from '../permissions';

const now = new Date('2026-11-20T12:00:00+01:00');
const ad = (plan: PosAd['plan'], zoneIds: string[]): PosAd =>
  ({ plan, status: 'PAID', startDate: '2026-11-18', endDate: '2026-11-25', zoneIds });
const base: VisibilityInput = { subscriptionsEnabled: true, vendor: { subscriptionRequiredFrom: '2026-11-10T00:00:00Z' }, ads: [], onActiveWaitlist: false };

describe('getVisibilityClass (11.0 f)', () => {
  it('Premium passe devant, pub normale = PROMOTED', () => {
    expect(getVisibilityClass({ ...base, ads: [ad('PREMIUM', ['z1'])] }, 'z1', now)).toBe('PREMIUM');
    expect(getVisibilityClass({ ...base, ads: [ad('PERIOD', ['z1'])] }, 'z1', now)).toBe('PROMOTED');
  });
  it('abonnements désactivés → jamais REDUCED', () => {
    expect(getVisibilityClass({ ...base, subscriptionsEnabled: false }, 'z1', now)).toBe('STANDARD');
  });
  it('préavis en cours → STANDARD ; terminé sans pub → REDUCED', () => {
    expect(getVisibilityClass({ ...base, vendor: { subscriptionRequiredFrom: '2026-11-28T00:00:00Z' } }, 'z1', now)).toBe('STANDARD');
    expect(getVisibilityClass(base, 'z1', now)).toBe('REDUCED');
  });
  it('liste d\'attente ou pub ailleurs → STANDARD', () => {
    expect(getVisibilityClass({ ...base, onActiveWaitlist: true }, 'z1', now)).toBe('STANDARD');
    expect(getVisibilityClass({ ...base, ads: [ad('MONTH', ['z2'])] }, 'z1', now)).toBe('STANDARD');
  });
});

describe('permissions (5.2, 5.3)', () => {
  it('un client ne gère pas de plat ; un vendeur oui', () => {
    expect(hasPermission(['CLIENT'], 'dish.manage')).toBe(false);
    expect(hasPermission(['VENDOR'], 'dish.manage')).toBe(true);
  });
  it('agent : seulement ses zones (une ou plusieurs)', () => {
    const agent = { id: 'a', roles: ['FIELD_AGENT' as const], agentZoneIds: ['z1', 'z2'] };
    expect(canOnPos(agent, { zoneId: 'z2', vendorUserId: null }, 'dish.manage')).toBe(true);
    expect(canOnPos(agent, { zoneId: 'z3', vendorUserId: null }, 'dish.manage')).toBe(false);
  });
  it('vendeur : seulement ses points', () => {
    const v = { id: 'u1', roles: ['VENDOR' as const], agentZoneIds: [] };
    expect(canOnPos(v, { zoneId: 'z1', vendorUserId: 'u1' }, 'pos.update')).toBe(true);
    expect(canOnPos(v, { zoneId: 'z1', vendorUserId: 'u2' }, 'pos.update')).toBe(false);
  });
});
