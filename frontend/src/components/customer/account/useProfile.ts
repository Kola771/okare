'use client';

/** Enregistrer une modification du profil (PATCH /me), avec message de confirmation ou d'erreur. */
import { useCallback, useState } from 'react';
import { errorMessage, isApiError, updateMe } from '@/lib/api';
import type { ProfileInput } from '@/shared/schemas';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';

export function useProfileSave() {
  const { refresh } = useSession();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useCallback(async (patch: ProfileInput, success = 'Enregistré') => {
    setBusy(true);
    setErrors({});
    try {
      await updateMe(patch);
      await refresh();
      toast(success, 'success');
      return true;
    } catch (e) {
      if (isApiError(e) && e.details && typeof e.details === 'object') setErrors(e.details as Record<string, string>);
      toast(errorMessage(e), 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh, toast]);

  return { save, busy, errors };
}
