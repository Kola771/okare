'use client';

/**
 * « Envoyer un code de rattachement » (section 14) : l'agent génère un code à 6 chiffres (72 h) et l'envoie
 * au vendeur par WhatsApp. Avec ce code, le vendeur relie sa fiche à son compte et gère lui-même ses points.
 */
import { useState } from 'react';
import { createClaimCode, errorMessage } from '@/lib/api';
import { btn } from '@/components/admin/AdminParts';
import { useToast } from '@/components/providers/ToastProvider';
import { Sheet } from '@/components/ui/Sheet';

export function ClaimCodeButton({ vendorId, vendorName }: { vendorId: string; vendorName: string }) {
  const toast = useToast();
  const [res, setRes] = useState<{ code: string; expiresAt: string; whatsappUrl: string } | null>(null);
  const create = () => createClaimCode(vendorId).then(setRes).catch((e) => toast(errorMessage(e), 'error'));
  const until = res && new Date(res.expiresAt).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <button type="button" className={btn.secondary} onClick={create}>Envoyer un code de rattachement</button>
      <Sheet open={!!res} onClose={() => setRes(null)} labelledBy="claim-code-title">
        <h2 id="claim-code-title" className="m-0 font-bold">Code de rattachement</h2>
        <p className="m-0 text-sm text-ardoise">
          Avec ce code, {vendorName} relie sa fiche à son compte OKARE et gère lui-même ses points (gestion partagée avec les agents de la zone).
        </p>
        <div className="rounded-2xl bg-argile py-5 text-center">
          <div className="font-mono text-[40px] font-extrabold tracking-[10px] text-charbon">{res?.code}</div>
          <div className="mt-1 text-[13px] text-ardoise">Valable 72 h, jusqu’au {until}</div>
        </div>
        <ol className="m-0 flex flex-col gap-1.5 pl-5 text-sm">
          <li>Le vendeur crée son compte OKARE avec son téléphone.</li>
          <li>Dans son profil : « Je suis vendeur sur OKARE », puis il saisit le code.</li>
          <li>Sa fiche passe « a un compte » ; il voit ses stats, ses avis et son menu.</li>
        </ol>
        <a href={res?.whatsappUrl} target="_blank" rel="noopener noreferrer" className={btn.primary}>Envoyer par WhatsApp</a>
        <button type="button" className={btn.secondary} onClick={() => res && navigator.clipboard?.writeText(res.code).then(() => toast('Code copié', 'success'))}>
          Copier le code</button>
      </Sheet>
    </>
  );
}
