# DogVita CRM Dashboard — Architecture

> **Status:** Finalised design (v1.0)
> **Date:** 2026-06-27
> **Owner:** DogVita Platform Team
> **Scope:** Admin/operator-facing CRM dashboard for the DogVita dog-health platform (manages owners, dogs/patients, devices, subscriptions, support, vet partnerships, campaigns, and platform-wide analytics).
> **Backend:** Shared with the mobile app — same Supabase project (`bxvihftrfamglqrilkok`).

---

## Table of Contents

1. [Goals & Non-Goals](#1-goals--non-goals)
2. [Context: What Exists Today](#2-context-what-exists-today)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Tech Stack Decision](#4-tech-stack-decision)
5. [Identity, Roles & Access Control](#5-identity-roles--access-control)
6. [Data Model — New Tables & Extensions](#6-data-model--new-tables--extensions)
7. [Backend: RLS Strategy & Edge Functions](#7-backend-rls-strategy--edge-functions)
8. [Realtime & Notifications Pipeline](#8-realtime--notifications-pipeline)
9. [Frontend: State, Data Fetching & Theme](#9-frontend-state-data-fetching--theme)
10. [CRM Module Breakdown (Feature by Feature)](#10-crm-module-breakdown-feature-by-feature)
11. [Screen Inventory & Navigation](#11-screen-inventory--navigation)
12. [Analytics & KPIs](#12-analytics--kpis)
13. [Security, Privacy & Compliance](#13-security-privacy--compliance)
14. [Observability & Operations](#14-observability--operations)
15. [Project Structure](#15-project-structure)
16. [Phased Delivery Plan](#16-phased-delivery-plan)
17. [Open Questions / Decisions Log](#17-open-questions--decisions-log)
18. [Appendix A: Full SQL Migration](#appendix-a-full-sql-migration)
19. [Appendix B: Shared TypeScript Types](#appendix-b-shared-typescript-types)
20. [Appendix C: Edge Function Contract Reference](#appendix-c-edge-function-contract-reference)

---

## 1. Goals & Non-Goals

### Goals

- Give DogVita staff a **single operator console** to manage every entity the mobile app produces: owners (profiles), dogs (patients), BLE collar devices, health alerts, subscriptions/billing, support tickets, vet partnerships, and outbound campaigns.
- Provide **platform-wide analytics & operational KPIs** that are impossible to see from a single user's mobile app (fleet health, churn, MRR, alert storm detection, device offline rates).
- Enable **cross-tenant admin actions** (impersonation, refunds, force-resolve alerts, push broadcast) that the mobile app's per-user RLS policies deliberately forbid.
- Share the **exact same Supabase backend and TypeScript domain types** as the mobile app — one source of truth, no data duplication.
- Be **web-based** (operators are desk-bound) but feel consistent with the mobile app's premium pet-wellness aesthetic (honey-orange `#F3A93B`, cream `#F5E9CD`, cocoa text).

### Non-Goals (v1)

- Not a replacement for the mobile app — end-users (dog owners) never see the CRM.
- No in-browser BLE or map rendering of live collar telemetry at scale (telemetry lands in `health_metrics`/`locations`; the CRM reads aggregated rows, not raw BLE streams).
- No marketing-CRM features beyond a basic campaign/announcement sender (no email-template builder, no A/B testing in v1).
- No self-serve owner portal (owners use the mobile app).

---

## 2. Context: What Exists Today

The mobile app (`dog-health-app/`) is React Native 0.76, TypeScript strict, **Zustand v5** stores (one per domain, persisted to AsyncStorage), **Supabase** backend (auth + Postgres + Realtime), React Navigation 7. Current Supabase schema (from `supabase/schema.sql`):

| Table | Purpose | RLS Scope |
|-------|---------|-----------|
| `profiles` | Extends `auth.users` (email, phone, display_name, avatar_url) | own row |
| `dogs` | Dog profiles (owner_id, name, breed, birth_date, weight_kg, gender, photo_url, is_active) | owner only |
| `devices` | BLE collars (dog_id, ble_mac_address, firmware_version, is_connected, last_seen_at) | owner's dogs |
| `health_metrics` | Time-series (heart_rate_bpm, temperature_celsius, battery_level, activity_steps/minutes/calories) | owner's dogs |
| `alerts` | Health alerts (alert_type enum, severity enum, is_acknowledged) | owner only |
| `locations` | GPS points (lat/lng/accuracy/speed) | owner's dogs |
| `geofences` | Owner-scoped geofences | owner only |
| `routes` | Recorded walks (start/end, distance, duration, locations_json) | owner's dogs |

**Critical constraints the CRM must respect:**
- **All existing tables have owner-scoped RLS.** The CRM cannot read them with the anon/user key. It must use either the **service-role key (server-side only)** or **new admin-scoped RLS policies + Edge Functions**. The service-role key MUST NEVER ship to the browser (see §5, §7).
- **No Redux** anywhere in the ecosystem. The web CRM will use Zustand too (for parity and to reuse store-shaped logic), plus TanStack Query for server state.
- **Theme tokens** come from `app/theme/` on mobile; the CRM will mirror these tokens into a Tailwind config so both surfaces stay visually aligned.

---

## 3. High-Level Architecture

```
┌─────────────────────────┐        ┌─────────────────────────┐
│   Mobile App (RN 0.76)  │        │   CRM Dashboard (Web)   │
│  Owners / dog owners    │        │  Staff / operators      │
│  Zustand + RN Navigation│        │  Next.js + Zustand +    │
│                         │        │  TanStack Query         │
└───────────┬─────────────┘        └───────────┬─────────────┘
            │                                  │
            │ anon key (RLS-enforced)          │ anon key + admin JWT claim (RLS-enforced)
            │                                  │ (service-role key ONLY in Edge Fns / server)
            ▼                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE PROJECT                         │
│           bxvihftrfamglqrilkok.supabase.co                  │
│                                                             │
│  Postgres (existing + new CRM tables) ── RLS everywhere     │
│  Auth (email+pass, phone+OTP, SSO for staff)                │
│  Realtime (postgres_changes)                                │
│  Storage (avatars, device firmware, campaign assets)        │
│  Edge Functions (Deno) ── admin-only, cross-tenant ops      │
└─────────────────────────────────────────────────────────────┘
            ▲                                  ▲
            │                                  │
   ┌────────┴─────────┐               ┌────────┴─────────┐
   │ ESP32-S3 Collars │               │  External Svcs   │
   │  (via app BLE)   │               │ Stripe, Twilio,  │
   └──────────────────┘               │ Resend/SES, S3   │
                                       └──────────────────┘
```

**Three trust boundaries:**

1. **Browser → Supabase** — uses anon key. A custom `is_admin` / `role` JWT claim plus RLS policies gate every query. The browser NEVER holds the service-role key.
2. **Edge Function → Supabase** — uses service-role key (server-side Deno, env-var only). This is the only place cross-tenant writes (refunds, broadcasts, deletions) happen, and each function re-verifies the caller's admin claim.
3. **Mobile app → Supabase** — unchanged. Owner-scoped RLS keeps owners in their lane.

---

## 4. Tech Stack Decision

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | **Next.js 14 (App Router)** | SSR for fast first paint, server components for sensitive reads, route-level auth middleware. Operators use desktop browsers. |
| **Language** | TypeScript (strict) | Parity with mobile app; shared domain types. |
| **Server state** | **TanStack Query v5** | Caching, background refetch, optimistic updates, pagination — the heavy lifting for list/detail admin views. |
| **Client state** | **Zustand v5** | Parity with mobile (same mental model); used only for genuinely client-side state (active filters, sidebar, command-palette, session). NOT for server data. |
| **Forms** | react-hook-form + zod | Already used on mobile; reuse resolver patterns. |
| **Styling** | **Tailwind CSS** + **shadcn/ui** | Tailwind config ingests the DogVita theme tokens (§9.3) so colours match mobile exactly. shadcn gives accessible, themeable primitives (DataTable, Dialog, Sheet, Combobox). |
| **Charts** | **Recharts** (web) | Mobile uses `react-native-gifted-charts`; Recharts is the web-standard, shares the same colour tokens. |
| **Tables** | **TanStack Table v8** (via shadcn DataTable) | Sorting, filtering, column visibility, row selection for bulk admin actions. |
| **Auth** | Supabase Auth + Next.js middleware | Cookie-based session; middleware gates `/app/*` on `is_admin` claim. Optional SSO (Google Workspace / SAML) for staff. |
| **Deployment** | Vercel (or self-host Node) | Edge Functions stay in Supabase; Next.js on Vercel. |
| **Package sharing** | Monorepo (npm workspaces) **OR** published `@dogvita/types` package | One decision (§17) — extract `app/types/*` into a shared package so both apps import the same `Dog`, `HealthAlert`, etc. |

**Rejected alternatives & why:**

- **React Admin / Refine** — opinionated data-provider layer fights Supabase RLS and our Edge-Function-first admin model; less control over the premium look.
- **Redux Toolkit** — explicitly banned across the DogVita ecosystem (see root `AGENTS.md`).
- **Building the CRM inside the RN app as a hidden admin screen** — operators need desktop keyboards/multi-column tables; RN web is not worth the trade-off.

---

## 5. Identity, Roles & Access Control

### 5.1 Role model

Add a `role` column to `profiles` and mirror it into the JWT via a Supabase custom claim.

```
role: 'owner' | 'admin' | 'support' | 'vet'      default 'owner'
```

| Role | Can access CRM? | Capabilities |
|------|------------------|--------------|
| `owner` | No | (mobile app only) unchanged |
| `support` | Yes (read-mostly) | View owners/dogs/alerts/tickets; create tickets; send messages; **no** billing writes, **no** deletions, **no** broadcasts |
| `admin` | Yes (full) | Everything support can do + billing/refunds, device reassignment, broadcasts, impersonation, user suspension, destructive ops |
| `vet` | Limited | Scoped to dogs flagged as their patients (§6.6); read health metrics + alerts for those dogs only |

### 5.2 JWT custom claim

A Supabase auth hook (or `profiles` trigger) injects `role` and `is_admin` into the access token:

```sql
-- see Appendix A.1 for the full function
create function public.custom_access_token(event jsonb)
returns jsonb language plpgsql security definer as $$
declare
  r text;
begin
  select role into r from public.profiles where id = (event->>'user_id')::uuid;
  return jsonb_build_object(
    'claims', jsonb_build_object(
      'role', coalesce(r,'owner'),
      'is_admin', r in ('admin')
    )
  );
end; $$;
```

RLS policies then read `coalesce((auth.jwt() -> 'claims' ->> 'role')::text, 'owner')` instead of just `auth.uid()`. The browser still only ever holds the **anon key** — the *user's own JWT* (which carries the claim) is what authorises admin reads.

### 5.3 Hard rule

> **The Supabase service-role key is never present in the browser bundle.** It lives only in Edge Function / Next.js server-component environment variables. Any cross-tenant write goes through an Edge Function that (a) verifies the caller's admin JWT and (b) performs the write with the service role. This keeps a single compromised browser session from bypassing RLS.

### 5.4 Auditability

Every privileged action writes a row to `admin_audit_log` (§6.9) — including **impersonation start/stop**, refunds, broadcasts, suspensions, and deletions. The CRM UI surfaces "Recent admin actions" on the operator's profile.

---

## 6. Data Model — New Tables & Extensions

All new tables live in the **same Supabase project**. Existing tables get additive columns only (no breaking changes to the mobile app).

### 6.1 `profiles` (extend)

```sql
alter table public.profiles
  add column if not exists role text not null default 'owner'
    check (role in ('owner','admin','support','vet')),
  add column if not exists status text not null default 'active'
    check (status in ('active','suspended','invited','deleted')),
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists country_code text,
  add column if not exists timezone text,
  add column if not exists tags text[] default '{}',
  add column if not exists notes text,
  add column if not exists last_login_at timestamptz,
  add column if not exists lifetime_value numeric(10,2) default 0,
  add column if not exists acquired_source text;  -- 'organic','ads','referral','partner'
```

### 6.2 `subscriptions` (new — billing/CRM core)

```sql
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  plan text not null check (plan in ('free','plus','pro','breeder')),
  status text not null check (status in ('trialing','active','past_due','canceled','paused')),
  stripe_customer_id text,
  stripe_subscription_id text,
  quantity int default 1,                      -- number of dogs covered
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  mrr numeric(10,2) generated always as (
    case plan
      when 'free' then 0
      when 'plus' then 4.99 * quantity
      when 'pro'  then 9.99 * quantity
      when 'breeder' then 29.99 * quantity
    end
  ) stored,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index on public.subscriptions (owner_id);
create index on public.subscriptions (status);
```

### 6.3 `invoices` & `payments` (new)

```sql
create table if not exists public.invoices (
  id uuid default uuid_generate_v4() primary key,
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  stripe_invoice_id text unique,
  amount numeric(10,2) not null,
  currency text default 'USD',
  status text check (status in ('draft','open','paid','uncollectible','void')),
  due_date timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now() not null
);
create index on public.invoices (owner_id, created_at desc);

create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(10,2) not null,
  method text,                                -- 'card','ach','apple_pay'
  stripe_charge_id text,
  refunded_amount numeric(10,2) default 0,
  created_at timestamptz default now() not null
);
```

### 6.4 `support_tickets` & `ticket_messages` (new)

```sql
create table if not exists public.support_tickets (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  dog_id uuid references public.dogs(id) on delete set null,
  subject text not null,
  status text not null default 'open'
    check (status in ('open','pending','resolved','closed')),
  priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent')),
  category text,                              -- 'billing','device','health','account','other'
  assigned_to uuid references public.profiles(id),
  first_response_at timestamptz,
  resolved_at timestamptz,
  sla_due_at timestamptz,
  tags text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index on public.support_tickets (status, priority);
create index on public.support_tickets (assigned_to);
create index on public.support_tickets (owner_id);

create table if not exists public.ticket_messages (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.support_tickets(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  author_role text not null,                  -- 'owner','support','admin','system'
  body text not null,
  is_internal boolean default false,          -- internal note vs customer-visible
  attachments jsonb default '[]',
  created_at timestamptz default now() not null
);
create index on public.ticket_messages (ticket_id, created_at);
```

### 6.5 `device_inventory` & device reassignment (extend `devices`)

The mobile app's `devices` table tracks collars *as paired to a dog*. The CRM additionally needs warehouse/inventory state and ownership history:

```sql
-- extend existing devices table
alter table public.devices
  add column if not exists sku text,
  add column if not exists serial_number text unique,
  add column if not exists hardware_revision text,
  add column if not exists warranty_expires_at timestamptz,
  add column if not exists inventory_status text default 'deployed'
    check (inventory_status in ('in_stock','reserved','shipped','deployed','returned','defective'));

-- warehouse-level inventory independent of a dog
create table if not exists public.device_inventory (
  id uuid default uuid_generate_v4() primary key,
  sku text not null,
  serial_number text unique not null,
  status text not null default 'in_stock'
    check (status in ('in_stock','reserved','shipped','deployed','returned','defective')),
  batch_id text,
  assigned_owner_id uuid references public.profiles(id),
  shipped_at timestamptz,
  created_at timestamptz default now() not null
);

create table if not exists public.device_assignments (
  id uuid default uuid_generate_v4() primary key,
  device_id uuid references public.devices(id) on delete cascade not null,
  dog_id uuid references public.dogs(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz default now() not null,
  unassigned_at timestamptz,
  reason text                                 -- 'sale','replacement','rma','loaner'
);
create index on public.device_assignments (device_id, assigned_at desc);
```

### 6.6 `vet_practices` & `vet_dogs` (new — vet partnerships)

```sql
create table if not exists public.vet_practices (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  contact_email text,
  phone text,
  address text,
  lat double precision,
  lng double precision,
  partnership_status text default 'pending'
    check (partnership_status in ('pending','active','paused','terminated')),
  commission_rate numeric(4,2) default 0,     -- referral share
  created_at timestamptz default now() not null
);

create table if not exists public.vet_dogs (
  vet_id uuid references public.profiles(id) on delete cascade,
  dog_id uuid references public.dogs(id) on delete cascade,
  practice_id uuid references public.vet_practices(id) on delete set null,
  relationship text default 'primary',        -- 'primary','secondary','specialist'
  assigned_at timestamptz default now(),
  primary key (vet_id, dog_id)
);
```

A `vet`-role user's RLS on `dogs`/`health_metrics`/`alerts` becomes: `exists (select 1 from vet_dogs vd where vd.vet_id = auth.uid() and vd.dog_id = dogs.id)`.

### 6.7 `campaigns` & `campaign_recipients` (new — outbound)

```sql
create table if not exists public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  channel text not null check (channel in ('push','email','sms','in_app')),
  subject text,
  body text not null,
  audience_filter jsonb not null default '{}',  -- segmentation spec (§10.8)
  status text not null default 'draft'
    check (status in ('draft','scheduled','sending','sent','canceled','failed')),
  scheduled_for timestamptz,
  sent_count int default 0,
  delivered_count int default 0,
  opened_count int default 0,
  clicked_count int default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now() not null
);

create table if not exists public.campaign_recipients (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete cascade,
  status text default 'pending',                -- 'pending','sent','failed','bounced'
  sent_at timestamptz,
  opened_at timestamptz,
  error text
);
create index on public.campaign_recipients (campaign_id);
```

### 6.8 `notes` & `tags` (polymorphic CRM fixtures)

```sql
-- owner-facing notes (timeline of interactions)
create table if not exists public.owner_notes (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  author_id uuid references public.profiles(id),
  body text not null,
  pinned boolean default false,
  created_at timestamptz default now() not null
);
create index on public.owner_notes (owner_id, created_at desc);

-- reusable structured tags (vs free-form profiles.tags[])
create table if not exists public.campaign_tags (
  id uuid default uuid_generate_v4() primary key,
  label text unique not null,
  color text default '#F3A93B',
  created_at timestamptz default now()
);
```

### 6.9 `admin_audit_log` (new — mandatory for privileged ops)

```sql
create table if not exists public.admin_audit_log (
  id bigserial primary key,
  actor_id uuid references public.profiles(id),
  action text not null,                       -- 'impersonate','refund','broadcast','suspend','delete_dog',...
  target_type text,                           -- 'owner','dog','device','subscription','ticket'
  target_id uuid,
  before jsonb,
  after jsonb,
  metadata jsonb default '{}',
  ip inet,
  user_agent text,
  created_at timestamptz default now() not null
);
create index on public.admin_audit_log (actor_id, created_at desc);
create index on public.admin_audit_log (target_type, target_id);
```

### 6.10 Materialised aggregate views (for dashboards)

Heavy KPI queries (MRR, DAU, churn, fleet health) must not scan raw time-series on every page load. Two patterns:

- **Daily rollup tables** populated by a scheduled Edge Function (`cron` extension) — e.g. `analytics_daily(owner_id, date, active_dogs, alerts_raised, steps, …)`.
- **Postgres views** for live-but-cheap aggregates (e.g. `v_active_subscriptions`, `v_open_tickets_by_priority`).

```sql
create table if not exists public.analytics_daily (
  date date not null,
  owner_id uuid references public.profiles(id),
  mau boolean default false,                   -- was active that day
  active_dogs int default 0,
  new_alerts int default 0,
  critical_alerts int default 0,
  steps_total int default 0,
  primary key (date, owner_id)
);
```

---

## 7. Backend: RLS Strategy & Edge Functions

### 7.1 RLS policy pattern for admin reads

Existing owner-scoped policies stay. We add **admin-bypass** disjuncts:

```sql
-- helper: current JWT role
create or replace function public.current_role()
returns text language sql stable as $$
  select coalesce((auth.jwt() -> 'claims' ->> 'role')::text, 'owner');
$$;

-- example: dogs becomes readable by owner OR staff/vet-scoped
create policy "Staff can view all dogs" on public.dogs
  for select using (public.current_role() in ('admin','support'));

create policy "Vets can view assigned dogs" on public.dogs
  for select using (
    public.current_role() = 'vet'
    and exists (
      select 1 from public.vet_dogs vd
      where vd.vet_id = auth.uid() and vd.dog_id = dogs.id
    )
  );
```

This pattern is applied to every table the CRM reads: `profiles`, `dogs`, `devices`, `health_metrics`, `alerts`, `locations`, `subscriptions`, `invoices`, `support_tickets`, etc. **Writes from the browser remain owner-scoped**; all cross-tenant writes go through Edge Functions.

### 7.2 Edge Functions (Deno) — admin write surface

Each function: verify caller JWT → assert `role in allowedRoles` → execute with service-role client → write to `admin_audit_log`. Deployed under `supabase/functions/`.

| Function | Method | Allowed roles | Purpose |
|----------|--------|---------------|---------|
| `admin-impersonate` | POST | admin | mint a short-lived owner-scoped token for support impersonation |
| `admin-refund` | POST | admin | trigger Stripe refund, write `payments.refunded_amount`, log |
| `admin-suspend-user` | POST | admin | set `profiles.status='suspended'`, sign out sessions |
| `admin-reassign-device` | POST | admin | move a collar between dogs/owners, log `device_assignments` |
| `admin-broadcast` | POST | admin | resolve audience filter, enqueue campaign sends |
| `admin-resolve-alert` | POST | admin, support | force-acknowledge an alert across tenants |
| `admin-delete-dog` | POST | admin | cascade delete + soft tombstone, log before/after |
| `admin-export` | POST | admin | produce a signed CSV/JSON export URL (async) |
| `webhook-stripe` | POST | (HMAC) | sync subscriptions/invoices/payments |
| `cron-rollup-daily` | scheduled | service | populate `analytics_daily` |

**Contract reference:** see Appendix C.

### 7.3 Why Edge Functions and not raw service-role queries from Next.js server components?

Next.js server components *can* hold the service-role key server-side — and we use that **for read-only convenience in a few server components**. But every **write** goes through an Edge Function so that:
- the audit-log write is mandatory and centralised,
- the role check lives in one auditable place,
- mobile-app admins (future) could reuse the same function,
- we avoid scattering service-role SQL across many route handlers.

---

## 8. Realtime & Notifications Pipeline

### 8.1 Realtime in the CRM

Reuse the mobile app's existing Realtime wiring (`subscribeToTable` in `app/services/api/supabase.ts`). The CRM subscribes to:

- `alerts` (INSERT) → live "alert storm" feed + toast on `severity='critical'`
- `support_tickets` (INSERT/UPDATE) → inbox badge + SLA countdown refresh
- `devices` (UPDATE `is_connected`) → fleet-online tile refresh
- `campaigns` (UPDATE counters) → campaign progress bar

Each subscription uses a channel filter to limit payload size (e.g. only `severity=critical` alerts).

### 8.2 Alert-storm detection

A scheduled Edge Function (`cron-alert-storm`, every 60s) counts critical alerts per 5-min window; if above threshold, it inserts a row into a new `ops_incidents` table and pings a configured ops channel (Slack webhook / email). The CRM surfaces active incidents in a top banner.

### 8.3 Outbound to owners

- **Push** → existing `notificationsService` pattern, triggered from `admin-broadcast`.
- **Email** → Resend (or SES). Templates versioned in `supabase/functions/_templates/`.
- **SMS** → Twilio (already a Supabase dependency for OTP).
- **In-app** → write to a new `announcements` table the mobile app reads on launch.

```sql
create table if not exists public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  body text not null,
  severity text default 'info',
  audience text default 'all',                -- 'all','plus','pro','breeder','churned'
  action_label text,
  action_url text,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now() not null
);
```

---

## 9. Frontend: State, Data Fetching & Theme

### 9.1 State split (the Golden Rule)

| Data kind | Tool | Example |
|-----------|------|---------|
| Server data (lists, records) | **TanStack Query** | owner list, dog detail, ticket thread |
| Client UI state | **Zustand** | active filters, sidebar collapse, command palette open, dark mode |
| Form state | **react-hook-form + zod** | new ticket, refund form, campaign composer |

> This deliberately differs from mobile (where Zustand holds server state via persist). On web, TanStack Query owns cache invalidation, background refetch, and pagination — Zustand would fight it. Zustand is kept **only for parity of mental model and for the handful of pure-UI stores**.

### 9.2 CRM Zustand stores (UI only)

```
app/store/
  uiStore.ts          — sidebarCollapsed, theme, commandPaletteOpen, density
  filterStore.ts      — per-module filter state (preserved across navigations)
  sessionStore.ts     — current operator, active impersonation target, recent items
  notificationStore.ts— in-app toasts queue (transient)
```

Selectors stay pure (same rule as mobile: no method calls or new refs in selectors).

### 9.3 Theme parity

The web app's `tailwind.config.ts` imports a JSON mirror of `app/theme/colors.ts`:

```ts
import dogvitaTokens from '@dogvita/types/tokens.json';
// primary DEFAULT #F3A93B, background.primary #F5E9CD, text.primary #1F1A17, etc.
export default {
  theme: {
    extend: {
      colors: {
        primary: dogvitaTokens.colors.primary,     // { DEFAULT, dark, light, 50..900 }
        cream: dogvitaTokens.colors.background.primary,
        cocoa: dogvitaTokens.colors.text.primary,
        status: dogvitaTokens.colors.status,
        health: dogvitaTokens.colors.health,
      },
      borderRadius: dogvitaTokens.borderRadius,
      fontFamily: { sans: ['Inter','system-ui','sans-serif'] },
    },
  },
};
```

A token-extraction step in the shared types package regenerates `tokens.json` whenever `app/theme/colors.ts` changes, so the two surfaces can never drift.

### 9.4 Dark mode

Mobile currently ships a single light theme. The CRM introduces dark mode (operators request it); tokens are defined as CSS variables and Tailwind dark variants. When the mobile app later adopts dark mode, the same token file feeds both.

---

## 10. CRM Module Breakdown (Feature by Feature)

### 10.1 Owners (Customers)

- **List**: TanStack Table — columns: name, email, phone, # dogs, plan, status, LTV, last active, tags. Server-side sort/filter/pagination. Bulk select → tag, message, export.
- **Filters**: status, plan, country, tags, acquired_source, "has critical alert", "churn risk" (computed), last-active range.
- **Detail (360° view)**: profile header, subscription card, dog list, device list, recent alerts, open tickets, order/invoice history, timeline (notes + audit + campaign receipts), **impersonate** button (admin only).
- **Actions**: edit profile, add note (pinned/internal), suspend/unsuspend, merge duplicates, delete (GDPR), assign account manager.

### 10.2 Dogs (Patients)

- **List**: name, breed, age, owner, weight trend sparkline, last health score, active alerts, vet.
- **Detail**: vitals charts (heart rate / temp / activity / sleep — Recharts), weight history, vaccination records, route history summary, geofence list, device(s), alert history.
- **Actions**: force-resolve alert, reassign device, link vet, delete (cascade, audited).

### 10.3 Devices (Collars)

- **Inventory board**: Kanban by `inventory_status` (in_stock → reserved → shipped → deployed → returned → defective).
- **Fleet view**: all deployed devices, online/offline, battery distribution, firmware-version pie, offline > 24h list.
- **Device detail**: assignment history (`device_assignments`), live metrics snapshot, firmware-update eligibility, RMA flow.

### 10.4 Health Alerts Console

- **Live feed** (Realtime): streaming table of all alerts across tenants, filterable by severity/type/dog/owner/time.
- **Alert storm widget**: critical-alert rate over time (line chart), active `ops_incidents`.
- **Bulk actions**: acknowledge, resolve, snooze, create ticket from alert.

### 10.5 Subscriptions & Billing

- **MRR/ARR tiles**, plan distribution, trial-to-paid funnel, churn cohort table.
- **Subscription list**: owner, plan, status, MRR, period end, cancel-at-period-end flag.
- **Invoice & payment history** per owner; **refund** action (Edge Function, Stripe).

### 10.6 Support Inbox

- **Inbox views**: Mine, Unassigned, Open, Pending, SLA-at-risk, Resolved.
- **Ticket detail**: conversation thread (owner + internal notes), SLA countdown, assignee, priority, linked dog, quick-templates, macros.
- **SLA engine**: `sla_due_at` computed on create from category+priority matrix; a cron flags breaches.

### 10.7 Vet Partnerships

- **Practices directory**: status, # linked dogs, referral commission, map of practice locations.
- **Vet users** (role=`vet`): invite, scope to dogs, view their restricted dashboard.

### 10.8 Campaigns & Announcements

- **Composer**: channel, subject/body, audience filter (segmentation DSL stored as JSON):
  ```jsonc
  {
    "plan": ["plus","pro"],
    "tags": { "any": ["high-value","breeder"] },
    "hasDogBreed": ["Golden Retriever"],
    "lastActiveDays": { "gte": 30 },
    "country": ["US","CA"]
  }
  ```
  A preview resolves the filter to an estimated recipient count (EXPLAIN-style) before send.
- **Scheduling** + **throttling** (per-channel rate limits).
- **Announcements**: in-app banners served to the mobile app via `announcements` table.

### 10.9 Analytics (platform-wide)

See §12.

### 10.10 Settings & Admin

- Operator management (invite support/admin/vet users, SSO config).
- Role/permission matrix viewer.
- Audit log explorer (filter by actor, action, target, date).
- Feature flags (if introduced).

---

## 11. Screen Inventory & Navigation

### 11.1 Route map (Next.js App Router)

```
/login                      — operator sign-in (email + SSO)
/app                       — authenticated shell (sidebar + topbar)
/app                       — Dashboard (overview)
/app/owners                — Owners list
/app/owners/[id]           — Owner 360°
/app/dogs                  — Dogs list
/app/dogs/[id]             — Dog detail
/app/devices               — Fleet view
/app/devices/inventory     — Inventory board
/app/devices/[id]          — Device detail
/app/alerts                — Alerts console (live)
/app/billing               — Subscriptions overview
/app/billing/[ownerId]     — Owner billing detail
/app/billing/invoices      — Invoice explorer
/app/inbox                 — Support inbox
/app/inbox/[ticketId]      — Ticket thread
/app/vets                  — Vet practices
/app/vets/[id]             — Practice detail
/app/campaigns             — Campaigns list + composer
/app/campaigns/[id]        — Campaign report
/app/analytics             — Platform analytics
/app/audit                 — Audit log explorer
/app/settings              — Operator & org settings
/me                        — Operator profile (recent actions)
```

### 11.2 App shell

- **Left sidebar** (collapsible, Zustand `uiStore.sidebarCollapsed`): nav groups — *Customers* (Owners, Dogs), *Operations* (Devices, Alerts, Inbox), *Growth* (Campaigns, Vets), *Finance* (Billing), *Insights* (Analytics, Audit), *Settings*.
- **Topbar**: global search (command palette ⌘K), environment badge (prod/staging), operator avatar, impersonation indicator (red banner when active with "Stop impersonation").
- **Density toggle** (compact/comfortable) for data-heavy operators.

### 11.3 Command palette (⌘K)

- Jump to any owner/dog/ticket/device by id/name.
- Run quick actions ("refund", "suspend", "broadcast").
- Recent items from `sessionStore`.

---

## 12. Analytics & KPIs

### 12.1 North-star & supporting metrics

| Metric | Definition | Source |
|--------|------------|--------|
| **MRR** | sum of `subscriptions.mrr` where `status='active'` | `subscriptions` |
| **ARR** | MRR × 12 | derived |
| **Active dogs** | distinct `dogs.id` with a `health_metrics` row in last 24h | `health_metrics` |
| **Fleet online %** | deployed devices with `is_connected` / total deployed | `devices` |
| **DAU / WAU / MAU** | distinct owners with `analytics_daily.mau` | `analytics_daily` |
| **Trial→paid conversion** | trials reaching `active` within 14d | `subscriptions` |
| **Gross churn** | canceled MRR / prior MRR (monthly) | `subscriptions` |
| **NPS** | from periodic in-app survey (new `survey_responses` table, v1.1) | — |
| **Avg alerts per dog/day** | alerts / active dogs | `alerts` |
| **Critical-alert MTTR** | time from alert to acknowledged | `alerts` |
| **Support CSAT** | post-resolution rating | `support_tickets` survey |
| **Ticket SLA breach %** | tickets past `sla_due_at` | `support_tickets` |

### 12.2 Dashboards

- **Executive** — MRR/ARR, churn, MAU trend, fleet health, conversion funnel.
- **Operations** — live alert feed, fleet online %, incident banner, MTTR.
- **Support** — inbox load, SLA breach %, CSAT, tickets by category.
- **Growth** — campaign performance, cohort retention, LTV by source.
- **Device/Field** — firmware distribution, RMA rate, battery histogram.

Each dashboard is a server component that fetches from materialised views; charts are client components (Recharts) hydrated from server-fetched data. Time-range selector defaults to "last 30 days" and persists in `filterStore`.

---

## 13. Security, Privacy & Compliance

- **GDPR / data deletion** — `admin-delete-dog` soft-deletes then a 30-day purge job removes PII; `profiles` deletion cascades per existing FK `on delete cascade`. An "export my data" Edge Function produces a JSON dump for an owner on request.
- **PII minimisation in lists** — phone/email masked in list views unless operator has `admin`/`support` role.
- **Audit** — every privileged action logged with before/after (§6.9). Audit log is append-only (no update/delete policies).
- **Session security** — short access-token TTL, secure cookies, httpOnly, SameSite=Lax. Impersonation tokens are short-lived (15 min) and clearly bannered.
- **Secrets** — Stripe, Twilio, Resend keys ONLY in Edge Function env. Webhook endpoints verify HMAC signatures.
- **Rate limiting** — Supabase Auth + Edge Function-level limits on `admin-broadcast` and `admin-export` to prevent abuse.
- **Principle of least privilege** — `support` role is read-mostly; only `admin` can do billing/destructive ops. RLS + function-level role checks enforce this in two layers.

---

## 14. Observability & Operations

- **Structured logging** in Edge Functions (JSON to Supabase logs + optional Logflare/OpenObserve).
- **Error tracking** — Sentry in the web app; Sentry/Deno-compatible handler in Edge Functions.
- **Synthetic checks** — a CI cron hits `/app` (logged-in) and a key Edge Function every 5 min.
- **Dashboards for the platform team** — Supabase project health (DB CPU, connection pool saturation, function error rate) linked from the CRM's ops dashboard.
- **Feature flags** — optional LaunchDarkly/Flagsmith (v1.1) gated behind `admin_audit_log`-tracked changes.

---

## 15. Project Structure

Two repos (recommended) or one monorepo. Either way the shared types package is the contract.

```
dogvita/                                 (monorepo — npm workspaces)
├── packages/
│   └── types/                           @dogvita/types — shared TS types + tokens.json
│       ├── src/
│       │   ├── dog.ts                   (from dog-health-app/app/types/dog.ts)
│       │   ├── health.ts                (from dog-health-app/app/types/health.ts)
│       │   ├── crm.ts                   NEW — CRM domain types (Appendix B)
│       │   └── tokens.json              generated from app/theme/colors.ts
│       └── package.json
├── dog-health-app/                      existing mobile app (unchanged imports → @dogvita/types)
└── crm-dashboard/                       NEW
    ├── app/                             Next.js App Router routes (§11.1)
    │   ├── (auth)/login/page.tsx
    │   ├── (app)/layout.tsx             shell: sidebar + topbar + impersonation banner
    │   ├── (app)/page.tsx               dashboard
    │   ├── (app)/owners/...
    │   ├── (app)/dogs/...
    │   ├── (app)/devices/...
    │   ├── (app)/alerts/...
    │   ├── (app)/billing/...
    │   ├── (app)/inbox/...
    │   ├── (app)/vets/...
    │   ├── (app)/campaigns/...
    │   ├── (app)/analytics/...
    │   ├── (app)/audit/...
    │   └── (app)/settings/...
    ├── components/
    │   ├── ui/                          shadcn primitives
    │   ├── shell/                       sidebar, topbar, command-palette, impersonation-banner
    │   ├── owners/                      OwnerTable, OwnerDetailTabs, SubscriptionCard…
    │   ├── dogs/                        VitalsChart, WeightSparkline…
    │   ├── devices/                     FleetTable, InventoryBoard…
    │   ├── alerts/                      AlertFeed, AlertStormChart…
    │   ├── billing/                     MrrTiles, RefundDialog…
    │   ├── inbox/                       TicketThread, SlaBadge…
    │   ├── campaigns/                   AudienceBuilder, CampaignComposer…
    │   └── charts/                      themed Recharts wrappers
    ├── store/                           Zustand UI stores (§9.2)
    ├── lib/
    │   ├── supabase/
    │   │   ├── browser.ts               anon-key client (RLS via JWT claim)
    │   │   ├── server.ts                service-role client (server components/fns ONLY)
    │   │   └── admin-auth.ts            claim helpers, role checks
    │   ├── queries/                     TanStack Query hooks per module
    │   ├── edge/                        typed fetchers calling Supabase Edge Functions
    │   └── analytics/                   KPI calculators + view bindings
    ├── middleware.ts                    auth + role gate for /(app)
    ├── tailwind.config.ts               ingests tokens.json (§9.3)
    └── package.json
```

Supabase side:

```
supabase/
├── schema.sql                           existing (mobile)
├── migrations/
│   └── 0001_crm_core.sql                Appendix A
├── policies/
│   └── 0001_admin_read_policies.sql
└── functions/
    ├── admin-impersonate/
    ├── admin-refund/
    ├── admin-suspend-user/
    ├── admin-reassign-device/
    ├── admin-broadcast/
    ├── admin-resolve-alert/
    ├── admin-delete-dog/
    ├── admin-export/
    ├── webhook-stripe/
    ├── cron-rollup-daily/
    └── cron-alert-storm/
```

---

## 16. Phased Delivery Plan

### Phase 0 — Foundations (1 wk)
- Monorepo + `@dogvita/types` extraction (tokens.json + domain types).
- Supabase: `role` column, custom-claim function, audit log, migrations (Appendix A).
- Edge Function skeleton + shared auth/role helper.
- Next.js app skeleton, Tailwind theme parity, auth middleware, login page.

**Exit gate:** an `admin`-role user can sign in and see an empty dashboard; mobile app unaffected; typecheck + lint green.

### Phase 1 — Read-only 360° (2 wks)
- Owners list + Owner 360° (profile, dogs, devices, alerts, timeline).
- Dogs list + Dog detail (vitals charts reusing mobile types).
- Devices fleet view (read-only).
- Alerts console (live Realtime feed, no actions).
- Analytics: MRR/MAU/fleet tiles from materialised views.

**Exit gate:** staff can investigate any owner/dog/alert without touching the DB.

### Phase 2 — Operations & Support (2 wks)
- Support inbox (tickets, messages, SLA, assignment).
- Edge Functions: `admin-resolve-alert`, `admin-reassign-device`, impersonation.
- Notes/tags; audit log explorer.
- Bulk actions on lists (tag, message, export).

**Exit gate:** support team runs day-to-day operations from the CRM.

### Phase 3 — Billing & Growth (2 wks)
- Stripe webhook + subscriptions/invoices/payments sync.
- Billing views + refund Edge Function.
- Campaigns (audience builder + composer + scheduled send via Resend/Twilio/push).
- Announcements table wired to mobile app launch.

**Exit gate:** end-to-end billing visibility; first campaign sent.

### Phase 4 — Vet partnerships, deep analytics, hardening (2 wks)
- Vet practices + scoped vet role + RLS.
- Cohort/retention analytics, NPS survey hook.
- Sentry, rate limiting, synthetic checks.
- Load test of Realtime subscriptions at 10k alerts/day.

**Exit gate:** v1.0 release to staff.

---

## 17. Open Questions / Decisions Log

| # | Decision | Recommendation | Status |
|---|----------|----------------|--------|
| 1 | Monorepo vs published types package | Monorepo (npm workspaces) for v1 — lowest friction; publish later if third parties need it | **Decided: monorepo** |
| 2 | shadcn/ui vs custom components | shadcn — accessible, themeable, copy-in ownership | **Decided: shadcn** |
| 3 | Charts lib | Recharts (web) + keep gifted-charts on mobile | **Decided** |
| 4 | Billing provider | Stripe (webhooks + Customer Portal for owner self-serve) | **Decided: Stripe** |
| 5 | Email/SMS | Resend (email) + Twilio (SMS, already used for OTP) | **Decided** |
| 6 | SSO for staff | Phase 4 — Google Workspace via Supabase Auth; SAML enterprise later | Deferred |
| 7 | Feature flags | Flagsmith self-hosted in v1.1 | Deferred |
| 8 | Dark mode in mobile | Out of CRM scope; CRM dark mode pioneers the token structure | Acknowledged |
| 9 | Where do vets sign in? | CRM web (scoped) — not the mobile app | **Decided** |
| 10 | Realtime scale ceiling | Validate in Phase 4 load test; add Redis-backed fan-out only if needed | Open |

---

## Appendix A: Full SQL Migration

> File: `supabase/migrations/0001_crm_core.sql`. Idempotent (`if not exists` / `add column if not exists`). Run after the existing `schema.sql`.

```sql
-- ============================================================
-- A.1  ROLE + JWT CUSTOM CLAIM
-- ============================================================
alter table public.profiles
  add column if not exists role text not null default 'owner'
    check (role in ('owner','admin','support','vet')),
  add column if not exists status text not null default 'active'
    check (status in ('active','suspended','invited','deleted')),
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists country_code text,
  add column if not exists timezone text,
  add column if not exists tags text[] default '{}',
  add column if not exists notes text,
  add column if not exists last_login_at timestamptz,
  add column if not exists lifetime_value numeric(10,2) default 0,
  add column if not exists acquired_source text;

create or replace function public.current_role()
returns text language sql stable as $$
  select coalesce((auth.jwt() -> 'claims' ->> 'role')::text, 'owner');
$$;

-- Inject role/is_admin into access token (Supabase "access token" hook)
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql security definer as $$
declare
  r text;
begin
  select role into r from public.profiles where id = (event->>'user_id')::uuid;
  return jsonb_set(
    event,
    '{claims}',
    (event -> 'claims') || jsonb_build_object(
      'role', coalesce(r, 'owner'),
      'is_admin', r = 'admin'
    )
  );
end; $$;

-- (In Supabase dashboard: Auth → Hooks → "Access Token" → select custom_access_token_hook)

-- ============================================================
-- A.2  SUBSCRIPTIONS / INVOICES / PAYMENTS
-- ============================================================
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  plan text not null check (plan in ('free','plus','pro','breeder')),
  status text not null check (status in ('trialing','active','past_due','canceled','paused')),
  stripe_customer_id text,
  stripe_subscription_id text,
  quantity int default 1,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  mrr numeric(10,2) generated always as (
    case plan
      when 'free' then 0
      when 'plus' then 4.99 * quantity
      when 'pro'  then 9.99 * quantity
      when 'breeder' then 29.99 * quantity
    end
  ) stored,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index if not exists idx_subscriptions_owner on public.subscriptions (owner_id);
create index if not exists idx_subscriptions_status on public.subscriptions (status);

create table if not exists public.invoices (
  id uuid default uuid_generate_v4() primary key,
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  stripe_invoice_id text unique,
  amount numeric(10,2) not null,
  currency text default 'USD',
  status text check (status in ('draft','open','paid','uncollectible','void')),
  due_date timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now() not null
);
create index if not exists idx_invoices_owner on public.invoices (owner_id, created_at desc);

create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(10,2) not null,
  method text,
  stripe_charge_id text,
  refunded_amount numeric(10,2) default 0,
  created_at timestamptz default now() not null
);

-- ============================================================
-- A.3  SUPPORT TICKETS
-- ============================================================
create table if not exists public.support_tickets (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  dog_id uuid references public.dogs(id) on delete set null,
  subject text not null,
  status text not null default 'open'
    check (status in ('open','pending','resolved','closed')),
  priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent')),
  category text,
  assigned_to uuid references public.profiles(id),
  first_response_at timestamptz,
  resolved_at timestamptz,
  sla_due_at timestamptz,
  tags text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
create index if not exists idx_tickets_status_priority on public.support_tickets (status, priority);
create index if not exists idx_tickets_assigned on public.support_tickets (assigned_to);
create index if not exists idx_tickets_owner on public.support_tickets (owner_id);

create table if not exists public.ticket_messages (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.support_tickets(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  author_role text not null,
  body text not null,
  is_internal boolean default false,
  attachments jsonb default '[]',
  created_at timestamptz default now() not null
);
create index if not exists idx_ticket_messages_ticket on public.ticket_messages (ticket_id, created_at);

-- ============================================================
-- A.4  DEVICE INVENTORY + ASSIGNMENTS + DEVICE EXTENSIONS
-- ============================================================
alter table public.devices
  add column if not exists sku text,
  add column if not exists serial_number text unique,
  add column if not exists hardware_revision text,
  add column if not exists warranty_expires_at timestamptz,
  add column if not exists inventory_status text default 'deployed'
    check (inventory_status in ('in_stock','reserved','shipped','deployed','returned','defective'));

create table if not exists public.device_inventory (
  id uuid default uuid_generate_v4() primary key,
  sku text not null,
  serial_number text unique not null,
  status text not null default 'in_stock'
    check (status in ('in_stock','reserved','shipped','deployed','returned','defective')),
  batch_id text,
  assigned_owner_id uuid references public.profiles(id),
  shipped_at timestamptz,
  created_at timestamptz default now() not null
);

create table if not exists public.device_assignments (
  id uuid default uuid_generate_v4() primary key,
  device_id uuid references public.devices(id) on delete cascade not null,
  dog_id uuid references public.dogs(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz default now() not null,
  unassigned_at timestamptz,
  reason text
);
create index if not exists idx_device_assignments_device on public.device_assignments (device_id, assigned_at desc);

-- ============================================================
-- A.5  VET PARTNERSHIPS
-- ============================================================
create table if not exists public.vet_practices (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  contact_email text,
  phone text,
  address text,
  lat double precision,
  lng double precision,
  partnership_status text default 'pending'
    check (partnership_status in ('pending','active','paused','terminated')),
  commission_rate numeric(4,2) default 0,
  created_at timestamptz default now() not null
);

create table if not exists public.vet_dogs (
  vet_id uuid references public.profiles(id) on delete cascade,
  dog_id uuid references public.dogs(id) on delete cascade,
  practice_id uuid references public.vet_practices(id) on delete set null,
  relationship text default 'primary',
  assigned_at timestamptz default now(),
  primary key (vet_id, dog_id)
);

-- ============================================================
-- A.6  CAMPAIGNS
-- ============================================================
create table if not exists public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  channel text not null check (channel in ('push','email','sms','in_app')),
  subject text,
  body text not null,
  audience_filter jsonb not null default '{}',
  status text not null default 'draft'
    check (status in ('draft','scheduled','sending','sent','canceled','failed')),
  scheduled_for timestamptz,
  sent_count int default 0,
  delivered_count int default 0,
  opened_count int default 0,
  clicked_count int default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now() not null
);

create table if not exists public.campaign_recipients (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete cascade,
  status text default 'pending',
  sent_at timestamptz,
  opened_at timestamptz,
  error text
);
create index if not exists idx_campaign_recipients on public.campaign_recipients (campaign_id);

create table if not exists public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  body text not null,
  severity text default 'info',
  audience text default 'all',
  action_label text,
  action_url text,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now() not null
);

-- ============================================================
-- A.7  NOTES / TAGS
-- ============================================================
create table if not exists public.owner_notes (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  author_id uuid references public.profiles(id),
  body text not null,
  pinned boolean default false,
  created_at timestamptz default now() not null
);
create index if not exists idx_owner_notes_owner on public.owner_notes (owner_id, created_at desc);

create table if not exists public.campaign_tags (
  id uuid default uuid_generate_v4() primary key,
  label text unique not null,
  color text default '#F3A93B',
  created_at timestamptz default now()
);

-- ============================================================
-- A.8  AUDIT LOG + OPS INCIDENTS
-- ============================================================
create table if not exists public.admin_audit_log (
  id bigserial primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text,
  target_id uuid,
  before jsonb,
  after jsonb,
  metadata jsonb default '{}',
  ip inet,
  user_agent text,
  created_at timestamptz default now() not null
);
create index if not exists idx_audit_actor on public.admin_audit_log (actor_id, created_at desc);
create index if not exists idx_audit_target on public.admin_audit_log (target_type, target_id);

create table if not exists public.ops_incidents (
  id uuid default uuid_generate_v4() primary key,
  kind text not null,                         -- 'alert_storm','fleet_offline','billing_spike'
  severity text not null default 'warning',
  summary text not null,
  context jsonb default '{}',
  status text not null default 'open',
  opened_at timestamptz default now(),
  resolved_at timestamptz
);

-- ============================================================
-- A.9  ANALYTICS ROLLUP
-- ============================================================
create table if not exists public.analytics_daily (
  date date not null,
  owner_id uuid references public.profiles(id),
  mau boolean default false,
  active_dogs int default 0,
  new_alerts int default 0,
  critical_alerts int default 0,
  steps_total int default 0,
  primary key (date, owner_id)
);

-- ============================================================
-- A.10 RLS — admin/staff read policies + write lockdown
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.invoices            enable row level security;
alter table public.payments            enable row level security;
alter table public.support_tickets     enable row level security;
alter table public.ticket_messages     enable row level security;
alter table public.device_inventory    enable row level security;
alter table public.device_assignments  enable row level security;
alter table public.vet_practices       enable row level security;
alter table public.vet_dogs            enable row level security;
alter table public.campaigns           enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.announcements       enable row level security;
alter table public.owner_notes         enable row level security;
alter table public.campaign_tags       enable row level security;
alter table public.admin_audit_log     enable row level security;
alter table public.ops_incidents       enable row level security;
alter table public.analytics_daily     enable row level security;

-- Generic read-for-staff helper applied per table:
--   create policy "Staff read" on <t> for select
--     using (public.current_role() in ('admin','support'));

-- Vets get read on dogs/health_metrics/alerts for their assigned dogs:
--   create policy "Vet reads assigned dogs" on public.dogs for select using (
--     public.current_role() = 'vet' and exists (
--       select 1 from public.vet_dogs vd
--       where vd.vet_id = auth.uid() and vd.dog_id = dogs.id));

-- Owners can read their own support tickets + ticket_messages;
--   staff read all. Writes from browser only via owner-scoped policies;
--   cross-tenant writes are Edge-Function-only (service role).
-- (Full per-table policy set lives in supabase/policies/0001_admin_read_policies.sql)
```

---

## Appendix B: Shared TypeScript Types

> File: `packages/types/src/crm.ts`. Imported by both the web CRM and (where relevant) the mobile app.

```ts
// ---- Roles & identity ----
export type Role = 'owner' | 'admin' | 'support' | 'vet';
export type ProfileStatus = 'active' | 'suspended' | 'invited' | 'deleted';

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: Role;
  status: ProfileStatus;
  firstName?: string | null;
  lastName?: string | null;
  countryCode?: string | null;
  timezone?: string | null;
  tags: string[];
  notes?: string | null;
  lastLoginAt?: string | null;
  lifetimeValue: number;
  acquiredSource?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---- Billing ----
export type Plan = 'free' | 'plus' | 'pro' | 'breeder';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';

export interface Subscription {
  id: string;
  ownerId: string;
  plan: Plan;
  status: SubscriptionStatus;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  quantity: number;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  mrr: number;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
export interface Invoice {
  id: string;
  subscriptionId?: string | null;
  ownerId: string;
  stripeInvoiceId?: string | null;
  amount: number;
  currency: string;
  status?: InvoiceStatus | null;
  dueDate?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId?: string | null;
  ownerId: string;
  amount: number;
  method?: string | null;
  stripeChargeId?: string | null;
  refundedAmount: number;
  createdAt: string;
}

// ---- Support ----
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketCategory = 'billing' | 'device' | 'health' | 'account' | 'other';

export interface SupportTicket {
  id: string;
  ownerId: string;
  dogId?: string | null;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: TicketCategory | null;
  assignedTo?: string | null;
  firstResponseAt?: string | null;
  resolvedAt?: string | null;
  slaDueAt?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorRole: Role | 'system';
  body: string;
  isInternal: boolean;
  attachments: Array<{ url: string; name: string; contentType?: string }>;
  createdAt: string;
}

// ---- Devices ----
export type InventoryStatus = 'in_stock' | 'reserved' | 'shipped' | 'deployed' | 'returned' | 'defective';

export interface DeviceWithMeta {
  id: string;
  dogId: string;
  deviceName?: string | null;
  bleMacAddress?: string | null;
  firmwareVersion?: string | null;
  isConnected: boolean;
  lastSeenAt?: string | null;
  sku?: string | null;
  serialNumber?: string | null;
  hardwareRevision?: string | null;
  warrantyExpiresAt?: string | null;
  inventoryStatus: InventoryStatus;
  createdAt: string;
}

export interface DeviceAssignment {
  id: string;
  deviceId: string;
  dogId?: string | null;
  ownerId: string;
  assignedBy?: string | null;
  assignedAt: string;
  unassignedAt?: string | null;
  reason?: string | null;
}

// ---- Vets ----
export type PartnershipStatus = 'pending' | 'active' | 'paused' | 'terminated';
export interface VetPractice {
  id: string;
  name: string;
  contactEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  partnershipStatus: PartnershipStatus;
  commissionRate: number;
  createdAt: string;
}

// ---- Campaigns ----
export type CampaignChannel = 'push' | 'email' | 'sms' | 'in_app';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'canceled' | 'failed';

export interface AudienceFilter {
  plan?: Plan[];
  tags?: { any?: string[]; all?: string[] };
  hasDogBreed?: string[];
  lastActiveDays?: { gte?: number; lte?: number };
  country?: string[];
}

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  subject?: string | null;
  body: string;
  audienceFilter: AudienceFilter;
  status: CampaignStatus;
  scheduledFor?: string | null;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  createdBy?: string | null;
  createdAt: string;
}

// ---- Audit ----
export interface AuditEntry {
  id: string;
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

// ---- Analytics ----
export interface AnalyticsDaily {
  date: string;
  ownerId: string;
  mau: boolean;
  activeDogs: number;
  newAlerts: number;
  criticalAlerts: number;
  stepsTotal: number;
}
```

---

## Appendix C: Edge Function Contract Reference

All admin Edge Functions share a common shape.

**Request** (cookie-bearer JWT, verified by Supabase):
```jsonc
// POST /functions/v1/admin-refund
{
  "paymentId": "uuid",
  "amount": 9.99,            // partial allowed; omit for full
  "reason": "customer_request"
}
```

**Auth/role gate** (first lines of every function):
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,     // service role — server only
);

const userClient = (req) => { /* build client from request's JWT to read role */ };

async function requireRole(req, allowed: string[]) {
  const jwt = extractJwt(req);                      // from Authorization header / cookie
  const { data } = await supabase.auth.getUser(jwt);
  const role = data.user?.role ?? (data.user?.app_metadata?.role ?? 'owner');
  if (!allowed.includes(role)) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 });
  }
  return null;
}

async function audit(actorId, action, target, before, after, meta) {
  await supabase.from('admin_audit_log').insert({
    actor_id: actorId, action, target_type: target.type, target_id: target.id,
    before, after, metadata: meta,
  });
}
```

**Response** envelope:
```jsonc
{ "ok": true, "data": { /* ... */ } }
// on error:
{ "ok": false, "error": { "code": "forbidden", "message": "..." } }
```

| Function | Body | Returns | Side effects |
|----------|------|---------|--------------|
| `admin-impersonate` | `{ ownerId }` | `{ accessToken, expiresAt }` (15-min) | audit `impersonate` |
| `admin-refund` | `{ paymentId, amount?, reason }` | `{ refundId, amount }` | Stripe refund, `payments.refunded_amount`, audit |
| `admin-suspend-user` | `{ ownerId, reason }` | `{ status }` | `profiles.status`, sign out, audit |
| `admin-reassign-device` | `{ deviceId, toDogId?, toOwnerId, reason }` | `{ assignmentId }` | `device_assignments`, `devices.dog_id`, audit |
| `admin-broadcast` | `{ campaignId }` (`status=scheduled`→`sending`) | `{ enqueued }` | resolves audience, inserts `campaign_recipients`, fans out |
| `admin-resolve-alert` | `{ alertId }` | `{ alertId }` | `alerts.is_acknowledged`, audit |
| `admin-delete-dog` | `{ dogId }` | `{ ok }` | cascade + tombstone + audit (before/after) |
| `admin-export` | `{ query, format }` | `{ downloadUrl }` | async job, signed URL |
| `webhook-stripe` | Stripe event | `{ received: true }` | upsert subscriptions/invoices/payments |

---

*End of document — DogVita CRM Dashboard Architecture v1.0.*
