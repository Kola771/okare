'use client';

/**
 * « Je suis vendeur sur OKARE » (section 14) : relier à son compte la fiche créée par un agent,
 * avec le code de l'agent (immédiat) ou par une demande acceptée par un admin. Sinon : créer son point.
 */
import Link from 'next/link';
import { useState } from 'react';
import { claimWithCode, errorMessage, getMyClaims, isApiError, requestClaim } from '@/lib/api';
import { useApi } from '@/components/admin/useApi';
import { useToast } from '@/components/providers/ToastProvider';
import { PhoneField } from '@/components/ui/Fields';

const box = 'flex flex-col gap-3.5 rounded-[20px] border border-trait bg-white p-5 lg:p-6';
const primary = 'flex min-h-12 items-center justify-center rounded-btn bg-piment px-5 text-[15px] font-bold text-white no-underline hover:text-white disabled:opacity-60';
const STATUS = { PENDING: ['En attente d’un admin', 'bg-attention-soft text-attention'], APPROVED: ['Acceptée', 'bg-ok-soft text-ok'],
  REJECTED: ['Refusée', 'bg-erreur-soft text-erreur'], EXPIRED: ['Expirée', 'bg-argile text-encre'] } as const;

export function ClaimScreen() {
  const toast = useToast();
  const mine = useApi(getMyClaims, []);
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [linked, setLinked] = useState<string | null>(null);

  const run = async (p: Promise<{ vendorName: string }>, ok: (name: string) => void) => {
    setErrors({});
    try { ok((await p).vendorName); void mine.reload(); } catch (e) {
      if (isApiError(e) && e.details) setErrors(e.details as Record<string, string>);
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 px-5 py-6 lg:py-10">
      <div>
        <h1 className="m-0 font-display text-[28px] font-extrabold leading-tight lg:text-[32px]">Je suis vendeur sur OKARE</h1>
        <p className="m-0 mt-1.5 text-[15px] text-ardoise">Un agent OKARE a peut-être déjà créé ta fiche. Relie-la à ton compte pour gérer toi-même ton menu, tes horaires, et voir tes contacts.</p>
      </div>

      {linked ? (
        <section className={`${box} border-ok bg-ok-soft`}>
          <b className="text-lg text-ok">C’est fait : {linked} est relié à ton compte.</b>
          <Link href="/seller" className={primary}>Ouvrir mon espace vendeur</Link>
        </section>
      ) : (
        <>
          <section className={box}>
            <div><h2 className="m-0 text-lg font-extrabold">J’ai un code</h2>
              <p className="m-0 mt-0.5 text-[13px] text-ardoise">6 chiffres envoyés par ton agent sur WhatsApp, valables 72 h.</p></div>
            <input aria-label="Code à 6 chiffres" inputMode="numeric" maxLength={7} placeholder="000000" value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              className={`min-h-[60px] rounded-[14px] border bg-white text-center font-mono text-[30px] font-extrabold tracking-[12px] ${errors.code ? 'border-erreur' : 'border-bordure-douce'}`} />
            {errors.code && <span className="text-[13px] font-semibold text-erreur">{errors.code}</span>}
            <button type="button" className={primary} disabled={code.length !== 6} onClick={() => run(claimWithCode(code), (n) => setLinked(n))}>Relier ma fiche</button>
          </section>

          <section className={box}>
            <div><h2 className="m-0 text-lg font-extrabold">Je n’ai pas de code</h2>
              <p className="m-0 mt-0.5 text-[13px] text-ardoise">Donne le numéro de ta fiche (celui où les clients t’écrivent). Un admin vérifie que c’est bien toi, en général dans la journée.</p></div>
            <PhoneField label="Numéro de ma fiche" placeholder="01 XX XX XX XX" value={phone} error={errors.phone} onChange={(e) => setPhone(e.target.value)} />
            <button type="button" className={primary} disabled={phone.replace(/\D/g, '').length < 10}
              onClick={() => run(requestClaim(phone), (n) => { toast(`Demande envoyée pour ${n}`, 'success'); setPhone(''); })}>Envoyer ma demande</button>
          </section>

          {!!mine.data?.length && (
            <section className={box}>
              <h2 className="m-0 text-lg font-extrabold">Mes demandes</h2>
              {mine.data.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 border-t border-trait pt-3 first-of-type:border-0 first-of-type:pt-0">
                  <span><b className="block">{c.vendorName}</b><span className="text-xs text-ardoise">{c.byCode ? 'avec un code' : 'demande'} · {new Date(c.createdAt).toLocaleDateString('fr-FR')}</span></span>
                  <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${STATUS[c.status][1]}`}>{STATUS[c.status][0]}</span>
                </div>))}
            </section>
          )}

          <p className="m-0 text-center text-sm text-ardoise">
            Pas encore de fiche ? <Link href="/seller/points/new" className="font-bold">Crée ton point de vente</Link> : il est publié tout de suite, gratuitement.
          </p>
        </>
      )}
    </div>
  );
}
