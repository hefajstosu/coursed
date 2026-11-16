# Product concept

coursed.pl is a portal for rating and reviewing online and offline courses, modelled on film review sites: every course has its own page, a set of scores, and reviews from both regular users and verified critics / the editorial team.

Course reviews today are scattered across marketplaces, rankings and niche sites. The goal is one neutral place to find a good course, compare it with alternatives and judge its quality from community and expert opinions.

## Rating rules

Each course has three scores:

- **user score** — average of ratings from regular users,
- **critic score** — average of ratings from critics / editors,
- **overall score** — the headline number: a **50/50 average** of the two, regardless of how many ratings each group has.

Edge cases:

- if only one group has ratings, the overall score equals that group's average and the UI says so explicitly;
- a group below its minimum count (3 user ratings, 1 critic rating) is treated as “not enough ratings” — its count is shown, its average is not.

Ratings use a **1–10 scale**, displayed as ten stars. Optional aspect scores (content quality, instructor, value for money) are averaged separately and shown next to the main score.

Reviews can be filtered by type (all / users / critics), voted helpful or unhelpful, and reported.

## Course data

Required: title, cover image, short description, author.
Extended: platform, official link, price or pricing model, language, level, format (online / offline / hybrid), last update date, certificate, location for offline courses.

These fields drive catalog filters, category landing pages and course comparisons.

## Catalog and SEO

Courses are organised in categories and subcategories (e.g. programming, business, languages, exam prep, finance). Every category is an indexable landing page, not just a filter. Course pages, category pages and the editorial blog link to each other to build internal linking and cover search intent.

## Trust and moderation

A review platform without quality control quickly fills with spam and manipulation, so the product includes from the start:

- verified reviews and a clear policy for verified critics,
- reporting of reviews and a moderation queue,
- public moderation rules (`/zasady`),
- an audit log of every moderation action,
- rate limits, spam heuristics and user bans.

## Admin panel

Adding and editing courses, moderating reviews, handling course submissions and abuse reports, blog posts, managing critics and editors, merging duplicate courses, and auditing changes.

## Embeddable widget

Course owners can embed their course's score on their own site via an `<iframe>` (overall score, number of ratings, link back to the full course page). It builds brand awareness and external touchpoints.

## Possible monetisation (not implemented)

Models that don't undermine trust in the scores: affiliate links to course sales pages, premium creator profiles, a paid reputation badge, clearly labelled sponsored roundups, B2B lead generation, paid analytics for creators.
