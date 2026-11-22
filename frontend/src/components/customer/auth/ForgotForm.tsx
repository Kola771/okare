'use client';

/** Mot de passe oublié (section 6) : demande traitée par un admin, qui rappelle puis envoie un lien (30 min). */
import { useState } from 'react';
import { errorMessage, forgotPassword } from '@/lib/api';
import { PhoneField } from '@/components/ui/Fields';

export function ForgotForm({ onBack }: { onBack: () => void }) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col gap-3">
        <div role="status" className="rounded-[14px] bg-ok-soft px-4 py-3 text-sm font-semibold text-ok">
          Demande envoyée. L’équipe OKARE va t’appeler pour vérifier, puis t’envoyer un lien valable 30 minutes.
        </div>
        <button type="button" onClick={onBack} className="min-h-12 rounded-[14px] border border-bordure font-bold">Retour à la connexion</button>
      </div>
    );
  }
  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true);
      try {
        await forgotPassword(phone);
        setSent(true);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setBusy(false);
      }
    }}>
      <p className="m-0 text-sm text-ardoise">Entre ton numéro : un membre de l’équipe te rappelle pour vérifier que c’est bien toi.</p>
      <PhoneField label="Numéro de téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} error={error} />
      <button type="submit" disabled={busy} className="min-h-[54px] rounded-btn bg-piment font-bold text-white disabled:opacity-60">
        {busy ? 'Envoi…' : 'Demander un nouveau mot de passe'}
      </button>
      <button type="button" onClick={onBack} className="text-sm font-bold text-piment">Retour à la connexion</button>
    </form>
  );
}
