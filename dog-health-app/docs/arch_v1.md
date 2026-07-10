# DogVita Architecture — v1.0 (Foundation)

**Date:** 2026-06-03 → 2026-06-25
**Status:** Stable
**Commits:** `2805fb1` → `167fe67`

---

## Overview

Initial DogVita application: BLE dog collar integration, Supabase backend, Zustand state, React Navigation, onboarding, and core screens.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.76.6 (bare, no Expo) |
| Language | TypeScript strict |
| State | Zustand + persist middleware (AsyncStorage) |
| Navigation | React Navigation 7 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email+password, phone+OTP) |
| BLE | react-native-ble-plx |
| Charts | react-native-gifted-charts |
| Maps | react-native-maps + OpenStreetMap WebView |
| Build | Gradle assembleRelease |

## Directory Structure

```
dog-health-app/
├── app/
│   ├── App.tsx                    # Root component
│   ├── index.ts                   # App entry with Hermes polyfills
│   ├── navigation/
│   │   ├── RootNavigator.tsx      # OnboardingGuard + auth listener
│   │   ├── MainTabNavigator.tsx   # 4-tab floating pill bar
│   │   └── types.ts               # Navigation type definitions
│   ├── screens/
│   │   ├── onboarding/            # Welcome, SignUp, Login, OTP, SetupDog, PairDevice
│   │   ├── dashboard/             # DashboardScreen
│   │   ├── health/                # HealthOverviewScreen
│   │   ├── alerts/                # AlertsListScreen
│   │   ├── tracking/              # TrackingScreen
│   │   └── settings/              # SettingsScreen
│   ├── services/
│   │   ├── api/                   # supabase.ts, dogs.ts, health.ts, alerts.ts, tracking.ts
│   │   ├── auth/service.ts        # signOut clears all stores
│   │   └── ble/                   # packetParser.ts
│   ├── store/                     # dogStore, healthStore, alertStore, trackingStore, settingsStore, bleStore
│   ├── theme/                     # spacing, borderRadius, colors tokens
│   ├── types/                     # dog.ts, health.ts
│   └── components/                # Shared UI components
├── supabase/
│   └── schema.sql                 # Full DB schema with RLS
└── index.js                       # Hermes URL/URLSearchParams polyfills
```

## Key Architectural Decisions

1. **Zustand over Redux** — simpler API, built-in persistence, no boilerplate
2. **Supabase over custom backend** — PostgreSQL, auth, RLS, real-time out of the box
3. **Email+password over phone+OTP** — Twilio trial limits made OTP unreliable
4. **OnboardingGuard in RootNavigator** — centralized, single source of truth
5. **Store → Service → Supabase** pattern with local fallback
6. **Inline URL polyfill** over adding `react-native-url-polyfill` dependency
7. **Hardcoded fallback values** for release builds (where `@env` doesn't work)

## Data Flow

```
BLE Collar → packetParser → healthStore → Supabase
                                         → UI (charts, metrics)

User Auth → authService → Supabase Auth
           → settingsStore (onboarding flag)
           → dogStore (dog profiles)
```

## State Management

- 6 Zustand stores: `dog`, `health`, `alert`, `tracking`, `ble`, `settings`
- All persisted to AsyncStorage
- `signOut()` clears: Supabase session + AsyncStorage (6 keys) + Zustand in-memory state
- Selectors must be pure — no method calls, no new refs inside selectors

## Screens (4 tabs)

1. **Home** — Dashboard with heart rate, temperature, activity metrics
2. **Health** — Detailed health overview with charts
3. **Tracking** — Map view with geofencing
4. **AI** — Chatbot (placeholder until v2.0)

## Bugs Fixed (44 total)

- Expo contamination and cleanup (Bugs 1-3, 11, 30-31)
- Hermes polyfill crashes (Bugs 7-9)
- `@env` not working in release builds (Bugs 6, 10)
- Multi-account stale data (Bugs 16, 35, 41, 44)
- Onboarding bypass (Bugs 13-14, 42)
- Silent database failures (Bug 15)
- Settings not signing out (Bug 43)
- Windows MAX_PATH build issue (Bug 22)

## Known Limitations

- No offline AI chat (added in v2.0)
- BLE collar data requires real hardware
- Google Maps needs API key
- Emulator has no internet (physical device required for Supabase)
