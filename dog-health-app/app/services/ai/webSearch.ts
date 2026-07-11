/**
 * Web search for the on-device AI assistant.
 *
 * Recreates agent-reach (https://github.com/Panniantong/agent-reach) in a way
 * that runs inside a React Native app. The phone cannot execute a Python CLI,
 * so we use the same free public APIs agent-reach recommends: DuckDuckGo for
 * search (no API key) and Jina Reader for URL extraction (no API key).
 *
 * Strict guardrails:
 *  - Allow-list of reputable dog-health sources only
 *  - Max 3 results, each trimmed to 200 chars
 *  - Hard 8s timeout, no retries
 *  - Offline-aware: returns empty array, callers fall back to local knowledge
 */

const MAX_RESULTS = 3;
const MAX_SNIPPET_CHARS = 200;
const SEARCH_TIMEOUT_MS = 8000;

const TRUSTED_DOMAINS: string[] = [
  'akc.org',
  'aspca.org',
  'avma.org',
  'vcahospitals.com',
  'petmd.com',
  'akcchf.org',
  'vet.cornell.edu',
  'vetmed.illinois.edu',
  'vca.com',
  'merckvetmanual.com',
  'vcahospitals.com',
  'bluecross.org.uk',
  'rsbca.org.uk',
  'royalsocietypreventionofcrueltytoanimals.org',
  'cpr.org',
  'pubmed.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov',
  'reddit.com/r/askvet',
  'dogster.com',
  'pumpkin.care',
];

const BLOCKED_DOMAINS: string[] = [
  'facebook.com',
  'instagram.com',
  'tiktok.com',
  'youtube.com',
  'pinterest.com',
  'amazon.com',
  'amazon.co',
  'ebay.com',
  'aliexpress.com',
  'amazonastrology',
  'clickbank.com',
];

const EMERGENCY_DOMAINS: string[] = [
  'aspca.org/pet-care/animal-poison-control',
  'akc.org/expert-advice/health',
  'vcahospitals.com/know-your-pet',
];

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function isAllowed(url: string): boolean {
  const host = hostnameOf(url);
  if (!host) return false;
  for (const blocked of BLOCKED_DOMAINS) {
    if (host === blocked || host.endsWith('.' + blocked)) return false;
  }
  for (const trusted of TRUSTED_DOMAINS) {
    if (host === trusted || host.endsWith('.' + trusted)) return true;
  }
  return false;
}

function isEmergencyTopic(query: string): boolean {
  const q = query.toLowerCase();
  return /\b(poison|toxic|choking|bleeding|seizure|collapsed|unconscious|bloat|heatstroke|venom|snake bite|swallowed)\b/.test(q);
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

function decodeHtmlEntities(text: string): string {
  const AMP = String.fromCharCode(38);
  const LT = String.fromCharCode(60);
  const GT = String.fromCharCode(62);
  const QUOT = String.fromCharCode(34);
  const APOS = String.fromCharCode(39);
  const NBSP = String.fromCharCode(160);
  return text
    .replace(/&/g, AMP)
    .replace(/</g, LT)
    .replace(/>/g, GT)
    .replace(/"/g, QUOT)
    .replace(/'/g, APOS)
    .replace(/&apos;/g, APOS)
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, String.fromCharCode(8217))
    .replace(/&#8216;/g, String.fromCharCode(8216))
    .replace(/&#8220;/g, String.fromCharCode(8220))
    .replace(/&#8221;/g, String.fromCharCode(8221))
    .replace(/&#8211;/g, String.fromCharCode(8211))
    .replace(/&#8212;/g, String.fromCharCode(8212))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function duckDuckGoSearch(query: string, abortSignal?: AbortSignal): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: `${query} dog health site:akc.org OR site:aspca.org OR site:avma.org OR site:vcahospitals.com OR site:petmd.com OR site:merckvetmanual.com`,
    kl: 'us-en',
  });
  const url = `https://html.duckduckgo.com/html/?${params.toString()}`;

  const res = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 DogVita/1.0',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: abortSignal,
    },
    4000,
  );

  if (!res.ok) {
    throw new Error(`DuckDuckGo returned ${res.status}`);
  }

  const html = await res.text();
  const results: SearchResult[] = [];

  const blockRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(html)) && results.length < MAX_RESULTS * 3) {
    const rawHref = decodeHtmlEntities(match[1]);
    const cleanHref = rawHref.startsWith('//') ? 'https:' + rawHref : rawHref;
    const title = stripHtml(decodeHtmlEntities(match[2]));
    const snippet = stripHtml(decodeHtmlEntities(match[3]));

    if (!title || !snippet) continue;
    if (!isAllowed(cleanHref)) continue;

    results.push({
      title: title.slice(0, 120),
      url: cleanHref,
      snippet: snippet.slice(0, MAX_SNIPPET_CHARS * 3),
    });
  }

  return results.slice(0, MAX_RESULTS);
}

async function jinaReadUrl(url: string, abortSignal?: AbortSignal): Promise<string> {
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
}

export async function searchWeb(query: string, abortSignal?: AbortSignal): Promise<SearchResult[]> {
  if (!query || !query.trim()) return [];

  const emergency = isEmergencyTopic(query);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  const signal = abortSignal
    ? composeSignals(controller.signal, abortSignal)
    : controller.signal;

  try {
    const results = await duckDuckGoSearch(query, signal);
    if (results.length === 0) return [];

    const enriched: SearchResult[] = [];
    for (const r of results) {
      let snippet = r.snippet;
      try {
        const deep = await jinaReadUrl(r.url, signal);
        if (deep) {
          snippet = deep.length > MAX_SNIPPET_CHARS * 2 ? deep.slice(0, MAX_SNIPPET_CHARS * 2) : deep;
        }
      } catch {
        // snippet already set from search result
      }
      enriched.push({
        title: r.title,
        url: r.url,
        snippet: snippet.slice(0, MAX_SNIPPET_CHARS),
      });
    }

    if (emergency && enriched.length > 0) {
      enriched.sort((a, b) => {
        const aEmerg = EMERGENCY_DOMAINS.some((d) => a.url.includes(d)) ? 0 : 1;
        const bEmerg = EMERGENCY_DOMAINS.some((d) => b.url.includes(d)) ? 0 : 1;
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
      `[${i + 1}] ${r.title}\n` +
      `Source: ${r.url}\n` +
      `${r.snippet}`,
  );
  return (
    `\n\nRecent web references (treat as supporting context only; ` +
    `never invent or paraphrase beyond what these say; for emergencies, advise seeing a vet):\n` +
    lines.join('\n\n')
  );
}
