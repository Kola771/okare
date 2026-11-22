'use client';

/**
 * Paramètres — DB12 : abonnements des vendeurs, paiements en ligne (FedaPay), général. Réservé au super-admin ;
 * chaque changement est inscrit au journal d'audit. Phase 1 : valeurs fictives, aucun paiement réel.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { errorMessage, getSettings, saveSettings } from '@/lib/api';
import { btn, PageHead, Pill } from '@/components/admin/AdminParts';
import { Card, Crumbs } from '@/components/admin/Card';
import { Select, SettingRow, Toggle } from '@/components/admin/Controls';
import { useApi } from '@/components/admin/useApi';
import { useToast } from '@/components/providers/ToastProvider';
import { ErrorState, LoadingList } from '@/components/ui/States';
import { TemplateRow } from './TemplateRow';

type V = Record<string, unknown>;

export function SettingsScreen() {
  const toast = useToast();
  const data = useApi(getSettings, []);
  const [v, setV] = useState<V>({});
  useEffect(() => { if (data.data) setV(data.data); }, [data.data]);
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data || !Object.keys(v).length) return <LoadingList count={3} className="h-32" />;
  const set = (k: string) => (val: unknown) => setV((x) => ({ ...x, [k]: val }));
  const num = (k: string) => Number(v[k]);
  const save = () => saveSettings(v).then(() => toast('Paramètres enregistrés', 'success')).catch((e) => toast(errorMessage(e), 'error'));

  return (
    <>
      <div className="flex flex-col gap-2">
        <Crumbs items={['Administration', 'Paramètres']} />
        <PageHead title="Paramètres" sub="Réservé au super-admin. Chaque changement est inscrit au journal d’audit."
          actions={<button type="button" className={btn.primary} onClick={save}>Enregistrer</button>} />
      </div>
      <Card title="Abonnements des vendeurs" flush right={<Pill>Désactivés · lancement gratuit</Pill>}>
        <SettingRow title="État des abonnements" sub={<>Désactivés (lancement gratuit). L’activation se fait par le bouton <b>« Activer les abonnements »</b> du Tableau de bord, qui prévient aussi les vendeurs.</>}>
          <Link href="/dashboard" className={btn.secondary}>Ouvrir le tableau de bord</Link>
        </SettingRow>
        <SettingRow title="Ancienneté minimale proposée par défaut" sub="Compte à partir de la publication du premier point de vente du vendeur. Modifiable dans la fenêtre d’activation.">
          <Select label="Ancienneté minimale" value={num('minVendorAgeDays')} onChange={set('minVendorAgeDays')} options={[[15, '15 jours'], [30, '1 mois (30 jours)'], [60, '2 mois (60 jours)']]} />
        </SettingRow>
        <SettingRow title="Préavis avant la baisse de visibilité" sub="Délai entre le message au vendeur et le moment où ses points non payés passent en bas des listes.">
          <Select label="Préavis" value={num('noticeDays')} onChange={set('noticeDays')} options={[[3, '3 jours'], [7, '7 jours'], [14, '14 jours']]} />
        </SettingRow>
        <TemplateRow title="Message d’annonce (WhatsApp et e-mail)" value={String(v.announceTemplate)} onChange={set('announceTemplate')}
          vars="{prenom}, {point}, {anciennete}, {date}, {prix_jour}, {lien}" />
        <SettingRow title="Messages WhatsApp aux vendeurs" sub="Envoyés automatiquement par l’API WhatsApp Business (numéro OKARE vérifié, modèle de message approuvé par Meta). Sans elle : e-mail et espace vendeur seulement.">
          <Select label="Canal" value={String(v.vendorChannel)} onChange={set('vendorChannel')} options={[['API', 'API WhatsApp Business'], ['EMAIL', 'E-mail seulement']]} />
        </SettingRow>
        <SettingRow title="Pubs offertes par l’équipe (essai)" sub="Permet à un admin d’offrir une pub de 7 jours au plus (0 F), pour un essai. Compte dans les places de la zone.">
          <Toggle label="Pubs offertes" checked={v.allowComplimentary !== false} onChange={set('allowComplimentary')} />
        </SettingRow>
      </Card>
      <Card title="Paiements en ligne (FedaPay)" flush right={<Pill tone="ok">Connecté</Pill>}>
        <SettingRow title="Mode" sub="Test : paiements fictifs (numéros de test FedaPay). Production : vrais paiements.">
          <Select label="Mode FedaPay" value={String(v.fedapayMode)} onChange={set('fedapayMode')} options={[['test', 'Test'], ['production', 'Production']]} />
        </SettingRow>
        <SettingRow title="Clés FedaPay" sub="Clé secrète et secret du webhook : enregistrées sur le serveur (variables d’environnement), jamais dans la base ni à l’écran.">
          <Pill tone="ok">Configurées</Pill>
        </SettingRow>
        <SettingRow title="Adresse du webhook" sub="À coller dans le tableau FedaPay. Chaque message est vérifié (en-tête X-FEDAPAY-SIGNATURE) puis revérifié auprès de FedaPay.">
          <code className="break-all text-[13px]">https://api.okare.bj/webhooks/fedapay</code>
        </SettingRow>
        <SettingRow title="Moyens de paiement acceptés" sub="Proposés au vendeur au moment de payer.">
          {['MTN MoMo', 'Moov Money', 'Celtiis Cash', 'Carte'].map((m) => <Pill key={m} tone="ok">{m}</Pill>)}
        </SettingRow>
        <SettingRow title="Places gardées pendant le paiement" sub="Au-delà, l’abonnement non payé expire et les places sont libérées.">
          <Select label="Places gardées" value={num('holdMinutes')} onChange={set('holdMinutes')} options={[[15, '15 minutes'], [30, '30 minutes'], [60, '1 heure']]} />
        </SettingRow>
      </Card>
      <Card title="Général" flush>
        <TemplateRow title="Message WhatsApp pré-rempli" value={String(v.whatsappTemplate)} onChange={set('whatsappTemplate')} vars="{posName}, {dishLine}" />
        <SettingRow title="Seuil « à démarcher »" sub="Contacts par semaine à partir desquels un point est proposé aux agents.">
          <Select label="Seuil à démarcher" value={num('prospectThreshold')} onChange={set('prospectThreshold')} options={[[3, '3 contacts'], [5, '5 contacts'], [10, '10 contacts']]} />
        </SettingRow>
        <SettingRow title="Nombre d’avis avant d’afficher la note" sub="En dessous, la note n’est pas montrée aux clients.">
          <Select label="Avis minimum" value={num('reviewsMinToDisplay')} onChange={set('reviewsMinToDisplay')} options={[[3, '3 avis'], [5, '5 avis'], [10, '10 avis']]} />
        </SettingRow>
        <SettingRow title="Double authentification de l’équipe" sub="Obligatoire pour agents, admins, super-admin.">
          <Toggle label="Double authentification" checked={v.teamTotp !== false} onChange={set('teamTotp')} />
        </SettingRow>
        <SettingRow title="Espace vendeur en écriture" sub="Interrupteur de secours : couper si abus.">
          <Toggle label="Espace vendeur en écriture" checked={v.vendorSelfService !== false} onChange={set('vendorSelfService')} />
        </SettingRow>
      </Card>
    </>
  );
}
