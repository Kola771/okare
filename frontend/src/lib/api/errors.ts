/** Erreur d'API au format stable { code, message, details? } (section 3). */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/** Codes utilisés par l'interface client. */
export const ERR = {
  OFFLINE: 'OFFLINE',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  PHONE_TAKEN: 'PHONE_TAKEN',
  DISH_UNAVAILABLE: 'DISH_UNAVAILABLE',
  ALREADY_REPORTED: 'ALREADY_REPORTED',
  SERVER: 'SERVER',
} as const;

/** Message à afficher pour une erreur quelconque. */
export function errorMessage(e: unknown): string {
  if (isApiError(e)) {
    if (e.code === ERR.OFFLINE) return "Pas de connexion. Vérifie ton réseau et réessaie.";
    return e.message;
  }
  return 'Une erreur est survenue. Réessaie dans un instant.';
}
