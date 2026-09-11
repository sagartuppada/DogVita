# DogVita — Complete Project Log

**Last Updated:** 18 June 2026  
**Status:** Build successful, APK running on emulator + physical device, multi-account isolation working  
**Branch:** `master`

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Roadmap — Timeline](#roadmap--timeline)
4. [Bugs & Errors — Full Log](#bugs--errors--full-log)
5. [Architectural Decisions](#architectural-decisions)
6. [Current State](#current-state)
7. [Remaining Work](#remaining-work)

---

## Project Overview

DogVita is a standalone Android application for real-time dog health monitoring. It reads data from a BLE collar (heart rate, temperature, GPS, activity, battery), stores everything in a Supabase PostgreSQL database, and displays it through a polished React Native UI with charts, maps, and geofencing.

The app was built from scratch, iterated through multiple bugs and architectural issues, and now successfully builds a signed release APK.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.76.6 (bare, no Expo) |
| Language | TypeScript |
| State Management | Zustand (persisted to AsyncStorage) |
| Navigation | React Navigation 7 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email + password, phone+OTP) |
| Charts | react-native-gifted-charts |
| BLE | react-native-ble-plx |
| Maps | react-native-maps (Google Maps) + OpenStreetMap (WebView) |
| Build | Gradle (assembleRelease) |
| Target | Android x86_64 (emulator) + ARM64 (physical) |

---

## Roadmap — Timeline

### Phase 1: Project Setup & BLE Integration
- Initialized React Native bare project
- Set up Supabase client with `.env` configuration
- Built BLE scanner/connection for dog collar
- Created health data service layer

### Phase 2: UI Development
- Dashboard screen with heart rate, temperature, activity
- Health overview with detailed charts
- Tracking screen with map view
- Alerts list with filtering
- Settings screen
- Bottom tab navigation (4 tabs)

### Phase 3: Supabase Backend Integration
- Created full database schema with RLS policies
- Wired Zustand stores to Supabase services
- Added `fetchDogs()`, `fetchAlerts()`, health data queries
- Profile trigger for auto-creating user profiles on signup

### Phase 4: Authentication Flow
- Initial implementation: phone + OTP via Twilio
- Discovered Twilio trial limits (can't send SMS to unverified numbers)
- Pivoted to email + password authentication
- Created SignUp, Login, OTP verification screens

### Phase 5: Onboarding Enforcement
- Removed skip buttons from WelcomeScreen and SetupDogProfile
- Added OnboardingGuard in RootNavigator
- Verified RLS + auto-create profile trigger in schema
- Added dog profile save to Supabase via SetupDogProfileScreen

### Phase 6: Bug Fixes & Hardening
- Fixed Hermes URL polyfill crash
- Fixed `@env` babel plugin not working in release builds
- Fixed Supabase client initialization failure
- Fixed dog creation silently failing (missing `gender` column)
- Fixed stale data persisting across account switches
- Fixed onboarding navigation hijack during signup

### Phase 7: UI Polish
- Redesigned bottom tab bar (floating pill, 700px wide)
- Removed offline badge from Dashboard header
- Added pull-to-refresh on all main screens
- Added user account icon in Dashboard header
- Updated app icon with paw logo

---

## Bugs & Errors — Full Log

### Bug #1: Expo Modules Blocking Android Builds

**Symptom:** Multiple `ExpoModulesCore` errors during Gradle build:
```
Unresolved reference 'ExpoModulesCorePackage'
Cannot find symbol ExpoModulesPackage
```

**Root Cause:** Expo packages (`expo-crypto`, `expo-contacts`, `expo-image-picker`) installed without Expo CLI initialization.

**Fix:** Full Expo audit and removal:
```bash
npm uninstall expo-contacts expo-crypto expo-image-picker expo-modules-core expo-secure-store expo-file-system
npx expo install --fix
npx @react-native-community/cli doctor
```

**Lesson:** Never install Expo packages in a bare React Native project without proper Expo setup.

---

### Bug #2: Duplicate Native Modules in Build

**Symptom:** Multiple errors like:
```
Duplicate class com.facebook.react.modules.*
Duplicate class com.facebook.react.turbomodule.*
```

**Root Cause:** Multiple versions of the same React Native packages installed, creating duplicate classes in the build.

**Fix:** Clean build after Expo removal:
```bash
cd android && .\gradlew clean
cd .. && rm -rf node_modules && npm install
```

**Lesson:** Always clean build artifacts after removing packages. Run `gradlew clean` and delete `node_modules`.

---

### Bug #3: `expo-crypto` Import in Supabase Client

**Symptom:** Build failure with:
```
Unresolved reference: ExpoCrypto
Cannot access class 'expo.modules.ExpoCrypto'
```

**Root Cause:** `app/services/api/supabase.ts` imported `expo-crypto` for random bytes generation.

**Fix:** Replace with `react-native-get-random-values`:
```typescript
// Before
import * as ExpoCrypto from 'expo-crypto';
const randomBytes = (size: number) => {
  const bytes = ExpoCrypto.getRandomBytes(size);
  return bytes;
};

// After
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
```

**Lesson:** Check all imports for Expo dependencies, even in utility functions.

---

### Bug #4: `useRef` Generic Type Error

**Symptom:** TypeScript error:
```
Severity: Error
Message: Generic type 'useRef<T>' requires 1 type argument(s)
```

**Root Cause:** `useRef()` called without type argument in `src/screens/HealthDetailScreen.tsx`.

**Fix:** Add explicit type: `useRef(null)` → `useRef<ScrollView>(null)`

**Lesson:** TypeScript strict mode requires explicit generic types for `useRef`.

---

### Bug #5: Missing React Native BLE Plx Link

**Symptom:** Runtime error:
```
react-native-ble-plx is not linked
```

**Root Cause:** `react-native-ble-plx` needs native linking, which wasn't done after `npm install`.

**Fix:** Manually linked the library:
```bash
cd android && ./gradlew clean
npm install react-native-ble-plx
cd android && ./gradlew app:installDebug
```

**Lesson:** React Native 0.76+ with autolinking should auto-link BLE packages, but sometimes manual linking is needed.

---

### Bug #6: `@env` Module Not Found

**Symptom:** Build error:
```
Cannot find module '@env'
```

**Root Cause:** `babel.config.js` not configured for `react-native-dotenv`, or `.env` file missing.

**Fix:** Created `babel.config.js`:
```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', { moduleName: '@env', path: '.env' }],
  ],
};
```

And created `@env.d.ts` for TypeScript:
```typescript
declare module '@env' {
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
}
```

**Lesson:** Always create type declarations for custom module imports.

---

### Bug #7: Expo URL Module Crash (Hermes)

**Symptom:** Runtime crash in Hermes engine:
```
URL.hostname is not implemented
URL.host is not implemented
URL.origin is not implemented
```

**Root Cause:** `@supabase/supabase-js` v2.106.2+ uses native `URL` API, which Hermes doesn't implement fully.

**Fix:** Added inline URL polyfill in `index.js`:
```javascript
// URL.hostname, URL.host, URL.origin polyfill for Hermes
Object.defineProperty(URL.prototype, 'hostname', {
  get() {
    try { return new globalThis._URL(this.href).hostname; }
    catch { return ''; }
  },
});
Object.defineProperty(URL.prototype, 'host', {
  get() {
    try { return new globalThis._URL(this.href).host; }
    catch { return ''; }
  },
});
Object.defineProperty(URL.prototype, 'origin', {
  get() {
    try { return new globalThis._URL(this.href).origin; }
    catch { return ''; }
  },
});
```

**Lesson:** Hermes engine has incomplete JavaScript API implementations. Always check for polyfills when using web libraries.

---

### Bug #8: `react-native-url-polyfill` Crash

**Symptom:** Build error:
```
error: Error: Unable to resolve module react-native-url-polyfill/auto
```

**Root Cause:** `react-native-url-polyfill` package not installed.

**Fix:** Removed dependency, used inline polyfill in `index.js` instead (see Bug #7).

**Lesson:** Avoid adding new polyfill dependencies when inline solutions work.

---

### Bug #9: `supabase-js` v2.106.2 Incompatible with Hermes

**Symptom:** Multiple runtime errors:
```
Property hostname is not implemented
Property host is not implemented
Property origin is not implemented
URL.protocol is not implemented
URL.pathname is not implemented
URL.search is not implemented
URL.hash is not implemented
```

**Root Cause:** `@supabase/supabase-js` v2.106.2+ uses `URL.hostname` and other properties that Hermes doesn't implement.

**Fix:** Pinned Supabase to 2.49.1:
```bash
npm install @supabase/supabase-js@2.49.1
```

**Lesson:** Always pin dependencies when working with Hermes engine. Check compatibility matrices.

---

### Bug #10: `@env` Variables Empty in Release Builds

**Symptom:** Supabase client creation failed silently. `isSupabaseConfigured()` returned `false`. App fell back to offline mode.

**Root Cause:** `@env` babel plugin doesn't inline environment variables in release builds (only works in dev server).

**Fix:** Added hardcoded fallback values in `supabase.ts`:
```typescript
let supabaseUrl = process.env.SUPABASE_URL || '';
let supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Fallback for release builds where @env doesn't work
if (!supabaseUrl) {
  supabaseUrl = 'https://bxvihftrfamglqrilkok.supabase.co';
}
if (!supabaseAnonKey) {
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIs...';
}
```

**Lesson:** React Native release builds don't support `process.env` or `@env` inline. Always provide hardcoded fallbacks.

---

### Bug #11: `expo-crypto` Package Still Installed

**Symptom:** Build error:
```
Cannot access class 'expo.modules.ExpoCrypto'
```

**Root Cause:** `expo-crypto` package still in `node_modules` despite uninstall.

**Fix:** Manually deleted:
```bash
rm -rf node_modules/expo-crypto
```

**Lesson:** `npm uninstall` doesn't always clean up completely. Check `node_modules` manually.

---

### Bug #12: `react-native-get-random-values` Import Order

**Symptom:** Cryptographic random bytes generation failed.

**Root Cause:** `import 'react-native-get-random-values'` must come BEFORE any other imports.

**Fix:** Moved import to top of `supabase.ts`:
```typescript
import 'react-native-get-random-values';
// ... other imports
```

**Lesson:** Polyfill imports must always come first in the file.

---

### Bug #13: Onboarding Skip Button Still Present

**Symptom:** Users could skip onboarding and access main app without creating dog profile.

**Root Cause:** `WelcomeScreen.tsx` had "Skip for Now" button.

**Fix:** Removed skip button and all demo data loading:
```typescript
// Before
const handleSkip = async () => {
  await loadDemoData();
  settingsStore.setOnboardingComplete();
  navigation.replace('PairDevice');
};

// After — no skip button at all
```

**Lesson:** Always audit all screens for skip/bypass buttons when building a product.

---

### Bug #14: OnboardingGuard Checking Session State

**Symptom:** User signed up → redirected to SetupDog → screen jumped to Dashboard without completing profile.

**Root Cause:** `RootNavigator.tsx` had:
```typescript
const showOnboarding = !hasCompletedOnboarding && !hasSession;
```

During signup, `onAuthStateChange` fired → set `hasSession = true` → `showOnboarding` became `false` → OnboardingNavigator unmounted before SetupDog screen was reached.

**Fix:** Removed session check:
```typescript
// Before
const showOnboarding = !hasCompletedOnboarding && !hasSession;

// After
const showOnboarding = !hasCompletedOnboarding;
```

**Lesson:** Onboarding state should depend ONLY on completion flag, not auth session. Auth and onboarding are orthogonal concerns.

---

### Bug #15: Dog Creation Failing Silently

**Symptom:** Dog created in local store but not saved to Supabase. "Your Dogs (0)" always showing.

**Root Cause:** `dogs.ts:62` inserted `gender` field into `dogs` table, but the schema had no `gender` column. Supabase rejected the insert with error. `createDog()` caught the error and returned `null` silently.

**Fix:** Two changes:
1. Added `gender text` column to `dogs` table in `schema.sql`
2. Made `dogs.ts createDog()` throw errors instead of returning null:
```typescript
// Before — silent failure
} catch (error) {
  console.error('Error creating dog:', error);
  return null;
}

// After — throw to surface error
} catch (error) {
  console.error('Error creating dog:', error);
  throw error;
}
```

**Lesson:** Never swallow database errors silently. Always surface them to the caller. Schema changes in SQL must be run manually in Supabase Dashboard.

---

### Bug #16: Stale Data Across Account Switches

**Symptom:** User signs up with Account A → creates dog → signs out → signs up with Account B → still sees Account A's dog.

**Root Cause:** Zustand stores were persisted to `AsyncStorage` under fixed keys (`dog-storage`, `health-storage`, etc.). When user signed out, stores were still in AsyncStorage. New account hydrated old data on app start.

**Fix:** Added `AsyncStorage.multiRemove()` in `auth/service.ts signOut()`:
```typescript
const STORE_KEYS = [
  'dog-storage',
  'health-storage',
  'alert-storage',
  'tracking-storage',
  'ble-storage',
  'settings-storage',
];

async signOut(): Promise<void> {
  await supabase.auth.signOut();
  await AsyncStorage.multiRemove(STORE_KEYS);
}
```

**Lesson:** Always clear persisted store state on sign out. This is a common multi-tenant security issue.

---

### Bug #17: Dashboard Not Fetching from Supabase

**Symptom:** Dashboard showed dashes (`--`) for all metrics, even with data in Supabase.

**Root Cause:** Dashboard was hardcoded to show local demo data, not calling Supabase services.

**Fix:** Added `useEffect` to call store fetch methods on mount:
```typescript
useEffect(() => {
  const fetchAllData = async () => {
    if (!activeDogId) return;
    await Promise.all([
      dogStore.fetchDogs(),
      healthStore.fetchHeartRateHistory(activeDogId),
      healthStore.fetchTemperatureHistory(activeDogId),
      healthStore.fetchActivityHistory(activeDogId),
      healthStore.fetchLatestMetrics(activeDogId),
      alertStore.fetchAlerts(activeDogId),
    ]);
  };
  fetchAllData();
}, [activeDogId]);
```

**Lesson:** UI screens should always fetch from Supabase on mount, not rely on local state.

---

### Bug #18: Pull-to-Refresh Not Working

**Symptom:** Pulling down on Dashboard/Health/Alerts screens showed spinner but data didn't refresh.

**Root Cause:** `RefreshControl` `onRefresh` was calling a fake timeout function, not actual Supabase queries.

**Fix:** Wired `onRefresh` to actual store fetch methods, added `RefreshControl` to ScrollView/FlatList components.

**Lesson:** Always verify pull-to-refresh calls real data sources.

---

### Bug #19: App Icon Not Updating on Device

**Symptom:** App still showed default React Native icon after replacing PNG files.

**Root Cause:** App icon files were in wrong directory structure or wrong format (`.webp` instead of `.png`).

**Fix:** Created proper directory structure with `.png` files at all densities:
```
android/app/src/main/res/mipmap-mdpi/ic_launcher.png
android/app/src/main/res/mipmap-hdpi/ic_launcher.png
android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
```

**Lesson:** Android requires exact directory structure and file format for app icons. Use `.png`, not `.webp`.

---

### Bug #20: Google Maps Not Loading

**Symptom:** Map screen showed blank/gray area, no tiles loading.

**Root Cause:** `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` was empty or placeholder.

**Fix:** Added placeholder API key to `.env` and `AndroidManifest.xml`:
```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_API_KEY"/>
```

Also created `OfflineMapView` as fallback for emulator without internet.

**Lesson:** Always provide fallback UI for features requiring network access.

---

### Bug #21: Emulator Has No Internet

**Symptom:** `ping 8.8.8.8` returned 100% packet loss. Supabase client creation failed.

**Root Cause:** Emulator network configuration issue (common with Android Studio on Windows).

**Fix:** Used `OfflineMapView` for tracking screen. For real DB queries, must use physical device with internet.

**Lesson:** Always test with both emulator (for UI) and physical device (for network/BLE).

---

### Bug #22: Build Path Too Long (MAX_PATH)

**Symptom:** Gradle build failed with:
```
The source path is too long
Source path length must be less than 260 characters
```

**Root Cause:** Windows MAX_PATH limit (260 characters). Canonical path `C:\Users\User\Desktop\Santo\DogVita\dog-health-app\android\app\build\...` exceeds limit.

**Fix:** Build from shortened path `C:\R\dog-health-app`. Created sync workflow:
```powershell
robocopy "C:\Users\User\Desktop\Santo\DogVita\dog-health-app" "C:\R\dog-health-app" /MIR /XD "node_modules" ".git" "android" "ios"
```

**Lesson:** Windows paths are limited to 260 characters. Use short paths for Android builds.

---

### Bug #23: `robocopy` Not Working for Individual Files

**Symptom:** Attempted to sync individual files using `robocopy`, but PowerShell didn't execute correctly.

**Root Cause:** `robocopy` doesn't support individual file copying with the same syntax as directory mirroring.

**Fix:** Used `Copy-Item` for individual file sync:
```powershell
Copy-Item "source\file.tsx" "C:\R\dog-health-app\app\path\file.tsx" -Force
```

**Lesson:** Use `robocopy /MIR` for full directory sync, `Copy-Item` for individual files.

---

### Bug #24: `console.log` Stripped in Release Builds

**Symptom:** Debug statements using `console.log` didn't appear in release APK logs.

**Root Cause:** React Native release builds strip `console.log` statements for performance.

**Fix:** Used `Alert.alert()` for debug output in release builds:
```typescript
// Before
console.log('Debug:', data);

// After
Alert.alert('Debug', JSON.stringify(data, null, 2));
```

**Lesson:** Always use `Alert.alert()` for debug output in release builds.

---

### Bug #25: `console.error` Stripped in Release Builds

**Symptom:** Error logging statements didn't appear in release APK logs.

**Root Cause:** Same as Bug #24 — release builds strip all console methods.

**Fix:** Used `Alert.alert()` for error output in critical error handlers.

**Lesson:** Error handling in release builds must use `Alert.alert()`, not `console.error`.

---

### Bug #26: `react-native-webview` Not Installed

**Symptom:** OpenStreetMapView component failed to import `react-native-webview`.

**Root Cause:** Package not installed.

**Fix:**
```bash
npm install react-native-webview
cd android && ./gradlew clean
```

**Lesson:** Always install required packages before building.

---

### Bug #27: `react-native-maps` Not Linked

**Symptom:** Map component failed at runtime with linking error.

**Root Cause:** `react-native-maps` not properly linked in Android project.

**Fix:** Manual linking in `android/app/src/main/java/com/doghealth/MainApplication.java`:
```java
import com.airbnb.android.react.maps.MapsPackage;
// ...
packages.add(new MapsPackage());
```

**Lesson:** Some packages require manual linking even with autolinking enabled.

---

### Bug #28: Android Manifest Permissions Missing

**Symptom:** BLE, location, and camera features failed at runtime.

**Root Cause:** Required permissions not declared in `AndroidManifest.xml`.

**Fix:** Added all required permissions:
```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
```

**Lesson:** Always declare all required permissions in `AndroidManifest.xml` before runtime.

---

### Bug #29: TypeScript Errors in Service Layer

**Symptom:** Multiple TypeScript errors in `dogs.ts`, `alerts.ts`, `health.ts`, `tracking.ts`.

**Root Cause:** Type mismatches between service methods and database schema.

**Fix:** Updated type definitions in `app/types/health.ts` and `app/types/dog.ts` to match actual database schema.

**Lesson:** Keep TypeScript types synchronized with database schema.

---

### Bug #30: `ExpoModulesPackage` Still Referenced

**Symptom:** Build error:
```
Cannot access class 'expo.modules.ExpoModulesPackage'
```

**Root Cause:** Expo packages still referenced in `MainApplication.java`.

**Fix:** Removed all Expo package references from `MainApplication.java` and `settings.gradle`.

**Lesson:** Expo removal requires updating multiple files, not just `package.json`.

---

### Bug #31: Duplicate Class Errors After Expo Removal

**Symptom:** Multiple duplicate class errors in build output.

**Root Cause:** Multiple versions of React Native packages installed.

**Fix:** Clean build after removing Expo:
```bash
cd android && ./gradlew clean
cd .. && rm -rf node_modules && npm install
```

**Lesson:** Always clean build artifacts after removing packages.

---

### Bug #32: `react-native-reanimated` Version Mismatch

**Symptom:** Build error:
```
Duplicate class com.facebook.react.modules.*
```

**Root Cause:** Multiple versions of `react-native-reanimated` installed.

**Fix:** Pinned to specific version:
```bash
npm install react-native-reanimated@3.16.5
```

**Lesson:** Always pin dependency versions to avoid conflicts.

---

### Bug #33: Missing `@react-native-community/cli` Doctor

**Symptom:** Build configuration issues not detected.

**Root Cause:** Didn't run React Native CLI doctor after setup.

**Fix:** Run diagnostics:
```bash
npx @react-native-community/cli doctor
```

**Lesson:** Always run CLI doctor after project setup to detect configuration issues.

---

### Bug #34: `react-native-gifted-charts` Not Linked

**Symptom:** Chart components failed at runtime.

**Root Cause:** `react-native-gifted-charts` requires `react-native-linear-gradient` which wasn't installed.

**Fix:**
```bash
npm install react-native-linear-gradient
```

**Lesson:** Always check peer dependencies for UI libraries.

---

### Bug #35: `AsyncStorage` Not Cleared on Sign Out

**Symptom:** New account saw old account's data.

**Root Cause:** Zustand stores persisted to `AsyncStorage` were not cleared on sign out.

**Fix:** Added `AsyncStorage.multiRemove()` in `auth/service.ts signOut()` (see Bug #16).

**Lesson:** Always clear all persisted state on sign out for multi-tenant apps.

---

### Bug #36: Country Code Defaulting to +1 (US)

**Symptom:** Phone number input showed `+1` instead of `+91` (India).

**Root Cause:** `AddPhoneNumberScreen.tsx` had hardcoded default country code `+1`.

**Fix:** Changed default to `+91`:
```typescript
const [countryCode, setCountryCode] = useState('+91');
```

**Lesson:** Always set correct default country code for target audience.

---

### Bug #37: OTP Verification Not Calling Supabase

**Symptom:** OTP verification screen showed fake success message.

**Root Cause:** `OTPVerificationScreen.tsx` used `setTimeout` to fake verification, didn't call `authService.verifyOTP()`.

**Fix:** Wired to actual Supabase verification:
```typescript
const handleVerify = async () => {
  const result = await authService.verifyOTP(phone, otp);
  if (result) {
    navigation.navigate('SetupDog');
  }
};
```

**Lesson:** Always wire UI to actual backend services, not fake implementations.

---

### Bug #38: Add Phone Screen Not Calling Supabase

**Symptom:** Phone input screen showed fake success message.

**Root Cause:** `AddPhoneNumberScreen.tsx` used `setTimeout` to fake OTP sending, didn't call `authService.sendOTP()`.

**Fix:** Wired to actual Supabase OTP sending:
```typescript
const handleSendOTP = async () => {
  const success = await authService.sendOTP(phone);
  if (success) {
    navigation.navigate('OTP', { phone });
  }
};
```

**Lesson:** Always verify UI screens call actual backend services.

---

### Bug #39: `healthStore` Not Fetching from Supabase

**Symptom:** Health screens showed dashes even with data in Supabase.

**Root Cause:** `healthStore.ts` didn't have `fetchActivityHistory()` or `fetchLatestMetrics()` methods.

**Fix:** Added missing methods:
```typescript
fetchActivityHistory: async (dogId: string) => {
  const history = await healthService.getActivityHistory(dogId);
  set({ activityHistory: history });
},
fetchLatestMetrics: async (dogId: string) => {
  const metrics = await healthService.getLatestMetrics(dogId);
  set((state) => ({
    currentMetrics: { ...state.currentMetrics, [dogId]: metrics },
  }));
},
```

**Lesson:** Always implement all required store methods for Supabase integration.

---

### Bug #40: `DashboardScreen` Not Showing Dog Count

**Symptom:** Dashboard showed "Your Dogs (0)" even with dogs in Supabase.

**Root Cause:** `DashboardScreen.tsx` didn't call `dogStore.fetchDogs()` on mount.

**Fix:** Added `useEffect` to fetch dogs:
```typescript
useEffect(() => {
  dogStore.fetchDogs();
}, []);
```

**Lesson:** Always fetch data on screen mount, not just on initial app load.

---

### Bug #41: New Account Shows Previous Account's Dogs (Stale In-Memory State)

**Symptom:** After signing out and creating a new account, the app showed the previous account's dogs instead of redirecting to the SetupDog profile screen.

**Root Cause:** `signOut()` cleared AsyncStorage but didn't reset Zustand store state in memory. Zustand's `persist` middleware reads from AsyncStorage on app start, but once hydrated, the in-memory state persists across `AsyncStorage.multiRemove()`. When a new account was created:
1. `hasCompletedOnboarding` was still `true` in Zustand memory (from previous account)
2. `dogs` array still had previous account's dogs in memory
3. `onAuthStateChange` fired, RootNavigator re-rendered, but Zustand had `hasCompletedOnboarding = true` → showed Main screen instead of Onboarding

**Fix:** Added Zustand store state resets to `auth/service.ts signOut()`:
```typescript
// Reset Zustand stores to initial state in memory
const { useSettingsStore } = require('../../store/settingsStore');
const { useDogStore } = require('../../store/dogStore');
const { useAlertStore } = require('../../store/alertStore');
const { useTrackingStore } = require('../../store/trackingStore');
const { useHealthStore } = require('../../store/healthStore');

useSettingsStore.setState({ hasCompletedOnboarding: false, isFirstLaunch: true });
useDogStore.setState({ dogs: [], activeDogId: null });
useAlertStore.setState({ alerts: [] });
useHealthStore.setState({ heartRateHistory: [], temperatureHistory: [], activityHistory: [], currentMetrics: {} });
useTrackingStore.setState({ locations: [], geofences: [] });
```

**Lesson:** `AsyncStorage.multiRemove()` only clears persistent storage. Zustand `persist` middleware hydrates from storage on app start, but once hydrated, in-memory state persists. Always reset Zustand state in memory when signing out.

---

### Bug #42: PairDeviceScreen Still Had "Skip for Now" Button

**Symptom:** PairDevice screen showed "Skip for Now" button, allowing users to bypass device pairing.

**Root Cause:** The "Skip for Now" button was intended to stay (BLE pairing is optional), but per user requirement, all skip/bypass paths should be removed from onboarding.

**Fix:** Removed the "Skip for Now" button and its `skipBtn` style from `PairDeviceScreen.tsx`.

**Lesson:** Always verify all onboarding screens for skip/bypass buttons when enforcing mandatory onboarding.

---

### Bug #43: SettingsScreen "Log Out" Didn't Sign Out from Supabase

**Symptom:** After tapping "Log Out" in Settings and creating a new account, the app showed the previous account's dogs instead of the dog profile setup screen.

**Root Cause:** `SettingsScreen.tsx:66` `handleLogout()` called `useSettingsStore.getState().resetSettings()` — which only reset the settings store to initial state. It did NOT call `authService.signOut()`. So:
1. Supabase session stayed active (user never signed out)
2. AsyncStorage was NOT cleared
3. Other Zustand stores (dogStore, healthStore, etc.) were NOT cleared
4. `resetSettings()` set `hasCompletedOnboarding: false`, so the Onboarding screen appeared
5. But after signup, `onAuthStateChange` fired and `fetchDogs()` found old dogs still in the `dogs` array
6. `dogs.length > 0` → `setOnboardingComplete()` was called → Main screen shown with old dogs

**Fix:** Changed `handleLogout()` to call `authService.signOut()` (which handles everything: Supabase signout, AsyncStorage clear, Zustand state reset):
```typescript
onPress: async () => {
  await authService.signOut();
},
```

**Lesson:** Always call the full sign-out flow (Supabase + AsyncStorage + Zustand reset), not just a partial state reset. The `authService.signOut()` method handles all three.

---

### Bug #44: `fetchDogs()` Didn't Clear Old Dogs When New User Had None

**Symptom:** Even after properly signing out, creating a new account still showed old dogs.

**Root Cause:** `dogStore.ts fetchDogs()` had a conditional that only overwrote the `dogs` array when the Supabase query returned results:
```typescript
if (dogs.length > 0) {
  set({ dogs, isLoading: false });
  ...
  return;
}
```
When the new user had 0 dogs, `dogs.length === 0`, so the old dogs remained in the array.

**Fix:** Always set the `dogs` array, even when empty:
```typescript
set({
  dogs,
  isLoading: false,
  activeDogId: dogs.length > 0 ? (get().activeDogId || dogs[0].id) : null,
});
```

**Lesson:** Database queries that replace local state must always overwrite, even with empty results. Partial updates cause stale data to persist.

## Architectural Decisions

### 1. Zustand Over Redux
Chose Zustand for simpler API, less boilerplate, and built-in persistence. No need for Redux's complexity in this app.

### 2. Supabase Over Custom Backend
Supabase provides PostgreSQL, auth, real-time, and RLS out of the box. No need to build custom API server.

### 3. Email+Password Over Phone+OTP
Phone+OTP failed due to Twilio trial limits. Email+password is simpler, no third-party dependencies, works immediately with Supabase.

### 4. Onboarding Guard in RootNavigator
Centralized onboarding check prevents users from accessing main app without completing setup. Single source of truth.

### 5. Store→Service→Supabase Pattern
All data flows through Zustand stores → service layer → Supabase client. Stores fall back to local data when Supabase is unavailable.

### 6. Inline URL Polyfill Over Dependencies
Avoided adding `react-native-url-polyfill` dependency. Inline polyfill in `index.js` is simpler and more maintainable.

### 7. Hardcoded Fallback Values for Release Builds
`@env` babel plugin doesn't work in release builds. Hardcoded fallback values ensure app works in production.

### 8. Error Throwing Over Silent Failure
Service methods now throw errors instead of returning null. This surfaces database issues to the UI layer.

### 9. AsyncStorage Clear on Sign Out
Multi-tenant apps must clear all persisted state on sign out to prevent data leakage between accounts.

### 10. Offline Fallback for Maps
Emulator has no internet. `OfflineMapView` provides green grid + marker visualization without network.

---

## Current State

### ✅ Completed
- Android APK builds successfully (`assembleRelease`)
- APK installed on both emulator (`emulator-5554`) and physical device (`00116651G005894`)
- Bottom tab bar redesigned (4 tabs, floating pill, 700px wide)
- App icon updated with paw logo
- Expo fully removed
- TypeScript compiles clean
- Supabase backend integration complete
- Email+password authentication working
- Onboarding flow enforced (no skip buttons)
- Dog creation saving to Supabase
- Pull-to-refresh on all main screens
- Sign out fully works (Supabase + AsyncStorage + Zustand reset)
- Multi-account isolation — new accounts start fresh with no old data

### 🔧 In Progress
- (none)

### ⚠️ Known Issues
- Windows MAX_PATH blocks builds from canonical path — workaround: build from `C:\R\dog-health-app`
- Emulator has no internet — Supabase queries require physical device
- Twilio trial account — can't send SMS to unverified numbers (phone+OTP abandoned)
- Health metrics table empty — needs BLE collar data or manual inserts

---

## Remaining Work

### High Priority
1. **Populate `health_metrics` table** — Need BLE collar data or manual inserts so Dashboard shows real data
2. **Enable real-time subscriptions** — Supabase realtime for live health data updates
3. **Add dog switching** — Tap dog in "Your Dogs" list to switch active dog

### Medium Priority
4. **Health detail screens** — Wire HealthDetail and AlertDetail screens to fetch specific records from Supabase
5. **Geofence CRUD from UI** — Tracking store has fetch methods, but UI doesn't create/edit geofences yet
6. **User profile editing** — Settings screen to update profile info in Supabase

### Low Priority
7. **Push notifications** — Alert notifications for critical health events
8. **Offline data caching** — Cache recent data for offline viewing
9. **Multi-dog management** — Edit/delete dogs from Supabase
10. **Export health data** — CSV/PDF export of health history

---

## Lessons Learned

1. **Always pin dependencies** — Hermes engine has incomplete JS API implementations
2. **Check for Expo contamination** — Expo packages break bare React Native builds
3. **Test release builds early** — `@env` and other dev tools don't work in production
4. **Never swallow database errors** — Surface errors to UI layer
5. **Clear persisted state AND Zustand in-memory state on sign out** — AsyncStorage multiRemove only clears storage, not Zustand's in-memory state
6. **Use Alert.alert() in release builds** — console.log is stripped
7. **Sync individual files with Copy-Item** — robocopy doesn't work for single files
8. **Build from short paths** — Windows MAX_PATH blocks deep directory structures
9. **Always verify UI calls real services** — Check for setTimeout/fake implementations
10. **Onboarding depends ONLY on completion flag** — Not on auth session state
11. **Zustand persist doesn't clear memory on AsyncStorage.clear()** — Must call `store.setState(initialState)` explicitly
12. **Always call full sign-out flow** — `authService.signOut()` handles Supabase + AsyncStorage + Zustand; partial resets leave stale state

---

## Files Reference

### Core Configuration
- `C:\Users\User\Desktop\Santo\DogVita\dog-health-app\.env` — Supabase credentials
- `C:\Users\User\Desktop\Santo\DogVita\dog-health-app\babel.config.js` — Babel config with `@env` module
- `C:\Users\User\Desktop\Santo\DogVita\dog-health-app\@env.d.ts` — TypeScript declarations for `@env`
- `C:\Users\User\Desktop\Santo\DogVita\dog-health-app\index.js` — App entry with URL polyfill

### Services
- `app/services/api/supabase.ts` — Supabase client with hardcoded fallbacks
- `app/services/auth/service.ts` — Auth service (email+password, phone+OTP)
- `app/services/api/dogs.ts` — Dog CRUD (throws errors, no silent failure)
- `app/services/api/health.ts` — Health data queries
- `app/services/api/alerts.ts` — Alert queries
- `app/services/api/tracking.ts` — Tracking/geofence queries

### Stores
- `app/store/dogStore.ts` — Dog state (wired to Supabase)
- `app/store/healthStore.ts` — Health state (wired to Supabase)
- `app/store/alertStore.ts` — Alert state (wired to Supabase)
- `app/store/trackingStore.ts` — Tracking state (wired to Supabase)
- `app/store/settingsStore.ts` — Settings (has `setOnboardingComplete()`)

### Screens
- `app/screens/onboarding/WelcomeScreen.tsx` — No skip button
- `app/screens/onboarding/SignUpScreen.tsx` — Email signup
- `app/screens/onboarding/LoginScreen.tsx` — Email login
- `app/screens/onboarding/AddPhoneNumberScreen.tsx` — Wired to Supabase
- `app/screens/onboarding/OTPVerificationScreen.tsx` — Wired to Supabase
- `app/screens/onboarding/SetupDogProfileScreen.tsx` — Saves dog to Supabase
- `app/screens/onboarding/PairDeviceScreen.tsx` — Keeps skip (BLE pairing optional)
- `app/screens/dashboard/DashboardScreen.tsx` — Fetches from Supabase on mount
- `app/screens/health/HealthOverviewScreen.tsx` — Fetches from Supabase on mount
- `app/screens/alerts/AlertsListScreen.tsx` — Fetches from Supabase on mount

### Navigation
- `app/navigation/RootNavigator.tsx` — OnboardingGuard checks `hasCompletedOnboarding`
- `app/navigation/MainTabNavigator.tsx` — 4 tabs, 700px wide floating pill
- `app/navigation/types.ts` — Navigation type definitions

### Database
- `supabase/schema.sql` — Full DB schema with RLS policies

### Documentation
- `docs/superpowers/specs/2026-06-16-enforce-onboarding-auth-design.md` — Onboarding enforcement design
- `docs/PROJECT_LOG.md` — This file (complete project log)





UG 1: Fix alerts.ts owner_id = dogId bug + wire ownerId

BUG 2-4: Fix sign-out stale-data leaks

BUG 5: Stop tracking screen auto-loading demo data

BUG 6: Reset stale activeDogId after fetchDogs

ISSUE 7: Fix fetchGeofences owner_id/dog_id mismatch

ISSUE 9: Fix hydration race

ISSUE 10: Make updateDog/deleteDog not throw uncaught

ISSUE 11: clearHistory(dogId) filter by dogId

ISSUE 12-13: success=replace/error=keep pattern

ISSUE 14: Document baked-in Supabase key

ISSUE 15: Remove unused subscribeToTable dead code

ISSUE 16: Wire clearOldLocations into fetch path

ISSUE 17: Make demo data IDs unique

ISSUE 18: Harden fetch trailing-slash interceptor

ISSUE 19: Wire up geofence alert pipeline

ISSUE 20: Add eslint.config.js flat config

ISSUE 21: Remove verified-unused scaffolding

ISSUE 22: Don't persist BLE isConnected state

Final: typecheck + verify
---

**End of Project Log**
