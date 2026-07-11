# DogVita Architecture — v4.0 (Web Search Integration)

**Date:** 2026-07-11
**Status:** Shipped

---

## Overview

Integrated web search capability into the on-device AI chat, inspired by agent-reach (https://github.com/Panniantong/agent-reach). agent-reach is a Python CLI tool — the phone cannot run Python directly, so we recreated the same concept using free public APIs (DuckDuckGo HTML + Jina Reader) in TypeScript with zero API keys required.

## Changes from v3.0

| # | Enhancement | Impact | Files |
|---|------------|--------|-------|
| 1 | DuckDuckGo search integration | Find trusted sources when local knowledge is insufficient | `webSearch.ts` |
| 2 | Jina Reader URL extraction | Read actual page content for better context | `webSearch.ts` |
| 3 | Trusted domain allow-list | Only reputable dog-health sources (AKC, ASPCA, AVMA, PubMed, etc.) | `webSearch.ts` |
| 4 | `/search` prefix handler | Manual web search trigger (`/search my dog is limping`) | `useLlamaChat.ts` |
| 5 | Auto-search on recency keywords | Triggers when query mentions latest/recent/2024/2025/2026/FDA/CDC | `llmService.ts` |
| 6 | "Searching web..." indicator | Visual feedback during network fetch | `ChatScreen.tsx` |

## New File: `webSearch.ts`

Lightweight web search module that recreates agent-reach's core functionality in TypeScript.

### Architecture

```
User query
  │
  ├─ /search prefix? ──────── forceWebSearch = true
  │
  ├─ Auto-detect recency? ─── forceWebSearch = true
  │   (latest, recent, 2024, 2025, 2026, FDA, CDC, outbreak, recall)
  │
  └─ Otherwise ────────────── local knowledge only
        │
        ▼
    DuckDuckGo HTML search (4s timeout)
        │
        ▼
    Filter by TRUSTED_DOMAINS allow-list
    Block BLOCKED_DOMAINS (social media, shopping)
        │
        ▼
    Jina Reader (3s per URL) → clean text
        │
        ▼
    formatSearchContext() → injected into system prompt
        │
        ▼
    LLM generates answer citing web sources
```

### Guardrails

| Rule | Implementation |
|------|---------------|
| Domain allow-list | 21 trusted domains only (AKC, ASPCA, AVMA, VCA, PetMD, Merck Vet, PubMed, etc.) |
| Domain block-list | Social media, shopping (Facebook, Instagram, TikTok, YouTube, Amazon, eBay) |
| Max results | 3 (to stay within 1024 token context window) |
| Snippet length | 200 chars per result |
| Timeout | 8s hard limit (4s DuckDuckGo + 3s per Jina read) |
| Emergency priority | Results from ASPCA poison control / AKC health sorted first |
| No external links | System prompt instructs: "treat as supporting context only; never invent beyond what these say" |
| Offline fallback | Empty array → graceful fallback to local knowledge base |

### DuckDuckGo HTML Endpoint

Uses `https://html.duckduckgo.com/html/` — a lightweight HTML-only endpoint that returns clean, parseable results without requiring an API key. The query is appended with `site:` operators for the trusted domains.

### Jina Reader

Uses `https://r.jina.ai/{url}` — a free service that extracts clean text from any URL, stripping HTML/CSS/JS/ads. No API key required for basic usage.

### Auto-Search Trigger

The LLM service detects recency keywords and auto-triggers web search:

```typescript
function shouldAutoSearch(query: string): boolean {
  const q = query.toLowerCase();
  if (q.length < 15) return false;
  return /\b(latest|recent|today|current|2024|2025|2026|new|update|news|outbreak|recall|study|research|cdc|fda)\b/.test(q);
}
```

### Manual /search Prefix

Users can explicitly request a web search by prefixing their message:

```
/search my dog is limping and shaking
```

The `/search ` prefix is stripped from the actual query sent to the LLM, and `forceWebSearch: true` is set.

### StreamChat API Change

`streamChat` signature changed from:

```typescript
streamChat(history, onToken, signal, dog?)
```

to:

```typescript
streamChat(history, onToken, signal, options?)
```

Where `options` is `{ dog?, forceWebSearch?, onSearchingChange? }`. The hook (`useLlamaChat`) now manages a `isSearching` state and passes an `onSearchingChange` callback.

## UI Changes

### "Searching web..." Banner

A small gray banner appears above the message list when the web search is active:

```tsx
<View style={styles.searchingBanner}>
  <ActivityIndicator size="small" color="#FFFFFF" />
  <Text style={styles.searchingText}>Searching the web…</Text>
</View>
```

Style: `#6B625A` background, white text, pill shape, left-aligned.

## Files Changed

| File | Change |
|------|--------|
| `app/services/ai/webSearch.ts` | **NEW** — DuckDuckGo search, Jina Reader, domain filtering, context formatting |
| `app/services/ai/llmService.ts` | Updated `buildSystemPrompt` to accept `SearchResult[]`; added `shouldAutoSearch` detection; `streamChat` options API with `onSearchingChange` |
| `app/hooks/useLlamaChat.ts` | Added `isSearching` state; strips `/search` prefix; passes `forceWebSearch` and `onSearchingChange` to `streamChat` |
| `app/screens/chat/ChatScreen.tsx` | Added `isSearching` destructured; `ListHeaderComponent` with searching banner; new styles |

## Build

- arm64-v8a release APK
- Installed on device `00116651G005894`
- No new dependencies (uses built-in `fetch` and `AbortController`)
