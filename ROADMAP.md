# coursed.pl — Roadmap

Dokument operacyjny — co zrobione, co dalej, dlaczego. Wizja produktu → `project.md`.

Ostatnia aktualizacja: 2026-05-22

---

## Zrobione

### Faza 1–5 — Fundament (implementacja sprzed śledzonych sesji)
Schema Prisma (Course/Rating/Review/Category/User/Report/AuditLog…), Auth.js v5 (Google + Resend magic link), katalog kursów (`/kursy`, `/kategoria/[slug]`, `/kursy/[slug]`), search Postgres FTS, RatingForm/ReviewForm, blog, panel admina, zgłaszanie kursu, cached ratings, OG images dla kursów/bloga, sitemap, robots, breadcrumb JSON-LD.

### Faza 6 — Embed widget
- `/embed/[slug]` (iframe widget, prominentny brand bar coursed.pl)
- `EmbedSnippet` dialog z kodem iframe — `<Code2/>` trigger, popup z `grid-cols-[minmax(0,1fr)]` żeby nie rozjeżdżał się w poziomie
- Skala opinii na karcie kursu: 5★ (each=2pt) → 10★ (each=1pt)

### Faza 7 — Wiarygodność i moderacja
- `/admin/audyt` — viewer audit logu z filtrami (entity/action/actor/entityId), pagination 50/page, diff JSON w `<details>`
- Anti-spam: `src/lib/spam.ts` — max 2 URLs, max 60% CAPS przy ≥30 literach, cross-course duplikaty
- `/zasady` — publiczne reguły wystawiania opinii i moderacji
- Logout button w `SiteHeader` (variant=secondary, zawsze widoczny)
- Rate-limit per akcja: rate 30/h, review 10/h, vote 60/h, report 10/d, courseRequest 5/d

### Faza 8 — Content + SEO
- „Podobne kursy" na karcie kursu — `getSimilarCourses` z scoring: overlap kategorii ×10 + format ×3 + level ×2 + popularity nudge; emituje `ItemList` JSON-LD
- OG image dla kategorii (1200×630 PNG) — `opengraph-image.tsx` w `/kategoria/[slug]`
- Sitemap z dynamicznymi priorytetami: hot courses 0.9, rated 0.75, unrated 0.55, kategorie ≥5 kursów 0.7, puste 0.3
- CTA „Wszystkie w kategorii X →" w sekcji „Podobne kursy"

### Faza 9 — UX i konwersja
- `/kursy` — filtry UI (kategoria/forma/język/poziom/sort) + przycisk „Wyczyść filtry"
- `/profil` (auth-gated) — lista własnych ocen/opinii z miniaturkami, status badge, link „Edytuj na stronie kursu →", przyciski Usuń ocenę / Usuń opinię
- Server actions: `deleteOwnRating`, `deleteOwnReview` (ownership check + recompute + revalidate)
- Nazwa usera w `SiteHeader` linkuje do `/profil`
- `/faq` — 5 sekcji pytań (rozwijane `<details>`), `FAQPage` JSON-LD, link w stopce
- `/zasady` — przeformatowane: spis treści, sekcje, tabele wymagań (`dl/dt/dd`)

### Faza 10 — Hardening (częściowo)
- ✅ Upstash Redis rate-limit + fallback in-memory (auto-detect env: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`)
- ❌ Sentry — **odrzucony**: `@sentry/nextjs@10.x` niekompat. z Next 16 (odwołuje się do usuniętego `next/document`). Wracamy gdy Sentry doszlifuje wsparcie dla 16-tki, albo bierzemy alternatywę.

---

## Następne kroki

### E) Deploy ← rekomendowany następny krok
Pierwsza produkcja zanim dorzucimy więcej featurów. Stack:
- Vercel (host)
- Neon Postgres (DB z poolingiem)
- Upstash Redis (rate-limit już wired)
- Resend (już skonfigurowane dla magic-link auth)
- Vercel Blob (okładki kursów)

Robocza checklist:
- env vars w Vercel (z `.env.example`)
- `AUTH_URL` na production domain
- `prisma migrate deploy` przy deployment
- DNS, SSL, custom domain
- smoke test prod: home, kurs, ocena, opinia, profil, admin, sitemap, OG images

### C) Testy E2E (Playwright)
Po deployu — zabezpieczenie przed regresjami. Golden path:
- rejestracja przez magic link
- wystawienie oceny + opinii
- vote helpful
- report opinii
- moderacja (jako EDITOR)
- profil → edycja → delete
- CI workflow w GitHub Actions

### A) Resend — powiadomienia
Resend już jest w stacku (magic-link auth). Dorobić maile:
- ukrycie/usunięcie opinii usera (z linkiem do /zasady)
- decyzja moderacji zgłoszonego kursu (PUBLISHED / REJECTED)
- weryfikacja krytyka — gdy admin nada rolę CRITIC
- (longterm) newsletter subscribe — landing → confirm → cotygodniowy digest

### B) Monitoring (zamiast Sentry)
Opcje:
- **Vercel Analytics + Speed Insights** — najprostsze jeśli jesteśmy na Vercel
- **BetterStack / Logtail** — logi + uptime
- **OpenTelemetry → Honeycomb** — pełen tracing, najwięcej roboty

Sentry: ponowna próba gdy ich nextjs SDK obsłuży Next 16 — śledzić https://github.com/getsentry/sentry-javascript/issues

### D) Growth features
- **„Polecane przez redakcję"** — manual flag (boolean) na kursie + sekcja na home + osobny endpoint w sitemap
- **Profile publiczne userów** `/u/{slug}` — ich opinie, średnia ocena, badge krytyka
- **Subskrypcja kategorii** — mail gdy w kategorii pojawi się nowy kurs (cron + mailer)
- **Porównywarka kursów** — `/porownaj?ids=a,b,c` (max 3) — side-by-side tabela atrybutów + ocen
- **Najgorętsze opinie** — feed nowych opinii (sortowane po helpful) na home

---

## Decyzje techniczne

- **Next 16 + Turbopack** — w `AGENTS.md` ostrzeżenie że API różne od wcześniejszych wersji. Czytać `node_modules/next/dist/docs/` przed pisaniem.
- **Prisma 7** + output do `src/generated/prisma`.
- **Auth.js v5 beta** — używamy `requireRole(...)` helper z `src/lib/auth-helpers.ts`.
- **`@base-ui/react`** dla Dialog primitives (uwaga: używa `data-popup-open`, nie `aria-expanded`).
- **Tailwind v4** + shadcn-style components.
- **Skala 1–10** dla ocen (nie 1–5 ani 0–10) — widok jako 10 gwiazdek pełnych, nie 5 z połówkami.
- **Anti-spam**: heurystyki w `lib/spam.ts` (URLs, CAPS, cross-course duplicates) — wywołane przed DB write.
- **Rate-limit**: API async (`await rateLimit(...)`) — Upstash gdy env set, in-memory inaczej.
- **JSON-LD**: Course + AggregateRating + Review na karcie kursu, BreadcrumbList wszędzie, ItemList przy „Podobne kursy", FAQPage na `/faq`.
- **OG images**: per-typ (`opengraph-image.tsx`) dla kursu, kategorii, blog posta.
