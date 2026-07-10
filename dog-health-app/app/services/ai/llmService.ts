import { initLlama, LlamaContext } from 'llama.rn';
import { MODEL_PATH } from './modelManager';

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

const SYSTEM_PROMPT =
  'You are a helpful assistant for dog owners. Answer general pet-care ' +
  'questions clearly and briefly. For anything urgent or serious, tell ' +
  'the user to contact a veterinarian.';

// SmolLM3 stop tokens - covers all formats the model may emit
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
): Promise<string> {
  if (!context) throw new Error('Model not loaded. Go back and try again.');

  // Check if already aborted before starting
  if (signal?.aborted) throw new Error('Generation cancelled.');

  let cancelled = false;
  const abortHandler = () => { cancelled = true; };
  signal?.addEventListener('abort', abortHandler);

  try {
    const result = await context.completion(
      {
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
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
