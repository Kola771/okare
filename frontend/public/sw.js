/* Service worker OKARE (section 20), JavaScript natif servi tel quel depuis public/ (dev et prod, sans compilation).
 *
 * - install : précache la page de repli et les icônes essentielles.
 * - Pages (navigations) : NetworkFirst, repli sur la dernière version en cache puis sur /offline.html.
 * - /_next/static (fichiers hachés), polices : CacheFirst. Images : StaleWhileRevalidate. Tuiles de carte : CacheFirst limité.
 * - Jamais en cache : /dashboard, /seller, /account, /login, /r/ (données privées), toute URL /api/,
 *   les requêtes autres que GET (actions serveur, formulaires), les requêtes RSC et les autres domaines.
 * - En dev (enregistré avec ?dev=1) : /_next/* passe toujours par le réseau, pour ne pas casser le rechargement à chaud.
 *
 * Pour publier une nouvelle version du SW : incrémenter VERSION (les anciens caches sont supprimés à l'activation).
 */
const VERSION = 'v1';
const DEV = new URL(self.location.href).searchParams.get('dev') === '1';

const CACHE = {
  precache: `okare-precache-${VERSION}`,
  pages: `okare-pages-${VERSION}`,
  static: `okare-static-${VERSION}`,
  images: `okare-images-${VERSION}`,
  tiles: `okare-tiles-${VERSION}`,
};
const LIMITS = { pages: 30, images: 150, tiles: 300 };

const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicons/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/logos/okare-epingle.svg',
  '/logos/okare-epingle-blanc.svg',
];

const PRIVATE_PREFIXES = ['/dashboard', '/seller', '/account', '/login', '/r/'];
const TILE_PATH = /\/\d+\/\d+\/\d+(@2x)?\.(png|jpg|jpeg|webp)$/i;
const IMAGE_EXT = /\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/i;
const FONT_EXT = /\.(woff2?|ttf|otf|eot)$/i;

// ---------- Cycle de vie ----------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE.precache)
      .then((cache) => cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  const current = new Set(Object.values(CACHE));
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('okare-') && !current.has(n)).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

// Message « okare:clear-pages » : vide les pages en cache (ex. à la déconnexion).
self.addEventListener('message', (event) => {
  if (event.data === 'okare:clear-pages') event.waitUntil(caches.delete(CACHE.pages));
});

// ---------- Aiguillage des requêtes ----------

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Autres domaines : seules les tuiles de carte sont mises en cache.
  if (!sameOrigin) {
    if (request.destination === 'image' && TILE_PATH.test(url.pathname)) {
      event.respondWith(cacheFirst(request, CACHE.tiles, LIMITS.tiles));
    }
    return;
  }

  // Données privées et API : toujours le réseau, rien n'est stocké.
  if (url.pathname.startsWith('/api/') || PRIVATE_PREFIXES.some((p) => url.pathname.startsWith(p))) return;
  // Le SW lui-même et le rechargement à chaud de Next.
  if (url.pathname === '/sw.js' || url.pathname.startsWith('/__nextjs')) return;
  // Charges RSC (navigation côté client) : réseau seul, elles dépendent de l'état de l'app.
  if (request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(event));
    return;
  }

  if (url.pathname.startsWith('/_next/')) {
    if (DEV) return;
    if (url.pathname.startsWith('/_next/static/')) event.respondWith(cacheFirst(request, CACHE.static));
    else if (url.pathname.startsWith('/_next/image')) event.respondWith(staleWhileRevalidate(event, CACHE.images, LIMITS.images));
    return;
  }

  if (FONT_EXT.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE.static));
    return;
  }
  if (IMAGE_EXT.test(url.pathname) || url.pathname === '/manifest.webmanifest') {
    event.respondWith(staleWhileRevalidate(event, CACHE.images, LIMITS.images));
  }
});

// ---------- Stratégies ----------

/** Réponse stockable : complète, non opaque, non redirigée. */
function cacheable(response) {
  return response && response.ok && response.status === 200 && response.type !== 'opaque' && !response.redirected;
}

async function put(cacheName, request, response, maxEntries) {
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  if (maxEntries) await trim(cache, maxEntries);
}

/** Supprime les entrées les plus anciennes au-delà de `maxEntries` (ordre d'insertion). */
async function trim(cache, maxEntries) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - maxEntries; i++) await cache.delete(keys[i]);
}

async function networkFirstPage(event) {
  const { request } = event;
  try {
    const response = await fetch(request);
    if (cacheable(response)) event.waitUntil(put(CACHE.pages, request, response.clone(), LIMITS.pages));
    return response;
  } catch {
    const cached = await caches.match(request, { cacheName: CACHE.pages });
    return cached || (await caches.match(OFFLINE_URL, { cacheName: CACHE.precache })) || Response.error();
  }
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cached = await caches.match(request, { cacheName });
  if (cached) return cached;
  const response = await fetch(request);
  if (cacheable(response)) await put(cacheName, request, response.clone(), maxEntries);
  return response;
}

async function staleWhileRevalidate(event, cacheName, maxEntries) {
  const { request } = event;
  const cached = await caches.match(request);
  const network = fetch(request)
    .then(async (response) => {
      if (cacheable(response)) await put(cacheName, request, response.clone(), maxEntries);
      return response;
    })
    .catch(() => undefined);
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return (await network) || Response.error();
}
