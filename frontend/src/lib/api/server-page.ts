/**
 * Lecture des données dans une page serveur : renvoie `{ data }` ou `{ error }` (message affichable),
 * pour afficher un état d'erreur au lieu de casser la page.
 */
import { errorMessage, isApiError } from './errors';

export async function load<T>(p: Promise<T>): Promise<{ data: T; error: null; status: 200 } | { data: null; error: string; status: number }> {
  try {
    return { data: await p, error: null, status: 200 };
  } catch (e) {
    return { data: null, error: errorMessage(e), status: isApiError(e) ? e.status : 500 };
  }
}
