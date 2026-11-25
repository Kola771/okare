/** « Mes zones » (accueil vendeur) : carte des zones où se trouvent ses points de vente, puis la liste zone par zone. */
import { MapPin } from 'lucide-react';
import type { VendorHome } from '@/lib/api';
import { Card } from '@/components/admin/Card';
import { CatPill, ZonesMapLazy } from '@/components/dashboard/zones/ZoneClient';

export function ZonesCard({ zones }: { zones: VendorHome['zones'] }) {
  const onMap = zones.filter((z) => z.center).map((z) => ({ id: z.id, name: z.name, center: z.center!, category: z.category }));
  return (
    <Card title="Mes zones" right={<span className="text-[13px] text-ardoise">{zones.length} zone{zones.length > 1 ? 's' : ''} · là où les clients te trouvent</span>}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        {!!onMap.length && (
          <div className="relative z-0 h-[240px] overflow-hidden rounded-xl bg-argile">
            <ZonesMapLazy zones={onMap} center={onMap[0]!.center} />
          </div>
        )}
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {zones.map((z) => (
            <li key={z.id} className="flex items-start gap-3 rounded-xl border border-trait p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-piment-soft text-piment"><MapPin size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2"><b>{z.name}</b><CatPill code={z.category} /></span>
                <span className="block text-[13px] text-ardoise">{z.points.join(', ')}</span>
                {!!z.neighborhoods.length && <span className="block text-xs text-pierre">Quartier : {z.neighborhoods.join(', ')}</span>}
              </span>
            </li>))}
        </ul>
      </div>
    </Card>
  );
}
