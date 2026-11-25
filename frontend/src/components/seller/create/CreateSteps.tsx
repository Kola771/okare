'use client';

/** Étapes du formulaire de création (identique pour le vendeur, l'agent et l'admin — 12.1). */
import { LocateFixed, UtensilsCrossed } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { NewPosInput } from '@/lib/api';
import { PhoneField, TextField } from '@/components/ui/Fields';
import { PhotoField } from '@/components/ui/PhotoField';
import { PhotoList } from '@/components/ui/PhotoList';
import { Skeleton } from '@/components/ui/States';
import { POS_TYPE_LABEL, POS_TYPES, type PosType } from '@/shared/enums';
import type { OpeningHours } from '@/shared/types';
import { WeekHoursField } from '../hours/WeekHoursField';

const PinPicker = dynamic(() => import('./PinPicker'), { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-none" /> });

export type Draft = Omit<NewPosInput, 'openingHours'> & { openingHours: OpeningHours };
type StepProps = { d: Draft; set: (patch: Partial<Draft>) => void; errors: Record<string, string>; particulierLocked?: boolean };

const TYPE_SUB: Record<PosType, string> = { PARTICULIER: 'je vends en ligne', MAQUIS: 'ou étal', RESTAURANT: '' };

export function StepWho({ d, set, errors }: StepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField label="Nom affiché du point de vente" value={d.name} onChange={(e) => set({ name: e.target.value })} error={errors.name} placeholder="Ex. Chez Maman · Ganhi" />
      <TextField label="Nom du responsable" value={d.contactName} onChange={(e) => set({ contactName: e.target.value })} />
      <PhoneField label="Téléphone du responsable" value={d.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} error={errors.contactPhone} />
      <PhoneField label="WhatsApp des commandes" value={d.whatsappPhone} onChange={(e) => set({ whatsappPhone: e.target.value })} error={errors.whatsappPhone}
        hint="Les clients t’écrivent sur ce numéro, avec le plat déjà cité." />
    </div>
  );
}

export function StepWhere({ d, set, particulierLocked }: StepProps) {
  const [locating, setLocating] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2"><span className="text-[13px] font-semibold text-encre">Type</span>
        <div className="grid grid-cols-3 gap-2">{POS_TYPES.map((t) => {
          const disabled = t === 'PARTICULIER' && particulierLocked;
          return (
            <button key={t} type="button" disabled={disabled} aria-pressed={d.type === t} onClick={() => set({ type: t, hasPublicPlace: t !== 'PARTICULIER' })}
              className={`flex min-h-14 flex-col items-center justify-center rounded-xl border px-2 text-sm font-bold disabled:opacity-40 ${d.type === t ? 'border-piment bg-piment-soft text-piment' : 'border-bordure-douce bg-surface'}`}>
              {POS_TYPE_LABEL[t]}{TYPE_SUB[t] && <span className="text-xs font-normal text-ardoise">{TYPE_SUB[t]}</span>}
            </button>);
        })}</div>
        {particulierLocked && <span className="text-xs text-ardoise">Particulier impossible : un vendeur Particulier n’a qu’un seul point de vente.</span>}
      </div>
      <div className="text-[13px] font-semibold text-encre">Déplace l’épingle sur ton entrée</div>
      <div className="relative z-0 h-[220px] overflow-hidden rounded-2xl border border-trait"><PinPicker lat={d.lat} lng={d.lng} onPick={(lat, lng) => set({ lat, lng })} /></div>
      <button type="button" disabled={locating} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-bordure-douce bg-surface text-sm font-semibold"
        onClick={() => { setLocating(true); navigator.geolocation?.getCurrentPosition((p) => { set({ lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: Math.round(p.coords.accuracy) }); setLocating(false); }, () => setLocating(false), { enableHighAccuracy: true }); }}>
        <LocateFixed size={16} /> {locating ? 'Recherche…' : 'Utiliser ma position actuelle'}
      </button>
      {d.accuracyM && d.accuracyM > 50 && <span className="text-xs font-semibold text-attention">Précision {d.accuracyM} m : rapproche-toi de l’entrée si possible.</span>}
      <TextField label="Repère (pour que les clients te trouvent)" value={d.landmark} onChange={(e) => set({ landmark: e.target.value })} placeholder="ex. face à la station, derrière la pharmacie…" />
      <label className="flex items-start gap-2.5 text-sm"><input type="checkbox" checked={!d.hasPublicPlace} onChange={(e) => set({ hasPublicPlace: !e.target.checked })} className="mt-0.5 h-5 w-5 accent-piment" />
        Je vends depuis chez moi : ne pas afficher mon adresse (quartier seulement)</label>
      <PhotoField label="Photo de l’entrée" hint="Le client reconnaît ton point en arrivant. Prends-la depuis la rue, de jour."
        value={d.facadePhoto ?? null} onChange={(facadePhoto) => set({ facadePhoto })} />
    </div>
  );
}

export function StepHours({ d, set }: StepProps) {
  const chip = (k: 'servesOnSite' | 'servesTakeaway' | 'delivers' | 'acceptsMomo', label: string) => (
    <label className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 text-[15px] font-semibold ${d[k] ? 'border-feuille bg-ok-soft text-ok' : 'border-trait bg-surface text-charbon'}`}>
      <input type="checkbox" checked={d[k]} onChange={(e) => set({ [k]: e.target.checked })} className="h-5 w-5 shrink-0 accent-feuille" />{label}
    </label>
  );
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h3 className="m-0 text-[15px] font-bold">Horaires de la semaine</h3>
        <WeekHoursField value={d.openingHours} onChange={(openingHours) => set({ openingHours })} />
        <p className="m-0 text-xs leading-snug text-ardoise">Les jours fériés et fermetures exceptionnelles se règlent ensuite dans « Horaires et fermetures ».</p>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="m-0 text-[15px] font-bold">Services</h3>
        <div className="flex flex-wrap gap-2.5">
          {chip('servesOnSite', 'Sur place')}{chip('servesTakeaway', 'À emporter')}{chip('delivers', 'Livraison')}{chip('acceptsMomo', 'Accepte Mobile Money')}
        </div>
      </div>
    </div>
  );
}

export function StepConfirm({ d, set, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <PhotoList label="Autres photos de l’endroit" hint="Ce que le client verra en arrivant : la salle, les tables, le comptoir, la devanture sous un autre angle…"
        value={d.otherPhotos ?? []} onChange={(otherPhotos) => set({ otherPhotos })} />
      <div className="flex gap-3 rounded-2xl bg-piment-soft p-4 text-sm leading-snug text-piment-ink">
        <UtensilsCrossed size={20} className="mt-0.5 shrink-0 text-piment" />
        <span><b>Et tes plats ?</b> Ils ne s’ajoutent pas ici. Tu ajoutes tes plats (avec leur photo) et ton plat du jour juste après la publication, depuis « Menu et plats du jour ».</span>
      </div>
      <label className={`flex items-start gap-2.5 rounded-xl border p-3 text-sm ${errors.consent ? 'border-erreur' : 'border-trait'}`}>
        <input type="checkbox" checked={d.consent} onChange={(e) => set({ consent: e.target.checked })} className="mt-0.5 h-5 w-5 accent-piment" />
        J’accepte que mon point de vente soit publié sur OKARE et j’accepte les conditions d’utilisation.</label>
      {errors.consent && <span className="text-[13px] font-semibold text-erreur">{errors.consent}</span>}
    </div>
  );
}
