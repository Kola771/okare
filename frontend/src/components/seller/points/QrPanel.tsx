'use client';

/**
 * QR code du point de vente (écran 18, VD3, DB3 onglet QR) : l'affiche A5 mise en scène à gauche ;
 * à droite ce que fait le QR, les chiffres réels (scans comptés une fois par appareil et par heure,
 * commandes = contacts arrivés par un scan), les étapes et les actions.
 */
import { ShieldCheck } from 'lucide-react';
import type { ManagedPos } from '@/lib/api';
import { QrActions } from './QrActions';
import { QrPoster } from './QrPoster';

/** Domaine public à confirmer (spec 12.6). */
export const QR_BASE = 'okare.bj/q/';

const STEPS = ['L’agent colle l’autocollant à l’entrée', 'Le client le scanne avec son appareil photo', 'Il voit ton menu et commande sur WhatsApp'];

export function QrPanel({ pos }: { pos: ManagedPos }) {
  const short = `${QR_BASE}${pos.qrCode}`;
  const url = `https://${short}`;
  return (
    <section className="grid overflow-hidden rounded-[24px] border border-[#E7E5E4] bg-white lg:grid-cols-[400px_minmax(0,1fr)]">
      <div className="relative flex items-center justify-center overflow-hidden bg-charbon px-6 py-10 lg:py-12">
        <div aria-hidden className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-piment/40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-28 -right-16 h-64 w-64 rounded-full bg-mais/25 blur-3xl" />
        <div className="relative w-full"><QrPoster name={pos.name} url={url} short={short} /></div>
      </div>

      <div className="flex min-w-0 flex-col gap-6 p-6 lg:p-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-[1.2px] text-piment">QR code de l’entrée</span>
          <h2 className="m-0 mt-1.5 font-display text-[24px] font-extrabold leading-tight lg:text-[28px]">Un scan, et ton menu s’ouvre.</h2>
          <p className="m-0 mt-2 text-[15px] leading-relaxed text-ardoise">
            Le client voit ton plat du jour et tes prix sans rien installer, puis commande sur WhatsApp sans faire la queue.
          </p>
        </div>

        <div className="grid grid-cols-2 divide-x divide-[#E7E5E4] rounded-2xl border border-[#E7E5E4]">
          {([[pos.qrScans7d, 'scans', 'un par téléphone et par heure'], [pos.qrOrders7d, 'commandes après un scan', 'contacts venus du QR']] as const).map(([v, l, hint]) => (
            <div key={l} className="flex flex-col gap-0.5 p-4 lg:p-5">
              <span className="font-display text-[34px] font-extrabold leading-none">{v}</span>
              <span className="text-sm font-semibold">{l}</span>
              <span className="text-xs text-pierre">7 derniers jours · {hint}</span>
            </div>))}
        </div>

        <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-start gap-2.5 text-[13px] leading-snug">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-piment-soft text-[13px] font-extrabold text-piment">{i + 1}</span>
              <span className="pt-1">{s}</span>
            </li>))}
        </ol>

        <QrActions url={url} code={pos.qrCode} />

        <p className="m-0 flex items-start gap-2 text-[13px] leading-snug text-ardoise">
          <ShieldCheck size={17} className="mt-px shrink-0 text-feuille" />
          Autocollant résistant fourni et posé par ton agent OKARE. Si un faux est collé par-dessus, l’équipe révoque ce code et t’en donne un nouveau.
        </p>
      </div>
    </section>
  );
}
