import { describe, expect, it } from 'vitest';
import { getOpenStatus, type OpenStatusInput } from '../open-status';
import { openStatusLabel } from '../format';

/** Instant UTC pour une heure locale de Porto-Novo (UTC+1). 2026-11-18 est un mercredi. */
const at = (date: string, hm: string) => new Date(`${date}T${hm}:00+01:00`);

const maquis: OpenStatusInput = {
  openingHours: { '1': [['07:00', '15:00']], '2': [['07:00', '15:00']], '3': [['07:00', '15:00']],
    '4': [['07:00', '15:00']], '5': [['07:00', '15:00']], '6': [['08:00', '14:00']] },
  holidayPolicy: 'UNKNOWN',
};

describe('getOpenStatus (12.4)', () => {
  it('ouvert, ferme à 15h', () => {
    const s = getOpenStatus(maquis, at('2026-11-18', '12:00'));
    expect(s.state).toBe('OPEN');
    expect(openStatusLabel(s).text).toBe('Ouvert · ferme à 15h');
  });

  it('ferme bientôt (30 min ou moins)', () => {
    expect(getOpenStatus(maquis, at('2026-11-18', '14:30')).state).toBe('CLOSING_SOON');
    expect(getOpenStatus(maquis, at('2026-11-18', '14:29')).state).toBe('OPEN');
  });

  it('ouvre plus tard aujourd\'hui', () => {
    const s = getOpenStatus(maquis, at('2026-11-18', '06:00'));
    expect(s.state).toBe('OPENS_LATER_TODAY');
    expect(openStatusLabel(s).text).toBe('Ouvre à 7h');
  });

  it('dimanche fermé, ouvre lundi à 7h', () => {
    const s = getOpenStatus(maquis, at('2026-11-22', '12:00'));
    expect(s.state).toBe('CLOSED_TODAY');
    expect(openStatusLabel(s).text).toBe("Fermé aujourd'hui · ouvre lun. à 7h");
  });

  it('plages multiples (restaurant midi et soir)', () => {
    const resto: OpenStatusInput = { ...maquis, openingHours: { '3': [['11:30', '15:00'], ['18:30', '23:00']] } };
    expect(getOpenStatus(resto, at('2026-11-18', '16:00')).state).toBe('OPENS_LATER_TODAY');
    expect(getOpenStatus(resto, at('2026-11-18', '19:00')).closesAt).toBe('23:00');
  });

  it('plage qui passe minuit', () => {
    const night: OpenStatusInput = { ...maquis, openingHours: { '3': [['18:00', '02:00']] } };
    const s = getOpenStatus(night, at('2026-11-19', '01:00'));
    expect(s.state).toBe('OPEN');
    expect(s.closesAt).toBe('02:00');
    expect(getOpenStatus(night, at('2026-11-19', '01:45')).state).toBe('CLOSING_SOON');
  });

  it('exception du jour : fermé exceptionnellement', () => {
    const pos = { ...maquis, overrides: [{ businessDate: '2026-11-18', isClosed: true, ranges: null }] };
    expect(getOpenStatus(pos, at('2026-11-18', '12:00')).state).toBe('CLOSED_EXCEPTIONALLY');
  });

  it('jour férié : inconnu, fermé ou ouvert selon la politique', () => {
    const holidays = ['2026-11-18'];
    expect(getOpenStatus({ ...maquis, holidays }, at('2026-11-18', '12:00')).state).toBe('UNKNOWN');
    expect(getOpenStatus({ ...maquis, holidays, holidayPolicy: 'CLOSED' }, at('2026-11-18', '12:00')).state).toBe('CLOSED_TODAY');
    expect(getOpenStatus({ ...maquis, holidays, holidayPolicy: 'OPEN' }, at('2026-11-18', '12:00')).state).toBe('OPEN');
  });

  it('2 signalements « fermé » puis plat du jour publié', () => {
    expect(getOpenStatus({ ...maquis, closedReportsToday: 2 }, at('2026-11-18', '12:00')).state).toBe('MAYBE_CLOSED');
    expect(getOpenStatus({ ...maquis, closedReportsToday: 2, confirmedOpenToday: true }, at('2026-11-18', '12:00')).state).toBe('OPEN');
  });

  it('aucun horaire saisi', () => {
    expect(getOpenStatus({ ...maquis, openingHours: {} }, at('2026-11-18', '12:00')).state).toBe('UNKNOWN');
  });
});
