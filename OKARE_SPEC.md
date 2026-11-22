# OKARE — Spécification technique V1 (pour agent IA de développement)

> Document de référence pour construire OKARE. Il complète le cahier des charges (vision, marché, modèle économique) et décrit **toute la logique** à implémenter : vocabulaire, base de données, rôles, règles métier, algorithmes, cas limites.
> Langue de l'interface : **français** (tutoiement). Devise : **FCFA (XOF), entiers**. Fuseau horaire métier : **Africa/Porto-Novo (UTC+1, sans heure d'été)**.
> Version : 10.1 — 21/11/2026 : section 0ter (vitesse, pas d'abonnements pour l'instant, espace vendeur en 3 entrées, horaires jour par jour). Version 10 — 20/11/2026. Changements depuis la version 9 : base de données complète intégrée (section 4, fichier `backend/prisma/schema.prisma`, 42 tables) ; projet en deux dossiers `frontend/` et `backend/` installés par l'agent (section 2.1), une migration par table (4.2), interfaces d'abord (section 25) ; pubs (abonnements) en 4 formules (un jour, période de 2 à 21 jours, un mois, Premium) avec zones ciblées librement (3, 5, 7 ou 15 selon la formule) ; prix = prix d'un jour de la zone la plus chère × jours (Période), × 30 (Mois), × 30 × 1,5 (Premium) ; un Particulier n'a qu'un seul point de vente ; point de vente principal à −10 % en Période et en Mois et −5 % en Premium, autres points à −20 % (−15 % en Premium) ; un Particulier n'a qu'un point de vente ; commande de plusieurs points en un seul paiement **FedaPay** (plus aucun paiement en espèces ni confirmation manuelle) ; avis clients (affichés à partir de 5) ; aucune validation avant publication ; suppression des tâches, de la boîte WhatsApp et des zones voisines ; écrans renumérotés.

---

## 0. Résumé produit

OKARE est une application web installable (PWA) qui aide les habitants de Cotonou à **trouver où manger près d'eux selon leur budget**, et qui vend aux vendeurs des **pubs** (abonnements) pour apparaître en tête dans les zones de leur choix.

Principes qui structurent tout le reste :

1. **Arrivée d'un vendeur** : un agent le rencontre et saisit son contenu (le vendeur peut lui envoyer son catalogue sur WhatsApp), **ou** le vendeur s'inscrit et crée son contenu lui-même. Ensuite, vendeur, agent et admin gèrent les mêmes points de vente.
2. **Rien ne bloque la publication** : un plat ou un point de vente est publié, mis en attente, épuisé ou supprimé directement, par le vendeur, l'agent de la zone ou un admin. Pas de validation, pas de vérification préalable (particuliers compris), pas de tâches. Tout est tracé dans le journal d'audit.
3. **Chaque contact client est mesuré** (WhatsApp pré-rempli ou appel). C'est la preuve de valeur.
4. **Lancement gratuit, puis abonnements activés par un bouton** *(plus tard, section 11)* : au début personne ne paie. Le jour choisi, un admin clique sur **« Activer les abonnements »** sur l'accueil du dashboard (DB1). Seuls les vendeurs inscrits depuis plus d'1 mois (ou 2) sont concernés, prévenus avec un préavis ; sans pub ensuite, leurs points restent visibles mais **moins bien placés** (section 11.0).
5. **Pubs** *(plus tard, section 11)* : 4 formules (**un jour** : 3 zones au plus ; **période** de 2 à 21 jours : 5 zones ; **un mois** : 7 zones ; **Premium** : 15 zones), zones ciblées librement, places limitées par zone et par jour. Prix d'une zone = grille (catégorie A/B/C × type du point de vente). Un jour = somme des prix d'un jour des zones ; Période = prix d'un jour de la zone la plus chère × jours ; Un mois = zone la plus chère × 30 ; Premium = zone la plus chère × 30 × 1,5. Le **point de vente principal** du vendeur (désigné par OKARE) a −10 % en Période et en Mois, −5 % en Premium, 100 % en Un jour ; **ses autres points ont −20 %, et −15 % en Premium**. Un **Particulier** (vente en ligne) n'a qu'**un seul** point de vente.
6. **Paiement uniquement en ligne par FedaPay** *(plus tard, section 11)* (MTN MoMo, Moov Money, Celtiis Cash, carte) ; une commande peut regrouper plusieurs points de vente pour **un seul paiement** ; la pub s'active seule quand FedaPay confirme.
7. OKARE **ne prend aucune commission sur les repas** et ne gère ni commande ni livraison en V1.

**La maquette fait foi pour l'interface** (section 0bis). Écrans :
- client mobile : 1 à 3, 10, 10b, 11 à 14, 22 ; client desktop : D1 à D8, D6b ;
- espace vendeur mobile : 4, 7, 8, 15, 15b, 15c, 16, 17, 17b, 18, 19 ; vendeur desktop : VD1 à VD7 ;
- **plus tard** (abonnements et paiements, section 11) : 5, 5b, 20, 21, 23 à 26, VDP1 à VDP3, DB1b, DB1c, DB4, DM4 ;
- dashboard desktop : DB1, DB1b, DB1c, DB2 à DB12 ; dashboard mobile : DM1 à DM5 ; vues terrain : 6 et 9.

Une copie HTML de chaque écran est dans le dépôt, dossier `design/maquette/` (ouvrir `design/maquette/index.html`). Lien en ligne (pour l'équipe) : https://claude.ai/artifact/1yh541Am6rRDnbxDoyJ6z7

---
## 0ter. À lire en premier — décisions du 21/11/2026

### 1. L'application est très lente : à corriger en priorité
Le porteur du projet trouve l'app que tu construis **très lente**. Avant de continuer les écrans, corrige la vitesse, puis tiens ces règles pour toute la suite :
1. **Mesure en mode production**, pas en développement : `npm run build && npm start`. Le mode `npm run dev` est lent par nature ; pour développer, utilise `next dev --turbopack`.
2. **Server Components par défaut.** `"use client"` seulement sur les petits composants interactifs (boutons, formulaires, carte), jamais sur une page ou un layout entier.
3. **La carte (Leaflet) n'est chargée que là où elle s'affiche** : `dynamic(() => import(...), { ssr: false })`, jamais dans le layout ni sur les autres pages.
4. **Données fictives** (`src/mocks`) : lues côté serveur à travers `src/lib/api`, jamais importées dans un composant client (sinon elles partent dans le JavaScript du navigateur). Délai simulé de 150 ms au plus, réglable à 0 (`MOCK_DELAY_MS=0`).
5. **Images** : `next/image` avec tailles fixées, chargement différé sauf la première ; photos en WebP ; le motif de fond est un seul SVG en `background` CSS.
6. **Polices** : `next/font`, 2 familles, seulement les graisses utilisées.
7. **Pas de bibliothèque lourde** (kits d'interface complets, moment, lodash entier, librairies d'animation) ; icônes `lucide-react` importées une par une.
8. **Listes** : pagination par curseur ; pas de rendu de centaines d'éléments d'un coup.
9. **Pas de `useEffect` pour charger des données** qu'on peut lire côté serveur ; pas de re-rendus en cascade (état local au plus près, `memo` si besoin).
10. **Budgets à respecter et à prouver** (`@next/bundle-analyzer` + Lighthouse, rapport dans `frontend/PERF.md` par page) : JavaScript initial < 170 Ko compressé par page, LCP < 2,5 s en 4G et < 3 s en 3G simulée, Lighthouse mobile ≥ 85, navigation entre pages < 300 ms.

### 2. Pas d'abonnements, de pubs ni de paiements pour l'instant
On fait d'abord le nécessaire. Les abonnements (pubs) et le paiement FedaPay viendront **plus tard**, quand l'app aura pris de l'ampleur (section 11, phase 4 de la section 25). Aucun écran, bouton, texte ou API qui en parle maintenant. Tous les points de vente ont la même visibilité.

### 3. Espace vendeur : 3 entrées seulement
Menu : **Accueil** (stats de tous ses points), **Mes points de vente** (liste, bouton « Gestion » par ligne), **Profil**. Tout ce qui concerne un point (infos, menu et plats du jour, horaires, QR code, statistiques, avis, mettre en attente, supprimer) se fait dans sa **Gestion** (section 14).

### 4. Horaires jour par jour dès la création
À la création d'un point de vente, on saisit les horaires **jour par jour, avec plusieurs plages possibles** (midi et soir), comme dans « Horaires et fermetures ». Pas de plage unique appliquée à des jours cochés (section 12.1).

---

## 0bis. Suivre la maquette (obligatoire)

1. **Chaque écran se construit à partir de son fichier de maquette** (`design/maquette/*.html`) : même structure, même ordre des blocs, mêmes libellés, mêmes couleurs et tailles (tokens section 22.2). La maquette est la référence visuelle ; ce document est la référence pour la logique.
2. **En cas de conflit** : pour ce qui se voit (mise en page, textes, couleurs, composants), la maquette gagne ; pour les règles (calculs, permissions, statuts, données), ce document gagne. Signaler tout conflit dans `design/ECARTS.md` plutôt que de choisir en silence.
3. Les valeurs entre crochets (`[Nom]`, `[N]`, `[date]`) et les chiffres marqués « Données d'exemple » sont des **emplacements** : ils viennent de l'API, jamais codés en dur.
4. Les fonds de carte de la maquette sont des dessins : utiliser Leaflet + tuiles réelles (section 8.3). Les QR codes de la maquette sont des illustrations : générer de vrais QR codes (section 12.6). Les **assiettes dessinées** remplacent des photos : en production on affiche la vraie photo ; l'illustration (fichiers `design/assets/plats/*.svg`, une par `DishCategory` courante) sert seulement d'**image par défaut** quand un plat n'a pas encore de photo. Le **fond à motifs** des écrans client est un vrai élément de design à reprendre tel quel (`design/assets/motif-okare.svg`, section 22.2).
5. Un écran absent de la maquette (ex. réglages avancés) se construit avec les composants existants du même espace (client, vendeur ou dashboard), sans nouveau style.
6. Correspondance écran → route : section 22.1. Vérification : pour chaque écran livré, des captures Playwright à 360, 390, 768, 1024 et 1440 px sont comparées à la maquette lors de la revue (`npm run test:visual` dans `frontend/`). Le **responsive est impératif** (section 25).

---

## 1. Vocabulaire (à respecter dans le code, l'API et l'interface)

| Terme interface | Entité code | Définition |
|---|---|---|
| Vendeur | `Vendor` | La personne ou l'entreprise titulaire. Peut avoir **plusieurs** points de vente. Peut ne **pas** avoir de compte OKARE. |
| Point de vente | `PointOfSale` | Une activité de vente avec son menu, ses horaires, ses numéros, ses stats, ses pubs. Trois **types** : **Particulier** (vend en ligne depuis chez lui, souvent sans lieu public ; un vendeur Particulier n'a qu'**un seul** point de vente), **Maquis** (étals de rue compris), **Restaurant**. |
| Point de vente principal | `Vendor.mainPosId` | Le point du vendeur désigné par OKARE (le plus contacté sur 30 jours). Ses pubs ont −10 % en Période et en Mois, −5 % en Premium ; celles des autres points ont −20 % (−15 % en Premium) (11.2). |
| Catégorie de plat | `DishCategory` | Nom normalisé d'un plat (« Riz sauce arachide », « Amiwo »…) pour additionner les stats et filtrer la recherche. |
| Plat | `Dish` | Élément du menu d'**un** point de vente : publié ou en attente, épuisable pour la journée, supprimable. |
| Plat du jour | `DailySpecial` | Plat mis en avant pour la journée métier. |
| Page du plat | (vue) | Écran 22 / D8 : visuels, prix, description, point de vente (nom, distance, ouvert ou non), autres plats du même point, boutons **liés au plat**. **Pas d'emplacement ni de carte.** |
| Page du point de vente | (vue) | Écran 2 / D2 : photos, **emplacement** (carte, repère, itinéraire), horaires, menu du jour avec un bouton par plat, boutons **liés au point de vente** (« Écrire au vendeur », « Appeler »). |
| Pub (abonnement) | `Subscription` | Achat d'une place en tête de liste pour **un** point de vente, avec une **formule** (`AdPlan`), des **dates** et des **zones ciblées**. Dans l'interface : « pub » ou « abonnement ». |
| Commande | `SubscriptionOrder` | Une ou plusieurs pubs (une par point de vente) payées en **un seul** paiement FedaPay. |
| Paiement | `Payment` | Tentative de paiement FedaPay d'une commande (plusieurs tentatives possibles). |
| Activation des abonnements | `SubscriptionLaunch` | Le clic « Activer les abonnements » (DB1b) : qui, quand, ancienneté minimale, préavis, canaux. |
| Préavis | `Vendor.subscriptionRequiredFrom` | Date à partir de laquelle un vendeur concerné doit avoir une pub pour garder une visibilité normale. |
| Zone | `Zone` | Secteur géographique (polygone) d'une ville, avec une **catégorie** de prix (A/B/C) et un **nombre de places** de pub par jour. |
| Quartier | `Neighborhood` | Nom de quartier rattaché à une zone (recherche et affichage). |
| Contact | `ContactEvent` | Clic WhatsApp ou appel d'un client vers un point de vente. |
| Suivi de réponse | `ContactFollowUp` | Réponse du client à « Le vendeur t'a-t-il répondu ? ». |
| Avis | `Review` | Note de 1 à 5 et commentaire d'un client qui a contacté le vendeur et répondu « Oui » ; affiché à partir de 5 avis. |
| Signalement | `Report` | Problème signalé par un client sur un point de vente, un plat, un avis ou un utilisateur. |

---

## 2. Stack et structure du dépôt

| Couche | Choix |
|---|---|
| Organisation | **un dossier `okare/` avec deux sous-dossiers : `frontend/` et `backend/`**, deux projets indépendants (chacun son `package.json`, ses dépendances, son Dockerfile) ; pas de monorepo |
| Front (client, espace vendeur, dashboard) | Next.js 15 (App Router), Tailwind CSS, PWA (`@serwist/next` ou équivalent) |
| API | NestJS 10+, REST JSON, validation `zod` (schémas partagés), OpenAPI généré |
| ORM | Prisma 6 (schéma section 4) |
| Base | PostgreSQL 16 + **PostGIS** + `pg_trgm` + `unaccent` |
| Cache, compteurs, verrous, files | Redis 7 + BullMQ |
| Fichiers | Stockage compatible S3 (Cloudflare R2 recommandé ; MinIO en local), URLs pré-signées |
| Images | `sharp` dans un worker |
| Cartes | Leaflet + OpenStreetMap ; dessin de polygones `@geoman-io/leaflet-geoman` |
| Auth | Google OAuth (OIDC) + téléphone/mot de passe ; JWT access 15 min + refresh 30 j (cookie httpOnly, rotation) ; TOTP pour l'équipe |
| Notifications | Web Push (VAPID) ; e-mail transactionnel ; API WhatsApp Business (messages aux vendeurs) |
| Paiement | **FedaPay** (SDK `fedapay` Node), interface `PaymentProvider` |
| Tests | Vitest, Supertest (e2e API), Playwright (parcours critiques et comparaison visuelle) |
| CI/CD | GitHub Actions, Docker, `docker-compose` (postgis, redis, minio) |
| Observabilité | pino (logs JSON), Sentry |

```
okare/
├─ frontend/                    # Next.js : client, espace vendeur (/vendeur), dashboard (/dashboard)
│  ├─ src/app/                  # routes (section 22.1)
│  ├─ src/components/           # composants + tokens (section 22.2)
│  ├─ src/shared/               # code partagé, TypeScript pur (sans React ni Node) : types des tables (section 4),
│  │                            # enums, schémas zod, permissions.ts, business-rules.ts, pricing.ts, open-status.ts, visibility.ts
│  ├─ src/lib/api/              # couche d'accès à l'API : mêmes fonctions et signatures que la section 21
│  ├─ src/mocks/                # données fictives de la phase 1 (mêmes formes que la base)
│  ├─ public/                   # motif de fond, dessins de plats, icônes PWA
│  └─ package.json
├─ backend/                     # NestJS (API REST, jobs BullMQ, webhooks FedaPay)
│  ├─ prisma/
│  │  ├─ schema.prisma          # base de données (section 4)
│  │  ├─ migrations/            # dont le SQL PostGIS de la section 4.2
│  │  └─ seeder.ts              # données de départ (section 24)
│  ├─ src/                      # modules : auth, geo, pos, menus, contacts, reviews, reports, stats, ads, payments, admin…
│  └─ package.json
├─ design/
│  ├─ maquette/                 # copie HTML de chaque écran (référence visuelle, section 0bis)
│  ├─ assets/                   # motif de fond, dessins de plats par défaut
│  └─ ECARTS.md                 # écarts maquette / spec signalés pendant le développement
├─ docker-compose.yml           # postgis, redis, minio, backend, frontend
└─ OKARE_SPEC.md
```

**Code partagé** : les règles qui doivent donner le même résultat côté écran et côté serveur (prix d'une pub, statut d'ouverture, classe de visibilité, permissions, schémas de validation) sont écrites **une seule fois** dans `frontend/src/shared/`, en TypeScript pur. Le backend les importe par l'alias `@okare/shared` (`tsconfig` : `"paths": { "@okare/shared/*": ["../frontend/src/shared/*"] }`). Aucun fichier de `shared/` n'importe React, Next.js, NestJS ni Prisma.

### 2.1 Installation : c'est toi (l'agent de développement) qui la fais
Aucun projet n'est fourni tout prêt : **tu crées toi-même** les deux projets, en **TypeScript**, avec npm, dans le dossier `okare/`. Le dossier remis contient seulement `OKARE_SPEC.md`, `design/` (maquette et images) et `backend/prisma/schema.prisma` + `backend/prisma/seeder.ts`.

**Frontend — Next.js TypeScript** (phase 1, à faire en premier) :
```
cd okare
npx create-next-app@15 frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd frontend
npm i zod leaflet react-leaflet lucide-react
npm i -D @types/leaflet vitest @playwright/test
```
Puis : polices `next/font` (Bricolage Grotesque, Inter), tokens de la section 22.2 dans Tailwind, motif et dessins de `design/assets/` copiés dans `public/`, dossiers `src/shared`, `src/lib/api`, `src/mocks` (section 25).

**Backend — NestJS TypeScript** (phase 2, après validation de toutes les interfaces) :
```
cd okare
npx @nestjs/cli@latest new backend --package-manager npm --strict
cd backend
npm i @prisma/client@6 zod @nestjs/config @nestjs/jwt @nestjs/passport passport passport-google-oauth20 argon2 otplib bullmq ioredis fedapay
npm i -D prisma@6 tsx
npx prisma init
```
Puis : remplacer `prisma/schema.prisma` par celui fourni **en le construisant table par table** (section 4.2, une migration par table), placer `seeder.ts` dans `prisma/`, ajouter dans `package.json` : `"prisma": { "seed": "tsx prisma/seeder.ts" }`, alias `@okare/shared` dans `tsconfig.json`, `docker-compose.yml` à la racine (postgis/postgis:16, redis:7, minio).

Ne pas utiliser d'autre framework que ceux-là sans l'accord du porteur du projet.

Toute constante métier vit dans `frontend/src/shared/business-rules.ts` et peut être **surchargée** par la table `Setting` (section 23) sans redéploiement.

---

## 3. Conventions

- Identifiants : **UUID v7** partout (`@default(uuid(7)) @db.Uuid`). Validation `z.string().uuid()` sur tous les paramètres d'API. Les URLs publiques utilisent le `slug`, jamais l'UUID. Exceptions : `Setting.key`, `StatsShareLink.token` (jeton aléatoire de 32 octets en base64url), `RolePermission` (clé role + permission), identifiants externes (`providerTransactionId`, `deviceId`).
- Dates en UTC en base ; tout « jour métier » (plat du jour, places par jour, stats, début/fin de pub) en **Africa/Porto-Novo**. Une pub « du lundi au dimanche » couvre du lundi 00:00 au dimanche 23:59:59 heure locale.
- Montants : `Int` FCFA, jamais de flottant ; un prix après remise est **arrondi à la dizaine supérieure**.
- Téléphones : E.164. Bénin : numéros à 10 chiffres commençant par `01` → `^\+2290[1-9]\d{8}$`, saisie `01 XX XX XX XX` acceptée.
- Suppression douce (`deletedAt`) partout sauf purge de compte (section 18).
- Colonnes d'auteur (`createdById`, `updatedById`…) : uuid de l'utilisateur, sans clé étrangère ; l'historique complet est dans `AuditLog`.
- API `/api/v1`, pagination par curseur, erreurs `{ code, message, details? }` avec codes stables (`ZONE_FULL`, `TOO_MANY_ZONES`, `PERIOD_OUT_OF_RANGE`, `POS_OUTSIDE_ZONES`, `VERSION_CONFLICT`…).
- Toute écriture de l'équipe et des vendeurs sur les données publiées → `AuditLog`.

---
## 4. Base de données

La base compte **42 tables**. Le fichier `backend/prisma/schema.prisma` ci-dessous est la **référence** : noms, types, relations, index et contraintes à garder tels quels. Chaque champ porte son nom français en commentaire `///`. Les tableaux qui suivent (4.3 à 4.11) donnent, table par table, chaque champ avec son nom français, son type et ses règles.

### 4.1 Schéma Prisma

```prisma
// OKARE — schéma de la base (PostgreSQL 16 + PostGIS). Version 10 — 20/11/2026.
// Chaque champ porte son nom français en commentaire « /// ». 42 tables.
// Règles : id en UUID v7 ; montants en FCFA entiers (suffixe Xof) ; dates « jour métier » en @db.Date (heure de Porto-Novo).
// Colonnes d'auteur (createdById, updatedById, …) : uuid simple vers User, sans clé étrangère (l'historique complet est dans AuditLog).

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis, pg_trgm, unaccent]
}

// =====================================================================
// Listes de valeurs
// =====================================================================

/// Rôle (cumulables)
enum Role {
  CLIENT      /// client
  VENDOR      /// vendeur
  FIELD_AGENT /// agent terrain
  ADMIN       /// admin
  SUPER_ADMIN /// super-admin
}

/// Type de point de vente
enum PosType {
  PARTICULIER /// particulier (vente en ligne)
  MAQUIS      /// maquis (étals compris)
  RESTAURANT  /// restaurant
}

/// Statut d'un point de vente (aucune validation : publié directement)
enum PosStatus {
  PUBLISHED /// publié
  PENDING   /// en attente (invisible pour les clients)
  SUSPENDED /// suspendu par un admin
  ARCHIVED  /// archivé
}

/// Statut d'un plat (aucune validation : publié directement)
enum DishStatus {
  PUBLISHED /// publié
  PENDING   /// en attente (invisible pour les clients)
}

/// Moment du repas
enum MealMoment {
  BREAKFAST /// petit-déjeuner
  LUNCH     /// déjeuner
  DINNER    /// dîner
  ALL_DAY   /// toute la journée
}

/// Jours fériés
enum HolidayPolicy {
  OPEN    /// ouvert
  CLOSED  /// fermé
  UNKNOWN /// inconnu
}

/// Origine d'une exception du jour
enum DayStatusSource {
  TEAM           /// équipe
  VENDOR         /// vendeur
  CLIENT_REPORTS /// signalements de clients
  AUTO           /// automatique
}

/// Statut d'une demande de rattachement
enum ClaimStatus {
  PENDING  /// en attente
  APPROVED /// acceptée
  REJECTED /// refusée
  EXPIRED  /// expirée
}

/// Objet auquel une photo est rattachée
enum MediaOwner {
  POS    /// point de vente
  DISH   /// plat
  USER   /// profil
  REVIEW /// avis
  REPORT /// signalement
}

/// Statut d'une photo
enum MediaStatus {
  PROCESSING /// en traitement
  READY      /// prête
  REJECTED   /// refusée
}

/// Canal de contact
enum ContactChannel {
  WHATSAPP /// WhatsApp
  CALL     /// appel
}

/// Écran d'où vient un contact
enum ContactSource {
  HOME      /// accueil
  SEARCH    /// recherche
  MAP       /// carte
  DISH_PAGE /// page du plat
  POS_PAGE  /// page du point de vente
  FAVORITES /// favoris
  QR        /// QR code
  PUSH      /// notification
}

/// Réponse au suivi
enum FollowUpAnswer {
  YES     /// oui
  NOT_YET /// pas encore
  NO      /// non
}

/// Origine d'un plat commandé
enum OrderItemOrigin {
  DISH_BUTTON /// bouton du plat (automatique)
  DECLARED    /// déclaré par le client (« Tu as pris quoi ? »)
}

/// Statut d'un avis
enum ReviewStatus {
  PUBLISHED /// publié
  HIDDEN    /// masqué
  REMOVED   /// retiré
}

/// Cible d'un signalement
enum ReportTarget {
  POS    /// point de vente
  DISH   /// plat
  REVIEW /// avis
  USER   /// utilisateur
}

/// Motif d'un signalement
enum ReportReason {
  WRONG_INFO         /// information fausse
  WRONG_PRICE        /// prix faux
  CLOSED_TODAY       /// fermé aujourd'hui
  WRONG_HOURS        /// horaires faux
  CLOSED_PERMANENTLY /// fermé définitivement
  NO_ANSWER          /// ne répond pas
  FAKE_REVIEW        /// faux avis
  FOOD_SAFETY        /// hygiène, sécurité alimentaire
  INAPPROPRIATE      /// contenu choquant
  FRAUD              /// arnaque
  OTHER              /// autre
}

/// Statut d'un signalement
enum ReportStatus {
  OPEN     /// ouvert
  RESOLVED /// résolu
  REJECTED /// rejeté
}

/// Formule de pub (abonnement)
enum AdPlan {
  DAY     /// un jour (3 zones)
  PERIOD  /// période de 2 à 21 jours, dates de début et de fin (5 zones)
  MONTH   /// un mois (30 jours, 7 zones)
  PREMIUM /// Premium (30 jours, 15 zones, passe devant les abonnés normaux)
}

/// Statut d'une commande de pubs
enum OrderStatus {
  PENDING_PAYMENT /// en attente de paiement
  PAID            /// payée
  EXPIRED         /// expirée (pas payée à temps)
  CANCELLED       /// annulée
  REFUNDED        /// remboursée
}

/// Statut d'une pub (abonnement d'un point de vente)
enum SubscriptionStatus {
  PENDING_PAYMENT /// en attente de paiement
  PAID            /// payée (en cours ou à venir selon les dates)
  ENDED           /// terminée
  CANCELLED       /// annulée
  EXPIRED         /// expirée (pas payée à temps)
  REFUNDED        /// remboursée
}

/// Moyen de paiement (FedaPay)
enum PaymentMethod {
  MTN     /// MTN Mobile Money
  MOOV    /// Moov Money
  CELTIIS /// Celtiis Cash
  CARD    /// carte bancaire
  OTHER   /// autre moyen FedaPay
}

/// Statut d'un paiement
enum PaymentStatus {
  PENDING  /// en attente
  APPROVED /// approuvé
  DECLINED /// refusé
  CANCELED /// annulé
  EXPIRED  /// expiré
  REFUNDED /// remboursé
}

/// D'où le paiement a été lancé
enum PaymentOrigin {
  VENDOR_APP   /// espace vendeur
  PAYMENT_LINK /// lien envoyé par l'équipe
}

/// Statut d'une inscription en liste d'attente
enum WaitlistStatus {
  WAITING   /// en attente
  OFFERED   /// place proposée
  CONVERTED /// payée
  EXPIRED   /// expirée
  LEFT      /// retirée
}

/// Canal d'un message au vendeur
enum NoticeChannel {
  WHATSAPP /// WhatsApp (API WhatsApp Business)
  EMAIL    /// e-mail
  IN_APP   /// espace vendeur
}

/// Sorte de message au vendeur
enum NoticeKind {
  ANNOUNCEMENT /// annonce des abonnements
  REMINDER     /// rappel
  LAST_DAY     /// dernier jour du préavis
  NOTICE_ENDED /// fin du préavis
  RECEIPT      /// reçu de paiement
}

/// Statut d'un message au vendeur
enum NoticeStatus {
  QUEUED    /// en file
  SENT      /// envoyé
  DELIVERED /// reçu
  FAILED    /// échec
  SKIPPED   /// ignoré
}

/// Type de notification dans l'appli
enum NotificationType {
  FAVORITE_SPECIAL    /// plat du jour d'un favori
  FOLLOW_UP           /// suivi « t'a-t-il répondu ? »
  PAYMENT_APPROVED    /// paiement réussi
  PAYMENT_FAILED      /// paiement échoué
  SUBSCRIPTION_NOTICE /// annonce des abonnements
  SUBSCRIPTION_ENDING /// fin de pub proche
  REVIEW_RECEIVED     /// nouvel avis
  REPORT_RESOLVED     /// signalement traité
  SYSTEM              /// système
}

// =====================================================================
// 1. Comptes et accès
// =====================================================================

/// Utilisateur — tout le monde a un compte ; les rôles se cumulent
model User {
  id              String    @id @default(uuid(7)) @db.Uuid /// Identifiant
  phone           String?   @unique /// Téléphone (+229…)
  email           String?   @unique /// E-mail
  googleSub       String?   @unique /// Identifiant Google
  passwordHash    String? /// Mot de passe chiffré (argon2id)
  fullName        String? /// Nom complet
  avatarMediaId   String?   @db.Uuid /// Photo de profil
  roles           Role[]    @default([CLIENT]) /// Rôles
  homeZoneId      String?   @db.Uuid /// Zone habituelle
  budgetMaxXof    Int? /// Budget habituel
  notifyFavorites Boolean   @default(true) /// Plats du jour des favoris
  askFollowUp     Boolean   @default(true) /// Demander « t'a-t-il répondu ? »
  notifyNews      Boolean   @default(false) /// Nouveautés OKARE
  phoneVerifiedAt DateTime? /// Téléphone vérifié le
  totpSecret      String? /// Secret de double authentification (chiffré, équipe)
  totpEnabledAt   DateTime? /// Double authentification activée le
  isBlocked       Boolean   @default(false) /// Bloqué
  blockedReason   String? /// Motif du blocage
  lastSeenAt      DateTime? /// Dernière visite
  createdAt       DateTime  @default(now()) /// Créé le
  updatedAt       DateTime  @updatedAt /// Modifié le
  deletedAt       DateTime? /// Supprimé le

  homeZone          Zone?              @relation(fields: [homeZoneId], references: [id])
  sessions          Session[]
  agentZones        AgentZone[]
  pushSubscriptions PushSubscription[]
  notifications     Notification[]
  vendor            Vendor?            @relation("VendorAccount")
  favorites         Favorite[]
  contacts          ContactEvent[]
  reviews           Review[]
  reports           Report[]           @relation("ReportAuthor")

  @@map("users")
}

/// Session de connexion
model Session {
  id         String    @id @default(uuid(7)) @db.Uuid /// Identifiant
  userId     String    @db.Uuid /// Utilisateur
  tokenHash  String    @unique /// Jeton de connexion chiffré (rafraîchissement)
  deviceId   String? /// Appareil
  userAgent  String? /// Navigateur
  ipHash     String? /// Adresse IP chiffrée
  expiresAt  DateTime /// Expire le (30 jours)
  revokedAt  DateTime? /// Révoquée le
  createdAt  DateTime  @default(now()) /// Créée le

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@map("sessions")
}

/// Permission par rôle — modifiée dans l'écran « Rôles et permissions »
model RolePermission {
  role        Role /// Rôle
  permission  String /// Permission (ex. dish.manage, subscriptions.toggle)
  granted     Boolean  @default(true) /// Accordée
  updatedById String?  @db.Uuid /// Modifiée par
  updatedAt   DateTime @updatedAt /// Modifiée le

  @@id([role, permission])
  @@map("role_permissions")
}

/// Zone d'un agent — un agent a une ou plusieurs zones ; admin et super-admin voient toutes les zones (aucune ligne ici)
model AgentZone {
  userId       String   @db.Uuid /// Agent
  zoneId       String   @db.Uuid /// Zone
  assignedById String   @db.Uuid /// Attribuée par
  createdAt    DateTime @default(now()) /// Attribuée le

  user User @relation(fields: [userId], references: [id])
  zone Zone @relation(fields: [zoneId], references: [id])

  @@id([userId, zoneId])
  @@map("agent_zones")
}

/// Abonnement aux notifications du téléphone (web push)
model PushSubscription {
  id         String    @id @default(uuid(7)) @db.Uuid /// Identifiant
  userId     String    @db.Uuid /// Utilisateur
  endpoint   String    @unique /// Adresse d'envoi (fournie par le navigateur)
  keys       Json /// Clés
  userAgent  String? /// Navigateur
  lastUsedAt DateTime? /// Dernier envoi
  createdAt  DateTime  @default(now()) /// Créé le

  user User @relation(fields: [userId], references: [id])

  @@map("push_subscriptions")
}

/// Notification dans l'appli
model Notification {
  id        String           @id @default(uuid(7)) @db.Uuid /// Identifiant
  userId    String           @db.Uuid /// Destinataire
  type      NotificationType /// Type
  title     String /// Titre
  body      String /// Texte
  link      String? /// Lien (page à ouvrir)
  data      Json? /// Données
  readAt    DateTime? /// Lue le
  pushedAt  DateTime? /// Envoyée sur le téléphone le
  createdAt DateTime         @default(now()) /// Créée le

  user User @relation(fields: [userId], references: [id])

  @@index([userId, readAt])
  @@map("notifications")
}

// =====================================================================
// 2. Géographie
// =====================================================================

/// Pays
model Country {
  id         String  @id @default(uuid(7)) @db.Uuid /// Identifiant
  code       String  @unique /// Code (BJ)
  name       String /// Nom
  currency   String  @default("XOF") /// Monnaie
  timezone   String  @default("Africa/Porto-Novo") /// Fuseau horaire
  phoneRegex String /// Format des numéros
  isActive   Boolean @default(false) /// Actif

  cities   City[]
  holidays PublicHoliday[]

  @@map("countries")
}

/// Ville
model City {
  id        String                                 @id @default(uuid(7)) @db.Uuid /// Identifiant
  countryId String                                 @db.Uuid /// Pays
  name      String /// Nom
  slug      String                                 @unique /// Adresse courte
  center    Unsupported("geography(Point,4326)")? /// Centre
  isActive  Boolean                                @default(false) /// Active

  country    Country        @relation(fields: [countryId], references: [id])
  categories ZoneCategory[]
  zones      Zone[]

  @@map("cities")
}

/// Catégorie de zone (A centre d'affaires, B résidentiel dense, C périphérie)
model ZoneCategory {
  id                String @id @default(uuid(7)) @db.Uuid /// Identifiant
  cityId            String @db.Uuid /// Ville
  code              String /// Code (A, B, C)
  label             String /// Libellé
  defaultDailySlots Int /// Places de pub par zone et par jour (défaut)

  city      City        @relation(fields: [cityId], references: [id])
  zones     Zone[]
  priceGrid PriceGrid[]

  @@unique([cityId, code])
  @@map("zone_categories")
}

/// Zone
model Zone {
  id                 String                                        @id @default(uuid(7)) @db.Uuid /// Identifiant
  cityId             String                                        @db.Uuid /// Ville
  categoryId         String                                        @db.Uuid /// Catégorie
  name               String /// Nom
  code               String /// Code (unique par ville)
  boundary           Unsupported("geography(MultiPolygon,4326)")? /// Contour
  dailySlotsOverride Int? /// Places par jour (si différent de la catégorie)
  priceOverride      Json? /// Prix spécifiques (par type et formule ; sinon la grille)
  isActive           Boolean                                       @default(false) /// Active

  city          City               @relation(fields: [cityId], references: [id])
  category      ZoneCategory       @relation(fields: [categoryId], references: [id])
  neighborhoods Neighborhood[]
  agents        AgentZone[]
  pointsOfSale  PointOfSale[]
  residents     User[]
  targeting     SubscriptionZone[]
  slots         ZoneDaySlot[]
  waitlist      WaitlistEntry[]

  @@unique([cityId, code])
  @@map("zones")
}

/// Quartier
model Neighborhood {
  id      String   @id @default(uuid(7)) @db.Uuid /// Identifiant
  zoneId  String   @db.Uuid /// Zone
  name    String /// Nom
  aliases String[] /// Autres écritures (recherche)

  zone         Zone          @relation(fields: [zoneId], references: [id])
  pointsOfSale PointOfSale[]

  @@unique([zoneId, name])
  @@map("neighborhoods")
}

/// Jour férié
model PublicHoliday {
  id        String   @id @default(uuid(7)) @db.Uuid /// Identifiant
  countryId String   @db.Uuid /// Pays
  date      DateTime @db.Date /// Date
  name      String /// Nom

  country Country @relation(fields: [countryId], references: [id])

  @@unique([countryId, date])
  @@map("public_holidays")
}

// =====================================================================
// 3. Vendeurs et points de vente
// =====================================================================

/// Vendeur (le titulaire) — un ou plusieurs points de vente
model Vendor {
  id                       String    @id @default(uuid(7)) @db.Uuid /// Identifiant
  displayName              String /// Nom affiché
  contactName              String? /// Nom du responsable
  contactPhone             String /// Téléphone du responsable
  email                    String? /// E-mail
  userId                   String?   @unique @db.Uuid /// Compte OKARE du vendeur
  followedById             String?   @db.Uuid /// Agent référent
  notes                    String? /// Notes internes (équipe)
  mainPosId                String?   @unique @db.Uuid /// Point de vente principal (désigné par OKARE)
  mainPosComputedAt        DateTime? /// Point principal calculé le
  firstPublishedAt         DateTime? /// Première publication le (ancienneté)
  subscriptionNoticeAt     DateTime? /// Prévenu des abonnements le
  subscriptionRequiredFrom DateTime? /// Abonnement nécessaire à partir du (fin du préavis)
  createdById              String    @db.Uuid /// Créé par
  createdAt                DateTime  @default(now()) /// Créé le
  updatedAt                DateTime  @updatedAt /// Modifié le
  deletedAt                DateTime? /// Supprimé le

  user          User?               @relation("VendorAccount", fields: [userId], references: [id])
  mainPos       PointOfSale?        @relation("MainPos", fields: [mainPosId], references: [id])
  pointsOfSale  PointOfSale[]       @relation("VendorPos")
  claims        ClaimRequest[]
  orders        SubscriptionOrder[]
  subscriptions Subscription[]
  payments      Payment[]
  notices       VendorNotice[]

  @@map("vendors")
}

/// Point de vente
model PointOfSale {
  id                 String                                 @id @default(uuid(7)) @db.Uuid /// Identifiant
  vendorId           String                                 @db.Uuid /// Vendeur
  slug               String                                 @unique /// Adresse courte (okare.bj/p/…)
  name               String /// Nom
  description        String? /// Présentation
  type               PosType /// Type
  status             PosStatus                              @default(PUBLISHED) /// Statut
  version            Int                                    @default(1) /// Version (modifications simultanées)
  qrCode             String                                 @unique /// Code du QR (6 caractères)
  zoneId             String                                 @db.Uuid /// Zone (calculée depuis la position)
  neighborhoodId     String?                                @db.Uuid /// Quartier
  location           Unsupported("geography(Point,4326)") /// Position exacte
  locationAccuracyM  Int? /// Précision GPS (m)
  hasPublicPlace     Boolean                                @default(true) /// A un lieu public
  publicPoint        Unsupported("geography(Point,4326)")? /// Position affichée (décalée si pas de lieu public)
  landmark           String? /// Repère
  whatsappPhone      String /// WhatsApp des commandes
  whatsappVerifiedAt DateTime? /// WhatsApp vérifié le
  callPhone          String? /// Numéro d'appel (si différent)
  openingHours       Json /// Horaires de la semaine
  hoursConfirmedAt   DateTime? /// Horaires confirmés le
  holidayPolicy      HolidayPolicy                          @default(UNKNOWN) /// Jours fériés
  servesOnSite       Boolean                                @default(true) /// Sur place
  servesTakeaway     Boolean                                @default(true) /// À emporter
  delivers           Boolean                                @default(false) /// Livraison
  deliveryZoneIds    String[]                               @db.Uuid /// Zones livrées
  acceptsCash        Boolean                                @default(true) /// Accepte les espèces (repas)
  acceptsMomo        Boolean                                @default(false) /// Accepte Mobile Money (repas)
  coverMediaId       String?                                @db.Uuid /// Photo de couverture
  vendorOffer        String? /// Offre du vendeur
  identityCheckedAt  DateTime? /// Identité vérifiée le (badge, ne bloque rien)
  kitchenVisitedAt   DateTime? /// Cuisine visitée le (badge, ne bloque rien)
  consentAt          DateTime /// Accord du vendeur le
  consentById        String                                 @db.Uuid /// Accord recueilli par
  publishedAt        DateTime? /// Publié le
  pricesCheckedAt    DateTime? /// Prix vérifiés le
  responseRate       Float? /// Taux de réponse (calculé)
  ratingAvg          Float? /// Note moyenne (affichée à partir de 5 avis)
  ratingCount        Int                                    @default(0) /// Nombre d'avis publiés
  createdById        String                                 @db.Uuid /// Créé par
  updatedById        String?                                @db.Uuid /// Modifié par
  createdAt          DateTime                               @default(now()) /// Créé le
  updatedAt          DateTime                               @updatedAt /// Modifié le
  deletedAt          DateTime? /// Supprimé le

  vendor        Vendor           @relation("VendorPos", fields: [vendorId], references: [id])
  mainOf        Vendor?          @relation("MainPos")
  zone          Zone             @relation(fields: [zoneId], references: [id])
  neighborhood  Neighborhood?    @relation(fields: [neighborhoodId], references: [id])
  dishes        Dish[]
  dailySpecials DailySpecial[]
  dayOverrides  PosDayOverride[]
  favorites     Favorite[]
  contacts      ContactEvent[]
  reviews       Review[]
  reports       Report[]
  responseTests ResponseTest[]
  subscriptions Subscription[]
  waitlist      WaitlistEntry[]
  shareLinks    StatsShareLink[]

  @@index([zoneId, status])
  @@index([vendorId])
  @@map("points_of_sale")
}

/// Exception du jour (fermé aujourd'hui, horaires spéciaux)
model PosDayOverride {
  id           String          @id @default(uuid(7)) @db.Uuid /// Identifiant
  posId        String          @db.Uuid /// Point de vente
  businessDate DateTime        @db.Date /// Jour
  isClosed     Boolean /// Fermé toute la journée
  ranges       Json? /// Horaires spéciaux
  reason       String? /// Raison (interne)
  source       DayStatusSource /// Origine
  createdById  String?         @db.Uuid /// Créée par
  createdAt    DateTime        @default(now()) /// Créée le

  pos PointOfSale @relation(fields: [posId], references: [id])

  @@unique([posId, businessDate])
  @@map("pos_day_overrides")
}

/// Demande de rattachement — un vendeur récupère la fiche créée par l'équipe
model ClaimRequest {
  id           String      @id @default(uuid(7)) @db.Uuid /// Identifiant
  vendorId     String      @db.Uuid /// Vendeur
  userId       String      @db.Uuid /// Compte demandeur
  code         String /// Code reçu
  status       ClaimStatus @default(PENDING) /// Statut
  reviewedById String?     @db.Uuid /// Traitée par
  expiresAt    DateTime /// Expire le
  createdAt    DateTime    @default(now()) /// Créée le

  vendor Vendor @relation(fields: [vendorId], references: [id])

  @@map("claim_requests")
}

/// Fichier (photo) — toutes les photos du site (médiathèque)
model Media {
  id              String      @id @default(uuid(7)) @db.Uuid /// Identifiant
  ownerType       MediaOwner /// Rattaché à
  ownerId         String      @db.Uuid /// Identifiant rattaché
  sortOrder       Int         @default(0) /// Ordre (0 = photo principale)
  originalKey     String /// Fichier original (stockage)
  variants        Json /// Tailles réduites (WebP)
  width           Int? /// Largeur
  height          Int? /// Hauteur
  status          MediaStatus @default(PROCESSING) /// Statut
  rejectionReason String? /// Motif du refus
  uploadedById    String      @db.Uuid /// Envoyée par
  createdAt       DateTime    @default(now()) /// Créée le
  deletedAt       DateTime? /// Supprimée le

  @@index([ownerType, ownerId, sortOrder])
  @@map("media")
}

// =====================================================================
// 4. Menus (rien ne bloque : publier, mettre en attente, épuiser, supprimer)
// =====================================================================

/// Catégorie de plat (liste commune)
model DishCategory {
  id              String   @id @default(uuid(7)) @db.Uuid /// Identifiant
  name            String   @unique /// Nom
  slug            String   @unique /// Adresse courte
  aliases         String[] /// Autres écritures
  family          String? /// Famille (Riz, Pâtes, Igname…)
  illustrationKey String? /// Dessin par défaut (riz, pate, atassi, igname, spaghetti, aloko, attieke)
  sortOrder       Int      @default(0) /// Ordre (pastilles de l'accueil)
  isActive        Boolean  @default(true) /// Active

  dishes Dish[]

  @@map("dish_categories")
}

/// Plat
model Dish {
  id          String     @id @default(uuid(7)) @db.Uuid /// Identifiant
  posId       String     @db.Uuid /// Point de vente
  categoryId  String?    @db.Uuid /// Catégorie
  slug        String /// Adresse courte (page du plat)
  name        String /// Nom
  description String? /// Description
  priceXof    Int /// Prix
  moment      MealMoment @default(LUNCH) /// Moment
  status      DishStatus @default(PUBLISHED) /// Statut
  soldOutOn   DateTime?  @db.Date /// Épuisé le (remis à zéro le lendemain)
  sortOrder   Int        @default(0) /// Ordre dans le menu
  publishedAt DateTime? /// Publié le
  createdById String     @db.Uuid /// Créé par
  updatedById String?    @db.Uuid /// Modifié par
  createdAt   DateTime   @default(now()) /// Créé le
  updatedAt   DateTime   @updatedAt /// Modifié le
  deletedAt   DateTime? /// Supprimé le

  pos           PointOfSale    @relation(fields: [posId], references: [id])
  category      DishCategory?  @relation(fields: [categoryId], references: [id])
  dailySpecials DailySpecial[]
  reviews       Review[]

  @@unique([posId, slug])
  @@map("dishes")
}

/// Plat du jour
model DailySpecial {
  id            String   @id @default(uuid(7)) @db.Uuid /// Identifiant
  posId         String   @db.Uuid /// Point de vente
  dishId        String   @db.Uuid /// Plat
  businessDate  DateTime @db.Date /// Jour
  priceTodayXof Int? /// Prix du jour (si différent)
  createdById   String   @db.Uuid /// Publié par
  createdAt     DateTime @default(now()) /// Publié le

  pos  PointOfSale @relation(fields: [posId], references: [id])
  dish Dish        @relation(fields: [dishId], references: [id])

  @@unique([posId, dishId, businessDate])
  @@index([businessDate])
  @@map("daily_specials")
}

// =====================================================================
// 5. Clients : favoris, contacts, suivis, avis, signalements
// =====================================================================

/// Favori
model Favorite {
  userId      String   @db.Uuid /// Client
  posId       String   @db.Uuid /// Point de vente
  notifyDaily Boolean  @default(true) /// Prévenir de son plat du jour
  createdAt   DateTime @default(now()) /// Ajouté le

  user User        @relation(fields: [userId], references: [id])
  pos  PointOfSale @relation(fields: [posId], references: [id])

  @@id([userId, posId])
  @@map("favorites")
}

/// Contact (WhatsApp ou appel)
model ContactEvent {
  id               String         @id @default(uuid(7)) @db.Uuid /// Identifiant
  posId            String         @db.Uuid /// Point de vente
  vendorId         String         @db.Uuid /// Vendeur
  userId           String         @db.Uuid /// Client
  dishId           String?        @db.Uuid /// Plat (bouton d'un plat) ; vide = bouton du point de vente
  dishNameSnap     String? /// Nom du plat à ce moment
  dishPriceSnap    Int? /// Prix du plat à ce moment
  dishCategoryId   String?        @db.Uuid /// Catégorie du plat
  channel          ContactChannel /// Canal
  source           ContactSource /// Venu de
  posZoneId        String         @db.Uuid /// Zone du point de vente
  viewerZoneId     String?        @db.Uuid /// Zone du client
  subscriptionId   String?        @db.Uuid /// Pub affichée à ce moment
  deviceId         String? /// Appareil
  ipHash           String? /// IP chiffrée
  isCounted        Boolean        @default(true) /// Compté
  notCountedReason String? /// Raison du non-comptage
  createdAt        DateTime       @default(now()) /// Le

  pos        PointOfSale        @relation(fields: [posId], references: [id])
  user       User               @relation(fields: [userId], references: [id])
  followUp   ContactFollowUp?
  orderItems ContactOrderItem[]
  review     Review?

  @@index([posId, createdAt])
  @@index([userId, createdAt])
  @@map("contact_events")
}

/// Suivi « t'a-t-il répondu ? »
model ContactFollowUp {
  contactId  String          @id @db.Uuid /// Contact
  posId      String          @db.Uuid /// Point de vente
  userId     String          @db.Uuid /// Client
  askDish    Boolean         @default(false) /// Demander « Tu as pris quoi ? » (seulement si le contact n'a pas de plat)
  askCount   Int             @default(0) /// Nombre de fois demandé (2 au plus)
  askedAt    DateTime? /// Demandé le
  nextAskAt  DateTime? /// Redemander le
  answer     FollowUpAnswer? /// Réponse
  answeredAt DateTime? /// Répondu le

  contact ContactEvent @relation(fields: [contactId], references: [id])

  @@index([userId, answer])
  @@map("contact_follow_ups")
}

/// Plat commandé
model ContactOrderItem {
  id             String          @id @default(uuid(7)) @db.Uuid /// Identifiant
  contactId      String          @db.Uuid /// Contact
  dishId         String?         @db.Uuid /// Plat (vide = « autre chose »)
  dishNameSnap   String /// Nom du plat
  dishCategoryId String?         @db.Uuid /// Catégorie
  origin         OrderItemOrigin /// Origine
  createdAt      DateTime        @default(now()) /// Le

  contact ContactEvent @relation(fields: [contactId], references: [id])

  @@map("contact_order_items")
}

/// Avis — seulement après un contact suivi d'un « Oui » ; note affichée à partir de 5 avis
model Review {
  id                String       @id @default(uuid(7)) @db.Uuid /// Identifiant
  posId             String       @db.Uuid /// Point de vente
  dishId            String?      @db.Uuid /// Plat
  userId            String       @db.Uuid /// Client
  contactId         String       @unique @db.Uuid /// Contact d'origine (un avis par contact)
  rating            Int /// Note (1 à 5)
  comment           String? /// Commentaire
  status            ReviewStatus @default(PUBLISHED) /// Statut
  hiddenReason      String? /// Motif du masquage
  hiddenById        String?      @db.Uuid /// Masqué par
  vendorReply       String? /// Réponse du vendeur
  vendorRepliedAt   DateTime? /// Répondu le
  vendorRepliedById String?      @db.Uuid /// Répondu par
  createdAt         DateTime     @default(now()) /// Créé le
  updatedAt         DateTime     @updatedAt /// Modifié le

  pos     PointOfSale  @relation(fields: [posId], references: [id])
  dish    Dish?        @relation(fields: [dishId], references: [id])
  user    User         @relation(fields: [userId], references: [id])
  contact ContactEvent @relation(fields: [contactId], references: [id])
  reports Report[]

  @@index([posId, status])
  @@map("reviews")
}

/// Signalement — sur un point de vente, un plat, un avis ou un utilisateur
model Report {
  id           String       @id @default(uuid(7)) @db.Uuid /// Identifiant
  targetType   ReportTarget /// Cible
  posId        String?      @db.Uuid /// Point de vente
  dishId       String?      @db.Uuid /// Plat
  reviewId     String?      @db.Uuid /// Avis
  targetUserId String?      @db.Uuid /// Utilisateur signalé
  userId       String       @db.Uuid /// Auteur du signalement
  reason       ReportReason /// Motif
  comment      String? /// Commentaire
  businessDate DateTime     @db.Date /// Jour
  status       ReportStatus @default(OPEN) /// Statut
  resolvedById String?      @db.Uuid /// Traité par
  resolvedAt   DateTime? /// Traité le
  resolution   String? /// Décision
  createdAt    DateTime     @default(now()) /// Créé le

  pos    PointOfSale? @relation(fields: [posId], references: [id])
  review Review?      @relation(fields: [reviewId], references: [id])
  author User         @relation("ReportAuthor", fields: [userId], references: [id])

  @@unique([userId, targetType, posId, dishId, reviewId, targetUserId, reason, businessDate])
  @@index([status, createdAt])
  @@map("reports")
}

/// Test de réponse — message test envoyé par un agent
model ResponseTest {
  id                String   @id @default(uuid(7)) @db.Uuid /// Identifiant
  posId             String   @db.Uuid /// Point de vente
  agentId           String   @db.Uuid /// Agent
  sentAt            DateTime /// Envoyé le
  answeredWithinMin Int? /// Répondu en (minutes) ; vide = pas de réponse sous 2 h
  note              String? /// Remarque
  createdAt         DateTime @default(now()) /// Créé le

  pos PointOfSale @relation(fields: [posId], references: [id])

  @@map("response_tests")
}

// =====================================================================
// 6. Statistiques (cumuls de la nuit)
// =====================================================================

/// Statistiques du jour d'un point de vente
model PosDailyStat {
  posId               String   @db.Uuid /// Point de vente
  businessDate        DateTime @db.Date /// Jour
  impressions         Int      @default(0) /// Affichages dans les listes
  promotedImpressions Int      @default(0) /// Affichages grâce à une pub
  views               Int      @default(0) /// Visites de la page
  dishViews           Int      @default(0) /// Visites des pages de plats
  qrScans             Int      @default(0) /// Scans du QR code
  whatsappContacts    Int      @default(0) /// Contacts WhatsApp comptés
  callContacts        Int      @default(0) /// Appels comptés
  uniqueClients       Int      @default(0) /// Clients différents
  confirmedOrders     Int      @default(0) /// Commandes confirmées

  @@id([posId, businessDate])
  @@map("pos_daily_stats")
}

/// Statistiques du jour par plat
model PosDishDailyStat {
  posId        String   @db.Uuid /// Point de vente
  dishId       String   @db.Uuid /// Plat
  businessDate DateTime @db.Date /// Jour
  views        Int      @default(0) /// Visites de la page du plat
  contacts     Int      @default(0) /// Contacts
  confirmed    Int      @default(0) /// Commandes confirmées

  @@id([posId, dishId, businessDate])
  @@map("pos_dish_daily_stats")
}

/// Lien de rapport partagé (lecture seule)
model StatsShareLink {
  token       String    @id /// Jeton (dans l'adresse)
  posId       String    @db.Uuid /// Point de vente
  createdById String    @db.Uuid /// Créé par
  expiresAt   DateTime /// Expire le
  revokedAt   DateTime? /// Retiré le
  createdAt   DateTime  @default(now()) /// Créé le

  pos PointOfSale @relation(fields: [posId], references: [id])

  @@map("stats_share_links")
}

// =====================================================================
// 7. Pubs (abonnements) et paiements en ligne FedaPay
// =====================================================================

/// Grille tarifaire — prix PAR ZONE ciblée, par catégorie de zone et type de point de vente
model PriceGrid {
  id              String   @id @default(uuid(7)) @db.Uuid /// Identifiant
  categoryId      String   @db.Uuid /// Catégorie de zone
  posType         PosType /// Type de point de vente
  dayPriceXof     Int /// Prix d'un jour (seul prix de la grille ; Période, Mois et Premium en découlent)
  updatedById     String?  @db.Uuid /// Modifié par
  updatedAt       DateTime @updatedAt /// Modifié le

  category ZoneCategory @relation(fields: [categoryId], references: [id])

  @@unique([categoryId, posType])
  @@map("price_grid")
}

/// Commande de pubs — plusieurs points de vente, un seul paiement FedaPay
model SubscriptionOrder {
  id            String        @id @default(uuid(7)) @db.Uuid /// Identifiant
  number        String        @unique /// Numéro de commande (OK-2026-000123)
  vendorId      String        @db.Uuid /// Vendeur
  origin        PaymentOrigin /// Lancée depuis
  status        OrderStatus   @default(PENDING_PAYMENT) /// Statut
  subtotalXof   Int /// Total avant remises
  discountXof   Int /// Total des remises
  totalXof      Int /// Total à payer
  holdUntil     DateTime? /// Places gardées jusqu'à (30 minutes)
  paidAt        DateTime? /// Payée le
  receiptUrl    String? /// Reçu (PDF)
  createdById   String        @db.Uuid /// Créée par (vendeur ou équipe)
  createdAt     DateTime      @default(now()) /// Créée le
  updatedAt     DateTime      @updatedAt /// Modifiée le

  vendor        Vendor         @relation(fields: [vendorId], references: [id])
  subscriptions Subscription[]
  payments      Payment[]

  @@index([vendorId, status])
  @@map("subscription_orders")
}

/// Pub d'un point de vente (abonnement)
model Subscription {
  id                  String             @id @default(uuid(7)) @db.Uuid /// Identifiant
  orderId             String?            @db.Uuid /// Commande (vide si offerte)
  posId               String             @db.Uuid /// Point de vente
  vendorId            String             @db.Uuid /// Vendeur
  plan                AdPlan /// Formule
  startDate           DateTime           @db.Date /// Début
  endDate             DateTime           @db.Date /// Fin (incluse)
  days                Int /// Nombre de jours (Période : calculé depuis les deux dates, 2 à 21)
  isMainPos           Boolean /// Point principal au moment de l'achat
  baseXof             Int /// Prix avant remise (somme des zones)
  discountPct         Int                @default(0) /// Remise : 10 (point principal en Période), 20 (autre point), 0
  totalXof            Int /// Prix après remise
  status              SubscriptionStatus @default(PENDING_PAYMENT) /// Statut
  isComplimentary     Boolean            @default(false) /// Offerte (essai, 7 jours au plus)
  complimentaryReason String? /// Motif de l'offre
  renewedFromId       String?            @db.Uuid /// Renouvelle la pub
  createdById         String             @db.Uuid /// Créée par
  paidAt              DateTime? /// Payée le
  cancelledAt         DateTime? /// Annulée le
  cancelledById       String?            @db.Uuid /// Annulée par
  cancelReason        String? /// Motif d'annulation
  createdAt           DateTime           @default(now()) /// Créée le
  updatedAt           DateTime           @updatedAt /// Modifiée le

  order  SubscriptionOrder? @relation(fields: [orderId], references: [id])
  pos    PointOfSale        @relation(fields: [posId], references: [id])
  vendor Vendor             @relation(fields: [vendorId], references: [id])
  zones  SubscriptionZone[]
  slots  ZoneDaySlot[]

  @@index([posId, status])
  @@index([status, startDate, endDate])
  @@map("subscriptions")
}

/// Zone ciblée par une pub (3, 5, 7 ou 15 au plus selon la formule)
model SubscriptionZone {
  subscriptionId String @db.Uuid /// Pub
  zoneId         String @db.Uuid /// Zone
  priceXof       Int /// Prix de cette zone (figé, avant remise)

  subscription Subscription @relation(fields: [subscriptionId], references: [id])
  zone         Zone         @relation(fields: [zoneId], references: [id])

  @@id([subscriptionId, zoneId])
  @@map("subscription_zones")
}

/// Place occupée — une ligne par zone, par jour et par pub (limite les places)
model ZoneDaySlot {
  zoneId         String   @db.Uuid /// Zone
  businessDate   DateTime @db.Date /// Jour
  subscriptionId String   @db.Uuid /// Pub

  zone         Zone         @relation(fields: [zoneId], references: [id])
  subscription Subscription @relation(fields: [subscriptionId], references: [id])

  @@id([zoneId, businessDate, subscriptionId])
  @@index([zoneId, businessDate])
  @@map("zone_day_slots")
}

/// Paiement en ligne (FedaPay) — une commande peut avoir plusieurs tentatives
model Payment {
  id                    String        @id @default(uuid(7)) @db.Uuid /// Identifiant
  orderId               String        @db.Uuid /// Commande
  vendorId              String        @db.Uuid /// Vendeur
  amountXof             Int /// Montant
  feeXof                Int? /// Frais FedaPay
  currency              String        @default("XOF") /// Monnaie
  provider              String        @default("FEDAPAY") /// Prestataire
  providerTransactionId String?       @unique /// Numéro de transaction FedaPay
  providerReference     String? /// Référence FedaPay
  checkoutUrl           String? /// Lien de paiement
  method                PaymentMethod? /// Moyen de paiement
  payerPhone            String? /// Téléphone du payeur
  payerName             String? /// Nom du payeur
  payerEmail            String? /// E-mail du payeur
  status                PaymentStatus @default(PENDING) /// Statut
  origin                PaymentOrigin /// Lancé depuis
  initiatedById         String        @db.Uuid /// Lancé par
  approvedAt            DateTime? /// Approuvé le
  failedAt              DateTime? /// Échoué le
  failureReason         String? /// Raison de l'échec
  refundedAt            DateTime? /// Remboursé le
  refundedById          String?       @db.Uuid /// Remboursé par (super-admin)
  refundReason          String? /// Motif du remboursement
  receiptNumber         String?       @unique /// Numéro de reçu
  lastProviderStatus    Json? /// Dernière réponse FedaPay
  createdAt             DateTime      @default(now()) /// Créé le
  updatedAt             DateTime      @updatedAt /// Modifié le

  order  SubscriptionOrder @relation(fields: [orderId], references: [id])
  vendor Vendor            @relation(fields: [vendorId], references: [id])
  events PaymentEvent[]

  @@index([status, createdAt])
  @@map("payments")
}

/// Événement reçu de FedaPay (webhook) — gardé pour ne jamais traiter deux fois le même
model PaymentEvent {
  id                    String    @id @default(uuid(7)) @db.Uuid /// Identifiant
  provider              String    @default("FEDAPAY") /// Prestataire
  providerEventId       String?   @unique /// Identifiant de l'événement
  name                  String /// Type (transaction.approved, .declined, .canceled…)
  providerTransactionId String /// Transaction FedaPay
  paymentId             String?   @db.Uuid /// Paiement
  payload               Json /// Contenu reçu
  signatureValid        Boolean /// Signature valide (X-FEDAPAY-SIGNATURE)
  receivedAt            DateTime  @default(now()) /// Reçu le
  processedAt           DateTime? /// Traité le
  error                 String? /// Erreur

  payment Payment? @relation(fields: [paymentId], references: [id])

  @@index([providerTransactionId])
  @@map("payment_events")
}

/// Liste d'attente (zone complète)
model WaitlistEntry {
  id             String         @id @default(uuid(7)) @db.Uuid /// Identifiant
  zoneId         String         @db.Uuid /// Zone
  posId          String         @db.Uuid /// Point de vente
  plan           AdPlan /// Formule souhaitée
  wantedStart    DateTime       @db.Date /// Début souhaité
  wantedEnd      DateTime       @db.Date /// Fin souhaitée
  status         WaitlistStatus @default(WAITING) /// Statut
  offeredAt      DateTime? /// Place proposée le
  offerExpiresAt DateTime? /// Offre valable jusqu'au (48 h)
  createdAt      DateTime       @default(now()) /// Inscrit le

  zone Zone        @relation(fields: [zoneId], references: [id])
  pos  PointOfSale @relation(fields: [posId], references: [id])

  @@map("waitlist_entries")
}

/// Activation des abonnements — un clic sur « Activer les abonnements »
model SubscriptionLaunch {
  id                 String          @id @default(uuid(7)) @db.Uuid /// Identifiant
  activatedById      String          @db.Uuid /// Activé par
  activatedAt        DateTime        @default(now()) /// Activé le
  minVendorAgeDays   Int /// Ancienneté minimale (30 ou 60 jours)
  noticeDays         Int /// Préavis (3, 7 ou 14 jours)
  channels           NoticeChannel[] /// Canaux
  messageTemplate    String /// Modèle du message (copie)
  vendorsNotified    Int             @default(0) /// Vendeurs prévenus
  deactivatedAt      DateTime? /// Désactivé le
  deactivatedById    String?         @db.Uuid /// Désactivé par
  deactivationReason String? /// Motif de désactivation

  notices VendorNotice[]

  @@map("subscription_launches")
}

/// Message envoyé à un vendeur (annonce, rappel, reçu)
model VendorNotice {
  id          String        @id @default(uuid(7)) @db.Uuid /// Identifiant
  vendorId    String        @db.Uuid /// Vendeur
  launchId    String?       @db.Uuid /// Activation
  kind        NoticeKind /// Sorte
  channel     NoticeChannel /// Canal
  status      NoticeStatus  @default(QUEUED) /// Statut
  body        String /// Texte envoyé
  providerRef String? /// Identifiant du message
  error       String? /// Erreur
  createdAt   DateTime      @default(now()) /// Créé le
  sentAt      DateTime? /// Envoyé le

  vendor Vendor              @relation(fields: [vendorId], references: [id])
  launch SubscriptionLaunch? @relation(fields: [launchId], references: [id])

  @@index([vendorId, kind])
  @@map("vendor_notices")
}

// =====================================================================
// 8. Administration
// =====================================================================

/// Journal d'audit — qui a fait quoi, avant et après (lecture seule)
model AuditLog {
  id         String   @id @default(uuid(7)) @db.Uuid /// Identifiant
  actorId    String?  @db.Uuid /// Auteur (vide = système, FedaPay)
  actorRole  Role? /// Rôle de l'auteur
  action     String /// Action (ex. dish.publish, subscriptions.activate)
  entityType String /// Objet modifié
  entityId   String   @db.Uuid /// Identifiant de l'objet
  before     Json? /// Avant
  after      Json? /// Après
  ipHash     String? /// IP chiffrée
  createdAt  DateTime @default(now()) /// Le

  @@index([entityType, entityId])
  @@index([actorId, createdAt])
  @@map("audit_logs")
}

/// Paramètre (les clés secrètes FedaPay restent dans les variables d'environnement)
model Setting {
  key         String   @id /// Clé
  value       Json /// Valeur
  updatedById String?  @db.Uuid /// Modifié par
  updatedAt   DateTime @updatedAt /// Modifié le

  @@map("settings")
}
```

### 4.2 Migrations : une table = un fichier de migration

**Règle** : chaque table a **sa propre migration** (un dossier `backend/prisma/migrations/<horodatage>_<nom>/migration.sql`). Jamais une migration unique qui crée toutes les tables.

Comment faire avec Prisma (qui génère une migration à partir des différences du schéma) : on construit `schema.prisma` **table par table**, dans l'ordre ci-dessous. À chaque étape on ajoute un seul modèle (avec ses enums s'ils n'existent pas encore), puis :
```
npx prisma migrate dev --create-only --name 007_create_users   # génère la migration de cette table seulement
# compléter migration.sql avec le SQL propre à cette table (index PostGIS, trigrammes, CHECK, ci-dessous)
npx prisma migrate dev                                          # applique
```
Une relation vers une table pas encore créée est ajoutée dans la migration de la table qui arrive en second. À la fin, `schema.prisma` doit être **identique** à la section 4.1, et `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url $SHADOW_DATABASE_URL` ne doit rien afficher.

| N° | Migration | Table | Contenu en plus de la table |
|---|---|---|---|
| 000 | `000_enable_extensions` | — | `CREATE EXTENSION IF NOT EXISTS postgis; pg_trgm; unaccent;` + fonction `immutable_unaccent` |
| 001 | `001_create_countries` | countries | |
| 002 | `002_create_cities` | cities | |
| 003 | `003_create_zone_categories` | zone_categories | |
| 004 | `004_create_zones` | zones | index GIST `zone_boundary_gix` |
| 005 | `005_create_neighborhoods` | neighborhoods | index trigramme `neighborhood_trgm` |
| 006 | `006_create_public_holidays` | public_holidays | |
| 007 | `007_create_users` | users | enum `Role` |
| 008 | `008_create_sessions` | sessions | |
| 009 | `009_create_role_permissions` | role_permissions | |
| 010 | `010_create_agent_zones` | agent_zones | |
| 011 | `011_create_push_subscriptions` | push_subscriptions | |
| 012 | `012_create_notifications` | notifications | enum `NotificationType` |
| 013 | `013_create_media` | media | enums `MediaOwner`, `MediaStatus` |
| 014 | `014_create_vendors` | vendors | **sans** la clé étrangère `mainPosId` (la table des points n'existe pas encore) |
| 015 | `015_create_points_of_sale` | points_of_sale | enums `PosType`, `PosStatus`, `HolidayPolicy` ; index GIST `pos_location_gix`, `pos_public_gix` ; trigramme `pos_name_trgm` ; **puis** la clé étrangère `vendors.mainPosId → points_of_sale.id` (dépendance croisée) |
| 016 | `016_create_pos_day_overrides` | pos_day_overrides | enum `DayStatusSource` |
| 017 | `017_create_claim_requests` | claim_requests | enum `ClaimStatus` |
| 018 | `018_create_dish_categories` | dish_categories | |
| 019 | `019_create_dishes` | dishes | enums `MealMoment`, `DishStatus` ; trigramme `dish_name_trgm` ; CHECK `dish_price_positive` |
| 020 | `020_create_daily_specials` | daily_specials | |
| 021 | `021_create_favorites` | favorites | |
| 022 | `022_create_contact_events` | contact_events | enums `ContactChannel`, `ContactSource` |
| 023 | `023_create_contact_follow_ups` | contact_follow_ups | enum `FollowUpAnswer` |
| 024 | `024_create_contact_order_items` | contact_order_items | enum `OrderItemOrigin` |
| 025 | `025_create_reviews` | reviews | enum `ReviewStatus` ; CHECK `review_rating_1_5` |
| 026 | `026_create_reports` | reports | enums `ReportTarget`, `ReportReason`, `ReportStatus` |
| 027 | `027_create_response_tests` | response_tests | |
| 028 | `028_create_pos_daily_stats` | pos_daily_stats | |
| 029 | `029_create_pos_dish_daily_stats` | pos_dish_daily_stats | |
| 030 | `030_create_stats_share_links` | stats_share_links | |
| 031 | `031_create_price_grid` | price_grid | |
| 032 | `032_create_subscription_orders` | subscription_orders | enums `PaymentOrigin`, `OrderStatus` |
| 033 | `033_create_subscriptions` | subscriptions | enums `AdPlan`, `SubscriptionStatus` ; CHECK `sub_dates_ordered`, `sub_period_days`, `sub_discount_values` |
| 034 | `034_create_subscription_zones` | subscription_zones | |
| 035 | `035_create_zone_day_slots` | zone_day_slots | |
| 036 | `036_create_payments` | payments | enums `PaymentMethod`, `PaymentStatus` ; CHECK `payment_amount_positive` |
| 037 | `037_create_payment_events` | payment_events | |
| 038 | `038_create_waitlist_entries` | waitlist_entries | enum `WaitlistStatus` |
| 039 | `039_create_subscription_launches` | subscription_launches | enum `NoticeChannel` |
| 040 | `040_create_vendor_notices` | vendor_notices | enums `NoticeKind`, `NoticeStatus` |
| 041 | `041_create_audit_logs` | audit_logs | |
| 042 | `042_create_settings` | settings | |

(Un enum est créé dans la migration de la **première** table qui l'utilise ; si une table plus haut dans la liste en a besoin, il passe dans sa migration. Toute modification future d'une table = une nouvelle migration nommée d'après la table, par ex. `043_alter_dishes_add_spicy`.)

SQL à placer dans la migration de la table concernée :
```sql
-- 000_enable_extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text AS $$ SELECT unaccent('unaccent', $1) $$ LANGUAGE sql IMMUTABLE;

-- 004_create_zones
CREATE INDEX zone_boundary_gix  ON zones          USING GIST (boundary);
-- 005_create_neighborhoods
CREATE INDEX neighborhood_trgm  ON neighborhoods  USING GIN (immutable_unaccent(name) gin_trgm_ops);
-- 015_create_points_of_sale
CREATE INDEX pos_location_gix   ON points_of_sale USING GIST (location);
CREATE INDEX pos_public_gix     ON points_of_sale USING GIST ("publicPoint");
CREATE INDEX pos_name_trgm      ON points_of_sale USING GIN (immutable_unaccent(name) gin_trgm_ops);
-- 019_create_dishes
CREATE INDEX dish_name_trgm     ON dishes         USING GIN (immutable_unaccent(name) gin_trgm_ops);
ALTER TABLE dishes         ADD CONSTRAINT dish_price_positive     CHECK ("priceXof" BETWEEN 1 AND 100000);
-- 025_create_reviews
ALTER TABLE reviews        ADD CONSTRAINT review_rating_1_5       CHECK (rating BETWEEN 1 AND 5);
-- 033_create_subscriptions
ALTER TABLE subscriptions  ADD CONSTRAINT sub_dates_ordered       CHECK ("endDate" >= "startDate");
ALTER TABLE subscriptions  ADD CONSTRAINT sub_period_days         CHECK (plan <> 'PERIOD' OR days BETWEEN 2 AND 21);
ALTER TABLE subscriptions  ADD CONSTRAINT sub_discount_values     CHECK ("discountPct" IN (0, 5, 10, 15, 20));
-- 036_create_payments
ALTER TABLE payments       ADD CONSTRAINT payment_amount_positive CHECK ("amountXof" > 0);
```
(Les tables sont en snake_case via `@@map`, les colonnes gardent les noms Prisma en camelCase, d'où les guillemets. Le nombre maximal de zones par pub — 3, 5, 7 ou 15 selon la formule — est contrôlé par l'API, section 11.)

### 4.3 Comptes et accès

#### User · table `users` · Utilisateur
Tout le monde a un compte ; les rôles se cumulent.

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| phone | Téléphone | texte? | unique, +229… |
| email | E-mail | texte? | unique |
| googleSub | Identifiant Google | texte? | unique |
| passwordHash | Mot de passe chiffré | texte? | argon2id |
| fullName | Nom complet | texte? |  |
| avatarMediaId | Photo de profil | uuid? |  |
| roles | Rôles | enum Role [ ] | défaut [CLIENT] |
| homeZoneId | Zone habituelle | uuid? | → Zone |
| budgetMaxXof | Budget habituel | entier? |  |
| notifyFavorites | Plats du jour des favoris | booléen | défaut true |
| askFollowUp | Demander « t'a-t-il répondu ? » | booléen | défaut true |
| notifyNews | Nouveautés OKARE | booléen | défaut false |
| phoneVerifiedAt | Téléphone vérifié le | date-heure? |  |
| totpSecret | Secret de double authentification | texte? | chiffré, équipe |
| totpEnabledAt | Double authentification activée le | date-heure? |  |
| isBlocked | Bloqué | booléen | défaut false |
| blockedReason | Motif du blocage | texte? |  |
| lastSeenAt | Dernière visite | date-heure? |  |
| createdAt | Créé le | date-heure |  |
| updatedAt | Modifié le | date-heure |  |
| deletedAt | Supprimé le | date-heure? |  |

#### Session · table `sessions` · Session de connexion

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| userId | Utilisateur | uuid | → User |
| tokenHash | Jeton de connexion chiffré | texte | unique, rafraîchissement |
| deviceId | Appareil | texte? |  |
| userAgent | Navigateur | texte? |  |
| ipHash | Adresse IP chiffrée | texte? |  |
| expiresAt | Expire le | date-heure | 30 jours |
| revokedAt | Révoquée le | date-heure? |  |
| createdAt | Créée le | date-heure |  |

Index : userId

#### RolePermission · table `role_permissions` · Permission par rôle
Modifiée dans l'écran « Rôles et permissions ».

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| role | Rôle | enum Role |  |
| permission | Permission | texte | ex. dish.manage, subscriptions.toggle |
| granted | Accordée | booléen | défaut true |
| updatedById | Modifiée par | uuid? | → User (sans clé étrangère) |
| updatedAt | Modifiée le | date-heure |  |

Clé : role, permission

#### AgentZone · table `agent_zones` · Zone d'un agent
Un agent a une ou plusieurs zones ; admin et super-admin voient toutes les zones (aucune ligne ici).

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| userId | Agent | uuid | → User |
| zoneId | Zone | uuid | → Zone |
| assignedById | Attribuée par | uuid | → User (sans clé étrangère) |
| createdAt | Attribuée le | date-heure |  |

Clé : userId, zoneId

#### PushSubscription · table `push_subscriptions` · Abonnement aux notifications du téléphone (web push)

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| userId | Utilisateur | uuid | → User |
| endpoint | Adresse d'envoi | texte | unique, fournie par le navigateur |
| keys | Clés | JSON |  |
| userAgent | Navigateur | texte? |  |
| lastUsedAt | Dernier envoi | date-heure? |  |
| createdAt | Créé le | date-heure |  |

#### Notification · table `notifications` · Notification dans l'appli

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| userId | Destinataire | uuid | → User |
| type | Type | enum NotificationType |  |
| title | Titre | texte |  |
| body | Texte | texte |  |
| link | Lien | texte? | page à ouvrir |
| data | Données | JSON? |  |
| readAt | Lue le | date-heure? |  |
| pushedAt | Envoyée sur le téléphone le | date-heure? |  |
| createdAt | Créée le | date-heure |  |

Index : userId, readAt

### 4.4 Géographie

#### Country · table `countries` · Pays

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| code | Code | texte | unique, BJ |
| name | Nom | texte |  |
| currency | Monnaie | texte | défaut "XOF" |
| timezone | Fuseau horaire | texte | défaut "Africa/Porto-Novo" |
| phoneRegex | Format des numéros | texte |  |
| isActive | Actif | booléen | défaut false |

#### City · table `cities` · Ville

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| countryId | Pays | uuid | → Country |
| name | Nom | texte |  |
| slug | Adresse courte | texte | unique |
| center | Centre | point? |  |
| isActive | Active | booléen | défaut false |

#### ZoneCategory · table `zone_categories` · Catégorie de zone (A centre d'affaires, B résidentiel dense, C périphérie)

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| cityId | Ville | uuid | → City |
| code | Code | texte | A, B, C |
| label | Libellé | texte |  |
| defaultDailySlots | Places de pub par zone et par jour | entier | défaut |

Unique : cityId, code

#### Zone · table `zones` · Zone

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| cityId | Ville | uuid | → City |
| categoryId | Catégorie | uuid | → ZoneCategory |
| name | Nom | texte |  |
| code | Code | texte | unique par ville |
| boundary | Contour | polygone? |  |
| dailySlotsOverride | Places par jour | entier? | si différent de la catégorie |
| priceOverride | Prix spécifiques | JSON? | par type et formule ; sinon la grille |
| isActive | Active | booléen | défaut false |

Unique : cityId, code

#### Neighborhood · table `neighborhoods` · Quartier

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| zoneId | Zone | uuid | → Zone |
| name | Nom | texte |  |
| aliases | Autres écritures | texte [ ] | recherche |

Unique : zoneId, name

#### PublicHoliday · table `public_holidays` · Jour férié

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| countryId | Pays | uuid | → Country |
| date | Date | date |  |
| name | Nom | texte |  |

Unique : countryId, date

### 4.5 Vendeurs et points de vente

#### Vendor · table `vendors` · Vendeur (le titulaire)
Un ou plusieurs points de vente.

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| displayName | Nom affiché | texte |  |
| contactName | Nom du responsable | texte? |  |
| contactPhone | Téléphone du responsable | texte |  |
| email | E-mail | texte? |  |
| userId | Compte OKARE du vendeur | uuid? | → User, unique |
| followedById | Agent référent | uuid? | → User (sans clé étrangère) |
| notes | Notes internes | texte? | équipe |
| mainPosId | Point de vente principal | uuid? | → PointOfSale, unique, désigné par OKARE |
| mainPosComputedAt | Point principal calculé le | date-heure? |  |
| firstPublishedAt | Première publication le | date-heure? | ancienneté |
| subscriptionNoticeAt | Prévenu des abonnements le | date-heure? |  |
| subscriptionRequiredFrom | Abonnement nécessaire à partir du | date-heure? | fin du préavis |
| createdById | Créé par | uuid | → User (sans clé étrangère) |
| createdAt | Créé le | date-heure |  |
| updatedAt | Modifié le | date-heure |  |
| deletedAt | Supprimé le | date-heure? |  |

#### PointOfSale · table `points_of_sale` · Point de vente

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| vendorId | Vendeur | uuid | → Vendor |
| slug | Adresse courte | texte | unique, okare.bj/p/… |
| name | Nom | texte |  |
| description | Présentation | texte? |  |
| type | Type | enum PosType |  |
| status | Statut | enum PosStatus | défaut PUBLISHED |
| version | Version | entier | défaut 1, modifications simultanées |
| qrCode | Code du QR | texte | unique, 6 caractères |
| zoneId | Zone | uuid | → Zone, calculée depuis la position |
| neighborhoodId | Quartier | uuid? | → Neighborhood |
| location | Position exacte | point |  |
| locationAccuracyM | Précision GPS | entier? | m |
| hasPublicPlace | A un lieu public | booléen | défaut true |
| publicPoint | Position affichée | point? | décalée si pas de lieu public |
| landmark | Repère | texte? |  |
| whatsappPhone | WhatsApp des commandes | texte |  |
| whatsappVerifiedAt | WhatsApp vérifié le | date-heure? |  |
| callPhone | Numéro d'appel | texte? | si différent |
| openingHours | Horaires de la semaine | JSON |  |
| hoursConfirmedAt | Horaires confirmés le | date-heure? |  |
| holidayPolicy | Jours fériés | enum HolidayPolicy | défaut UNKNOWN |
| servesOnSite | Sur place | booléen | défaut true |
| servesTakeaway | À emporter | booléen | défaut true |
| delivers | Livraison | booléen | défaut false |
| deliveryZoneIds | Zones livrées | uuid [ ] |  |
| acceptsCash | Accepte les espèces | booléen | défaut true, repas |
| acceptsMomo | Accepte Mobile Money | booléen | défaut false, repas |
| coverMediaId | Photo de couverture | uuid? |  |
| vendorOffer | Offre du vendeur | texte? |  |
| identityCheckedAt | Identité vérifiée le | date-heure? | badge, ne bloque rien |
| kitchenVisitedAt | Cuisine visitée le | date-heure? | badge, ne bloque rien |
| consentAt | Accord du vendeur le | date-heure |  |
| consentById | Accord recueilli par | uuid | → User (sans clé étrangère) |
| publishedAt | Publié le | date-heure? |  |
| pricesCheckedAt | Prix vérifiés le | date-heure? |  |
| responseRate | Taux de réponse | décimal? | calculé |
| ratingAvg | Note moyenne | décimal? | affichée à partir de 5 avis |
| ratingCount | Nombre d'avis publiés | entier | défaut 0 |
| createdById | Créé par | uuid | → User (sans clé étrangère) |
| updatedById | Modifié par | uuid? | → User (sans clé étrangère) |
| createdAt | Créé le | date-heure |  |
| updatedAt | Modifié le | date-heure |  |
| deletedAt | Supprimé le | date-heure? |  |

Index : zoneId, status · Index : vendorId

#### PosDayOverride · table `pos_day_overrides` · Exception du jour (fermé aujourd'hui, horaires spéciaux)

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| posId | Point de vente | uuid | → PointOfSale |
| businessDate | Jour | date |  |
| isClosed | Fermé toute la journée | booléen |  |
| ranges | Horaires spéciaux | JSON? |  |
| reason | Raison | texte? | interne |
| source | Origine | enum DayStatusSource |  |
| createdById | Créée par | uuid? | → User (sans clé étrangère) |
| createdAt | Créée le | date-heure |  |

Unique : posId, businessDate

#### ClaimRequest · table `claim_requests` · Demande de rattachement
Un vendeur récupère la fiche créée par l'équipe.

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| vendorId | Vendeur | uuid | → Vendor |
| userId | Compte demandeur | uuid |  |
| code | Code reçu | texte |  |
| status | Statut | enum ClaimStatus | défaut PENDING |
| reviewedById | Traitée par | uuid? | → User (sans clé étrangère) |
| expiresAt | Expire le | date-heure |  |
| createdAt | Créée le | date-heure |  |

#### Media · table `media` · Fichier (photo)
Toutes les photos du site (médiathèque).

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| ownerType | Rattaché à | enum MediaOwner |  |
| ownerId | Identifiant rattaché | uuid |  |
| sortOrder | Ordre | entier | défaut 0, 0 = photo principale |
| originalKey | Fichier original | texte | stockage |
| variants | Tailles réduites | JSON | WebP |
| width | Largeur | entier? |  |
| height | Hauteur | entier? |  |
| status | Statut | enum MediaStatus | défaut PROCESSING |
| rejectionReason | Motif du refus | texte? |  |
| uploadedById | Envoyée par | uuid | → User (sans clé étrangère) |
| createdAt | Créée le | date-heure |  |
| deletedAt | Supprimée le | date-heure? |  |

Index : ownerType, ownerId, sortOrder

### 4.6 Menus (rien ne bloque : publier, mettre en attente, épuiser, supprimer)

#### DishCategory · table `dish_categories` · Catégorie de plat (liste commune)

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| name | Nom | texte | unique |
| slug | Adresse courte | texte | unique |
| aliases | Autres écritures | texte [ ] |  |
| family | Famille | texte? | Riz, Pâtes, Igname… |
| illustrationKey | Dessin par défaut | texte? | riz, pate, atassi, igname, spaghetti, aloko, attieke |
| sortOrder | Ordre | entier | défaut 0, pastilles de l'accueil |
| isActive | Active | booléen | défaut true |

#### Dish · table `dishes` · Plat

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| posId | Point de vente | uuid | → PointOfSale |
| categoryId | Catégorie | uuid? | → DishCategory |
| slug | Adresse courte | texte | page du plat |
| name | Nom | texte |  |
| description | Description | texte? |  |
| priceXof | Prix | entier |  |
| moment | Moment | enum MealMoment | défaut LUNCH |
| status | Statut | enum DishStatus | défaut PUBLISHED |
| soldOutOn | Épuisé le | date? | remis à zéro le lendemain |
| sortOrder | Ordre dans le menu | entier | défaut 0 |
| publishedAt | Publié le | date-heure? |  |
| createdById | Créé par | uuid | → User (sans clé étrangère) |
| updatedById | Modifié par | uuid? | → User (sans clé étrangère) |
| createdAt | Créé le | date-heure |  |
| updatedAt | Modifié le | date-heure |  |
| deletedAt | Supprimé le | date-heure? |  |

Unique : posId, slug

#### DailySpecial · table `daily_specials` · Plat du jour

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| posId | Point de vente | uuid | → PointOfSale |
| dishId | Plat | uuid | → Dish |
| businessDate | Jour | date |  |
| priceTodayXof | Prix du jour | entier? | si différent |
| createdById | Publié par | uuid | → User (sans clé étrangère) |
| createdAt | Publié le | date-heure |  |

Unique : posId, dishId, businessDate · Index : businessDate

### 4.7 Clients : favoris, contacts, suivis, avis, signalements

#### Favorite · table `favorites` · Favori

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| userId | Client | uuid | → User |
| posId | Point de vente | uuid | → PointOfSale |
| notifyDaily | Prévenir de son plat du jour | booléen | défaut true |
| createdAt | Ajouté le | date-heure |  |

Clé : userId, posId

#### ContactEvent · table `contact_events` · Contact (WhatsApp ou appel)

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| posId | Point de vente | uuid | → PointOfSale |
| vendorId | Vendeur | uuid |  |
| userId | Client | uuid | → User |
| dishId | Plat (bouton d'un plat) ; vide = bouton du point de vente | uuid? |  |
| dishNameSnap | Nom du plat à ce moment | texte? |  |
| dishPriceSnap | Prix du plat à ce moment | entier? |  |
| dishCategoryId | Catégorie du plat | uuid? |  |
| channel | Canal | enum ContactChannel |  |
| source | Venu de | enum ContactSource |  |
| posZoneId | Zone du point de vente | uuid |  |
| viewerZoneId | Zone du client | uuid? |  |
| subscriptionId | Pub affichée à ce moment | uuid? |  |
| deviceId | Appareil | texte? |  |
| ipHash | IP chiffrée | texte? |  |
| isCounted | Compté | booléen | défaut true |
| notCountedReason | Raison du non-comptage | texte? |  |
| createdAt | Le | date-heure |  |

Index : posId, createdAt · Index : userId, createdAt

#### ContactFollowUp · table `contact_follow_ups` · Suivi « t'a-t-il répondu ? »

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| contactId | Contact | uuid | → ContactEvent, clé |
| posId | Point de vente | uuid |  |
| userId | Client | uuid |  |
| askDish | Demander « Tu as pris quoi ? » | booléen | défaut false, seulement si le contact n'a pas de plat |
| askCount | Nombre de fois demandé | entier | défaut 0, 2 au plus |
| askedAt | Demandé le | date-heure? |  |
| nextAskAt | Redemander le | date-heure? |  |
| answer | Réponse | enum FollowUpAnswer? |  |
| answeredAt | Répondu le | date-heure? |  |

Index : userId, answer

#### ContactOrderItem · table `contact_order_items` · Plat commandé

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| contactId | Contact | uuid | → ContactEvent |
| dishId | Plat | uuid? | vide = « autre chose » |
| dishNameSnap | Nom du plat | texte |  |
| dishCategoryId | Catégorie | uuid? |  |
| origin | Origine | enum OrderItemOrigin |  |
| createdAt | Le | date-heure |  |

#### Review · table `reviews` · Avis
Seulement après un contact suivi d'un « Oui » ; note affichée à partir de 5 avis.

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| posId | Point de vente | uuid | → PointOfSale |
| dishId | Plat | uuid? | → Dish |
| userId | Client | uuid | → User |
| contactId | Contact d'origine | uuid | → ContactEvent, unique, un avis par contact |
| rating | Note | entier | 1 à 5 |
| comment | Commentaire | texte? |  |
| status | Statut | enum ReviewStatus | défaut PUBLISHED |
| hiddenReason | Motif du masquage | texte? |  |
| hiddenById | Masqué par | uuid? | → User (sans clé étrangère) |
| vendorReply | Réponse du vendeur | texte? |  |
| vendorRepliedAt | Répondu le | date-heure? |  |
| vendorRepliedById | Répondu par | uuid? | → User (sans clé étrangère) |
| createdAt | Créé le | date-heure |  |
| updatedAt | Modifié le | date-heure |  |

Index : posId, status

#### Report · table `reports` · Signalement
Sur un point de vente, un plat, un avis ou un utilisateur.

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| targetType | Cible | enum ReportTarget |  |
| posId | Point de vente | uuid? | → PointOfSale |
| dishId | Plat | uuid? |  |
| reviewId | Avis | uuid? | → Review |
| targetUserId | Utilisateur signalé | uuid? |  |
| userId | Auteur du signalement | uuid | → User |
| reason | Motif | enum ReportReason |  |
| comment | Commentaire | texte? |  |
| businessDate | Jour | date |  |
| status | Statut | enum ReportStatus | défaut OPEN |
| resolvedById | Traité par | uuid? | → User (sans clé étrangère) |
| resolvedAt | Traité le | date-heure? |  |
| resolution | Décision | texte? |  |
| createdAt | Créé le | date-heure |  |

Unique : userId, targetType, posId, dishId, reviewId, targetUserId, reason, businessDate · Index : status, createdAt

#### ResponseTest · table `response_tests` · Test de réponse
Message test envoyé par un agent.

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| posId | Point de vente | uuid | → PointOfSale |
| agentId | Agent | uuid | → User (sans clé étrangère) |
| sentAt | Envoyé le | date-heure |  |
| answeredWithinMin | Répondu en (minutes) ; vide = pas de réponse sous 2 h | entier? |  |
| note | Remarque | texte? |  |
| createdAt | Créé le | date-heure |  |

### 4.8 Statistiques (cumuls de la nuit)

#### PosDailyStat · table `pos_daily_stats` · Statistiques du jour d'un point de vente

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| posId | Point de vente | uuid |  |
| businessDate | Jour | date |  |
| impressions | Affichages dans les listes | entier | défaut 0 |
| promotedImpressions | Affichages grâce à une pub | entier | défaut 0 |
| views | Visites de la page | entier | défaut 0 |
| dishViews | Visites des pages de plats | entier | défaut 0 |
| qrScans | Scans du QR code | entier | défaut 0 |
| whatsappContacts | Contacts WhatsApp comptés | entier | défaut 0 |
| callContacts | Appels comptés | entier | défaut 0 |
| uniqueClients | Clients différents | entier | défaut 0 |
| confirmedOrders | Commandes confirmées | entier | défaut 0 |

Clé : posId, businessDate

#### PosDishDailyStat · table `pos_dish_daily_stats` · Statistiques du jour par plat

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| posId | Point de vente | uuid |  |
| dishId | Plat | uuid |  |
| businessDate | Jour | date |  |
| views | Visites de la page du plat | entier | défaut 0 |
| contacts | Contacts | entier | défaut 0 |
| confirmed | Commandes confirmées | entier | défaut 0 |

Clé : posId, dishId, businessDate

#### StatsShareLink · table `stats_share_links` · Lien de rapport partagé (lecture seule)

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| token | Jeton | texte | clé, dans l'adresse |
| posId | Point de vente | uuid | → PointOfSale |
| createdById | Créé par | uuid | → User (sans clé étrangère) |
| expiresAt | Expire le | date-heure |  |
| revokedAt | Retiré le | date-heure? |  |
| createdAt | Créé le | date-heure |  |

### 4.9 Pubs (abonnements) et paiements en ligne FedaPay

#### PriceGrid · table `price_grid` · Grille tarifaire
Prix PAR ZONE ciblée, par catégorie de zone et type de point de vente.

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| categoryId | Catégorie de zone | uuid | → ZoneCategory |
| posType | Type de point de vente | enum PosType |  |
| dayPriceXof | Prix d'un jour | entier | seul prix de la grille ; Période = zone la plus chère × jours, Mois × 30, Premium × 30 × 1,5 |
| updatedById | Modifié par | uuid? | → User (sans clé étrangère) |
| updatedAt | Modifié le | date-heure |  |

Unique : categoryId, posType

#### SubscriptionOrder · table `subscription_orders` · Commande de pubs
Plusieurs points de vente, un seul paiement FedaPay.

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| number | Numéro de commande | texte | unique, OK-2026-000123 |
| vendorId | Vendeur | uuid | → Vendor |
| origin | Lancée depuis | enum PaymentOrigin |  |
| status | Statut | enum OrderStatus | défaut PENDING_PAYMENT |
| subtotalXof | Total avant remises | entier |  |
| discountXof | Total des remises | entier |  |
| totalXof | Total à payer | entier |  |
| holdUntil | Places gardées jusqu'à | date-heure? | 30 minutes |
| paidAt | Payée le | date-heure? |  |
| receiptUrl | Reçu | texte? | PDF |
| createdById | Créée par | uuid | → User (sans clé étrangère), vendeur ou équipe |
| createdAt | Créée le | date-heure |  |
| updatedAt | Modifiée le | date-heure |  |

Index : vendorId, status

#### Subscription · table `subscriptions` · Pub d'un point de vente (abonnement)

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| orderId | Commande | uuid? | → SubscriptionOrder, vide si offerte |
| posId | Point de vente | uuid | → PointOfSale |
| vendorId | Vendeur | uuid | → Vendor |
| plan | Formule | enum AdPlan |  |
| startDate | Début | date |  |
| endDate | Fin | date | incluse |
| days | Nombre de jours | entier | Période : calculé depuis la date de début et la date de fin, 2 à 21 |
| isMainPos | Point principal au moment de l'achat | booléen |  |
| baseXof | Prix avant remise | entier | somme des zones |
| discountPct | Remise : 10 (point principal en Période), 20 (autre point), 0 | entier | défaut 0 |
| totalXof | Prix après remise | entier |  |
| status | Statut | enum SubscriptionStatus | défaut PENDING_PAYMENT |
| isComplimentary | Offerte | booléen | défaut false, essai, 7 jours au plus |
| complimentaryReason | Motif de l'offre | texte? |  |
| renewedFromId | Renouvelle la pub | uuid? |  |
| createdById | Créée par | uuid | → User (sans clé étrangère) |
| paidAt | Payée le | date-heure? |  |
| cancelledAt | Annulée le | date-heure? |  |
| cancelledById | Annulée par | uuid? | → User (sans clé étrangère) |
| cancelReason | Motif d'annulation | texte? |  |
| createdAt | Créée le | date-heure |  |
| updatedAt | Modifiée le | date-heure |  |

Index : posId, status · Index : status, startDate, endDate

#### SubscriptionZone · table `subscription_zones` · Zone ciblée par une pub (3, 5, 7 ou 15 au plus selon la formule)

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| subscriptionId | Pub | uuid | → Subscription |
| zoneId | Zone | uuid | → Zone |
| priceXof | Prix de cette zone | entier | figé, avant remise |

Clé : subscriptionId, zoneId

#### ZoneDaySlot · table `zone_day_slots` · Place occupée
Une ligne par zone, par jour et par pub (limite les places).

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| zoneId | Zone | uuid | → Zone |
| businessDate | Jour | date |  |
| subscriptionId | Pub | uuid | → Subscription |

Clé : zoneId, businessDate, subscriptionId · Index : zoneId, businessDate

#### Payment · table `payments` · Paiement en ligne (FedaPay)
Une commande peut avoir plusieurs tentatives.

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| orderId | Commande | uuid | → SubscriptionOrder |
| vendorId | Vendeur | uuid | → Vendor |
| amountXof | Montant | entier |  |
| feeXof | Frais FedaPay | entier? |  |
| currency | Monnaie | texte | défaut "XOF" |
| provider | Prestataire | texte | défaut "FEDAPAY" |
| providerTransactionId | Numéro de transaction FedaPay | texte? | unique |
| providerReference | Référence FedaPay | texte? |  |
| checkoutUrl | Lien de paiement | texte? |  |
| method | Moyen de paiement | enum PaymentMethod? |  |
| payerPhone | Téléphone du payeur | texte? |  |
| payerName | Nom du payeur | texte? |  |
| payerEmail | E-mail du payeur | texte? |  |
| status | Statut | enum PaymentStatus | défaut PENDING |
| origin | Lancé depuis | enum PaymentOrigin |  |
| initiatedById | Lancé par | uuid | → User (sans clé étrangère) |
| approvedAt | Approuvé le | date-heure? |  |
| failedAt | Échoué le | date-heure? |  |
| failureReason | Raison de l'échec | texte? |  |
| refundedAt | Remboursé le | date-heure? |  |
| refundedById | Remboursé par | uuid? | → User (sans clé étrangère), super-admin |
| refundReason | Motif du remboursement | texte? |  |
| receiptNumber | Numéro de reçu | texte? | unique |
| lastProviderStatus | Dernière réponse FedaPay | JSON? |  |
| createdAt | Créé le | date-heure |  |
| updatedAt | Modifié le | date-heure |  |

Index : status, createdAt

#### PaymentEvent · table `payment_events` · Événement reçu de FedaPay (webhook)
Gardé pour ne jamais traiter deux fois le même.

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| provider | Prestataire | texte | défaut "FEDAPAY" |
| providerEventId | Identifiant de l'événement | texte? | unique |
| name | Type | texte | transaction.approved, .declined, .canceled… |
| providerTransactionId | Transaction FedaPay | texte |  |
| paymentId | Paiement | uuid? | → Payment |
| payload | Contenu reçu | JSON |  |
| signatureValid | Signature valide | booléen | X-FEDAPAY-SIGNATURE |
| receivedAt | Reçu le | date-heure |  |
| processedAt | Traité le | date-heure? |  |
| error | Erreur | texte? |  |

Index : providerTransactionId

#### WaitlistEntry · table `waitlist_entries` · Liste d'attente (zone complète)

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| zoneId | Zone | uuid | → Zone |
| posId | Point de vente | uuid | → PointOfSale |
| plan | Formule souhaitée | enum AdPlan |  |
| wantedStart | Début souhaité | date |  |
| wantedEnd | Fin souhaitée | date |  |
| status | Statut | enum WaitlistStatus | défaut WAITING |
| offeredAt | Place proposée le | date-heure? |  |
| offerExpiresAt | Offre valable jusqu'au | date-heure? | 48 h |
| createdAt | Inscrit le | date-heure |  |

#### SubscriptionLaunch · table `subscription_launches` · Activation des abonnements
Un clic sur « Activer les abonnements ».

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| activatedById | Activé par | uuid | → User (sans clé étrangère) |
| activatedAt | Activé le | date-heure |  |
| minVendorAgeDays | Ancienneté minimale | entier | 30 ou 60 jours |
| noticeDays | Préavis | entier | 3, 7 ou 14 jours |
| channels | Canaux | enum NoticeChannel [ ] |  |
| messageTemplate | Modèle du message | texte | copie |
| vendorsNotified | Vendeurs prévenus | entier | défaut 0 |
| deactivatedAt | Désactivé le | date-heure? |  |
| deactivatedById | Désactivé par | uuid? | → User (sans clé étrangère) |
| deactivationReason | Motif de désactivation | texte? |  |

#### VendorNotice · table `vendor_notices` · Message envoyé à un vendeur (annonce, rappel, reçu)

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| vendorId | Vendeur | uuid | → Vendor |
| launchId | Activation | uuid? | → SubscriptionLaunch |
| kind | Sorte | enum NoticeKind |  |
| channel | Canal | enum NoticeChannel |  |
| status | Statut | enum NoticeStatus | défaut QUEUED |
| body | Texte envoyé | texte |  |
| providerRef | Identifiant du message | texte? |  |
| error | Erreur | texte? |  |
| createdAt | Créé le | date-heure |  |
| sentAt | Envoyé le | date-heure? |  |

Index : vendorId, kind

### 4.10 Administration

#### AuditLog · table `audit_logs` · Journal d'audit
Qui a fait quoi, avant et après (lecture seule).

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| id | Identifiant | uuid | clé |
| actorId | Auteur | uuid? | → User (sans clé étrangère), vide = système, FedaPay |
| actorRole | Rôle de l'auteur | enum Role? |  |
| action | Action | texte | ex. dish.publish, subscriptions.activate |
| entityType | Objet modifié | texte |  |
| entityId | Identifiant de l'objet | uuid |  |
| before | Avant | JSON? |  |
| after | Après | JSON? |  |
| ipHash | IP chiffrée | texte? |  |
| createdAt | Le | date-heure |  |

Index : entityType, entityId · Index : actorId, createdAt

#### Setting · table `settings` · Paramètre (les clés secrètes FedaPay restent dans les variables d'environnement)

| Champ | Nom français | Type | Notes |
| --- | --- | --- | --- |
| key | Clé | texte | clé |
| value | Valeur | JSON |  |
| updatedById | Modifié par | uuid? | → User (sans clé étrangère) |
| updatedAt | Modifié le | date-heure |  |

### 4.11 Listes de valeurs (enums)

| Liste | Valeurs (français) |
| --- | --- |
| Role (Rôle (cumulables)) | `CLIENT` client · `VENDOR` vendeur · `FIELD_AGENT` agent terrain · `ADMIN` admin · `SUPER_ADMIN` super-admin |
| PosType (Type de point de vente) | `PARTICULIER` particulier (vente en ligne) · `MAQUIS` maquis (étals compris) · `RESTAURANT` restaurant |
| PosStatus (Statut d'un point de vente (aucune validation : publié directement)) | `PUBLISHED` publié · `PENDING` en attente (invisible pour les clients) · `SUSPENDED` suspendu par un admin · `ARCHIVED` archivé |
| DishStatus (Statut d'un plat (aucune validation : publié directement)) | `PUBLISHED` publié · `PENDING` en attente (invisible pour les clients) |
| MealMoment (Moment du repas) | `BREAKFAST` petit-déjeuner · `LUNCH` déjeuner · `DINNER` dîner · `ALL_DAY` toute la journée |
| HolidayPolicy (Jours fériés) | `OPEN` ouvert · `CLOSED` fermé · `UNKNOWN` inconnu |
| DayStatusSource (Origine d'une exception du jour) | `TEAM` équipe · `VENDOR` vendeur · `CLIENT_REPORTS` signalements de clients · `AUTO` automatique |
| ClaimStatus (Statut d'une demande de rattachement) | `PENDING` en attente · `APPROVED` acceptée · `REJECTED` refusée · `EXPIRED` expirée |
| MediaOwner (Objet auquel une photo est rattachée) | `POS` point de vente · `DISH` plat · `USER` profil · `REVIEW` avis · `REPORT` signalement |
| MediaStatus (Statut d'une photo) | `PROCESSING` en traitement · `READY` prête · `REJECTED` refusée |
| ContactChannel (Canal de contact) | `WHATSAPP` WhatsApp · `CALL` appel |
| ContactSource (Écran d'où vient un contact) | `HOME` accueil · `SEARCH` recherche · `MAP` carte · `DISH_PAGE` page du plat · `POS_PAGE` page du point de vente · `FAVORITES` favoris · `QR` QR code · `PUSH` notification |
| FollowUpAnswer (Réponse au suivi) | `YES` oui · `NOT_YET` pas encore · `NO` non |
| OrderItemOrigin (Origine d'un plat commandé) | `DISH_BUTTON` bouton du plat (automatique) · `DECLARED` déclaré par le client (« Tu as pris quoi ? ») |
| ReviewStatus (Statut d'un avis) | `PUBLISHED` publié · `HIDDEN` masqué · `REMOVED` retiré |
| ReportTarget (Cible d'un signalement) | `POS` point de vente · `DISH` plat · `REVIEW` avis · `USER` utilisateur |
| ReportReason (Motif d'un signalement) | `WRONG_INFO` information fausse · `WRONG_PRICE` prix faux · `CLOSED_TODAY` fermé aujourd'hui · `WRONG_HOURS` horaires faux · `CLOSED_PERMANENTLY` fermé définitivement · `NO_ANSWER` ne répond pas · `FAKE_REVIEW` faux avis · `FOOD_SAFETY` hygiène, sécurité alimentaire · `INAPPROPRIATE` contenu choquant · `FRAUD` arnaque · `OTHER` autre |
| ReportStatus (Statut d'un signalement) | `OPEN` ouvert · `RESOLVED` résolu · `REJECTED` rejeté |
| AdPlan (Formule de pub (abonnement)) | `DAY` un jour (3 zones) · `PERIOD` période de 2 à 21 jours, dates de début et de fin (5 zones) · `MONTH` un mois (30 jours, 7 zones) · `PREMIUM` Premium (30 jours, 15 zones, passe devant les abonnés normaux) |
| OrderStatus (Statut d'une commande de pubs) | `PENDING_PAYMENT` en attente de paiement · `PAID` payée · `EXPIRED` expirée (pas payée à temps) · `CANCELLED` annulée · `REFUNDED` remboursée |
| SubscriptionStatus (Statut d'une pub (abonnement d'un point de vente)) | `PENDING_PAYMENT` en attente de paiement · `PAID` payée (en cours ou à venir selon les dates) · `ENDED` terminée · `CANCELLED` annulée · `EXPIRED` expirée (pas payée à temps) · `REFUNDED` remboursée |
| PaymentMethod (Moyen de paiement (FedaPay)) | `MTN` MTN Mobile Money · `MOOV` Moov Money · `CELTIIS` Celtiis Cash · `CARD` carte bancaire · `OTHER` autre moyen FedaPay |
| PaymentStatus (Statut d'un paiement) | `PENDING` en attente · `APPROVED` approuvé · `DECLINED` refusé · `CANCELED` annulé · `EXPIRED` expiré · `REFUNDED` remboursé |
| PaymentOrigin (D'où le paiement a été lancé) | `VENDOR_APP` espace vendeur · `PAYMENT_LINK` lien envoyé par l'équipe |
| WaitlistStatus (Statut d'une inscription en liste d'attente) | `WAITING` en attente · `OFFERED` place proposée · `CONVERTED` payée · `EXPIRED` expirée · `LEFT` retirée |
| NoticeChannel (Canal d'un message au vendeur) | `WHATSAPP` WhatsApp (API WhatsApp Business) · `EMAIL` e-mail · `IN_APP` espace vendeur |
| NoticeKind (Sorte de message au vendeur) | `ANNOUNCEMENT` annonce des abonnements · `REMINDER` rappel · `LAST_DAY` dernier jour du préavis · `NOTICE_ENDED` fin du préavis · `RECEIPT` reçu de paiement |
| NoticeStatus (Statut d'un message au vendeur) | `QUEUED` en file · `SENT` envoyé · `DELIVERED` reçu · `FAILED` échec · `SKIPPED` ignoré |
| NotificationType (Type de notification dans l'appli) | `FAVORITE_SPECIAL` plat du jour d'un favori · `FOLLOW_UP` suivi « t'a-t-il répondu ? » · `PAYMENT_APPROVED` paiement réussi · `PAYMENT_FAILED` paiement échoué · `SUBSCRIPTION_NOTICE` annonce des abonnements · `SUBSCRIPTION_ENDING` fin de pub proche · `REVIEW_RECEIVED` nouvel avis · `REPORT_RESOLVED` signalement traité · `SYSTEM` système |


---
## 5. Rôles, permissions et périmètre

### 5.1 Rôles

| Rôle | Attribution | Ce qu'il fait |
|---|---|---|
| Visiteur | aucun compte | consulte tout (navigation, carte, pages, QR code) |
| `CLIENT` | automatique à l'inscription | contacte, favoris, suivi de réponse, avis, signalement |
| `VENDOR` | à la création de son premier point de vente, ou au rattachement à un `Vendor` créé par l'équipe (section 14) | gère **lui-même** ses points de vente : infos, menu, plats du jour, horaires, fermetures, QR code ; voit ses stats ; achète et paie ses pubs (FedaPay) ; répond aux avis |
| `FIELD_AGENT` | par le super-admin, avec **une ou plusieurs zones** (`AgentZone`) | crée et gère les vendeurs et points de vente de ses zones (mêmes gestes que le vendeur) ; envoie un lien de paiement à un vendeur ; messages tests |
| `ADMIN` | par le super-admin | tout ce que fait l'agent, **sur toutes les zones** ; modère (suspendre, archiver, masquer un avis) ; signalements ; zones, catégories, prix, places ; offre un essai (7 jours) |
| `SUPER_ADMIN` | seed initial (`SUPER_ADMIN_PHONE` / `SUPER_ADMIN_EMAIL`) | tout, sur toutes les zones, dont rôles et permissions, remboursements, paramètres, activation des abonnements |

**Tout le monde a un compte** (même table `User`, même connexion) ; les rôles se **cumulent** (`roles: Role[]`) : un vendeur est aussi client ; un agent peut être vendeur de son propre maquis. Jamais d'auto-attribution d'un rôle d'équipe. Les comptes d'équipe n'ont pas `CLIENT` par défaut et leurs contacts ne comptent jamais.

Conflit d'intérêts : un membre de l'équipe qui est aussi vendeur **ne peut pas** offrir un essai, rembourser ni modifier le classement de ses propres points (contrôle `vendor.userId !== actor.id`), ni répondre aux suivis et avis les concernant.

**Où chacun travaille**
| Rôle | Interface |
|---|---|
| Visiteur, Client | application client (écrans 1–3, 10–14, 22 ; D1–D8) |
| Vendeur | **espace vendeur** `/vendeur` (écrans 4, 7, 8, 15, 15b, 15c, 16, 17, 17b, 18, 19 ; VD1–VD7), mobile d'abord |
| Agent, Admin, Super-admin | **dashboard** `/dashboard` (DB1–DB12, DB1b, DB1c), desktop d'abord **et** utilisable sur téléphone (DM1–DM5, écrans 6 et 9). Le menu dépend des permissions (un agent ne voit que ses zones). |

### 5.2 Matrice (valeurs par défaut de `RolePermission`, modifiables par le super-admin dans DB7)

| Permission | CLIENT | VENDOR | FIELD_AGENT | ADMIN | SUPER_ADMIN |
|---|---|---|---|---|---|
| `pos.read.public` | ✓ (visiteur aussi) | ✓ | ✓ | ✓ | ✓ |
| `contact.create` | ✓ | ✓ (non compté sur ses propres points) | non compté | non compté | non compté |
| `favorite.manage`, `followup.answer`, `report.create`, `review.create` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `vendor.create`, `pos.create` (publié directement) | ✗ | ✓ ses points | ✓ ses zones | ✓ | ✓ |
| `pos.update`, `dish.manage` (publier, mettre en attente, épuiser, supprimer), `special.manage`, `hours.manage`, `qr.read` | ✗ | ses points | ses zones | ✓ | ✓ |
| `pos.stats.read` | ✗ | ses points | ses zones | ✓ | ✓ |
| `stats.share` (lien de rapport) | ✗ | ses points | ses zones | ✓ | ✓ |
| `review.reply` | ✗ | ses points | ✗ | ✓ | ✓ |
| `subscription.buy` (commande + paiement FedaPay) | ✗ | ses points | ✗ | ✗ | ✗ |
| `payment.link.send` (préparer une commande et envoyer le lien au vendeur) | ✗ | ✗ | ✓ ses zones | ✓ | ✓ |
| `subscription.complimentary` (essai offert, 7 jours) | ✗ | ✗ | ✗ | ✓ | ✓ |
| `payment.refund` | ✗ | ✗ | ✗ | ✗ | ✓ |
| `pos.moderate` (suspendre, archiver), `review.moderate`, `report.resolve` | ✗ | ✗ | ✗ | ✓ | ✓ |
| `responsetest.create` | ✗ | ✗ | ✓ ses zones | ✓ | ✓ |
| `geo.manage`, `pricing.manage`, `slots.manage` | ✗ | ✗ | lecture ses zones | ✓ | ✓ |
| `user.manage` (voir, bloquer ; numéros clients masqués) | ✗ | ✗ | ✗ | ✓ | ✓ |
| `role.assign`, `permission.manage`, `settings.manage` | ✗ | ✗ | ✗ | ✗ | ✓ |
| `subscriptions.toggle` (activer / désactiver les abonnements, relancer, 11.0) | ✗ | ✗ | ✗ | si accordé (DB7) | ✓ |
| `subscriptions.read` (carte DB1 / DB1c, suivi des messages) | ✗ | ✗ | ses zones | ✓ | ✓ |
| `audit.read`, `media.read` | ✗ | ✗ | ✗ | ✓ | ✓ |

### 5.3 Implémentation
- `@RequirePermission(...)` + `PermissionsGuard` global ; liste des permissions dans `frontend/src/shared/permissions.ts` ; valeurs accordées lues dans `RolePermission` (cache Redis 60 s, invalidé à chaque modification).
- `ScopeService.assertPos(user, posId, perm)` :
  - `VENDOR` : `pos.vendor.userId === user.id`.
  - `FIELD_AGENT` : `pos.zoneId ∈ agentZones(user)` (une ou plusieurs zones).
  - `ADMIN` / `SUPER_ADMIN` : toutes les zones, sans ligne dans `AgentZone`.
- **Gestion partagée** : le vendeur et les agents de la zone modifient le même point de vente. Pas de verrou : chaque modification enregistre son auteur (`updatedById`, `AuditLog`) et passe par un contrôle de version (`version`, refus `409 VERSION_CONFLICT` si la fiche a changé entre la lecture et l'écriture).
- **Aucune validation** : toute modification d'un ayant droit est publiée immédiatement (nom, type, position, numéros, menu, prix, plats du jour, horaires). Seul un admin peut **suspendre** ou **archiver** un point (modération, signalement).
- Masquage des numéros des **clients** pour tout le monde sauf `SUPER_ADMIN` (`+229 01 •• •• •• 47`). Les numéros des **vendeurs** sont visibles par l'équipe.
- Interrupteur de secours `vendorSelfService` (Setting, défaut `true`) : s'il passe à `false`, l'espace vendeur devient lecture seule (en cas d'abus).

---

## 6. Authentification

- Navigation sans compte. Compte requis pour : contacter, favoris, répondre au suivi, laisser un avis, signaler, payer une pub. Le front ouvre la feuille d'inscription (écran 3 / D5) puis **reprend l'action** (`pendingAction` en sessionStorage).
- Google OIDC ; téléphone + mot de passe (≥ 6 caractères, liste noire des plus courants, argon2id).
- Pas d'OTP SMS en V1 (interface `OtpProvider` prête). Mot de passe oublié : demande traitée par un admin (vérification par appel) → lien à usage unique 30 min.
- Équipe (`FIELD_AGENT`, `ADMIN`, `SUPER_ADMIN`) : **TOTP obligatoire** (`User.totpSecret` chiffré, `totpEnabledAt`), sessions de 12 h ; ré-authentification TOTP de moins de 10 min pour les actions sensibles (activation des abonnements, remboursement, rôles).
- Limites : 5 tentatives / 15 min / téléphone et / IP.
- `X-Device-Id` : UUID généré au premier lancement (localStorage), utilisé par l'anti-fraude.
- Nom complet demandé (bannière non bloquante) après 3 contacts.

---

## 7. Géographie, zones et catégories

### 7.1 Hiérarchie
`Country → City → ZoneCategory (A/B/C) → Zone (polygone) → Neighborhood`. Seuls les éléments actifs sont visibles côté client. Une zone appartient à **une** catégorie ; la catégorie fixe les **prix des pubs** (via `PriceGrid` : le **prix d'un jour**, par type de point de vente ; Période, Mois et Premium se calculent depuis ce prix) et le **nombre de places par jour** par défaut ; chaque zone peut surcharger l'un ou l'autre (`priceOverride`, `dailySlotsOverride`).

### 7.2 Zones et proximité
Il n'y a **plus** de notion de zones voisines. Un vendeur peut cibler **n'importe quelles zones** actives de sa ville avec une pub (3, 5, 7 ou 15 au plus selon la formule). Pour la recherche, les points proches d'une autre zone sont trouvés **à la distance** (`search.nearbyRadiusMeters`, 1 500 m par défaut), pas par une liste de voisines.

### 7.3 Zone du client
1. Géolocalisation acceptée → `ST_Covers(boundary, point)` ; hors zones → zone la plus proche + message.
2. Sinon sélecteur (zones + quartiers, recherche `unaccent` + `aliases`).
3. Mémoriser (localStorage + `User.homeZoneId`).

### 7.4 Zone d'un point de vente
Calculée depuis `location` à chaque création/déplacement. Hors de toute zone → publication refusée (`POS_OUTSIDE_ZONES`) sauf forçage admin. Modifier un polygone → job de recalcul. Les pubs ne dépendent pas de la zone du point (elles ciblent des zones choisies) : un déplacement ne change pas une pub payée.

---

## 8. Recherche, accueil et classement

### 8.1 Requête
Paramètres : `zoneId` (obligatoire), `lat/lng` (option), `budgetMax`, `moment` (déduit de l'heure : 5h–10h30 petit-déj, 10h30–16h déjeuner, 16h–23h dîner), `q`, `categoryId` (pastilles de plats), `type`, `openNow` (défaut vrai), `cursor`.
Unité de résultat : **un plat** (carte de plat avec son point de vente) ; un point de vente apparaît au plus une fois par page, avec son plat le plus pertinent (plat du jour dans le budget, sinon le moins cher dans le budget).

Filtres : point `PUBLISHED` ; zone active ; plat `PUBLISHED`, non supprimé, non épuisé aujourd'hui, `≤ budgetMax`, compatible avec le moment ; statut d'ouverture selon `getOpenStatus` (12.4) ; texte par trigrammes sur nom du point, plats, quartiers.

Périmètre : points de vente **de la zone** + points **qui ont une pub payée ciblant cette zone aujourd'hui** (où qu'ils soient) + points d'autres zones à moins de `search.nearbyRadiusMeters` du client (après ceux de la zone).

### 8.2 Classement
Chaque point reçoit d'abord une **classe de visibilité** (fonction partagée `getVisibilityClass(pos, vendor, zoneId, date)` dans `frontend/src/shared/visibility.ts`, voir 11.0) :
- `PREMIUM` : pub Premium `PAID` qui cible cette zone ce jour-là (`ZoneDaySlot` existant) ;
- `PROMOTED` : pub Un jour, Période ou Un mois `PAID` qui cible cette zone ce jour-là ;
- `STANDARD` : visibilité normale (abonnements désactivés, vendeur récent, vendeur en préavis, ou vendeur sur liste d'attente faute de place) ;
- `REDUCED` : vendeur concerné, préavis terminé, point **sans** pub payée en cours.

Paliers dans l'ordre :
1. `PREMIUM` dans cette zone aujourd'hui (les Premium **passent devant** les abonnés normaux).
2. `PROMOTED` dans cette zone aujourd'hui.
3. `STANDARD` de la zone.
4. `STANDARD` proches (autres zones, à moins de `search.nearbyRadiusMeters`).
5. `REDUCED` de la zone puis proches.

Pendant le lancement gratuit (`subscriptions.enabled = false`), il n'existe pas de `REDUCED` et les paliers 1 et 2 ne contiennent que les pubs **offertes** actives (s'il y en a).

Exceptions pour `REDUCED` (le point reste trouvable) :
- recherche par nom : si `q` ressemble au nom du point (similarité trigramme ≥ 0,6), le palier est ignoré ;
- sa page `/p/[slug]`, ses pages de plats, son QR code et les favoris fonctionnent normalement ; la notification « plats du jour des favoris » est envoyée comme pour les autres ;
- s'il y a moins de 10 résultats dans les paliers 1 à 4, les `REDUCED` complètent la liste sans autre pénalité.

Dans chaque palier :
```
score = 0.40 * proximité      // 1 - min(distance_m, 3000)/3000 ; 0.5 sans position
      + 0.20 * fraîcheur      // 1 si prix vérifiés < 3 j → 0 à 14 j
      + 0.15 * réponse        // responseRate (section 9) ; 0.7 par défaut si < 5 retours
      + 0.15 * platDuJour     // 1 si plat du jour publié aujourd'hui
      + 0.10 * complétude     // photos façade + plats, horaires, repère
```
- Prix non vérifiés depuis > 14 jours → `score × 0,5` et exclusion des 10 premiers du palier 3.
- `responseRate < 0,5` sur ≥ 5 retours → `score × 0,6` (le point reste visible).
- La note des avis (`ratingAvg`, seulement si `ratingCount ≥ 5`) n'entre **pas** dans le score en V1 : elle est affichée, pas utilisée pour classer.
- **Rotation équitable des paliers 1 et 2** : tri par `hash(subscriptionId + businessDate + zoneId)`, puis léger mélange par client `hash(deviceId + date)`. Test : aucun point payé dernier plus de 2 jours de suite sur 10 clients simulés.
- Badge « Mis en avant » (jaune `mais`) sur chaque carte des paliers 1 et 2.
- Chaque affichage incrémente `impressions` (et `promotedImpressions` pour les paliers 1 et 2).
- La classe est calculée **à la requête** ; elle change à minuit, à la fin d'un préavis, et dès qu'un paiement est approuvé. Cache Redis : la clé inclut la date métier et `subscriptions.version`.

### 8.3 Carte (écran 11 ; colonne de droite sur desktop D1)
- Même moteur et mêmes filtres que la liste : la carte n'est **qu'une autre vue** du même résultat. Basculer liste ↔ carte garde les filtres.
- Leaflet + tuiles OpenStreetMap (en production, fournisseur de tuiles ou serveur propre ; URL dans `MAP_TILE_URL`). Attribution OSM visible.
- Marqueurs = **étiquettes de prix** (prix du plat le plus pertinent) :
  - pub dans la zone (Premium ou normale) : fond jaune `mais` ;
  - sélectionné : fond `piment`, texte blanc, plus grand ;
  - normal : fond blanc, prix vert ;
  - fermé : gris « Fermé » (seulement si « ouvert maintenant » est désactivé) ;
  - classe `REDUCED` : **petit point gris sans prix** (12 px) ; le prix apparaît au clic. Légende : « Prix du plat », « Mis en avant », « Autres points » (maquette D1).
- Point d'un particulier sans lieu public : `publicPoint` (décalé), dessiné en cercle (12.5).
- Regroupement au-delà de 30 marqueurs visibles : pastille noire avec le nombre ; un clic zoome.
- Position du client : point bleu + cercle de précision ; bouton « Me localiser ».
- Toucher un marqueur ouvre une **carte résumé** (photo, plat, prix, distance, statut, « Voir le plat ») ; elle compte une vue légère.
- « Rechercher quand je déplace la carte » (activé par défaut sur desktop, bouton sur mobile) : requête par boîte englobante (`bbox`) limitée à 200 résultats, même classement.
- Desktop : liste et carte synchronisées (survol).
- Endpoint : `GET /api/v1/map?bbox=&budgetMax=&moment=&openNow=` → `[{ posId, dishId, slug, dishSlug, lat, lng, price, label, visibilityClass, openState }]` (< 30 Ko pour 200 points), cache Redis 60 s par bbox arrondie.
- Hors connexion : dernier résultat en cache, sans tuiles nouvelles.

Performance : SQL brut PostGIS ; cache Redis 60 s par `(zoneId, moment, budgetBucket, openNow, date)` ; p95 < 300 ms.

---
## 9. Contacts mesurés, suivi des réponses et avis

### 9.1 Flux d'un contact
**Deux sortes de boutons, à ne jamais mélanger** :
| Bouton | Où | `dishId` | Message pré-rempli | Suivi (9.5) |
|---|---|---|---|---|
| « Commander ce plat » / « Appeler pour ce plat » | page du plat (22, D8), carte d'un plat (accueil, carte, favoris, recherche), ligne d'un plat dans le menu du point de vente | **le plat** | cite le plat et son prix | « t'a-t-il répondu ? » **seulement** |
| « Écrire au vendeur » / « Appeler » | page du point de vente (2, D2), uniquement | `null` | sans plat | « t'a-t-il répondu ? » **puis**, après « Oui », « Tu as pris quoi ? » |

Parcours normal : le client touche un plat (n'importe où) → **page du plat** (sans emplacement) → il commande ce plat. Il ne passe par la page du point de vente que s'il veut voir l'emplacement, les horaires ou tout le menu.

1. Clic sur un des boutons ci-dessus (connexion requise, reprise après inscription).
2. `POST /contacts { posId, channel, dishId?, source, viewerZoneId }` (`source` : `HOME`, `SEARCH`, `MAP`, `DISH_PAGE`, `POS_PAGE`, `FAVORITES`, `QR`, `PUSH`). `dishId` est obligatoire pour les boutons de plat et interdit pour les boutons du point de vente (400 sinon) ; le plat doit appartenir au point de vente, être publié et non épuisé.
3. API : point de vente publié ? → règles de comptage (9.2) → `ContactEvent` (+ `subscriptionId` si l'affichage venait d'une pub payée en cours dans la zone du client) → compteurs Redis → création d'un `ContactFollowUp` vide si `isCounted`, avec `askDish = (dishId == null)` → renvoie l'URL :
   - `https://wa.me/<numéro sans +>?text=<message encodé>` ;
   - `tel:+229…`.
4. Le front ouvre l'URL (timeout 1,5 s ; en cas d'échec réseau, ouvrir quand même et rejouer l'enregistrement via Background Sync).

### 9.2 Règles de comptage
- Dédoublonnage : même `userId` + `posId` + `channel` → une fois par 30 min (clé Redis TTL 1800 s).
- Plafond : > 20 contacts comptés / 24 h pour un client → suivants non comptés + alerte.
- Non comptés : comptes d'équipe ; compte rattaché au vendeur du point de vente.
- Appareil avec > 3 comptes différents en 24 h → contacts de ces comptes non comptés + alerte.
- Les événements non comptés sont **conservés** (`notCountedReason`, audit).

### 9.3 Message pré-rempli
```
Bonjour {posName}, je vous ai trouvé sur OKARE. {dishLine}Qu'est-ce que vous avez aujourd'hui ?
```
`{dishLine}` = `Je suis intéressé(e) par « {dishName} » ({price} F). ` si le contact vient d'un bouton de plat. Configurable, jamais retiré : c'est la preuve visible pour le vendeur.

### 9.4 Quel plat le client commande-t-il ?
Deux mesures complémentaires, à ne jamais confondre dans l'interface :
1. **Plat choisi (automatique)** : tout contact parti d'un bouton de plat enregistre `dishId` + instantanés (nom, prix, catégorie). On **ne redemande pas** au client ce qu'il a pris : un `ContactOrderItem` (origine `DISH_BUTTON`) est créé automatiquement pour ce plat quand il répond « Oui » au suivi.
2. **Contact du point de vente (déclaratif)** : seulement pour les contacts partis de « Écrire au vendeur » / « Appeler » (`dishId = null`). Après « Oui », question facultative « Tu as pris quoi ? » avec les plats du menu au moment du contact (plusieurs choix) + « Autre chose » → `ContactOrderItem` (origine `DECLARED`). Sans réponse : « plat non précisé ».

Rapports (écran 4, rapport partagé, dashboard), sur une période (par défaut le mois en cours) :

| Indicateur | Définition |
|---|---|
| Contacts | `ContactEvent` comptés |
| Clients uniques | `COUNT(DISTINCT userId)` sur ces contacts |
| Contacts par plat | regroupés par `dishId` (nom actuel, ou instantané si supprimé) ; « plat non précisé » à part |
| Commandes confirmées par plat | contacts avec « Oui » au suivi, regroupés par plat (plat du bouton, ou plats déclarés) |
| Taux de confirmation | contacts avec au moins une commande / contacts |

- **Par point de vente** : par `dishId`. **Par vendeur** (tous ses points) : par `DishCategory`, sinon par nom normalisé. **Par zone et ville** (dashboard) : plats les plus demandés par catégorie et tranche de prix.
- Libellés honnêtes : « 300 contacts, dont 162 commandes confirmées », jamais « 300 ventes ».
- Agrégats quotidiens dans `PosDishDailyStat` (job de nuit), jour courant dans Redis.

### 9.5 « Le vendeur t'a-t-il répondu ? » (écrans 10 et 10b, D6 et D6b)
OKARE **ne peut pas lire** les conversations WhatsApp. Le taux de réponse est donc estimé par trois sources :

**a) Question au client**
- Déclenchement : au **prochain retour** du client dans l'appli, si un `ContactFollowUp` sans réponse existe avec un contact datant de **10 min à 48 h**. Un seul suivi affiché à la fois (le plus récent). Jamais pendant la première minute suivant un nouveau contact.
- Réponses : **Oui** / **Pas encore** / **Non, aucune réponse**. « Pas encore » → redemander une seule fois, au moins 3 h plus tard. Ignoré deux fois → abandon.
- Après « Oui » : contact d'un bouton de plat (écran 10, D6) → rien d'autre à demander, le plat est rappelé en tête ; contact du point de vente (écran 10b, D6b) → « Tu as pris quoi ? » (9.4). Puis invitation à **laisser un avis** (9.6) et à ajouter le point aux favoris.
- Après « Non » : proposer 2 autres points de vente proches, dans le même budget.
- Option dans le compte : « Ne plus me demander » (`User.askFollowUp = false`).

**b) Signalement « Pas de réponse »** depuis la page du point de vente (compte comme un « Non »).

**c) Messages tests** : un agent peut envoyer un message WhatsApp test à un point de vente de ses zones et enregistrer le délai de réponse (`ResponseTest`) ; sans réponse sous 2 h = « Non ».

**Calcul** (job horaire) :
```
responseRate = YES / (YES + NO)   sur les 10 derniers retours (a + b + c) des 60 derniers jours
```
Moins de 5 retours → `responseRate = null` (neutre dans le classement).

**Effets** :
- `responseRate < 0,5` avec ≥ 5 retours → pénalité de classement (8.2) et alerte dans le dashboard (liste « Réponse basse » de DB2, filtrable par zone) ; l'agent de la zone peut appeler le vendeur.
- Toujours < 0,3 après échange avec le vendeur → un admin peut **suspendre** (motif obligatoire). Jamais de suspension automatique pour ce motif.
- Un point qui a une pub payée en cours avec `responseRate < 0,5` apparaît en tête de cette liste (on ne veut pas vendre de la visibilité à un vendeur qui ne répond pas sans le prévenir).

### 9.6 Avis clients
- **Qui** : seul un client qui a un contact compté avec ce point de vente et qui a répondu **« Oui »** au suivi peut laisser un avis, **un seul par contact** (`Review.contactId` unique). Fenêtre : jusqu'à 14 jours après le « Oui ».
- **Quoi** : note de 1 à 5 étoiles (obligatoire), commentaire de 0 à 500 caractères, photo facultative (`Media` avec `ownerType = REVIEW`). Si le contact venait d'un bouton de plat, l'avis est aussi rattaché au plat (`dishId`).
- **Publication immédiate** (`PUBLISHED`), sans relecture préalable. Filtre automatique de mots interdits (liste dans `Setting`) : si un mot est trouvé, l'avis est publié sans le commentaire.
- **Affichage** : la note moyenne et les avis ne sont visibles **qu'à partir de 5 avis publiés** (`reviews.minToDisplay`) sur le point de vente. En dessous : « Pas encore assez d'avis ». Page du point de vente : note, nombre d'avis, 3 derniers avis, lien « Tous les avis ». Page du plat : avis rattachés à ce plat, mêmes règles (5 avis sur le plat).
- `PointOfSale.ratingAvg` et `ratingCount` sont recalculés à chaque avis publié, masqué ou supprimé.
- **Réponse du vendeur** : une réponse publique par avis (`vendorReply`), modifiable.
- **Modération** : tout client peut signaler un avis (`Report` avec `targetType = REVIEW`, motif `FAKE_REVIEW` ou `INAPPROPRIATE`). Un admin peut masquer (`HIDDEN`, motif) ou supprimer (`REMOVED`). Le vendeur ne peut **pas** supprimer un avis.
- Les avis n'entrent pas dans le score de classement en V1 (8.2).

### 9.7 Signalements
- Cibles : point de vente, plat, avis, utilisateur (`ReportTarget`). Motifs : `ReportReason` (infos fausses, prix faux, fermé aujourd'hui, horaires faux, fermé définitivement, pas de réponse, faux avis, problème de santé, contenu inapproprié, arnaque, autre).
- Un même client ne peut faire qu'**un** signalement par cible, par motif et par jour (contrainte unique).
- Effets automatiques : `CLOSED_TODAY` → 12.4 ; `NO_ANSWER` → 9.5 b ; `FRAUD`, `FOOD_SAFETY`, `INAPPROPRIATE` → la cible est **masquée immédiatement** en attendant un admin ; autres motifs : 3 signalements distincts en 7 jours (hors équipe et comptes < 24 h) → la cible passe en tête de la liste DB9, sans masquage.
- Traitement dans DB9 (admin) : résolu ou rejeté, avec texte ; le client est notifié (`REPORT_RESOLVED`).

---

## 10. Statistiques et rapport au vendeur

- Temps réel (jour en cours) dans Redis : `views` (HyperLogLog par `deviceId|userId`), `dishViews`, `impressions`, `promotedImpressions`, `qrScans`, `whatsapp`, `calls`.
- Job 00:15 heure locale : écriture de `PosDailyStat` et `PosDishDailyStat` pour la veille ; purge Redis > 2 jours.
- Écran 4 : contacts de la semaine, vues, messages, appels, histogramme 7 j, comparaison à la semaine précédente, taux de réponse, contacts par plat, et, s'il a une pub, **contacts venus de la pub** (`ContactEvent.subscriptionId`).
- **Rapport partageable** : le vendeur ou l'équipe génère un `StatsShareLink` (jeton aléatoire, valable 30 jours, révocable) → page publique `/r/{token}` en lecture seule, sans connexion, avec un bouton « Envoyer sur WhatsApp ». C'est l'outil pour **montrer les chiffres** à un vendeur et lui proposer une pub.
- Dashboard : par zone et par jour (contacts, points de vente actifs, pubs en cours, revenus encaissés par FedaPay), plats les plus demandés, export CSV. Liste filtrable « Points à fort potentiel » : au moins 5 contacts comptés la semaine passée et aucune pub en cours (seuil `prospect.minWeeklyContacts`) — une simple vue, pas une tâche.

---
## 11. Pubs (abonnements) et paiement en ligne — **PLUS TARD**

> **Ne pas développer maintenant** (décision du 21/11). On fait d'abord le nécessaire ; les abonnements et le paiement FedaPay viendront quand l'app aura pris de l'ampleur. Cette section reste la référence pour ce moment-là. Écrans concernés, rangés dans la partie « Plus tard » de la maquette : 5, 5b, 20, 21, 23 à 26 (mobile), VDP1, VDP2, VDP3 (vendeur desktop), DB1b, DB1c, DB4 et DM4 (dashboard). Les tables existent dès le départ (la base est complète, section 4) mais aucun écran ni aucune API de cette section n'est fait en V1. En attendant : tous les points de vente ont la même visibilité (classe `STANDARD`, section 8.2), aucune mention d'abonnement, de pub ou de paiement dans l'interface.

### 11.0 Lancement gratuit, puis bouton « Activer les abonnements »
Au démarrage, **personne ne paie** et tous les points de vente ont la même visibilité. Le jour où l'équipe le décide, un admin clique sur **« Activer les abonnements »** sur l'accueil du dashboard (DB1). C'est une action visible, confirmée, auditée, qui **prévient les vendeurs**.

**Qui peut cliquer** : permission `subscriptions.toggle` (SUPER_ADMIN par défaut ; peut être donnée à un ADMIN dans DB7). TOTP de moins de 10 minutes exigé.

**Ancienneté d'un vendeur** : `vendorAgeDays = jours entre Vendor.firstPublishedAt et aujourd'hui (jour métier)`. `firstPublishedAt` = première publication d'un de ses points (posée une fois, jamais modifiée). Un nouveau point d'un vendeur ancien suit le vendeur.

#### a) La carte « Abonnements des vendeurs » (en haut de DB1)
- **Désactivés** (DB1) : badge « Désactivés · lancement gratuit », 3 chiffres calculés en direct (`GET /api/v1/admin/subscriptions/preview?minVendorAgeDays=30`) : vendeurs et points concernés si on active aujourd'hui, vendeurs récents qui restent gratuits, prix moyen d'un mois. Bouton **« Activer les abonnements »** → fenêtre DB1b.
- **Activés** (DB1c) : « Activés le [date] par [nom] », ancienneté choisie, fin du préavis, chiffres (prévenus et échecs par canal, abonnés et montant encaissé, en préavis, moins visibles, prévenus cette semaine), boutons « Voir les vendeurs » (DB8 filtré), « Relancer les non abonnés », « Désactiver ».
- Sans `subscriptions.toggle`, la carte s'affiche sans boutons.

#### b) La fenêtre de confirmation (DB1b)
1. **Quels vendeurs** : « plus d'1 mois » (30 jours) ou « plus de 2 mois » (60 jours), avec le nombre de vendeurs et de points pour chaque choix ; rappel des vendeurs récents qui restent gratuits.
2. **Préavis** : 3, 7 (défaut) ou 14 jours, avec la date (« Jusqu'au jeu. 27/11, rien ne change pour eux »).
3. **Canaux** : WhatsApp, e-mail, espace vendeur (cochés par défaut), avec le nombre de destinataires joignables par canal.
4. **Aperçu du message** pour un vendeur réel, lien « Modifier le modèle » (DB12).
5. **Zones trop petites** : pour chaque zone, `vendeurs concernés` / `places par jour` ; alerte si une zone a plus de concernés que de places (« Ganhi : 24 concernés pour 20 places ») pour augmenter la capacité (DB5) avant d'activer.
6. Bouton « Activer et prévenir [N] vendeurs », désactivé pendant l'envoi ; requête avec `Idempotency-Key`.

#### c) Ce que fait l'activation (`POST /api/v1/admin/subscriptions/activate`, une transaction)
```
refuser si subscriptions.enabled = true (409 ALREADY_ENABLED)
launch = SubscriptionLaunch(minVendorAgeDays, noticeDays, channels, messageTemplate, activatedById)
Setting subscriptions.enabled = true ; minVendorAgeDays ; noticeDays ; subscriptions.version += 1
requiredFrom = début du jour métier (aujourd'hui + noticeDays + 1)        // activé le 20/11, préavis 7 j → 28/11 00:00
pour chaque vendeur avec ≥ 1 point PUBLISHED et vendorAgeDays ≥ minVendorAgeDays :
    vendor.subscriptionNoticeAt = now ; vendor.subscriptionRequiredFrom = requiredFrom
    VendorNotice(kind = ANNOUNCEMENT, launchId) par canal coché et joignable
launch.vendorsNotified = N ; AuditLog("subscriptions.activate")
après COMMIT : envois en file BullMQ « vendor-notices », 30 messages par minute au plus
```

#### d) Vendeurs récents, plus tard (job quotidien 06:00 `subscriptions:newly-concerned`)
Tant que les abonnements sont activés, chaque vendeur qui atteint `minVendorAgeDays` ce jour-là reçoit la même chose (`subscriptionRequiredFrom = aujourd'hui + noticeDays + 1`, message `ANNOUNCEMENT`).

#### e) Rappels automatiques (même job)
- **J-2** avant `subscriptionRequiredFrom` : `REMINDER` aux vendeurs encore sans pub payée.
- **J-1** : `LAST_DAY`.
- **Jour J** : `NOTICE_ENDED` (« ton point est maintenant moins visible ; il redevient normal dès ta pub payée »).
- « Relancer les non abonnés » (DB1c, `POST /api/v1/admin/subscriptions/remind`) : au plus une relance par vendeur toutes les 72 h.
- Jamais plus d'un message OKARE par jour à un même vendeur (reçus de paiement exceptés).

#### f) Classe de visibilité (`getVisibilityClass`, utilisée par 8.2 et 8.3)
```
si le point a une pub PAID de formule PREMIUM qui cible cette zone ce jour-là   → PREMIUM
si le point a une autre pub PAID (DAY, PERIOD, MONTH ou offerte) qui la cible  → PROMOTED
si subscriptions.enabled = false                                                → STANDARD
si vendor.subscriptionRequiredFrom est null ou > maintenant                     → STANDARD   // récent ou en préavis
si le point est sur liste d'attente active (WAITING / OFFERED) faute de place   → STANDARD   // pas de place = pas de pénalité
si le point a une pub PAID en cours, même dans d'autres zones                   → STANDARD
sinon                                                                           → REDUCED
```
La pub est **par point de vente** : un vendeur à 2 points qui n'en paie qu'un a l'autre en `REDUCED`. Un point qui paie une pub sur d'autres zones que la sienne reste `STANDARD` dans sa propre zone (il est abonné) et `PROMOTED`/`PREMIUM` dans les zones ciblées.

#### g) Messages
Modèle unique, modifiable dans DB12, variables : `{prenom}`, `{point}`, `{anciennete}`, `{contacts_mois}`, `{date}`, `{prix_jour}`, `{prix_mois}`, `{prix_premium}`, `{lien}` (prix du point principal du vendeur ciblant sa propre zone, 11.2). Texte par défaut (maquette DB1b) :
> Bonjour {prenom}, merci d'être sur OKARE depuis {anciennete} : {point} a reçu {contacts_mois} contacts le mois dernier. À partir du {date}, la visibilité devient payante. Pour ta zone : {prix_jour} le jour, {prix_mois} le mois. Sans pub, ton point reste sur OKARE mais sera moins visible. Choisis ta pub et paie par Mobile Money : {lien}

Canaux (`VendorNotice`, statuts `QUEUED → SENT → DELIVERED` ou `FAILED` / `SKIPPED`) :
- **WhatsApp** : envoi automatique par l'API WhatsApp Business Platform (Meta) avec un modèle approuvé (`okare_abonnement_annonce`) depuis le numéro officiel OKARE ; statuts de livraison par webhook signé. Tant que l'API n'est pas configurée (`WHATSAPP_CLOUD_TOKEN` absent), ce canal est grisé dans DB1b. Un envoi `FAILED` reste visible dans DB1c avec un bouton « Ouvrir dans WhatsApp » (lien `wa.me` pré-rempli) que l'équipe peut utiliser si elle le souhaite — ce n'est **pas** une tâche.
- **E-mail** : seulement si un e-mail est connu (vendeur ou compte) ; lien de désinscription des messages non essentiels.
- **Espace vendeur** : bandeau + écran 21 / VDP1 avec compte à rebours et bouton « Faire une pub » ; web push si accepté.

#### h) Côté vendeur
- Lancement : écran 20 / VDP1 « Lancement gratuit » (ancienneté, date à laquelle il serait concerné).
- Prévenu, en préavis : écran 21 (« Encore N jours gratuits », prix pour sa zone, bouton « Faire une pub »).
- `REDUCED` : même écran, bandeau « Ton point est moins visible depuis le [date] ».
- Récent : « Gratuit jusqu'au [date] » ; il peut quand même acheter une pub.

#### i) Désactiver (`POST /api/v1/admin/subscriptions/deactivate { reason }`)
`subscriptions.enabled = false` ; `version += 1` ; `SubscriptionLaunch.deactivatedAt` ; tous les `subscriptionRequiredFrom` remis à `null` (plus aucun `REDUCED`) ; commandes `PENDING_PAYMENT` annulées et places libérées ; pubs **payées** gardées jusqu'à leur fin ; messages `QUEUED` → `SKIPPED`. Réactiver plus tard crée une nouvelle `SubscriptionLaunch` et un nouveau préavis.

#### j) Achat pendant le lancement
Tant que `subscriptions.enabled = false`, aucune commande payante (`403 SUBSCRIPTIONS_DISABLED`), contrôle refait à l'approbation du paiement ; seul un admin peut offrir un **essai** (11.9).

### 11.1 Les 4 formules (`AdPlan`)
Une pub concerne **un** point de vente, une formule, des dates et des zones ciblées.

| Formule | Durée | Prix de la pub (avant remise) | Zones au plus |
|---|---|---|---|
| `DAY` — Un jour | 1 jour | somme des prix d'un jour des zones | **3** |
| `PERIOD` — Période | **2 à 21 jours**, choisis avec une date de début et une date de fin | prix d'un jour de la **zone la plus chère** × nombre de jours | **5** |
| `MONTH` — Un mois | 30 jours | prix d'un jour de la **zone la plus chère** × 30 | **7** |
| `PREMIUM` | 30 jours | prix d'un jour de la **zone la plus chère** × 30 × **1,5** ; passe **devant** les autres pubs (palier 1, 8.2) | **15** |

- **Zones ciblées librement** sur l'écran 5b « Zones de ta pub » (mobile) et dans VDP2 (desktop) : n'importe quelles zones actives de la ville, pas forcément celle du point de vente (« comme une pub Facebook »). Au moins 1 zone ; au plus `ads.maxZones.{DAY|PERIOD|MONTH|PREMIUM}` (3, 5, 7, 15) — sinon `400 TOO_MANY_ZONES`. L'écran affiche le compteur (« 3 / 5 »), la catégorie, le prix d'un jour pour le type du point et les places libres de chaque zone ; au maximum atteint, les autres cases sont désactivées et un message propose Un mois (7) ou Premium (15). Changer de formule avec trop de zones demande d'en retirer.
- **Dates** :
  - Un jour : une date. Un mois et Premium : une date de début, la fin est calculée (`début + 29 jours`).
  - Période : **deux champs date** (« Du », « Au »). `days = fin − début + 1` est calculé et affiché tout de suite (« = 7 jours »). Si `days > 21` (`ads.periodMaxDays`) : la date de fin est refusée, avec le message « Une période dure 21 jours au plus. Choisis une date de fin avant le [début + 21], ou prends Un mois. » ; si `days < 2` : « Une période dure au moins 2 jours, sinon prends Un jour. » Le bouton de paiement reste désactivé tant que les dates sont refusées. L'API refait le contrôle (`400 PERIOD_OUT_OF_RANGE`).
  - Début : aujourd'hui (si avant `ads.sameDayCutoffHour`, 15h) ou un jour futur jusqu'à `ads.maxStartAheadDays` (60).

### 11.2 Prix
La grille n'a qu'**un prix par zone : le prix d'un jour**, selon la catégorie de la zone et le type du point de vente. Tout le reste en découle.
```
prixJour(zone, type) = (zone.priceOverride?[type] ?? PriceGrid(zone.categoryId, type)).dayPriceXof
                        (type = posType du point de vente)
plusChère            = max(prixJour(z) pour z dans les zones choisies)
base :
  DAY     = Σ prixJour des zones                 // volontairement plus cher : pousse vers la Période et le Mois
  PERIOD  = plusChère × jours                    // les autres zones sont comprises
  MONTH   = plusChère × 30
  PREMIUM = plusChère × 30 × 1,5                 // ads.premiumCoefficient
remise (ads.discounts) :
                      Un jour   Période   Mois   Premium
  point principal       0 %      10 %     10 %     5 %
  autre point          20 %      20 %     20 %    15 %
total = arrondi10(base × (1 − remise))           // arrondi10 = arrondi à la dizaine supérieure
```
**Explication affichée au vendeur** (bloc « Comment ton prix est calculé », écrans 5, 5b et VDP2, avec ses propres chiffres) :
1. Chaque zone a un prix d'un jour, selon sa catégorie (A, B ou C) et ton type de point de vente — Ganhi 500 F, Cadjèhoun 300 F, Haie Vive 500 F.
2. Période : on prend la zone la plus chère de ton choix — Ganhi, 500 F par jour. Les autres zones sont comprises dans ce prix.
3. On multiplie par le nombre de jours — 500 F × 7 jours = 3 500 F.
4. Point principal : −10 % → 3 150 F.
Puis une ligne pour toutes les formules et les remises.

Prix d'un mois pour un Maquis dont la zone la plus chère est en catégorie A (500 F/jour) :
| Formule | Point principal | Autre point |
|---|---|---|
| Un mois (7 zones) | 500 × 30 = 15 000 − 10 % = **13 500 F** | 15 000 − 20 % = **12 000 F** |
| Premium (15 zones, en tête) | 500 × 30 × 1,5 = 22 500 − 5 % = **21 380 F** | 22 500 − 15 % = **19 130 F** |

Exemple (commande de la maquette, 10 350 F) :
| Point | Type | Formule | Zones | Base | Remise | Total |
|---|---|---|---|---|---|---|
| Chez Maman · Ganhi (principal) | Maquis | Période 20/11 → 26/11 (7 j) | Ganhi (A, 500), Cadjèhoun (B, 300), Haie Vive (A, 500) | 500 × 7 = 3 500 | −10 % | 3 150 |
| Chez Maman · Akpakpa | Maquis | Un mois | Akpakpa (C, 200), Cadjèhoun (B, 300) | 300 × 30 = 9 000 | −20 % | 7 200 |
| **Total de la commande** | | | | | | **10 350 F** |

Grille proposée (FCFA, `PriceGrid`, modifiable dans DB5 ; à valider après le terrain). Le Maquis sert de référence ; un Particulier paie environ 60 %, un Restaurant environ 160 %. La grille ne contient que le prix d'un jour : Période, Mois et Premium se calculent à partir de lui.

| Catégorie | Type | Prix d'un jour (par zone) |
|---|---|---|
| A — centre d'affaires | Particulier | 300 |
| A | Maquis | 500 |
| A | Restaurant | 800 |
| B — résidentiel dense | Particulier | 200 |
| B | Maquis | 300 |
| B | Restaurant | 500 |
| C — périphérie | Particulier | 100 |
| C | Maquis | 200 |
| C | Restaurant | 300 |

Les prix sont **figés** à la création de la commande : `SubscriptionZone.priceXof`, `Subscription.baseXof`, `discountPct`, `isMainPos`, `totalXof`. Changer la grille, le type du point ou le point principal ne modifie jamais une commande existante. Fonction unique `quote()` dans `frontend/src/shared/pricing.ts`, utilisée par l'API et le front (même résultat des deux côtés).

### 11.3 Point de vente principal
- Chaque vendeur a **un** point principal (`Vendor.mainPosId`), désigné par OKARE, jamais choisi par le vendeur.
- Calcul (job quotidien 03:00, et à la publication du premier point) : parmi ses points `PUBLISHED`, celui qui a le plus de **contacts comptés sur les 30 derniers jours** ; à égalité, celui **publié en premier** (`publishedAt`). Un vendeur à un seul point : c'est lui.
- Si le point principal est suspendu, archivé ou supprimé, le calcul est refait immédiatement.
- Un vendeur **Particulier** n'a qu'un seul point de vente, qui est donc toujours son point principal.
- Le vendeur voit sur l'écran 5 / VDP2 l'étiquette « point principal » ou « −20 % » sur chaque point, avec l'explication (« OKARE choisit ton point le plus contacté »).

### 11.4 Places limitées par zone et par jour
- Capacité : `zone.dailySlotsOverride ?? category.defaultDailySlots` places **par jour** (exemples : A 20, B 30, C 60), communes aux trois types et aux 4 formules. Option `slots.maxShareParticulier` (50 %) : au plus la moitié des places d'une zone pour des Particuliers.
- Une pub consomme **1 place par jour** dans **chaque** zone ciblée, sur **chaque** jour (`ZoneDaySlot`, clé zone + jour + pub).
- Une zone est disponible si, pour **tous** les jours voulus, `places occupées < capacité`. L'écran 5 / VDP2 affiche par zone « il reste X places » (minimum sur la période) ou « complet » + première date disponible + « Me prévenir » (liste d'attente, 11.7).
- Un même point ne peut pas avoir deux pubs qui ciblent la même zone le même jour.
- Baisse de capacité sous le nombre de places vendues : rien n'est annulé ; plus de vente jusqu'au retour sous la capacité ; zone signalée « surcapacité » dans DB5.

### 11.5 Commande et paiement FedaPay
Un vendeur peut payer **plusieurs points de vente dans une seule commande** (`SubscriptionOrder`), avec **un seul paiement**. OKARE **ne prend jamais d'argent en main** : tout passe par FedaPay (MTN MoMo, Moov Money, Celtiis Cash, carte bancaire).

**1. Créer la commande** — `POST /api/v1/vendor/orders { lines: [{ posId, plan, startDate, days?, zoneIds[] }] }` (vendeur, écran 5 / VDP2) :
```
contrôles : subscriptions.enabled ; chaque posId appartient au vendeur et est PUBLISHED ; règles 11.1
BEGIN;
  pg_advisory_xact_lock(hashtext('zone-slots:' || zoneId)) pour chaque zone, dans l'ordre des ids ;
  pour chaque ligne, zone et jour : places libres ? sinon ROLLBACK + 409 ZONE_FULL { zoneId, date } ;
  INSERT SubscriptionOrder(number, status = PENDING_PAYMENT, origin = VENDOR_APP, subtotalXof, discountXof, totalXof,
                           holdUntil = now() + payments.holdMinutes)          // 30 min
       + Subscription(status = PENDING_PAYMENT) par ligne + SubscriptionZone + ZoneDaySlot ;
COMMIT;
```
Les places sont **retenues** pendant 30 minutes. `number` = `CMD-2026-000123` (séquence annuelle).

**2. Payer** — `POST /api/v1/vendor/orders/:id/pay { method, phone? }` (écran 23 / VDP2) :
- crée la transaction FedaPay (`Transaction.create` : montant `totalXof`, devise XOF, description « OKARE CMD-… », client, `callback_url`, `custom_metadata: { orderId, paymentId }`) et un `Payment(status = PENDING, providerTransactionId)` ;
- **MTN ou Moov** : envoi direct d'une demande de validation sur le téléphone du vendeur (`sendNowWithToken`) → écran 24 « Valide sur ton téléphone » (compte à rebours, code USSD rappelé) ;
- **Celtiis ou carte** : `generateToken()` → redirection vers la page de paiement FedaPay (`checkoutUrl`), retour sur `callback_url`.
- Un échec (`DECLINED`, `CANCELED`) n'annule pas la commande : écran 26, « Réessayer » crée un **nouveau** `Payment` tant que `holdUntil` n'est pas passé.

**3. Confirmation** — la vérité vient **toujours de FedaPay**, jamais du retour navigateur :
- **Webhook** `POST /api/v1/webhooks/fedapay` : vérifier la signature `X-FEDAPAY-SIGNATURE` avec `FEDAPAY_WEBHOOK_SECRET` (sinon 401, événement gardé avec `signatureValid = false`) ; enregistrer `PaymentEvent` (unique sur `providerEventId` → un événement rejoué n'est traité qu'une fois) ; puis **relire la transaction** par l'API FedaPay (`Transaction.retrieve`) et ne croire que cette réponse (statut, montant = `totalXof`, devise).
- **Si approuvée**, dans une transaction : `Payment.APPROVED` (`approvedAt`, `method`, `feeXof`, `receiptNumber`) ; `SubscriptionOrder.PAID` (`paidAt`) ; chaque `Subscription.PAID` ; `AuditLog` (acteur système) ; puis reçu PDF (`receiptUrl`), `VendorNotice(kind = RECEIPT)` sur WhatsApp / e-mail, `Notification(PAYMENT_APPROVED)`, écran 25 / VDP3. La pub est active **dès son `startDate`** (immédiatement si c'est aujourd'hui). Le cache de recherche des zones ciblées est invalidé.
- **Montant différent** : paiement marqué `APPROVED` mais commande non activée, alerte super-admin (cas anormal).
- **Rattrapage** : le front interroge `GET /api/v1/vendor/orders/:id` toutes les 3 s pendant l'attente ; un job toutes les 5 min relit chez FedaPay les paiements `PENDING` de moins de 24 h (webhook perdu).
- **Approbation après `holdUntil`** (rare) : on replace les mêmes places ; si une zone est devenue complète, la pub est quand même placée (dépassement d'une place toléré) et la zone signalée dans DB5. Le vendeur a payé : il a sa pub.

**4. Expiration** — job toutes les 5 min : commande `PENDING_PAYMENT` avec `holdUntil` dépassé et aucun paiement approuvé → `EXPIRED`, pubs `EXPIRED`, `ZoneDaySlot` supprimés, places rendues (et proposées à la liste d'attente).

**5. Lien de paiement envoyé par l'équipe** — un agent (ses zones) ou un admin peut préparer la commande **avec** le vendeur (même écran, `origin = PAYMENT_LINK`, `holdUntil = now() + payments.linkHoldHours`, 24 h) et lui envoyer le lien de paiement FedaPay sur WhatsApp (`wa.me` pré-rempli). L'agent **ne touche jamais l'argent** ; le vendeur paie lui-même. Visible dans DB4 (encadré « Lien de paiement »).

**6. Remboursement** — `SUPER_ADMIN` uniquement (`POST /api/v1/admin/payments/:id/refund { reason }`, TOTP récent) : le remboursement est fait depuis le compte FedaPay, puis enregistré dans OKARE : `Payment.REFUNDED`, commande et pubs `REFUNDED`, places des jours restants libérées, audit, message au vendeur.

**Interface** `PaymentProvider` (`createTransaction`, `startMobilePayment`, `getCheckoutUrl`, `retrieve`, `verifyWebhook`) avec l'implémentation `FedaPayProvider` ; `FEDAPAY_SECRET_KEY`, `FEDAPAY_WEBHOOK_SECRET`, `FEDAPAY_ENV` (`sandbox` | `live`) en variables d'environnement, jamais en base.

### 11.6 Cycle de vie
```
Commande : PENDING_PAYMENT --approuvé--> PAID --remboursé--> REFUNDED
           PENDING_PAYMENT --holdUntil dépassé--> EXPIRED      PENDING_PAYMENT --annulée (vendeur / désactivation)--> CANCELLED
Pub      : PENDING_PAYMENT --commande payée--> PAID --après endDate (job 00:05)--> ENDED
           PENDING_PAYMENT --> EXPIRED | CANCELLED              PAID --> REFUNDED (super-admin)
```
- Une pub `PAID` est « en cours » si `startDate ≤ aujourd'hui ≤ endDate`.
- **J-2** avant `endDate` : `Notification(SUBSCRIPTION_ENDING)` + message WhatsApp au vendeur avec « Renouveler » → commande pré-remplie (mêmes zones, même formule, `renewedFromId`), places vérifiées normalement.
- Point **suspendu** par un admin pendant sa pub : la pub n'est plus affichée ; pas de compensation automatique ; un admin peut offrir les jours perdus (11.9) avec motif.
- Un jour où le point est fermé (12.4) : il n'est pas affiché, pas de compensation.

### 11.7 Liste d'attente
- Zone complète pour les dates voulues : « Me prévenir » → `WaitlistEntry(zoneId, posId, plan, wantedStart, wantedEnd, WAITING)`.
- Places libérées (expiration, remboursement, hausse de capacité) : le premier inscrit dont les dates deviennent possibles passe à `OFFERED` (notification + message WhatsApp avec lien vers la commande pré-remplie), offre valable `waitlist.offerHours` (24 h), puis au suivant.
- Un point sur liste d'attente active reste `STANDARD` (pas de pénalité faute de place, 11.0 f).

### 11.8 Ce que voit le client
Un point avec une pub dans la zone Z apparaît dans le palier 1 (Premium) ou 2 (autres pubs) de Z, avec le badge « Mis en avant », tous les jours de la pub, pendant ses horaires d'ouverture. Un point `REDUCED` n'a **aucun** marquage négatif visible (jamais « non abonné ») : il est seulement plus bas et en petit point gris sur la carte. Les mots « Premium », « principal » et les prix ne sont jamais montrés aux clients.

### 11.9 Essai offert
Un admin (`subscription.complimentary`, paramètre `subscriptions.allowComplimentary`) peut offrir une pub : `Subscription(isComplimentary = true, orderId = null, totalXof = 0, status = PAID, complimentaryReason)`, durée maximale 7 jours, au plus 7 zones, consomme les places comme les autres, signalée « offert » dans le dashboard (jamais côté client). Possible aussi pendant le lancement gratuit.

---
## 12. Vendeurs, points de vente et menus

### 12.1 Arrivée d'un vendeur : deux chemins, aucune validation
1. **Par un agent** (écran 6 sur téléphone, DB3 « Nouveau point de vente » sur ordinateur) : l'agent rencontre le vendeur et saisit le point de vente. Le vendeur peut lui **envoyer son catalogue sur WhatsApp** (photos, noms, prix) ; l'agent le recopie (glisser les photos dans le formulaire). Aucune table ne stocke ces messages WhatsApp.
2. **Par le vendeur lui-même** (écran 17 / VD7) : il crée son compte, puis son point de vente et ses plats.

Dans les deux cas le point est **publié immédiatement** (`PUBLISHED`, `publishedAt`), sans relecture ni vérification. Les deux peuvent ensuite tout modifier (gestion partagée, 5.3).

Formulaire (identique pour tous) :
- Vendeur : nouveau ou existant (recherche par nom ou téléphone, équipe seulement) ; nom du responsable, téléphone.
- Point de vente : photos (façade et plats ; facultatives, une image par défaut est utilisée sinon), nom affiché, type (Particulier, Maquis, Restaurant), WhatsApp commandes, numéro d'appel si différent, position GPS (précision ≤ 50 m conseillée, sinon avertissement), repère, quartier (proposé selon la position), lieu public ou non (Particulier).
- **Horaires dès la création, jour par jour** : pour chaque jour (lundi → dimanche) un interrupteur ouvert / fermé et **une ou plusieurs plages** (« + plage », ex. 11:30–15:00 et 18:30–23:00), bouton « Copier lundi partout » / « Copier sur les autres jours ». C'est **le même composant** que dans « Horaires et fermetures » (écrans 6, 17b, 19 ; VD3, VD7 ; DB3) : on ne doit jamais avoir à créer puis modifier pour mettre des horaires différents. Services (sur place, à emporter, livraison et zones de livraison), paiements acceptés **au vendeur** (espèces, Mobile Money : information pour le client, OKARE n'y touche pas).
- Menu : 0 à N plats (nom, prix, catégorie, moment, photo, description).
- **Consentement** : case à cocher obligatoire pour envoyer le formulaire (le vendeur accepte d'être sur OKARE et les CGU) ; `consentAt`, `consentById` (vendeur lui-même, ou agent qui l'a recueilli). C'est une case du formulaire, pas une étape de validation.
- Connexion faible : brouillon local (IndexedDB), photos compressées côté client (1 600 px, JPEG 0,8), envoi à la reprise du réseau.
- Doublons : point à < 50 m avec nom similaire (trigramme > 0,5) ou même WhatsApp → simple avertissement « Ce point existe peut-être déjà », l'utilisateur choisit.
- `Vendor.firstPublishedAt` est posé à la première publication (ancienneté, 11.0) ; le point principal est calculé (11.3).
- « Copier le menu d'un autre point de vente » disponible.

### 12.2 Écran 9 « Vendeur et ses points de vente » (dashboard, vue mobile)
Pour un vendeur : coordonnées, agent qui le suit (`followedById`), boutons Appeler / Envoyer le rapport ; pour chaque point : zone et catégorie, statut, étiquette « principal », pub en cours (formule, zones, date de fin), contacts 7 j, taux de réponse, note (si ≥ 5 avis), ancienneté de la vérification des prix ; actions Menu / Stats / Faire une pub (lien de paiement, 11.5) ; « + Ajouter un point de vente ».

### 12.3 Menu et plat du jour (écrans 7, 8 ; VD4 ; DB3 onglet Menu ; DM5)
**Rien ne bloque** : vendeur, agent de la zone et admin font les mêmes gestes, effet immédiat.
- Sélecteur du point de vente en haut (si le vendeur en a plusieurs).
- Plat : nom (2–60 car.), slug, description (0–300 car.), prix (1–100 000), catégorie, moment, photos, ordre.
- Statuts (`DishStatus`) : **Publié** (visible) ou **En attente** (masqué aux clients, gardé dans le menu, remis en ligne en un geste).
- **Épuisé** : `soldOutOn = aujourd'hui`, réinitialisé automatiquement le lendemain ; le plat reste affiché « Épuisé aujourd'hui » sur la page du point et n'est plus proposé ailleurs.
- **Supprimer** : suppression douce (`deletedAt`), restaurable 30 jours par un admin ; les stats gardent l'instantané (9.4).
- Plat du jour : jusqu'à 3 par point et par jour, prix du jour facultatif (`priceTodayXof`) ; expire à minuit heure locale ; « Republier ceux d'hier » en un geste.
- Toute modification de plat ou de prix met à jour `pricesCheckedAt`. Un bouton « Prix vérifiés, rien n'a changé » le met aussi à jour sans modifier les plats.

### 12.4 Horaires et statut du jour
Le client doit savoir, d'un coup d'œil, si un point de vente est **ouvert maintenant** et **s'il ouvre aujourd'hui**.

**Données**
- `openingHours` : horaires habituels **par jour de la semaine** (1 = lundi … 7 = dimanche), 0 à 3 plages par jour, en heure locale `HH:mm`. Une plage peut passer minuit (`18:00–02:00` : appartient au jour où elle commence). Jour absent ou sans plage = fermé ce jour-là.
- `PosDayOverride` : exception pour **un jour précis** — fermé toute la journée, ou horaires spéciaux.
- `PublicHoliday` + `holidayPolicy` : jours fériés (seed Bénin, éditable). `UNKNOWN` = afficher « Horaires non confirmés (jour férié) ».

**Calcul unique** — `getOpenStatus(pos, now)` dans `frontend/src/shared/open-status.ts` (utilisé par l'API, le front et les tests), avec ordre de priorité : `PosDayOverride` du jour > jour férié selon `holidayPolicy` > `openingHours`. Renvoie :

| État | Condition | Affichage client |
|---|---|---|
| `OPEN` | dans une plage, fermeture dans plus de 30 min | « Ouvert · ferme à 15h » (vert) |
| `CLOSING_SOON` | fermeture dans 30 min ou moins | « Ferme bientôt · 15h » (orange) |
| `OPENS_LATER_TODAY` | ouvre plus tard aujourd'hui | « Ouvre à 18h » |
| `CLOSED_TODAY` | pas de plage aujourd'hui, ou exception fermée | « Fermé aujourd'hui · ouvre lun. à 7h » |
| `CLOSED_EXCEPTIONALLY` | `PosDayOverride.isClosed` pour aujourd'hui | « Fermé exceptionnellement aujourd'hui » |
| `MAYBE_CLOSED` | signalements clients du jour ≥ seuil, non confirmés | « Peut-être fermé aujourd'hui » (gris) |
| `UNKNOWN` | aucun horaire saisi, ou jour férié `UNKNOWN` | « Horaires non confirmés » |

Plus `closesAt`, `nextOpenAt` (prochaine ouverture, jusqu'à 7 jours) et `todayRanges` pour la page du point de vente (écran 2 : horaires de la semaine, jour courant en gras).

**Mise à jour du statut du jour**
- Vendeur, agent ou admin : bouton en un geste **« Fermé aujourd'hui »** / « Horaires spéciaux » (écrans 7, 9, 15c, 19 ; VD3 ; DB3) ; crée le `PosDayOverride`.
- **Signal positif automatique** : publier un plat du jour vaut confirmation d'ouverture du jour (`source = AUTO`, utilisé pour la confiance, sans écraser les horaires).
- **Clients** : signalement « Fermé aujourd'hui » depuis la page. À partir de **2 signalements distincts le même jour** (hors équipe, comptes > 24 h), statut `MAYBE_CLOSED` jusqu'à minuit ; un plat du jour publié ou une confirmation du vendeur ou de l'équipe l'annule. « Horaires incorrects » → signalement (DB9), sans effet immédiat.
- Les horaires habituels sont re-confirmés par le vendeur ou l'agent (`hoursConfirmedAt`) ; non confirmés depuis 60 jours → mention « Horaires à confirmer » dans DB2 et dans l'espace vendeur.

**Effets**
- Recherche (8.1) : `openNow=true` garde `OPEN` et `CLOSING_SOON` ; option « Ouvre plus tard aujourd'hui » ; `CLOSED_*`, `MAYBE_CLOSED` exclus par défaut ; `UNKNOWN` affiché en fin de palier.
- Contact : sur un point `CLOSED_*` ou `MAYBE_CLOSED`, avertir avant d'ouvrir WhatsApp (« Il est indiqué fermé aujourd'hui. Écrire quand même ? »).
- Pub : un jour fermé n'affiche pas le point de vente et n'est pas compensé ; si un point avec une pub est fermé **3 jours ou plus** pendant sa pub, un admin peut offrir autant de jours (11.9, audit).
- Statistiques : nombre de jours ouverts par semaine visible dans le rapport.

### 12.5 Particuliers (vente en ligne)
Les particuliers cuisinent chez eux et vendent par WhatsApp, en livraison ou en retrait. Deux risques propres : **la vie privée** (leur domicile) et **l'arnaque**. Règles :
- **Un seul point de vente par vendeur Particulier**, ni plus ni moins. L'API refuse (`409 PARTICULIER_SINGLE_POS`) : d'ajouter un point à un vendeur qui a un point Particulier ; de créer un point Particulier pour un vendeur qui a déjà un point ; de passer un point en type Particulier si son vendeur a d'autres points. À l'écran, « + Ajouter un point de vente » est masqué pour un Particulier, et le type Particulier est grisé pour un vendeur qui a déjà un point (avec l'explication).
- **Publication immédiate, sans vérification préalable**, comme tout point de vente.
- **Adresse jamais publiée** si `hasPublicPlace = false` : la page montre le quartier et « Livraison » / « Retrait sur rendez-vous » ; sur la carte, un point **décalé de 200 à 400 m** dans une direction aléatoire, calculé une fois et stocké (`publicPoint`), dessiné comme un cercle. La position exacte reste interne.
- Zones de livraison (`deliveryZoneIds`) : le point apparaît aussi dans ces zones (palier des points proches) avec « Livre dans ta zone ».
- **Badge facultatif « Identité vérifiée »** : si un agent a vu une pièce d'identité (`identityCheckedAt` ; on n'enregistre jamais la photo de la pièce) et, s'il le souhaite, le lieu de préparation (`kitchenVisitedAt`). Le badge ne conditionne **rien** (ni publication, ni pub).
- **Avertissement client** sur toute page sans lieu public : « Ne paie jamais avant d'avoir vu ta commande. »
- Signalement `FRAUD` sur un particulier → masquage immédiat en attendant un admin (9.7).
- Filtres de recherche « Type » et « Livraison ».

### 12.6 QR code par point de vente
Idée retenue : un QR code collé à l'entrée permet de **voir le menu et les prix du jour sans entrer**, et sans installer d'appli.
- Chaque point de vente a un `qrCode` court et définitif (6 caractères, alphabet sans caractères ambigus `23456789ABCDEFGHJKMNPQRSTUVWXYZ`), généré à la création. URL encodée : `https://okare.bj/q/{qrCode}` (domaine à confirmer) → redirection 302 vers `/p/{slug}?src=qr`. Le slug peut changer sans réimprimer l'autocollant.
- La page ouverte par un scan s'affiche **sans compte et sans installation**, très vite (rendu serveur, < 1 s en 3G) : plat du jour, menu avec prix, statut d'ouverture, bouton WhatsApp par plat (commander à emporter sans faire la queue).
- Comptage : chaque scan crée un événement `qr_scan` (une fois par appareil et par heure) → `PosDailyStat.qrScans` ; un contact qui suit un scan a `source = qr`. Stats « scans cette semaine » et « commandes après un scan » (écran 18).
- Affiche générée côté serveur : PDF A5 et PNG (nom du point de vente, « Le menu et les prix du jour », QR code, adresse courte lisible `okare.bj/q/K7M2QA`, logo). Téléchargeable par le vendeur et l'équipe ; l'agent peut poser un autocollant résistant à l'eau et au soleil.
- Sécurité : un faux autocollant collé par-dessus (« quishing ») est possible. Parades : l'adresse courte imprimée en clair sous le QR, la page affiche le nom du point et son adresse courte, l'agent contrôle l'autocollant quand il passe, et l'équipe peut **révoquer** un code et en générer un nouveau (l'ancien affiche « Ce code n'est plus valide »).
- Le même QR sert à la communication du vendeur (statut WhatsApp, flyers).

### 12.7 Cycle de vie d'un point de vente (`PosStatus`)
```
PUBLISHED <-> PENDING          (vendeur, agent ou admin : « Mettre en attente » / « Remettre en ligne »)
PUBLISHED --> SUSPENDED --> PUBLISHED   (admin seulement : modération, motif obligatoire)
* --> ARCHIVED                 (fermeture définitive : vendeur, agent ou admin)
```
- `PENDING` (« en attente ») : masqué aux clients (page, recherche, carte, QR « momentanément indisponible ») ; tout reste modifiable. Les pubs payées continuent de courir (pas de compensation).
- `SUSPENDED` : masqué, ne peut être remis en ligne que par un admin.
- `ARCHIVED` : fermeture définitive ; restaurable par un admin.
- Supprimer = suppression douce (`deletedAt`), restaurable 30 jours par un admin.

---

## 13. Garder le client dans l'appli

Un client qui va directement chez un vendeur ne fait **rien perdre** à OKARE (visibilité vendue, pas de commission) ; c'est même la preuve que la pub marche. L'objectif est que l'appli reste son **réflexe quotidien** « je mange quoi aujourd'hui ? ». À implémenter :

1. **Favoris vivants** : sur l'accueil, bloc « Chez tes favoris aujourd'hui » (plats du jour et prix de ses favoris ouverts maintenant).
2. **Notification du matin** (10h15, une par jour maximum, opt-in) : « Aujourd'hui chez tes favoris : Atassi chez Tantie (500 F), … ». Uniquement si au moins un favori a publié un plat du jour.
3. **Après un « Oui » au suivi** : proposition d'ajouter aux favoris (écran 10).
4. **Variété** : bloc « Nouveaux près de toi » (points publiés depuis < 14 jours dans la zone) et « Plats du jour » qui changent chaque jour.
5. **Prix fiables** : bandeau « Prix vérifiés il y a X jours » ; c'est une information que le client n'a pas ailleurs.
6. **Partage** : bouton « Partager ce plat » (lien `/p/{slug}` avec aperçu Open Graph) — chaque partage amène un nouveau client à l'appli.
7. Mesures : `DAU`, part des contacts venant des favoris, taux de retour à 7 jours.
8. Hors V1 (prévoir les champs) : points de fidélité financés par les vendeurs, offres réservées aux clients OKARE (`vendorOffer` existe déjà, payée par le vendeur).

---

---

## 14. Compte vendeur

- **Inscription directe** : un vendeur crée son compte et son premier point de vente (écran 17 / VD7) ; il devient `VENDOR`, le point est publié tout de suite.
- **Rattachement à un vendeur créé par un agent** (`ClaimRequest`) :
  - **code** à 6 chiffres généré par l'équipe (valable 72 h), saisi par le vendeur ; ou
  - **demande** depuis le compte (téléphone du compte = `vendor.contactPhone`) acceptée par un admin.
- Après rattachement, il gère lui-même tous ses points (gestion partagée avec les agents de la zone, 5.3).
- Il voit ses stats, ses avis (et y répond), ses pubs, ses commandes, ses paiements et reçus ; il **achète et paie** ses pubs par FedaPay (11.5).
- **Espace vendeur : 3 entrées seulement** dans le menu (barre latérale sur ordinateur, barre du bas sur téléphone) : **Accueil**, **Mes points de vente**, **Profil**.
  - **Accueil** (écran 15 / VD1) : les statistiques de **tous** ses points de vente (contacts du jour et du mois, commandes confirmées, note moyenne, contacts par jour, plats les plus demandés), puis un résumé par point (statut du jour, plat du jour, contacts, taux de réponse, note) avec un bouton « Gestion ».
  - **Mes points de vente** (écran 15b / VD2) : la liste de ses points ; sur chaque ligne, statut, ouverture du jour, plat du jour, contacts, et un bouton **« Gestion »**. Bouton « + Ajouter un point de vente » (jamais pour un Particulier, qui n'a qu'un point).
  - **Gestion d'un point** (écran 15c ; sur ordinateur, onglets VD3 à VD5) : Informations (nom, type, photos, numéros, emplacement) · Menu et plats du jour (7, 8 / VD4) · Horaires et fermetures (19 / VD3) · QR code (18 / VD3) · Statistiques du point (4 / VD5) · Avis (lecture et réponse) ; actions « Voir ma page », « Mettre en attente » / « Remettre en ligne », « Supprimer ».
  - **Profil** (16 / VD6) : infos du compte, mot de passe, notifications, agent qui le suit.
  - **Créer un point de vente** (17, 17b / VD7) : type, nom, emplacement, **horaires par jour avec plusieurs plages** (section 12.4), services, puis photos et menu. Publié dès l'envoi.
  - Aucun lien Menu, Statistiques, QR code ou Abonnement dans le menu principal : tout ce qui concerne un point passe par sa Gestion.

---

## 15. Fraîcheur des données

- Prix non vérifiés depuis 7 jours : mention « Prix à vérifier » dans DB2 (filtre par zone, triés par contacts récents) et dans l'espace vendeur (bouton « Prix vérifiés »).
- > 14 jours : pénalité de classement + bandeau côté client « Prix vérifiés il y a X jours ».
- > 45 jours sans vérification **et** sans contact : le point apparaît dans le filtre « Inactifs » de DB2 ; l'équipe décide (rien d'automatique).

---

## 16. Notifications

| Événement | Destinataire | Canal V1 |
|---|---|---|
| Plats du jour des favoris (10h15) | Client opt-in | Web push (`FAVORITE_SPECIAL`) |
| Suivi « t'a-t-il répondu ? » | Client | Dans l'appli (`FOLLOW_UP`, pas de push) |
| Signalement traité | Client auteur | Dans l'appli (`REPORT_RESOLVED`) |
| Nouvel avis | Vendeur | Dans l'appli + push (`REVIEW_RECEIVED`) |
| Paiement approuvé (reçu) / refusé | Vendeur | Dans l'appli + push (`PAYMENT_APPROVED` / `PAYMENT_FAILED`) ; reçu par WhatsApp et e-mail (`VendorNotice` `RECEIPT`) |
| Fin de pub à J-2 | Vendeur | Dans l'appli + push (`SUBSCRIPTION_ENDING`) + WhatsApp |
| Annonce des abonnements, rappel J-2, dernier jour, fin du préavis (11.0) | Vendeur concerné | WhatsApp (API WhatsApp Business), e-mail si connu, espace vendeur + push (`SUBSCRIPTION_NOTICE`) |
| Paiement anormal, zone en surcapacité, réponse basse sur un point avec pub | Admin | Dashboard (DB1) + push |

Interface `NotificationChannel` (implémentations V1 : `CloudApiWhatsApp`, `Email`, `InApp`, `WebPush`), prête pour SMS. Aucune notification marketing sans opt-in (`notifyNews`).

---

## 17. Journal d'audit

Obligatoire pour : création, modification, mise en attente, suspension, archivage et suppression de vendeurs, points de vente et plats (par le vendeur comme par l'équipe) ; consentements ; commandes, paiements (événements FedaPay compris, acteur « système »), remboursements, essais offerts ; activation et désactivation des abonnements ; changements de zones, catégories, prix et places ; avis masqués ; rôles, permissions, blocages, paramètres. `before`/`after` en JSON. Non modifiable.

---

## 18. Données personnelles et sécurité

- Cadre : Code du numérique du Bénin (autorité : APDP). Mentions légales, confidentialité, CGU accessibles depuis l'inscription.
- Minimisation : aucun nom requis pour un client ; IP hachée (`sha256(ip + sel quotidien)`).
- Suppression de compte : anonymisation des contacts et suivis, suppression des favoris, sessions, téléphone, email.
- OKARE ne transmet **jamais** le numéro d'un client au vendeur (c'est le client qui écrit).
- Consentement vendeur enregistré et révocable : retrait → archivage sous 48 h.
- Sécurité : helmet, CORS strict, rate limiting Redis, validation zod partout, URLs S3 pré-signées courtes, MIME vérifiés, EXIF supprimés, secrets en variables d'environnement, sauvegarde quotidienne chiffrée (30 jours).

---

## 19. Médias

`POST /media/presign` (≤ 8 Mo ; jpeg, png, webp, heic) → upload direct → `POST /media/{id}/complete` → worker `sharp` : WebP `thumb` 160 px, `card` 640 px, `full` 1 200 px, qualité 75, métadonnées supprimées, `blurhash`. Servi par CDN, cache long.

---

## 20. PWA, performance, hors connexion

- Manifest : nom « OKARE », thème `#C2410C`, fond `#FAF7F2`, icônes 192/512 maskable ; invitation à installer après 2 visites.
- Service worker : assets, dernière recherche, favoris consultables hors ligne ; file des contacts et des brouillons terrain (Background Sync).
- Budget : accueil < 500 Ko, LCP < 3 s sur Android d'entrée de gamme en 3G simulée, Lighthouse mobile ≥ 85.
- `next/font` auto-hébergé, images lazy sauf la première carte.

---

---
## 21. API (V1)

Public / client :
```
GET  /api/v1/geo/zones?city=cotonou          GET /api/v1/geo/locate?lat=&lng=
GET  /api/v1/feed?zoneId=&lat=&lng=&budgetMax=&moment=&categoryId=&type=&openNow=&cursor=
GET  /api/v1/search?q=&zoneId=&...
GET  /api/v1/map?bbox=&budgetMax=&moment=&openNow=
GET  /api/v1/pos/:slug                       → point de vente, emplacement (ou publicPoint), horaires, menu, note si ≥ 5 avis
GET  /api/v1/pos/:slug/dishes/:dishSlug      → plat, photos, point de vente { name, slug, type, distanceM, openState },
                                               autres plats publiés du même point ; jamais d'adresse ni de coordonnées
GET  /api/v1/pos/:slug/reviews?dishId=&cursor=   → vide tant que < 5 avis publiés
POST /api/v1/contacts                                   (auth)
GET  /api/v1/me/followups/pending                       (auth)  → au plus 1, avec { askDish, dish? }
POST /api/v1/followups/:contactId   { answer, orderedDishIds?[], other? }   (auth) ; orderedDishIds refusé (400) si le contact a un dishId
POST /api/v1/reviews                { contactId, rating, comment?, mediaIds?[] }   (auth ; contact à soi, « Oui », ≤ 14 j, un seul)
POST/DELETE /api/v1/favorites/:posId                    (auth)
GET  /api/v1/me/favorites/today                         (auth)
POST /api/v1/reports                { targetType, posId?, dishId?, reviewId?, targetUserId?, reason, comment? }   (auth)
POST /api/v1/push/subscribe                             (auth)
GET  /api/v1/me/notifications  ·  POST /api/v1/me/notifications/:id/read     (auth)
GET  /api/v1/r/:token                                   rapport partagé (public)
GET  /q/:code                                           redirection QR (12.6)
```
Auth : `POST /auth/register`, `POST /auth/login`, `GET /auth/google`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/forgot`, `POST /auth/totp/setup`, `POST /auth/totp/verify`, `PATCH /me`, `DELETE /me`.

Gestion des points de vente — **mêmes routes pour le vendeur, l'agent et l'admin**, le périmètre est vérifié par `ScopeService` (5.3) :
```
POST   /api/v1/vendors                         (équipe ; un vendeur a déjà le sien)     GET /api/v1/vendors/:id
POST   /api/v1/pos                             → PUBLISHED immédiatement
PATCH  /api/v1/pos/:id                         { ..., version }  (409 VERSION_CONFLICT)
POST   /api/v1/pos/:id/(hold|publish|archive)  mettre en attente / remettre en ligne / archiver
DELETE /api/v1/pos/:id
PUT    /api/v1/pos/:id/opening-hours           PUT/DELETE /api/v1/pos/:id/day-status/:date   { isClosed, ranges?, reason? }
POST   /api/v1/pos/:id/prices-checked          POST /api/v1/pos/:id/copy-menu-from/:otherPosId
POST   /api/v1/pos/:id/dishes                  PATCH /api/v1/dishes/:id     DELETE /api/v1/dishes/:id
POST   /api/v1/dishes/:id/(publish|hold|sold-out|back-in-stock)
POST   /api/v1/pos/:id/specials                POST /api/v1/pos/:id/specials/repeat
GET    /api/v1/pos/:id/stats?from=&to=         POST /api/v1/pos/:id/share-link → { url }
GET    /api/v1/pos/:id/qr.(pdf|png)            POST /api/v1/pos/:id/qr/revoke   (équipe)
POST   /api/v1/reviews/:id/reply               { text }   (vendeur du point)
POST   /api/v1/media/presign                   POST /api/v1/media/:id/complete
```
Espace vendeur :
```
GET  /api/v1/vendor/me                         ses points, point principal, statut des abonnements
GET  /api/v1/vendor/subscription-status        → { enabled, concerned, vendorAgeDays, requiredFrom, daysLeft,
                                                   perPos: [{ posId, isMainPos, visibilityClass, currentSubscription? }] }
GET  /api/v1/vendor/quote?lines=...            → prix par zone, base, remise, total par ligne et total ; places par zone et par jour
POST /api/v1/vendor/orders                     { lines: [{ posId, plan, startDate, days?, zoneIds[] }] }  → commande, places retenues 30 min
GET  /api/v1/vendor/orders[/:id]               (attente du paiement : interrogé toutes les 3 s)
POST /api/v1/vendor/orders/:id/pay             { method: MTN|MOOV|CELTIIS|CARD, phone? } → { paymentId, mode: PUSH|REDIRECT, checkoutUrl? }
POST /api/v1/vendor/orders/:id/cancel          (tant que PENDING_PAYMENT)
GET  /api/v1/vendor/subscriptions              GET /api/v1/vendor/payments (reçus)
POST /api/v1/vendor/waitlist                   { posId, zoneId, plan, wantedStart, wantedEnd }
POST /api/v1/vendor/claims                     { code } | { phone }
```
FedaPay :
```
POST /api/v1/webhooks/fedapay                  signature X-FEDAPAY-SIGNATURE, idempotent (PaymentEvent), relecture de la transaction (11.5)
GET  /paiement/retour?orderId=                 page de retour (callback_url) : affiche l'état lu en base, jamais celui de l'URL
```
Équipe (agent + admin, avec périmètre) :
```
POST /api/v1/team/orders                       { vendorId, lines[] }  → origin = PAYMENT_LINK, places retenues 24 h
POST /api/v1/team/orders/:id/payment-link      → { checkoutUrl, whatsappUrl }   (lien FedaPay à envoyer au vendeur)
POST /api/v1/team/pos/:id/response-tests       { sentAt, answeredWithinMin }
POST /api/v1/team/claim-codes                  { vendorId }
GET  /api/v1/team/pos?zoneId=&filter=prices|inactive|lowResponse|potential|hoursToConfirm
```
Admin :
```
POST /api/v1/admin/subscriptions/complimentary { posId, zoneIds[], startDate, days ≤ 7, reason }
POST /api/v1/admin/payments/:id/refund         { reason }   (SUPER_ADMIN, TOTP récent)
GET  /api/v1/admin/orders?status=&from=&to=    GET /api/v1/admin/payments?status=&method=   (DB4, DM4)
GET  /api/v1/admin/slots?zoneId=&from=&to=     occupation des places (DB5)
GET  /api/v1/admin/subscriptions/status        → { enabled, launch?, counts: { notified, failedByChannel, subscribed,
                                                    inNotice, reduced, newlyConcernedThisWeek }, amountXof }
GET  /api/v1/admin/subscriptions/preview?minVendorAgeDays=30|60
                                               → { concernedVendors, concernedPos, recentVendors, reachable: { whatsapp, email, inApp },
                                                    zonesOverCapacity: [{ zoneId, concerned, slots }], sampleMessage }
POST /api/v1/admin/subscriptions/activate      { minVendorAgeDays, noticeDays, channels[] }   (Idempotency-Key, TOTP récent)
POST /api/v1/admin/subscriptions/deactivate    { reason }
POST /api/v1/admin/subscriptions/remind
GET  /api/v1/admin/subscriptions/notices?status=&channel=
CRUD /api/v1/admin/countries|cities|zone-categories|zones|neighborhoods|holidays
PUT  /api/v1/admin/zones/:id/boundary          PUT /api/v1/admin/zones/:id/pricing   { dailySlotsOverride, priceOverride }
PUT  /api/v1/admin/price-grid                  [{ categoryId, posType, dayPriceXof }]
CRUD /api/v1/admin/dish-categories
POST /api/v1/admin/pos/:id/(suspend|reactivate|restore)
POST /api/v1/admin/reviews/:id/(hide|remove|restore)
GET  /api/v1/admin/reports?status=  ·  POST /api/v1/admin/reports/:id/(resolve|reject)
POST /api/v1/admin/claims/:id/(approve|reject)
GET  /api/v1/admin/users  ·  POST /api/v1/admin/users/:id/(block|unblock)
PUT  /api/v1/admin/users/:id/roles  ·  PUT /api/v1/admin/users/:id/agent-zones   { zoneIds[] }   (SUPER_ADMIN)
GET/PUT /api/v1/admin/role-permissions         (SUPER_ADMIN)
GET  /api/v1/admin/dashboard  ·  GET /api/v1/admin/audit  ·  GET /api/v1/admin/media  ·  GET/PUT /api/v1/admin/settings
```

---
## 22. Front : routes et design

### 22.0 Mobile et desktop
Une seule application Next.js (dossier `frontend/`), **responsive obligatoirement** (360 à 1440 px et plus, section 25), pensée mobile d'abord :
- < 768 px : navigation basse à 4 onglets (Accueil, Carte, Favoris, Compte) ; écrans 1 à 3, 10 à 14, 22.
- ≥ 1024 px : en-tête avec logo, zone, recherche, Favoris, Connexion / Mon compte ; pas de navigation basse.
  - **D1 Accueil** : liste en grille à gauche (max 720 px), **carte** à droite qui occupe le reste de la hauteur (sticky), synchronisées.
  - **D2 Page du point de vente** : photos, menu (un bouton par plat), horaires, avis (si ≥ 5) à gauche ; carte « Écrire au vendeur » / « Appeler » et mini-carte avec repère et itinéraire à droite, collante au défilement.
  - **D8 Page du plat** : visuels, prix, description, point de vente (nom, distance, ouvert), autres plats, boutons liés au plat ; pas de carte.
  - **D3 Compte** : menu latéral (Favoris, Profil, Notifications, Derniers contacts, Je suis vendeur, Déconnexion) et contenu à droite ; D4 connexion, D5 inscription, D6/D6b suivi, D7 profil.
- 768–1023 px : mise en page mobile élargie (2 colonnes de cartes), carte en onglet.
- Feuilles modales mobiles (inscription, suivi de réponse) = boîtes de dialogue centrées sur desktop.
- Outils équipe : mobile d'abord (terrain) mais utilisables sur desktop ; back-office : desktop d'abord.

### 22.1 Routes
```
/                         accueil (écran 1)
/p/[slug]                 page du point de vente (écran 2, D2), rendu serveur, Open Graph ; seule page avec l'emplacement
/p/[slug]/plat/[dishSlug] page du plat (écran 22, D8), rendu serveur, Open Graph (partage d'un plat) ; toute carte de plat y mène
/carte                    carte (écran 11 ; intégrée à l'accueil sur desktop)
/connexion                connexion (écran 12 ; D4 en desktop) ; l'inscription reste une feuille modale (écran 3 ; D5 = boîte de dialogue en desktop)
/compte                   compte et profil (écran 13 ; D7 et D3 en desktop) : nom, zone habituelle, mot de passe, notifications,
                          derniers contacts, « je suis vendeur », aide, déconnexion, suppression du compte
/favoris                  favoris avec plat du jour et statut d'ouverture (écran 14)
/recherche
/q/[code]                 redirection QR code → /p/[slug]?src=qr (12.6)
/r/[token]                rapport vendeur partagé (lecture seule, public)

ESPACE VENDEUR (rôle VENDOR) — mobile : écrans ; desktop : VD1–VD7 (même coquille que le dashboard). Menu : Accueil, Mes points de vente, Profil
/vendeur                              accueil : statistiques de tous ses points (15 ; VD1)
/vendeur/points                       mes points de vente, bouton « Gestion » par ligne (15b ; VD2)
/vendeur/points/nouveau               créer un point : type et emplacement (17), horaires par jour et services (17b) ; VD7 sur une page
/vendeur/points/[id]                  gestion d'un point (15c ; sur ordinateur les onglets ci-dessous)
/vendeur/points/[id]/infos            informations du point
/vendeur/points/[id]/menu             menu et plats du jour (7 ; VD4) · /menu/[dishId] et /menu/nouveau : plat (8)
/vendeur/points/[id]/horaires         horaires et fermetures (19 ; VD3)
/vendeur/points/[id]/qr               QR code et affiche (18 ; VD3)
/vendeur/points/[id]/stats            statistiques du point, par plat (4 ; VD5)
/vendeur/points/[id]/avis             avis et réponses
/vendeur/profil                       profil (16 ; VD6)
PLUS TARD (section 11) : /vendeur/abonnement, /vendeur/pub, /vendeur/pub/zones, /vendeur/pub/[orderId]/payer

DASHBOARD (rôles FIELD_AGENT, ADMIN, SUPER_ADMIN) — style « admin template » (barre latérale, en-tête avec recherche,
cartes de chiffres, graphiques, tableaux filtrables), aux couleurs OKARE ; menu filtré par permissions et zones
/dashboard                     tableau de bord (DB1) : carte « Abonnements des vendeurs » en haut (désactivés : DB1 ; activés : DB1c),
                               chiffres clés, contacts par jour, derniers paiements en ligne (FedaPay), activité récente ;
                               fenêtre « Activer les abonnements » (DB1b) : boîte de dialogue, état dans l'URL ?activer=1
/dashboard/points              points de vente, filtres (zone, statut, prix à vérifier, réponse basse, inactifs, potentiel) (DB2) ; mobile DM2
/dashboard/points/nouveau      création (écran 6 en mobile, formulaire DB3 en desktop)
/dashboard/points/[id]         fiche (DB3 ; mobile DM3) : onglets Informations, Menu (DM5), Horaires, Statistiques, Avis, Pubs, QR code, Historique
/dashboard/abonnements         PLUS TARD (section 11) : pubs, commandes, paiements FedaPay (DB4) ; mobile DM4
/dashboard/zones               carte et zones, grille des prix (jour, mois, Premium), places (DB5)
/dashboard/utilisateurs        utilisateurs et rôles, zones des agents (DB6)
/dashboard/roles               rôles et permissions (DB7) — super-admin
/dashboard/vendeurs[/id]       vendeurs, ancienneté, point principal, compte, agent qui le suit (DB8 ; écran 9 en mobile)
/dashboard/signalements        signalements et avis signalés (DB9)
/dashboard/audit               journal d'audit (DB10)
/dashboard/medias              médiathèque (DB11)
/dashboard/parametres          paramètres (DB12) : valeurs par défaut des abonnements, modèle du message, connexion FedaPay
                               (environnement, état du webhook ; clés dans les variables d'environnement) — super-admin
Dashboard sur téléphone : DM1 accueil, DM2 points de vente, DM3 fiche, DM4 paiements, DM5 menu complet ;
barre du bas Accueil / Points / Plus ; écrans 6 et 9 = création et vendeur. (DM4 Paiements : plus tard.)
/payer/retour                  retour FedaPay (callback_url) → redirige vers 25/26 selon l'état en base
```
Écran 3 (inscription) et écran 10 (suivi de réponse) = **feuilles modales**, pas des pages.
Graphiques du dashboard : une bibliothèque légère (Recharts ou ApexCharts) avec les tokens OKARE.

### 22.2 Tokens
```ts
colors: {
  piment:  { DEFAULT: '#C2410C', dark: '#9A3412', soft: '#FFF7ED' },
  feuille: { DEFAULT: '#15803D', soft: '#DCFCE7', ink: '#14532D' },
  mais:    { DEFAULT: '#FBBF24' },          // badge « Mis en avant » — réservé aux points avec une pub
  charbon: '#1C1917', ardoise: '#57534E', sable: '#FAF7F2', trait: '#EDE7DF', argile: '#F5EFE7',
}
fontFamily: { display: ['Bricolage Grotesque','sans-serif'], sans: ['Inter','sans-serif'] }
borderRadius: { card: '18px', field: '12px', btn: '16px' }
```
Prix toujours en `feuille` gras ; cibles ≥ 44 px ; contraste ≥ 4,5:1 ; icônes lucide-react ; pas d'emoji ; vraies photos.

**Fond à motifs (écrans client mobile et desktop, pas le dashboard)** : dessins au trait de cuisine et de Cotonou (bol, piment, poisson, plantain, marmite, zémidjan, palmier, verre, pièce…), dans l'esprit des fonds de discussion des messageries, mais **dessinés pour OKARE**. Fichier `design/assets/motif-okare.svg` (tuile 300 × 300, trait `#E9DFD1`, 1,6 px) posé en `background: #FAF7F2 url(/motif-okare.svg) repeat`. Variante sur fond `piment` (panneau gauche de D4) : trait `#CF5A26`. Les cartes, listes et formulaires restent sur fond blanc pour la lisibilité ; le motif ne passe jamais sous du texte. `prefers-reduced-data` / mode économie : motif désactivé.

**Images par défaut des plats** : `design/assets/plats/{riz,pate,atassi,igname,spaghetti,aloko,attieke,ferme}.svg` (assiette vue du dessus sur fond teinté), choisies par `DishCategory.illustrationKey`, utilisées seulement sans photo.

**Coquille client desktop** (D1 à D7) : en-tête blanc avec logo, sélecteur de zone, recherche avec bouton « Chercher », liens « Accueil et carte », « Favoris », « Tu vends à manger ? », puis « Se connecter » / « Créer un compte » ou cloche + avatar. D1 : liste 58 % à gauche (catégories de plats en pastilles, filtres budget, cartes de plats 2 colonnes avec bouton « Commander » et bouton appel, liés au plat), carte 42 % à droite, synchronisées. D3 et D7 : colonne gauche « Mon compte » (carte profil avec 3 chiffres + navigation).

---

---
## 23. Paramètres (`Setting`, défauts)

| Clé | Défaut |
|---|---|
| `vendorSelfService` | true (interrupteur de secours) |
| `subscriptions.enabled` | **false** (lancement gratuit ; ne se change que par le bouton DB1 / l'API activate-deactivate, 11.0) |
| `subscriptions.minVendorAgeDays` | 30 (proposé par défaut dans DB1b ; 30 ou 60) |
| `subscriptions.noticeDays` | 7 (3, 7 ou 14) |
| `subscriptions.messageTemplate` | voir 11.0 g |
| `subscriptions.reminderBeforeDays` / `remindMinHours` | 2 / 72 |
| `subscriptions.maxMessagesPerMinute` | 30 |
| `subscriptions.allowComplimentary` / `complimentaryMaxDays` | true / 7 |
| `subscriptions.version` | entier, incrémenté à chaque activation/désactivation (clé de cache) |
| `ads.maxZones.DAY` / `PERIOD` / `MONTH` / `PREMIUM` | 3 / 5 / 7 / 15 |
| `ads.periodMinDays` / `ads.periodMaxDays` | 2 / 21 |
| `ads.monthDays` / `ads.premiumDays` | 30 / 30 (le Mois = prix d'un jour de la zone la plus chère × `ads.monthDays`) |
| `ads.discounts` | point principal : Un jour 0, Période 10, Mois 10, Premium 5 ; autres points : 20, 20, 20, 15 (en %) |
| `ads.premiumCoefficient` | 1,5 |
| `ads.mainPosWindowDays` | 30 (calcul du point principal) |
| `ads.maxStartAheadDays` | 60 |
| `ads.sameDayCutoffHour` | 15 |
| `payments.provider` | `FEDAPAY` |
| `payments.methods` | `["MTN","MOOV","CELTIIS","CARD"]` |
| `payments.holdMinutes` | 30 |
| `payments.linkHoldHours` | 24 |
| `payments.reconcileEveryMinutes` / `reconcileMaxAgeHours` | 5 / 24 |
| `waitlist.offerHours` | 24 |
| `reviews.minToDisplay` | 5 |
| `reviews.windowDays` | 14 |
| `reviews.maxCommentLength` | 500 |
| `reviews.bannedWords` | liste (vide au départ) |
| `prospect.minWeeklyContacts` | 5 |
| `contact.dedupeMinutes` | 30 |
| `contact.maxCountedPerUserPerDay` | 20 |
| `device.maxAccountsPerDay` | 3 |
| `followup.minDelayMin` / `maxDelayHours` / `retryAfterHours` | 10 / 48 / 3 |
| `response.window` / `minSamples` / `lowThreshold` | 10 derniers sur 60 j / 5 / 0,5 |
| `responseTest.timeoutHours` | 2 |
| `report.reviewThreshold` | 3 en 7 jours |
| `freshness.warnDays` / `penaltyDays` / `inactiveDays` | 7 / 14 / 45 |
| `special.maxPerPosPerDay` | 3 |
| `slots.maxShareParticulier` | 0,5 |
| `privacy.publicPointOffsetMeters` | 200–400 |
| `security.teamTotpRequired` | true |
| `security.maxDistinctPosContactsPerDay` | 20 |
| `hours.closingSoonMinutes` | 30 |
| `hours.closedTodayReportThreshold` | 2 (même jour) |
| `hours.reconfirmAfterDays` | 60 |
| `search.nearbyRadiusMeters` | 1 500 |
| `push.favoritesDigestTime` | 10:15 |
| `whatsapp.messageTemplate` | voir 9.3 |
| Catégories A/B/C | prix 11.2 ; places par jour : A 20, B 30, C 60 (modifiables) |

Variables d'environnement (jamais en base) : `DATABASE_URL`, `REDIS_URL`, `S3_*`, `JWT_*`, `GOOGLE_CLIENT_ID/SECRET`, `VAPID_*`, `MAIL_PROVIDER_URL`, `WHATSAPP_CLOUD_TOKEN`, `WHATSAPP_PHONE_ID`, `FEDAPAY_SECRET_KEY`, `FEDAPAY_WEBHOOK_SECRET`, `FEDAPAY_ENV`, `MAP_TILE_URL`, `SUPER_ADMIN_PHONE`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SEED_DEMO`.

---

## 24. Seed, environnements, tests

- **Seed** : `backend/prisma/seeder.ts` (fourni, idempotent, par `upsert`) :
  - toujours : Bénin, Cotonou, catégories A/B/C (places 20/30/60), 8 zones et leurs quartiers, jours fériés du Bénin, grille des prix (11.2), catégories de plats avec `illustrationKey`, permissions par défaut (5.2), paramètres (23), super-admin depuis `SUPER_ADMIN_*` ;
  - si `SEED_DEMO=true` (jamais en production) : un compte par rôle, vendeurs dont certains à 2 points, plats, plats du jour, contacts et suivis, 5 avis sur un point, une commande payée de 10 350 F (exemple 11.2), une commande en attente, un signalement.
  - Les polygones des zones sont approximatifs : à redessiner dans DB5.
- **Environnements** : `local` (docker-compose, FedaPay `sandbox`), `staging` (sandbox), `production` (`live`).
- **Tests obligatoires** :
  - **publication** : vendeur, agent de la zone et admin publient, mettent en attente, épuisent, suppriment un plat et un point sans aucune validation ; agent hors de ses zones → 403 ; agent à plusieurs zones → accès aux deux ; particulier publié sans `identityCheckedAt` ;
  - **prix** : chaque formule × catégorie × type ; Période par deux dates : 2 et 21 jours acceptés, 1 et 22 refusés (front et API) ; Période = zone la plus chère × jours, Mois = zone la plus chère × 30 ; 4 zones refusées en Un jour, 6 en Période, 8 en Un mois, 16 en Premium ; point principal −10 % en Période et en Mois, −5 % en Premium, 100 % en Un jour ; autres points −20 % et −15 % en Premium ; Premium = zone la plus chère × 30 × 1,5 ;  arrondi à la dizaine supérieure ; exemple de la maquette = **10 350 F** ; un vendeur Particulier ne peut pas avoir un 2e point (409) ; ; même résultat front et API ;
  - **point principal** : le plus contacté sur 30 jours, égalité → premier publié ; recalcul à la suspension ; prix figé après création de la commande ;
  - **places** : 50 commandes concurrentes pour une zone de 20 places → jamais plus de 20 par jour ; commande multi-points et multi-zones atomique (tout ou rien) ; pas d'interblocage ; libération à l'expiration (30 min) ;
  - **FedaPay** (bouchon du fournisseur) : signature invalide → 401, rien n'est payé ; même événement reçu deux fois → traité une fois ; payload « approved » mais relecture « declined » → non payé ; montant différent → non activé + alerte ; refus puis nouvel essai réussi ; webhook perdu → rattrapage par le job ; approbation après `holdUntil` → pub placée ; remboursement réservé au super-admin ;
  - **abonnements** : désactivés → commande 403, pas de `REDUCED` ; activation à 30 j → vendeur à 29 j `STANDARD` et non prévenu, vendeur à 30 j prévenu avec `requiredFrom` = J + préavis + 1 ; double clic (même Idempotency-Key) → une seule activation ; avant `requiredFrom` → `STANDARD`, après → `REDUCED` sauf pub payée ou liste d'attente ; Premium avant les autres pubs ; jamais 2 messages le même jour ; désactivation → plus de `REDUCED`, commandes en attente annulées, pubs payées gardées ;
  - **contacts** : comptage (doublons, plafonds, équipe, vendeur) ; bouton de plat sans `dishId` → 400 ; bouton du point avec `dishId` → 400 ; suivi d'un contact de plat sans « Tu as pris quoi ? » ; la page du plat ne renvoie ni adresse ni coordonnées ;
  - **avis** : refusé sans contact « Oui », refusé deux fois pour le même contact, refusé après 14 jours ; note et avis invisibles à 4 avis, visibles à 5 ; masquage recalcule la moyenne ; le vendeur ne peut pas supprimer ;
  - **signalements** : un seul par cible, motif et jour ; `FRAUD` masque immédiatement ;
  - permissions : chaque ligne de la matrice 5.2, conflit de version 409, conflit d'intérêts agent-vendeur ;
  - `getOpenStatus` : plages multiples, plage passant minuit, fermeture dans 30 min, exception du jour, jour férié, 2 signalements « fermé » puis plat du jour ; mêmes résultats front et API ;
  - QR code, plat du jour à minuit, épuisé réinitialisé, UUID mal formé → 400, recalcul de zone après modification d'un polygone, rotation équitable des paliers 1 et 2 ;
  - particulier : adresse jamais renvoyée par l'API publique, point décalé stable ;
  - numéros vendeurs absents des réponses publiques sauf `POST /contacts` ; TOTP obligatoire pour l'équipe ;
  - carte : mêmes résultats et même ordre que la liste ; bbox limitée à 200 ;
  - visuel : capture de chaque écran à 390 px ou 1440 px comparée à `design/maquette/` ; parcours « trouver et contacter » et « faire une pub et payer » (Playwright, FedaPay sandbox).

---

## 25. Ordre de réalisation

**On fait d'abord toutes les interfaces, puis le backend et les API.**

### Phase 1 — Toutes les interfaces (dossier `frontend/` seulement, sans backend)
Commence par installer le frontend (section 2.1).
Chaque écran est construit à partir de sa maquette (section 0bis), avec des **données fictives** :
- `frontend/src/mocks/` : données de démonstration ayant **exactement la forme des tables** (section 4) — mêmes noms de champs, mêmes enums — pour que rien ne change au branchement.
- `frontend/src/lib/api/` : toutes les fonctions d'accès aux données ont déjà le **nom et la signature des routes de la section 21** ; en phase 1 elles lisent les mocks (avec un petit délai simulé et des cas d'erreur), en phase 3 elles appellent l'API. Les écrans n'importent jamais les mocks directement.
- Les calculs (prix d'une pub, statut d'ouverture, classe de visibilité, permissions) sont écrits dès cette phase dans `frontend/src/shared/` et testés (Vitest) : ils serviront tels quels au backend.
- Tous les états sont faits : chargement, vide, erreur, hors connexion, formulaire invalide, droits insuffisants.

Ordre **obligatoire** des interfaces :
1. **Client (customer)** : écrans 1, 2, 3, 10, 10b, 11, 12, 13, 14, 22 (mobile) et D1 à D8, D6b (desktop).
2. **Vendeur (seller)** : écrans 15, 15b, 15c, 16, 17, 17b, 4, 7, 8, 18, 19 (mobile) et VD1 à VD7 (desktop). Menu : Accueil, Mes points de vente, Profil (section 14).
3. **Dashboard (admin, super-admin, agent)** : DB1, DB2, DB3, DB5 à DB12 (desktop), DM1, DM2, DM3, DM5 et vues terrain 6 et 9 (mobile) ; le menu et les actions changent selon le rôle (section 5), à vérifier avec un compte fictif de chaque rôle.

On ne passe à un bloc qu'après validation du précédent par le porteur du projet.

**Ne pas faire maintenant** : tout ce qui touche aux abonnements, pubs et paiements (section 11 et écrans « Plus tard »). Sur les écrans à faire, ignorer tout élément qui en parle s'il en reste (colonne « Mise en avant », onglet « Pubs », prix des pubs dans DB5, réglages FedaPay et abonnements dans DB12, carte « Activer les abonnements ») et le signaler dans `design/ECARTS.md`.

**Responsive impératif** : chaque écran fonctionne à **360, 390, 768, 1024 et 1440 px** de large, sans défilement horizontal, sans texte coupé ni bouton hors de l'écran, cibles tactiles ≥ 44 px (section 22.0). Un écran n'est livré qu'avec ses captures à ces 5 largeurs (Playwright), comparées à la maquette.

### Phase 2 — Backend et API (dossier `backend/`)
1. Installation du backend (section 2.1), Docker, PostgreSQL + PostGIS, Redis ; `schema.prisma` (section 4) avec **une migration par table** (section 4.2), `seeder.ts`.
2. Auth (Google, téléphone, TOTP équipe), permissions et périmètre (zones des agents).
3. API dans le **même ordre que les interfaces** : client (géographie, recherche, classement, carte, pages, contacts, suivis, avis, signalements, favoris), puis vendeur (points de vente, menus, plats du jour, horaires, QR, stats), puis dashboard (modération, zones, utilisateurs et rôles, audit, paramètres).
4. Jobs (expiration des commandes, point principal, suivis, rappels, stats de la nuit), médias, notifications.
5. Tests API (Vitest, Supertest) de la section 24.

### Phase 4 — Plus tard, quand l'app aura pris de l'ampleur
Abonnements (pubs), places par zone, point principal, commandes et **paiement FedaPay**, activation des abonnements (section 11 et écrans « Plus tard »).

### Phase 3 — Branchement et finitions
Remplacer les mocks par l'API dans `frontend/src/lib/api/` (aucun écran ne doit changer), tests de bout en bout (Playwright) aux 5 largeurs, anti-fraude, performance, observabilité, sauvegardes, mise en production.

**Critère de fin de V1** : un agent référence 50 points de vente dans ses zones et des vendeurs s'inscrivent seuls ; un client trouve et contacte l'un d'eux en moins de 30 secondes ; chaque contact apparaît dans les stats et le rapport partagé ; un vendeur paie par Mobile Money une commande de deux points (principal et secondaire) sur plusieurs zones, et ses pubs s'activent seules.

---

## 26. Hors V1

Commande et paiement des repas, livraison, notifications de quartier payantes, avis utilisés dans le classement, application native, OTP SMS/WhatsApp, multi-langue (fon, yoruba, anglais), autres villes que Cotonou, points de fidélité, prélèvement automatique (renouvellement sans action du vendeur).

---

## 27. Failles connues et parades (à implémenter en V1 sauf mention)

### 27.1 Les plats du jour ne seront pas publiés si personne ne s'en charge
**Faille** : sans plats du jour frais chaque matin, l'accueil devient vite périmé.
**Parade** : publier un plat du jour doit prendre moins de 30 secondes (« Republier ceux d'hier » en un geste, épuisé en un geste) pour le vendeur comme pour l'agent ; le vendeur peut aussi envoyer sa photo et son prix à son agent sur WhatsApp, qui publie depuis le dashboard (aucune boîte de réception dans OKARE). Indicateur suivi chaque jour : part des points actifs avec un plat du jour publié avant 11h.

### 27.2 Un contact n'est pas une vente : le vendeur peut contester la valeur
**Parade** : message pré-rempli visible par le vendeur (9.3), commandes confirmées par plat (9.4), rapport honnête (« contacts » et « commandes confirmées » séparés), contacts venus de la pub affichés à part, formule « Un jour » pour essayer.

### 27.3 Argent et paiements
**Faille** : un agent qui encaisserait de l'argent pourrait le garder ; un faux « paiement réussi » pourrait activer une pub.
**Parade** :
- OKARE **n'accepte jamais d'espèces ni de transfert manuel** : tout paiement passe par FedaPay, l'agent envoie seulement un lien. Consigne claire au vendeur (affiche QR, messages) : « Ne donne jamais d'argent à un agent. »
- Une pub ne s'active que sur une transaction **relue chez FedaPay** (11.5), jamais sur le retour du navigateur ni sur un webhook non signé.
- Reçu numéroté envoyé par OKARE au vendeur à chaque paiement ; remboursement réservé au super-admin, audité.

### 27.4 Faux contacts, faux avis et manipulation du classement
**Failles** : un vendeur crée de faux comptes pour gonfler ses contacts ou ses notes ; un concurrent laisse de mauvais avis ou répond « Non » au suivi.
**Parade** : règles de comptage 9.2 ; suivi et avis possibles **uniquement** par le client qui a fait le contact (et a répondu « Oui » pour l'avis) ; un compte de moins de 24 h ne pèse pas dans le taux de réponse ; plus de 3 comptes par appareil = non comptés ; alerte si plus de 30 % des contacts ou des avis d'un point viennent de comptes de moins de 7 jours ; avis signalables ; les avis ne pèsent pas dans le classement en V1.

### 27.5 Aspiration des numéros des vendeurs
**Parade** : les numéros ne sont **jamais** dans le HTML ni dans les réponses de liste ; ils ne sont renvoyés que par `POST /contacts` (compte requis), avec limites de débit par compte, par appareil et par IP ; détection des comptes qui contactent plus de 20 points par jour.

### 27.6 Sécurité des comptes d'équipe
**Parade** : TOTP obligatoire pour `FIELD_AGENT`, `ADMIN`, `SUPER_ADMIN`, sessions de 12 h, déconnexion à distance, journal des connexions ; ré-authentification pour activation, remboursement et rôles.

### 27.7 Publication sans validation
**Faille** : sans relecture, un faux point, une arnaque ou un contenu choquant peut apparaître.
**Parade** : tout est tracé (`AuditLog`, auteur de chaque modification) ; signalements `FRAUD`, `INAPPROPRIATE`, `FOOD_SAFETY` → masquage immédiat ; avertissement client sur les pages sans lieu public ; badge « Identité vérifiée » facultatif ; un admin peut suspendre ; `vendorSelfService` coupe l'espace vendeur en cas d'abus massif.

### 27.8 Sécurité alimentaire et responsabilité
**Parade** : CGU claires (OKARE met en relation, ne prépare ni ne vend) ; motif « Problème de santé après le repas » → masquage immédiat et appel de l'équipe. À faire valider par un juriste béninois.

### 27.9 Notifications sur iPhone
**Parade** : inviter à l'installation au bon moment (après le premier « Oui » ou le premier favori) ; ne jamais dépendre d'une notification pour une action importante.

### 27.10 Acquisition des clients
**Parade** : autocollant QR chez chaque vendeur, partage des plats (aperçu Open Graph), statuts WhatsApp, partenariats avec des bureaux ; chaque source est mesurée (`ContactSource`, paramètre `src`).

### 27.11 Changements de numéro et numéros sans WhatsApp
**Parade** : bouton « Envoyer un message test » à la création (`whatsappVerifiedAt`, facultatif, ne bloque pas) ; un signalement « numéro invalide » ou un message test sans réponse est visible dans DB2.

### 27.12 Données et légal
- Pubs = vente de services : société enregistrée (RCCM, IFU), reçus numérotés, contrat marchand FedaPay, régime fiscal et TVA à vérifier avec un comptable.
- Données personnelles : déclaration auprès de l'APDP à vérifier ; politique de confidentialité ; durées de conservation (contacts : 24 mois puis anonymisation ; paiements : durée légale comptable).

### 27.13 Abonnements obligatoires : risques
- **Départ des vendeurs** : `REDUCED` ne cache jamais un point (page, QR, favoris, recherche par nom intacts) ; préavis ; formule « Un jour » à petit prix ; activer d'abord avec « plus de 2 mois » si la base est fragile ; suivre chaque semaine le nombre de points publiés et les contacts dans DB1c.
- **Places limitées** : liste d'attente = pas de pénalité, alerte des zones en surcapacité avant activation (11.0 b).
- **WhatsApp automatique** : l'API WhatsApp Business demande un compte Meta vérifié, un modèle approuvé et des frais par conversation ; limite de 30 messages par minute.
- **E-mail** : la plupart des vendeurs n'en ont pas ; ne jamais compter sur ce seul canal.
- **Contestation** : `VendorNotice` garde la preuve de chaque message (texte, date, canal, statut).
- **Paiement mobile qui échoue** (réseau, solde, délai de validation) : places retenues 30 min, nouvel essai possible, rattrapage automatique.

### 27.14 Décisions encore ouvertes
- Grille des prix (jour, mois, Premium) et nombre de places par zone, après 2 semaines de terrain.
- Plafond de places pour les Particuliers (50 % proposé) ; places réservées au Premium ou non.
- Date d'activation des abonnements, ancienneté (1 ou 2 mois) et préavis : à décider avec les chiffres de DB1.
- Qui paie les frais FedaPay (absorbés par OKARE par défaut).
- Rémunération des agents : fixe, commission sur les pubs payées, ou les deux (à combiner avec 27.4).
