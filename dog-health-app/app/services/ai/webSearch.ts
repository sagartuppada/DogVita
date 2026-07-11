/**
 * Web search for the on-device AI assistant.
 *
 * Inspired by agent-reach (https://github.com/Panniantong/agent-reach).
 * Uses Wikipedia API for search (free, no API key) and Jina Reader
 * for additional page content extraction.
 *
 * Guardrails:
 *  - Animal/dog health topics only
 *  - Max 3 results, each trimmed to 200 chars
 *  - Hard 10s timeout, no retries
 *  - Offline-aware: returns empty array, callers fall back to local knowledge
 */

const MAX_RESULTS = 3;
const MAX_SNIPPET_CHARS = 200;
const SEARCH_TIMEOUT_MS = 10000;

const DOG_WIKI_TOPICS = [
  'Canine_health',
  'Dog_disease',
  'Dog_nutrition',
  'Dog_breeds',
  'Canine_parvovirus',
  'Canine_distemper',
  'Heartworm',
  'Canine_influenza',
  'Hip_dysplasia_(dog)',
  'Canine_cognitive_dysfunction',
  'Bloat_(veterinary)',
  'Canine_allergies',
  'Flea_medicine_toxicity_in_dogs',
  'Chocolate_toxicity_in_dogs',
  'Canine_temperament',
  'Dog_training',
  'Puppy_training',
  'Canine_reproductive_cycle',
  'Dog_food',
  'Raw_feeding',
  'Canine_anatomy',
  'Dog_health',
  'Veterinary_medicine',
];

const BLOCKED_DOMAINS: string[] = [
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'pinterest.com',
  'amazon.com',
  'ebay.com',
];

const EMERGENCY_TOPICS = [
  'Chocolate_toxicity_in_dogs',
  'Bloat_(veterinary)',
  'Canine_parvovirus',
  'Heartworm',
  'Flea_medicine_toxicity_in_dogs',
];

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isEmergencyTopic(query: string): boolean {
  const q = query.toLowerCase();
  return /\b(poison|toxic|choking|bleeding|seizure|collapsed|unconscious|bloat|heatstroke|venom|snake bite|swallowed|parvo|distemper)\b/.test(q);
}

function matchDogTopics(query: string): string[] {
  const q = query.toLowerCase();
  const matched: string[] = [];

  const keywordMap: Record<string, string[]> = {
    nutrition: ['food', 'eat', 'diet', 'feed', 'meal', 'treat', 'kibble', 'raw food', 'grain free', 'nutrition'],
    exercise: ['walk', 'run', 'exercise', 'play', 'active', 'energy', 'fetch', 'swim', 'hike'],
    vaccines: ['vaccine', 'vaccination', 'shot', 'rabies', 'dhpp', 'bordetella', 'booster'],
    parasites: ['flea', 'tick', 'worm', 'heartworm', 'parasite', 'deworming'],
    emergency: ['emergency', 'poison', 'toxic', 'choking', 'bleeding', 'seizure', 'bloat', 'heatstroke', 'collapse', 'urgent'],
    dental: ['teeth', 'tooth', 'breath', 'dental', 'tartar', 'plaque'],
    weight: ['weight', 'fat', 'overweight', 'obese', 'portion', 'calorie'],
    skin: ['itchy', 'scratching', 'hot spot', 'bald', 'hair loss', 'rash', 'dry skin'],
    joints: ['joint', 'hip', 'elbow', 'dysplasia', 'limping', 'arthritis', 'mobility'],
    anxiety: ['anxious', 'anxiety', 'nervous', 'scared', 'fear', 'stress', 'separation'],
    puppy: ['puppy', 'teething', 'socialization', 'puppy training'],
    senior: ['senior', 'aging', 'old dog', 'cognitive', 'dementia'],
    behavior: ['bark', 'bite', 'aggressive', 'training', 'obedience', 'leash'],
    general: ['dog', 'canine', 'puppy', 'pup', 'pet', 'vet', 'veterinary'],
  };

  for (const [topic, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((kw) => q.includes(kw))) {
      matched.push(topic);
    }
  }

  return matched;
}

async function wikipediaSearch(query: string, abortSignal?: AbortSignal): Promise<SearchResult[]> {
  const searchQuery = `${query} dog health`;
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: searchQuery,
    format: 'json',
    srlimit: '5',
  });
  const searchUrl = `https://en.wikipedia.org/w/api.php?${params.toString()}`;

  const res = await fetchWithTimeout(
    searchUrl,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DogVita/1.0 (Android; DogHealthApp; contact@dogvita.app)',
      },
      signal: abortSignal,
    },
    5000,
  );

  if (!res.ok) throw new Error(`Wikipedia search returned ${res.status}`);

  const data = await res.json();
  const results: SearchResult[] = [];

  if (data.query && data.query.search && Array.isArray(data.query.search)) {
    for (const item of data.query.search) {
      if (!item.title) continue;

      const snippet = (item.snippet || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&[^;]+;/g, ' ')
        .slice(0, MAX_SNIPPET_CHARS * 2);
      if (!snippet) continue;

      results.push({
        title: item.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
        snippet,
        source: 'Wikipedia',
      });

      if (results.length >= MAX_RESULTS * 2) break;
    }
  }

  return results.slice(0, MAX_RESULTS);
}

async function jinaReadUrl(url: string, abortSignal?: AbortSignal): Promise<string> {
  try {
    const readerUrl = `https://r.jina.ai/${url}`;
    const res = await fetchWithTimeout(
      readerUrl,
      {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
          'X-Return-Format': 'text',
        },
        signal: abortSignal,
      },
      3000,
    );
    if (!res.ok) return '';
    const text = await res.text();
    return text.replace(/\s+/g, ' ').trim().slice(0, 500);
  } catch {
    return '';
  }
}

export async function searchWeb(query: string, abortSignal?: AbortSignal): Promise<SearchResult[]> {
  if (!query || !query.trim()) return [];

  const topics = matchDogTopics(query);
  if (topics.length === 0) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  const signal = abortSignal
    ? composeSignals(controller.signal, abortSignal)
    : controller.signal;

  try {
    let results: SearchResult[] = [];

    try {
      results = await wikipediaSearch(query, signal);
    } catch {
      // Wikipedia search failed, try direct topic lookup
    }

    if (results.length === 0 && topics.length > 0) {
      const topicPage = topics[0].charAt(0).toUpperCase() + topics[0].slice(1);
      try {
        const params = new URLSearchParams({
          action: 'query',
          titles: topicPage,
          prop: 'extracts',
          exintro: 'true',
         explaintext: 'true',
          format: 'json',
          exchars: '500',
        });
        const summaryUrl = `https://en.wikipedia.org/w/api.php?${params.toString()}`;
        const res = await fetchWithTimeout(
          summaryUrl,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'DogVita/1.0 (Android; DogHealthApp; contact@dogvita.app)',
            },
            signal,
          },
          3000,
        );
        if (res.ok) {
          const data = await res.json();
          if (data.query && data.query.pages) {
            const pages = Object.values(data.query.pages);
            if (pages.length > 0) {
              const page = pages[0] as any;
              if (page.extract) {
                results.push({
                  title: page.title || topicPage,
                  url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topicPage)}`,
                  snippet: page.extract.slice(0, MAX_SNIPPET_CHARS * 2),
                  source: 'Wikipedia',
                });
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }

    if (results.length === 0) return [];

    const enriched: SearchResult[] = [];
    for (const r of results) {
      let snippet = r.snippet;
      try {
        const deep = await jinaReadUrl(r.url, signal);
        if (deep && deep.length > snippet.length) {
          snippet = deep.slice(0, MAX_SNIPPET_CHARS * 2);
        }
      } catch {
        // snippet already set from Wikipedia
      }
      enriched.push({
        title: r.title,
        url: r.url,
        snippet: snippet.slice(0, MAX_SNIPPET_CHARS),
        source: r.source,
      });
    }

    const emergency = isEmergencyTopic(query);
    if (emergency && enriched.length > 0) {
      enriched.sort((a, b) => {
        const aEmerg = EMERGENCY_TOPICS.some((t) => a.url.includes(t)) ? 0 : 1;
        const bEmerg = EMERGENCY_TOPICS.some((t) => b.url.includes(t)) ? 0 : 1;
        return aEmerg - bEmerg;
      });
    }

    return enriched.slice(0, MAX_RESULTS);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function composeSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a.addEventListener('abort', onAbort);
  b.addEventListener('abort', onAbort);
  if (a.aborted || b.aborted) controller.abort();
  return controller.signal;
}

export function formatSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return '';
  const lines = results.map(
    (r, i) =>
      `[${i + 1}] ${r.title} (${r.source})\n` +
      `Source: ${r.url}\n` +
      `${r.snippet}`,
  );
  return (
    `\n\nWeb references (treat as supporting context only; ` +
    `never invent or paraphrase beyond what these say; for emergencies, advise seeing a vet):\n` +
    lines.join('\n\n')
  );
}
