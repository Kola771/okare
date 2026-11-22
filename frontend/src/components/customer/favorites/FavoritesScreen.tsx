'use client';

/** Favoris — écran 14 (mobile) et D3 (desktop : grille de favoris + derniers contacts dans « Mon compte »). */
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, getFavoritesToday, now, setFavoritesDigest, type FavoriteToday, type MyContact } from '@/lib/api';
import { AccountGate, AccountShell } from '@/components/customer/account/AccountShell';
import { ContactsList } from '@/components/customer/account/ContactsList';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useSession } from '@/components/providers/SessionProvider';
import { useViewerPoint } from '@/components/providers/ViewerProvider';
import { Switch } from '@/components/ui/Fields';
import { EmptyState, ErrorState, LoadingList } from '@/components/ui/States';
import { useIsDesktop } from '@/components/ui/useMediaQuery';
import { FavoriteCard, FavoriteRow } from './FavoriteItems';

function useFavoritesToday(initial: FavoriteToday[] | null) {
  const { me } = useSession();
  const { version } = useFavorites();
  const point = useViewerPoint();
  const [items, setItems] = useState<FavoriteToday[] | null>(initial);
  const skipFirst = useRef(initial !== null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    if (!me) return;
    setError(null);
    getFavoritesToday(point).then(setItems).catch((e) => setError(errorMessage(e)));
  }, [me, point]);
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    load();
  }, [load, version]);
  return { items, error, reload: load };
}

function DigestSwitch() {
  const { me, refresh } = useSession();
  const [on, setOn] = useState(me?.notifyFavorites ?? true);
  return (
    <Switch checked={on} label="Recevoir leurs plats du jour" onChange={async (v) => {
      setOn(v);
      await setFavoritesDigest(v).catch(() => setOn(!v));
      void refresh();
    }} />
  );
}

function Content({ variant, initial }: { variant: 'mobile' | 'desktop'; initial: FavoriteToday[] | null }) {
  const { items, error, reload } = useFavoritesToday(initial);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!items) return <LoadingList count={3} />;
  if (!items.length) {
    return <EmptyState title="Pas encore de favori" text="Touche le cœur d’un plat ou d’un point de vente pour retrouver ici son plat du jour."
      action={<Link href="/" className="flex min-h-11 items-center rounded-btn bg-piment px-5 text-sm font-bold text-white no-underline">Explorer</Link>} />;
  }
  if (variant === 'mobile') return <div className="flex flex-col gap-3.5">{items.map((f) => <FavoriteRow key={f.pos.id} fav={f} />)}</div>;
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
      {items.map((f) => <FavoriteCard key={f.pos.id} fav={f} />)}
      <Link href="/" className="flex flex-col justify-center gap-1.5 rounded-card border-2 border-dashed border-bordure-douce p-5 text-charbon no-underline">
        <b>Ajoute d’autres favoris</b><span className="text-[13px] text-ardoise">Touche le cœur d’un plat pour retrouver ici son point de vente.</span>
        <span className="text-[13px] font-bold text-piment">Explorer la carte →</span>
      </Link>
    </div>
  );
}

/** `initial*` : favoris et derniers contacts lus par la page serveur (aucun chargement au premier affichage). */
export function FavoritesScreen({ initialFavorites, initialContacts }: { initialFavorites: FavoriteToday[] | null; initialContacts: MyContact[] | null }) {
  const isDesktop = useIsDesktop();
  const { me } = useSession();
  const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now());

  if (isDesktop) {
    return (
      <AccountShell next="/favorites">
        {() => (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><h1 className="m-0 font-display text-[32px] font-extrabold">Mes favoris</h1>
                <div className="mt-1 text-[15px] text-ardoise">Ce qu’ils cuisinent aujourd’hui, {today}.</div></div>
              <label className="flex items-center gap-2.5 rounded-[14px] border border-trait bg-white px-3.5 py-2.5 text-sm font-semibold">
                <DigestSwitch /> Recevoir leurs plats du jour vers 10h15
              </label>
            </div>
            <Content variant="desktop" initial={initialFavorites} />
            <section id="contacts" className="flex flex-col gap-3">
              <div><h2 className="m-0 text-[21px] font-extrabold">Derniers contacts</h2>
                <div className="text-sm text-ardoise">Tes réponses aident à repérer les vendeurs sérieux.</div></div>
              <ContactsList variant="table" initial={initialContacts} />
            </section>
          </>
        )}
      </AccountShell>
    );
  }
  return (
    <div className="flex flex-col gap-3.5 px-5 py-[22px]">
      <div className="flex flex-col gap-1"><h1 className="m-0 font-display text-[26px] font-extrabold">Mes favoris</h1>
        <div className="text-sm text-ardoise">Ce qu’ils cuisinent aujourd’hui</div></div>
      {me ? (
        <>
          <Content variant="mobile" initial={initialFavorites} />
          <label className="flex items-center gap-2.5 rounded-[14px] bg-feuille-pale px-3.5 py-3">
            <span className="flex-1 text-[13px] leading-snug text-feuille-ink">Reçois leurs plats du jour chaque matin.</span><DigestSwitch />
          </label>
        </>
      ) : <AccountGate next="/favorites" />}
    </div>
  );
}
