/** Titre du point de vente et ses pastilles : ouverture, type, services, paiements acceptés au vendeur. */
import { BadgeCheck } from 'lucide-react';
import type { PosPage } from '@/lib/api';
import { OpenBadge, Tag } from '@/components/ui/Badges';
import { daysAgoLabel } from '@/shared/format';
import { POS_TYPE_LABEL } from '@/shared/enums';

export function servicesText(p: Pick<PosPage['pos'], 'servesOnSite' | 'servesTakeaway' | 'delivers'>) {
  return [p.servesOnSite && 'Sur place', p.servesTakeaway && 'À emporter', p.delivers && 'Livraison'].filter(Boolean).join(' · ');
}

export function paymentsText(p: Pick<PosPage['pos'], 'acceptsCash' | 'acceptsMomo'>) {
  return [p.acceptsCash && 'Espèces', p.acceptsMomo && 'Mobile Money'].filter(Boolean).join(' · ');
}

export function PosInfo({ pos, now }: { pos: PosPage['pos']; now: Date }) {
  const checked = daysAgoLabel(pos.pricesCheckedAt, now);
  const stale = pos.pricesCheckedAt && now.getTime() - new Date(pos.pricesCheckedAt).getTime() > 14 * 86_400_000;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="m-0 font-display text-2xl font-extrabold lg:text-[34px]">{pos.name}</h1>
        {pos.identityChecked && (
          <span title="Identité vérifiée par l'équipe OKARE" className="inline-flex items-center gap-1 text-xs font-bold text-ok">
            <BadgeCheck size={20} aria-hidden /> <span className="sr-only lg:not-sr-only">Identité vérifiée</span>
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 lg:mt-2.5 lg:gap-2">
        <OpenBadge status={pos.openStatus} />
        <Tag>{POS_TYPE_LABEL[pos.type]}</Tag>
        {servicesText(pos) && <Tag>{servicesText(pos)}</Tag>}
        {paymentsText(pos) && <span className="hidden lg:inline"><Tag>{paymentsText(pos)}</Tag></span>}
      </div>
      {checked && (
        <div className={`mt-2 text-[13px] ${stale ? 'font-semibold text-attention' : 'text-ardoise'}`}>
          {stale ? `Prix vérifiés ${checked} : ils ont pu changer.` : `Prix mis à jour ${checked}`}
        </div>
      )}
      {pos.description && <p className="m-0 mt-2 text-sm leading-normal text-encre">{pos.description}</p>}
    </div>
  );
}
