# Church CMS

A multi-tenant church management SaaS modeled on Elvanto. Built to be **sold
to multiple churches**, with hard data isolation between tenants and
financial-grade security from the ground up.

## Modules

- **People & Families** — directory, custom fields, family links, categories
- **Groups** — small groups, leaders, attendance tracking
- **Services & Worship** — service plans, run sheets, song library with
  lyrics + chords, volunteer scheduling with accept/decline
- **Giving** — funds, manual donations, Stripe-powered online giving,
  webhook with signature verification + idempotency
- **Events & Check-in** — events with registrations, secure child check-in
  with random guardian codes
- **Communication** — email + SMS campaigns (Resend + Twilio behind a
  pluggable interface; dev fallback logs to console)
- **Forms** — public form builder with submissions
- **Reports** — YTD giving by month and fund, attendance, growth
- **Settings** — org profile, team & role management, service types,
  volunteer positions, audit log viewer

## Security

| Concern | Implementation |
|---|---|
| Tenant isolation | Postgres **Row-Level Security** on every tenant table + app-layer scoping. The app runs as a NON-superuser so policies are enforced. Each request uses `withTenant(orgId, ...)` which sets `app.current_org` in the transaction. |
| Passwords | argon2id with strong parameters |
| Sessions | Random 256-bit tokens, httpOnly + SameSite cookies, DB-backed |
| 2FA | TOTP (RFC 6238, self-contained) |
| Login | Per-IP+email rate limiting, account lockout after 10 failed attempts |
| RBAC | OWNER / ADMIN / STAFF / GROUP_LEADER / VOLUNTEER / MEMBER, enforced on every server action |
| Audit | `AuditLog` records actor, action, entity, IP — wrapped in withTenant |
| Payments | **No card data stored**. Stripe Checkout tokenization; webhook signed with `STRIPE_WEBHOOK_SECRET` |
| Headers | CSP-friendly headers via middleware: X-Frame-Options, Referrer-Policy, X-Content-Type-Options, HSTS (prod) |
| Validation | Zod at every server-action boundary |

## Running locally

### Prerequisites

- Node.js 22+
- Postgres 16+ running locally (or Docker)

### One-time setup

```bash
# 1) Create the database + non-superuser app role
psql -U postgres -c "CREATE ROLE cms_app LOGIN PASSWORD 'cms_dev_pw' NOSUPERUSER CREATEDB;"
psql -U postgres -c "CREATE DATABASE church_cms OWNER cms_app;"

# 2) Copy env template
cp .env.example .env
# DATABASE_URL: as the cms_app role (RLS will apply)
# SYSTEM_DATABASE_URL: as postgres superuser (for signup + Stripe webhook
#   bootstrap paths that must cross tenant boundaries)

# 3) Install deps
npm install

# 4) Run migrations (schema + RLS policies)
npx prisma migrate dev

# 5) Seed two demo churches
npm run db:seed
```

### Demo accounts

After seeding:

| Church | Email | Password |
|---|---|---|
| Joy Center Church | `pastor@joycenter.local` | `Password!1234` |
| Grace Hill Fellowship | `pastor@gracehill.local` | `Password!1234` |

### Develop

```bash
npm run dev          # http://localhost:3000
npm run build        # production build
npm run db:reset     # wipe + migrate (no seed)
npm run db:seed      # re-seed
```

## Project layout

```
prisma/
  schema.prisma                          # full data model
  migrations/
    20260526223415_init/                 # tables
    20260526223416_rls/                  # RLS policies
  seed.ts                                # two demo churches
src/
  lib/
    db.ts                                # Prisma client + admin client
    tenant.ts                            # withTenant() + getTenantContext()
    permissions.ts                       # RBAC roles + requirePermission
    session.ts                           # session create/get/destroy/switchOrg
    password.ts                          # argon2id wrappers
    totp.ts                              # RFC 6238 TOTP
    rateLimit.ts                         # in-memory rate limiter (swap for Redis)
    audit.ts                             # tenant-scoped audit log writes
    stripe.ts                            # Stripe client (lazy)
    messaging.ts                         # email/SMS senders (pluggable)
  middleware.ts                          # auth gate + security headers
  app/
    page.tsx                             # public landing
    (auth)/login, (auth)/signup          # auth pages
    (app)/...                            # every authenticated module
    (public)/f/[slug]                    # public form pages + submission
    api/webhooks/stripe                  # Stripe webhook (signature-verified)
```

## How tenant isolation actually works

1. User logs in → session cookie issued. `Membership` table tells us which
   orgs the user belongs to.
2. On every request, the layout (or `getTenantContext()`) derives the
   `organizationId` from the session — **never from request input**.
3. Module queries call:
   ```ts
   await withTenant(ctx.organizationId, async (tx) => {
     return tx.person.findMany(); // RLS automatically scopes
   });
   ```
4. Inside `withTenant`, the first statement is
   `SET LOCAL app.current_org = '<orgId>'`. Every Postgres RLS policy on
   tenant tables matches `organizationId = current_setting('app.current_org', true)`.
5. The app connects as `cms_app` (NON-superuser) so the policies cannot
   be bypassed by application bugs.

For narrow bootstrap paths that must cross tenants — login lookup,
signup, Stripe webhook, public form submission — there's a separate
`dbAdmin` client (using `SYSTEM_DATABASE_URL`). In production, replace
this with a dedicated low-privilege role that has narrow GRANTs rather
than a superuser.

## What's not in this draft

This is a working draft of the full system. Genuine production
deployment still needs:

- Replace `dbAdmin` superuser with a narrow-grant role for public ops
- Replace in-memory rate limiter with Redis (Upstash)
- File storage for profile photos (S3/R2)
- Real email/SMS providers configured (Resend, Twilio keys)
- Stripe Connect for per-church payout (currently a single Stripe account)
- CSRF tokens on form actions (Next.js server actions cover this for
  same-origin requests, but verify before going live)
- Backups + point-in-time recovery on Postgres
- Penetration test before launch — financial data is involved
