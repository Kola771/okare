/**
 * Marqueurs en étiquettes de prix (8.3) :
 *  pub dans la zone → fond jaune maïs ; sélectionné → piment, plus grand ; normal → blanc, prix vert ;
 *  fermé → gris « Fermé » ; classe REDUCED → petit point gris de 12 px (le prix apparaît au clic).
 */
import L from 'leaflet';
import type { MapMarker } from '@/lib/api';
import { formatPrice } from '@/shared/format';
import { isOpenNow } from '@/shared/open-status';
import { isPromoted } from '@/shared/visibility';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function markerIcon(m: MapMarker, selected: boolean): L.DivIcon {
  const closed = !isOpenNow(m.openState) && m.openState !== 'UNKNOWN';
  if (m.visibilityClass === 'REDUCED' && !selected) {
    return L.divIcon({
      className: 'okare-marker',
      html: '<span style="display:block;width:12px;height:12px;border-radius:999px;background:#A8A29E;border:2px solid #fff;box-shadow:0 1px 3px rgba(28,25,23,.3)"></span>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }
  let style = 'background:#fff;color:#15803D;font-size:13px;padding:6px 10px;box-shadow:0 1px 4px rgba(28,25,23,.3)';
  let text = formatPrice(m.price);
  if (closed) {
    style = 'background:#fff;color:#78716C;font-size:13px;padding:6px 10px;box-shadow:0 1px 4px rgba(28,25,23,.3)';
    text = 'Fermé';
  } else if (isPromoted(m.visibilityClass)) {
    style = 'background:#FBBF24;color:#1C1917;font-size:13px;padding:6px 10px;box-shadow:0 1px 4px rgba(28,25,23,.3)';
  }
  if (selected) {
    style = 'background:#C2410C;color:#fff;font-size:15px;padding:9px 13px;border:2px solid #fff;box-shadow:0 6px 16px rgba(194,65,12,.35)';
  }
  const html = `<span role="button" aria-label="${esc(`${m.label}, ${m.posName}, ${text}`)}" style="display:inline-block;transform:translate(-50%,-50%);white-space:nowrap;border-radius:999px;font-family:var(--font-sans);font-weight:800;${style}">${esc(text)}</span>`;
  return L.divIcon({ className: 'okare-marker', html, iconSize: [0, 0], iconAnchor: [0, 0] });
}

/** Pastille noire de regroupement (au-delà de 30 marqueurs visibles). */
export function clusterIcon(count: number): L.DivIcon {
  return L.divIcon({
    className: 'okare-marker',
    html: `<span style="display:flex;width:34px;height:34px;transform:translate(-50%,-50%);align-items:center;justify-content:center;border-radius:999px;background:#1C1917;color:#fff;font:700 13px var(--font-sans);border:2px solid #fff">${count}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export const viewerIcon = L.divIcon({
  className: 'okare-marker',
  html: '<span role="img" aria-label="Ta position" style="display:block;width:16px;height:16px;transform:translate(-50%,-50%);border-radius:999px;background:#2563EB;border:3px solid #fff;box-shadow:0 0 0 2px rgba(37,99,235,.3)"></span>',
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});
