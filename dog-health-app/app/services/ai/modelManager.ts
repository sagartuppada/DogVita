import RNFS from 'react-native-fs';

const MODEL_URL =
  'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';
const MODEL_FILENAME = 'qwen2.5-0.5b-instruct-q4_k_m.gguf';
const MIN_MODEL_SIZE = 200_000_000; // 200 MB — Qwen2.5-0.5B Q4_K_M is ~300 MB
const MAX_RETRIES = 3;

function getModelDir(): string {
  return RNFS.DocumentDirectoryPath;
}

function getModelPath(): string {
  return `${getModelDir()}/${MODEL_FILENAME}`;
}

export const MODEL_PATH = getModelPath();

export async function isModelDownloaded(): Promise<boolean> {
  try {
    const exists = await RNFS.exists(MODEL_PATH);
    if (!exists) return false;
    const stat = await RNFS.stat(MODEL_PATH);
    return Number(stat.size) > MIN_MODEL_SIZE;
  } catch {
    return false;
  }
}

export async function deleteModelFile(): Promise<void> {
  try {
    const exists = await RNFS.exists(MODEL_PATH);
    if (exists) {
      await RNFS.unlink(MODEL_PATH);
    }
  } catch {}
}

async function downloadNative(
  onProgress: (pct: number) => void,
): Promise<void> {
  console.warn('[DogHealth] Starting download via react-native-fs');

  const modelDir = getModelDir();
  const tmpPath = `${modelDir}/${MODEL_FILENAME}.tmp`;

  try { await RNFS.mkdir(modelDir); } catch {}
  await RNFS.unlink(tmpPath).catch(() => {});

  // HuggingFace redirects to a CDN — resolve the final URL first
  console.warn('[DogHealth] Resolving redirect URL...');
  const headRes = await fetch(MODEL_URL, { method: 'HEAD', headers: { 'User-Agent': 'DogVita/1.0' } });
  const finalUrl = headRes.url || MODEL_URL;
  console.warn('[DogHealth] Final URL (first 80 chars):', finalUrl.substring(0, 80));

  const downloadResult = await RNFS.downloadFile({
    fromUrl: finalUrl,
    toFile: tmpPath,
    headers: { 'User-Agent': 'DogVita/1.0' },
    progress: (res) => {
      if (res.contentLength > 0) {
        const pct = Math.min(res.bytesWritten / res.contentLength, 0.99);
        onProgress(pct);
        if (Math.round(pct * 100) % 10 === 0) {
          console.warn(`[DogHealth] Download: ${Math.round(pct * 100)}% (${(res.bytesWritten / 1e6).toFixed(0)} MB)`);
        }
      }
    },
    progressDivider: 10,
  }).promise;

  if (downloadResult.statusCode !== 200) {
    await RNFS.unlink(tmpPath).catch(() => {});
    throw new Error(`HTTP ${downloadResult.statusCode}`);
  }

  // Rename tmp to final path
  await RNFS.moveFile(tmpPath, MODEL_PATH);

  onProgress(1);
  console.warn('[DogHealth] Download complete via react-native-fs');
}

export async function downloadModel(
  onProgress: (pct: number) => void,
): Promise<void> {
  let lastError: Error | null = null;
  console.warn('[DogHealth] downloadModel called');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.warn(`[DogHealth] Attempt ${attempt}/${MAX_RETRIES}`);
      if (await isModelDownloaded()) {
        console.warn('[DogHealth] Model already downloaded, skipping');
        return;
      }

      // Clean up any partial files from previous attempts
      const tmpPath = `${getModelDir()}/${MODEL_FILENAME}.tmp`;
      await RNFS.unlink(tmpPath).catch(() => {});
      await RNFS.unlink(MODEL_PATH).catch(() => {});

      onProgress(0);
      await downloadNative(onProgress);

      const stat = await RNFS.stat(MODEL_PATH);
      const size = Number(stat.size);
      console.warn('[DogHealth] Final model size:', size, '(' + (size / 1e6).toFixed(0) + ' MB)');

      if (size < MIN_MODEL_SIZE) {
        await RNFS.unlink(MODEL_PATH).catch(() => {});
        throw new Error(`File too small (${(size / 1e6).toFixed(0)} MB, expected ~300 MB)`);
      }

      onProgress(1);
      console.warn('[DogHealth] Download completed successfully');
      return;
    } catch (e) {
      lastError = e as Error;
      console.error(`[DogHealth] Attempt ${attempt} failed:`, lastError.message, lastError.stack || '');
      const tmpPath = `${getModelDir()}/${MODEL_FILENAME}.tmp`;
      await RNFS.unlink(tmpPath).catch(() => {});
      await RNFS.unlink(MODEL_PATH).catch(() => {});

      if (attempt < MAX_RETRIES) {
        console.warn(`[DogHealth] Retrying in ${2000 * attempt}ms...`);
        onProgress(0);
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }

  const errorMsg = `Download failed after ${MAX_RETRIES} attempts: ${lastError?.message || 'unknown error'}`;
  console.error('[DogHealth]', errorMsg);
  throw new Error(errorMsg);
}
