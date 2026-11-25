'use client';

/** Sélecteur de zone (7.3) : géolocalisation, ou zone / quartier cherchés sans accents. */
import { LocateFixed, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useToast } from '@/components/providers/ToastProvider';
import { useViewer } from '@/components/providers/ViewerProvider';
import { Sheet } from '@/components/ui/Sheet';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function ZonePicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { zones, zoneId, setZone, locateMe } = useViewer();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [locating, setLocating] = useState(false);

  const list = useMemo(() => {
    const n = norm(q.trim());
    return n ? zones.filter((z) => norm(z.name).includes(n) || z.neighborhoods.some((nb) => norm(nb).includes(n))) : zones;
  }, [zones, q]);

  return (
    <Sheet open={open} onClose={onClose} labelledBy="zone-title">
      <h2 id="zone-title" className="m-0 font-display text-2xl font-extrabold">Où es-tu&nbsp;?</h2>
      <button type="button" disabled={locating}
        onClick={async () => {
          setLocating(true);
          const msg = await locateMe();
          setLocating(false);
          if (msg) toast(msg);
          else onClose();
        }}
        className="flex min-h-[52px] items-center justify-center gap-2 rounded-[14px] bg-inverse font-bold text-on-inverse disabled:opacity-60">
        <LocateFixed size={18} /> {locating ? 'Recherche de ta position…' : 'Utiliser ma position'}
      </button>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zone ou quartier (ex. Cadjèhoun, Tokpa)" aria-label="Chercher une zone"
        className="min-h-12 rounded-[14px] border border-bordure-douce px-3.5 text-base outline-none" />
      <ul className="m-0 flex list-none flex-col p-0">
        {list.map((z) => (
          <li key={z.id}>
            <button type="button" onClick={() => { setZone(z.id); onClose(); }}
              className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl px-2 text-left ${z.id === zoneId ? 'bg-piment-soft' : ''}`}>
              <MapPin size={18} className={z.id === zoneId ? 'text-piment' : 'text-ardoise'} />
              <span className="flex-1">
                <b className="block text-[15px]">{z.name}</b>
                <span className="text-xs text-ardoise">{z.neighborhoods.join(' · ')}</span>
              </span>
            </button>
          </li>
        ))}
        {!list.length && <li className="py-4 text-center text-sm text-ardoise">Aucune zone ne correspond.</li>}
      </ul>
    </Sheet>
  );
}

/** Bouton « Ganhi, Cotonou » qui ouvre le sélecteur. */
export function ZoneButton({ variant = 'mobile' }: { variant?: 'mobile' | 'desktop' }) {
  const { zone } = useViewer();
  const [open, setOpen] = useState(false);
  const cls = variant === 'desktop'
    ? 'border border-piment-pale bg-piment-soft text-piment-dark'
    : 'bg-argile text-charbon';
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={`flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ${cls}`}>
        <MapPin size={16} /> {zone ? `${zone.name}, Cotonou` : 'Choisir ma zone'}
        {variant === 'desktop' && <span aria-hidden>▾</span>}
      </button>
      <ZonePicker open={open} onClose={() => setOpen(false)} />
    </>
  );
}
