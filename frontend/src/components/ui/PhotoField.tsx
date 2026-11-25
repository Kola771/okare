'use client';

/**
 * Champ photo facultatif : prendre une photo (appareil du téléphone) ou en choisir une ; aperçu, changer, retirer.
 * La photo est compressée sur l'appareil (lib/image/compress) avant d'être gardée.
 */
import { Camera, ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { compressImage } from '@/lib/image/compress';

export function PhotoField({ label, hint, value, onChange, pending }: {
  label: string; hint?: string; value: string | null; onChange: (dataUrl: string | null, name?: string) => void; pending?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const photo = await compressImage(file);
      onChange(photo.dataUrl, photo.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Photo illisible.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{label} <span className="font-normal text-ardoise">(facultatif)</span></span>
      <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      {value ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="h-40 w-full rounded-xl object-cover sm:w-64" />
          <div className="flex gap-2">
            <button type="button" onClick={() => input.current?.click()} className="flex min-h-10 items-center gap-1.5 rounded-xl border border-trait bg-surface px-3 text-[13px] font-bold">
              <Camera size={16} />Changer</button>
            <button type="button" onClick={() => onChange(null)} className="flex min-h-10 items-center gap-1.5 rounded-xl border border-[#FECACA] bg-surface px-3 text-[13px] font-bold text-erreur">
              <Trash2 size={16} />Retirer</button>
          </div>
        </div>
      ) : (
        <button type="button" disabled={busy} onClick={() => input.current?.click()}
          className="flex min-h-[120px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-bordure bg-surface-inset px-4 text-center text-sm text-ardoise hover:border-piment hover:text-piment">
          <ImagePlus size={26} />
          <b className="text-charbon">{busy ? 'Préparation de la photo…' : 'Prendre ou choisir une photo'}</b>
          {hint && <span className="text-xs">{hint}</span>}
        </button>
      )}
      {pending && <span className="text-xs font-semibold text-attention">En relecture par l’équipe OKARE : visible par les clients après validation.</span>}
      {error && <span className="text-xs font-semibold text-erreur">{error}</span>}
    </div>
  );
}
