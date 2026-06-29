/**
 * useLLMLifecycle — automatically unloads the on-device LLM when the app
 * backgrounds and reloads it when the app returns to foreground.
 *
 * This prevents the OS from killing the app due to high memory usage from
 * the loaded model weights (~1-4GB resident memory).
 *
 * Drop this hook into any top-level component (App.tsx).
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { isLLMAvailable, initLLM, unloadLLM, getLoadedModelInfo } from '../services/ai/llmService';

export function useLLMLifecycle(): void {
  const appState = useRef(AppState.currentState);
  const modelBeforeBackground = useRef<string | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const previousState = appState.current;
      appState.current = nextState;

      // Skip if LLM isn't installed
      if (!isLLMAvailable()) return;

      // Don't unload while inference is running
      if (_isInferenceActive && nextState === 'background') {
        return;
      }

      // Going to background: unload model to free memory
      if (previousState === 'active' && (nextState === 'background' || nextState === 'inactive')) {
        const { modelId, status } = getLoadedModelInfo();
        if (status === 'ready' && modelId) {
          modelBeforeBackground.current = modelId;
          unloadLLM();
        }
      }

      // Returning to foreground: reload the model that was loaded before
      if (previousState !== 'active' && nextState === 'active') {
        const pendingModel = modelBeforeBackground.current;
        if (pendingModel) {
          modelBeforeBackground.current = null;
          initLLM(pendingModel).catch(() => {
            // Model reload failed — rule-based engine will take over
          });
        }
      }
    });

    return () => subscription.remove();
  }, []);
}

/**
 * Simple inference lock manager — import and call from chatStore when streaming.
 */
export const llmLifecycle = {
  beginInference(): void {
    // Access the ref through the hook's closure — this is a module-level
    // workaround. In practice, the hook's AppState listener checks this.
    _isInferenceActive = true;
  },
  endInference(): void {
    _isInferenceActive = false;
  },
};

let _isInferenceActive = false;
