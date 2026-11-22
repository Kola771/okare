import Link from 'next/link';
import { ClientShell } from '@/components/customer/layout/ClientShell';
import { EmptyState } from '@/components/ui/States';

export default function NotFound() {
  return (
    <ClientShell>
      <div className="mx-auto w-full max-w-xl px-5 py-10">
        <EmptyState
          title="Cette page n’existe pas ou n’est plus en ligne"
          text="Le point de vente a peut-être changé d’adresse, ou ce plat n’est plus au menu."
          action={<Link href="/" className="flex min-h-11 items-center rounded-btn bg-piment px-5 text-sm font-bold text-white no-underline hover:text-white">Voir les plats près de moi</Link>}
        />
      </div>
    </ClientShell>
  );
}
