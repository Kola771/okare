'use client';

/** Messages courts en bas de l'écran (confirmation, erreur). */
import { createContext, useCallback, useContext, useState } from 'react';

type Tone = 'info' | 'success' | 'error';
interface Toast {
  id: number;
  text: string;
  tone: Tone;
}

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((text: string, tone: Tone = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[1000] flex flex-col items-center gap-2 px-4 lg:bottom-8">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg ${
              t.tone === 'error' ? 'bg-erreur text-white' : t.tone === 'success' ? 'bg-feuille text-white' : 'bg-charbon text-white'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
