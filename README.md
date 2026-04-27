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
- PostgreSQL (lokalnie Docker / `pnpm exec prisma dev` / Postgres.app)

## Setup lokalny

```bash
pnpm install
cp .env.example .env
# uzupełnij wartości w .env (DATABASE_URL, AUTH_SECRET, klucze Google + Resend)

pnpm exec prisma generate           # klient Prisma → src/generated/prisma
pnpm exec prisma migrate dev        # tworzy DB + tabele Auth.js
pnpm dev                            # http://localhost:3000
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
