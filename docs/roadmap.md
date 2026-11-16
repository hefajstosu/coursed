# Roadmap

What's built and what's next. Numbers like `#13` are referenced in code comments.

## Done

### Foundation
Prisma schema (courses, categories, ratings, reviews, votes, reports, requests, blog, audit log), Auth.js v5 (Google + magic link), course catalog and course pages, Postgres full-text search, rating and review forms, blog, admin panel, course submissions, cached ratings, Open Graph images, sitemap, robots, breadcrumb JSON-LD.

### Embed widget
- `/embed/[slug]` iframe widget and `/api/embed/[slug]` JSON endpoint (CORS)
- “Embed on your site” dialog with the iframe snippet

### Trust and moderation
- Audit log viewer with filters (entity, action, actor, entity ID) and JSON diffs
- Spam heuristics: max 2 links, max 60% capitals (≥30 letters), cross-course duplicates
- Public moderation rules page (`/zasady`)
- Per-action rate limits: rating 30/h, review 10/h, vote 60/h, report 10/day, submission 5/day, magic link 5/h per address and 20/h per IP

### Content and SEO
- “Similar courses” scored by category overlap, format, level and popularity, with `ItemList` JSON-LD
- Open Graph images for categories
- Sitemap priorities derived from popularity
- FAQ page with `FAQPage` JSON-LD

### UX
- Catalog filters (category, format, language, level, sort)
- `/profil`: own ratings and reviews, edit and delete

### Compliance (GDPR)
- **#1** Privacy policy · **#2** Terms of service · **#3** Cookie consent banner
- **#4** Account deletion (cascade + rating recompute) and JSON data export

### Core review features
- **#5** Verified reviews (granted by editors, audited)
- **#6** Rating histogram (1–10)
- **#7** Review pagination and sorting (most helpful / newest)
- **#8** Editorial responses to reviews
- **#9** Aspect ratings (content, instructor, value for money)

### Engagement
- **#10** Email notifications (review hidden/removed, submission decision, critic role granted)
- **#11** Follow a course; followers are emailed about new reviews
- **#13** Public user profiles `/u/[slug]`

### Supply side
- **#15** Creator accounts: “claim this listing” flow, admin approval, owners can respond to reviews

### Moderation and UX details
- **#16** User bans (blocks all writes)
- **#17** Search autocomplete with keyboard navigation
- **#18** “Edited” marker on reviews
- **#19** “Hottest reviews” and “editors' picks” on the home page

### Hardening
- Upstash Redis rate limiting with in-memory fallback
- Security headers, CSP `frame-ancestors`, JSON-LD and email HTML escaping
- Role checks on every admin page, not only in the layout
- Serialized rating recompute (advisory lock)
- Unit tests (Vitest) and CI (GitHub Actions)

## Next

- **End-to-end tests (Playwright)** — sign-in, rating, review, vote, report, moderation as EDITOR, profile edit/delete; run in CI against a seeded database.
- **#12 Newsletter / category subscriptions** — email when a new course appears in a followed category (cron + mailer).
- **#14 Course comparison** — `/porownaj?ids=a,b,c`, side-by-side attributes and scores (max 3).
- **Monitoring** — Vercel Analytics and Speed Insights; error tracking once Sentry fully supports Next.js 16.
- **Creator dashboard** — review statistics and claim decision emails for course owners (#15 follow-up).
- **Self-serve review verification** — proof of purchase / participation upload (#5 follow-up).
