'use client';

/**
 * Invitation à installer l'application (section 20), affichée dès le chargement des pages, sur mobile comme sur desktop.
 * Toujours un bouton « Installer » + le geste à faire en texte :
 * - Chrome / Edge / Android : le bouton ouvre la fenêtre d'installation native (`beforeinstallprompt`).
 * - iOS Safari : aucune API d'installation ; le bouton ouvre la feuille de partage, où se trouve « Sur l'écran d'accueil ».
 * - Android sans événement (navigateur pas encore prêt, Samsung Internet…) : le bouton met en avant le geste à faire.
 * - Safari macOS : texte seul (Fichier → Ajouter au Dock).
 * Fermer l'invitation la masque pour la session de navigation en cours seulement : elle revient à la visite
 * suivante, et à chaque connexion. Rien n'est affiché si l'appli est déjà installée.
 */
import { EllipsisVertical, Share, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogoPin } from '@/components/ui/Logo';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
type Platform = 'ios' | 'android' | 'macos-safari' | 'desktop';
type InstallWindow = Window & { __okareInstallEvent?: Event };

const DISMISSED_KEY = 'okare:install-dismissed';
/** La page de connexion reste dégagée ; l'invitation arrive juste après la connexion. */
const HIDDEN_PREFIXES = ['/login'];

function isDismissed() {
  try { return window.sessionStorage.getItem(DISMISSED_KEY) === '1'; } catch { return false; }
}
function setDismissed(value: boolean) {
  try {
    if (value) window.sessionStorage.setItem(DISMISSED_KEY, '1');
    else window.sessionStorage.removeItem(DISMISSED_KEY);
  } catch { /* stockage bloqué : on ignore */ }
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  const safari = /Safari/.test(ua) && !/Chrome|Chromium|Edg\/|OPR\/|Firefox/.test(ua);
  if (safari && ua.includes('Macintosh')) return 'macos-safari';
  return 'desktop';
}

export function InstallPrompt() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    setPlatform(detectPlatform());
    setOpen(!isDismissed());
    // Événement déjà reçu avant le montage du composant (voir Providers.tsx).
    const early = (window as InstallWindow).__okareInstallEvent;
    if (early) setDeferred(early as BeforeInstallPromptEvent);

    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BeforeInstallPromptEvent); };
    const onInstalled = () => { setDeferred(null); setOpen(false); };
    // Connexion (ou changement de compte) : on repropose l'installation même si elle a été fermée.
    const onSession = () => { setDismissed(false); setOpen(true); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('okare:session', onSession);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('okare:session', onSession);
    };
  }, []);

  // Desktop Chrome/Edge : seulement quand le navigateur signale que l'appli est installable (sinon rien à proposer).
  const visible = open && (deferred || platform !== 'desktop') && !HIDDEN_PREFIXES.some((p) => path.startsWith(p));
  if (!visible) return null;

  const mobile = platform === 'ios' || platform === 'android';
  const dismiss = () => { setDismissed(true); setOpen(false); };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      // L'événement ne sert qu'une fois ; le navigateur en renverra un au prochain chargement si besoin.
      setDeferred(null);
      (window as InstallWindow).__okareInstallEvent = undefined;
      if (outcome === 'dismissed') dismiss();
      return;
    }
    if (platform === 'ios' && typeof navigator.share === 'function') {
      // Feuille de partage iOS : l'utilisateur y choisit « Sur l'écran d'accueil ».
      try { await navigator.share({ title: 'OKARE', url: window.location.origin }); } catch { /* partage annulé */ }
      return;
    }
    // Pas d'API disponible : on met en avant le geste à faire.
    setHighlight(true);
    window.setTimeout(() => setHighlight(false), 1600);
  };

  const hint = platform === 'ios'
    ? <>Ou touche <Share size={14} className="inline align-[-2px]" aria-label="Partager" /> en bas de Safari, puis « Sur l’écran d’accueil ».</>
    : platform === 'android'
      ? <>Ou ouvre le menu <EllipsisVertical size={14} className="inline align-[-2px]" aria-label="menu" /> du navigateur, puis « Installer l’application ».</>
      : platform === 'macos-safari'
        ? <>Dans la barre de menus : Fichier → « Ajouter au Dock ».</>
        : <>Ou clique sur l’icône d’installation dans la barre d’adresse.</>;

  return (
    <div role="dialog" aria-labelledby="install-title"
      className="fixed inset-x-3 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[600] mx-auto flex max-w-[420px] items-start gap-3 rounded-[18px] border border-trait bg-white p-4 shadow-[0_18px_40px_-18px_rgba(28,25,23,0.45)] lg:inset-x-auto lg:bottom-6 lg:right-6">
      <LogoPin height={40} />
      <div className="min-w-0 flex-1">
        <b id="install-title" className="block font-display text-[16px] leading-tight">
          {mobile ? 'Installe OKARE sur ton téléphone' : 'Installe OKARE sur ton ordinateur'}
        </b>
        <p className="m-0 mt-1 text-[13px] leading-snug text-ardoise">Ouvre l’appli en un geste, même avec un réseau faible.</p>
        {platform !== 'macos-safari' && (
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={install} className="min-h-11 rounded-[12px] bg-piment px-4 text-[14px] font-bold text-white">Installer</button>
            <button type="button" onClick={dismiss} className="min-h-11 rounded-[12px] px-3 text-[14px] font-semibold text-ardoise">Plus tard</button>
          </div>
        )}
        <p className={`m-0 mt-2.5 rounded-[10px] text-[12.5px] leading-snug transition-colors ${
          highlight ? 'bg-argile px-2 py-1.5 font-semibold text-charbon' : 'text-ardoise'}`}>
          {hint}
        </p>
      </div>
      <button type="button" onClick={dismiss} aria-label="Fermer" className="-m-1.5 flex size-11 shrink-0 items-center justify-center text-ardoise">
        <X size={18} />
      </button>
    </div>
  );
}
