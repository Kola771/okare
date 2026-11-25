import type { NextConfig } from 'next';

/**
 * `NEXT_DIST_DIR` permet un build de production à côté du serveur de dev (ex. `.next-prod`),
 * sans que les deux se bloquent sur le même dossier `.next`.
 */
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  poweredByHeader: false,
  experimental: {
    // Importe seulement les icônes utilisées (section 0ter.7).
    optimizePackageImports: ['lucide-react'],
    // Photos compressées sur le téléphone (1 600 px, JPEG 0,8) envoyées par l'action serveur en phase 1.
    serverActions: { bodySizeLimit: '8mb' },
  },
  async headers() {
    // Service worker PWA (public/sw.js) : le navigateur doit toujours revérifier le fichier pour prendre les mises à jour.
    return [{
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
      ],
    }];
  },
};

export default nextConfig;
