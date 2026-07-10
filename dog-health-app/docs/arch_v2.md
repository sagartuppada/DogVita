# DogVita Architecture — v2.0 (On-Device AI)

**Date:** 2026-06-29 → 2026-07-10
**Status:** Stable (crash fixed)
**Commits:** `7b753a6` → `d526b95`

---

## Overview

Added on-device LLM chat powered by `llama.rn`. Users can ask dog health questions offline with no internet required. Model downloads on first use (~300MB).

## What Changed from v1.0

### New Files

```
app/services/ai/
├── llmService.ts         # llama.rn wrapper (init, completion, teardown)
├── modelManager.ts       # HuggingFace download, retry logic, file management
└── service.ts            # Legacy rule-based chatbot (579 lines, 150+ knowledge entries)

app/hooks/
└── useLlamaChat.ts       # React hook: message state, streaming, abort control

app/screens/chat/
└── ChatScreen.tsx        # Chat UI with download progress, input, message list
```

### Modified Files

```
app/navigation/MainTabNavigator.tsx   # Added AI tab
app/screens/chat/ChatScreen.tsx      # New screen
```

## Model Configuration

| Property | Value |
|----------|-------|
| Model | Qwen2.5-0.5B-Instruct Q4_K_M |
| Size | ~300 MB GGUF |
| Min RAM | 1.5 GB |
| Context | `n_ctx: 1024` |
| Batch | `n_batch: 256` |
| GPU | `n_gpu_layers: 0` (CPU only) |

## Architecture

```
User types question
    ↓
useLlamaChat.sendMessage(text)
    ↓
llmService.streamChat(history, dog?, abortSignal)
    ↓
buildSystemPrompt(dog) → system message with dog profile
    ↓
context.completion({ messages: [system, ...history], n_predict: 512 })
    ↓
Streaming callback → update message in real-time
    ↓
Full response saved to message history
```

## Key Components

### `modelManager.ts`
- Downloads model from HuggingFace via `react-native-fs`
- 3 retry attempts with exponential backoff (5s, 15s, 30s)
- Stores model at `DocumentDirectoryPath/models/`
- Reports download progress via callback

### `llmService.ts`
- Exports `loadModel()`, `unloadModel()`, `streamChat()`, `buildSystemPrompt(dog?)`
- `LlamaContext` managed as module-level singleton
- Abort support via `AbortController`
- System prompt includes dog profile (name, breed, age, weight, gender)

### `useLlamaChat.ts`
- Manages `messages: Message[]` state
- Handles `isGenerating`, `cancelGeneration`
- Returns `sendMessage(text)` async function

### `ChatScreen.tsx`
- Shows download progress if model not present
- FlatList with user/assistant message bubbles
- TextInput with send/stop button
- Error banner for failures

## System Prompt Template

```
You are a knowledgeable dog health assistant. Answer questions clearly
and briefly. For anything urgent or serious, recommend contacting a
veterinarian.

Current dog profile:
- Name: Max
- Breed: Golden Retriever
- Age: 2 years 3 months
- Weight: 30 kg
- Gender: Male
```

## Build & Deploy

- Build from `C:\R\dog-health-app` (short path, avoids MAX_PATH)
- Sync with `robocopy /MIR` (excludes node_modules, .git, android, ios)
- Single file sync: `Copy-Item`
- Install via `adb install -r`

## Known Issues (at time of release)

- Model uses 1024 context — long conversations truncate early
- No knowledge augmentation — relies solely on model's training data
- `react-native-markdown-display` crashes on Android (fixed in v3.0)

## Legacy Service (`service.ts`)

579-line rule-based chatbot with:
- 150+ knowledge entries across 12 health topics
- 9 breed-specific advice profiles
- Intent matching via keyword arrays
- Demo fallback data

This service is **dead code** in v2.0 — the LLM replaced it. Its knowledge base is extracted and reused in v3.0's `knowledgeContext.ts`.
