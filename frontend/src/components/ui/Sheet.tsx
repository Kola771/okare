'use client';

/**
 * Fenêtre modale : glisse du bas sur mobile, boîte centrée sur desktop (22.0).
 * Le cadre arrondi ne défile pas : seul le contenu défile (barre fine décollée des bords), la croix reste en place.
 */
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
  /** Largeur maximale en desktop. */
  maxWidth?: string;
}

export function Sheet({ open, onClose, labelledBy, children, maxWidth = 'lg:max-w-[480px]' }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[900] flex items-end justify-center lg:items-center lg:p-6">
      <button aria-label="Fermer" tabIndex={-1} onClick={onClose}
        className="sheet-fade absolute inset-0 cursor-default bg-charbon/45 backdrop-blur-[2px]" />
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}
        className={`sheet-in relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-[0_-8px_40px_-12px_rgba(28,25,23,0.35)] lg:max-h-[86dvh] lg:w-[92%] lg:rounded-[24px] lg:shadow-[0_24px_64px_-16px_rgba(28,25,23,0.45)] ${maxWidth}`}>
        <div aria-hidden className="mx-auto mt-3 h-[5px] w-11 shrink-0 rounded-full bg-bordure lg:hidden" />
        <button type="button" onClick={onClose} aria-label="Fermer"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-surface-inset text-ardoise transition-colors hover:bg-argile hover:text-charbon lg:right-5 lg:top-5">
          <X size={18} strokeWidth={2.2} />
        </button>
        <div className="sheet-scroll mr-1.5 flex min-h-0 flex-col gap-5 overflow-y-auto px-6 pb-7 pt-4 lg:px-7 lg:pb-7 lg:pt-7 [&>h2]:pr-12 [&>h2]:text-[22px] [&>h2]:leading-tight [&>p:first-of-type]:-mt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
