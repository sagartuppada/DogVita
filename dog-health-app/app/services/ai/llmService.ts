import { initLlama, LlamaContext } from 'llama.rn';
import { MODEL_PATH } from './modelManager';
import { Dog } from '../../types';
import { getKnowledgeContext } from './knowledgeContext';

let context: LlamaContext | null = null;
let loadPromise: Promise<void> | null = null;
let loadAbort: AbortController | null = null;

export async function loadModel(): Promise<void> {
  if (context) return;
  if (loadPromise) return loadPromise;

  loadAbort = new AbortController();

  loadPromise = (async () => {
    try {
      const loaded = await Promise.race([
        initLlama({
          model: MODEL_PATH,
          n_ctx: 1024,
          n_batch: 256,
          n_gpu_layers: 0,
        }),
        new Promise<never>((_, reject) => {
          const timer = setTimeout(() => {
            loadAbort = null;
            reject(new Error('Model load timed out after 120s'));
          }, 120000);
          loadAbort?.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new Error('Model load cancelled'));
          });
        }),
      ]);
      context = loaded;
    } catch (e) {
      context = null;
      loadPromise = null;
      loadAbort = null;
      const raw = String(e);
      throw new Error(`Model init failed: ${raw}`);
    }
  })();

  return loadPromise;
}

export async function unloadModel(): Promise<void> {
  await context?.release();
  context = null;
  loadPromise = null;
}

export function isModelLoaded(): boolean {
  return context !== null;
}

function calculateAge(birthDate?: string): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (totalMonths < 0) return null;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months} month${months !== 1 ? 's' : ''} old`;
  if (months === 0) return `${years} year${years !== 1 ? 's' : ''} old`;
  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''} old`;
}

export function buildSystemPrompt(dog?: Dog | null, query?: string): string {
  let prompt =
    'You are a knowledgeable dog health assistant. Answer questions clearly ' +
    'and briefly. For anything urgent or serious, recommend contacting a ' +
    'veterinarian. Use the dog\'s profile and expert knowledge below to personalize your answers.';

  if (dog) {
    const parts = [`\n\nCurrent dog profile:`];
    parts.push(`- Name: ${dog.name}`);
    parts.push(`- Breed: ${dog.breed}`);
    const age = calculateAge(dog.birthDate);
    if (age) parts.push(`- Age: ${age}`);
    if (dog.weight) parts.push(`- Weight: ${dog.weight} ${dog.weightUnit || 'kg'}`);
    if (dog.gender) parts.push(`- Gender: ${dog.gender}`);
    prompt += parts.join('\n');
  }

  if (query) {
    const knowledge = getKnowledgeContext(query, dog?.breed);
    if (knowledge) {
      prompt += `\n\n${knowledge}`;
    }
  }

  return prompt;
}

const STOP_TOKENS = [
  String.fromCharCode(60) + 'end_of_turn' + String.fromCharCode(62),
  String.fromCharCode(60) + 'eot_id' + String.fromCharCode(62),
  String.fromCharCode(60) + 'eos' + String.fromCharCode(62),
  'User:',
  'Assistant:',
];

export async function streamChat(
  history: { role: 'user' | 'assistant'; content: string }[],
  onToken: (token: string) => void,
  signal?: AbortSignal,
  dog?: Dog | null,
): Promise<string> {
  if (!context) throw new Error('Model not loaded. Go back and try again.');

  // Check if already aborted before starting
  if (signal?.aborted) throw new Error('Generation cancelled.');

  let cancelled = false;
  const abortHandler = () => { cancelled = true; };
  signal?.addEventListener('abort', abortHandler);

  try {
    // Extract the latest user message for knowledge retrieval
    const lastUserMsg = [...history].reverse().find((m) => m.role === 'user');
    const result = await context.completion(
      {
        messages: [{ role: 'system', content: buildSystemPrompt(dog, lastUserMsg?.content) }, ...history],
        n_predict: 512,
        temperature: 0.6,
        top_p: 0.95,
        stop: STOP_TOKENS,
      },
      (data) => {
        if (cancelled || signal?.aborted) {
          return;
        }
        onToken(data.token);
      },
    );

    if (cancelled || signal?.aborted) {
      throw new Error('Generation cancelled.');
    }
    return result.text;
  } catch (e) {
    const msg = (e as Error).message || 'Generation failed';
    if (msg.includes('Generation cancelled')) {
      throw e;
    }
    if (msg.includes('context') || msg.includes('length') || msg.includes('n_ctx')) {
      throw new Error('Conversation too long. Start a new chat.');
    }
    throw new Error(`Generation error: ${msg}`);
  } finally {
    signal?.removeEventListener('abort', abortHandler);
  }
}
