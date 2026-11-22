'use client';

/** Confirmation de suppression du compte (DELETE /me) : anonymisation des contacts, favoris effacés (18). */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteMe, errorMessage } from '@/lib/api';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Sheet } from '@/components/ui/Sheet';

export function DeleteAccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useSession();
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} labelledBy="delete-title" maxWidth="lg:max-w-[440px]">
      <h2 id="delete-title" className="m-0 font-display text-[22px] font-extrabold">Supprimer ton compte&nbsp;?</h2>
      <p className="m-0 text-[15px] leading-normal text-ardoise">
        Tes favoris et ton historique seront effacés sous 30 jours. Tes avis restent, sans ton nom. Cette action ne peut pas être annulée.
      </p>
      <div className="flex gap-2.5">
        <button type="button" onClick={onClose} className="min-h-[50px] flex-1 rounded-[14px] border border-bordure font-bold">Annuler</button>
        <button type="button" disabled={busy} className="min-h-[50px] flex-1 rounded-[14px] bg-red-700 font-bold text-white disabled:opacity-60"
          onClick={async () => {
            setBusy(true);
            try {
              await deleteMe();
              await refresh();
              toast('Ton compte a été supprimé.');
              router.push('/');
            } catch (e) {
              toast(errorMessage(e), 'error');
            } finally {
              setBusy(false);
            }
          }}>
          {busy ? 'Suppression…' : 'Supprimer'}
        </button>
      </div>
    </Sheet>
  );
}
