import { useState, useCallback, useRef } from 'react';
import { streamChat } from '../services/ai/llmService';

type Message = { role: 'user' | 'assistant'; content: string };

const MAX_HISTORY_MESSAGES = 20;

export function useLlamaChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const historyRef = useRef<Message[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (isGenerating) return;
    const userMsg: Message = { role: 'user', content: text };
    historyRef.current = [...historyRef.current, userMsg];
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setIsGenerating(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const full = await streamChat(
        historyRef.current,
        (token) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === 'assistant') {
              next[next.length - 1] = {
                role: 'assistant',
                content: last.content + token,
              };
            }
            return next;
          });
        },
        controller.signal,
      );
      historyRef.current = [...historyRef.current, { role: 'assistant', content: full }];
      // Trim history to keep context window manageable
      if (historyRef.current.length > MAX_HISTORY_MESSAGES) {
        historyRef.current = historyRef.current.slice(-MAX_HISTORY_MESSAGES);
      }
    } catch (e) {
      // Remove the orphan empty assistant message and user message from history on error
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && last.content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
      // Remove the trailing user message from history to prevent format issues
      if (historyRef.current.length > 0 &&
          historyRef.current[historyRef.current.length - 1].role === 'user') {
        historyRef.current = historyRef.current.slice(0, -1);
      }
      if (historyRef.current.length > MAX_HISTORY_MESSAGES) {
        historyRef.current = historyRef.current.slice(-MAX_HISTORY_MESSAGES);
      }
      throw e;
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, []);

  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    historyRef.current = [];
  }, []);

  return { messages, sendMessage, isGenerating, clearMessages, cancelGeneration };
}
