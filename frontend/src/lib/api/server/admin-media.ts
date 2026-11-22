/**
 * Médiathèque (DB11) et photos des points — GET /admin/media · POST /admin/media/:id/(approve|reject|assign) ·
 * POST /media (envoi) · PUT /pos/:id/cover. Phase 1 : l'image compressée sur le téléphone est gardée telle quelle.
 */
import 'server-only';
import { db } from '@/mocks';
import type { MediaKind, MockMedia } from '@/mocks/media';
import { ApiError, ERR } from '../errors';
import { assertPos, audit } from './mock/manage';
import { newId, requireUser, simulate } from './mock/runtime';
import { requireTeam } from './mock/team';

export type MediaState = 'PUBLISHED' | 'TO_REVIEW' | 'PROCESSING' | 'REJECTED';
export interface MediaRow {
  id: string; fileName: string; src: string | null; kind: MediaKind; state: MediaState; unassigned: boolean; source: 'UPLOAD' | 'WHATSAPP';
  owner: string; posId: string | null; uploadedBy: string; createdAt: string; sizeKb: number; rejectionReason: string | null;
}
export interface MediaLibrary { stats: { published: number; publishedMonth: number; toReview: number; unassigned: number }; items: MediaRow[] }

const isTeamUser = (roles: string[]) => roles.some((r) => r === 'FIELD_AGENT' || r === 'ADMIN' || r === 'SUPER_ADMIN');
const stateOf = (m: MockMedia): MediaState =>
  m.status === 'REJECTED' ? 'REJECTED' : m.status === 'PROCESSING' ? 'PROCESSING' : m.review === 'PENDING' ? 'TO_REVIEW' : 'PUBLISHED';

function posOf(m: MockMedia) {
  if (!m.ownerId) return null;
  if (m.ownerType === 'POS') return db.pointsOfSale.find((p) => p.id === m.ownerId) ?? null;
  const dish = db.dishes.find((d) => d.id === m.ownerId);
  return dish ? db.pointsOfSale.find((p) => p.id === dish.posId) ?? null : null;
}

function row(m: MockMedia): MediaRow {
  const pos = posOf(m);
  return {
    id: m.id, fileName: m.fileName, src: m.variants.card ?? null, kind: m.kind, state: stateOf(m), unassigned: !m.ownerId, source: m.source,
    owner: pos?.name ?? 'Reçue sur WhatsApp', posId: pos?.id ?? null, createdAt: m.createdAt, sizeKb: m.sizeKb, rejectionReason: m.rejectionReason,
    uploadedBy: db.users.find((u) => u.id === m.uploadedById)?.fullName ?? 'Équipe',
  };
}

export function getMediaLibrary(): Promise<MediaLibrary> {
  return simulate(() => {
    requireTeam('media.read');
    const live = db.media.filter((m) => !m.deletedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const published = live.filter((m) => m.ownerId && stateOf(m) === 'PUBLISHED');
    return {
      stats: {
        published: published.length, toReview: live.filter((m) => stateOf(m) === 'TO_REVIEW').length, unassigned: live.filter((m) => !m.ownerId).length,
        publishedMonth: published.filter((m) => Date.now() - new Date(m.createdAt).getTime() < 30 * 86_400_000).length,
      },
      items: live.map(row),
    };
  });
}

function find(id: string) {
  const m = db.media.find((x) => x.id === id && !x.deletedAt);
  if (!m) throw new ApiError(ERR.NOT_FOUND, 'Photo introuvable.', 404);
  return m;
}

/** Relecture : publier ou refuser (motif obligatoire) une photo envoyée par un vendeur. */
export function reviewMedia(id: string, decision: 'approve' | 'reject', reason?: string): Promise<{ ok: true }> {
  return simulate(() => {
    const { user } = requireTeam('media.read');
    const m = find(id);
    if (decision === 'reject' && !reason?.trim()) throw new ApiError(ERR.VALIDATION, 'Indique le motif du refus.', 400);
    Object.assign(m, decision === 'approve' ? { status: 'READY', review: 'DONE', rejectionReason: null } : { status: 'REJECTED', review: 'DONE', rejectionReason: reason!.trim() });
    audit(user, `media.${decision}`, 'Media', m.id, null, { reason });
    return { ok: true as const };
  });
}

/** Associer une photo reçue sur WhatsApp à un point de vente (façade ou autre photo). */
export function assignMedia(id: string, posId: string, kind: 'FACADE' | 'OTHER'): Promise<{ ok: true }> {
  return simulate(() => {
    const { user } = requireTeam('media.read');
    const m = find(id);
    const { pos } = assertPos(posId, 'pos.update');
    Object.assign(m, { ownerType: 'POS', ownerId: pos.id, kind, review: 'DONE', status: m.status === 'PROCESSING' ? 'READY' : m.status });
    if (kind === 'FACADE') pos.coverMediaId = m.id;
    audit(user, 'media.assign', 'Media', m.id, null, { posId: pos.id, kind });
    return { ok: true as const };
  });
}

export function deleteMedia(id: string): Promise<{ ok: true }> {
  return simulate(() => {
    const { user } = requireTeam('media.read');
    const m = find(id);
    m.deletedAt = new Date().toISOString();
    db.pointsOfSale.filter((p) => p.coverMediaId === m.id).forEach((p) => { p.coverMediaId = null; });
    audit(user, 'media.delete', 'Media', m.id, null, null);
    return { ok: true as const };
  });
}

/** Ajoute une photo à un point (façade = photo de l'entrée). Envoyée par un vendeur : relue avant publication. */
/** `byTeam` : envoyée depuis le dashboard (accès libre en phase 1 ; en phase 2, déduit du rôle). */
export function addPosPhoto(posId: string, kind: 'FACADE' | 'OTHER', dataUrl: string, fileName = 'photo.jpg', byTeam = false): Promise<{ id: string; review: boolean }> {
  return simulate(() => {
    const { pos } = assertPos(posId, 'pos.update');
    const user = requireUser();
    return storePhoto(pos.id, kind, dataUrl, fileName, user.id, byTeam || isTeamUser(user.roles));
  });
}

/** Utilisé aussi par la création d'un point (pos-create). */
export function storePhoto(posId: string, kind: 'FACADE' | 'OTHER', dataUrl: string, fileName: string, userId: string, trusted: boolean) {
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)) throw new ApiError(ERR.VALIDATION, 'Format de photo non reconnu.', 400);
  const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
  if (sizeKb > 2500) throw new ApiError(ERR.VALIDATION, 'Photo trop lourde (2,5 Mo au plus).', 400);
  const m: MockMedia = {
    id: newId(), ownerType: 'POS', ownerId: posId, sortOrder: 0, originalKey: `uploads/${fileName}`, variants: { card: dataUrl, full: dataUrl },
    width: null, height: null, status: 'READY', rejectionReason: null, uploadedById: userId, createdAt: new Date().toISOString(), deletedAt: null,
    fileName, kind, review: trusted ? 'DONE' : 'PENDING', source: 'UPLOAD', sizeKb,
  };
  db.media.push(m);
  const pos = db.pointsOfSale.find((p) => p.id === posId);
  if (pos && kind === 'FACADE') pos.coverMediaId = m.id;
  return { id: m.id, review: !trusted };
}

/** Photo de l'entrée d'un point (null = aucune, ou en attente de relecture pour le public). */
export function coverOf(posId: string): { src: string; pending: boolean } | null {
  const pos = db.pointsOfSale.find((p) => p.id === posId);
  const m = db.media.find((x) => x.id === pos?.coverMediaId && !x.deletedAt && x.status === 'READY');
  return m?.variants.card ? { src: m.variants.card, pending: m.review === 'PENDING' } : null;
}

export function getPosCover(posId: string): Promise<{ src: string; pending: boolean } | null> {
  return simulate(() => coverOf(assertPos(posId, 'pos.update').pos.id));
}

export function removePosCover(posId: string): Promise<{ ok: true }> {
  return simulate(() => {
    const { pos } = assertPos(posId, 'pos.update');
    pos.coverMediaId = null;
    return { ok: true as const };
  });
}
