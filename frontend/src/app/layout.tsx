import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Inter } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import { ServiceWorkerRegister } from '@/components/providers/ServiceWorkerRegister';
import { getMe } from '@/lib/api';
import { readViewer } from '@/lib/viewer-server';
import './globals.css';

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' });
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

/** URL publique du site (balises og:image, liens absolus). Configurable au déploiement. */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://okare.bj' : 'http://localhost:3000');

const TITLE = 'OKARE — Où manger près de toi, à ton budget';
const DESCRIPTION = 'Les plats du jour, les prix et les maquis ouverts près de toi à Cotonou. Commande directement au vendeur sur WhatsApp.';
const OG_IMAGE = { url: '/logos/og-image-1200x630.png', width: 1200, height: 630, alt: 'OKARE' };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s · OKARE' },
  description: DESCRIPTION,
  applicationName: 'OKARE',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicons/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicons/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicons/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  // iOS : ouverture plein écran depuis l'écran d'accueil (émet aussi mobile-web-app-capable).
  appleWebApp: { capable: true, title: 'OKARE', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'fr_BJ',
    siteName: 'OKARE',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [OG_IMAGE.url] },
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
    <html lang="fr" suppressHydrationWarning className={`${bricolage.variable} ${inter.variable}`}>
      <body className="min-h-dvh antialiased">
        <Providers initialMe={me} viewer={viewer.prefs} zones={viewer.zones}>{children}</Providers>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
