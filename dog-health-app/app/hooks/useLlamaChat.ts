import { useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { streamChat } from '../services/ai/llmService';
import { Dog } from '../types';

type Message = { role: 'user' | 'assistant'; content: string };

const MAX_HISTORY_MESSAGES = 20;
const CHAT_HISTORY_KEY = 'ai-chat-history';
const SEARCH_PREFIX = '/search ';

export function useLlamaChat(activeDog?: Dog | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const historyRef = useRef<Message[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(CHAT_HISTORY_KEY).then((raw) => {
      if (raw) {
        const saved: Message[] = JSON.parse(raw);
        historyRef.current = saved;
        setMessages(saved);
      }
      loadedRef.current = true;
    });
  }, []);

  const persistHistory = useCallback((msgs: Message[]) => {
    const trimmed = msgs.slice(-MAX_HISTORY_MESSAGES);
    AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed));
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (isGenerating) return;
    let forceWebSearch = false;
    let cleanText = text;
    if (text.startsWith(SEARCH_PREFIX)) {
      forceWebSearch = true;
      cleanText = text.slice(SEARCH_PREFIX.length).trim();
      if (!cleanText) return;
    }
    const userMsg: Message = { role: 'user', content: cleanText };
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
        {
          dog: activeDog ?? null,
          forceWebSearch,
          onSearchingChange: setIsSearching,
        },
      );
      historyRef.current = [...historyRef.current, { role: 'assistant', content: full }];
      if (historyRef.current.length > MAX_HISTORY_MESSAGES) {
        historyRef.current = historyRef.current.slice(-MAX_HISTORY_MESSAGES);
      }
      persistHistory(historyRef.current);
    } catch (e) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'assistant' && last.content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
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
      setIsSearching(false);
      abortRef.current = null;
    }
  }, [isGenerating, persistHistory, activeDog]);

  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    historyRef.current = [];
    AsyncStorage.removeItem(CHAT_HISTORY_KEY);
  }, []);

  return { messages, sendMessage, isGenerating, isSearching, clearMessages, cancelGeneration };
}
