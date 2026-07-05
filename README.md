# naht

Application de développement personnel : organisez vos **challenges** sur
différents axes — sport, nutrition, lecture, formation…

Monorepo inspiré de l'architecture Diasporteur (Nx + pnpm, NestJS + GraphQL
hexagonal, React + Vite). Cette première brique livre **uniquement le système
d'inscription / connexion** (passwordless — code OTP par email).

## Stack

| Couche    | Techno                                                                   |
| --------- | ------------------------------------------------------------------------ |
| Monorepo  | pnpm workspaces + Nx, Node 24                                            |
| API       | NestJS 11 (ESM), GraphQL code-first (Apollo), Prisma 7, JWT (cookies)   |
| BDD       | PostgreSQL managé **Supabase**                                          |
| Front     | React 19 + Vite, Apollo Client 4, React Router 7, Tailwind CSS v4       |
| Partagé   | `@naht/shared` (types & enums communs — dont les axes de challenge)     |

Architecture hexagonale côté API : `domain` (métier + ports) / `adapters`
(driving = GraphQL, driven = Prisma) / `infrastructure`.

## Structure

```
packages/
  apps/
    api/                 # NestJS + GraphQL + Prisma
      src/
        auth/            # OTP email, JWT, guards (hexagonal)
        user/            # entité User + repository Prisma
        infrastructure/  # PrismaService (adapter pg → Supabase)
    frontend/
      app/               # React + Vite (LoginPage, Dashboard, AuthContext)
  libs/
    shared/              # types partagés (ChallengeAxis, CurrentUser…)
```

## Démarrage

### 1. Prérequis

- Node 24 (`nvm use`)
- pnpm 9
- Un projet **Supabase** (déjà configuré : `kbyqmmipnragqatugmit`)

### 2. Installer

```bash
pnpm install
```

### 3. Configurer la base (Supabase)

Renseignez le mot de passe de la base dans `packages/apps/api/.env`
(remplacez `[YOUR-PASSWORD]` dans `DATABASE_URL` et `DIRECT_URL`).
Le mot de passe est dans _Supabase Dashboard > Project Settings > Database_.

Puis créez le schéma (client Prisma + migration) sur Supabase :

```bash
cd packages/apps/api
pnpm prisma:generate
pnpm prisma:migrate      # crée la table `users`
```

> Optionnel — CLI Supabase (gestion du projet, pas nécessaire pour Prisma) :
>
> ```bash
> supabase login
> supabase init
> supabase link --project-ref kbyqmmipnragqatugmit
> ```

### 4. Lancer

Dans deux terminaux (ou `pnpm dev` à la racine) :

```bash
pnpm dev:api        # http://localhost:4000/graphql
pnpm dev:frontend   # http://localhost:5173
```

## Parcours d'authentification

1. L'utilisateur saisit son **email** → mutation `sendEmailCode`.
2. L'API génère un code à 6 chiffres et l'« envoie ».
   - En **dev**, le code est fixe (`123456`) et loggé dans la console de l'API
     (aucun SMTP requis).
3. L'utilisateur saisit le code → mutation `verifyEmailCode` :
   - crée le compte au premier passage (**signup**), sinon le connecte (**signin**) ;
   - pose les cookies httpOnly `auth_token` + `refresh_token` (JWT).
4. La query `getCurrentUser` (cookie) alimente le contexte React et protège les
   routes.

### Sécurité incluse

- Codes stockés avec TTL (Redis si `REDIS_URL`, sinon mémoire en dev)
- Rate limit : 10 demandes de code / h / email, 3 tentatives / code
- JWT signés (secret ≥ 32 car.), cookies `httpOnly` + `sameSite`
- Throttler global NestJS (100 req/min/IP)

## Production (à brancher plus tard)

- `EmailService` : remplacer le log console par un vrai provider (Resend, SES…)
- Définir `REDIS_URL` pour un stockage OTP partagé multi-instances
- `JWT_SECRET` fort, `NODE_ENV=production` (cookies `secure`)
