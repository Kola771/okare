'use client';

/**
 * Affiche le suivi au **retour** du client dans l'appli (9.5 a) : au chargement et quand l'onglet redevient visible.
 * Peut aussi être ouvert pour un contact précis : `window.dispatchEvent(new CustomEvent('okare:followup', { detail: contactId }))`.
 */
import { useCallback, useEffect, useState } from 'react';
import { getFollowUp, getPendingFollowUp, type PendingFollowUp } from '@/lib/api';
import { useSession } from '@/components/providers/SessionProvider';
import { FollowUpSheet } from './FollowUpSheet';

/** Ouverture automatique au retour dans l'appli (9.5 a) : à réactiver avec le backend et les vrais comptes. */
const AUTO_OPEN = false;

export function FollowUpGate() {
  const { me } = useSession();
  const [current, setCurrent] = useState<PendingFollowUp | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const check = useCallback(async () => {
    if (!me || current) return;
    try {
      const f = await getPendingFollowUp();
      if (f && !dismissed.includes(f.contactId)) setCurrent(f);
    } catch {
      /* silencieux : le suivi n'est jamais bloquant */
    }
  }, [me, current, dismissed]);

  useEffect(() => {
    // Phase 1 (accès libre, cliente de démonstration partout) : pas d'ouverture automatique, sinon la fenêtre
    // s'ouvrirait sur chaque page. Ouverture à la demande : /pages ou « Il t'a répondu ? » des derniers contacts.
    if (!AUTO_OPEN) return;
    void check();
    const onVisible = () => document.visibilityState === 'visible' && void check();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [check]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      getFollowUp(id).then(setCurrent).catch(() => undefined);
    };
    window.addEventListener('okare:followup', onOpen);
    return () => window.removeEventListener('okare:followup', onOpen);
  }, []);

  if (!current) return null;
  return (
    <FollowUpSheet
      key={current.contactId}
      followUp={current}
      onClose={() => {
        setDismissed((d) => [...d, current.contactId]);
        setCurrent(null);
      }}
    />
  );
}
