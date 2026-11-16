# Deployment

Production runs on **Vercel** (region `fra1`) with **Neon** Postgres, **Upstash** Redis and **Resend** for email.

`vercel.json` sets the build command to `prisma migrate deploy && next build`, so pending migrations are applied automatically on every deploy.

## 1. Database — Neon

1. Create a Neon project in an EU region (Frankfurt, to match `fra1`).
2. Copy two connection strings:
   - **pooled** (PgBouncer) → `DATABASE_URL`, used by the app at runtime;
   - **direct** (unpooled) → `DIRECT_URL`, used by `prisma migrate deploy` (migrations can fail through PgBouncer in transaction mode).

`prisma.config.ts` uses `DIRECT_URL` when set and falls back to `DATABASE_URL`.

## 2. Auth secret

```bash
pnpm dlx auth secret   # or: openssl rand -base64 33
```

Store the value as `AUTH_SECRET`.

## 3. Google OAuth

1. Google Cloud Console → APIs & Services → Credentials → OAuth client (Web application).
2. Authorized redirect URIs:
   - `https://<your-domain>/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`
3. Store `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
4. Before launch, publish the OAuth app (Audience → Publish); otherwise only test users can sign in.

## 4. Email — Resend

1. Add your domain in Resend and create the DNS records it lists (DKIM, SPF, MX on the sending subdomain, DMARC). Wait until they show as verified.
2. Create an API key → `AUTH_RESEND_KEY`.
3. Set `EMAIL_FROM`, e.g. `coursed.pl <noreply@coursed.pl>`.

Without `AUTH_RESEND_KEY` the magic-link option is disabled and transactional emails are skipped (no-op).

## 5. Rate limiting — Upstash Redis

Create a Redis database (Frankfurt) and copy the REST credentials to `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

Without them the limiter falls back to in-memory buckets, which is fine for development but ineffective across multiple serverless instances.

## 6. Vercel project

1. Import the GitHub repository; the Next.js preset is detected automatically.
2. Add environment variables (Production, optionally Preview):

| Variable | Source |
| --- | --- |
| `DATABASE_URL` | Neon, pooled |
| `DIRECT_URL` | Neon, direct |
| `AUTH_SECRET` | step 2 |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | step 3 |
| `AUTH_RESEND_KEY`, `EMAIL_FROM` | step 4 |
| `AUTH_URL` | `https://<your-domain>` (no trailing slash) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | step 5 |

3. Deploy, then add the custom domain and point its DNS records at Vercel as instructed in the dashboard.

## 7. First administrator

New accounts get the `USER` role. Sign in once on production, then promote your account:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Further roles (EDITOR, CRITIC) and bans can then be managed in `/admin/uzytkownicy`.

> `pnpm db:seed` inserts **demo data** — never run it against production.

## 8. Smoke test

- Google sign-in and magic-link sign-in
- Rate a course, write a review, vote, report
- `/admin` is reachable for ADMIN/EDITOR and redirects everyone else
- `/sitemap.xml` and `/robots.txt` use the production host
- Open Graph images render for a course, a category and a blog post
- The cookie banner appears on first visit
