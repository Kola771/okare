'use client';

/**
 * Session du client + action en attente (section 6) : une action qui demande un compte ouvre la feuille
 * d'inscription (écran 3 / D5), puis reprend l'action une fois connecté (`pendingAction`).
 */
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getMe, logout as apiLogout, type Me } from '@/lib/api';

/** Contexte affiché en tête de la feuille d'inscription (plat ou point de vente visé). */
export interface AuthIntent {
  title?: string;
  subtitle?: string;
  illustrationKey?: string | null;
  run: () => void | Promise<void>;
}

interface SessionValue {
  me: Me | null;
  loading: boolean;
  refresh: () => Promise<Me | null>;
  logout: () => Promise<void>;
  /** Exécute `intent.run` tout de suite si connecté, sinon après inscription ou connexion. */
  requireAuth: (intent: AuthIntent) => void;
  pendingIntent: AuthIntent | null;
  closeAuth: () => void;
  /** Appelé par la feuille d'inscription quand le compte est prêt. */
  completeAuth: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

/** `initialMe` est lu côté serveur (cookie de session) : pas d'attente ni d'aller-retour au chargement. */
export function SessionProvider({ children, initialMe }: { children: React.ReactNode; initialMe: Me | null }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(initialMe);
  const [loading, setLoading] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<AuthIntent | null>(null);
  const intentRef = useRef<AuthIntent | null>(null);
  /** Dernier chargement de la session : une action ne décide jamais avant qu'il soit terminé. */
  const loadRef = useRef<Promise<Me | null> | null>(Promise.resolve(initialMe));

  const refresh = useCallback(() => {
    const p = getMe()
      .then((m) => {
        setMe(m);
        return m;
      })
      .catch(() => null)
      .finally(() => setLoading(false));
    loadRef.current = p;
    return p;
  }, []);

  useEffect(() => {
    // Connexion ou déconnexion : on relit le compte et on recalcule les pages serveur avec le nouveau cookie.
    const onSession = () => { void refresh(); router.refresh(); };
    window.addEventListener('okare:session', onSession);
    return () => window.removeEventListener('okare:session', onSession);
  }, [refresh, router]);

  const requireAuth = useCallback((intent: AuthIntent) => {
    void (async () => {
      const current = me ?? (loadRef.current ? await loadRef.current : null);
      if (current) {
        await intent.run();
        return;
      }
      intentRef.current = intent;
      setPendingIntent(intent);
    })();
  }, [me]);

  const closeAuth = useCallback(() => {
    intentRef.current = null;
    setPendingIntent(null);
  }, []);

  const completeAuth = useCallback(async () => {
    await refresh();
    const intent = intentRef.current;
    intentRef.current = null;
    setPendingIntent(null);
    if (intent) await intent.run();
  }, [refresh]);

  const logout = useCallback(async () => {
    await apiLogout();
    loadRef.current = Promise.resolve(null);
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({ me, loading, refresh, logout, requireAuth, pendingIntent, closeAuth, completeAuth }),
    [me, loading, refresh, logout, requireAuth, pendingIntent, closeAuth, completeAuth],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession doit être utilisé sous <SessionProvider>');
  return ctx;
}
