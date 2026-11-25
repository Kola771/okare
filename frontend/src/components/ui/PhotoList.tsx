'use client';

/** Plusieurs photos facultatives (intérieur, plats…) : vignettes avec « retirer », case « + ajouter » ; compressées ici. */
import { ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { compressImage } from '@/lib/image/compress';

export function PhotoList({ label, hint, value, onChange, max = 5 }: {
  label: string; hint?: string; value: string[]; onChange: (v: string[]) => void; max?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const next = [...value];
      for (const f of [...files].slice(0, max - value.length)) next.push((await compressImage(f)).dataUrl);
      onChange(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Photo illisible.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{label} <span className="font-normal text-ardoise">(facultatif · {value.length}/{max})</span></span>
      {hint && <span className="text-xs text-ardoise">{hint}</span>}
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        {value.map((src, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${label} ${i + 1}`} className="h-full w-full object-cover" />
            <button type="button" aria-label={`Retirer la photo ${i + 1}`} onClick={() => onChange(value.filter((_, k) => k !== i))}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-charbon/70 text-white"><X size={15} /></button>
          </div>
        ))}
        {value.length < max && (
          <button type="button" disabled={busy} onClick={() => input.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-bordure bg-surface-inset text-xs font-bold text-ardoise hover:border-piment hover:text-piment">
            <ImagePlus size={22} />{busy ? 'Préparation…' : 'Ajouter'}</button>
        )}
      </div>
      {error && <span className="text-xs font-semibold text-erreur">{error}</span>}
    </div>
  );
}
