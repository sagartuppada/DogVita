# DogVita — Reconciled System Architecture

> **Status:** Finalised (v1.0) — supersedes the "Final System Architecture" proposal as the source of truth
> **Date:** 2026-06-27
> **Method:** Every claim below is checked against the actual repo contents. Where the prior proposal conflicts with the code, **the code wins** and the proposal is annotated with the correction.
> **Scope:** The whole DogVita platform (mobile + collar + backend + CRM + AI). The CRM-specific detail lives in `docs/CRM_DASHBOARD_ARCHITECTURE.md`; this doc is the parent.

---

## 0. How to read this document

Three tags appear throughout. They exist so you can tell, at a glance, what is real today vs. aspirational:

- 🟢 **REAL** — exists in the repo right now and is wired up.
- 🟡 **PLANNED** — designed, justified, and scheduled in the phase plan, but not built yet.
- 🔴 **DEFERRED** — keep as a documented future option; do **not** build until a triggering condition is met.

The prior "Final System Architecture" proposal was a **target vision**. This doc is the **buildable plan** — it keeps the vision's endpoints, rewrites the parts that would have shipped broken, and sequences everything so you never have 5 empty packages and 12 vendor integrations to maintain at once.

---

## 1. What is actually in the repo today (ground truth)

This is the non-negotiable starting point. Anything below that contradicts this is wrong.

| Layer | Reality |
|---|---|
| 🟢 Mobile app | `dog-health-app/` — React Native 0.76 (bare, no Expo), TypeScript strict, Zustand v5 (8 stores), React Navigation 7, Supabase JS client. **This is the only shipping product.** |
| 🟢 Backend | **Supabase project `bxvihftrfamglqrilkok`** — Postgres + Auth + Realtime + Storage. Auth = email/password + phone/OTP. 8 tables with owner-scoped RLS (`supabase/schema.sql`). |
| 🟢 AI | On-device rule engine (`services/ai/service.ts`) + optional `llama.rn` LLM. All client-side. |
| 🟢 BLE pipeline | `react-native-ble-plx` + scanner + connection manager + **packet parser** (`services/ble/packetParser.ts`). Parser defines 5 packet types with a specific byte layout. |
| 🔴 ESP32 firmware | **Does not exist.** No `firmware/` dir, no C/C++, no ESP-IDF. The collar is conceptual. |
| 🔴 NestJS backend | **Does not exist.** `services/api/client.ts` points at `https://api.doghealthapp.com` (a domain not owned) with **commented-out auth** and is never called by any store. All data goes through Supabase directly. |
| 🔴 Sensors (MAX30102/MPU6500) | Not present. The parser has **no slot** for PPG raw, accelerometer XYZ, gyroscope, or respiration. Listing these as "collect" is premature. |
| 🔴 CRM / Vet portal / FastAPI AI / Stripe / PostHog / Sentry / Resend / Weather / Maps SDK | None present. |

**Implication:** the proposal's diagram (NestJS gateway between the app and Supabase) describes a system that does not match the shipping app. The shipping app talks to Supabase directly and well. We will not insert a gateway unless it earns its place (§5).

---

## 2. Target architecture (vision, kept)

```
                            ┌──────────────────────────┐
                            │  ESP32-S3 Smart Collar   │ 🔴 not built yet
                            └────────────┬─────────────┘
                                         │ BLE (protocol in §6)
                                         ▼
┌──────────────────────────┐    ┌─────────────────────────────────────────┐
│   Mobile App (RN CLI)    │◄──►│            SUPABASE PROJECT             │
│   - existing + grown     │    │  Postgres + Auth + Realtime + Storage   │
│                          │    │  + Edge Functions (Deno)                │
│   Zustand + (later)      │    │                  ▲                      │
│   TanStack Query         │    │                  │ service-role (srv)   │
└──────────────────────────┘    └──────────────────┼───────────────────────┘
            ▲                                              │
            │ anon key + JWT role claim (RLS)              │
            │                                              │
            │                                ┌─────────────┴──────────────┐
            │                                │                            │
            │                         ┌──────▼───────┐            ┌───────▼───────┐
            └─────────────────────────►│  CRM (Web)  │            │ External Svcs │
                                      │  Next.js     │            │ Stripe/Twilio │
                                      │  (operators) │            │ Resend/Maps   │
                                      └──────────────┘            └───────────────┘
                                                │
                                  (Vet Portal = CRM with role=scoped views, not a separate app)
```

**Key differences from the original proposal:**

1. **No NestJS box between the app and Supabase.** Edge Functions sit *inside* Supabase and own the privileged/cross-tenant operations. (§5 explains why.)
2. **Vet Portal is not a separate app.** It is the Next.js CRM with a `vet` role and scoped RLS — one codebase, two personas. A separate portal is a Phase-4 option if vets need a genuinely different UX.
3. **FastAPI AI is optional and later.** The on-device rule engine already ships; ML inference becomes a Phase-3 add-on fed by the same `health_metrics` table.

---

## 3. Decisions that differ from the proposal (and why)

| # | Proposal said | We do instead | Reason |
|---|---|---|---|
| D1 | NestJS API Gateway owns business logic | **Supabase Edge Functions + Postgres RLS + client services** until a measured need appears (§5) | One server to run, not two. No duplicated auth. No repo layer that re-implements RLS. You have a small team. |
| D2 | Monorepo: `mobile/backend/crm/firmware/ai/shared/docs` | **Start with `mobile/` + `crm/` + `shared/`.** Add `firmware/`, `ai/`, `backend/` only when code lands there | 5 empty packages = config ceremony and zero value. Grow the tree when each branch gets its first real file. |
| D3 | Firmware sensors: MAX30102 + MPU6500 + GPS + temp + battery | **Firmware must conform to the existing `packetParser.ts` byte layout (§6).** Add new packet types (sleep/respiration/raw IMU) only by extending the parser first | The parser is the on-wire contract. Shipping sensors the app can't decode = silent data loss. |
| D4 | 18 DB tables, all at once | **8 exist; ~7 genuinely new now; ~5 deferred** (§7) | Several proposed tables duplicate existing ones (`users`≈`profiles`, `gps_locations`≈`locations`, `activity_logs`≈`health_metrics.activity_*`); others need data sources that don't exist yet (`sleep_sessions` has no packet type). |
| D5 | Stripe + PostHog + Sentry + Resend + Twilio + Google Maps + Weather API + FCM/APNs + Apple/Google SSO, all foundational | **Tiered (§8).** Phase 1 essentials only | 12 vendor integrations = 12 billing surfaces and 12 failure modes. Take them on one at a time, when a real need appears. |
| D6 | Notifications: FCM (Android) + APNs (iOS) directly | **Stay on the existing `react-native-push-notification` abstraction** until you need platform-specific features the lib blocks | Already wired. Replacing it is a refactor, not a foundation. |
| D7 | Maps: Google Maps SDK | **Keep `react-native-maps` (uses Google Maps on Android under the hood, Apple Maps on iOS)** | Already installed and working on Tracking screens. A separate Google Maps SDK costs an API key + billing for no current gain. |
| D8 | TanStack Query on mobile as a foundational layer | **Phase-2 mobile refactor, not a foundation** | Your Zustand stores already do Supabase-first/local-fallback. Adopting TanStack Query is a clean improvement, but it touches every store — do it deliberately, not in passing. |

---

## 4. Phase plan (what builds when)

### Phase 0 — Foundations (≈1 wk) 🟡
- Monorepo restructure: `mobile/` (the existing app, moved) + `shared/` (extracted types) + `crm/` (skeleton). No new packages beyond these three.
- `shared/` exports `Dog`, `HealthAlert`, `Route`, etc. (lifted from `dog-health-app/app/types/`) + a `tokens.json` mirror of `app/theme/colors.ts`.
- Supabase: add `role`/`status` to `profiles`, the JWT custom-claim function, `admin_audit_log`. (Full SQL in CRM doc Appendix A.)
- **Exit gate:** mobile app still typechecks/lints/builds unchanged; an admin can sign in to an empty CRM shell.

### Phase 1 — CRM read-only 360° (≈2 wks) 🟡
- Owners list + Owner detail; Dogs list + Dog detail (vitals charts reuse mobile types); Devices fleet view (read-only); Alerts console (live Realtime); Analytics tiles from materialised views.
- All Edge Functions needed for *reads* + impersonation only.
- **Exit gate:** staff can investigate any owner/dog/alert without DB access.

### Phase 2 — Operations + Support (≈2 wks) 🟡
- Support inbox; `admin-resolve-alert`, `admin-reassign-device`; notes/tags; audit explorer; bulk list actions.
- **Sentry** added now (first of the vendor integrations — you'll want it before billing/campaigns ship).
- **Exit gate:** day-to-day support runs from the CRM.

### Phase 3 — Billing + Growth (≈2 wks) 🟡
- **Stripe** (webhooks → subscriptions/invoices/payments), billing views, refund Edge Function.
- **Resend** (transactional email) + **Twilio** (already a Supabase OTP dependency, reuse for campaign SMS).
- Campaigns + announcements (push via the existing notifications service).
- **Exit gate:** end-to-end billing; first campaign sent.

### Phase 4 — Vets, deep analytics, hardening (≈2 wks) 🟡
- Vet role + scoped RLS + vet views inside the CRM.
- **PostHog** added (retention/feature-adoption finally worth measuring once real users exist).
- Cohort/retention analytics, load-test Realtime at 10k alerts/day.
- **Exit gate:** v1.0 release to staff.

### 🔴 Deferred (triggered, not scheduled)
| Item | Build it when… |
|---|---|
| NestJS backend | …Edge Functions demonstrably can't handle a need (long-running jobs > 30s, heavy CPU, websockets with custom routing, > ~50 functions). None of these are true today. |
| `firmware/` package + ESP-IDF | …you actually flash a collar. And **extend `packetParser.ts` first** for any new sensor. |
| FastAPI ML AI | …you have ≥10k dogs of labelled `health_metrics` data and a concrete model (sleep/respiration/anomaly). Until then the rule engine + thresholds are correct and shippable. |
| `sleep_sessions` / `activity_logs` tables | …a new BLE packet type exists in the parser to populate them. |
| Separate Vet Portal app | …vets' UX needs diverge so far that one Next.js codebase with role-gated routes can't serve both. |
| Apple/Google SSO | …owners ask for it. Email/OTP is fine for launch. |
| Weather API, Health-Connect, Wear OS, smart-home | …these are explicit Phase-5+ product features, not architecture. |
| Organizations/multi-tenant B2B | …you sell to a chain of clinics. Single-tenant until then. |
| `firmware_versions` / `device_logs` tables | …firmware exists. |

---

## 5. Why no NestJS (the biggest reconciliation)

The proposal makes NestJS the gateway for "business logic, APIs, auth middleware, subscriptions, device APIs, AI orchestration, payments." Each of those already has a home in the shipping system:

| NestJS responsibility (proposed) | Already owned by | Verdict |
|---|---|---|
| Authentication | Supabase Auth (email/OTP, JWT, sessions) | Re-implementing in NestJS duplicates Supabase's auth and risks drift. |
| Business logic / validation | Zustand stores + Zod schemas + Postgres constraints + RLS | Logic lives close to the data it guards. |
| Subscriptions / payments | Stripe webhooks → an Edge Function (`webhook-stripe`) | A 60-line Deno function, not a server. |
| Device APIs | `devices` table + `device_assignments` + RLS | Direct from Supabase. |
| AI orchestration | On-device rule engine today; FastAPI *later* (Phase-3 add-on) | Not a gateway concern. |
| Rate limiting / audit | RLS + `admin_audit_log` + Edge Function guards | Already designed. |

**The NestJS layer would become a pass-through** that re-checks auth Supabase already checked, re-validates Zod schemas the client already validated, and re-writes RLS rules as repository code. That is the textbook definition of a layer that earns its keep only at scale you haven't reached.

**The honest position:** keep "Introduce NestJS when X" as a written trigger (§4 deferred table). If you cross it, the migration is mechanical because every privileged op is already an Edge Function with the same shape — promoting a function to a NestJS controller is mostly copy-paste. That's the *real* value of going Edge-Function-first: you preserve the option without paying for it now.

---

## 6. The BLE protocol — the actual on-wire contract 🔴→🟢

> This is the single most important correction to the proposal. The proposal listed sensors and an abstract "Characteristics → Notifications → Packet Parser" flow. The **parser is the contract**. Any firmware must produce exactly these bytes, or data is silently dropped.

Source of truth: `dog-health-app/app/services/ble/packetParser.ts`. All multi-byte numeric fields are decoded as written there — **note the endianness is inconsistent across packet types** (this is a pre-existing quirk to preserve, not "fix" without coordinated firmware+app changes).

Every packet starts with a 1-byte type tag at offset 0, then type-specific payload. Base64-decoded to a `Uint8Array` before parsing.

### 6.1 Packet type dispatch

| `byte[0]` | Type | Parser method |
|---|---|---|
| `0x01` | Heart rate | `parseHeartRatePacket` |
| `0x02` | GPS | `parseGPSPacket` |
| `0x03` | Temperature | `parseTemperaturePacket` |
| `0x04` | Battery | `parseBatteryPacket` |
| `0x05` | Activity | `parseActivityPacket` |
| other | — | **dropped** (`console.warn`, returns `null`) |

### 6.2 Heart rate (`0x01`)

```
[0]    = 0x01
[1]    = flags        ; bit 0 (0x01) set  → 16-bit BPM, else 8-bit
[2]    = bpm low  (8-bit mode: the whole value)
[3]    = bpm high (only meaningful in 16-bit mode)
```
- 8-bit:  `bpm = byte[2]`
- 16-bit: `bpm = (byte[3] << 8) | byte[2]`  → **little-endian** at offsets 2–3

### 6.3 GPS (`0x02`)

```
[0]     = 0x02
[1..4]  = latitude   ; uint32, big-endian, ÷1e6
[5..8]  = longitude  ; uint32, big-endian, ÷1e6
[9..12] = altitude   ; uint32, big-endian, ÷1e6
```
Decode: `value = byte[i]*256^3 + byte[i+1]*256^2 + byte[i+2]*256 + byte[i+3]`, then `value / 1_000_000`.

> ⚠️ **Correction to the prior mobile `AGENTS.md`, which said "GPS … as IEEE float."** It is **not** IEEE-754 — it is an **integer micro-unit (÷1e6), big-endian**. The proposal inherited the wrong claim. Firmware that emits IEEE floats will produce garbage coordinates.

### 6.4 Temperature (`0x03`)

```
[0] = 0x03
[1] = tempRaw low
[2] = tempRaw high
[3] = humidity (uint8, %)
```
`tempRaw = (byte[2] << 8) | byte[1]` → **little-endian**; `celsius = tempRaw / 100.0`.
Example: 24.50 °C → `tempRaw = 2450` → bytes `[1]=0x92, [2]=0x09`.

### 6.5 Battery (`0x04`)

```
[0] = 0x04
[1] = level     ; uint8, percent (0–100)
[2] = voltage low
[3] = voltage high
[4] = status    ; bit 0 (0x01) = charging
```
`voltage = ((byte[3] << 8) | byte[2]) / 1000.0` volts, **little-endian**.

### 6.6 Activity (`0x05`)

```
[0]      = 0x05
[1..4]   = steps          ; uint32, little-endian
[5]      = activeMinutes  ; uint8
[6..9]   = distance       ; uint32, big-endian, ÷1e6
```
- steps: `(byte[4]<<24) | (byte[3]<<16) | (byte[2]<<8) | byte[1]` → **little-endian**
- distance: same formula as GPS coords → **big-endian ÷1e6**

### 6.7 What the protocol does NOT carry today

The proposal lists sensors whose data has **no packet type** and would be silently dropped:

- ❌ PPG raw signal (MAX30102 raw) — no slot
- ❌ Accelerometer XYZ / gyroscope (MPU6500) — no slot
- ❌ Respiration rate — no slot
- ❌ Sleep stages / sleep session boundaries — no slot
- ❌ Stress score — no slot

**Adding any of these is a coordinated change:** (1) extend `packetParser.ts` with a new `0x06+` type and its byte layout, (2) update `app/types/ble.ts`, (3) write firmware that emits exactly that layout, (4) decide storage (a new table or new columns on `health_metrics`). Do **not** create `sleep_sessions`/`activity_logs` tables first and hope data appears.

### 6.8 Encoding note (read before shipping firmware)

- Base64 decode is done in JS (`base64ToBytes`) — firmware/base-station sends base64 over the BLE characteristic notify payload.
- `bytesToFloat` (used for GPS + distance) is **big-endian integer ÷ 1e6**, not IEEE-754 and not little-endian.
- HR-16, temperature raw, battery voltage, steps are **little-endian**.
- This endianness inconsistency is a known wart; freezing it now keeps existing captures valid. A v2 packet format (e.g. all little-endian + a version byte) is a Phase-5 migration with a parser-compatibility shim.

---

## 7. Database reconciliation (existing vs new vs deferred)

The proposal's 18 tables, checked against the 8 that exist:

| Proposed table | Verdict | Action |
|---|---|---|
| `users` | 🔁 **Duplicate** of `profiles` | Use `profiles` (extends `auth.users`). Add `role`, `status`, etc. as columns. |
| `dogs` | 🟢 exists | Extend only (add `is_active` already present; add nothing else required). |
| `devices` | 🟢 exists | Extend with `sku`, `serial_number`, `hardware_revision`, `warranty_expires_at`, `inventory_status`. |
| `device_assignments` | 🆕 **new, justified** | Add (collar ownership history). |
| `health_metrics` | 🟢 exists | No change; already covers HR/temp/battery/activity time-series. |
| `sleep_sessions` | 🔴 **deferred** | No packet type feeds it (§6.7). Add only with a new `0x06` sleep packet. |
| `activity_logs` | 🔁 **redundant** | `health_metrics.activity_steps/active_minutes/calories` + `routes` already cover this. Don't build. |
| `gps_locations` | 🔁 **Duplicate** of `locations` | Use `locations`. |
| `alerts` | 🟢 exists | No change. |
| `notifications` | 🆕 **new (as `announcements`)** | Owner-facing in-app banners; distinct from push. |
| `organizations` | 🔴 **deferred** | Triggered by B2B/multi-tenant clinic sales. |
| `clinics` | 🆕 **new (as `vet_practices`)** | See CRM doc §6.6. |
| `veterinarians` | 🔁 **Use `profiles` with `role='vet'`** | Plus a `vet_dogs` join table for scoping. |
| `subscriptions` | 🆕 **new, justified** | Phase 3 with Stripe. (+ `invoices`, `payments`.) |
| `firmware_versions` | 🔴 **deferred** | Triggered by firmware existing. |
| `device_logs` | 🔴 **deferred** | Triggered by firmware existing. |
| `audit_logs` | 🆕 **new (as `admin_audit_log`)** | Mandatory from Phase 0. |
| `support_tickets` | 🆕 **new, justified** | (+ `ticket_messages`.) Phase 2. |

**Also genuinely new and justified (not in the proposal but needed):**
`owner_notes`, `campaigns`, `campaign_recipients`, `analytics_daily`, `ops_incidents`, `device_inventory`, `vet_dogs`.

**Net:** 8 existing + ~13 new across phases + 5 deferred. **Not 18 at once.** Full idempotent SQL for the new tables is in `docs/CRM_DASHBOARD_ARCHITECTURE.md` Appendix A — that remains the canonical migration; this section just reconciles the naming.

---

## 8. Third-party integrations, tiered

The proposal lists ~12 services as if all foundational. They are not. Tier them by *when the need is real*:

### Phase 1–2 essentials
- **Supabase** (already in) — DB, Auth, Realtime, Storage, Edge Functions.
- **Sentry** (Phase 2, just before support ships) — crash + error monitoring. First vendor in because you want visibility *before* billing/campaigns.

### Phase 3 (billing + comms)
- **Stripe** — subscriptions, invoices, refunds. Webhook → Edge Function.
- **Twilio** — **already a Supabase OTP dependency**, so reuse for campaign SMS. No new relationship.
- **Resend** — transactional + campaign email. (SES is the fallback; pick one.)

### Phase 4 (growth)
- **PostHog** — product analytics. Worth measuring only once real users exist; before that it's noise.
- Push: keep **`react-native-push-notification`** (wraps FCM/APNs). Direct FCM/APNs is a Phase-5 refactor if you need platform features the lib blocks.

### 🔴 Deferred until triggered
- **Google Maps SDK** — `react-native-maps` already uses Google tiles on Android / Apple on iOS. Pay for the SDK only if you need geocoding/directions/offline tiles you can't get now.
- **Weather API** — Phase-5 product feature (heat-index outdoor-risk). Not architecture.
- **Apple / Google SSO** — when owners ask; email/OTP is fine for launch.
- **FastAPI ML serving** — when labelled-data threshold is met (§4).

**Rule:** every integration here is a billing surface, a key to rotate, an outage domain, and a compliance question. Adding one is a one-way door; do it the week you need it, not the week you read about it.

---

## 9. Monorepo (the minimum viable tree)

Today: one app at `dog-health-app/`. Target, grown on demand:

```
DogVita/
├── mobile/          ← existing dog-health-app, renamed/moved
├── shared/          ← @dogvita/types (TS types + tokens.json)   🟡 Phase 0
├── crm/             ← Next.js CRM                                🟡 Phase 0 skeleton
├── docs/            ← this file + CRM doc (already here)
├── firmware/        ← 🔴 created the day you flash a collar
├── ai/              ← 🔴 created when FastAPI/ML work starts
└── backend/         ← 🔴 created only if the NestJS trigger fires
```

Migration path (Phase 0, low-risk):
1. Extract `dog-health-app/app/types/*` → `shared/src/`, re-export from the old location so the mobile app's relative imports keep working.
2. Add a build step generating `shared/tokens.json` from `app/theme/colors.ts`.
3. Create empty `crm/` (Next.js) that imports `@dogvita/types`.
4. Do **not** move `dog-health-app/` to `mobile/` in the same commit as anything else — that's a pure rename PR on its own, for clean history.

`shared/` is the only package that materially de-risks the future: it stops the mobile app and CRM from drifting on `Dog`/`HealthAlert`/`Route` shapes. Everything else can wait.

---

## 10. Telemetry pipeline (reconciled)

The proposal's pipeline has an "Offline Queue → NestJS → Validation → Supabase" segment. The shipping pipeline is shorter and the NestJS hop is removed:

```
ESP32-S3 (sensors sample)                 🔴 not built
   │ BLE notify (base64 packet, §6 layout)
   ▼
Mobile app                                🟢
   │ blePacketParser.parse()  → BLEParsedData
   │ healthStore / trackingStore / alertStore ingest
   │ offline-first: Zustand persist → AsyncStorage (always local)
   │
   │ on Supabase write (fire-and-forget, with the existing fallback):
   ▼
Supabase Postgres                         🟢
   │ INSERT health_metrics / locations / alerts
   │
   ├──► Realtime (postgres_changes) ─► CRM alerts console (Phase 1) 🟡
   ├──► RLS-gated reads from CRM / Vet views
   └──► (Phase 3) cron Edge Function → analytics_daily rollup
```

**Offline sync (§21 of the proposal):** already partially implemented. Zustand `persist` keeps data local; stores try Supabase first and fall back to local on failure. The gap is an explicit **upload queue with retry/confirm/delete** — worth adding (Phase 2) but not blocking. Concrete design: a `syncQueue` table in AsyncStorage of pending writes, drained by a background task on `NetInfo` "online" events, with server-acknowledged deletes. Do **not** couple this to a NestJS server; the Supabase client already does retries.

---

## 11. Security model (kept, tightened)

The proposal's security list is correct in spirit; specifics for this codebase:

- **BLE pairing** — today the app connects to any advertised device (placeholder UUIDs in `.env`). Real secure pairing (out-of-band key exchange, encrypted characteristics) is **firmware-coupled → deferred with firmware**. Document the requirement now; ship it with the collar.
- **Backend** — JWT (Supabase), RLS on every table (existing + new), input validation (Zod on mobile, DTOs in Edge Functions), rate limiting at the Edge Function + Supabase Auth layer, `admin_audit_log` for every privileged op.
- **Mobile** — Supabase tokens in AsyncStorage today; **move to OS Keychain/Keystore** (e.g. `react-native-keychain`) as a Phase-2 hardening task. Certificate pinning and biometric lock stay future, as the proposal says.
- **Service-role key discipline** — never in any client bundle (mobile or web). Edge Functions / Next.js server components only. (Restated because it's the #1 footgun in a Supabase system.)

---

## 12. CI/CD & monitoring (sequenced, not all-at-once)

| Stage | When |
|---|---|
| `npm run typecheck` + `lint` on PR (mobile) | 🟢 now (already exists) |
| GitHub Actions: typecheck → lint → Android release build (via the `C:\R\dog-health-app` short-path mirror) | 🟡 Phase 1 |
| Edge Function deploy on merge to `main` (`supabase functions deploy`) | 🟡 Phase 1 |
| CRM deploy (Vercel) on merge | 🟡 Phase 1 |
| iOS build in CI | 🔴 when you ship iOS |
| E2E tests (Detox / Playwright for CRM) | 🔴 when the surface is stable enough to be worth it |

Monitoring (all the proposal's items are right; the order is what matters): Sentry first (Phase 2), Supabase project health dashboard continuously, alert-storm cron + `ops_incidents` (Phase 1 in the CRM). Device-uptime/BLE-disconnect/GPS-accuracy/battery-drain monitoring is **firmware-coupled → deferred with the collar** — you can't monitor devices that don't exist.

---

## 13. AI roadmap (kept, with the rule-engine reality up front)

- **Today 🟢:** on-device rule engine (`services/ai/service.ts`) + optional `llama.rn` LLM. Threshold-based alerts (high HR, low battery, geofence, abnormal activity). This is real and shippable.
- **Phase 2 🟡:** richer rule packs + the symptom checker / diet engines already in the app; expose alert-rule tuning from the CRM.
- **Phase 3 🔴 (triggered):** Python FastAPI service for activity classification, sleep detection, anomaly detection — **only after** (a) the relevant BLE packet types exist (§6.7) and (b) enough labelled `health_metrics` data is collected. The service reads from and writes back to the same Supabase tables; no app change required for inference results to surface.
- **Phase 5 🔴:** TinyML on the ESP32. Far out; depends on firmware.

---

## 14. What this document intentionally does NOT decide

So that they don't get accidentally "decided" by silence:

- SSO provider (Apple/Google) — deferred to owner demand.
- Email/SMS vendor beyond "Resend + Twilio" — pick one email provider when Phase 3 starts.
- Whether the Vet Portal splits off — revisit at end of Phase 4.
- The v2 BLE packet format — design when firmware is real, with a parser-compat shim.
- Dark mode in the mobile app — the CRM's token work (Phase 0) sets up the structure; mobile adoption is a separate decision.

These live in the decisions log and get promoted to tasks only when their trigger fires.

---

## 15. Summary — the one-paragraph version

Keep the proposal's endpoints (mobile app + collar + Supabase + CRM + vet access + phased AI), drop the NestJS gateway (Supabase Edge Functions + RLS cover it until a measured need appears), freeze the BLE protocol at the existing `packetParser.ts` byte layout and make any firmware conform to it, grow the monorepo one package at a time starting with `mobile/` + `shared/` + `crm/`, and adopt third-party services (Stripe/PostHog/Sentry/Resend/…) one per phase as each becomes the next bottleneck — not twelve on day one.

---

*End of reconciled system architecture — v1.0. Companion file: `docs/CRM_DASHBOARD_ARCHITECTURE.md` (CRM module detail + full SQL).*
