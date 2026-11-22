'use client';

/**
 * Écran 3 / D5 — « Une dernière étape avant de commander » : feuille modale ouverte par une action
 * qui demande un compte ; l'action reprend dès que le compte est créé ou connecté.
 */
import { useState } from 'react';
import { useSession } from '@/components/providers/SessionProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { DishImage } from '@/components/ui/DishImage';
import { Sheet } from '@/components/ui/Sheet';
import { GoogleButton, OrSeparator } from './GoogleButton';
import { PhoneAuthForm } from './PhoneAuthForm';

export function SignupSheet() {
  const { pendingIntent, closeAuth, completeAuth } = useSession();
  const toast = useToast();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const done = () => void completeAuth();

  return (
    <Sheet open={!!pendingIntent} onClose={closeAuth} labelledBy="signup-title">
      {pendingIntent?.title && (
        <div className="flex items-center gap-3 rounded-[14px] bg-sable p-2.5 lg:mr-11">
          <span className="block h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[10px]">
            <DishImage illustrationKey={pendingIntent.illustrationKey} alt="" />
          </span>
          <div className="min-w-0">
            <b className="block truncate text-sm">{pendingIntent.title}</b>
            {pendingIntent.subtitle && <div className="truncate text-xs text-ardoise">{pendingIntent.subtitle}</div>}
          </div>
        </div>
      )}
      <h2 id="signup-title" className="m-0 font-display text-[26px] font-extrabold leading-tight">
        {mode === 'register' ? 'Une dernière étape avant de commander' : 'Content de te revoir'}
      </h2>
      <p className="m-0 text-[15px] leading-normal text-ardoise">
        {mode === 'register'
          ? 'Crée ton compte en 10 secondes. Ensuite, WhatsApp s’ouvre avec ta commande déjà écrite.'
          : 'Connecte-toi : ta commande reprend juste après.'}
      </p>
      <GoogleButton onDone={done} onError={(m) => toast(m, 'error')} />
      <OrSeparator text={mode === 'register' ? 'ou avec ton numéro' : 'ou'} />
      <PhoneAuthForm
        key={mode}
        mode={mode}
        submitLabel={mode === 'register' ? 'Créer mon compte et commander' : 'Me connecter et commander'}
        submitTone={mode === 'register' ? 'piment' : 'feuille'}
        onDone={done}
      />
      <div className="text-center text-[13px] text-ardoise">
        {mode === 'register' ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
        <button type="button" onClick={() => setMode(mode === 'register' ? 'login' : 'register')} className="font-bold text-piment">
          {mode === 'register' ? 'Se connecter' : 'Créer un compte'}
        </button>
      </div>
      <p className="m-0 text-center text-xs leading-normal text-ardoise">
        Ton nom complet te sera demandé plus tard. En continuant, tu acceptes les <a href="/account#aide">conditions d’utilisation</a>.
      </p>
    </Sheet>
  );
}
