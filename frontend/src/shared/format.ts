/** Mise en forme partagée : prix, heures, distances, statut d'ouverture, téléphones, message WhatsApp. */
import { BUSINESS_RULES } from './business-rules';
import type { OpenStatus } from './open-status';

const nf = new Intl.NumberFormat('fr-FR');

/** 10350 → « 10 350 F » (espace fine insécable remplacée par une espace normale insécable). */
export const formatPrice = (xof: number) => `${nf.format(xof).replace(/ /g, ' ')} F`;

/** '15:00' → '15h' ; '18:30' → '18h30'. */
export function formatHour(hm: string): string {
  const [h, m] = hm.split(':');
  return `${Number(h)}h${m === '00' ? '' : m}`;
}

/** 350 → « 350 m » ; 1 120 → « 1,1 km ». */
export function formatDistance(meters: number | null | undefined): string | null {
  if (meters == null) return null;
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

const WEEKDAY_SHORT = ['', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
export const WEEKDAY_LONG = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export type OpenTone = 'open' | 'soon' | 'later' | 'closed' | 'unknown';

/** Libellé client du statut d'ouverture (tableau 12.4) et sa couleur. */
export function openStatusLabel(s: OpenStatus): { text: string; short: string; tone: OpenTone } {
  const next = s.nextOpenAt ? `ouvre ${WEEKDAY_SHORT[s.nextOpenAt.weekday]} à ${formatHour(s.nextOpenAt.time)}` : null;
  switch (s.state) {
    case 'OPEN':
      return { text: s.closesAt ? `Ouvert · ferme à ${formatHour(s.closesAt)}` : 'Ouvert', short: 'Ouvert', tone: 'open' };
    case 'CLOSING_SOON':
      return { text: `Ferme bientôt · ${formatHour(s.closesAt ?? '00:00')}`, short: 'Ferme bientôt', tone: 'soon' };
    case 'OPENS_LATER_TODAY':
      return { text: `Ouvre à ${formatHour(s.nextOpenAt?.time ?? '00:00')}`, short: `Ouvre à ${formatHour(s.nextOpenAt?.time ?? '00:00')}`, tone: 'later' };
    case 'CLOSED_TODAY':
      return { text: next ? `Fermé aujourd'hui · ${next}` : "Fermé aujourd'hui", short: "Fermé aujourd'hui", tone: 'closed' };
    case 'CLOSED_EXCEPTIONALLY':
      return { text: "Fermé exceptionnellement aujourd'hui", short: "Fermé aujourd'hui", tone: 'closed' };
    case 'MAYBE_CLOSED':
      return { text: "Peut-être fermé aujourd'hui", short: 'Peut-être fermé', tone: 'unknown' };
    default:
      return { text: 'Horaires non confirmés', short: 'Horaires non confirmés', tone: 'unknown' };
  }
}

/** Saisie « 01 97 00 00 01 » ou « +229 01… » → E.164 « +2290197000001 », ou null si invalide. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const local = digits.startsWith('229') && digits.length === 13 ? digits.slice(3) : digits;
  const e164 = `+229${local}`;
  return /^\+2290[1-9]\d{8}$/.test(e164) ? e164 : null;
}

/** Numéro client masqué (5.3) : +229 01 •• •• •• 47. */
export function maskPhone(e164: string | null): string {
  if (!e164) return '';
  const local = e164.replace('+229', '');
  return `+229 ${local.slice(0, 2)} •• •• •• ${local.slice(-2)}`;
}

/** Numéro lisible : +229 01 97 00 00 01. */
export function displayPhone(e164: string): string {
  const local = e164.replace('+229', '');
  return `+229 ${local.replace(/(\d{2})(?=\d)/g, '$1 ')}`;
}

/** Message pré-rempli (9.3) — jamais retiré : c'est la preuve visible pour le vendeur. */
export function whatsappMessage(posName: string, dish?: { name: string; priceXof: number } | null,
  template = BUSINESS_RULES.whatsappMessageTemplate): string {
  const dishLine = dish ? `Je suis intéressé(e) par « ${dish.name} » (${formatPrice(dish.priceXof)}). ` : '';
  return template.replace('{posName}', posName).replace('{dishLine}', dishLine);
}

export function whatsappUrl(e164: string, text: string): string {
  return `https://wa.me/${e164.replace('+', '')}?text=${encodeURIComponent(text)}`;
}

/** Il y a combien de jours (« aujourd'hui », « hier », « il y a 3 jours »). */
export function daysAgoLabel(iso: string | null, now: Date): string | null {
  if (!iso) return null;
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  return `il y a ${days} jours`;
}

export function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
