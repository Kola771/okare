/** Profil du vendeur — PATCH /vendor/me (nom affiché, nom du responsable). */
import 'server-only';
import { ApiError, ERR } from '../errors';
import { audit, currentVendor } from './mock/manage';
import { persist, simulate } from './mock/runtime';

export function updateVendorProfile(input: { displayName?: string; contactName?: string }): Promise<{ ok: true }> {
  return simulate(() => {
    const { user, vendor } = currentVendor();
    const name = input.displayName?.trim();
    if (name !== undefined && (name.length < 2 || name.length > 60)) {
      throw new ApiError(ERR.VALIDATION, 'Nom affiché : 2 à 60 caractères.', 400, { displayName: 'Entre 2 et 60 caractères.' });
    }
    const before = { ...vendor };
    if (name) vendor.displayName = name;
    if (input.contactName !== undefined) vendor.contactName = input.contactName.trim() || null;
    vendor.updatedAt = new Date().toISOString();
    audit(user, 'vendor.update', 'Vendor', vendor.id, before, vendor);
    persist();
    return { ok: true as const };
  });
}

