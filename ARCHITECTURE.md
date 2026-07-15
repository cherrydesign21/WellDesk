# Dietitian Practice Management Platform — Architecture

Status: draft v1 — pending your review before Module 1 build starts.

## 1. Feature Understanding & Interpretation Calls

All 10 modules from the brief are confirmed as scoped. A few places where I made an explicit interpretation — flag if any are wrong:

- **"Reactivated" is a derived label, not a stored status.** A client's persisted status is one of `active / expired / paused / archived`. "Reactivated" is shown in the UI as a transient badge when a new enrollment cycle starts on a client whose previous cycle had expired — it's cycle history, not a fifth state.
- **Duplicate phone/email check is a soft warning, not a hard DB constraint.** Real dietitian practices have edge cases (shared family phone, re-added archived clients). The app will warn "a client with this phone already exists — view or continue?" rather than a unique constraint that blocks the insert outright.
- **Payment modes (Cash/UPI/Card/Online) are a manual ledger, not a payment gateway integration.** Module 4 reads as "log what the client paid you," not "collect card payments through the app." No Stripe/Razorpay in scope unless you want online collection later.
- **Weight is stored canonically in kg**; kg/lbs is a *display* preference, not a per-entry unit — avoids unit-conversion bugs when comparing visits over time.
- **Diet plan templates and client plans share one table** (`is_template` flag) rather than two parallel schemas, since the meal/item structure is identical either way — "save as template" just copies the tree without `client_id`.
- **Assistant role (Phase 2) gets its column now** (`profiles.role`) since it's a single enum value, but access-control enforcement is deferred until you actually build Phase 2.

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Web frontend | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui | Server components for data-heavy dashboard pages, route handlers double as the API — no separate backend service to deploy/monitor. shadcn gives you accessible primitives you can re-skin per-practice (branding requirement). |
| API layer | Next.js Route Handlers (`app/api/**`) | Same deploy as the frontend on Vercel. Still a clean REST/JSON boundary — when React Native arrives later, it calls the exact same endpoints; no rewrite needed. |
| Database | Supabase Postgres | Managed Postgres + connection pooling out of the box. |
| Auth | Supabase Auth (email/password, magic link) | JWT-based under the hood, satisfies the "JWT + role-based middleware" requirement directly. `profiles.role` drives app-level role checks; `auth.uid()` drives RLS. |
| Multi-tenant isolation | Postgres Row-Level Security keyed on `practice_id` | Tenant isolation enforced *at the database*, not just in app code — a bug in a route handler can't leak another practice's clients. |
| File storage | Supabase Storage (buckets: `avatars`, `logos`, `exports`) | Bundled with the DB/auth choice, avoids standing up S3/R2 separately. |
| Charts | Recharts | Matches your original preference, plays well with shadcn. |
| PDF export | `@react-pdf/renderer` | Lets branded PDF templates (logo, color, font) be written as React components — same styling primitives as the app. |
| Excel export | SheetJS (`xlsx`) | Industry default, no server dependency issues. |
| Word export | `docx` npm package | Only real option for programmatic `.docx` generation. |
| Forms/validation | React Hook Form + Zod | Zod schemas live in `packages/shared` so the future mobile app reuses them verbatim. |
| Data fetching | TanStack Query | Handles the AJAX search/filter/sort requirements (module 7) cleanly with caching. |
| Hosting | Vercel (web+API) + Supabase (DB/auth/storage) | Your chosen combo — fastest path to a live product, minimal ops. |
| Repo tooling | pnpm workspaces (light monorepo) | Only `apps/web` exists today, but `packages/shared` (Zod schemas, types) and `packages/database` (migrations, generated types) are structured so `apps/mobile` (React Native) can slot in later without extracting shared logic out of a monolithic app first. |

**Why not Express/Laravel:** you asked me to pick the best fit — Next.js route handlers cover everything Express would give you here, with one less service to deploy and monitor. Laravel would mean a second language/runtime for no functional gain given the rest of the stack is already TypeScript end-to-end (including the eventual React Native app).

## 3. Database Schema

Full DDL is in [`database/schema.sql`](database/schema.sql). Summary of tables and relationships:

```
practices (tenant root)
 └─ profiles (1:N)            -- extends auth.users, holds role + practice_id
 └─ clients (1:N)
     └─ enrollments (1:N)     -- plan cycles: Cycle 1, Cycle 2...
         ├─ health_metrics (1:N)   -- per-visit, timestamped
         ├─ diet_plans (1:N)       -- versioned, chained via supersedes_plan_id
         │   └─ diet_plan_meals (1:N)
         │       └─ diet_plan_meal_items (1:N)
         └─ payments (1:N)
 └─ diet_plans (is_template=true, no client_id)   -- practice-wide template library
 └─ notifications                                  -- expiry / inactive / overdue alerts
```

Key design decisions baked into the DDL:

- **Every tenant-owned table carries `practice_id`** — this is what RLS policies key off. A row cannot exist without it.
- **`enrollments` is the plan-lifecycle table** (module 8): `cycle_number` increments per client, `plan_type` + `start_date` determine `expiry_date`, `paused_at`/`paused_days_total` implement the "pause freezes expiry" requirement, and old cycles are never deleted — "Restart Plan" just inserts a new row.
- **`health_metrics.bmi` is NOT a stored/generated column** — computed in the app layer from `weight_kg` + `height_cm` at write time and again on read for any historical unit-preference changes, since a generated column would need to know the display unit at insert time.
2 **Payment status (Paid/Partial/Overdue) is derived, not stored** — `SUM(payments.amount) vs enrollments.plan_amount`, exposed via a view (`v_enrollment_payment_status`) so it can never drift out of sync with the actual payment log.
- **Two helper views** ship in the schema: `v_expiring_clients` (enrollments expiring in ≤30 days) and `v_inactive_clients` (no `health_metrics` row in 14+ days) — these back module 9's alerts directly with a query, no separate alert-computation job needed for the MVP.

## 4. Project Folder Structure

```
diet/
├── apps/
│   └── web/                              # Next.js 14 App Router
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   ├── register/page.tsx     # creates practice + owner profile
│       │   │   └── layout.tsx
│       │   ├── (dashboard)/
│       │   │   ├── clients/
│       │   │   │   ├── page.tsx          # list, filters, search, bulk actions
│       │   │   │   └── [clientId]/
│       │   │   │       ├── page.tsx      # overview + enrollment timeline
│       │   │   │       ├── metrics/page.tsx
│       │   │   │       ├── diet-plans/page.tsx
│       │   │   │       └── payments/page.tsx
│       │   │   ├── diet-plans/templates/page.tsx
│       │   │   ├── payments/page.tsx     # cross-client payment report
│       │   │   ├── reports/page.tsx      # dashboard analytics
│       │   │   ├── settings/branding/page.tsx
│       │   │   └── layout.tsx            # sidebar/nav shell
│       │   ├── api/
│       │   │   ├── clients/[...]/route.ts
│       │   │   ├── metrics/[...]/route.ts
│       │   │   ├── diet-plans/[...]/route.ts
│       │   │   ├── payments/[...]/route.ts
│       │   │   └── exports/[pdf|xlsx|docx]/route.ts
│       │   └── layout.tsx
│       ├── components/
│       │   ├── ui/                       # shadcn primitives
│       │   ├── clients/  metrics/  diet-plans/  payments/  charts/
│       ├── lib/
│       │   ├── supabase/{server,client,middleware}.ts
│       │   ├── exports/{pdf,xlsx,docx}.ts
│       │   └── utils/
│       ├── hooks/
│       ├── middleware.ts                 # auth guard + role check
│       └── package.json
├── packages/
│   ├── shared/
│   │   ├── schemas/                      # Zod: client, enrollment, metric, plan, payment
│   │   ├── types/
│   │   └── constants/                    # plan durations, meal slot defaults, curated fonts
│   └── database/
│       ├── migrations/                   # Supabase SQL migrations (source of truth)
│       └── types.ts                      # generated via `supabase gen types typescript`
├── supabase/
│   └── config.toml
├── database/
│   └── schema.sql                        # full DDL, mirrored into packages/database/migrations
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── .env.example
└── README.md
```

`apps/mobile` (React Native, Expo) gets added under `apps/` later, importing `packages/shared` directly — no restructuring needed when that phase starts.

## Open items before Module 1

1. Confirm the interpretation calls in section 1, especially the duplicate-check and template-table decisions.
2. Curated font list (6–8 options) and default brand color — any preference, or should I pick a sensible default set?
3. Currency — schema defaults to INR given UPI is in the payment modes list. Confirm, or is this multi-currency from day one?
