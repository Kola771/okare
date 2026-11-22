# Performances (spec 0ter)

Mesure **en production** : `npm run build:prod` puis `npm run start:prod` (port 3200), puis `npm run perf`.
Méthode : Playwright Chromium, mobile 360 px, CPU ralenti ×4, réseau 4G puis 3G simulé ; LCP = Largest Contentful Paint.

Budgets : LCP < 1,5 s en 4G, JS transféré < 200 Ko par page, navigation interne < 150 ms.

## Résultats du 21/11/2026

| Page | JS transféré (Ko) | LCP 4G (ms) | LCP 3G (ms) |
|---|---|---|---|
| / | 152 | 844 | 1260 |
| /p/chez-maman-ganhi | 194 | 904 | 1412 |
| /p/…/dish/riz-sauce-arachide-poisson | 139 | 792 | 1344 |
| /map | 191 | 3800 | 7508 |
| /search?q=riz | 148 | 764 | 1200 |
| /login | 163 | 756 | 1304 |
| /favorites | 149 | 800 | 1324 |
| /account | 149 | 712 | 1400 |
| /seller | 157 | 792 | 1328 |
| /seller/points | 157 | 748 | 1316 |
| /seller/points/[id]/menu | 174 | 932 | 1388 |
| /seller/points/[id]/hours | 172 | 788 | 1324 |
| /dashboard | 160 | 816 | 1544 |
| /dashboard/points | 170 | 880 | 1448 |

Navigation (sans ralentissement) : 71 à 92 ms.

Seul `/map` dépasse : ce sont les tuiles OpenStreetMap (serveur externe). À traiter avec la PWA (cache des tuiles) ou un fournisseur de tuiles plus proche.
