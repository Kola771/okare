'use client';

/** Morceaux du suivi : boutons Oui / Pas encore / Non, et choix « Tu as pris quoi ? ». */
import { Check } from 'lucide-react';
import type { FollowUpAnswer } from '@/shared/enums';

export function AnswerButtons({ value, onChoose, disabled }: {
  value: FollowUpAnswer | null; onChoose: (a: FollowUpAnswer) => void; disabled: boolean;
}) {
  const base = 'min-h-[52px] flex-1 rounded-[14px] text-[15px] disabled:cursor-default';
  return (
    <div className="flex gap-2.5">
      <button type="button" disabled={disabled} aria-pressed={value === 'YES'} onClick={() => onChoose('YES')}
        className={`${base} border-2 border-feuille font-bold text-feuille-ink ${value === 'YES' ? 'bg-feuille-soft' : 'bg-feuille-pale'}`}>
        Oui
      </button>
      <button type="button" disabled={disabled} aria-pressed={value === 'NOT_YET'} onClick={() => onChoose('NOT_YET')}
        className={`${base} border font-semibold ${value === 'NOT_YET' ? 'border-charbon bg-argile' : 'border-bordure bg-white'}`}>
        Pas encore
      </button>
      <button type="button" disabled={disabled} aria-pressed={value === 'NO'} onClick={() => onChoose('NO')}
        className={`${base} border font-semibold text-red-700 ${value === 'NO' ? 'border-red-700 bg-red-50' : 'border-red-300 bg-white'}`}>
        Non
      </button>
    </div>
  );
}

interface PickerProps {
  menu: { id: string; name: string }[];
  picked: string[];
  other: boolean;
  onToggle: (id: string) => void;
  onOther: () => void;
  onSubmit: () => void;
}

export function DishPicker({ menu, picked, other, onToggle, onOther, onSubmit }: PickerProps) {
  const chip = (on: boolean) =>
    `inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold ${
      on ? 'bg-charbon text-white' : 'border border-bordure-douce bg-white text-charbon'}`;
  return (
    <>
      <div className="text-sm font-bold">
        Super ! Tu as pris quoi ? <span className="font-medium text-ardoise">(facultatif, plusieurs choix)</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {menu.map((d) => (
          <button key={d.id} type="button" aria-pressed={picked.includes(d.id)} onClick={() => onToggle(d.id)} className={chip(picked.includes(d.id))}>
            {picked.includes(d.id) && <Check size={14} />} {d.name}
          </button>
        ))}
        <button type="button" aria-pressed={other} onClick={onOther}
          className={other ? chip(true) : 'min-h-10 rounded-full border border-dashed border-[#A8A29E] bg-white px-3.5 text-sm font-semibold'}>
          Autre chose
        </button>
      </div>
      <button type="button" onClick={onSubmit} className="min-h-12 rounded-[14px] bg-feuille font-bold text-white">
        Valider ma réponse
      </button>
    </>
  );
}
