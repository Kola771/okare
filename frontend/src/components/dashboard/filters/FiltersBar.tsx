'use client';

/**
 * Barre de filtres du dashboard : pays → ville → zone → quartier (en cascade), date de début, date de fin.
 * Le filtre est porté par l'adresse : la page se recharge avec les bonnes données, et le lien peut être partagé.
 */
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getGeography, type Geography } from '@/lib/api';
import { useApi } from '@/components/admin/useApi';
import { filterFromParams, filterToQuery, hasFilter, type TeamFilter } from '@/shared/team-filter';

const ctl = 'min-h-11 w-full min-w-0 rounded-xl border border-[#E7E5E4] bg-white px-3 text-sm font-semibold text-charbon disabled:bg-[#FAFAF9] disabled:text-pierre';

function Pick({ label, value, onChange, options, all, disabled }: {
  label: string; value: string; onChange: (v: string) => void; options: { id: string; name: string }[]; all: string; disabled?: boolean;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-bold text-ardoise">{label}
      <select className={ctl} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        <option value="">{all}</option>{options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </label>
  );
}

/** `dates={false}` : lieu seulement (pays, ville, zone, quartier). */
export function FiltersBar({ geo: initialGeo, dateHint, dates = true }: { geo?: Geography; dateHint?: string; dates?: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const f = filterFromParams((k) => params.get(k));
  const geo = useApi(getGeography, [], initialGeo).data;
  const set = (patch: TeamFilter) => router.replace(`${path}${filterToQuery({ ...f, ...patch })}`, { scroll: false });
  // Choisir un niveau fin remplit les niveaux au-dessus (quartier → zone → ville → pays).
  const up = (cityId?: string) => ({ cityId, countryId: geo?.cities.find((c) => c.id === cityId)?.countryId });
  const zoneUp = (zoneId?: string) => ({ zoneId, ...up(geo?.zones.find((z) => z.id === zoneId)?.cityId) });

  const countryZones = (countryId?: string) => (geo?.cities ?? []).filter((c) => !countryId || c.countryId === countryId).map((c) => c.id);
  const cities = (geo?.cities ?? []).filter((c) => !f.countryId || c.countryId === f.countryId);
  const zones = (geo?.zones ?? []).filter((z) => (f.cityId ? z.cityId === f.cityId : countryZones(f.countryId).includes(z.cityId)));
  const nbs = (geo?.neighborhoods ?? []).filter((n) => (f.zoneId ? n.zoneId === f.zoneId : zones.some((z) => z.id === n.zoneId)));

  return (
    <section aria-label="Filtres" className="flex flex-col gap-3 rounded-2xl border border-[#E7E5E4] bg-white p-4">
      <div className={`grid grid-cols-2 gap-3 ${dates ? 'sm:grid-cols-3 xl:grid-cols-6' : 'sm:grid-cols-4'}`}>
        <Pick label="Pays" all="Tous les pays" value={f.countryId ?? ''} options={geo?.countries ?? []}
          onChange={(v) => set({ countryId: v || undefined, cityId: undefined, zoneId: undefined, neighborhoodId: undefined })} />
        <Pick label="Ville" all="Toutes les villes" value={f.cityId ?? ''} options={cities}
          onChange={(v) => set(v ? { ...up(v), zoneId: undefined, neighborhoodId: undefined } : { cityId: undefined, zoneId: undefined, neighborhoodId: undefined })} />
        <Pick label="Zone" all="Toutes les zones" value={f.zoneId ?? ''} options={zones}
          onChange={(v) => set(v ? { ...zoneUp(v), neighborhoodId: undefined } : { zoneId: undefined, neighborhoodId: undefined })} />
        <Pick label="Quartier" all="Tous les quartiers" value={f.neighborhoodId ?? ''} options={nbs}
          onChange={(v) => set(v ? { neighborhoodId: v, ...zoneUp(geo?.neighborhoods.find((n) => n.id === v)?.zoneId) } : { neighborhoodId: undefined })} />
        {dates && <>
        <label className="flex min-w-0 flex-col gap-1 text-xs font-bold text-ardoise">Date de début
          <input type="date" className={ctl} value={f.from ?? ''} max={f.to} onChange={(e) => set({ from: e.target.value || undefined })} /></label>
        <label className="flex min-w-0 flex-col gap-1 text-xs font-bold text-ardoise">Date de fin
          <input type="date" className={ctl} value={f.to ?? ''} min={f.from} onChange={(e) => set({ to: e.target.value || undefined })} /></label>
        </>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-ardoise">
        <span>{dateHint ?? ''}</span>
        {hasFilter(f) && <button type="button" className="font-semibold text-piment underline" onClick={() => router.replace(path, { scroll: false })}>Effacer les filtres</button>}
      </div>
    </section>
  );
}
