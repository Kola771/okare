'use client';

/** Actions du QR code : lien à copier, imprimer l'affiche A5, télécharger le QR en image (PNG), partager sur WhatsApp. */
import { Check, Copy, ImageDown, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useRef, useState } from 'react';
import { btn } from '@/components/admin/AdminParts';
import { WhatsAppIcon } from '@/components/customer/contact/icons';
import { useToast } from '@/components/providers/ToastProvider';

export function QrActions({ url, code }: { url: string; code: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const share = `https://wa.me/?text=${encodeURIComponent(`Mon menu et mes prix du jour sur OKARE : ${url}`)}`;

  const copy = () => navigator.clipboard?.writeText(url).then(() => { setCopied(true); toast('Lien copié', 'success'); setTimeout(() => setCopied(false), 2000); });
  const png = () => {
    const a = document.createElement('a');
    a.href = canvas.current?.toDataURL('image/png') ?? '';
    a.download = `okare-qr-${code}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-trait bg-surface-inset p-1.5 pl-4">
        <span className="min-w-0 flex-1 truncate font-mono text-[15px] font-semibold">{url.replace('https://', '')}</span>
        <button type="button" onClick={copy} className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-surface px-3.5 text-[13px] font-bold shadow-sm ring-1 ring-trait">
          {copied ? <Check size={16} className="text-feuille" /> : <Copy size={16} />}{copied ? 'Copié' : 'Copier'}</button>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        <button type="button" className={btn.primary} onClick={() => window.print()}><Printer size={17} /> Imprimer l’affiche</button>
        <button type="button" className={btn.secondary} onClick={png}><ImageDown size={17} /> Image du QR</button>
        <a href={share} target="_blank" rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#25D366] bg-surface px-4 text-sm font-bold text-[#128C4A] no-underline hover:bg-[#F0FDF4] hover:text-[#128C4A]">
          <WhatsAppIcon size={17} /> Partager</a>
      </div>
      <QRCodeCanvas ref={canvas} value={url} size={1024} marginSize={2} level="M" className="hidden" aria-hidden />
    </div>
  );
}
