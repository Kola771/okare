/**
 * Identifiants fixes des données fictives : UUID v7 valides (version 7, variante 8), stables d'un chargement à l'autre.
 * Préfixes : 1 = géographie, 2 = comptes, 3 = vendeurs, 4 = points de vente, 5 = plats, 6 = catégories, 7 = clients, 8 = pubs.
 */
export const mockId = (group: number, n: number) =>
  `0193a${group.toString(16)}00-0000-7000-8000-${n.toString(16).padStart(12, '0')}`;

/** Date ISO fixe de référence pour les colonnes createdAt. */
export const T0 = '2026-09-01T08:00:00.000Z';

/** Instant ISO décalé de `days` jours par rapport à maintenant (dates relatives dans les mocks). */
export const isoDaysAgo = (days: number, now = new Date()) => new Date(now.getTime() - days * 86_400_000).toISOString();

export const USER = {
  superAdmin: mockId(2, 1),
  admin: mockId(2, 2),
  agentGanhi: mockId(2, 3),
  vendorMaman: mockId(2, 10),
  vendorRose: mockId(2, 11),
  vendorSenami: mockId(2, 12),
  vendorBio: mockId(2, 13),
  clientAicha: mockId(2, 20),
  clientKoffi: mockId(2, 21),
};

export const ZONE = {
  GANHI: mockId(1, 101),
  HAIE_VIVE: mockId(1, 102),
  CADJEHOUN: mockId(1, 103),
  GBEGAMEY: mockId(1, 104),
  MISSEBO: mockId(1, 105),
  AKPAKPA: mockId(1, 106),
  FIDJROSSE: mockId(1, 107),
  AGLA: mockId(1, 108),
};

export const POS = {
  mamanGanhi: mockId(4, 1),
  mamanAkpakpa: mockId(4, 2),
  tantieRose: mockId(4, 3),
  senami: mockId(4, 4),
  coinBio: mockId(4, 5),
  bonGout: mockId(4, 6),
  tantieAiko: mockId(4, 7),
  etalBenedicte: mockId(4, 8),
  palmier: mockId(4, 9),
  rachida: mockId(4, 10),
};
