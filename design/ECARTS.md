# Écarts entre la maquette et la spécification

| Date | Écran | Maquette | Spec | Décision |
|---|---|---|---|---|
| 21/11/2026 | Toutes | Adresses en français | Adresses en français | Adresses en anglais (/login, /account, /favorites, /map, /search, /seller, /dashboard, /p/[slug]/dish/[dishSlug]) — demande du porteur. Texte affiché en français. |
| 21/11/2026 | Contact | — | Table contacts | Champ `button` (DISH / POS) ajouté pour distinguer le bouton d'un plat de celui du point (9.1). |
| 21/11/2026 | API | — | Section 21 | Routes en plus : `me/contacts`, `dish-categories`, `followups/:id` ; recherche carte par rectangle (bbox). |
| 21/11/2026 | Point de vente | « Vérifié par un agent » | Pas de validation avant publication | Texte retiré : publication immédiate. |
| 21/11/2026 | Dashboard agent | Menu fixe | Permissions par rôle | Menu filtré par permissions. |
| 21/11/2026 | DB11 Médias | « À relire » | — | Gardé comme filtre de modération. |
| 21/11/2026 | Pubs / abonnements | Colonne « Mise en avant », onglet Pubs, grille de prix DB5, FedaPay DB12, carte « Activer » | 0ter : pas d'abonnement, pub ni paiement pour l'instant | Tout retiré (écrans, boutons, textes, API). |
| 21/11/2026 | Toutes | Pages protégées | Accès par rôle | **Phase 1 : accès libre, aucune connexion demandée** (demande du porteur). Sans compte : cliente de démo ; vendeur → Maman Afi ; dashboard → super-admin. Contrôles au backend. |
| 21/11/2026 | Suivi de contact | Fenêtre qui s'ouvre seule | Ouverture automatique | Désactivée en phase 1 ; ouverte depuis /pages. |
| 21/11/2026 | DB3, DB5, DB8, DB12, DB6, DB7 | Pubs, places, FedaPay, « Mettre en avant » | 0ter : plus tard | **Remis comme la maquette** (décision du porteur) avec données d'exemple ; aucun paiement réel, aucun effet sur le classement. La ligne « Pubs / abonnements » ci-dessus ne vaut plus que pour l'espace vendeur. |
| 21/11/2026 | Pays, villes, quartiers | — (pas de maquette) | Tables Country, City, Neighborhood | Nouvelle page `/dashboard/geography` demandée par le porteur, dans le style DB5. |
| 21/11/2026 | DB5 carte | Dessin schématique | Carte réelle | Carte Leaflet avec contours colorés par catégorie (A piment, B vert, C gris) ; bouton « Dessiner une zone » à brancher (Leaflet-Geoman). |
| 22/11/2026 | DB11 Médiathèque | « À relire », « Non associées (reçues sur WhatsApp) » | Table `media` : statut PROCESSING/READY/REJECTED, `ownerId` obligatoire | Données fictives avec champs en plus : `review` (relecture des photos de vendeurs), `source`, `kind`, `fileName`, `sizeKb`, `ownerId` vide = non associée. **À ajouter au schéma Prisma en phase 2.** |
| 22/11/2026 | Création d'un point | Étape 4 « Photos et menu » | 12.1 photos façade et plats facultatives | Étape 4 renommée « Autres photos de l'endroit » (demande du porteur) ; photo de l'entrée à l'étape 2 ; les plats s'ajoutent après publication (« Menu et plats du jour »). |
