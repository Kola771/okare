'use client';

/** Informations du point (nom, type, numéros, repère, services) — publiées tout de suite, contrôle de version (5.3). */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { errorMessage, isApiError, updatePosInfo, type PosInfo } from '@/lib/api';
import { btn, Panel } from '@/components/admin/AdminParts';
import { useToast } from '@/components/providers/ToastProvider';
import { PhoneField, TextField } from '@/components/ui/Fields';
import { POS_TYPE_LABEL, POS_TYPES, type PosType } from '@/shared/enums';
import { displayPhone } from '@/shared/format';

const local = (e164: string | null) => (e164 ? displayPhone(e164).replace('+229 ', '') : '');
type Flag = 'servesOnSite' | 'servesTakeaway' | 'delivers' | 'acceptsCash' | 'acceptsMomo' | 'hasPublicPlace';

export function InfoForm({ posId, initial, canBeParticulier }: { posId: string; initial: PosInfo; canBeParticulier: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState({ ...initial, whatsappPhone: local(initial.whatsappPhone), callPhone: local(initial.callPhone) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof v>) => setV((x) => ({ ...x, ...patch }));
  const flag = (k: Flag, label: string) => (
    <label className="flex min-h-12 items-center justify-between gap-3 border-t border-trait text-[15px] first:border-0">{label}
      <input type="checkbox" checked={v[k]} onChange={(e) => set({ [k]: e.target.checked })} className="h-[22px] w-[22px] accent-feuille" /></label>
  );

  async function save() {
    setBusy(true);
    setErrors({});
    try {
      const { version } = await updatePosInfo(posId, { ...v, callPhone: v.callPhone || null });
      set({ version });
      toast('Informations enregistrées', 'success');
      router.refresh();
    } catch (e) {
      if (isApiError(e) && e.details) setErrors(e.details as Record<string, string>);
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Identité" sub={`Zone ${initial.zoneName}${initial.neighborhood ? ` · quartier ${initial.neighborhood}` : ''} (calculée depuis la position)`}>
        <TextField label="Nom affiché" value={v.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} />
        <div className="flex flex-col gap-1.5"><span className="text-[13px] font-semibold text-encre">Type</span>
          <div className="grid grid-cols-3 gap-2">{POS_TYPES.map((t) => (
            <button key={t} type="button" aria-pressed={v.type === t} disabled={t === 'PARTICULIER' && !canBeParticulier} onClick={() => set({ type: t as PosType })}
              className={`min-h-12 rounded-xl border text-sm font-bold disabled:opacity-40 ${v.type === t ? 'border-piment bg-piment-soft text-piment' : 'border-bordure-douce bg-white'}`}>{POS_TYPE_LABEL[t]}</button>))}</div>
        </div>
        <TextField label="Repère" value={v.landmark ?? ''} onChange={(e) => set({ landmark: e.target.value })} placeholder="ex. face à la station" />
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-encre">Présentation
          <textarea value={v.description ?? ''} onChange={(e) => set({ description: e.target.value.slice(0, 300) })} rows={3} className="rounded-[14px] border border-bordure-douce p-3 text-base font-normal" /></label>
        <p className="m-0 text-xs text-ardoise">Photos de la façade et des plats : l’envoi sera branché avec l’API (une image par défaut est utilisée).</p>
      </Panel>
      <Panel title="Numéros et services">
        <PhoneField label="WhatsApp des commandes" value={v.whatsappPhone} onChange={(e) => set({ whatsappPhone: e.target.value })} error={errors.whatsappPhone} />
        <PhoneField label="Numéro d’appel (si différent)" value={v.callPhone} onChange={(e) => set({ callPhone: e.target.value })} error={errors.callPhone} />
        <div className="flex flex-col">
          {flag('servesOnSite', 'Sur place')}{flag('servesTakeaway', 'À emporter')}{flag('delivers', 'Livraison')}
          {flag('acceptsCash', 'Accepte les espèces')}{flag('acceptsMomo', 'Accepte Mobile Money')}{v.type === 'PARTICULIER' && flag('hasPublicPlace', 'Lieu public (sinon adresse masquée)')}
        </div>
        <button type="button" disabled={busy} onClick={save} className={`${btn.primary} self-end`}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
      </Panel>
    </div>
  );
}
