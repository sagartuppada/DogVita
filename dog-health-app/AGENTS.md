# AGENTS.md — dog-health-app

React Native (bare, no Expo) TypeScript app for monitoring a BLE dog-collar (ESP32-S3). Zustand state, React Navigation 7, Supabase backend, react-native-ble-plx.

## Quick Start

```bash
npm install
npx react-native start --reset-cache  # Metro dev server
npx react-native run-android          # Build + run on Android
npm run typecheck                      # tsc --noEmit
npm run lint                           # ESLint
```

There is no test suite. `npm test` referenced in the README is a lie — the script is not defined in `package.json`.

## Entry Points & Layout

- `App.tsx` (root) re-exports from `app/App.tsx` — RN loads via `index.js` → `AppRegistry.registerComponent`.
- `app/App.tsx` — actual root component. Wraps everything in `GestureHandlerRootView` + `SafeAreaProvider`, then renders `RootNavigator`.
- `app/navigation/RootNavigator.tsx` — switches between the onboarding stack and the main tab navigator based on `useSettingsStore.hasCompletedOnboarding`.
- `app/screens/onboarding/` — Welcome → AddPhoneNumber → OTPVerification → SetupDogProfile → PairDevice.
- `app/screens/{dashboard,health,tracking,alerts,settings}/` — the 5 tabs (see `MainTabNavigator.tsx`).
- `app/services/` — `auth/`, `ble/{scanner,connection,packetParser,service}.ts`, `gps/`, `api/`, `notifications/`, `analytics/`, `storage/`.
- `app/store/` — Zustand stores: `dog`, `health`, `ble`, `tracking`, `alert`, `settings`.

## Auth — Test Mode

The app intentionally bypasses Supabase when `isSupabaseConfigured()` is false (placeholder `.env`) or `NODE_ENV === 'development'`. In test mode, **any phone number + OTP `123456` is accepted** — see `app/services/auth/service.ts:9-10` (`TEST_MODE` + `TEST_OTP`).

`WelcomeScreen` and `OTPVerificationScreen` display a yellow "TEST MODE" banner so users know.

If you want real Supabase auth, fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` and restart Metro.

## Path Aliases — Use Relative Imports

`@components/*`, `@screens/*`, `@services/*`, `@hooks/*`, `@store/*`, `@types/*`, `@theme/*`, `@config/*`, `@navigation/*` are still **defined** in `tsconfig.json`, `babel.config.js`, and `metro.config.js` — but the source files all use **relative** imports.

**Use relative imports for any new code.** The aliases are dead config kept for backward compat. Re-enabling them causes a Metro resolution error in production builds (this was a real bug — see commit history). Safe re-enable requires changes to all three config files plus reverting ~50 imports.

## Android Build Prerequisites

- Android Studio installed with SDK at `C:\Users\User\AppData\Local\Android\Sdk`
- `JAVA_HOME` must point at Android Studio's bundled JDK (e.g. `C:\Program Files\Android\Android Studio\jbr`). Setting it to a system JDK breaks the Gradle build.
- `android/local.properties` is already populated with `sdk.dir=...` and is **not** committed (see `.gitignore`).
- The `android/` and `ios/` directories are prebuild artifacts. Regenerate with `npx react-native prebuild` if you change `app.json` plugins or config.
- Build command: `$env:ANDROID_HOME="C:\Users\User\AppData\Local\Android\Sdk"; .\gradlew.bat app:assembleDebug --no-daemon -PreactNativeArchitectures=x86_64` (from `android/` dir)

## State Management

Zustand stores, one per domain. Persist middleware writes to `AsyncStorage` (already wired in most stores).

### CRITICAL: Zustand Selector Rules

**Never call methods or return new references inside Zustand selectors.** This causes infinite re-render loops ("Maximum update depth exceeded").

**BAD — creates new object/array each render:**
```tsx
const activeDog = useDogStore((state) => state.getActiveDog());  // new ref each time
const heartRateData = useHealthStore((state) => state.heartRateHistory.slice(-20));  // new array each time
```

**GOOD — narrow selectors + useMemo:**
```tsx
const dogs = useDogStore((s) => s.dogs);
const activeDogId = useDogStore((s) => s.activeDogId);
const activeDog = useMemo(() => dogs.find((d) => d.id === activeDogId) ?? null, [dogs, activeDogId]);
```

**BAD — destructuring the whole store:**
```tsx
const { isConnected, connectedDeviceName } = useBLEStore();  // re-renders on ANY store change
```

**GOOD — individual narrow selectors:**
```tsx
const isConnected = useBLEStore((s) => s.isConnected);
const connectedDeviceName = useBLEStore((s) => s.connectedDeviceName);
```

## Graphify (Knowledge Graph)

`graphify-out/` is a pre-generated AST knowledge graph of this codebase. Open `graphify-out/graph.html` in a browser for an interactive view. After editing source, refresh with:

```bash
graphify update .        # AST-only, no API key required
```

Use `graphify query "..."` to BFS-traverse `graph.json` for architecture questions. Community structure + god nodes are in `graphify-out/GRAPH_REPORT.md`.

## BLE / Hardware

Real BLE UUIDs are placeholder in `.env` (`EXPO_PUBLIC_BLE_*`). The packet parser (`app/services/ble/packetParser.ts`) expects little-endian binary frames from the ESP32-S3 collar. Test on a real device — `react-native-ble-plx` does not work in iOS Simulator or Android Emulator.

## Conventions

- **No Redux.** Only Zustand. (Per project requirement — do not introduce Redux.)
- **TypeScript strict** is on. `npm run typecheck` is the cheapest correctness check — run it before lint.
- **Theme tokens** come from `app/theme/` (`colors`, `spacing`, `typography`, `shadows`, `borderRadius`). Do not hardcode hex values in components.
- **Icons** use `react-native-vector-icons/Ionicons`.
- No comments added on edits unless the code is non-obvious (mirrors the original style — most files are clean of explanatory comments).
