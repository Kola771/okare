/**
 * Affiche A5 du point de vente (écran 18) : bandeau piment avec le logo, nom du point, QR code, adresse courte.
 * C'est ce bloc seul qui sort à l'impression (`#qr-poster`, voir globals.css).
 */
import { QRCodeSVG } from 'qrcode.react';

export function QrPoster({ name, url, short }: { name: string; url: string; short: string }) {
  return (
    <div id="qr-poster" className="mx-auto flex w-full max-w-[300px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_18px_40px_-18px_rgba(28,25,23,0.45)] ring-1 ring-[#E7E5E4]">
      <div className="bg-motif-piment flex flex-col items-center gap-1 px-5 pb-5 pt-4 text-center">
        <span className="font-display text-[30px] font-extrabold leading-none text-white">okare</span>
        <span className="text-[12px] font-semibold uppercase tracking-[1.5px] text-white/85">Le menu et les prix du jour</span>
      </div>
      <div className="-mt-3 flex flex-col items-center gap-3 rounded-t-[18px] bg-white px-6 pb-6 pt-5 text-center">
        <b className="font-display text-[20px] leading-tight">{name}</b>
        <div className="rounded-2xl border-2 border-charbon p-3">
          <QRCodeSVG value={url} size={176} level="M" marginSize={0} />
        </div>
        <span className="rounded-full bg-[#F5F5F4] px-3 py-1 font-mono text-[13px] font-bold">{short}</span>
        <span className="text-[12px] leading-snug text-ardoise">Scanne avec l’appareil photo de ton téléphone.<br />Rien à installer.</span>
      </div>
    </div>
  );
}
