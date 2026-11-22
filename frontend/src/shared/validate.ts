/**
 * Règles de validation des formulaires de connexion, sans bibliothèque (léger pour le navigateur).
 * Les schémas zod de `schemas.ts` (côté serveur) appliquent exactement les mêmes règles.
 */
import { normalizePhone } from './format';

export const PHONE_ERROR = 'Numéro invalide : 10 chiffres commençant par 01.';
export const COMMON_PASSWORDS = ['123456', '1234567', '12345678', 'azerty', 'qwerty', 'password', 'motdepasse', '000000', '111111'];

/** Règles du mot de passe (décision du porteur, 22/11/2026) : 8 caractères, une majuscule, un chiffre, un caractère spécial. */
export const PASSWORD_RULES: { key: string; label: string; short: string; ok: (v: string) => boolean }[] = [
  { key: 'length', label: '8 caractères au moins', short: '8 caractères', ok: (v) => v.length >= 8 },
  { key: 'upper', label: 'une majuscule', short: '1 majuscule', ok: (v) => /[A-ZÀ-ÖØ-Þ]/.test(v) },
  { key: 'digit', label: 'un chiffre', short: '1 chiffre', ok: (v) => /\d/.test(v) },
  { key: 'special', label: 'un caractère spécial (! ? @ # * …)', short: '1 symbole', ok: (v) => /[^A-Za-zÀ-ÖØ-öø-ÿ0-9\s]/.test(v) },
];

export function passwordError(v: string): string | null {
  const missing = PASSWORD_RULES.filter((r) => !r.ok(v)).map((r) => r.label);
  if (missing.length) return `Il manque : ${missing.join(', ')}.`;
  if (COMMON_PASSWORDS.includes(v.toLowerCase())) return 'Ce mot de passe est trop courant.';
  return null;
}

/** Erreurs par champ pour l'inscription (`register`) ou la connexion (`login`) ; objet vide si tout est valide. */
export function authErrors(mode: 'register' | 'login', phone: string, password: string): Record<string, string> {
  const e: Record<string, string> = {};
  if (!normalizePhone(phone)) e.phone = PHONE_ERROR;
  if (mode === 'register') {
    const p = passwordError(password);
    if (p) e.password = p;
  } else if (!password) e.password = 'Entre ton mot de passe.';
  return e;
}
