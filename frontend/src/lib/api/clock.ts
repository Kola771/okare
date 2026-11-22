/** Heure courante vue par l'interface ; en démonstration, l'horloge fixe du cookie `okare_mock_now`. */
export function now(): Date {
  if (typeof document !== 'undefined') {
    const m = document.cookie.match(/(?:^|;\s*)okare_mock_now=([^;]+)/);
    if (m) {
      const d = new Date(decodeURIComponent(m[1]));
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return new Date();
}
