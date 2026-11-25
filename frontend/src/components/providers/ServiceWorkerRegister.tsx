'use client';

/**
 * Enregistre le service worker natif `public/sw.js` (section 20), en dev comme en prod.
 * En dev, `?dev=1` lui dit de laisser passer `/_next/*` pour ne pas gêner le rechargement à chaud.
 * Désactivable avec NEXT_PUBLIC_DISABLE_SW=1.
 */
import { useEffect } from 'react';

const SW_URL = process.env.NODE_ENV === 'development' ? '/sw.js?dev=1' : '/sw.js';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NEXT_PUBLIC_DISABLE_SW === '1') {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
      return;
    }
    navigator.serviceWorker.register(SW_URL, { scope: '/' }).catch((err) => {
      console.warn('[OKARE] Service worker non enregistré :', err);
    });
  }, []);
  return null;
}

/** Vide les pages gardées hors ligne (à appeler à la déconnexion, pour un téléphone partagé). */
export function clearCachedPages() {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker?.controller) return;
  navigator.serviceWorker.controller.postMessage('okare:clear-pages');
}
