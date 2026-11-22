'use client';

/**
 * Onglet « Informations » de DB3 : Identité, Emplacement, Services et paiements (formulaire enregistré par le bouton
 * « Enregistrer » de l'en-tête) ; colonne de droite Aujourd'hui, QR code, Gestion (SheetSide).
 */
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { errorMessage, isApiError, updatePosInfo, type ManagedPos, type PosSheet } from '@/lib/api';
import { Pill } from '@/components/admin/AdminParts';
import { Card } from '@/components/admin/Card';
import { Field, inputCls } from '@/components/admin/Controls';
import { useToast } from '@/components/providers/ToastProvider';
import { Skeleton } from '@/components/ui/States';
import { POS_TYPE_LABEL, POS_TYPES, type PosType } from '@/shared/enums';
import { displayPhone } from '@/shared/format';
import { CoverPhotoCard } from '@/components/seller/manage/CoverPhotoCard';
import { SheetSide } from './SheetSide';

const MiniMap = dynamic(() => import('@/components/customer/pos/MiniMap'), { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-none" /> });

export const SHEET_FORM = 'pos-sheet-form';
export const shortDate = (d: string) => new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
const local = (e164: string | null) => (e164 ? displayPhone(e164).replace('+229 ', '') : '');
type Flag = 'servesOnSite' | 'servesTakeaway' | 'delivers' | 'acceptsCash' | 'acceptsMomo';
const SERVICES: [Flag, string][] = [['servesOnSite', 'Sur place'], ['servesTakeaway', 'À emporter'], ['delivers', 'Livraison'], ['acceptsCash', 'Espèces'], ['acceptsMomo', 'Mobile Money']];

export function SheetInfo({ pos, sheet, onChange }: { pos: ManagedPos; sheet: PosSheet; onChange: () => void }) {
  const toast = useToast();
  const [v, setV] = useState({ ...sheet.info, whatsappPhone: local(sheet.info.whatsappPhone), callPhone: local(sheet.info.callPhone) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (patch: Partial<typeof v>) => setV((x) => ({ ...x, ...patch }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      await updatePosInfo(pos.id, { ...v, callPhone: v.callPhone || null });
      toast('Fiche enregistrée', 'success');
      onChange();
    } catch (err) {
      if (isApiError(err) && err.details) setErrors(err.details as Record<string, string>);
      toast(errorMessage(err), 'error');
    }
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
      <form id={SHEET_FORM} onSubmit={submit} className="flex min-w-0 flex-col gap-5">
        <Card title="Identité">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom affiché" error={errors.name}><input className={inputCls} value={v.name} onChange={(e) => set({ name: e.target.value })} /></Field>
            <Field label="Type">
              <select className={inputCls} value={v.type} onChange={(e) => set({ type: e.target.value as PosType })}>
                {POS_TYPES.map((t) => <option key={t} value={t}>{POS_TYPE_LABEL[t]}</option>)}
              </select>
            </Field>
            <Field label="WhatsApp commandes" error={errors.whatsappPhone}>
              <span className="flex"><span className="flex items-center rounded-l-xl border border-r-0 border-[#E7E5E4] bg-[#FAFAF9] px-3 text-[15px] font-normal">+229</span>
                <input className={`${inputCls} rounded-l-none`} inputMode="tel" value={v.whatsappPhone} onChange={(e) => set({ whatsappPhone: e.target.value })} /></span>
            </Field>
            <Field label="Appels (si différent)" error={errors.callPhone}>
              <input className={inputCls} inputMode="tel" value={v.callPhone} placeholder="01 XX XX XX XX" onChange={(e) => set({ callPhone: e.target.value })} />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {sheet.whatsappVerifiedAt ? <Pill tone="ok">WhatsApp vérifié par message test</Pill> : <Pill tone="warn">WhatsApp à vérifier par message test</Pill>}
            <Pill tone="ok">Consentement enregistré · {shortDate(sheet.consentAt)}</Pill>
          </div>
        </Card>
        <Card title="Emplacement">
          <div className="relative z-0 h-[180px] overflow-hidden rounded-xl bg-[#EDE9E3]">
            <MiniMap lat={sheet.location.lat} lng={sheet.location.lng} approximate={!v.hasPublicPlace} />
            <span className="absolute bottom-2.5 right-2.5 z-[400] rounded-lg bg-white px-2.5 py-1 text-xs shadow">
              {sheet.accuracyM ? `précision ${sheet.accuracyM} m · ` : ''}zone {pos.zoneName} ({pos.zoneCategory})</span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[3fr_2fr]">
            <Field label="Repère"><input className={inputCls} value={v.landmark ?? ''} placeholder="Face à…" onChange={(e) => set({ landmark: e.target.value })} /></Field>
            <Field label="Quartier"><input className={`${inputCls} bg-[#FAFAF9]`} value={sheet.info.neighborhood ?? '—'} readOnly /></Field>
          </div>
          <label className="mt-4 flex items-center gap-3 text-[15px]">
            <input type="checkbox" className="h-5 w-5 accent-piment" checked={!v.hasPublicPlace} onChange={(e) => set({ hasPublicPlace: !e.target.checked })} />
            Pas de lieu public (particulier) : masquer l’adresse
          </label>
        </Card>
        <CoverPhotoCard posId={pos.id} byTeam />
        <Card title="Services et paiements">
          <div className="flex flex-wrap gap-2">{SERVICES.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={v[k]} onClick={() => set({ [k]: !v[k] })}
              className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${v[k] ? 'bg-ok-soft text-ok' : 'bg-argile text-ardoise line-through'}`}>{label}</button>))}
          </div>
          <p className="m-0 mt-2 text-xs text-ardoise">Touche un service pour l’activer ou le retirer, puis « Enregistrer ».</p>
        </Card>
      </form>
      <SheetSide pos={pos} sheet={sheet} onChange={onChange} />
    </div>
  );
}
