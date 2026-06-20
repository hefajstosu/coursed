# Deploy coursed.pl — instrukcja krok po kroku

Stack: **Next.js 16** na **Vercel** (region `fra1`) · baza **Neon Postgres** · **Prisma 7** ·
Auth.js v5 (Google OAuth + Resend magic-link) · Vercel Blob (okładki) · Upstash Redis (rate-limit).

Build na Vercel: `prisma migrate deploy && next build` (z `vercel.json`) — **migracje lecą
automatycznie przy każdym deployu**, nie trzeba ich odpalać ręcznie.

Status: zaznaczaj `[x]` po wykonaniu.

---

## KROK 0 — Przygotowanie lokalne (sanity check)
- [x] `pnpm install`
- [x] `pnpm build` — ✅ przechodzi lokalnie (zweryfikowane 2026-06-18).
- [ ] `git status` czysty, wszystko na `main` zacommitowane i wypushowane.

## KROK 1 — Baza danych (Neon) ✅
- [x] Projekt na Neon utworzony (Postgres 18, Frankfurt). Baza `neondb`.
- [x] Connection stringi (pooled `DATABASE_URL` + direct `DIRECT_URL`) skopiowane na bok.
- [ ] ⚠️ Przed launchem: reset hasła roli `neondb_owner` (stare wyciekło do czatu) + podmiana w stringach.

## KROK 2 — AUTH_SECRET ✅
- [x] Wygenerowany przez `openssl rand -base64 33`, zapisany na bok jako `AUTH_SECRET`.

## KROK 3 — Google OAuth ✅
- [x] Projekt `coursed` + klient OAuth „coursed.pl” utworzony.
- [x] Redirect URI: `https://coursed.pl/api/auth/callback/google` + `http://localhost:3000/...` — zapisane.
- [x] `AUTH_GOOGLE_ID` i `AUTH_GOOGLE_SECRET` skopiowane na bok.
- [ ] ⚠️ Przed publicznym launchem: w „Odbiorcy/Audience” opublikować aplikację (Publish) — inaczej zalogują się tylko użytkownicy testowi.

## KROK 4 — Resend (magic-link + maile transakcyjne) ✅
- [x] Domena `coursed.pl` dodana, 4 rekordy DNS (DKIM/SPF/MX/DMARC) wpisane w OVH na subdomenie `send` + `resend._domainkey` + `_dmarc`. Kliknięte „I've added the records".
- [ ] ⏳ Poczekać aż statusy w Resend zrobią się zielone (Verified) — propagacja DNS w OVH do kilku godzin.
- [x] Klucz API `AUTH_RESEND_KEY` (`re_...`) utworzony i zapisany.
- [x] `EMAIL_FROM` = `coursed.pl <noreply@coursed.pl>`

## KROK 5 — Vercel Blob (okładki kursów) ❌ NIEPOTRZEBNE
- Pominięte. `@vercel/blob` nie jest zainstalowany, brak uploadu plików w kodzie.
  Okładki kursów to zwykłe pole `coverUrl` (URL wklejany ręcznie). `BLOB_READ_WRITE_TOKEN` zbędny.

## KROK 6 — Projekt na Vercel + zmienne środowiskowe
- [ ] https://vercel.com → „Add New… → Project” → zaimportuj repo z GitHuba.
- [ ] Framework: Next.js (wykryje sam). Build/Output zostaw domyślne (steruje `vercel.json`).
- [ ] Settings → Environment Variables — dodaj wszystkie (scope: Production, opcjonalnie Preview):

  | Zmienna | Wartość / źródło |
  |---|---|
  | `DATABASE_URL` | pooled z Neon (KROK 1) |
  | `DIRECT_URL` | direct z Neon (KROK 1) |
  | `AUTH_SECRET` | z KROK 2 |
  | `AUTH_GOOGLE_ID` | z KROK 3 |
  | `AUTH_GOOGLE_SECRET` | z KROK 3 |
  | `AUTH_RESEND_KEY` | z KROK 4 |
  | `EMAIL_FROM` | `coursed.pl <noreply@coursed.pl>` |
  | `AUTH_URL` | `https://coursed.pl` (bez slasha na końcu) |
  | `UPSTASH_REDIS_REST_URL` | z KROK 7 |
  | `UPSTASH_REDIS_REST_TOKEN` | z KROK 7 |

## KROK 7 — Upstash Redis (rate-limit) ✅
- [x] Baza Redis `coursed` (Frankfurt) utworzona.
- [x] `UPSTASH_REDIS_REST_URL` i `UPSTASH_REDIS_REST_TOKEN` (z sekcji REST API) zapisane.

## KROK 8 — Pierwszy deploy ✅
- [x] Deploy udany. Migracje zaaplikowane, `next build` OK, strona renderuje się na `*.vercel.app`.

## KROK 9 — Domena coursed.pl ✅
- [x] `coursed.pl` dodana w Vercel (apex główny, bez www-redirectu).
- [x] OVH: rekord `@ A` zmieniony `213.186.33.5` → `216.198.79.1`. Rekordy poczty/Resend nietknięte.
- [x] DNS rozpropagowany (potwierdzone na 8.8.8.8 / 1.1.1.1 / OVH auth). HTTPS 200 + ważny SSL.
- [ ] Follow-up (opcjonalnie): przekierowanie `www.coursed.pl` → `coursed.pl`.

## KROK 10 — Pierwszy administrator ✅
- [x] Zalogowano (magic-link + Google). Konto podniesione do ADMIN przez Neon SQL Editor. `/admin` dostępny.
- [x] Fix: `allowDangerousEmailAccountLinking` na Google (commit „auth change") — logowanie Google na konto z magic-linku działa.

### (oryginalna instrukcja)
Logowanie przez Google tworzy konto z rolą `USER`. Trzeba ręcznie nadać sobie `ADMIN`:
- [ ] Zaloguj się na produkcji swoim docelowym adminowym mailem (Google lub magic-link).
- [ ] Nadaj rolę ADMIN jednym ze sposobów:
  - **Neon SQL Editor:** `UPDATE "User" SET role = 'ADMIN' WHERE email = 'twoj@email';`
  - **lub** lokalnie z prod-URL: `pnpm db:studio` → tabela User → zmień `role` na ADMIN.
- [ ] ⚠️ Seed (`pnpm db:seed`) to **dane demo** — NIE odpalaj na produkcji.

## KROK 11 — Smoke test po deployu
> 🐞 Znaleziony i naprawiony w trakcie smoke testu (commit `0cb6f82`):
> dodawanie kategorii rzucało 500 — pusty `parentId` z formularza łamał FK
> `Category_parentId_fkey` (P2003). Schemat zod normalizuje teraz "" → undefined.

- [ ] Logowanie Google działa.
- [ ] Magic-link (e-mail z Resend) dochodzi i loguje.
- [ ] Dodanie opinii / oceny działa.
- [ ] Panel `/admin/*` dostępny dla konta ADMIN.
- [ ] Upload okładki kursu (Blob) działa.
- [ ] `sitemap.xml` i `robots.txt` zwracają poprawny host (`coursed.pl`).

## KROK 12 — Compliance przed ogłoszeniem (dług z poprawki.md)
- [x] Dane operatora uzupełnione w `/polityka-prywatnosci` i `/regulamin` (commit `99cb6c5`):
      1000 Miast Tomasz Wilkosz, NIP 9551896675, REGON 811690936, pl. Grodnicki 1, 70-210 Szczecin.
- [ ] Zalecane: weryfikacja obu dokumentów u prawnika.
- [ ] Sprawdź baner cookie consent na produkcji.

## KROK 13 — TODO przed publicznym ogłoszeniem
- [x] 🔴 Reset hasła roli `neondb_owner` w Neon + podmiana `DATABASE_URL`/`DIRECT_URL` w Vercel + redeploy. Stare (zczatowane) hasło unieważnione, strona działa.
- [ ] 🟠 Opublikuj aplikację Google OAuth (Google Cloud → „Odbiorcy" → Publish) — inaczej logują się tylko użytkownicy testowi.
- [ ] 🟢 (opcjonalnie) przekierowanie `www.coursed.pl` → `coursed.pl`.

---

### Niedeployowane funkcje (świadomie odłożone — nie blokują launchu)
- #12 Newsletter / subskrypcja kategorii (ROADMAP D / longterm)
- #14 Porównywarka kursów `/porownaj` (ROADMAP D)
