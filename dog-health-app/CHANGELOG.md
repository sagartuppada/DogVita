# Changelog

All notable changes to DogVita are documented here.

---

## [1.2.0] - 2025-07-10

### Summary
Stabilized the on-device LLM pipeline — fixed OOM crashes, download failures, and React hooks violations. The app now reliably downloads and runs Qwen2.5-0.5B on physical Android devices.

---

### Problems Faced & Solved

#### 1. "Download interrupted" — HuggingFace CDN redirect failure
**Symptom:** Model download via `react-native-blob-util` failed immediately with `Download interrupted.` error.

**Root cause:** HuggingFace URLs redirect to a CDN. `react-native-blob-util`'s native fetch doesn't follow HTTP 302 redirects properly — it sees the redirect, treats it as an interruption, and aborts.

**Fix:** Rewrote the entire download pipeline from `react-native-blob-util` to `react-native-fs` (`RNFS.downloadFile()`). RNFS uses OkHttp under the hood, which handles redirects natively. Added a pre-resolve step using `fetch(MODEL_URL, {method:'HEAD'})` to get the final CDN URL before downloading.

**File:** `app/services/ai/modelManager.ts` (complete rewrite)

---

#### 2. OOM crash — SmolLM3 2GB model exceeds device RAM
**Symptom:** App crashed with `java.lang.OutOfMemoryError: Failed to allocate a 8208 byte allocation with 712624 free bytes and 695KB until OOM, target footprint 536870912, growth limit 536870912` on `OkHttp TaskRunner` thread. Three consecutive OOM crashes at 11:44, 11:56, and 12:03.

**Root cause:** SmolLM3 Q4_K_M GGUF is ~2GB. Device (TetrisIND/A015) has ~5.5GB total RAM but only ~1.8GB available to the app. Java heap capped at 512MB. Loading a 2GB model + download buffers exceeds both Java heap and available RAM.

**Fix (two-pronged):**
1. **Removed eager model loading from `App.tsx`** — deleted `useLLMLifecycle()` hook and background `isModelDownloaded()`/`extractBundledModel()` calls. Model now loads lazily only when user opens Chat screen.
2. **Switched model from SmolLM3 3B (~2GB) to Qwen2.5-0.5B-Instruct (~300MB)** — fits comfortably in available RAM. Reduced `n_ctx` from 2048→1024, `n_batch` from 512→256.

**Files:** `app/App.tsx`, `app/services/ai/llmService.ts`, `app/services/ai/modelManager.ts`

---

#### 3. "Rendered more hooks than during the previous render" crash
**Symptom:** After fixing the OOM crash, app crashed immediately on Chat screen with React hooks error.

**Root cause:** `scrollToBottom` (a `useCallback` hook) was defined **after** the early return `if (!ready) { return <Loading/> }`. When `ready` was `false`, React saw 3 hooks. When `ready` became `true`, React saw 4 hooks. Different hook counts between renders = crash.

**Fix:** Moved `scrollToBottom` `useCallback` to **before** the early return, so the hook count is always the same regardless of `ready` state.

**File:** `app/screens/chat/ChatScreen.tsx`

---

#### 4. Model download stuck at 0% — no progress reporting
**Symptom:** Download appeared to work but progress never updated, making the UI feel broken.

**Root cause:** `react-native-blob-util`'s progress callback wasn't firing reliably with HuggingFace's chunked transfer encoding.

**Fix:** `RNFS.downloadFile()` provides a native `progress` callback with `bytesWritten` and `contentLength`. Added percentage logging every 10% and `progressDivider: 10` to reduce callback frequency.

**File:** `app/services/ai/modelManager.ts`

---

#### 5. Eager model extraction caused ANR (Application Not Responding)
**Symptom:** App froze for 5-10 seconds on startup while extracting bundled GGUF from APK assets.

**Root cause:** `App.tsx` called `extractBundledModel()` on mount, which copies a 300MB+ file from APK assets to document directory synchronously on the main thread.

**Fix:** Removed the extraction call entirely. Model is now downloaded on-demand when Chat screen opens, and only if not already present.

**File:** `app/App.tsx`

---

#### 6. useLLMLifecycle hook caused side effects on every render
**Symptom:** Memory spikes and unexpected model state changes during navigation.

**Root cause:** `useLLMLifecycle()` hook ran model lifecycle checks on every render, including background model availability polling.

**Fix:** Deleted `app/hooks/useLLMLifecycle.ts` entirely. Model lifecycle is now managed by `ChatScreen` component's mount/unmount cycle.

**Files:** `app/hooks/useLLMLifecycle.ts` (deleted), `app/App.tsx`

---

#### 7. react-native-blob-util dependency removed
**Symptom:** Bundle size includes unused native module; potential native crash surface.

**Root cause:** After switching to `react-native-fs`, `react-native-blob-util` was no longer needed anywhere in the codebase.

**Fix:** Added `react-native-fs` to `package.json`. Removed all `react-native-blob-util` imports and lazy-load wrappers. (Note: `react-native-blob-util` may still be in `package.json` — can be removed in a future cleanup.)

**File:** `package.json`

---

### Files Changed

| File | Change |
|------|--------|
| `app/App.tsx` | Removed eager model loading, `useLLMLifecycle`, bundled model extraction |
| `app/services/ai/modelManager.ts` | **Complete rewrite** — `react-native-blob-util` → `react-native-fs`; single model (Qwen2.5-0.5B); retry logic with exponential backoff |
| `app/services/ai/llmService.ts` | **Complete rewrite** — direct `initLlama()` call; `n_ctx:1024`, `n_batch:256`; 120s timeout; streaming chat with abort support |
| `app/screens/chat/ChatScreen.tsx` | **New file** — full chat UI: download progress, loading spinner, message bubbles, streaming responses, cancel button |
| `app/hooks/useLlamaChat.ts` | **New file** — React hook wrapping LLM service: messages state, send/cancel, streaming token assembly |
| `app/hooks/useLLMLifecycle.ts` | **Deleted** — replaced by ChatScreen mount lifecycle |
| `app/screens/chatbot/ChatbotScreen.tsx` | **Deleted** — replaced by new ChatScreen |
| `app/screens/chatbot/ChatHistoryScreen.tsx` | **Deleted** — replaced by new ChatScreen |
| `app/services/ai/index.ts` | **Deleted** — old AI service barrel export |
| `app/services/ai/voiceService.ts` | **Deleted** — unused voice service |
| `app/store/chatStore.ts` | **Deleted** — replaced by useLlamaChat hook |
| `app/navigation/MainTabNavigator.tsx` | Updated to use new ChatScreen |
| `app/navigation/RootNavigator.tsx` | Updated navigation routes |
| `app/navigation/types.ts` | Updated type definitions |
| `app/screens/ai/AIOverviewScreen.tsx` | Simplified AI hub |
| `app/services/auth/service.ts` | Minor auth flow updates |
| `app/store/dogStore.ts` | Minor store updates |
| `app/store/index.ts` | Updated store exports |
| `app/types/health.ts` | Type updates |
| `package.json` | Added `react-native-fs` dependency |
| `AGENTS.md` | Updated documentation |

---

### Technical Details

- **Model:** Qwen2.5-0.5B-Instruct-Q4_K_M (~300MB)
- **Download library:** `react-native-fs` v2.20.0 (`RNFS.downloadFile()`)
- **Inference engine:** `llama.rn` v0.12.5 (`initLlama()`)
- **Context window:** 1024 tokens (reduced from 2048 for memory)
- **Batch size:** 256 (reduced from 512 for memory)
- **GPU layers:** 0 (CPU-only inference)
- **Load timeout:** 120 seconds
- **Max download retries:** 3 (exponential backoff: 2s, 4s, 6s)
- **Min model size check:** 200MB (catches corrupted/partial downloads)

---

## [1.1.0] - 2025-07-09

### Summary
Full UI overhaul: bottom tab bar redesign, AI chatbot integration, dog profile screens, vaccination records, weight tracking, symptom checker, and diet calculator.

### Changes
- Redesigned bottom tab bar (4 tabs, 700px wide floating pill)
- Replaced Alerts tab with AI Chatbot tab
- Added DogProfile, WeightHistory, VaccinationRecords screens
- Added SymptomChecker and DietFeeding AI screens
- Created AI Health Assistant service (offline rule-based)
- Created Chat store with Zustand persistence
- Wired Dashboard, HealthOverview, AlertsList to Supabase
- Settings moved from bottom tab to root stack
- Added user account icon replacing offline badge

---

## [1.0.0] - 2025-07-08

### Summary
Initial release with full Supabase backend integration, GPS tracking, maps, and geofence management.

### Changes
- Full Supabase auth (email + password)
- GPS route tracking with start/stop recording
- Google Maps integration with markers, polylines, geofences
- Route history and detail screens
- Geofence manager with CRUD
- Onboarding flow (no skip)
- App icon (paw-logo)
- BLE health data scaffolding
- Push notifications
