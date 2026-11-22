/** Pastilles d'information : statut d'ouverture, étiquettes neutres, prix. */
import { openStatusLabel } from '@/shared/format';
import type { OpenStatus } from '@/shared/open-status';

const TONE_CLASS = {
  open: { box: 'bg-ok-soft text-ok', dot: 'bg-ok-dot' },
  soon: { box: 'bg-attention-soft text-attention', dot: 'bg-attention-dot' },
  later: { box: 'bg-piment-soft text-piment-dark', dot: 'bg-piment' },
  closed: { box: 'bg-argile text-ardoise', dot: 'bg-pierre' },
  unknown: { box: 'bg-argile text-ardoise', dot: 'bg-bordure' },
};

/** « Ouvert · ferme à 15h » avec pastille de couleur (maquette 2, D1). */
export function OpenBadge({ status, short = false }: { status: OpenStatus; short?: boolean }) {
  const label = openStatusLabel(status);
  const tone = TONE_CLASS[label.tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${tone.box}`}>
      <span aria-hidden className={`h-[7px] w-[7px] rounded-full ${tone.dot}`} />
      {short ? label.short : label.text}
    </span>
  );
}

/** Texte coloré du statut, sans fond (lignes de liste mobile). */
export function OpenText({ status, short = false }: { status: OpenStatus; short?: boolean }) {
  const label = openStatusLabel(status);
  const color = label.tone === 'open' ? 'text-feuille' : label.tone === 'soon' || label.tone === 'later' ? 'text-piment-dark' : 'text-ardoise';
  return <span className={`font-semibold ${color}`}>{short ? label.short : label.text}</span>;
}

export function Tag({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'piment' | 'ok' }) {
  const cls = tone === 'piment' ? 'bg-piment-soft text-piment-dark' : tone === 'ok' ? 'bg-ok-soft text-ok' : 'bg-argile text-encre';
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}

/** Prix toujours en vert « feuille », gras. */
export function Price({ xof, className = '' }: { xof: number; className?: string }) {
  const text = `${new Intl.NumberFormat('fr-FR').format(xof).replace(/ /g, ' ')} F`;
  return <span className={`whitespace-nowrap font-extrabold text-feuille ${className}`}>{text}</span>;
}
