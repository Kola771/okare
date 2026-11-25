'use client';

/** Bloc de connexion / inscription partagé par l'écran 12 (mobile) et D4 (desktop). */
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/providers/ToastProvider';
import { useSession } from '@/components/providers/SessionProvider';
import { ForgotForm } from './ForgotForm';
import { GoogleButton, OrSeparator } from './GoogleButton';
import { PhoneAuthForm } from './PhoneAuthForm';

export type LoginMode = 'login' | 'register' | 'forgot';

export function LoginPanel({ mode, setMode, variant, next }: {
  mode: LoginMode; setMode: (m: LoginMode) => void; variant: 'mobile' | 'desktop'; next: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useSession();
  const done = async () => {
    await refresh();
    router.push(next);
  };

  const title = mode === 'register' ? 'Crée ton compte' : mode === 'forgot' ? 'Mot de passe oublié' : 'Content de te revoir';
  const sub = mode === 'register'
    ? 'En 10 secondes : contacte les vendeurs et garde tes favoris.'
    : variant === 'mobile' ? 'Connecte-toi pour contacter les vendeurs et retrouver tes favoris.' : 'Connecte-toi pour retrouver tes favoris.';
  const H = variant === 'mobile' ? 'h1' : 'h2';

  return (
    <>
      {variant === 'desktop' && mode !== 'forgot' && (
        <div role="tablist" className="flex rounded-[14px] bg-argile p-1">
          {(['login', 'register'] as const).map((m) => (
            <button key={m} role="tab" type="button" aria-selected={mode === m} onClick={() => setMode(m)}
              className={`min-h-[42px] flex-1 rounded-[11px] text-sm ${mode === m ? 'bg-surface font-bold shadow-[0_1px_3px_rgba(28,25,23,0.12)]' : 'font-semibold text-ardoise'}`}>
              {m === 'login' ? 'Se connecter' : 'Créer un compte'}
            </button>
          ))}
        </div>
      )}
      <div>
        <H className={`m-0 font-display font-extrabold leading-tight ${variant === 'mobile' ? 'text-[28px]' : 'text-[28px]'}`}>{title}</H>
        {mode !== 'forgot' && <div className={`mt-1 text-ardoise ${variant === 'mobile' ? 'text-[15px]' : 'text-sm'}`}>{sub}</div>}
      </div>
      {mode === 'forgot' ? (
        <ForgotForm onBack={() => setMode('login')} />
      ) : (
        <>
          <GoogleButton onDone={done} onError={(m) => toast(m, 'error')} />
          <OrSeparator text={variant === 'desktop' ? 'ou avec ton numéro' : 'ou'} />
          <PhoneAuthForm key={mode} mode={mode} onDone={done} showForgot={mode === 'login'}
            submitLabel={mode === 'login' ? 'Me connecter' : 'Créer mon compte'} />
          {variant === 'mobile' && (
            <div className="text-center text-sm text-encre">
              {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
              <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-bold text-piment">
                {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
              </button>
            </div>
          )}
          {variant === 'desktop' && (
            <div className="text-center text-xs leading-normal text-ardoise">
              En continuant, tu acceptes les <a href="/account#aide">conditions d’utilisation</a> et la <a href="/account#aide">politique de confidentialité</a>.
            </div>
          )}
        </>
      )}
    </>
  );
}
