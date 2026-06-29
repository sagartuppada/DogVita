/**
 * On-device LLM service — wraps llama.rn for local inference.
 * Gracefully degrades when llama.rn is not installed.
 *
 * Requires: npm install llama.rn (+ New Architecture in native build)
 */

import { getModelPath, isModelDownloaded, extractBundledModel, AVAILABLE_MODELS } from './modelManager';

// Lazy-loaded to avoid crash when package isn't installed
let BlobFS: any = null;
try {
  const mod = require('react-native-blob-util');
  BlobFS = mod.fs || mod?.default?.fs;
} catch {
  // Package not installed
}

// Lazy-loaded to avoid crash when llama.rn isn't installed
let initLlama: any = null;
try {
  const llamaModule = require('llama.rn');
  initLlama = llamaModule.initLlama;
} catch {
  // Package not installed
}

interface LlamaContext {
  completion: (params: any, callback?: (token: string) => void) => Promise<string>;
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

function buildChatPrompt(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  dogContext?: string,
): string {
  const systemMsg = SYSTEM_PROMPT + (dogContext ? `\n\nAbout the user's dog:\n${dogContext}` : '');

  // Detect model format from activeModelId
  const modelId = state.activeModelId ?? '';
  const isLlama = modelId.includes('llama');

  if (isLlama) {
    // Llama 3.2 chat format: <|begin_of_text|> with [INST] blocks
    let prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n${systemMsg}<|eot_id|>`;
    for (const msg of messages) {
      const header = msg.role === 'user' ? 'user' : 'assistant';
      prompt += `<|start_header_id|>${header}<|end_header_id|>\n${msg.content}<|eot_id|>`;
    }
    prompt += `<|start_header_id|>assistant<|end_header_id|>\n`;
    return prompt;
  }

  // Default: ChatML format (Qwen, most other models)
  let prompt = `<|system|>\n${systemMsg}\n<|end|>\n`;
  for (const msg of messages) {
    const tag = msg.role === 'user' ? 'user' : 'assistant';
    prompt += `<|${tag}|>\n${msg.content}\n<|end|>\n`;
  }
  prompt += `<|assistant|>\n`;
  return prompt;
}

async function fileExistsAtPath(filePath: string): Promise<boolean> {
  try {
    return await BlobFS?.exists(filePath) ?? false;
  } catch {
    return false;
  }
}

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
    state.status = 'not_downloaded';
    state.error = 'Model not downloaded yet';
    return false;
  }

  let modelPath = getModelPath(modelId);

  // If model is bundled but not yet extracted to document dir, extract it now
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

  if (!modelPath) {
    state.status = 'error';
    state.error = 'Could not resolve model path';
    return false;
  }

  try {
    const ctx = await initLlama({
      model: `file://${modelPath}`,
      n_ctx: 2048,
      n_gpu_layers: 99,
    });
    state.context = ctx;
    state.status = 'ready';
    state.error = null;
    return true;
  } catch (err) {
    state.status = 'error';
    state.error = (err as Error).message;
    state.context = null;
    state.activeModelId = null;
    console.warn('[llmService.initLLM] Failed to initialize:', err);
    return false;
  }
}

/** Generate a response using the loaded LLM. Returns null if LLM isn't ready. */
export async function generateResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  dogContext?: string,
): Promise<string | null> {
  if (!state.context || state.status !== 'ready') return null;

  const prompt = buildChatPrompt(messages, dogContext);

  try {
    const response = await state.context.completion({
      prompt,
      n_predict: 512,
      temperature: 0.7,
      top_p: 0.9,
      repeat_penalty: 1.1,
      stop: ['<|end|>', '<|user|>'],
    });
    return response?.trim() ?? null;
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

  const prompt = buildChatPrompt(messages, dogContext);

  try {
    let fullResponse = '';
    await state.context.completion(
      {
        prompt,
        n_predict: 512,
        temperature: 0.7,
        top_p: 0.9,
        repeat_penalty: 1.1,
        stop: ['<|end|>', '<|user|>'],
      },
      (token: string) => {
        fullResponse += token;
        onToken(token);
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
