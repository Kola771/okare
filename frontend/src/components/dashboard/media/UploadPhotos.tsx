'use client';

/** « Envoyer des photos » (DB11) : choisir le point de vente et le type, puis une ou plusieurs photos (compressées ici). */
import { useRef, useState } from 'react';
import { addPosPhoto, errorMessage, type AdminPosRow } from '@/lib/api';
import { compressImage } from '@/lib/image/compress';
import { btn } from '@/components/admin/AdminParts';
import { Field, inputCls } from '@/components/admin/Controls';
import { useToast } from '@/components/providers/ToastProvider';
import { Sheet } from '@/components/ui/Sheet';

export function UploadPhotos({ points, onDone }: { points: AdminPosRow[]; onDone: () => void }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [posId, setPosId] = useState('');
  const [kind, setKind] = useState<'FACADE' | 'OTHER'>('OTHER');
  const [busy, setBusy] = useState<string | null>(null);

  async function send(files: FileList | null) {
    if (!files?.length) return;
    try {
      for (const [i, f] of [...files].entries()) {
        setBusy(`Envoi ${i + 1} sur ${files.length}…`);
        const photo = await compressImage(f);
        await addPosPhoto(posId, kind, photo.dataUrl, photo.name, true);
      }
      toast(`${files.length} photo${files.length > 1 ? 's' : ''} ajoutée${files.length > 1 ? 's' : ''}`, 'success');
      setOpen(false);
      onDone();
    } catch (e) {
      toast(e instanceof Error && !('code' in e) ? e.message : errorMessage(e), 'error');
    } finally {
      setBusy(null);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <>
      <button type="button" className={btn.primary} onClick={() => setOpen(true)}>Envoyer des photos</button>
      <Sheet open={open} onClose={() => setOpen(false)} labelledBy="upload-title">
        <h2 id="upload-title" className="m-0 font-bold">Envoyer des photos</h2>
        <p className="m-0 text-sm text-ardoise">Compressées sur ton appareil (1 600 px), métadonnées retirées. Envoyées par l’équipe : publiées tout de suite.</p>
        <Field label="Point de vente">
          <select className={inputCls} value={posId} onChange={(e) => setPosId(e.target.value)}>
            <option value="">Choisir…</option>{points.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.zoneName}</option>)}
          </select>
        </Field>
        <div className="flex gap-2">{(['FACADE', 'OTHER'] as const).map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}
            className={`min-h-11 flex-1 rounded-xl text-sm font-bold ${kind === k ? 'bg-inverse text-on-inverse' : 'border border-trait bg-surface'}`}>{k === 'FACADE' ? "Photo de l’entrée" : 'Autres photos'}</button>))}
        </div>
        <input ref={input} type="file" accept="image/*" multiple={kind === 'OTHER'} className="hidden" onChange={(e) => send(e.target.files)} />
        <button type="button" className={btn.primary} disabled={!posId || !!busy} onClick={() => input.current?.click()}>
          {busy ?? (kind === 'FACADE' ? 'Choisir la photo' : 'Choisir les photos')}</button>
      </Sheet>
    </>
  );
}
