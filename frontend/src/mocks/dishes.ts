/** Plats et plats du jour fictifs. Les plats du jour et les « épuisés » sont posés sur le jour métier courant. */
import type { MealMoment } from '@/shared/enums';
import { slugify } from '@/shared/format';
import { businessDate } from '@/shared/time';
import type { DailySpecial, Dish } from '@/shared/types';
import { dishCategoryByName } from './dish-categories';
import { mockId, POS, T0, USER } from './ids';

type DishSeed = [posId: string, name: string, price: number, category: string, moment: MealMoment,
  options?: { description?: string; special?: boolean; soldOut?: boolean; pending?: boolean }];

const SEEDS: DishSeed[] = [
  [POS.mamanGanhi, 'Riz sauce arachide + poisson', 900, 'Riz sauce arachide', 'LUNCH',
    { description: 'Riz blanc, sauce arachide maison, poisson frit. Piment servi à part.', special: true }],
  [POS.mamanGanhi, 'Spaghetti omelette', 500, 'Spaghetti omelette', 'ALL_DAY', { description: 'Spaghetti sautés, omelette aux oignons.' }],
  [POS.mamanGanhi, 'Amiwo + poulet', 1200, 'Pâte rouge (amiwo)', 'LUNCH', { soldOut: true }],
  [POS.mamanGanhi, 'Aloko + œuf', 600, 'Alloco', 'ALL_DAY', { description: 'Banane plantain frite, œuf dur, sauce tomate pimentée.' }],
  [POS.mamanGanhi, 'Atassi du matin', 500, 'Atassi', 'BREAKFAST'],
  [POS.mamanAkpakpa, 'Igname pilée sauce graine', 1200, 'Igname pilée', 'LUNCH', { special: true }],
  [POS.mamanAkpakpa, 'Alloco poisson', 1000, 'Alloco', 'DINNER'],
  [POS.tantieRose, 'Poulet bicyclette et frites', 3500, 'Poulet bicyclette', 'DINNER', { special: true }],
  [POS.tantieRose, 'Riz au gras poulet', 2500, 'Riz au gras', 'LUNCH'],
  [POS.tantieRose, 'Poisson braisé attiéké', 3000, 'Attiéké poisson', 'DINNER'],
  [POS.senami, 'Igname pilée sauce graine', 1200, 'Igname pilée', 'LUNCH', { special: true }],
  [POS.senami, 'Ablo poisson', 1000, 'Ablo', 'DINNER'],
  [POS.coinBio, 'Akassa sauce tomate', 400, 'Akassa', 'LUNCH'],
  [POS.coinBio, 'Bouillie et beignets', 300, 'Bouillie', 'BREAKFAST'],
  [POS.coinBio, 'Gari et haricots', 350, 'Gari et haricots', 'ALL_DAY'],
  [POS.bonGout, 'Pâte rouge + poulet', 1000, 'Pâte rouge (amiwo)', 'ALL_DAY', { special: true, description: 'Amiwo bien relevé, cuisse de poulet braisée.' }],
  [POS.bonGout, 'Riz sauce tomate', 700, 'Riz sauce tomate', 'ALL_DAY'],
  [POS.bonGout, 'Wassa-wassa', 800, 'Wassa-wassa', 'DINNER', { pending: true }],
  [POS.tantieAiko, 'Atassi + friture', 500, 'Atassi', 'ALL_DAY', { special: true, description: 'Riz-haricot, friture de poisson, gari et piment.' }],
  [POS.tantieAiko, 'Bouillie de maïs', 200, 'Bouillie', 'BREAKFAST'],
  [POS.etalBenedicte, 'Spaghetti omelette', 500, 'Spaghetti omelette', 'ALL_DAY', { special: true }],
  [POS.etalBenedicte, 'Beignets haricot', 200, 'Beignets', 'BREAKFAST'],
  [POS.palmier, 'Igname pilée sauce légumes', 1500, 'Igname pilée', 'ALL_DAY', { special: true }],
  [POS.palmier, 'Poisson braisé', 2500, 'Poisson braisé', 'DINNER'],
  [POS.palmier, 'Riz sauce arachide', 1000, 'Riz sauce arachide', 'LUNCH'],
  [POS.rachida, 'Aloko + œuf', 600, 'Alloco', 'ALL_DAY', { special: true }],
  [POS.rachida, 'Attiéké poisson', 1000, 'Attiéké poisson', 'DINNER'],
];

const today = businessDate(new Date());

export const DISHES: Dish[] = SEEDS.map(([posId, name, priceXof, category, moment, o = {}], i) => ({
  id: mockId(5, i + 1), posId, categoryId: dishCategoryByName(category).id, slug: slugify(name), name,
  description: o.description ?? null, priceXof, moment, status: o.pending ? 'PENDING' : 'PUBLISHED',
  soldOutOn: o.soldOut ? today : null, sortOrder: i, publishedAt: T0, createdById: USER.agentGanhi,
  updatedById: null, createdAt: T0, updatedAt: T0, deletedAt: null,
}));

export const DAILY_SPECIALS: DailySpecial[] = SEEDS.flatMap(([posId, , , , , o], i) =>
  o?.special
    ? [{ id: mockId(5, 500 + i), posId, dishId: mockId(5, i + 1), businessDate: today, priceTodayXof: null,
        createdById: USER.agentGanhi, createdAt: new Date().toISOString() }]
    : [],
);
