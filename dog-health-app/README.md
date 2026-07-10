# DogVita — Smart Dog Health Monitor

React Native 0.76 (bare workflow) app for the DogVita ESP32-S3 BLE dog collar. On-device LLM health assistant, GPS tracking, geofencing, health monitoring, and Supabase cloud sync.

## Features

- **On-Device AI** — Qwen2.5-0.5B runs locally on the phone via llama.rn (no internet required for chat)
- **BLE Collar** — Real-time heart rate, temperature, GPS, battery from ESP32-S3
- **GPS Tracking** — Live location, route recording, geofence alerts
- **Health Dashboard** — Heart rate, temperature, SpO2, activity charts
- **Dog Profiles** — Weight history, vaccination records, breed info
- **AI Health Assistant** — Symptom checker, diet calculator, feeding schedules
- **Supabase Backend** — Cloud sync, auth, real-time updates

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.76 (bare, no Expo) |
| Language | TypeScript (strict) |
| State | Zustand (persisted via AsyncStorage) |
| Navigation | React Navigation 7 |
| Backend | Supabase (auth, DB, real-time) |
| BLE | react-native-ble-plx |
| Maps | react-native-maps |
| LLM | llama.rn (Qwen2.5-0.5B-Instruct-Q4_K_M) |
| Charts | react-native-gifted-charts |

## Quick Start

### Prerequisites

- Node.js 18+
- Android Studio (JDK bundled with it)
- Physical Android device (BLE doesn't work in emulators)

### 1. Clone and install

```bash
git clone https://github.com/MontageStark/DogVita.git
cd DogVita/dog-health-app
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_ANON_KEY` — your Supabase anon/public key

### 3. Generate native projects

This is a bare React Native project. The `android/` directory is not in git (too large, machine-specific). Generate it:

```bash
npx react-native init DogHealthApp --version 0.76.6
# Copy the generated android/ directory into this project:
cp -r ../DogHealthApp/android ./android
# Or if you have the android/ from a previous build, just copy it in.
```

Alternatively, if you received the `android/` directory from someone (zip, shared drive, etc.), just place it in the project root.

### 4. Build and run

**Set environment variables (Windows PowerShell):**

```powershell
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```

**Build release APK:**

```powershell
cd android
.\gradlew.bat app:assembleRelease --no-daemon -PreactNativeArchitectures=arm64-v8a
```

**Install on device:**

```powershell
adb install -r app\build\outputs\apk\release\app-release.apk
```

### 5. Verify

```bash
npm run typecheck    # TypeScript compilation
npm run lint         # ESLint
```

## Project Structure

```
dog-health-app/
├── app/
│   ├── screens/           # All screens (onboarding, dashboard, chat, etc.)
│   ├── navigation/        # React Navigation setup
│   ├── components/        # Reusable UI (maps, charts, cards)
│   ├── services/          # API, auth, BLE, AI, GPS services
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Zustand state stores
│   ├── types/             # TypeScript types
│   ├── theme/             # Colors, spacing, typography
│   └── config/            # App configuration
├── android/               # Native Android project (not in git)
├── supabase/
│   └── schema.sql         # Full database schema + RLS policies
├── index.js               # Entry point (Hermes polyfills)
├── metro.config.js        # Metro bundler config (Node.js stubs)
├── babel.config.js        # Babel config (env vars, aliases)
├── tsconfig.json          # TypeScript config
├── package.json           # Dependencies
├── .env.example           # Environment template
├── CHANGELOG.md           # Detailed changelog with problem/solution pairs
└── AGENTS.md              # Developer guide for AI assistants
```

## On-Device LLM

The app includes an on-device AI health assistant powered by llama.rn.

**Model:** Qwen2.5-0.5B-Instruct-Q4_K_M (~300MB, downloaded on first chat open)

**How it works:**
1. User opens the AI tab → `ChatScreen` mounts
2. If model not downloaded → downloads from HuggingFace (~300MB, with progress)
3. Model loads into memory via `initLlama()` (120s timeout)
4. User types a question → streamed response via `context.completion()`

**Key files:**
- `app/services/ai/modelManager.ts` — download via `react-native-fs`
- `app/services/ai/llmService.ts` — llama.rn wrapper
- `app/hooks/useLlamaChat.ts` — React hook for chat state
- `app/screens/chat/ChatScreen.tsx` — chat UI

**Memory constraints:**
- `n_ctx: 1024` (context window)
- `n_batch: 256` (batch size)
- `n_gpu_layers: 0` (CPU-only)
- Model loaded lazily (not at app startup) to avoid OOM

## Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Run `supabase/schema.sql` in the SQL editor to create all tables
3. Run the additional migrations from `AGENTS.md` (profiles email column, dogs gender column, routes table)
4. Copy your project URL and anon key into `.env`

**Tables:** `profiles`, `dogs`, `health_metrics`, `alerts`, `locations`, `geofences`, `routes`

## Build Notes

### Windows MAX_PATH

Windows limits paths to 260 characters. Gradle breaks at this depth. If building on Windows, use a short build path:

```
Canonical (edit here):  C:\Users\User\Desktop\Santo\DogVita\dog-health-app
Build copy (build here): C:\R\dog-health-app
```

Sync with `robocopy /MIR` or `Copy-Item` before building.

### JAVA_HOME

Must point to Android Studio's bundled JDK — a system JDK breaks the Gradle build:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```

### react-native-svg

Pinned to 15.11.2 for RN 0.76 compatibility. Version 15.15.5 uses `StyleSizeLength` which doesn't exist in RN 0.76's Yoga.

### Hermes Polyfills

`index.js` polyfills `URL`, `URLSearchParams` for Hermes. Supabase-js crashes without them. Do not remove.

## Available Scripts

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint
npm start            # Start Metro bundler
npm run android      # Build and run on Android
npm test             # Jest (no test files yet)
```

## License

MIT
