'use client';

/** Grille des prix des pubs par zone ciblée (DB5) : prix d'un jour par catégorie et type de vendeur, en FCFA. */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { errorMessage, savePriceGrid, type PriceGridRow } from '@/lib/api';
import { btn } from '@/components/admin/AdminParts';
import { Card } from '@/components/admin/Card';
import { useToast } from '@/components/providers/ToastProvider';
import { POS_TYPE_LABEL } from '@/shared/enums';

const RULES = 'Un jour (3 zones) : somme des prix d’un jour · Période (2 à 21 jours, 5 zones) : zone la plus chère × jours · '
  + 'Un mois (7 zones) : zone la plus chère × 30 · Premium (15 zones) : zone la plus chère × 30 × 1,5 · '
  + 'point principal : −10 % Période et Mois, −5 % Premium · autres points : −20 %, −15 % en Premium · '
  + 'un Particulier n’a qu’un seul point de vente · Particuliers : 50 % des places au plus';

export function PriceGridCard({ rows, canEdit }: { rows: PriceGridRow[]; canEdit: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [prices, setPrices] = useState<Record<string, string>>(Object.fromEntries(rows.map((r) => [r.id, String(r.dayPriceXof)])));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await savePriceGrid(rows.map((r) => ({ id: r.id, dayPriceXof: Number(prices[r.id] || 0) })));
      toast('Grille enregistrée', 'success');
      router.refresh();
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Grille des prix des pubs, par zone ciblée (FCFA)" flush>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left text-sm">
          <thead><tr className="bg-[#FAFAF9] text-xs text-ardoise">
            <th className="w-[22%] px-4 py-3 font-semibold">Catégorie</th><th className="w-[33%] px-4 py-3 font-semibold">Type de vendeur</th>
            <th className="px-4 py-3 font-semibold">Prix d’un jour, par zone</th>
          </tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-t border-[#E7E5E4]">
              <td className="px-4 py-3 font-bold">{r.category}</td>
              <td className="px-4 py-3">{POS_TYPE_LABEL[r.posType]}</td>
              <td className="px-4 py-3">
                <input aria-label={`Prix catégorie ${r.category}, ${POS_TYPE_LABEL[r.posType]}`} inputMode="numeric" disabled={!canEdit}
                  value={prices[r.id] ?? ''} onChange={(e) => setPrices({ ...prices, [r.id]: e.target.value.replace(/\D/g, '') })}
                  className="h-[38px] w-[108px] rounded-[10px] border border-[#E7E5E4] px-3 text-right text-[15px] font-bold disabled:bg-[#FAFAF9]" />
              </td>
            </tr>))}</tbody>
        </table>
      </div>
      <div className="flex flex-col items-start gap-3 border-t border-[#E7E5E4] px-5 py-4">
        <p className="m-0 text-[13px] leading-snug text-ardoise">{RULES}</p>
        {canEdit && <button type="button" className={btn.primary} disabled={busy} onClick={save}>Enregistrer la grille</button>}
      </div>
    </Card>
  );
}
