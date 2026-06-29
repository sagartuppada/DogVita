/**
 * Model Manager — handles GGUF model download, storage, and path resolution.
 * Uses react-native-blob-util for large file streaming (avoids OOM on 1-4GB files).
 *
 * Requires: npm install react-native-blob-util
 */

import { Platform } from 'react-native';

// Lazy-loaded to avoid crash when package isn't installed
let BlobUtil: any = null;
let BlobFS: any = null;
try {
  const mod = require('react-native-blob-util');
  // CRITICAL: mod.default is the native codegen spec (NativeBlobUtils) which
  // lacks JS-side bundle-assets:// handling. We need the full JS module (mod)
  // which exports config/fetch from ./fetch with proper URI scheme support.
  BlobUtil = mod;
  BlobFS = mod.fs;
} catch (err: any) {
  // Package not installed
}

export interface ModelInfo {
  id: string;
  name: string;
  url: string;
  filename: string;
  sizeBytes: number;
  minRamGB: number;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'llama-3.2-1b',
    name: 'Llama 3.2 1B',
    url: 'https://huggingface.co/unsloth/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    filename: 'Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    sizeBytes: 800_000_000,
    minRamGB: 1.5,
  },
  {
    id: 'qwen-2.5-1.5b',
    name: 'Qwen 2.5 1.5B',
    url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    filename: 'qwen2.5-1.5b-instruct-q4_k_m.gguf',
    sizeBytes: 1_000_000_000,
    minRamGB: 2.0,
  },
];

const MODELS_DIR = 'DogVitaModels';

function getDocumentDir(): string {
  if (Platform.OS === 'ios') {
    return `${BlobFS?.dirs?.DocumentDir ?? ''}/${MODELS_DIR}`;
  }
  return `${BlobFS?.dirs?.DocumentDir ?? ''}/${MODELS_DIR}`;
}

/** Get the local file path for a model in the document directory. */
export function getModelPath(modelId: string): string | null {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (!model || !BlobUtil) return null;
  return `${getDocumentDir()}/${model.filename}`;
}

/** Get the bundled asset path for a model (Android only). */
function getBundledAssetPath(modelId: string): string | null {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (!model || Platform.OS !== 'android') return null;
  return `models/${model.filename}`;
}

/**
 * Check if a model is available as a bundled asset in the APK.
 *
 * NOTE: We cannot use BlobFS.exists() with file:///android_asset/ URIs
 * because Android APK assets are not real filesystem paths. Instead, we
 * check if the asset path is configured for this platform. The actual
 * file copy is handled by extractBundledModel().
 */
export function isBundledModel(modelId: string): boolean {
  const assetPath = getBundledAssetPath(modelId);
  return !!assetPath; // assetPath is non-null only on Android
}

/**
 * Extract a bundled model from APK assets to the document directory.
 * Uses react-native-blob-util's bundle-assets:// URI scheme for native streaming.
 * llama.rn requires a real file path, so we must copy the asset to disk.
 */
export async function extractBundledModel(
  modelId: string,
  onProgress?: (progress: DownloadProgress) => void,
): Promise<string | null> {
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (!model || !BlobUtil || !BlobFS) return null;

  const dir = getDocumentDir();
  const destPath = `${dir}/${model.filename}`;

  // Ensure directory exists
  try {
    if (BlobFS) {
      const exists = await BlobFS.exists(dir);
      if (!exists) await BlobFS.mkdir(dir);
    }
  } catch { /* ignore */ }

  // Already extracted
  try {
    if (BlobFS) {
      const alreadyExists = await BlobFS.exists(destPath);
      if (alreadyExists) return destPath;
    }
  } catch { /* ignore */ }

  // Copy from APK assets to document dir using bundle-assets:// protocol.
  try {
    const assetUri = `bundle-assets:///models/${model.filename}`;
    onProgress?.({ received: 0, total: model.sizeBytes, percent: 0 });

    const task = BlobUtil.config({ path: destPath }).fetch('GET', assetUri);
    if (onProgress) {
      task.progress((received: number, total: number) => {
        onProgress({ received, total, percent: Math.round((received / total) * 100) });
      });
    }
    const res = await task;
    onProgress?.({ received: model.sizeBytes, total: model.sizeBytes, percent: 100 });
    return res.path();
  } catch (err: any) {
    console.warn('[modelManager.extractBundledModel] Extraction failed:', err?.message);
    // Clean up partial file
    try { await BlobFS?.unlink(destPath); } catch { /* ignore */ }
    return null;
  }
}

/** Check if a model GGUF file exists locally (downloaded or bundled). */
export async function isModelDownloaded(modelId: string): Promise<boolean> {
  // Check downloaded copy in document dir
  const path = getModelPath(modelId);
  if (path && BlobFS) {
    try {
      if (await BlobFS.exists(path)) return true;
    } catch { /* ignore */ }
  }
  // Check bundled asset in APK (Android only)
  return isBundledModel(modelId);
}

export interface DownloadProgress {
  received: number;
  total: number;
  percent: number;
}

/**
 * Download or extract a model. Tries bundled asset extraction first,
 * then falls back to downloading from the network.
 * Returns the local file path on completion.
 */
export async function downloadModel(
  modelId: string,
  onProgress?: (progress: DownloadProgress) => void,
): Promise<string | null> {
  // Try extracting from bundled APK asset first (free, fast)
  const bundled = isBundledModel(modelId);
  if (bundled) {
    const extracted = await extractBundledModel(modelId, onProgress);
    if (extracted) return extracted;
    // Extraction failed — fall through to network download
  }

  // Fall back to network download
  const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
  if (!model || !BlobUtil || !BlobFS) return null;

  const dir = getDocumentDir();
  const destPath = `${dir}/${model.filename}`;

  // Ensure directory exists
  try {
    const exists = await BlobFS.exists(dir);
    if (!exists) await BlobFS.mkdir(dir);
  } catch {
    // mkdir may already exist
  }

  // Check if already downloaded
  const alreadyDownloaded = await BlobFS.exists(destPath);
  if (alreadyDownloaded) return destPath;

  console.log(`[modelManager] Downloading model from network: ${modelId}`);

  try {
    const task = BlobUtil.config({
      path: destPath,
      fileCache: true,
    }).fetch('GET', model.url);

    if (onProgress) {
      task.progress((received: number, total: number) => {
        onProgress({ received, total, percent: Math.round((received / total) * 100) });
      });
    }

    const res = await task;
    return res.path();
  } catch (err) {
    console.warn('[modelManager.downloadModel] Download failed:', err);
    try {
      await BlobFS.unlink(destPath);
    } catch {
      // ignore
    }
    return null;
  }
}

/** Delete a downloaded model file to free space. */
export async function deleteModel(modelId: string): Promise<void> {
  const path = getModelPath(modelId);
  if (!path || !BlobFS) return;
  try {
    const exists = await BlobFS.exists(path);
    if (exists) await BlobFS.unlink(path);
  } catch {
    // ignore
  }
}


