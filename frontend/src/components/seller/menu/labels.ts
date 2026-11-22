import type { MealMoment } from '@/shared/enums';

export { formatPrice } from '@/shared/format';

export const MOMENT_SHORT: Record<MealMoment, string> = {
  BREAKFAST: 'petit-déjeuner', LUNCH: 'déjeuner', DINNER: 'dîner', ALL_DAY: 'toute la journée',
};
