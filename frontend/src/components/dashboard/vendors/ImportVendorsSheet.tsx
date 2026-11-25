'use client';

import { Check, Loader2, Upload } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { read, utils } from 'xlsx';
import { btn } from '@/components/admin/AdminParts';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/providers/ToastProvider';

type RowStatus = 'idle' | 'loading' | 'done';

interface VendorRow {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  consent: string;
  addedBy: string;
  checked: boolean;
  status: RowStatus;
}

const HEADER_MAP: Record<string, keyof Omit<VendorRow, 'checked'>> = {
  firstname: 'firstName',
  lastname: 'lastName',
  phone: 'phone',
  email: 'email',
  consent: 'consent',
  addedby: 'addedBy',
};

function parseFile(buffer: ArrayBuffer): VendorRow[] {
  const wb = read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames.find((n) => /vendeur/i.test(n)) ?? wb.SheetNames[1] ?? wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  const raw = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  return raw
    .map((r) => {
      const mapped: Record<string, string> = {};
      for (const [key, val] of Object.entries(r)) {
        const norm = key.toLowerCase().replace(/[^a-z]/g, '');
        const field = HEADER_MAP[norm];
        if (field) mapped[field] = String(val ?? '').trim();
      }
      if (!mapped.firstName && !mapped.lastName) return null;
      return {
        firstName: mapped.firstName ?? '',
        lastName: mapped.lastName ?? '',
        phone: mapped.phone ?? '',
        email: mapped.email ?? '',
        consent: mapped.consent ?? '',
        addedBy: mapped.addedBy ?? '',
        checked: /^oui$/i.test(mapped.consent ?? ''),
        status: 'idle' as RowStatus,
      };
    })
    .filter((r): r is VendorRow => r !== null);
}

export function ImportVendorsButton() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<VendorRow[]>([]);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (e.target) e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseFile(ev.target?.result as ArrayBuffer);
        if (!parsed.length) { toast('Aucune ligne trouvée dans le fichier.', 'error'); return; }
        setRows(parsed);
        setOpen(true);
      } catch {
        toast('Impossible de lire ce fichier. Vérifie le format (.xlsx).', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const toggle = (i: number) => { if (!importing) setRows((prev) => prev.map((r, j) => (j === i ? { ...r, checked: !r.checked } : r))); };
  const toggleAll = () => {
    if (importing) return;
    const allChecked = rows.every((r) => r.checked);
    setRows((prev) => prev.map((r) => ({ ...r, checked: !allChecked })));
  };

  const close = () => { if (importing) return; setOpen(false); setRows([]); };
  const checkedCount = rows.filter((r) => r.checked).length;
  const doneCount = rows.filter((r) => r.status === 'done').length;

  const startImport = useCallback(async () => {
    setImporting(true);
    const checkedIndexes = rows.map((r, i) => r.checked ? i : -1).filter((i) => i >= 0);
    for (const idx of checkedIndexes) {
      setRows((prev) => prev.map((r, j) => (j === idx ? { ...r, status: 'loading' } : r)));
      await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 300));
      setRows((prev) => prev.map((r, j) => (j === idx ? { ...r, status: 'done' } : r)));
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    const count = checkedIndexes.length;
    toast(`${count} vendeur${count > 1 ? 's' : ''} importé${count > 1 ? 's' : ''} avec succès.`);
    setImporting(false);
    setOpen(false);
    setRows([]);
  }, [rows, toast]);

  return (
    <>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFile} />
      <button type="button" className={btn.primary} onClick={() => fileRef.current?.click()}>
        <Upload size={16} /> Importer des vendeurs
      </button>

      <Sheet open={open} onClose={close} labelledBy="import-vendors-title" maxWidth="lg:max-w-[820px]">
        <h2 id="import-vendors-title" className="text-[22px] font-bold">Importer des vendeurs</h2>
        <p className="text-sm text-ardoise">{rows.length} vendeur{rows.length > 1 ? 's' : ''} trouvé{rows.length > 1 ? 's' : ''} dans le fichier. Coche les lignes à importer.</p>

        <div className="-mx-2 overflow-x-auto">
          <table className="min-w-[700px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-trait text-xs font-semibold uppercase tracking-wide text-pierre">
                <th className="whitespace-nowrap px-2 py-2.5 w-10">
                  <input type="checkbox" checked={rows.length > 0 && rows.every((r) => r.checked)} onChange={toggleAll}
                    disabled={importing} className="h-4 w-4 cursor-pointer accent-piment disabled:opacity-50" />
                </th>
                <th className="whitespace-nowrap px-2 py-2.5">Prénom</th>
                <th className="whitespace-nowrap px-2 py-2.5">Nom</th>
                <th className="whitespace-nowrap px-2 py-2.5">Téléphone</th>
                <th className="whitespace-nowrap px-2 py-2.5">E-mail</th>
                <th className="whitespace-nowrap px-2 py-2.5">Accord</th>
                <th className="whitespace-nowrap px-2 py-2.5">Ajouté par</th>
                {importing && <th className="whitespace-nowrap px-2 py-2.5 w-10" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={`border-b border-trait transition-colors ${r.status === 'done' ? 'bg-ok-soft' : r.checked ? 'bg-piment-soft' : ''}`}>
                  <td className="px-2 py-2.5">
                    <input type="checkbox" checked={r.checked} onChange={() => toggle(i)}
                      disabled={importing} className="h-4 w-4 cursor-pointer accent-piment disabled:opacity-50" />
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 font-medium">{r.firstName}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 font-medium">{r.lastName}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-ardoise">{r.phone}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-ardoise">{r.email || '—'}</td>
                  <td className="whitespace-nowrap px-2 py-2.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${/^oui$/i.test(r.consent) ? 'bg-ok-soft text-ok' : /^non$/i.test(r.consent) ? 'bg-erreur-soft text-erreur' : 'bg-argile text-encre'}`}>
                      {r.consent || '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-ardoise">{r.addedBy || '—'}</td>
                  {importing && (
                    <td className="px-2 py-2.5 text-center">
                      {r.status === 'loading' && <Loader2 size={16} className="animate-spin text-piment" />}
                      {r.status === 'done' && <Check size={16} className="text-ok" />}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <span className="mr-auto text-sm text-ardoise">
            {importing ? `${doneCount} / ${checkedCount} importé${doneCount > 1 ? 's' : ''}` : `${checkedCount} sélectionné${checkedCount > 1 ? 's' : ''}`}
          </span>
          <button type="button" className={btn.secondary} onClick={close} disabled={importing}>Annuler</button>
          <button type="button" className={btn.primary} disabled={!checkedCount || importing} onClick={startImport}>
            {importing ? <><Loader2 size={16} className="animate-spin" /> Import en cours...</> : <>Importer {checkedCount > 0 && `(${checkedCount})`}</>}
          </button>
        </div>
      </Sheet>
    </>
  );
}
