'use client';

/** Étapes numérotées de la création (maquette VDCreer) : ① faites et en cours en piment, à venir en gris ; retour possible. */
import { Check } from 'lucide-react';

export function CreateStepper({ steps, step, onStep }: { steps: string[]; step: number; onStep: (i: number) => void }) {
  return (
    <ol className="no-scrollbar m-0 flex list-none items-center gap-2 overflow-x-auto p-0 sm:gap-3">
      {steps.map((label, i) => {
        const done = i < step;
        const on = i === step;
        return (
          <li key={label} className="flex shrink-0 items-center gap-2 sm:gap-3">
            {i > 0 && <span aria-hidden className={`h-0.5 w-5 rounded-full sm:w-10 ${i <= step ? 'bg-piment' : 'bg-bordure'}`} />}
            <button type="button" disabled={i > step} onClick={() => onStep(i)} aria-current={on ? 'step' : undefined}
              className="flex items-center gap-2 disabled:cursor-default">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${
                done || on ? 'bg-piment text-white' : 'bg-surface text-ardoise ring-1 ring-bordure'}`}>
                {done ? <Check size={16} strokeWidth={3} /> : i + 1}
              </span>
              <span className={`whitespace-nowrap text-sm ${on ? 'font-bold text-charbon' : done ? 'font-semibold text-charbon' : 'text-ardoise'} ${on ? '' : 'hidden sm:inline'}`}>{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
