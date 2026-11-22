'use client';

/**
 * Charge une donnée de l'API avec états chargement / erreur et rechargement.
 * Avec `initial` (lu par la page serveur), rien n'est rechargé au premier affichage (spec 0ter.9) :
 * on ne relit qu'après une action (`reload`) ou un changement de `deps`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '@/lib/api';

export function useApi<T>(load: () => Promise<T>, deps: unknown[], initial?: T) {
  const [data, setData] = useState<T | null>(initial ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(initial === undefined);
  const skipFirst = useRef(initial !== undefined);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await run());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}
