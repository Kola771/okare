import { describe, expect, it } from 'vitest';
import { passwordError } from '../validate';

describe('passwordError (8 caractères, une majuscule, un chiffre, un caractère spécial)', () => {
  it('accepte un mot de passe qui respecte toutes les règles', () => {
    expect(passwordError('Maman@2026')).toBeNull();
    expect(passwordError('Ékra#tou9')).toBeNull();
  });
  it('liste ce qui manque', () => {
    expect(passwordError('court')).toBe('Il manque : 8 caractères au moins, une majuscule, un chiffre, un caractère spécial (! ? @ # * …).');
    expect(passwordError('mafoufou26')).toBe('Il manque : une majuscule, un caractère spécial (! ? @ # * …).');
    expect(passwordError('Mafoufou26')).toBe('Il manque : un caractère spécial (! ? @ # * …).');
  });
  it('un espace ne compte pas comme caractère spécial', () => {
    expect(passwordError('Mafou fou26')).toContain('un caractère spécial');
  });
});
