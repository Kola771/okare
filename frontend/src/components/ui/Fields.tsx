'use client';

/** Champs de formulaire : téléphone (+229), mot de passe (afficher / masquer), texte. Erreurs sous le champ. */
import { Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  aside?: React.ReactNode;
}

function Frame({ id, label, error, hint, aside, children }: Omit<FieldProps, 'id'> & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-semibold text-encre">{label}</label>
        {aside}
      </div>
      {children}
      {error ? (
        <span id={`${id}-err`} className="text-[13px] font-semibold text-erreur">{error}</span>
      ) : hint ? (
        <span className="text-xs text-ardoise">{hint}</span>
      ) : null}
    </div>
  );
}

const box = (error?: string) =>
  `flex min-h-[52px] items-center gap-2.5 rounded-[14px] border bg-surface px-3.5 ${error ? 'border-erreur' : 'border-bordure-douce'}`;
const input = 'min-w-0 flex-1 border-0 bg-transparent text-base text-charbon outline-none';

export function PhoneField({ label, error, hint, aside, ...rest }: FieldProps) {
  const id = useId();
  return (
    <Frame id={id} label={label} error={error} hint={hint} aside={aside}>
      <span className={box(error)}>
        <span className="border-r border-trait pr-2.5 text-[15px] font-bold">+229</span>
        <input id={id} type="tel" inputMode="tel" autoComplete="tel" placeholder="01 XX XX XX XX"
          aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={input} {...rest} />
      </span>
    </Frame>
  );
}

export function PasswordField({ label, error, hint, aside, ...rest }: FieldProps) {
  const id = useId();
  const [shown, setShown] = useState(false);
  return (
    <Frame id={id} label={label} error={error} hint={hint} aside={aside}>
      <span className={box(error)}>
        <input id={id} type={shown ? 'text' : 'password'} aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined} className={input} {...rest} />
        <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          className="flex h-9 w-9 items-center justify-center text-ardoise">
          {shown ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </Frame>
  );
}

export function TextField({ label, error, hint, aside, ...rest }: FieldProps) {
  const id = useId();
  return (
    <Frame id={id} label={label} error={error} hint={hint} aside={aside}>
      <span className={box(error)}>
        <input id={id} aria-invalid={!!error} className={input} {...rest} />
      </span>
    </Frame>
  );
}

/** Interrupteur (role="switch") vert, comme la maquette D3 / D7. */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative h-[26px] w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-feuille' : 'bg-bordure'}`}>
      <span className={`absolute top-[3px] h-5 w-5 rounded-full bg-surface shadow transition-all ${checked ? 'right-[3px]' : 'left-[3px]'}`} />
    </button>
  );
}
