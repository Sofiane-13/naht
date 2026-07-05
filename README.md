# naht

Application de développement personnel : organise tes **challenges** sur
différents axes — sport, nutrition, lecture, formation…

Architecture **sans backend à héberger** : un front React statique (déployable
gratuitement sur Vercel / Netlify / Cloudflare Pages) qui parle **directement à
Supabase** (Auth + base Postgres). Cette première brique livre **uniquement le
système d'inscription / connexion** (passwordless — code OTP par email).

## Stack

| Couche  | Techno                                                        |
| ------- | ------------------------------------------------------------ |
| Front   | React 19 + Vite, React Router 7, Tailwind CSS v4             |
| Auth    | **Supabase Auth** (email OTP) — appelé directement du client |
| BDD     | **Supabase** PostgreSQL (via le client `@supabase/supabase-js`) |
| Partagé | `@naht/shared` (types & enums communs — axes de challenge)   |

> Monorepo pnpm (front + lib partagée). Le projet Supabase est
> `kbyqmmipnragqatugmit`.

## Structure

```
packages/
  apps/frontend/app/     # React + Vite
    src/
      lib/supabase.ts     # client Supabase (Auth + DB)
      contexts/AuthContext.tsx
      pages/LoginPage.tsx  # email → code OTP
      pages/DashboardPage.tsx
      components/ProtectedRoute.tsx
  libs/shared/            # types partagés (ChallengeAxis…)
```

## Démarrage

```bash
pnpm install
pnpm dev            # http://localhost:5173
```

La config Supabase est dans `packages/apps/frontend/app/.env` :

```
VITE_SUPABASE_URL="https://kbyqmmipnragqatugmit.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_…"
```

> La clé « publishable » est faite pour être exposée côté navigateur. La
> sécurité des données repose sur les **RLS policies** de Supabase (à définir
> quand on ajoutera des tables applicatives).

## Parcours d'authentification

1. L'utilisateur saisit son **email** → `supabase.auth.signInWithOtp()`.
   Supabase envoie un email (compte créé au premier passage : **signup** +
   **signin** unifiés).
2. L'utilisateur saisit le **code à 6 chiffres** → `supabase.auth.verifyOtp()`.
3. Supabase établit et persiste la **session** (localStorage) ; `AuthContext`
   la diffuse à l'app et `ProtectedRoute` garde les pages privées.

### ⚙️ Réglage Supabase à faire une fois (pour recevoir le code à 6 chiffres)

Par défaut, l'email « Magic Link » de Supabase envoie un **lien**, pas un code.
Pour afficher le code à 6 chiffres attendu par l'écran de connexion :

1. Dashboard Supabase → **Authentication → Email Templates → Magic Link**.
2. Mets un contenu qui expose le token, par exemple :
   `Ton code de connexion : {{ .Token }}`
3. (Optionnel) **Authentication → URL Configuration** : ajoute
   `http://localhost:5173` et l'URL de prod dans *Site URL* / *Redirect URLs*
   (utile si tu proposes aussi le lien magique).

## Déploiement (gratuit)

Le front est statique : `pnpm build` produit `packages/apps/frontend/app/dist`,
à publier sur Vercel / Netlify / Cloudflare Pages. Renseigne les deux variables
`VITE_SUPABASE_*` dans l'hébergeur. Supabase gère Auth + base côté cloud.
