/**
 * Voice service — speech-to-text (STT) and text-to-speech (TTS).
 * Gracefully degrades when react-native-tts or react-native-voice aren't installed.
 *
 * Requires: npm install react-native-tts react-native-voice
 */

// Lazy-load TTS
let Tts: any = null;
try {
  Tts = require('react-native-tts');
} catch {
  // Package not installed
}

// Lazy-load Voice (STT)
let Voice: any = null;
try {
  Voice = require('react-native-voice').default;
} catch {
  // Package not installed
}

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceState {
  isSTTAvailable: boolean;
  isTTSAvailable: boolean;
  status: VoiceStatus;
  partialResult: string;
}

const state: VoiceState = {
  isSTTAvailable: Voice !== null,
  isTTSAvailable: Tts !== null,
  status: 'idle',
  partialResult: '',
};

// ── STT (Speech-to-Text) ──

let onResultCallback: ((text: string) => void) | null = null;
let onPartialCallback: ((text: string) => void) | null = null;
let listenersSetup = false;

function setupVoiceListeners() {
  if (!Voice || listenersSetup) return;
  listenersSetup = true;

  Voice.onSpeechResults = (e: any) => {
    const result = e.value?.[0] ?? '';
    state.status = 'idle';
    state.partialResult = '';
    onResultCallback?.(result);
  };

  Voice.onSpeechPartialResults = (e: any) => {
    const partial = e.value?.[0] ?? '';
    state.partialResult = partial;
    onPartialCallback?.(partial);
  };

  Voice.onSpeechError = (e: any) => {
    console.warn('[voiceService] STT error:', e);
    state.status = 'idle';
    state.partialResult = '';
  };
}

export async function startListening(
  onResult: (text: string) => void,
  onPartial?: (text: string) => void,
): Promise<boolean> {
  if (!Voice) return false;

  onResultCallback = onResult;
  onPartialCallback = onPartial ?? null;
  setupVoiceListeners();

  try {
    const available = await Voice.isAvailable();
    if (!available) return false;

    await Voice.start('en-US');
    state.status = 'listening';
    return true;
  } catch (err) {
    console.warn('[voiceService.startListening] Failed:', err);
    state.status = 'idle';
    return false;
  }
}

export async function stopListening(): Promise<void> {
  if (!Voice) return;
  try {
    await Voice.stop();
    state.status = 'idle';
    state.partialResult = '';
  } catch {
    // ignore
  }
}

export async function cancelListening(): Promise<void> {
  if (!Voice) return;
  try {
    await Voice.cancel();
    state.status = 'idle';
    state.partialResult = '';
  } catch {
    // ignore
  }
}

// ── TTS (Text-to-Speech) ──

export async function speak(
  text: string,
  options?: { rate?: number; pitch?: number; language?: string },
): Promise<void> {
  if (!Tts) return;
  try {
    state.status = 'speaking';
    await Tts.speak(text, {
      rate: options?.rate ?? 0.9,
      pitch: options?.pitch ?? 1.0,
      language: options?.language ?? 'en-US',
    });
    state.status = 'idle';
  } catch (err) {
    console.warn('[voiceService.speak] Failed:', err);
    state.status = 'idle';
  }
}

export async function stopSpeaking(): Promise<void> {
  if (!Tts) return;
  try {
    await Tts.stop();
    state.status = 'idle';
  } catch {
    // ignore
  }
}

// ── Status ──

export function isSTTAvailable(): boolean {
  return state.isSTTAvailable;
}

export function isTTSAvailable(): boolean {
  return state.isTTSAvailable;
}

export function getVoiceStatus(): VoiceStatus {
  return state.status;
}

export function getPartialResult(): string {
  return state.partialResult;
}
