/** Catégories de plats (liste commune, seeder). illustrationKey → /plats/{key}.svg quand le plat n'a pas de photo. */
import { slugify } from '@/shared/format';
import type { DishCategory } from '@/shared/types';
import { mockId } from './ids';

const SEEDS: [string, string, string | null, string[]][] = [
  ['Riz sauce arachide', 'Riz', 'riz', ['riz arachide']],
  ['Riz au gras', 'Riz', 'riz', ['riz gras', 'riz jollof']],
  ['Riz sauce tomate', 'Riz', 'riz', ['riz tomate']],
  ['Atassi', 'Riz', 'atassi', ['watché', 'riz haricot', 'waakye']],
  ['Pâte rouge (amiwo)', 'Pâte', 'pate', ['amiwo', 'pate rouge']],
  ['Pâte blanche sauce légumes', 'Pâte', 'pate', ['pâte de maïs', 'owo']],
  ['Akassa', 'Pâte', 'pate', ['akassa sauce']],
  ['Ablo', 'Pâte', 'pate', ['ablo poisson']],
  ['Igname pilée', 'Igname', 'igname', ['agoun', 'igname pilee', 'foufou']],
  ['Wassa-wassa', 'Igname', 'igname', ['wassa wassa']],
  ['Spaghetti omelette', 'Pâtes', 'spaghetti', ['spaghetti', 'spag omelette']],
  ['Alloco', 'Banane', 'aloko', ['aloko', 'banane frite']],
  ['Attiéké poisson', 'Manioc', 'attieke', ['attieke', 'garba']],
  ['Gari et haricots', 'Manioc', null, ['abobo', 'haricot gari']],
  ['Poisson braisé', 'Grillades', null, ['poisson braise']],
  ['Poulet bicyclette', 'Grillades', null, ['poulet braisé', 'poulet local']],
  ['Bouillie', 'Petit-déjeuner', null, ['koko', 'bouillie de maïs']],
  ['Beignets', 'Petit-déjeuner', null, ['yovo doko', 'botokoin']],
];

export const DISH_CATEGORIES: DishCategory[] = SEEDS.map(([name, family, key, aliases], i) => ({
  id: mockId(6, i + 1), name, slug: slugify(name), aliases, family, illustrationKey: key, sortOrder: i, isActive: true,
}));

export const dishCategoryByName = (name: string) => {
  const cat = DISH_CATEGORIES.find((c) => c.name === name);
  if (!cat) throw new Error(`Catégorie inconnue : ${name}`);
  return cat;
};

