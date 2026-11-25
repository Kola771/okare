'use client';

/** Horaires de la semaine (0 à 3 plages par jour), jours fériés, fermeture du jour en un geste — écran 19, VD2 (12.4). */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { errorMessage, saveOpeningHours, setDayStatus, type ManagedPos } from '@/lib/api';
import { btn, Panel } from '@/components/admin/AdminParts';
import { useToast } from '@/components/providers/ToastProvider';
import { formatHour, openStatusLabel } from '@/shared/format';
import { WeekHoursField } from './WeekHoursField';
import type { HolidayPolicy } from '@/shared/enums';
import type { OpeningHours, TimeRange } from '@/shared/types';

const time = 'min-h-10 rounded-lg border border-bordure-douce px-2 text-sm';

export function HoursEditor({ pos, onSaved }: { pos: ManagedPos; onSaved?: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [hours, setHours] = useState<OpeningHours>(pos.openingHours);
  const [holiday, setHoliday] = useState<HolidayPolicy>(pos.holidayPolicy);
  const [special, setSpecial] = useState<TimeRange | null>(null);
  const [busy, setBusy] = useState(false);

  const today = pos.todayOverride;
  const todayText = today?.isClosed ? 'fermé (exception)' : today?.ranges ? `horaires spéciaux ${today.ranges.map((r) => r.map(formatHour).join('–')).join(', ')}`
    : openStatusLabel(pos.openStatus).short.toLowerCase();

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast(ok, 'success');
      if (onSaved) onSaved();
      else router.refresh();
    } catch (e) {
      toast(errorMessage(e), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Panel title="Aujourd’hui" sub={`Statut : ${todayText}`}>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} className={today?.isClosed ? btn.dark : btn.secondary}
            onClick={() => run(() => setDayStatus(pos.id, today?.isClosed ? null : { isClosed: true }), today?.isClosed ? 'Réouvert' : 'Fermé aujourd’hui')}>
            {today?.isClosed ? 'Annuler la fermeture' : 'Fermé aujourd’hui'}</button>
          <button type="button" disabled={busy} className={btn.secondary} onClick={() => setSpecial(special ? null : ['12:00', '20:00'])}>Horaires spéciaux</button>
        </div>
        {special && (
          <div className="flex flex-wrap items-center gap-2">
            <input type="time" value={special[0]} onChange={(e) => setSpecial([e.target.value, special[1]])} className={time} aria-label="Ouverture" />
            <span>–</span>
            <input type="time" value={special[1]} onChange={(e) => setSpecial([special[0], e.target.value])} className={time} aria-label="Fermeture" />
            <button type="button" disabled={busy} className={btn.primary}
              onClick={() => run(() => setDayStatus(pos.id, { isClosed: false, ranges: [special] }), 'Horaires spéciaux enregistrés').then(() => setSpecial(null))}>Valider</button>
          </div>
        )}
      </Panel>
      <Panel title="Chaque semaine">
        <WeekHoursField value={hours} onChange={setHours} />
        <label className="flex flex-wrap items-center justify-between gap-3 text-[15px]"><span><b>Jours fériés</b><span className="block text-[13px] text-ardoise">Prochain : Noël, 25 décembre</span></span>
          <select value={holiday} onChange={(e) => setHoliday(e.target.value as HolidayPolicy)} className="min-h-11 rounded-xl border border-bordure-douce bg-surface px-3 text-sm">
            <option value="CLOSED">Fermé</option><option value="OPEN">Ouvert</option><option value="UNKNOWN">Je préviens</option>
          </select></label>
        <button type="button" disabled={busy} className={`${btn.primary} self-end`} onClick={() => run(() => saveOpeningHours(pos.id, hours, holiday), 'Horaires enregistrés')}>Enregistrer</button>
      </Panel>
    </>
  );
}
