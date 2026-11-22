'use client';

/**
 * Formulaire téléphone + mot de passe, en mode « créer un compte » ou « se connecter ».
 * Validation légère côté écran (mêmes règles que les schémas zod de l'API), erreurs sous chaque champ.
 */
import Link from 'next/link';
import { PasswordChecklist } from './PasswordChecklist';
import { useState } from 'react';
import { errorMessage, isApiError, login, register } from '@/lib/api';
import { authErrors } from '@/shared/validate';
import { PasswordField, PhoneField } from '@/components/ui/Fields';

interface Props {
  mode: 'register' | 'login';
  submitLabel: string;
  submitTone?: 'piment' | 'feuille';
  onDone: () => void;
  /** Lien « Mot de passe oublié ? » au-dessus du champ (connexion). */
  showForgot?: boolean;
}

export function PhoneAuthForm({ mode, submitLabel, submitTone = 'piment', onDone, showForgot = false }: Props) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = authErrors(mode, phone, password);
    if (Object.keys(invalid).length) {
      setErrors(invalid);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await (mode === 'register' ? register : login)({ phone, password });
      onDone();
    } catch (err) {
      const details = isApiError(err) && err.details && typeof err.details === 'object' ? (err.details as Record<string, string>) : {};
      setErrors({ ...details, form: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  const tone = submitTone === 'feuille' ? 'bg-feuille' : 'bg-piment';
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <PhoneField label="Numéro de téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
      <PasswordField
        label="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        placeholder={mode === 'register' ? 'Ex. Maman@2026' : 'Ton mot de passe'}
        aside={showForgot ? <Link href="/login?forgot=1" className="text-[13px] font-semibold">Mot de passe oublié ?</Link> : undefined}
      />
      {mode === 'register' && <PasswordChecklist value={password} />}
      {errors.form && !errors.phone && !errors.password && (
        <div role="alert" className="rounded-xl bg-erreur-soft px-3 py-2.5 text-sm font-semibold text-erreur">{errors.form}</div>
      )}
      <button type="submit" disabled={busy} className={`min-h-[54px] rounded-btn text-base font-bold text-white disabled:opacity-60 ${tone}`}>
        {busy ? 'Un instant…' : submitLabel}
      </button>
    </form>
  );
}
