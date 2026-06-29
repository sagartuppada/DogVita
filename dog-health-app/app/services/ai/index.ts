export { aiService } from './service';
export type { ChatMessage, DogHealthContext } from './service';
export { isLLMAvailable, getLLMStatus, initLLM, unloadLLM } from './llmService';
export type { LLMStatus } from './llmService';
export { AVAILABLE_MODELS, downloadModel, isModelDownloaded, deleteModel, isBundledModel, extractBundledModel, type ModelInfo, type DownloadProgress } from './modelManager';
