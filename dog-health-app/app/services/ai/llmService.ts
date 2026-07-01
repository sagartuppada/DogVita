/**
 * On-device LLM service — wraps llama.rn for local inference.
 * Gracefully degrades when llama.rn is not installed.
 *
 * Requires: npm install llama.rn (+ New Architecture in native build)
 */

import { getModelPath, isModelDownloaded, extractBundledModel, downloadModel, AVAILABLE_MODELS } from './modelManager';

// Lazy-loaded to avoid crash when llama.rn isn't installed
let initLlama: any = null;
let installJsi: any = null;
let loadLlamaModelInfo: any = null;
let toggleNativeLog: any = null;
try {
  const llamaModule = require('llama.rn');
  initLlama = llamaModule.initLlama;
  installJsi = llamaModule.installJsi;
  loadLlamaModelInfo = llamaModule.loadLlamaModelInfo;
  toggleNativeLog = llamaModule.toggleNativeLog;
  console.log('[llmService] llama.rn loaded');
} catch (e: any) {
  console.log('[llmService] llama.rn load failed:', e?.message);
}

interface LlamaCompletionResult {
  text: string;
}

interface LlamaContext {
  completion: (params: any, callback?: (data: { token: string }) => void) => Promise<LlamaCompletionResult>;
  unload: () => Promise<void>;
}

export type LLMStatus = 'unavailable' | 'not_downloaded' | 'loading' | 'ready' | 'error';

interface LLMState {
  status: LLMStatus;
  context: LlamaContext | null;
  activeModelId: string | null;
  error: string | null;
}

const state: LLMState = {
  status: initLlama ? 'not_downloaded' : 'unavailable',
  context: null,
  activeModelId: null,
  error: null,
};

const SYSTEM_PROMPT = `You are DogVita, an AI health assistant for dogs. You help dog owners with nutrition, exercise, grooming, behavior, vaccines, and general health questions. Be concise, helpful, and always recommend consulting a veterinarian for specific medical concerns. Use emoji sparingly for readability.`;

/** Check if the LLM engine is available (llama.rn installed). */
export function isLLMAvailable(): boolean {
  return initLlama !== null;
}

/** Get current LLM status. */
export function getLLMStatus(): LLMStatus {
  return state.status;
}

/** Initialize the LLM with a specific model. Downloads if needed. */
export async function initLLM(modelId: string): Promise<boolean> {
  if (!initLlama) {
    state.status = 'unavailable';
    state.error = 'llama.rn is not installed';
    return false;
  }

  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (!model) {
    state.status = 'error';
    state.error = `Unknown model: ${modelId}`;
    return false;
  }

  // Check if already loaded with same model
  if (state.context && state.activeModelId === modelId && state.status === 'ready') {
    return true;
  }

  // Unload previous model
  if (state.context) {
    try {
      await state.context.unload();
    } catch {
      // ignore
    }
    state.context = null;
  }

  // Check if downloaded or bundled
  state.status = 'loading';
  state.activeModelId = modelId;

  const downloaded = await isModelDownloaded(modelId);
  if (!downloaded) {
    console.log('[llmService] Model not found locally, downloading:', modelId);
    const downloaded = await downloadModel(modelId);
    if (!downloaded) {
      state.status = 'not_downloaded';
      state.error = 'Model not downloaded yet';
      return false;
    }
    console.log('[llmService] Download complete:', downloaded);
  }

  let modelPath = getModelPath(modelId);

  const fileExists = modelPath ? await fileExistsAtPath(modelPath) : false;
  if (!fileExists) {
    const extracted = await extractBundledModel(modelId);
    if (!extracted) {
      state.status = 'error';
      state.error = 'Failed to extract bundled model';
      return false;
    }
    modelPath = extracted;
  }

  // Verify file size
  try {
    const mod = require('react-native-blob-util');
    const fs = (mod.default || mod).fs;
    if (fs) {
      const stat = await fs.stat(modelPath);
      const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
      console.log('[llmService] File:', modelPath, 'size:', stat.size, 'expected:', model?.sizeBytes);
    }
  } catch (e: any) {
    console.log('[llmService] stat error:', e?.message);
  }

  if (!modelPath) {
    state.status = 'error';
    state.error = 'Could not resolve model path';
    return false;
  }

  try {
    const modelUri = `file://${modelPath}`;
    console.log('[llmService] initLlama starting:', modelUri);

    // Install JSI
    if (installJsi) {
      try {
        await installJsi();
        console.log('[llmService] installJsi succeeded');
      } catch (e: any) {
        console.log('[llmService] installJsi failed:', e?.message);
      }
    }

    // Try to get model info first — validates GGUF without full load
    if (loadLlamaModelInfo) {
      try {
        console.log('[llmService] Loading model info...');
        const info = await loadLlamaModelInfo(modelUri);
        console.log('[llmService] Model info:', JSON.stringify(info).substring(0, 200));
      } catch (e: any) {
        console.log('[llmService] loadLlamaModelInfo failed:', e?.message);
      }
    }

    const ctx = await initLlama({
      model: modelUri,
      jinja: true,
    });
    console.log('[llmService] initLlama SUCCESS');
    state.context = ctx;
    state.status = 'ready';
    state.error = null;
    return true;
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.log('[llmService] initLlama FAILED:', errMsg);
    state.status = 'error';
    state.error = errMsg;
    state.context = null;
    state.activeModelId = null;
    return false;
  }
}

/** Generate a response using the loaded LLM. Returns null if LLM isn't ready. */
export async function generateResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  dogContext?: string,
): Promise<string | null> {
  if (!state.context || state.status !== 'ready') return null;

  const systemMsg = SYSTEM_PROMPT + (dogContext ? `\n\nAbout the user's dog:\n${dogContext}` : '');

  const chatMessages = [
    { role: 'system' as const, content: systemMsg },
    ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  try {
    const response = await state.context.completion({
      messages: chatMessages,
      n_predict: 512,
      temperature: 0.7,
      top_p: 0.9,
      repeat_penalty: 1.1,
      stop: ['</s>', '<|end|>', '<|user|>', '<end_of_turn>'],
    });
    return response?.text?.trim() ?? null;
  } catch (err) {
    console.warn('[llmService.generateResponse] Inference failed:', err);
    return null;
  }
}

/** Stream a response token by token. Calls onToken for each new token. */
export async function generateStreamResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  dogContext: string | undefined,
  onToken: (token: string) => void,
): Promise<string | null> {
  if (!state.context || state.status !== 'ready') return null;

  const systemMsg = SYSTEM_PROMPT + (dogContext ? `\n\nAbout the user's dog:\n${dogContext}` : '');

  const chatMessages = [
    { role: 'system' as const, content: systemMsg },
    ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  try {
    let fullResponse = '';
    await state.context.completion(
      {
        messages: chatMessages,
        n_predict: 512,
        temperature: 0.7,
        top_p: 0.9,
        repeat_penalty: 1.1,
        stop: ['</s>', '<|end|>', '<|user|>', '<end_of_turn>'],
      },
      (data: { token: string }) => {
        fullResponse += data.token;
        onToken(data.token);
      },
    );
    return fullResponse.trim() || null;
  } catch (err) {
    console.warn('[llmService.generateStreamResponse] Inference failed:', err);
    return null;
  }
}

/** Unload the current model to free memory. */
export async function unloadLLM(): Promise<void> {
  if (state.context) {
    try {
      await state.context.unload();
    } catch {
      // ignore
    }
    state.context = null;
    state.activeModelId = null;
    state.status = isLLMAvailable() ? 'not_downloaded' : 'unavailable';
    state.error = null;
  }
}

/** Get info about the currently loaded model. */
export function getLoadedModelInfo(): { modelId: string | null; status: LLMStatus } {
  return { modelId: state.activeModelId, status: state.status };
}

async function fileExistsAtPath(filePath: string): Promise<boolean> {
  try {
    const mod = require('react-native-blob-util');
    const fs = mod.fs || mod?.default?.fs;
    return await fs?.exists(filePath) ?? false;
  } catch {
    return false;
  }
}
