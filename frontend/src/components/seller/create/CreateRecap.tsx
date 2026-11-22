/** « Récapitulatif » à droite de la création (maquette VDCreer) : ce qui est déjà rempli, et les boutons de l'étape. */
import { POS_TYPE_LABEL } from '@/shared/enums';
import type { Draft } from './CreateSteps';

const DAYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];

function Line({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-3 border-t border-[#E7E5E4] py-2.5 text-sm first:border-0 first:pt-0"><span className="text-ardoise">{k}</span><b className="text-right">{v || '—'}</b></div>;
}

export function CreateRecap({ d, actions }: { d: Draft; actions: React.ReactNode }) {
  const open = DAYS.filter((_, i) => (d.openingHours[String(i + 1) as keyof typeof d.openingHours] ?? []).length);
  const services = [d.servesOnSite && 'sur place', d.servesTakeaway && 'à emporter', d.delivers && 'livraison', d.acceptsMomo && 'Mobile Money'].filter(Boolean).join(', ');
  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-[#E7E5E4] bg-white p-5 lg:sticky lg:top-6">
      <h2 className="m-0 text-[17px] font-bold">Récapitulatif</h2>
      <div>
        <Line k="Type" v={POS_TYPE_LABEL[d.type]} />
        <Line k="Nom" v={d.name} />
        <Line k="Responsable" v={d.contactName} />
        <Line k="WhatsApp" v={d.whatsappPhone} />
        <Line k="Repère" v={d.landmark} />
        <Line k="Ouvert" v={open.length ? open.join(', ') : 'à préciser'} />
        <Line k="Services" v={services} />
        <Line k="Photos" v={[d.facadePhoto && 'entrée', d.otherPhotos?.length && `${d.otherPhotos.length} autre${d.otherPhotos.length > 1 ? 's' : ''}`].filter(Boolean).join(' + ')} />
      </div>
      <p className="m-0 text-[13px] text-ardoise">Publié dès l’envoi, sans vérification. Gratuit.</p>
      {actions}
    </aside>
  );
}
