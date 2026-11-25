/** « Ce que peut faire chaque rôle » (DB6) : résumé lisible des permissions 5.2 ; le détail se règle dans DB7. */
import { Card, Mark } from '@/components/admin/Card';

const HEAD = ['Client', 'Vendeur', 'Agent', 'Admin', 'Super-admin'];
const ROWS: [string, string[]][] = [
  ['Voir et contacter', ['✓', '✓', '✓', '✓', '✓']],
  ['Gérer ses points de vente', ['-', '✓', '✓ ses zones', '✓', '✓']],
  ['Publier les plats du jour', ['-', '✓ les siens', '✓ ses zones', '✓', '✓']],
  ['Payer un abonnement (FedaPay)', ['-', '✓ ses points', '-', '-', '-']],
  ['Envoyer un lien de paiement', ['-', '-', '✓', '✓', '✓']],
  ['Rembourser', ['-', '-', '-', '-', '✓']],
  ['Zones, tarifs, places', ['-', '-', 'lecture', '✓', '✓']],
  ['Rôles d’équipe, annulations', ['-', '-', '-', '-', '✓']],
];

export function RoleRightsCard() {
  return (
    <Card title="Ce que peut faire chaque rôle" flush>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead><tr className="bg-surface-inset text-xs text-ardoise">
            <th className="px-4 py-3 font-semibold">Action</th>{HEAD.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
          </tr></thead>
          <tbody>{ROWS.map(([label, cells]) => (
            <tr key={label} className="border-t border-trait">
              <td className="px-4 py-3 font-bold">{label}</td>
              {cells.map((c, i) => <td key={i} className="px-4 py-3"><Mark v={c} /></td>)}
            </tr>))}</tbody>
        </table>
      </div>
    </Card>
  );
}
