# AGENTS.md — DogVita Root

Smart wearable dog health monitoring system: React Native app + ESP32-S3 BLE collar.

## Repo Layout

| Directory | Purpose |
|-----------|---------|
| `dog-health-app/` | **Main app.** React Native 0.76 bare workflow, TypeScript strict, Zustand, Supabase. |
| `DogVitaTemp/` | Separate template/scratch project (has its own `.git`). Ignore unless told otherwise. |
| `graphify-setup/` | Knowledge graph tooling. Has its own `AGENTS.md` — read it if working in this dir. |
| `.claude-flow/` | Ruflo swarm/agent coordination config. |

All app work happens in `dog-health-app/`. It has a comprehensive `AGENTS.md` — read it before editing.

## Critical Build Quirk

Windows `MAX_PATH` (260 chars) blocks Gradle from the canonical path. Builds must run from `C:\R\dog-health-app` (a short mirror).

```
Canonical (edit here): C:\Users\User\Desktop\Santo\DogVita\dog-health-app
Build copy (build here): C:\R\dog-health-app
```

Before building: sync changed files via `Copy-Item` (single files) or `robocopy /MIR` (full mirror).

## Quick Verification

From `dog-health-app/`:
```bash
npm install
npm run typecheck   # tsc --noEmit — run first, cheapest check
npm run lint        # ESLint
```

No test suite exists. `npm test` maps to jest but has no test files.

## Build (from short path)

```powershell
$env:ANDROID_HOME = "C:\Users\User\AppData\Local\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd C:\R\dog-health-app\android
.\gradlew.bat app:assembleRelease --no-daemon -PreactNativeArchitectures=x86_64
```

JAVA_HOME must be Android Studio's bundled JDK — a system JDK breaks Gradle.

## Non-Obvious Rules

- **No Redux.** Only Zustand. Do not introduce Redux.
- **Use relative imports.** `@components/*` aliases exist in tsconfig/babel but re-enabling them causes production build failures.
- **Zustand selectors must be pure.** Never call methods or return new refs inside selectors — causes infinite re-render loops. Use `useMemo` for derived data.
- **Hermes polyfills in `index.js` are required.** Supabase-js crashes without URL/URLSearchParams polyfills.
- **BLE doesn't work in emulators.** `react-native-ble-plx` requires a real device.
- **Theme tokens from `app/theme/`.** No hardcoded hex values.
- **Icons:** `react-native-vector-icons/Ionicons` only.

## Auth

Email+password + phone+OTP via Supabase. No test mode bypass (README claims OTP `123456` works without Supabase, but the code has no such bypass). Sign out clears all 6 persisted store keys — partial resets leak stale data between accounts.

## See Also

- `dog-health-app/AGENTS.md` — detailed app-level guidance (entry points, store patterns, BLE protocol, debugging)
- `graphify-setup/AGENTS.md` — knowledge graph usage rules
- `CLAUDE.md` — Ruflo agent coordination config (swarm, memory, hooks)
