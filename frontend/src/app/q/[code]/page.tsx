import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { resolveQrCode } from '@/lib/api';

type Params = { params: Promise<{ code: string }> };

/** QR code collé chez le vendeur (12.6) : redirige vers /p/{slug}?src=qr ; sinon message clair. */
export default async function QrPage({ params }: Params) {
  const { code } = await params;
  const { slug, unavailable } = await resolveQrCode(code);
  if (slug && !unavailable) redirect(`/p/${slug}?src=qr`);
  return (
    <div className="bg-motif flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo size={40} />
      <div className="max-w-sm rounded-card border border-trait bg-surface p-6">
        <h1 className="m-0 font-display text-2xl font-extrabold">
          {unavailable ? 'Momentanément indisponible' : 'Ce code n’est plus valide'}
        </h1>
        <p className="m-0 mt-2 text-sm leading-normal text-ardoise">
          {unavailable
            ? 'Ce point de vente n’est pas en ligne pour le moment. Reviens un peu plus tard.'
            : `Le code « ${code.toUpperCase()} » ne correspond à aucun point de vente. Vérifie l’adresse imprimée sous le QR code.`}
        </p>
      </div>
      <Link href="/" className="flex min-h-12 items-center rounded-btn bg-piment px-6 font-bold text-white no-underline hover:text-white">
        Voir les plats près de moi
      </Link>
    </div>
  );
}
