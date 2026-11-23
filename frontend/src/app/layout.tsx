import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Inter } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import { getMe } from '@/lib/api';
import { readViewer } from '@/lib/viewer-server';
import './globals.css';

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' });
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'OKARE — Où manger près de toi, à ton budget', template: '%s · OKARE' },
  description: 'Les plats du jour, les prix et les maquis ouverts près de toi à Cotonou. Commande directement au vendeur sur WhatsApp.',
  applicationName: 'OKARE',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#C2410C',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Session lue côté serveur (cookie) : l'interface connaît le compte dès le premier affichage.
  const [me, viewer] = await Promise.all([getMe().catch(() => null), readViewer()]);
  return (
    <html lang="fr" className={`${bricolage.variable} ${inter.variable}`}>
      <body className="min-h-dvh antialiased">
        <Providers initialMe={me} viewer={viewer.prefs} zones={viewer.zones}>{children}</Providers>
      </body>
    </html>
  );
}
