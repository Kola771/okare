'use client';

/**
 * Nouveau point de vente en 4 étapes — écran 17 / VD7 (vendeur) et écran 6 / DB3 (agent, admin).
 * Publié tout de suite ; brouillon gardé sur l'appareil (connexion faible).
 */
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { checkDuplicates, createPos, errorMessage, isApiError } from '@/lib/api';
import { btn, PageHead, Panel } from '@/components/admin/AdminParts';
import { Crumbs } from '@/components/admin/Card';
import { useToast } from '@/components/providers/ToastProvider';
import { normalizePhone } from '@/shared/format';
import { CreateRecap } from './CreateRecap';
import { CreateStepper } from './CreateStepper';
import { StepConfirm, StepHours, StepWhere, StepWho, type Draft } from './CreateSteps';

const KEY = 'okare.draft.pos';
const STEPS = ['Qui vend ?', 'Où te trouver ?', 'Horaires et services', 'Autres photos de l’endroit'];
const EMPTY: Draft = {
  contactName: '', contactPhone: '', name: '', type: 'MAQUIS', lat: 6.3585, lng: 2.43, landmark: '', hasPublicPlace: true,
  whatsappPhone: '', openingHours: { '1': [['07:00', '15:00']], '2': [['07:00', '15:00']], '3': [['07:00', '15:00']], '4': [['07:00', '15:00']], '5': [['07:00', '15:00']] },
  servesOnSite: true, servesTakeaway: true, delivers: false, acceptsMomo: false, consent: false,
};

export function CreatePosWizard({ afterCreate, particulierLocked = false, title = 'Nouveau point de vente', back = ['Mes points de vente', '/seller/points'], byTeam = false }: {
  afterCreate: (id: string) => string; particulierLocked?: boolean; title?: string; back?: [string, string];
  /** Création par l'équipe (dashboard) : photos publiées sans relecture. */
  byTeam?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [dupes, setDupes] = useState<string[]>([]);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setD({ ...EMPTY, ...JSON.parse(raw), consent: false }); } catch { /* brouillon illisible */ }
  }, []);
  // Brouillon sans les photos (trop lourdes pour le stockage du navigateur).
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify({ ...d, facadePhoto: null, otherPhotos: [] })); } catch { /* stockage plein */ } }, [d]);
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));

  async function next() {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (d.name.trim().length < 2) e.name = '2 caractères au moins.';
      if (!normalizePhone(d.contactPhone)) e.contactPhone = 'Numéro invalide : 10 chiffres commençant par 01.';
      if (!normalizePhone(d.whatsappPhone)) e.whatsappPhone = 'Numéro invalide : 10 chiffres commençant par 01.';
    }
    if (step === 3 && !d.consent) e.consent = 'Obligatoire pour publier.';
    setErrors(e);
    if (Object.keys(e).length) return;
    if (step === 1) setDupes(await checkDuplicates({ name: d.name, lat: d.lat, lng: d.lng, whatsappPhone: normalizePhone(d.whatsappPhone) ?? '' }).catch(() => []));
    if (step < 3) return setStep(step + 1);
    setBusy(true);
    try {
      const { id } = await createPos({ ...d, byTeam, contactPhone: normalizePhone(d.contactPhone)!, whatsappPhone: normalizePhone(d.whatsappPhone)! });
      localStorage.removeItem(KEY);
      toast('Point de vente publié !', 'success');
      router.push(afterCreate(id));
    } catch (err) {
      if (isApiError(err) && err.details) setErrors(err.details as Record<string, string>);
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  const props = { d, set, errors, particulierLocked };
  const label = step === 0 ? 'Continuer : emplacement' : step === 1 ? 'Continuer : horaires' : step === 2 ? 'Continuer : autres photos' : busy ? 'Publication…' : 'Publier mon point de vente';
  const actions = (
    <div className="flex flex-col gap-2">
      <button type="button" disabled={busy} className={btn.primary} onClick={next}>{label}</button>
      {step > 0 && <button type="button" className={btn.secondary} onClick={() => setStep(step - 1)}>Retour</button>}
    </div>
  );
  return (
    <>
      <div className="flex flex-col gap-2">
        <Crumbs items={[back, 'Nouveau']} />
        <PageHead title={title} sub="Il est publié dès que tu l’envoies. Tu pourras tout modifier ensuite." />
      </div>
      <CreateStepper steps={STEPS} step={step} onStep={setStep} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title={STEPS[step]}>
          {step === 0 && <StepWho {...props} />}
          {step === 1 && <StepWhere {...props} />}
          {step === 2 && <StepHours {...props} />}
          {step === 3 && <StepConfirm {...props} />}
          {dupes.length > 0 && step === 2 && (
            <div role="alert" className="rounded-xl bg-attention-soft px-3 py-2.5 text-sm text-attention">Ce point existe peut-être déjà : {dupes.join(', ')}. Tu peux continuer si ce n’est pas le même.</div>
          )}
          <div className="lg:hidden">{actions}</div>
        </Panel>
        <div className="hidden lg:block"><CreateRecap d={d} actions={actions} /></div>
      </div>
    </>
  );
}
