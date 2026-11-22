/**
 * OKARE — seed de la base (backend/prisma/seeder.ts)
 *
 * Lancer : cd backend && npx prisma db seed   (backend/package.json : "prisma": { "seed": "tsx prisma/seeder.ts" })
 *
 * Idempotent : on peut le relancer autant de fois qu'on veut.
 *  - Référentiels (pays, ville, catégories, zones, quartiers, jours fériés, catégories de plats) : upsert.
 *  - Grille des prix, permissions, paramètres : créés s'ils manquent, JAMAIS écrasés
 *    (un admin a pu les modifier dans le dashboard).
 *  - Super-admin : créé depuis les variables d'environnement, ou mis à jour (rôles) s'il existe.
 *  - Données de démonstration : seulement si SEED_DEMO=true, jamais en production,
 *    et une seule fois (ignorées si elles existent déjà).
 *
 * Variables d'environnement :
 *   DATABASE_URL                       (obligatoire)
 *   SUPER_ADMIN_PHONE                  (obligatoire, format +2290XXXXXXXXX)
 *   SUPER_ADMIN_EMAIL                  (facultatif)
 *   SUPER_ADMIN_PASSWORD               (obligatoire à la première création, 12 caractères au moins)
 *   SUPER_ADMIN_NAME                   (facultatif)
 *   SEED_DEMO=true                     (facultatif ; refusé si NODE_ENV=production)
 *
 * Les colonnes géographiques (PostGIS) sont écrites en SQL brut : Prisma ne sait pas les créer.
 */
import { PrismaClient, Prisma, Role, PosType, MealMoment } from '@prisma/client';
import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';

const prisma = new PrismaClient();
const TZ = 'Africa/Porto-Novo';
const PHONE_RE = /^\+2290[1-9]\d{8}$/;

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------

/** UUID v7 (horodaté), pour les lignes insérées en SQL brut. */
function uuidv7(): string {
  const b = randomBytes(16);
  const ts = BigInt(Date.now());
  b[0] = Number((ts >> 40n) & 0xffn);
  b[1] = Number((ts >> 32n) & 0xffn);
  b[2] = Number((ts >> 24n) & 0xffn);
  b[3] = Number((ts >> 16n) & 0xffn);
  b[4] = Number((ts >> 8n) & 0xffn);
  b[5] = Number(ts & 0xffn);
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Jour métier (Africa/Porto-Novo) sous forme 'YYYY-MM-DD', décalé de `offsetDays`. */
function businessDay(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
/** Date à minuit UTC pour une colonne @db.Date. */
const asDate = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const up10 = (x: number) => Math.ceil(x / 10) * 10;
const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const QR_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
function qrCode(): string {
  const b = randomBytes(6);
  return Array.from(b, (x) => QR_ALPHABET[x % QR_ALPHABET.length]).join('');
}

/** Rectangle approximatif autour d'un centre (à redessiner dans DB5). */
function boxWkt(lat: number, lng: number, dLat = 0.0045, dLng = 0.0045): string {
  const [s, n, w, e] = [lat - dLat, lat + dLat, lng - dLng, lng + dLng];
  return `MULTIPOLYGON(((${w} ${s}, ${e} ${s}, ${e} ${n}, ${w} ${n}, ${w} ${s})))`;
}

// ---------------------------------------------------------------------------
// Référentiels
// ---------------------------------------------------------------------------

/** Catégories de zones : places de pub par jour par défaut. */
const ZONE_CATEGORIES = [
  { code: 'A', label: "A — centre d'affaires", defaultDailySlots: 20 },
  { code: 'B', label: 'B — résidentiel dense', defaultDailySlots: 30 },
  { code: 'C', label: 'C — périphérie', defaultDailySlots: 60 },
] as const;

/** Grille des prix (FCFA) : prix d'un jour par catégorie de zone et type de point de vente (OKARE_SPEC.md 11.2).
 *  C'est le seul prix stocké : Période, Mois et Premium se calculent à partir de lui. */
const PRICE_GRID: Record<'A' | 'B' | 'C', Record<PosType, number>> = {
  A: { PARTICULIER: 300, MAQUIS: 500, RESTAURANT: 800 },
  B: { PARTICULIER: 200, MAQUIS: 300, RESTAURANT: 500 },
  C: { PARTICULIER: 100, MAQUIS: 200, RESTAURANT: 300 },
};

/** Zones de Cotonou (polygones approximatifs : rectangles autour du centre). */
const ZONES = [
  { code: 'GANHI', name: 'Ganhi', cat: 'A', lat: 6.3585, lng: 2.4300, active: true,
    neighborhoods: [['Ganhi', ['ganhi']], ['Akpakpa-Dodomè', []], ['Xwlacodji', ['houlacodji']]] },
  { code: 'HAIE_VIVE', name: 'Haie Vive', cat: 'A', lat: 6.3550, lng: 2.3935, active: true,
    neighborhoods: [['Haie Vive', ['haie-vive']], ['Cocotiers', ['les cocotiers']]] },
  { code: 'CADJEHOUN', name: 'Cadjèhoun', cat: 'B', lat: 6.3600, lng: 2.3835, active: true,
    neighborhoods: [['Cadjèhoun', ['cadjehoun', 'kadjehoun']], ['Gbégamey-Sud', []]] },
  { code: 'GBEGAMEY', name: 'Gbégamey', cat: 'B', lat: 6.3700, lng: 2.4040, active: true,
    neighborhoods: [['Gbégamey', ['gbegamey']], ['Saint-Michel', ['st michel']]] },
  { code: 'MISSEBO', name: 'Missébô', cat: 'B', lat: 6.3680, lng: 2.4260, active: true,
    neighborhoods: [['Missébô', ['missebo', 'misebo']], ['Dantokpa', ['tokpa']]] },
  { code: 'AKPAKPA', name: 'Akpakpa', cat: 'C', lat: 6.3660, lng: 2.4520, active: true,
    neighborhoods: [['Akpakpa', ['akpakpa']], ['Sègbèya', ['segbeya']], ['PK3', ['pk 3']]] },
  { code: 'FIDJROSSE', name: 'Fidjrossè', cat: 'C', lat: 6.3560, lng: 2.3550, active: true,
    neighborhoods: [['Fidjrossè', ['fidjrosse']], ['Fidjrossè-Plage', ['fidjrosse plage']]] },
  { code: 'AGLA', name: 'Agla', cat: 'C', lat: 6.3820, lng: 2.3790, active: true,
    neighborhoods: [['Agla', ['agla']], ['Hlazounto', []]] },
] as const;

/**
 * Jours fériés du Bénin. Les fêtes religieuses mobiles (Ramadan, Tabaski, Maouloud)
 * sont des dates estimées : à confirmer chaque année par le décret du gouvernement (DB5).
 */
const HOLIDAYS: [string, string][] = [
  ['2026-01-01', "Jour de l'an"], ['2026-01-10', 'Fête du Vodoun'], ['2026-03-20', 'Ramadan (estimé)'],
  ['2026-04-06', 'Lundi de Pâques'], ['2026-05-01', 'Fête du Travail'], ['2026-05-14', 'Ascension'],
  ['2026-05-25', 'Lundi de Pentecôte'], ['2026-05-27', 'Tabaski (estimé)'], ['2026-08-01', "Fête de l'Indépendance"],
  ['2026-08-15', 'Assomption'], ['2026-08-26', 'Maouloud (estimé)'], ['2026-11-01', 'Toussaint'], ['2026-12-25', 'Noël'],
  ['2027-01-01', "Jour de l'an"], ['2027-01-10', 'Fête du Vodoun'], ['2027-03-10', 'Ramadan (estimé)'],
  ['2027-03-29', 'Lundi de Pâques'], ['2027-05-01', 'Fête du Travail'], ['2027-05-06', 'Ascension'],
  ['2027-05-17', 'Lundi de Pentecôte'], ['2027-05-17', 'Tabaski (estimé)'], ['2027-08-01', "Fête de l'Indépendance"],
  ['2027-08-15', 'Assomption'], ['2027-08-15', 'Maouloud (estimé)'], ['2027-11-01', 'Toussaint'], ['2027-12-25', 'Noël'],
];

/** Catégories de plats. illustrationKey → design/assets/plats/{key}.svg (image par défaut sans photo). */
const DISH_CATEGORIES: { name: string; family: string; key: string | null; aliases: string[] }[] = [
  { name: 'Riz sauce arachide', family: 'Riz', key: 'riz', aliases: ['riz arachide', 'riz sauce d\'arachide'] },
  { name: 'Riz au gras', family: 'Riz', key: 'riz', aliases: ['riz gras', 'riz jollof'] },
  { name: 'Riz sauce tomate', family: 'Riz', key: 'riz', aliases: ['riz tomate'] },
  { name: 'Atassi', family: 'Riz', key: 'atassi', aliases: ['watché', 'riz haricot', 'waakye'] },
  { name: 'Pâte rouge (amiwo)', family: 'Pâte', key: 'pate', aliases: ['amiwo', 'pate rouge'] },
  { name: 'Pâte blanche sauce légumes', family: 'Pâte', key: 'pate', aliases: ['pâte de maïs', 'owo', 'pate blanche'] },
  { name: 'Akassa', family: 'Pâte', key: 'pate', aliases: ['akassa sauce'] },
  { name: 'Ablo', family: 'Pâte', key: 'pate', aliases: ['ablo poisson'] },
  { name: 'Igname pilée', family: 'Igname', key: 'igname', aliases: ['agoun', 'igname pilee', 'foufou'] },
  { name: 'Wassa-wassa', family: 'Igname', key: 'igname', aliases: ['wassa wassa'] },
  { name: 'Spaghetti omelette', family: 'Pâtes', key: 'spaghetti', aliases: ['spaghetti', 'spag omelette'] },
  { name: 'Alloco', family: 'Banane', key: 'aloko', aliases: ['aloko', 'banane frite'] },
  { name: 'Attiéké poisson', family: 'Manioc', key: 'attieke', aliases: ['attieke', 'garba'] },
  { name: 'Gari et haricots', family: 'Manioc', key: null, aliases: ['abobo', 'haricot gari'] },
  { name: 'Poisson braisé', family: 'Grillades', key: null, aliases: ['poisson braise'] },
  { name: 'Poulet bicyclette', family: 'Grillades', key: null, aliases: ['poulet braisé', 'poulet local'] },
  { name: 'Bouillie', family: 'Petit-déjeuner', key: null, aliases: ['koko', 'bouillie de maïs'] },
  { name: 'Beignets', family: 'Petit-déjeuner', key: null, aliases: ['yovo doko', 'botokoin'] },
];

/**
 * Permissions par défaut (OKARE_SPEC.md 5.2). `true` = accordé ; le périmètre
 * (ses points, ses zones) est vérifié par ScopeService, pas ici.
 */
const ALL_ROLES: Role[] = ['CLIENT', 'VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'];
const PERMISSIONS: Record<string, Role[]> = {
  'pos.read.public': ALL_ROLES,
  'contact.create': ALL_ROLES,
  'favorite.manage': ALL_ROLES,
  'followup.answer': ALL_ROLES,
  'report.create': ALL_ROLES,
  'review.create': ALL_ROLES,
  'vendor.create': ['VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'],
  'pos.create': ['VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'],
  'pos.update': ['VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'],
  'dish.manage': ['VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'],
  'special.manage': ['VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'],
  'hours.manage': ['VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'],
  'qr.read': ['VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'],
  'pos.stats.read': ['VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'],
  'stats.share': ['VENDOR', 'FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'],
  'review.reply': ['VENDOR', 'ADMIN', 'SUPER_ADMIN'],
  'subscription.buy': ['VENDOR'],
  'payment.link.send': ['FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'],
  'subscription.complimentary': ['ADMIN', 'SUPER_ADMIN'],
  'payment.refund': ['SUPER_ADMIN'],
  'pos.moderate': ['ADMIN', 'SUPER_ADMIN'],
  'review.moderate': ['ADMIN', 'SUPER_ADMIN'],
  'report.resolve': ['ADMIN', 'SUPER_ADMIN'],
  'responsetest.create': ['FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'],
  'geo.read': ['FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'],
  'geo.manage': ['ADMIN', 'SUPER_ADMIN'],
  'pricing.manage': ['ADMIN', 'SUPER_ADMIN'],
  'slots.manage': ['ADMIN', 'SUPER_ADMIN'],
  'user.manage': ['ADMIN', 'SUPER_ADMIN'],
  'role.assign': ['SUPER_ADMIN'],
  'permission.manage': ['SUPER_ADMIN'],
  'settings.manage': ['SUPER_ADMIN'],
  'subscriptions.toggle': ['SUPER_ADMIN'],
  'subscriptions.read': ['FIELD_AGENT', 'ADMIN', 'SUPER_ADMIN'],
  'audit.read': ['ADMIN', 'SUPER_ADMIN'],
  'media.read': ['ADMIN', 'SUPER_ADMIN'],
};

const DEFAULT_MESSAGE =
  "Bonjour {prenom}, merci d'être sur OKARE depuis {anciennete} : {point} a reçu {contacts_mois} contacts le mois dernier. " +
  'À partir du {date}, la visibilité devient payante. Pour ta zone : {prix_jour} le jour, {prix_mois} le mois. ' +
  'Sans pub, ton point reste sur OKARE mais sera moins visible. Choisis ta pub et paie par Mobile Money : {lien}';

/** Paramètres par défaut (OKARE_SPEC.md section 23). */
const SETTINGS: Record<string, Prisma.InputJsonValue> = {
  vendorSelfService: true,
  'subscriptions.enabled': false,
  'subscriptions.minVendorAgeDays': 30,
  'subscriptions.noticeDays': 7,
  'subscriptions.messageTemplate': DEFAULT_MESSAGE,
  'subscriptions.reminderBeforeDays': 2,
  'subscriptions.remindMinHours': 72,
  'subscriptions.maxMessagesPerMinute': 30,
  'subscriptions.allowComplimentary': true,
  'subscriptions.complimentaryMaxDays': 7,
  'subscriptions.version': 0,
  'ads.maxZones.DAY': 3,
  'ads.maxZones.PERIOD': 5,
  'ads.maxZones.MONTH': 7,
  'ads.maxZones.PREMIUM': 15,
  'ads.periodMinDays': 2,
  'ads.periodMaxDays': 21,
  'ads.monthDays': 30,
  'ads.premiumDays': 30,
  'ads.discounts': { main: { DAY: 0, PERIOD: 10, MONTH: 10, PREMIUM: 5 }, other: { DAY: 20, PERIOD: 20, MONTH: 20, PREMIUM: 15 } },
  'ads.premiumCoefficient': 1.5,
  'ads.mainPosWindowDays': 30,
  'ads.maxStartAheadDays': 60,
  'ads.sameDayCutoffHour': 15,
  'payments.provider': 'FEDAPAY',
  'payments.methods': ['MTN', 'MOOV', 'CELTIIS', 'CARD'],
  'payments.holdMinutes': 30,
  'payments.linkHoldHours': 24,
  'payments.reconcileEveryMinutes': 5,
  'payments.reconcileMaxAgeHours': 24,
  'waitlist.offerHours': 24,
  'reviews.minToDisplay': 5,
  'reviews.windowDays': 14,
  'reviews.maxCommentLength': 500,
  'reviews.bannedWords': [],
  'prospect.minWeeklyContacts': 5,
  'contact.dedupeMinutes': 30,
  'contact.maxCountedPerUserPerDay': 20,
  'device.maxAccountsPerDay': 3,
  'followup.minDelayMin': 10,
  'followup.maxDelayHours': 48,
  'followup.retryAfterHours': 3,
  'response.window': 10,
  'response.windowDays': 60,
  'response.minSamples': 5,
  'response.lowThreshold': 0.5,
  'responseTest.timeoutHours': 2,
  'report.reviewThreshold': 3,
  'report.reviewWindowDays': 7,
  'freshness.warnDays': 7,
  'freshness.penaltyDays': 14,
  'freshness.inactiveDays': 45,
  'special.maxPerPosPerDay': 3,
  'slots.maxShareParticulier': 0.5,
  'privacy.publicPointOffsetMeters': [200, 400],
  'security.teamTotpRequired': true,
  'security.maxDistinctPosContactsPerDay': 20,
  'hours.closingSoonMinutes': 30,
  'hours.closedTodayReportThreshold': 2,
  'hours.reconfirmAfterDays': 60,
  'search.nearbyRadiusMeters': 1500,
  'push.favoritesDigestTime': '10:15',
  'whatsapp.messageTemplate':
    "Bonjour {posName}, je vous ai trouvé sur OKARE. {dishLine}Qu'est-ce que vous avez aujourd'hui ?",
};

// ---------------------------------------------------------------------------
// Étapes
// ---------------------------------------------------------------------------

async function seedGeography() {
  const country = await prisma.country.upsert({
    where: { code: 'BJ' },
    update: {},
    create: { code: 'BJ', name: 'Bénin', currency: 'XOF', timezone: TZ, phoneRegex: PHONE_RE.source, isActive: true },
  });

  const city = await prisma.city.upsert({
    where: { slug: 'cotonou' },
    update: {},
    create: { countryId: country.id, name: 'Cotonou', slug: 'cotonou', isActive: true },
  });
  await prisma.$executeRaw`UPDATE cities SET center = ST_SetSRID(ST_MakePoint(2.4183, 6.3654), 4326)::geography
                           WHERE id = ${city.id}::uuid AND center IS NULL`;

  const categories: Record<string, string> = {};
  for (const c of ZONE_CATEGORIES) {
    const row = await prisma.zoneCategory.upsert({
      where: { cityId_code: { cityId: city.id, code: c.code } },
      update: {},
      create: { cityId: city.id, code: c.code, label: c.label, defaultDailySlots: c.defaultDailySlots },
    });
    categories[c.code] = row.id;
  }

  // Grille des prix : créée si absente, jamais écrasée.
  for (const [code, types] of Object.entries(PRICE_GRID)) {
    for (const [posType, day] of Object.entries(types)) {
      await prisma.priceGrid.upsert({
        where: { categoryId_posType: { categoryId: categories[code], posType: posType as PosType } },
        update: {},
        create: { categoryId: categories[code], posType: posType as PosType, dayPriceXof: day },
      });
    }
  }

  const zones: Record<string, { id: string; lat: number; lng: number; cat: string }> = {};
  for (const z of ZONES) {
    const row = await prisma.zone.upsert({
      where: { cityId_code: { cityId: city.id, code: z.code } },
      update: {},
      create: { cityId: city.id, categoryId: categories[z.cat], name: z.name, code: z.code, isActive: z.active },
    });
    // Polygone seulement s'il n'a pas encore été dessiné (on n'écrase pas le travail de l'admin).
    await prisma.$executeRaw`UPDATE zones SET boundary = ST_GeomFromText(${boxWkt(z.lat, z.lng)}, 4326)::geography
                             WHERE id = ${row.id}::uuid AND boundary IS NULL`;
    for (const [name, aliases] of z.neighborhoods) {
      await prisma.neighborhood.upsert({
        where: { zoneId_name: { zoneId: row.id, name } },
        update: {},
        create: { zoneId: row.id, name, aliases: [...aliases] },
      });
    }
    zones[z.code] = { id: row.id, lat: z.lat, lng: z.lng, cat: z.cat };
  }

  for (const [ymd, name] of HOLIDAYS) {
    await prisma.publicHoliday.upsert({
      where: { countryId_date: { countryId: country.id, date: asDate(ymd) } },
      update: {},
      create: { countryId: country.id, date: asDate(ymd), name },
    });
  }

  console.log(`✓ Géographie : Bénin, Cotonou, ${ZONE_CATEGORIES.length} catégories, ${ZONES.length} zones, grille des prix, ${HOLIDAYS.length} jours fériés`);
  return { country, city, zones };
}

async function seedDishCategories() {
  const ids: Record<string, string> = {};
  for (const [i, c] of DISH_CATEGORIES.entries()) {
    const row = await prisma.dishCategory.upsert({
      where: { slug: slugify(c.name) },
      update: { illustrationKey: c.key, family: c.family },
      create: { name: c.name, slug: slugify(c.name), family: c.family, illustrationKey: c.key, aliases: c.aliases, sortOrder: i },
    });
    ids[c.name] = row.id;
  }
  console.log(`✓ Catégories de plats : ${DISH_CATEGORIES.length}`);
  return ids;
}

async function seedPermissions() {
  let created = 0;
  for (const [permission, roles] of Object.entries(PERMISSIONS)) {
    for (const role of ALL_ROLES) {
      const exists = await prisma.rolePermission.findUnique({ where: { role_permission: { role, permission } } });
      if (!exists) {
        await prisma.rolePermission.create({ data: { role, permission, granted: roles.includes(role) } });
        created++;
      }
    }
  }
  console.log(`✓ Permissions : ${created} créées (les valeurs existantes sont gardées)`);
}

async function seedSettings() {
  let created = 0;
  for (const [key, value] of Object.entries(SETTINGS)) {
    const exists = await prisma.setting.findUnique({ where: { key } });
    if (!exists) {
      await prisma.setting.create({ data: { key, value } });
      created++;
    }
  }
  console.log(`✓ Paramètres : ${created} créés (les valeurs existantes sont gardées)`);
}

async function seedSuperAdmin() {
  const phone = process.env.SUPER_ADMIN_PHONE?.trim();
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() || null;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const fullName = process.env.SUPER_ADMIN_NAME?.trim() || 'Super-admin OKARE';
  if (!phone || !PHONE_RE.test(phone)) {
    throw new Error('SUPER_ADMIN_PHONE manquant ou invalide (attendu : +2290XXXXXXXXX)');
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    const roles = Array.from(new Set<Role>([...existing.roles, 'SUPER_ADMIN']));
    await prisma.user.update({ where: { id: existing.id }, data: { roles, ...(email && !existing.email ? { email } : {}) } });
    console.log(`✓ Super-admin existant (${phone}) : rôle vérifié, mot de passe inchangé`);
    return existing.id;
  }
  if (!password || password.length < 12) {
    throw new Error('SUPER_ADMIN_PASSWORD manquant ou trop court (12 caractères au moins) pour créer le super-admin');
  }
  const user = await prisma.user.create({
    data: {
      phone, email, fullName,
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      roles: ['SUPER_ADMIN'],
      phoneVerifiedAt: new Date(),
      // TOTP : à activer à la première connexion (obligatoire pour l'équipe).
    },
  });
  console.log(`✓ Super-admin créé (${phone}) — activer la double authentification à la première connexion`);
  return user.id;
}

// ---------------------------------------------------------------------------
// Démo (SEED_DEMO=true)
// ---------------------------------------------------------------------------

const HOURS = {
  maquis: { '1': [['07:00', '15:00']], '2': [['07:00', '15:00']], '3': [['07:00', '15:00']], '4': [['07:00', '15:00']], '5': [['07:00', '15:00']], '6': [['08:00', '14:00']] },
  resto: { '1': [['11:30', '15:00'], ['18:30', '23:00']], '2': [['11:30', '15:00'], ['18:30', '23:00']], '3': [['11:30', '15:00'], ['18:30', '23:00']], '4': [['11:30', '15:00'], ['18:30', '23:00']], '5': [['11:30', '15:00'], ['18:30', '23:30']], '6': [['18:30', '23:30']] },
  maison: { '1': [['10:00', '19:00']], '2': [['10:00', '19:00']], '3': [['10:00', '19:00']], '4': [['10:00', '19:00']], '5': [['10:00', '19:00']] },
};

type DemoPos = {
  name: string; type: PosType; zone: string; lat: number; lng: number; landmark: string;
  hours: object; whatsapp: string; hasPublicPlace?: boolean; delivers?: boolean;
  dishes: [string, number, string, MealMoment][]; // nom, prix, catégorie, moment
};
type DemoVendor = { displayName: string; contactName: string; phone: string; agePublishedDays: number; pos: DemoPos[] };

const DEMO_VENDORS: DemoVendor[] = [
  {
    displayName: 'Chez Maman', contactName: 'Maman Afi', phone: '+2290197000001', agePublishedDays: 75,
    pos: [
      { name: 'Chez Maman · Ganhi', type: 'MAQUIS', zone: 'GANHI', lat: 6.3581, lng: 2.4296, landmark: 'Derrière la BOA, à côté du kiosque MTN',
        hours: HOURS.maquis, whatsapp: '+2290197000001',
        dishes: [['Riz sauce arachide', 700, 'Riz sauce arachide', 'LUNCH'], ['Atassi', 500, 'Atassi', 'BREAKFAST'],
                 ['Pâte rouge au poisson', 800, 'Pâte rouge (amiwo)', 'LUNCH'], ['Spaghetti omelette', 600, 'Spaghetti omelette', 'ALL_DAY']] },
      { name: 'Chez Maman · Akpakpa', type: 'MAQUIS', zone: 'AKPAKPA', lat: 6.3662, lng: 2.4515, landmark: 'Marché de Sègbèya, entrée côté pharmacie',
        hours: HOURS.maquis, whatsapp: '+2290197000002', delivers: true,
        dishes: [['Igname pilée sauce graine', 1200, 'Igname pilée', 'LUNCH'], ['Alloco poisson', 1000, 'Alloco', 'DINNER']] },
    ],
  },
  {
    displayName: 'Tantie Rose', contactName: 'Rose Hounkpè', phone: '+2290197000003', agePublishedDays: 50,
    pos: [
      { name: 'Restaurant Tantie Rose', type: 'RESTAURANT', zone: 'CADJEHOUN', lat: 6.3602, lng: 2.3840, landmark: 'Face à la pharmacie Cadjèhoun',
        hours: HOURS.resto, whatsapp: '+2290197000003',
        dishes: [['Poulet bicyclette et frites', 3500, 'Poulet bicyclette', 'DINNER'], ['Riz au gras poulet', 2500, 'Riz au gras', 'LUNCH'],
                 ['Poisson braisé attiéké', 3000, 'Attiéké poisson', 'DINNER']] },
    ],
  },
  {
    // Un Particulier (vente en ligne) n'a qu'un seul point de vente.
    displayName: 'La cuisine de Sènami', contactName: 'Sènami Dossou', phone: '+2290197000005', agePublishedDays: 40,
    pos: [
      { name: 'La cuisine de Sènami', type: 'PARTICULIER', zone: 'AGLA', lat: 6.3818, lng: 2.3795, landmark: 'Livraison ou retrait sur rendez-vous',
        hours: HOURS.maison, whatsapp: '+2290197000005', hasPublicPlace: false, delivers: true,
        dishes: [['Igname pilée sauce graine', 1200, 'Igname pilée', 'LUNCH'], ['Ablo poisson', 1000, 'Ablo', 'DINNER']] },
    ],
  },
  {
    displayName: 'Le Coin de Bio', contactName: 'Bio Guéra', phone: '+2290197000004', agePublishedDays: 12,
    pos: [
      { name: 'Le Coin de Bio', type: 'MAQUIS', zone: 'GBEGAMEY', lat: 6.3703, lng: 2.4045, landmark: 'Carrefour Gbégamey, sous le manguier',
        hours: HOURS.maquis, whatsapp: '+2290197000004',
        dishes: [['Akassa sauce tomate', 400, 'Akassa', 'LUNCH'], ['Bouillie et beignets', 300, 'Bouillie', 'BREAKFAST'],
                 ['Gari et haricots', 350, 'Gari et haricots', 'LUNCH']] },
    ],
  },
];

async function insertPos(p: DemoPos, vendorId: string, zoneId: string, actorId: string): Promise<string> {
  const slug = slugify(p.name);
  const found = await prisma.pointOfSale.findUnique({ where: { slug }, select: { id: true } });
  if (found) return found.id;
  const id = uuidv7();
  const now = new Date();
  const hasPublicPlace = p.hasPublicPlace ?? true;
  // Particulier sans lieu public : point décalé d'environ 300 m, calculé une fois (12.5).
  const pubLat = hasPublicPlace ? null : p.lat + 0.0019;
  const pubLng = hasPublicPlace ? null : p.lng + 0.0019;
  await prisma.$executeRaw`
    INSERT INTO points_of_sale
      (id, "vendorId", slug, name, type, status, version, "qrCode", "zoneId", location, "locationAccuracyM",
       "hasPublicPlace", "publicPoint", landmark, "whatsappPhone", "whatsappVerifiedAt", "openingHours", "hoursConfirmedAt",
       "holidayPolicy", "servesOnSite", "servesTakeaway", delivers, "deliveryZoneIds", "acceptsCash", "acceptsMomo",
       "consentAt", "consentById", "publishedAt", "pricesCheckedAt", "ratingCount", "createdById", "createdAt", "updatedAt")
    VALUES
      (${id}::uuid, ${vendorId}::uuid, ${slug}, ${p.name}, ${p.type}::"PosType", 'PUBLISHED'::"PosStatus", 1, ${qrCode()},
       ${zoneId}::uuid, ST_SetSRID(ST_MakePoint(${p.lng}, ${p.lat}), 4326)::geography, 15,
       ${hasPublicPlace},
       CASE WHEN ${pubLat}::float8 IS NULL THEN NULL ELSE ST_SetSRID(ST_MakePoint(${pubLng}::float8, ${pubLat}::float8), 4326)::geography END,
       ${p.landmark}, ${p.whatsapp}, ${now}, ${JSON.stringify(p.hours)}::jsonb, ${now},
       'UNKNOWN'::"HolidayPolicy", ${hasPublicPlace}, true, ${p.delivers ?? false}, '{}'::uuid[], true, true,
       ${now}, ${actorId}::uuid, ${now}, ${now}, 0, ${actorId}::uuid, ${now}, ${now})`;
  return id;
}

const MAX_ZONES = { DAY: 3, PERIOD: 5, MONTH: 7, PREMIUM: 15 } as const;

const DISCOUNTS = {
  main: { DAY: 0, PERIOD: 10, MONTH: 10, PREMIUM: 5 },
  other: { DAY: 20, PERIOD: 20, MONTH: 20, PREMIUM: 15 },
} as const;
const PREMIUM_COEFFICIENT = 1.5;

/**
 * Prix d'une pub (même règle que frontend/src/shared/pricing.ts, OKARE_SPEC.md 11.2) :
 *  - Un jour : somme des prix d'un jour des zones ;
 *  - Période (2 à 21 jours) : prix d'un jour de la zone la plus chère × jours ;
 *  - Un mois : zone la plus chère × 30 ;
 *  - Premium : zone la plus chère × 30 × 1,5 ;
 *  - remises : point principal 0 / 10 / 10 / 5 %, autres points 20 / 20 / 20 / 15 %.
 * zonePrices = prix d'un jour de chaque zone, figé dans SubscriptionZone.
 */
function quote(posType: PosType, plan: 'DAY' | 'PERIOD' | 'MONTH' | 'PREMIUM', zoneCats: ('A' | 'B' | 'C')[], days: number, isMainPos: boolean) {
  if (zoneCats.length < 1 || zoneCats.length > MAX_ZONES[plan]) throw new Error(`TOO_MANY_ZONES (${plan} : ${MAX_ZONES[plan]} au plus)`);
  if (plan === 'PERIOD' && (days < 2 || days > 21)) throw new Error('PERIOD_OUT_OF_RANGE (2 à 21 jours)');
  const zonePrices = zoneCats.map((c) => PRICE_GRID[c][posType]);
  const top = Math.max(...zonePrices);
  const base =
    plan === 'DAY' ? zonePrices.reduce((a, b) => a + b, 0)
    : plan === 'PERIOD' ? top * days
    : plan === 'MONTH' ? top * 30
    : Math.round(top * 30 * PREMIUM_COEFFICIENT);
  const discountPct = DISCOUNTS[isMainPos ? 'main' : 'other'][plan];
  const total = discountPct ? up10(base * (1 - discountPct / 100)) : base;
  return { zonePrices, base, discountPct, total };
}

async function seedDemo(superAdminId: string, zones: Record<string, { id: string; cat: string }>, dishCats: Record<string, string>) {
  if (process.env.NODE_ENV === 'production') throw new Error('SEED_DEMO refusé en production');
  if (await prisma.vendor.findFirst({ where: { contactPhone: DEMO_VENDORS[0].phone } })) {
    console.log('• Démo déjà présente : rien à faire');
    return;
  }
  const demoHash = await argon2.hash('okare-demo-2026', { type: argon2.argon2id });

  // Comptes : un par rôle (mot de passe de démo : okare-demo-2026).
  const mkUser = (phone: string, fullName: string, roles: Role[], homeZone?: string) =>
    prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, fullName, roles, passwordHash: demoHash, phoneVerifiedAt: new Date(), homeZoneId: homeZone ? zones[homeZone].id : null },
    });
  const admin = await mkUser('+2290196000001', 'Admin Démo', ['ADMIN']);
  const agent = await mkUser('+2290196000002', 'Agent Démo (Ganhi, Cadjèhoun)', ['FIELD_AGENT']);
  const agent2 = await mkUser('+2290196000003', 'Agent Démo (Akpakpa)', ['FIELD_AGENT']);
  const clients = await Promise.all(
    ['Koffi', 'Aïcha', 'Sènan', 'Ibrahim', 'Grâce', 'Mawuli'].map((n, i) =>
      mkUser(`+229019500000${i + 1}`, n, ['CLIENT'], i % 2 ? 'CADJEHOUN' : 'GANHI'),
    ),
  );

  // Un agent peut avoir plusieurs zones (AgentZone) ; admins et super-admin : toutes, sans ligne.
  for (const [u, codes] of [[agent, ['GANHI', 'CADJEHOUN']], [agent2, ['AKPAKPA']]] as const) {
    for (const code of codes) {
      await prisma.agentZone.upsert({
        where: { userId_zoneId: { userId: u.id, zoneId: zones[code].id } },
        update: {},
        create: { userId: u.id, zoneId: zones[code].id, assignedById: superAdminId },
      });
    }
  }

  const today = businessDay();
  const posIds: Record<string, string> = {};
  const dishIds: Record<string, { id: string; name: string; price: number; cat: string }[]> = {};

  for (const v of DEMO_VENDORS) {
    // Règle : un vendeur Particulier a exactement un point de vente (OKARE_SPEC.md 12.5).
    if (v.pos.some((p) => p.type === 'PARTICULIER') && v.pos.length !== 1) throw new Error(`${v.displayName} : un Particulier n'a qu'un seul point de vente`);
    // Le premier vendeur a un compte (il gère et paie lui-même) ; les autres sont gérés par l'agent.
    const owner = v === DEMO_VENDORS[0] ? await mkUser(v.phone, v.contactName, ['VENDOR', 'CLIENT']) : null;
    const vendor = await prisma.vendor.create({
      data: {
        displayName: v.displayName, contactName: v.contactName, contactPhone: v.phone,
        userId: owner?.id ?? null, followedById: agent.id, createdById: agent.id,
        firstPublishedAt: daysAgo(v.agePublishedDays),
      },
    });
    for (const p of v.pos) {
      const posId = await insertPos(p, vendor.id, zones[p.zone].id, owner?.id ?? agent.id);
      posIds[p.name] = posId;
      dishIds[p.name] = [];
      for (const [i, [name, price, cat, moment]] of p.dishes.entries()) {
        const dish = await prisma.dish.upsert({
          where: { posId_slug: { posId, slug: slugify(name) } },
          update: {},
          create: {
            posId, slug: slugify(name), name, priceXof: price, moment, categoryId: dishCats[cat] ?? null,
            sortOrder: i, publishedAt: new Date(), createdById: owner?.id ?? agent.id,
          },
        });
        dishIds[p.name].push({ id: dish.id, name, price, cat });
      }
      // Plat du jour : le premier plat.
      const first = dishIds[p.name][0];
      await prisma.dailySpecial.upsert({
        where: { posId_dishId_businessDate: { posId, dishId: first.id, businessDate: asDate(today) } },
        update: {},
        create: { posId, dishId: first.id, businessDate: asDate(today), createdById: owner?.id ?? agent.id },
      });
    }
    // Point principal : le premier point (le plus contacté dans la démo ci-dessous).
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: { mainPosId: posIds[v.pos[0].name], mainPosComputedAt: new Date() },
    });
  }

  // Contacts : 8 sur Chez Maman · Ganhi (dont 5 avec « Oui » et un avis), 2 sur Akpakpa.
  const ganhi = DEMO_VENDORS[0].pos[0];
  const maman = await prisma.vendor.findFirstOrThrow({ where: { contactPhone: DEMO_VENDORS[0].phone } });
  const ratings = [5, 4, 5, 4, 5];
  const comments = ['Très bon et copieux.', 'Bon riz, un peu d\'attente.', 'Le meilleur atassi de Ganhi.', null, 'Toujours chaud, prix honnête.'];
  for (let i = 0; i < 8; i++) {
    const viaDish = i % 4 !== 3; // 1 contact sur 4 passe par les boutons du point de vente
    const dish = viaDish ? dishIds[ganhi.name][i % dishIds[ganhi.name].length] : null;
    const client = clients[i % clients.length];
    const createdAt = daysAgo(8 - i);
    const contact = await prisma.contactEvent.create({
      data: {
        posId: posIds[ganhi.name], vendorId: maman.id, userId: client.id,
        dishId: dish?.id ?? null, dishNameSnap: dish?.name ?? null, dishPriceSnap: dish?.price ?? null,
        dishCategoryId: dish ? dishCats[dish.cat] ?? null : null,
        channel: i % 3 === 2 ? 'CALL' : 'WHATSAPP', source: viaDish ? 'DISH_PAGE' : 'POS_PAGE',
        posZoneId: zones.GANHI.id, viewerZoneId: zones.GANHI.id, createdAt,
      },
    });
    const yes = i < 5;
    await prisma.contactFollowUp.create({
      data: {
        contactId: contact.id, posId: posIds[ganhi.name], userId: client.id, askDish: !viaDish,
        askCount: 1, askedAt: createdAt, answer: yes ? 'YES' : i === 5 ? 'NO' : null, answeredAt: yes || i === 5 ? createdAt : null,
      },
    });
    if (yes) {
      const item = dish ?? dishIds[ganhi.name][0];
      await prisma.contactOrderItem.create({
        data: { contactId: contact.id, dishId: item.id, dishNameSnap: item.name, dishCategoryId: dishCats[item.cat] ?? null, origin: viaDish ? 'DISH_BUTTON' : 'DECLARED' },
      });
      await prisma.review.create({
        data: {
          posId: posIds[ganhi.name], dishId: dish?.id ?? null, userId: client.id, contactId: contact.id,
          rating: ratings[i], comment: comments[i], createdAt,
          ...(i === 1 ? { vendorReply: 'Merci ! On a ajouté une deuxième marmite pour aller plus vite.', vendorRepliedAt: new Date(), vendorRepliedById: maman.userId } : {}),
        },
      });
    }
  }
  // 5 avis publiés → la note s'affiche (reviews.minToDisplay = 5).
  await prisma.pointOfSale.update({
    where: { id: posIds[ganhi.name] },
    data: { ratingAvg: ratings.reduce((a, b) => a + b, 0) / ratings.length, ratingCount: ratings.length, responseRate: 5 / 6 },
  });

  const akpakpa = DEMO_VENDORS[0].pos[1];
  for (let i = 0; i < 2; i++) {
    await prisma.contactEvent.create({
      data: {
        posId: posIds[akpakpa.name], vendorId: maman.id, userId: clients[i].id, dishId: dishIds[akpakpa.name][i].id,
        dishNameSnap: dishIds[akpakpa.name][i].name, dishPriceSnap: dishIds[akpakpa.name][i].price,
        channel: 'WHATSAPP', source: 'HOME', posZoneId: zones.AKPAKPA.id, viewerZoneId: zones.AKPAKPA.id, createdAt: daysAgo(3 - i),
      },
    });
  }

  // Commande payée : exemple de la maquette (10 350 F), payée par MTN via FedaPay.
  const lineA = { pos: ganhi, plan: 'PERIOD' as const, zones: ['GANHI', 'CADJEHOUN', 'HAIE_VIVE'], days: 7, main: true };
  const lineB = { pos: akpakpa, plan: 'MONTH' as const, zones: ['AKPAKPA', 'CADJEHOUN'], days: 30, main: false };
  const quotes = [lineA, lineB].map((l) =>
    ({ l, q: quote(l.pos.type, l.plan, l.zones.map((z) => zones[z].cat as 'A' | 'B' | 'C'), l.days, l.main) }));
  const subtotal = quotes.reduce((a, { q }) => a + q.base, 0);
  const total = quotes.reduce((a, { q }) => a + q.total, 0);
  if (total !== 10350) throw new Error(`Exemple de prix incohérent : ${total} F au lieu de 10 350 F`);
  const paidAt = new Date();
  const order = await prisma.subscriptionOrder.create({
    data: {
      number: 'CMD-2026-000001', vendorId: maman.id, origin: 'VENDOR_APP', status: 'PAID',
      subtotalXof: subtotal, discountXof: subtotal - total, totalXof: total, paidAt, createdById: maman.userId!,
    },
  });
  for (const { l, q } of quotes) {
    const start = today;
    const end = businessDay(l.days - 1);
    const sub = await prisma.subscription.create({
      data: {
        orderId: order.id, posId: posIds[l.pos.name], vendorId: maman.id, plan: l.plan,
        startDate: asDate(start), endDate: asDate(end), days: l.days, isMainPos: l.main,
        baseXof: q.base, discountPct: q.discountPct, totalXof: q.total, status: 'PAID', paidAt, createdById: maman.userId!,
        zones: { create: l.zones.map((z, i) => ({ zoneId: zones[z].id, priceXof: q.zonePrices[i] })) },
      },
    });
    // 1 place par zone ciblée et par jour.
    const slots = l.zones.flatMap((z) =>
      Array.from({ length: l.days }, (_, d) => ({ zoneId: zones[z].id, businessDate: asDate(businessDay(d)), subscriptionId: sub.id })));
    await prisma.zoneDaySlot.createMany({ data: slots, skipDuplicates: true });
  }
  await prisma.payment.create({
    data: {
      orderId: order.id, vendorId: maman.id, amountXof: total, feeXof: 311, providerTransactionId: 'demo-fedapay-0001',
      method: 'MTN', payerPhone: DEMO_VENDORS[0].phone, status: 'APPROVED', origin: 'VENDOR_APP',
      initiatedById: maman.userId!, approvedAt: paidAt, receiptNumber: 'REC-2026-000001',
      lastProviderStatus: { status: 'approved', mode: 'mtn_open', demo: true },
    },
  });

  // Commande en attente de paiement : lien envoyé par l'agent à Tantie Rose (Un jour, Cadjèhoun).
  const rose = await prisma.vendor.findFirstOrThrow({ where: { contactPhone: DEMO_VENDORS[1].phone } });
  const rosePos = DEMO_VENDORS[1].pos[0];
  const qRose = quote(rosePos.type, 'DAY', ['B'], 1, true);
  const pending = await prisma.subscriptionOrder.create({
    data: {
      number: 'CMD-2026-000002', vendorId: rose.id, origin: 'PAYMENT_LINK', status: 'PENDING_PAYMENT',
      subtotalXof: qRose.base, discountXof: 0, totalXof: qRose.total, holdUntil: new Date(Date.now() + 24 * 3_600_000), createdById: agent.id,
    },
  });
  const tomorrow = businessDay(1);
  const subRose = await prisma.subscription.create({
    data: {
      orderId: pending.id, posId: posIds[rosePos.name], vendorId: rose.id, plan: 'DAY',
      startDate: asDate(tomorrow), endDate: asDate(tomorrow), days: 1, isMainPos: true,
      baseXof: qRose.base, discountPct: 0, totalXof: qRose.total, status: 'PENDING_PAYMENT', createdById: agent.id,
      zones: { create: [{ zoneId: zones.CADJEHOUN.id, priceXof: qRose.zonePrices[0] }] },
    },
  });
  await prisma.zoneDaySlot.create({ data: { zoneId: zones.CADJEHOUN.id, businessDate: asDate(tomorrow), subscriptionId: subRose.id } });
  await prisma.payment.create({
    data: {
      orderId: pending.id, vendorId: rose.id, amountXof: qRose.total, status: 'PENDING', origin: 'PAYMENT_LINK',
      initiatedById: agent.id, checkoutUrl: 'https://sandbox-process.fedapay.com/demo', providerTransactionId: 'demo-fedapay-0002',
    },
  });

  // Un signalement ouvert.
  await prisma.report.create({
    data: {
      targetType: 'POS', posId: posIds[akpakpa.name], userId: clients[2].id, reason: 'WRONG_PRICE',
      comment: "L'alloco était à 1 200 F, pas 1 000 F.", businessDate: asDate(today),
    },
  });

  console.log(`✓ Démo : 4 vendeurs (dont 1 Particulier), 5 points de vente, plats, 10 contacts, 5 avis, commande payée ${total} F, 1 commande en attente, 1 signalement`);
  console.log('  Comptes de démo : mot de passe « okare-demo-2026 » (admin +2290196000001, agent +2290196000002, vendeur +2290197000001)');
  void admin;
}

// ---------------------------------------------------------------------------

async function main() {
  const { zones } = await seedGeography();
  const dishCats = await seedDishCategories();
  await seedPermissions();
  await seedSettings();
  const superAdminId = await seedSuperAdmin();
  if (process.env.SEED_DEMO === 'true') {
    await seedDemo(superAdminId, zones, dishCats);
  }
}

main()
  .catch((e) => {
    console.error('✗ Seed interrompu :', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
