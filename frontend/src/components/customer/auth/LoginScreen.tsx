'use client';

/**
 * Connexion — écran 12 (mobile) et D4 (desktop : panneau piment à motifs à gauche, formulaire à droite).
 * `?signup=1` ouvre l'onglet « Créer un compte », `?forgot=1` le mot de passe oublié, `?next=` la page de retour.
 */
import { Store, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Price } from '@/components/ui/Badges';
import { DishImage } from '@/components/ui/DishImage';
import { Logo } from '@/components/ui/Logo';
import { LoginPanel, type LoginMode } from './LoginPanel';

const SAMPLE = [
  { name: 'Riz sauce arachide', where: 'Chez Maman · 350 m', price: 900, key: 'riz', tilt: '-rotate-3', offset: '' },
  { name: 'Pâte rouge + poulet', where: 'Maquis Le Bon Goût · 450 m', price: 1000, key: 'pate', tilt: 'rotate-2', offset: '-mt-1.5 ml-[120px]' },
  { name: 'Atassi + friture', where: 'Tantie Aïko · 800 m', price: 500, key: 'atassi', tilt: '-rotate-[1.5deg]', offset: '-mt-1 ml-10' },
];

function VendorLink() {
  return (
    <Link href="/seller" className="flex w-full max-w-[440px] items-center gap-3 rounded-2xl border border-trait bg-white px-4 py-3 text-charbon no-underline">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-feuille-soft text-feuille-ink"><Store size={20} /></span>
      <span className="flex-1"><b className="block text-sm">Tu vends à manger ?</b>
        <span className="text-[13px] text-ardoise">Inscris ton point de vente, c’est gratuit.</span></span>
    </Link>
  );
}

export function LoginScreen() {
  const params = useSearchParams();
  const initial: LoginMode = params.get('forgot') ? 'forgot' : params.get('signup') ? 'register' : 'login';
  const [mode, setMode] = useState<LoginMode>(initial);
  const next = params.get('next') ?? '/';
  useEffect(() => setMode(initial), [initial]);

  return (
    <>
      {/* Mobile : écran 12 */}
      <div className="bg-motif flex min-h-dvh flex-col gap-[18px] px-[22px] py-7 lg:hidden">
        <Link href="/" aria-label="Fermer" className="flex h-11 w-11 items-center justify-center rounded-full border border-trait bg-white text-charbon">
          <X size={20} />
        </Link>
        <div className="mt-3"><Logo size={40} href={null} /></div>
        <LoginPanel mode={mode} setMode={setMode} variant="mobile" next={next} />
        <div className="mt-auto rounded-[14px] border border-trait bg-white px-3.5 py-3 text-[13px] leading-normal text-encre">
          Tu tiens un maquis ou une cuisine ? <Link href="/seller" className="font-bold">Rejoindre OKARE en tant que vendeur</Link>
        </div>
      </div>

      {/* Desktop : D4 */}
      <div className="bg-motif hidden min-h-dvh lg:flex">
        <section className="bg-motif-piment flex flex-[1_1_560px] flex-col gap-7 px-14 py-10 text-white">
          <Logo size={34} light />
          <div className="mt-10 flex max-w-[520px] flex-col gap-4">
            <h1 className="m-0 font-display text-[56px] font-extrabold leading-[1.02]">Tu manges quoi ce midi&nbsp;?</h1>
            <p className="m-0 text-lg leading-relaxed text-[#FFEDD5]">
              Les plats du jour, les prix et les maquis ouverts près de toi à Cotonou. Tu commandes directement au vendeur sur WhatsApp.
            </p>
          </div>
          <div className="mt-2 pl-2.5">
            {SAMPLE.map((s) => (
              <div key={s.name} className={`flex w-[300px] items-center gap-3 rounded-card bg-white p-2.5 shadow-[0_18px_40px_rgba(60,20,5,0.28)] ${s.tilt} ${s.offset}`}>
                <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-xl"><DishImage illustrationKey={s.key} alt="" /></span>
                <div className="min-w-0 flex-1"><div className="text-[15px] font-bold text-charbon">{s.name}</div><div className="text-xs text-ardoise">{s.where}</div></div>
                <Price xof={s.price} className="text-base" />
              </div>
            ))}
          </div>
          <div className="mt-auto flex flex-wrap gap-7 text-sm text-[#FFEDD5]">
            <span><b className="block text-[22px] text-white">10</b>points de vente</span>
            <span><b className="block text-[22px] text-white">0 F</b>de commission</span>
            <span><b className="block text-[22px] text-white">10 s</b>pour créer ton compte</span>
          </div>
        </section>
        <section className="flex flex-[1_1_520px] flex-col items-center justify-center gap-[18px] px-14 py-10">
          <div className="flex w-full max-w-[440px] flex-col gap-4 rounded-3xl border border-trait bg-white p-[30px] shadow-[0_20px_50px_rgba(28,25,23,0.08)]">
            <LoginPanel mode={mode} setMode={setMode} variant="desktop" next={next} />
          </div>
          <VendorLink />
        </section>
      </div>
    </>
  );
}
