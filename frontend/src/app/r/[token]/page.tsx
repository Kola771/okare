'use client';

/** Rapport vendeur partagé (/r/[token]) : lecture seule, sans connexion, avec « Envoyer sur WhatsApp » (10). */
import { use } from 'react';
import { getSharedReport } from '@/lib/api';
import { useApi } from '@/components/admin/useApi';
import { StatsView } from '@/components/seller/stats/StatsView';
import { Logo } from '@/components/ui/Logo';
import { ErrorState, LoadingList } from '@/components/ui/States';

export default function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { data, error, loading } = useApi(() => getSharedReport(token), [token]);
  return (
    <div className="bg-motif min-h-dvh">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-5 px-5 py-6">
        <div className="flex items-center justify-between"><Logo size={30} />
          {data && <a href={`https://wa.me/?text=${encodeURIComponent(`Rapport OKARE de ${data.posName} : ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
            target="_blank" rel="noopener noreferrer" className="min-h-11 rounded-xl bg-feuille px-4 py-2.5 text-sm font-bold text-white no-underline hover:text-white">Envoyer sur WhatsApp</a>}
        </div>
        {error ? <ErrorState message={error} /> : loading || !data ? <LoadingList count={3} className="h-40" /> : (
          <>
            <div><div className="text-[13px] text-ardoise">Rapport des 30 derniers jours</div>
              <h1 className="m-0 font-display text-[28px] font-extrabold">{data.posName}</h1></div>
            <StatsView report={data.report} periodLabel="Ces 30 jours" />
          </>
        )}
      </div>
    </div>
  );
}
