'use client';

/** Recherche (/search?q=) : même moteur et mêmes cartes que l'accueil, sur toute la ville (8.1). */
import { ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FeedPage } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';
import { BudgetChips, OpenNowChip } from './Filters';
import { FeedList } from './FeedList';
import { useFeed } from './useFeed';

/** `q` et la première page de résultats viennent de la page serveur (spec 0ter.9). */
export function SearchScreen({ q, initial }: { q: string; initial: FeedPage | undefined }) {
  const router = useRouter();
  const [input, setInput] = useState(q);
  useEffect(() => setInput(q), [q]);
  const filters = useMemo(() => ({ q }), [q]);
  const feed = useFeed(filters, 24, initial);

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 px-5 py-5 md:px-8 lg:py-7">
      <form role="search" className="flex items-center gap-2 lg:hidden"
        onSubmit={(e) => { e.preventDefault(); router.replace(`/search?q=${encodeURIComponent(input.trim())}`); }}>
        <Link href="/" aria-label="Retour" className="flex h-11 w-11 items-center justify-center rounded-full border border-trait bg-white text-charbon"><ArrowLeft size={20} /></Link>
        <label className="flex min-h-12 flex-1 items-center gap-2.5 rounded-[14px] border border-trait bg-white px-3.5">
          <Search size={18} className="text-ardoise" />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Plat, maquis, quartier…" aria-label="Rechercher" autoFocus={!q}
            className="min-w-0 flex-1 border-0 bg-transparent text-[15px] outline-none" />
        </label>
      </form>
      <div>
        <h1 className="m-0 font-display text-2xl font-extrabold lg:text-[32px]">{q ? `« ${q} »` : 'Rechercher'}</h1>
        {q && !feed.loading && !feed.error && (
          <div className="mt-1 text-sm text-ardoise">{feed.total} résultat{feed.total > 1 ? 's' : ''} à Cotonou</div>
        )}
      </div>
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
        <BudgetChips variant="dark" /><span className="mx-1 h-[26px] w-px shrink-0 bg-trait" /><OpenNowChip />
      </div>
      {q ? (
        <FeedList feed={feed} source="SEARCH"
          emptyText="Aucun plat ni point de vente ne correspond. Essaie un autre mot (ex. « atassi », « riz », un quartier)." />
      ) : (
        <p className="m-0 text-sm text-ardoise">Cherche un plat (« riz arachide »), un point de vente ou un quartier (« Cadjèhoun »).</p>
      )}
    </div>
  );
}
