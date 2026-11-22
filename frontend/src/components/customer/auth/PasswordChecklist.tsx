'use client';

/** Règles du mot de passe : 4 cases égales sur une ligne, vertes dès qu'elles sont respectées (inscription). */
import { Check } from 'lucide-react';
import { PASSWORD_RULES } from '@/shared/validate';

export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul aria-label="Règles du mot de passe" className="-mt-2 m-0 grid list-none grid-cols-4 gap-1 p-0">
      {PASSWORD_RULES.map((r) => {
        const ok = r.ok(value);
        return (
          <li key={r.key} title={r.label} aria-label={`${r.label} : ${ok ? 'oui' : 'pas encore'}`}
            className={`flex items-center justify-center gap-1 whitespace-nowrap rounded-lg py-1.5 text-[11px] font-semibold transition-colors sm:text-xs ${
              ok ? 'bg-ok-soft text-ok' : 'bg-[#F5F5F4] text-ardoise'}`}>
            {ok && <Check size={12} strokeWidth={3} className="shrink-0" />}{r.short}
          </li>
        );
      })}
    </ul>
  );
}
