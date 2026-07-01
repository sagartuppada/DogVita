# AGENTS.md — dog-health-app

React Native 0.76 (bare, no Expo) TypeScript app for monitoring a BLE dog-collar (ESP32-S3). Zustand state, React Navigation 7, Supabase backend, react-native-ble-plx.

## Quick Start

```bash
npm install
npm run typecheck                      # tsc --noEmit — run first, cheapest check
npm run lint                           # ESLint
```

No test suite exists. `npm test` in package.json maps to `jest` but there are no test files — do not rely on it.

## Build & Deploy

**Canonical source**: `C:\Users\User\Desktop\Santo\DogVita\dog-health-app` (git repo)
**Build copy**: `C:\R\dog-health-app` (sync from canonical before building)

Windows `MAX_PATH` (260 chars) blocks Gradle from the canonical path. Always build from the short path.

### Sync files before building

```powershell
# Individual files (preferred — fast):
Copy-Item "C:\Users\User\Desktop\Santo\DogVita\dog-health-app\app\screens\foo.tsx" "C:\R\dog-health-app\app\screens\foo.tsx" -Force

# Full mirror (slow, use after large changes):
robocopy "C:\Users\User\Desktop\Santo\DogVita\dog-health-app" "C:\R\dog-health-app" /MIR /XD "node_modules" ".git" "android" "ios" "graphify-out" /XF "*.apk" /np /njh /njs /ndl /nc /ns
```

`robocopy` does NOT work with individual file params on PowerShell — use `Copy-Item` for single files.

### Build release APK

```powershell
$env:ANDROID_HOME = "C:\Users\User\AppData\Local\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd C:\R\dog-health-app\android
.\gradlew.bat app:assembleRelease --no-daemon -PreactNativeArchitectures=x86_64
```

APK output: `C:\R\dog-health-app\android\app\build\outputs\apk\release\app-release.apk`

### Install on device/emulator

```powershell
C:\Users\User\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r <path-to-apk>
```

- Emulator: `emulator-5554`
- Physical device: `00116651G005894`

### JAVA_HOME

Must point to Android Studio's bundled JDK (`C:\Program Files\Android\Android Studio\jbr`). A system JDK breaks the Gradle build.

### Old Architecture Patch Removed

The Old Architecture patch (`scripts/patch-llama-rn.js`) has been removed. New Architecture is now required for llama.rn to work. `newArchEnabled=true` is already set in `android/gradle.properties`.

## Entry Points & Layout

- `index.js` → `AppRegistry.registerComponent` → `app/App.tsx` → `RootNavigator`
- `app/navigation/RootNavigator.tsx` — `OnboardingGuard`: shows onboarding if `!hasCompletedOnboarding`, else shows `MainTabNavigator`. On session restore, calls `fetchDogs()` and auto-completes onboarding if dogs exist in Supabase.
- `app/navigation/MainTabNavigator.tsx` — 4 tabs: Home, Health, Tracking, AI (chatbot)
- `app/screens/onboarding/` — Welcome → SignUp → Login → AddPhone → OTP → SetupDog → PairDevice
- `app/screens/{dashboard,health,tracking,chatbot,settings}/` — main screens
- `app/services/api/` — Supabase services: `dogs.ts`, `health.ts`, `alerts.ts`, `tracking.ts`
- `app/services/auth/service.ts` — email+password + phone+OTP auth (all methods call Supabase directly)
- `app/store/` — Zustand stores: `dogStore`, `healthStore`, `bleStore`, `trackingStore`, `alertStore`, `settingsStore`

## Auth

Email+password and phone+OTP. All auth methods call Supabase directly — no test mode bypass (README claims OTP `123456` works without Supabase, but the code has no such bypass).

- `signUpWithEmail(email, password)` — creates Supabase user + triggers profile auto-create
- `signInWithEmail(email, password)` — standard Supabase sign in
- `sendOTP(phone)` — sends OTP via Supabase (requires Twilio configured in dashboard)
- `verifyOTP(phone, code)` — verifies OTP code

### Onboarding guard

`RootNavigator` checks `hasCompletedOnboarding` from `settingsStore`. If false, shows onboarding stack. On Supabase session restore, `fetchDogs()` runs — if dogs exist, onboarding is auto-marked complete.

### Sign out

`authService.signOut()` clears: Supabase session + all 6 AsyncStorage persisted store keys + resets Zustand in-memory state. Partial resets cause stale data to leak between accounts.

## Hermes Polyfills (index.js)

Hermes in RN 0.76 is missing several Web APIs. `index.js` polyfills them before app load:

- `URL.prototype.hostname`, `.host`, `.origin` — used by Supabase client
- `URLSearchParams.prototype.set`, `.append`, `.delete` — used by Supabase client

**Do not remove these polyfills.** Supabase-js crashes without them. Error symptoms: `URL.hostname is not implemented`, `URLSearchParams.set is not implemented`.

## Path Aliases — Use Relative Imports

`@components/*`, `@screens/*`, etc. are defined in `tsconfig.json` and `babel.config.js` but source files use **relative imports**. Use relative imports for new code. Re-enabling aliases causes production build failures.

## Env Loading

Env vars loaded via `react-native-dotenv` (`@env` module) in babel.config.js. However, `@env` does NOT inline variables in release builds — hardcoded fallback values in `supabase.ts` and `config/index.ts` ensure the app works in production.

Both `SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_URL` are supported (dual naming for backward compat).

## State Management

Zustand stores, one per domain. Persist middleware writes to AsyncStorage.

### CRITICAL: Zustand Selector Rules

**Never call methods or return new references inside Zustand selectors.** Infinite re-render loops.

```tsx
// BAD — new ref each render:
const activeDog = useDogStore((state) => state.getActiveDog());
const heartRateData = useHealthStore((state) => state.heartRateHistory.slice(-20));

// GOOD — narrow selectors + useMemo:
const dogs = useDogStore((s) => s.dogs);
const activeDogId = useDogStore((s) => s.activeDogId);
const activeDog = useMemo(() => dogs.find((d) => d.id === activeDogId) ?? null, [dogs, activeDogId]);
```

### Store → Service wiring pattern

Stores try Supabase first (via service layer), fall back to local data on failure:

```tsx
// Pattern used in all stores:
if (isSupabaseConfigured()) {
  const data = await service.fetchFromDB();
  if (data) { set({ data }); return; }
}
// fallback to local/demo data
```

### `dogsService.createDog()` throws on failure

Unlike older code that returned `null` silently, `createDog()` now throws errors. The store catches and falls back to local-only storage. Check `console.warn` output for Supabase insert failures.

### Persisted store keys (all cleared on sign out)

`dog-storage`, `health-storage`, `alert-storage`, `tracking-storage`, `ble-storage`, `settings-storage`

## On-Device LLM

llama.rn 0.12.5 provides on-device LLM inference via the messages API with Jinja templates. The GGUF file's embedded chat template handles formatting automatically — no manual prompt building.

### Available Models

| Model | Size | Min RAM | Notes |
|-------|------|---------|-------|
| SmolLM2 135M | 90 MB | 0.5 GB | Lightweight, fast |
| Llama 3.2 1B | 800 MB | 1.5 GB | Good balance |
| Qwen 2.5 1.5B | 1 GB | 2.0 GB | Balanced |
| **Gemma 4 E2B** | **2.9 GB** | **4.0 GB** | **Default.** Google's mobile-optimized model with 128K context |

### LLM Lifecycle

- `useLLMLifecycle` hook automatically unloads the model when app goes to background (frees ~1-4GB RAM)
- Model reloads when app returns to foreground
- Default model: Gemma 4 E2B (falls back to Llama 3.2 1B on low-RAM devices)

### LLM Service Files

- `app/services/ai/modelManager.ts` — model catalog and download management
- `app/services/ai/llmService.ts` — llama.rn wrapper (messages API + Jinja)
- `app/hooks/useLLMLifecycle.ts` — background/foreground model lifecycle

## Supabase Schema

SQL already run in Supabase dashboard:

```sql
-- profiles table gets email column + updated trigger
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone)
  VALUES (new.id, new.email, new.phone);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- dogs table gets gender column
ALTER TABLE public.dogs ADD COLUMN IF NOT EXISTS gender text;
```

RLS policies + auto-create profile trigger exist in `supabase/schema.sql`.

## BLE / Hardware

Real BLE UUIDs are placeholder in `.env` (`EXPO_PUBLIC_BLE_*`). The packet parser (`app/services/ble/packetParser.ts`) expects little-endian binary frames from the ESP32-S3 collar. `react-native-ble-plx` does not work in iOS Simulator or Android Emulator — test on a real device.

## Debugging

- `console.log` is stripped in release builds. Use `Alert.alert()` for debug output visible on device.
- `adb shell uiautomator dump /sdcard/ui.xml` — reliable way to check current screen in release builds.
- `graphify-out/` has a pre-generated AST knowledge graph. Open `graphify-out/graph.html` in a browser.

## Conventions

- **No Redux.** Only Zustand. Do not introduce Redux.
- **TypeScript strict** is on. `npm run typecheck` before lint.
- **Theme tokens** from `app/theme/` — do not hardcode hex values.
- **Icons** use `react-native-vector-icons/Ionicons`.
- No comments added on edits unless non-obvious (mirrors original style).
- Dog type fields `birthDate`, `weight`, `weightUnit`, `gender` are all optional in the schema.
