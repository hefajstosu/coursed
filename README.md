# coursed.pl

Portal do oceniania i opiniowania kursów online/offline w modelu „IMDb / Filmweb dla kursów”. Pełny opis produktu: [`project.md`](./project.md). Plan implementacji: `~/.claude/plans/przeanalizuj-projekt-w-pliktu-zippy-wirth.md`.

## Stack

- **Next.js 16** (App Router, RSC, Server Actions) + **TypeScript**
- **Prisma 7** + **PostgreSQL** (Neon na produkcji)
- **Auth.js v5** — Google OAuth + magic link (Resend)
- **Tailwind CSS v4** + **shadcn/ui**
- **Vercel Blob** dla okładek kursów
- Hosting: **Vercel**

## Wymagania

- Node.js ≥ 20 (testowane na 25)
- pnpm ≥ 10 (`npm install -g pnpm`)
- PostgreSQL 16+ (`brew install postgresql@16 && brew services start postgresql@16`)

## Setup lokalny

```bash
# 1. Postgres lokalnie (jednorazowo)
brew install postgresql@16
brew services start postgresql@16
/opt/homebrew/opt/postgresql@16/bin/createdb coursed

# 2. Projekt
pnpm install
cp .env.example .env
# DATABASE_URL: postgresql://<user>@localhost:5432/coursed?schema=public
# uzupełnij AUTH_SECRET, klucze Google + Resend

pnpm db:generate     # klient Prisma → src/generated/prisma
pnpm db:migrate      # migracja schematu
pnpm db:seed         # dane demo (5 userów, 10 kursów, kategorie, oceny)
pnpm dev             # http://localhost:3000
```

Wygenerowanie `AUTH_SECRET`:

```bash
pnpm dlx auth secret
```

## Struktura katalogów

```
src/
├── app/                      # App Router (publiczne strony, /admin, /api/auth)
├── components/ui/            # shadcn primitives
├── lib/
│   ├── db.ts                 # Prisma singleton
│   └── auth-helpers.ts       # requireUser / requireRole
├── auth.ts                   # Auth.js v5 setup (Node.js runtime)
├── auth.config.ts            # edge-safe config (używany w proxy)
├── proxy.ts                  # Next 16 proxy (dawniej middleware) — ochrona /admin
└── generated/prisma/         # generowany klient Prisma (gitignored)
prisma/
└── schema.prisma
prisma.config.ts              # ładuje DATABASE_URL z .env
```

## Skrypty

| Komenda | Opis |
| --- | --- |
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` | Build produkcyjny |
| `pnpm start` | Start produkcyjny |
| `pnpm lint` | ESLint |
| `pnpm exec prisma studio` | Eksplorator DB |
| `pnpm exec prisma migrate dev` | Migracja w trybie dev |

## Status

Faza 0 (bootstrap) ukończona. Kolejne fazy w pliku planu.
