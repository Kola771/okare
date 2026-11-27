# OKARE — Backend

## Stack

| Couche            | Choix                                                                          |
| ----------------- | ------------------------------------------------------------------------------ |
| Framework         | NestJS 11 (TypeScript)                                                         |
| ORM               | TypeORM 0.3                                                                    |
| Base de données  | PostgreSQL 16 + PostGIS (principal) / MySQL 8 (compatible)                     |
| Sécurité        | Helmet                                                                         |
| Validation        | class-validator + class-transformer                                            |
| Hachage           | argon2                                                                         |
| Stockage fichiers | S3 compatible (Cloudflare R2 / MinIO en local) — pas de dossier uploads local |

## Dépendances installées

### Production

- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` — framework NestJS
- `@nestjs/config` — variables d'environnement
- `@nestjs/typeorm`, `typeorm` — ORM et migrations
- `pg` — driver PostgreSQL
- `mysql2` — driver MySQL
- `helmet` — en-têtes de sécurité HTTP
- `class-validator`, `class-transformer` — validation des DTOs
- `argon2` — hachage de mots de passe
- `dotenv` — chargement du `.env`
- `reflect-metadata` — décorateurs TypeScript
- `rxjs` — observables (requis par NestJS)

### Développement

- `@nestjs/cli`, `@nestjs/schematics` — CLI NestJS
- `@nestjs/testing` — tests
- `@types/express`, `@types/jest`, `@types/node` — types TypeScript
- `jest`, `ts-jest` — tests
- `ts-node`, `tsconfig-paths` — exécution TypeScript
- `tsx` — exécution rapide TypeScript (seeder)
- `typescript` — compilateur

## Variables d'environnement

Créer un fichier `.env` dans `backend/` :

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=
DB_NAME=okare
PORT=4001
FRONTEND_URL=http://localhost:4000
NODE_ENV=development

# JWT — générer le secret avec : node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<valeur générée>
JWT_EXPIRES_IN=90d
```

## Commandes

```bash
# Démarrer en développement (watch mode)
npm run start:dev

# Démarrer en production
npm run build
npm run start:prod

# Lancer toutes les migrations en attente
npm run migration:run

# Annuler la dernière migration
npm run migration:revert

# Générer une migration depuis les changements d'entités
npm run migration:generate -- src/migrations/NomDeLaMigration

# Linter
npm run lint

# Tests
npm run test

# Tests end-to-end
npm run test:e2e

# Seed (données initiales)
npm run seed
npx tsx src/seed.ts
```

## Migrations

34 fichiers de migration TypeORM couvrant les 42 tables du schéma Prisma, dans `src/migrations/`.

Chaque migration supporte PostgreSQL et MySQL via `queryRunner.connection.options.type`.

Ordre d'exécution (par timestamp) :

1. countries
2. cities
3. zone_categories
4. zones
5. neighborhoods
6. public_holidays
7. users (+ enum Role)
8. dish_categories
9. role_permissions
10. settings
11. sessions
12. vendors
13. media (+ enums MediaOwner, MediaStatus)
14. audit_logs
15. points_of_sale (+ enums PosType, PosStatus, HolidayPolicy + FK vendors.mainPosId)
16. dishes (+ enums DishStatus, MealMoment)
17. agent_zones
18. push_subscriptions
19. notifications (+ enum NotificationType)
20. daily_specials
21. pos_day_overrides (+ enum DayStatusSource)
22. favorites
23. contact_events (+ enums ContactChannel, ContactSource)
24. contact_follow_ups + contact_order_items (+ enums FollowUpAnswer, OrderItemOrigin)
25. reviews (+ enum ReviewStatus)
26. reports (+ enums ReportTarget, ReportReason, ReportStatus)
27. claim_requests (+ enum ClaimStatus)
28. response_tests
29. platform_daily_stats + pos_daily_stats + pos_dish_daily_stats
30. stats_share_links
31. price_grid + subscription_orders (+ enums AdPlan, OrderStatus, PaymentOrigin)
32. subscriptions + subscription_zones + zone_day_slots (+ enum SubscriptionStatus)
33. payments + payment_events (+ enums PaymentMethod, PaymentStatus)
34. waitlist_entries + subscription_launches + vendor_notices (+ enums WaitlistStatus, NoticeChannel, NoticeKind, NoticeStatus)

## Structure

```
backend/
├── src/
│   ├── main.ts                  # Point d'entrée (Helmet, CORS, validation, filtre d'exceptions)
│   ├── app.module.ts            # Module racine (ConfigModule, TypeOrmModule, AuthModule, CountriesModule)
│   ├── datasource.ts            # Configuration TypeORM (PostgreSQL/MySQL)
│   ├── types.d.ts               # Déclarations de types manquants (passport-jwt)
│   ├── auth/
│   │   ├── auth.module.ts       # Module auth (JWT, Passport, guards)
│   │   ├── jwt.strategy.ts      # Stratégie Passport JWT (vérifie session + user)
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts      # Guard d'authentification JWT
│   │   │   ├── roles.guard.ts         # Guard de rôles (@Roles)
│   │   │   └── permissions.guard.ts   # Guard de permissions (table role_permissions)
│   │   └── decorators/
│   │       ├── current-user.decorator.ts  # @CurrentUser() — extrait l'utilisateur du request
│   │       ├── roles.decorator.ts         # @Roles(Role.ADMIN, ...) — métadonnées de rôles
│   │       └── permissions.decorator.ts   # @Permissions('country.create', ...) — métadonnées de permissions
│   ├── entities/
│   │   ├── country.entity.ts
│   │   ├── user.entity.ts       # + enum Role
│   │   ├── session.entity.ts
│   │   └── role-permission.entity.ts
│   ├── countries/
│   │   ├── countries.module.ts
│   │   ├── countries.controller.ts  # CRUD — GET public, POST/PATCH ADMIN+, DELETE SUPER_ADMIN
│   │   ├── countries.service.ts     # Requêtes PostgreSQL et MySQL, try/catch systématique
│   │   └── dto/
│   │       ├── create-country.dto.ts
│   │       └── update-country.dto.ts
│   ├── common/
│   │   └── filters/
│   │       └── global-exception.filter.ts
│   └── migrations/
│       └── 1732320000001..034-*.ts          # 34 fichiers de migration
├── prisma/
│   └── schema.prisma            # Schéma de référence (42 tables)
└── package.json
```
