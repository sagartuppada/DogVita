# DogVita Architecture — v3.0 (Offline AI Enhancements)

**Date:** 2026-07-10
**Status:** Shipped
**Commit:** `993c799`

---

## Overview

Seven enhancements to the offline AI chat feature, transforming it from a basic LLM wrapper into a context-aware, persistent, user-friendly dog health assistant.

## Changes from v2.0

| # | Enhancement | Impact | Files |
|---|------------|--------|-------|
| 1 | Dog profile injection into system prompt | Personalized answers | `llmService.ts`, `useLlamaChat.ts`, `ChatScreen.tsx` |
| 2 | Suggested prompt chips on empty state | Better UX for first-time users | `ChatScreen.tsx` |
| 3 | Chat history persistence to AsyncStorage | Conversations survive app restarts | `useLlamaChat.ts` |
| 4 | Typing indicator during generation | Visual feedback while waiting | `ChatScreen.tsx` |
| 5 | Copy message on long press | Share answers easily | `ChatScreen.tsx` |
| 6 | Knowledge base integration | Expert context for the 0.5B model | `knowledgeContext.ts`, `llmService.ts` |
| 7 | Crash fix: remove markdown library | App no longer crashes on render | `ChatScreen.tsx` |

## New File: `knowledgeContext.ts`

Lightweight knowledge retrieval module that bridges the legacy rule-based chatbot's expertise with the on-device LLM.

### Architecture

```
User query: "my dog is limping"
    ↓
getKnowledgeContext(query, breed?)
    ↓
Keyword matching against TOPIC_KEYWORDS (14 topics)
    ↓
Returns up to 3 relevant facts from KNOWLEDGE_BASE
    ↓
Plus breed-specific advice from BREED_ADVICE
    ↓
Injected into system prompt as "Relevant expert knowledge"
```

### Knowledge Topics

| Topic | Keywords | Entries |
|-------|----------|---------|
| nutrition | food, eat, diet, nutrition, feed, treat, kibble | 4 |
| exercise | walk, run, exercise, play, active, energy | 4 |
| grooming | bath, brush, groom, nail, fur, shed | 4 |
| behavior | bark, bite, aggressive, training, potty, destroy | 4 |
| vaccines | vaccine, shot, rabies, dhpp, bordetella, booster | 4 |
| parasites | flea, tick, worm, heartworm, deworming | 4 |
| emergency | emergency, poison, toxic, choking, seizure, bloat | 4 |
| dental | teeth, tooth, breath, dental, tartar, gum | 4 |
| weight | weight, fat, skinny, overweight, calorie | 4 |
| skin | itchy, scratching, hot spot, bald, rash | 4 |
| joints | joint, hip, elbow, dysplasia, limping, arthritis | 4 |
| anxiety | anxious, nervous, scared, fear, separation | 4 |
| puppy | puppy, teething, socialization, crate train | 4 |
| senior | senior, aging, old dog, cognitive | 3 |

### Breed Profiles

9 breed-specific advice profiles: Golden Retriever, Labrador, German Shepherd, Bulldog, Poodle, Husky, Dachshund, French Bulldog, Border Collie.

### Integration Point

`buildSystemPrompt(dog, query)` in `llmService.ts`:
```typescript
if (query) {
  const knowledge = getKnowledgeContext(query, dog?.breed);
  if (knowledge) {
    prompt += `\n\n${knowledge}`;
  }
}
```

The latest user message is extracted from history and passed to `getKnowledgeContext` for matching.

## Enhanced System Prompt (v3.0)

```
You are a knowledgeable dog health assistant. Answer questions clearly
and briefly. For anything urgent or serious, recommend contacting a
veterinarian. Use the dog's profile and expert knowledge below to
personalize your answers.

Current dog profile:
- Name: Max
- Breed: Golden Retriever
- Age: 2 years 3 months
- Weight: 30 kg
- Gender: Male

Relevant expert knowledge to reference in your answer:
- Hip and elbow dysplasia are genetic conditions common in large breeds. Early screening helps.
- Maintaining a lean body weight is the single most important thing for protecting your dog's joints.
- Signs of joint problems: limping, difficulty rising, reluctance to climb stairs, bunny-hopping gait.
- Breed-specific (Golden Retriever): Prone to hip dysplasia and certain cancers. Regular vet checkups and healthy weight are crucial.
```

## Chat History Persistence

```typescript
// Storage key
const STORAGE_KEY = 'ai-chat-history';

// Load on mount
useEffect(() => {
  AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
    if (raw) setMessages(JSON.parse(raw));
  });
}, []);

// Save after each successful generation
useEffect(() => {
  if (messages.length > 0) {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
  }
}, [messages]);

// Clear on "New Chat"
clearMessages = () => {
  setMessages([]);
  AsyncStorage.removeItem(STORAGE_KEY);
};
```

Limited to last 20 messages to stay within 1024 context window.

## Prompt Chips

6 pre-defined questions shown on empty state:
- "How much should I feed my dog?"
- "Is my dog getting enough exercise?"
- "What vaccines does my dog need?"
- "My dog is scratching a lot"
- "Signs of emergency"
- "Teething tips for puppies"

Tap a chip → sends immediately as a message.

## Typing Indicator

Three pulsing dots (`Animated.loop` with `Animated.sequence`) shown when assistant message content is empty string (generation in progress, no tokens yet).

## Copy on Long Press

- `Pressable` wraps each message bubble
- `onLongPress` (400ms delay) copies text to `Clipboard`
- Gold "Copied!" badge appears at top-right for 1.5s
- Badge auto-hides via `setTimeout`

## Crash Fix

**Root cause:** `react-native-markdown-display` v7.0.2 depends on `markdown-it` which throws `TypeError: undefined is not a function` on Android render.

**Fix:** Removed `react-native-markdown-display` entirely. Replaced `<Markdown>` with plain `<Text>` styled with `assistantText` (dark brown color). The 0.5B model outputs minimal markdown — plain text is sufficient.

## File Changes Summary

| File | Lines Added | Lines Removed | Net |
|------|-------------|---------------|-----|
| `app/services/ai/knowledgeContext.ts` | 151 | 0 | +151 |
| `app/services/ai/llmService.ts` | 27 | 12 | +15 |
| `app/hooks/useLlamaChat.ts` | 28 | 5 | +23 |
| `app/screens/chat/ChatScreen.tsx` | 140 | 67 | +73 |
| `package.json` | 1 | 0 | +1 |
| `package-lock.json` | ~109 | ~64 | +45 |
| **Total** | **456** | **148** | **+308** |

## Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| `react-native-markdown-display` | 7.0.2 | **Added then removed** — crashed on Android |

Final state: no new dependencies added (markdown library removed).

## Testing

- `npm run typecheck` — passes clean (0 errors)
- Build: `assembleRelease` with `arm64-v8a` — successful
- Install: `adb install -r` — successful
- Launch: `monkey -p com.doghealth.app` — successful, no crashes
- Runtime: App stays alive (PID confirmed via `pidof`)
