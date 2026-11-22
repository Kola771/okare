'use client';

/** Favoris du client, partagés par toutes les cartes (cœur) ; ajout = compte requis. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addFavorite, errorMessage, getFavoriteIds, removeFavorite } from '@/lib/api';
import { useSession } from './SessionProvider';
import { useToast } from './ToastProvider';

interface FavoritesValue {
  ids: Set<string>;
  isFavorite: (posId: string) => boolean;
  toggle: (posId: string, posName: string) => void;
  version: number;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { me, requireAuth } = useSession();
  const toast = useToast();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    getFavoriteIds().then((list) => setIds(new Set(list))).catch(() => setIds(new Set()));
  }, [me]);

  const toggle = useCallback((posId: string, posName: string) => {
    requireAuth({
      title: posName,
      subtitle: 'Ajouter à mes favoris',
      run: async () => {
        const fav = ids.has(posId);
        setIds((s) => {
          const next = new Set(s);
          if (fav) next.delete(posId);
          else next.add(posId);
          return next;
        });
        try {
          await (fav ? removeFavorite(posId) : addFavorite(posId));
          setVersion((v) => v + 1);
          toast(fav ? `${posName} retiré de tes favoris` : `${posName} ajouté à tes favoris`, 'success');
        } catch (e) {
          setIds((s) => {
            const back = new Set(s);
            if (fav) back.add(posId);
            else back.delete(posId);
            return back;
          });
          toast(errorMessage(e), 'error');
        }
      },
    });
  }, [ids, requireAuth, toast]);

  const value = useMemo(() => ({ ids, isFavorite: (id: string) => ids.has(id), toggle, version }), [ids, toggle, version]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites doit être utilisé sous <FavoritesProvider>');
  return ctx;
}
