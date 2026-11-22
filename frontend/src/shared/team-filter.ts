/**
 * Filtres des écrans du dashboard (accueil, points de vente, vendeurs, utilisateurs) :
 * pays, ville, zone, quartier, date de début, date de fin. Portés par l'adresse (?country=&city=&zone=&nb=&from=&to=).
 */
export interface TeamFilter {
  countryId?: string;
  cityId?: string;
  zoneId?: string;
  neighborhoodId?: string;
  /** Jour ouvré AAAA-MM-JJ inclus. */
  from?: string;
  to?: string;
}

const KEYS: [keyof TeamFilter, string][] = [
  ['countryId', 'country'], ['cityId', 'city'], ['zoneId', 'zone'], ['neighborhoodId', 'nb'], ['from', 'from'], ['to', 'to'],
];

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Lit le filtre depuis les paramètres de l'adresse (page serveur ou useSearchParams). */
export function filterFromParams(get: (k: string) => string | null | undefined): TeamFilter {
  const f: TeamFilter = {};
  for (const [key, param] of KEYS) {
    const v = get(param);
    if (!v) continue;
    if ((key === 'from' || key === 'to') && !DATE.test(v)) continue;
    f[key] = v;
  }
  return f;
}

/** Paramètres d'adresse pour un filtre (les champs vides sont retirés). */
export function filterToQuery(f: TeamFilter): string {
  const p = new URLSearchParams();
  for (const [key, param] of KEYS) if (f[key]) p.set(param, f[key]!);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const hasFilter = (f: TeamFilter) => KEYS.some(([k]) => !!f[k]);
