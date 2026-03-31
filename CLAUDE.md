# PulseSurvey

Plateforme d'enquetes et sondages employes avec anonymat garanti.

## Stack

- Next.js 16 (App Router) / React 19 / TypeScript
- Supabase (Postgres, Auth, RLS, Storage)
- Tailwind CSS v4 + shadcn/ui
- Recharts, react-hook-form, Zod, @dnd-kit
- Resend (email), Stripe (billing), Anthropic (AI)
- Deploiement: Netlify

## Structure

```
src/
  app/(backoffice)/   # Dashboard admin (sidebar layout)
  app/(survey)/       # Pages sondage publiques
  app/api/            # API routes
  components/ui/      # shadcn/ui
  components/shared/  # Composants partages
  lib/supabase/       # Clients Supabase (client, server, admin)
  lib/types.ts        # Types principaux
  hooks/              # Custom hooks
supabase/             # Migrations et config
```

## Conventions

- Francais pour les labels UI, anglais pour le code
- Server Components par defaut, `"use client"` seulement si necessaire
- Validation Zod aux frontieres API
- Multi-tenant avec RLS scope par tenant_id
- Anonymat critique: ne jamais lier reponses aux employes

## Agents disponibles

- `@backend` - Supabase, API routes, logique serveur
- `@frontend` - UI, composants, pages React
- `@qa` - Revue de code, securite, qualite
- `@devops` - Netlify, CI/CD, infra

## Commandes

```bash
npm run dev      # Dev server
npm run build    # Build production
npm run lint     # ESLint
```
