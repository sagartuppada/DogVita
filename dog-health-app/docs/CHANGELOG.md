# DogVita Changelog

All notable changes to the DogVita project, timestamped.

---

## 2026-07-10

### 17:07 — `993c799` feat: enhance offline AI chat
Seven enhancements to the AI chat feature:
1. Dog profile injection into LLM system prompt (breed, age, weight, gender)
2. Suggested prompt chips on empty chat state (6 pre-defined questions)
3. Chat history persistence to AsyncStorage (last 20 messages)
4. Typing indicator during generation (pulsing dots)
5. Copy message on long press with "Copied!" feedback
6. Knowledge base integration (`knowledgeContext.ts` — 14 topics, 9 breeds)
7. Crash fix: removed `react-native-markdown-display` (markdown-it compat issue)

**Files:** `llmService.ts`, `useLlamaChat.ts`, `ChatScreen.tsx`, `knowledgeContext.ts` (new)
**Build:** arm64-v8a release APK, installed on device `00116651G005894`

### 14:48 — `3d17947` android: add gradle-wrapper.jar
Added Gradle wrapper JAR (42KB) for reproducible builds.

### 14:47 — `0435351` android: add launcher icons and splash screen assets
Added launcher icons (all densities) and splash screen PNGs.

### 14:47 — `d509ea7` android: add resource XML files
Added Android resource XML files (strings, styles, colors).

### 14:47 — `36a805e` android: add native Kotlin source files
Added Kotlin source files for Android native modules.

### 13:24 — `1f2f0a3` android: add essential build config files
Added Android build configuration (gradle.properties, build.gradle, etc.)

### 13:18 — `d526b95` docs: make project fully cloneable
Fixed README, added `.env.example`, cleaned unused dependencies.

### 13:09 — `8bc3cda` fix: stabilize on-device LLM pipeline
Fixed OOM crashes, download failures, and hooks stability issues.

---

## 2026-07-01

### 17:53 — `b6332e1` docs: update AGENTS.md for Gemma 4 E2B integration
Updated AGENTS.md with new model references.

### 17:50 — `5a932e5` feat: set Gemma 4 E2B as default LLM model
Set Gemma 4 E2B as the default model for on-device inference.

### 17:45 — `a00dbe2` feat: switch LLM service to messages API with Jinja templates
Migrated from raw prompt API to `llama.rn` messages API with Jinja chat templates.

### 17:42 — `f4a3f0f` feat: add Gemma 4 E2B to model catalog
Added Gemma 4 E2B model entry to the model catalog.

### 17:40 — `e6ea6b3` fix: revert accidental react-native-svg version change
Reverted unintended version bump.

### 17:35 — `900c474` chore: remove obsolete Old Architecture patch for llama.rn
Removed `scripts/patch-llama-rn.js` — New Architecture now required.

---

## 2026-06-30

### 13:01 — `0ba6b87` feat: add Supabase integration to CRM
Updated AI model manager and app entry for Supabase integration.

---

## 2026-06-29

### 17:49 — `7b753a6` docs: update README with AI features
Added AI features, CRM dashboard, and latest architecture to README.

### 17:45 — `ca93374` chore: update app screens, services, stores
Major cleanup: updated screens, services, stores, theme, removed unused files.

---

## 2026-06-25

### 16:13 — `167fe67` fix: PGRST125 trailing slash, Settings restructure
Fixed PostgREST trailing slash issue, restructured Settings screen, added Dog health features.

---

## 2026-06-19

### 11:23 — `e33f165` chore: remove Metro config, update docs
Removed Metro config, updated documentation, added project files.

### 11:19 — `1267152` docs: expand README with architecture details
Added detailed README sections on architecture, BLE protocol, state management.

### 11:18 — `84762b2` docs: add root README
Added top-level README for the repository.

---

## 2026-06-05

### 16:42 — `e4d938c` feat: complete app overhaul
Added demo data, dark theme, fixed navigation and BLE crashes.

---

## 2026-06-03

### 18:31 — `798d04b` docs: update AGENTS.md
Added Zustand selector rules, removed Expo references.

### 18:29 — `d4c5ce1` fix: resolve blank screen
Fixed Zustand selector infinite re-render loop.

### 16:42 — `2805fb1` feat: dog health monitoring app — initial build
First successful build and run on Android emulator.

---

## Architecture Versions

| Version | Date | Milestone | File |
|---------|------|-----------|------|
| v1.0 | 2026-06-03 → 2026-06-25 | Foundation — BLE, Supabase, Auth, Navigation | `docs/arch_v1.md` |
| v2.0 | 2026-06-29 → 2026-07-10 | On-Device AI — llama.rn, Qwen2.5, Chat UI | `docs/arch_v2.md` |
| v3.0 | 2026-07-10 | AI Enhancements — Knowledge base, persistence, UX | `docs/arch_v3.md` |
