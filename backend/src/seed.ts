/**
 * OKARE — seed TypeORM (backend/src/seed.ts)
 *
 * Lancer : npx ts-node -r dotenv/config src/seed.ts
 *   ou     npx tsx src/seed.ts
 *
 * Idempotent : on peut le relancer autant de fois qu'on veut.
 *  - Référentiels (pays, ville, catégories, zones, quartiers, jours fériés, catégories de plats) : upsert.
 *  - Grille des prix, permissions, paramètres : créés s'ils manquent, JAMAIS écrasés.
 *  - Super-admin : créé depuis les variables d'environnement, ou mis à jour (rôles) s'il existe.
 */
import 'dotenv/config';
import dataSource from './datasource';
import { Country } from './entities/country.entity';
import { City } from './entities/city.entity';
import { ZoneCategory } from './entities/zone-category.entity';
import { Zone } from './entities/zone.entity';
import { Neighborhood } from './entities/neighborhood.entity';
import { PublicHoliday } from './entities/public-holiday.entity';
import { DishCategory } from './entities/dish-category.entity';
import { PriceGrid, PosType } from './entities/price-grid.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Setting } from './entities/setting.entity';
import { User, Role } from './entities/user.entity';
import argon2 from 'argon2';

const PHONE_RE = /^\+2290[1-9]\d{8}$/;

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ---------------------------------------------------------------------------
// Référentiels
// ---------------------------------------------------------------------------

const ZONE_CATEGORIES = [
  { code: 'A', label: "A — centre d'affaires", defaultDailySlots: 20 },
  { code: 'B', label: 'B — résidentiel dense', defaultDailySlots: 30 },
  { code: 'C', label: 'C — périphérie', defaultDailySlots: 60 },
] as const;

const PRICE_GRID_DATA: Record<'A' | 'B' | 'C', Record<PosType, number>> = {
  A: { PARTICULIER: 300, MAQUIS: 500, RESTAURANT: 800 },
  B: { PARTICULIER: 200, MAQUIS: 300, RESTAURANT: 500 },
  C: { PARTICULIER: 100, MAQUIS: 200, RESTAURANT: 300 },
};

const ZONES = [
  { code: 'GANHI', name: 'Ganhi', cat: 'A',
    neighborhoods: [['Ganhi', ['ganhi']], ['Akpakpa-Dodomè', []], ['Xwlacodji', ['houlacodji']]] },
  { code: 'HAIE_VIVE', name: 'Haie Vive', cat: 'A',
    neighborhoods: [['Haie Vive', ['haie-vive']], ['Cocotiers', ['les cocotiers']]] },
  { code: 'CADJEHOUN', name: 'Cadjèhoun', cat: 'B',
    neighborhoods: [['Cadjèhoun', ['cadjehoun', 'kadjehoun']], ['Gbégamey-Sud', []]] },
  { code: 'GBEGAMEY', name: 'Gbégamey', cat: 'B',
    neighborhoods: [['Gbégamey', ['gbegamey']], ['Saint-Michel', ['st michel']]] },
  { code: 'MISSEBO', name: 'Missébô', cat: 'B',
    neighborhoods: [['Missébô', ['missebo', 'misebo']], ['Dantokpa', ['tokpa']]] },
  { code: 'AKPAKPA', name: 'Akpakpa', cat: 'C',
    neighborhoods: [['Akpakpa', ['akpakpa']], ['Sègbèya', ['segbeya']], ['PK3', ['pk 3']]] },
  { code: 'FIDJROSSE', name: 'Fidjrossè', cat: 'C',
    neighborhoods: [['Fidjrossè', ['fidjrosse']], ['Fidjrossè-Plage', ['fidjrosse plage']]] },
  { code: 'AGLA', name: 'Agla', cat: 'C',
    neighborhoods: [['Agla', ['agla']], ['Hlazounto', []]] },
] as const;

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

const DISH_CATEGORIES: { name: string; family: string; key: string | null; aliases: string[] }[] = [
  { name: 'Riz sauce arachide', family: 'Riz', key: 'riz', aliases: ['riz arachide', "riz sauce d'arachide"] },
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

const ALL_ROLES: Role[] = [Role.CLIENT, Role.VENDOR, Role.FIELD_AGENT, Role.ADMIN, Role.SUPER_ADMIN];
const PERMISSIONS: Record<string, Role[]> = {
  'pos.read.public': ALL_ROLES,
  'contact.create': ALL_ROLES,
  'favorite.manage': ALL_ROLES,
  'followup.answer': ALL_ROLES,
  'report.create': ALL_ROLES,
  'review.create': ALL_ROLES,
  'vendor.create': [Role.VENDOR, Role.FIELD_AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  'pos.create': [Role.VENDOR, Role.FIELD_AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  'pos.update': [Role.VENDOR, Role.FIELD_AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  'dish.manage': [Role.VENDOR, Role.FIELD_AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  'special.manage': [Role.VENDOR, Role.FIELD_AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  'hours.manage': [Role.VENDOR, Role.FIELD_AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  'qr.read': [Role.VENDOR, Role.FIELD_AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  'pos.stats.read': [Role.VENDOR, Role.FIELD_AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  'stats.share': [Role.VENDOR, Role.FIELD_AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  'review.reply': [Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN],
  'subscription.buy': [Role.VENDOR],
  'payment.link.send': [Role.FIELD_AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  'subscription.complimentary': [Role.ADMIN, Role.SUPER_ADMIN],
  'payment.refund': [Role.SUPER_ADMIN],
  'pos.moderate': [Role.ADMIN, Role.SUPER_ADMIN],
  'review.moderate': [Role.ADMIN, Role.SUPER_ADMIN],
  'report.resolve': [Role.ADMIN, Role.SUPER_ADMIN],
  'responsetest.create': [Role.FIELD_AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  'geo.read': [Role.FIELD_AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  'geo.manage': [Role.ADMIN, Role.SUPER_ADMIN],
  'pricing.manage': [Role.ADMIN, Role.SUPER_ADMIN],
  'slots.manage': [Role.ADMIN, Role.SUPER_ADMIN],
  'user.manage': [Role.ADMIN, Role.SUPER_ADMIN],
  'role.assign': [Role.SUPER_ADMIN],
  'permission.manage': [Role.SUPER_ADMIN],
  'settings.manage': [Role.SUPER_ADMIN],
  'subscriptions.toggle': [Role.SUPER_ADMIN],
  'subscriptions.read': [Role.FIELD_AGENT, Role.ADMIN, Role.SUPER_ADMIN],
  'audit.read': [Role.ADMIN, Role.SUPER_ADMIN],
  'media.read': [Role.ADMIN, Role.SUPER_ADMIN],
};

const DEFAULT_MESSAGE =
  "Bonjour {prenom}, merci d'être sur OKARE depuis {anciennete} : {point} a reçu {contacts_mois} contacts le mois dernier. " +
  'À partir du {date}, la visibilité devient payante. Pour ta zone : {prix_jour} le jour, {prix_mois} le mois. ' +
  'Sans pub, ton point reste sur OKARE mais sera moins visible. Choisis ta pub et paie par Mobile Money : {lien}';

const SETTINGS: Record<string, unknown> = {
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
  const countryRepo = dataSource.getRepository(Country);
  const cityRepo = dataSource.getRepository(City);
  const zcRepo = dataSource.getRepository(ZoneCategory);
  const zoneRepo = dataSource.getRepository(Zone);
  const nRepo = dataSource.getRepository(Neighborhood);
  const pgRepo = dataSource.getRepository(PriceGrid);

  let country = await countryRepo.findOneBy({ code: 'BJ' });
  if (!country) {
    country = await countryRepo.save(countryRepo.create({
      code: 'BJ', name: 'Bénin', currency: 'XOF', timezone: 'Africa/Porto-Novo',
      phoneRegex: PHONE_RE.source, isActive: true,
    }));
  }

  let city = await cityRepo.findOneBy({ slug: 'cotonou' });
  if (!city) {
    city = await cityRepo.save(cityRepo.create({
      countryId: country.id, name: 'Cotonou', slug: 'cotonou', isActive: true,
    }));
  }

  const categories: Record<string, string> = {};
  for (const c of ZONE_CATEGORIES) {
    let zc = await zcRepo.findOneBy({ cityId: city.id, code: c.code });
    if (!zc) {
      zc = await zcRepo.save(zcRepo.create({
        cityId: city.id, code: c.code, label: c.label, defaultDailySlots: c.defaultDailySlots,
      }));
    }
    categories[c.code] = zc.id;
  }

  for (const [code, types] of Object.entries(PRICE_GRID_DATA)) {
    for (const [posType, day] of Object.entries(types)) {
      const exists = await pgRepo.findOneBy({ categoryId: categories[code], posType: posType as PosType });
      if (!exists) {
        await pgRepo.save(pgRepo.create({
          categoryId: categories[code], posType: posType as PosType, dayPriceXof: day,
        }));
      }
    }
  }

  for (const z of ZONES) {
    let zone = await zoneRepo.findOneBy({ cityId: city.id, code: z.code });
    if (!zone) {
      zone = await zoneRepo.save(zoneRepo.create({
        cityId: city.id, categoryId: categories[z.cat], name: z.name, code: z.code, isActive: true,
      }));
    }
    for (const [name, aliases] of z.neighborhoods) {
      const exists = await nRepo.findOneBy({ zoneId: zone.id, name: name as string });
      if (!exists) {
        await nRepo.save(nRepo.create({
          zoneId: zone.id, name: name as string, aliases: aliases.length ? [...aliases] : [],
        }));
      }
    }
  }

  const phRepo = dataSource.getRepository(PublicHoliday);
  for (const [ymd, name] of HOLIDAYS) {
    const exists = await phRepo.findOneBy({ countryId: country.id, date: ymd });
    if (!exists) {
      await phRepo.save(phRepo.create({ countryId: country.id, date: ymd, name }));
    }
  }

  console.log(`✓ Géographie : Bénin, Cotonou, ${ZONE_CATEGORIES.length} catégories, ${ZONES.length} zones, grille des prix, ${HOLIDAYS.length} jours fériés`);
}

async function seedDishCategories() {
  const repo = dataSource.getRepository(DishCategory);
  for (const [i, c] of DISH_CATEGORIES.entries()) {
    const slug = slugify(c.name);
    let row = await repo.findOneBy({ slug });
    if (!row) {
      await repo.save(repo.create({
        name: c.name, slug, family: c.family, illustrationKey: c.key,
        aliases: c.aliases, sortOrder: i, isActive: true,
      }));
    } else {
      row.illustrationKey = c.key;
      row.family = c.family;
      await repo.save(row);
    }
  }
  console.log(`✓ Catégories de plats : ${DISH_CATEGORIES.length}`);
}

async function seedPermissions() {
  const repo = dataSource.getRepository(RolePermission);
  let created = 0;
  for (const [permission, roles] of Object.entries(PERMISSIONS)) {
    for (const role of ALL_ROLES) {
      const exists = await repo.findOneBy({ role, permission });
      if (!exists) {
        await repo.save(repo.create({ role, permission, granted: roles.includes(role) }));
        created++;
      }
    }
  }
  console.log(`✓ Permissions : ${created} créées (les valeurs existantes sont gardées)`);
}

async function seedSettings() {
  const repo = dataSource.getRepository(Setting);
  let created = 0;
  for (const [key, value] of Object.entries(SETTINGS)) {
    const exists = await repo.findOneBy({ key });
    if (!exists) {
      await repo.save(repo.create({ key, value }));
      created++;
    }
  }
  console.log(`✓ Paramètres : ${created} créés (les valeurs existantes sont gardées)`);
}

async function seedSuperAdmin() {
  const repo = dataSource.getRepository(User);
  const phone = process.env.SUPER_ADMIN_PHONE?.trim();
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase() || null;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const fullName = process.env.SUPER_ADMIN_NAME?.trim() || 'Super-admin OKARE';
  if (!phone || !PHONE_RE.test(phone)) {
    throw new Error('SUPER_ADMIN_PHONE manquant ou invalide (attendu : +2290XXXXXXXXX)');
  }

  const existing = await repo.findOneBy({ phone });
  if (existing) {
    existing.roles = [Role.SUPER_ADMIN];
    if (email && !existing.email) existing.email = email;
    await repo.save(existing);
    console.log(`✓ Super-admin existant (${phone}) : rôle vérifié, mot de passe inchangé`);
    return;
  }
  if (!password || password.length < 12) {
    throw new Error('SUPER_ADMIN_PASSWORD manquant ou trop court (12 caractères au moins) pour créer le super-admin');
  }
  await repo.save(repo.create({
    phone, email, fullName,
    passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
    roles: [Role.SUPER_ADMIN],
  }));
  console.log(`✓ Super-admin créé (${phone}) — activer la double authentification à la première connexion`);
}

// ---------------------------------------------------------------------------

async function main() {
  await dataSource.initialize();
  console.log(`Base connectée (${dataSource.options.type})`);

  await seedGeography();
  await seedDishCategories();
  await seedPermissions();
  await seedSettings();
  await seedSuperAdmin();
}

main()
  .catch((e) => {
    console.error('✗ Seed interrompu :', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => dataSource.destroy());
