/**
 * Chat store - manages AI chat message history with sessions
 * v4: Added conversation sessions, history management, voice state, multi-turn context
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiService, ChatMessage } from '../services/ai';
import { isLLMAvailable, getLLMStatus, initLLM, generateStreamResponse, LLMStatus } from '../services/ai/llmService';
import { llmLifecycle } from '../hooks/useLLMLifecycle';

// Guard against duplicate eager-init intervals
let _eagerInitStarted = false;

const MAX_PERSISTED_MESSAGES = 200;
const MAX_SESSIONS = 50;

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  dogName?: string;
}

interface ChatState {
  // Current active session
  messages: ChatMessage[];
  isTyping: boolean;
  isStreaming: boolean;
  streamingContent: string;
  isVoiceListening: boolean;
  // All sessions (for history)
  sessions: ChatSession[];
  currentSessionId: string | null;
  // LLM model status
  llmStatus: LLMStatus;
}

interface ChatActions {
  sendMessage: (content: string, context: Parameters<typeof aiService.sendMessage>[1]) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  loadInitialGreeting: (context: Parameters<typeof aiService.getInitialGreeting>[0]) => void;
  setVoiceListening: (listening: boolean) => void;
  /** Eagerly init the LLM when chat screen opens. Polls status until ready. */
  initModelEagerly: () => void;
  // Session management
  startNewSession: (dogName?: string) => void;
  loadSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  searchSessions: (query: string) => ChatSession[];
  exportSession: (sessionId: string) => string;
}

type ChatStore = ChatState & ChatActions;

function generateSessionTitle(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === 'user');
  if (firstUserMsg) {
    const content = firstUserMsg.content;
    return content.length > 40 ? content.substring(0, 40) + '...' : content;
  }
  return 'New conversation';
}

function saveCurrentSession(state: ChatState): ChatSession[] {
  if (state.messages.length === 0) return state.sessions;

  const session: ChatSession = {
    id: state.currentSessionId ?? `session_${Date.now()}`,
    title: generateSessionTitle(state.messages),
    messages: state.messages,
    createdAt: state.sessions.find((s) => s.id === state.currentSessionId)?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existing = state.sessions.filter((s) => s.id !== session.id);
  const updated = [session, ...existing].slice(0, MAX_SESSIONS);
  return updated;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isTyping: false,
      isStreaming: false,
      streamingContent: '',
      isVoiceListening: false,
      sessions: [],
      currentSessionId: null,
      llmStatus: getLLMStatus(),

      sendMessage: (content, context) => {
        const userMessage: ChatMessage = {
          id: `user_${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          isTyping: true,
        }));

        const currentState = get();
        if (!currentState.currentSessionId) {
          set({ currentSessionId: `session_${Date.now()}` });
        }

        const currentStatus = getLLMStatus();
        set({ llmStatus: currentStatus });

        if (currentStatus === 'ready') {
          // LLM ready — stream response
          const { messages } = get();
          const recentHistory = messages.slice(-10).map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));
          recentHistory.push({ role: 'user', content });

          const streamingMsgId = `stream_${Date.now()}`;
          set({ isStreaming: true, streamingContent: '', isTyping: false });
          llmLifecycle.beginInference();

          generateStreamResponse(
            recentHistory,
            aiService.buildDogContextSummary(context),
            (token: string) => {
              set((state) => ({
                streamingContent: state.streamingContent + token,
              }));
            },
          ).then((llmResponse) => {
            const finalContent = llmResponse || '[No response from model]';
            const aiMessage: ChatMessage = {
              id: streamingMsgId,
              role: 'assistant',
              content: finalContent,
              timestamp: new Date().toISOString(),
            };
            set((state) => {
              const updated = [...state.messages, aiMessage];
              const trimmed = updated.length > MAX_PERSISTED_MESSAGES
                ? updated.slice(updated.length - MAX_PERSISTED_MESSAGES) : updated;
              llmLifecycle.endInference();
              const newSessions = saveCurrentSession({ ...state, messages: trimmed });
              return {
                messages: trimmed,
                isTyping: false,
                isStreaming: false,
                streamingContent: '',
                sessions: newSessions,
              };
            });
          }).catch(() => {
            llmLifecycle.endInference();
            set({ isTyping: false, isStreaming: false, streamingContent: '' });
          });
        } else {
          // LLM not ready — try to initialize, then retry
          const llmPromise = initLLM('gemma-4-e2b');
          const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 30000));
          Promise.race([llmPromise, timeoutPromise]).then((ready) => {
            set({ llmStatus: getLLMStatus() });
            if (ready) {
              get().sendMessage(content, context);
            } else {
              // LLM failed — show error message
              const errorMsg: ChatMessage = {
                id: `err_${Date.now()}`,
                role: 'assistant',
                content: 'AI model failed to load. Please check device storage and memory, then restart the app.',
                timestamp: new Date().toISOString(),
              };
              set((state) => {
                const updated = [...state.messages, errorMsg];
                const trimmed = updated.length > MAX_PERSISTED_MESSAGES
                  ? updated.slice(updated.length - MAX_PERSISTED_MESSAGES) : updated;
                const newSessions = saveCurrentSession({ ...state, messages: trimmed });
                return { messages: trimmed, isTyping: false, sessions: newSessions };
              });
            }
          });
        }
      },

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      initModelEagerly: () => {
        const current = get().llmStatus;
        console.log('[chatStore] initModelEagerly called, status:', current, 'llmAvailable:', isLLMAvailable());
        if (current === 'ready') return;
        if (!isLLMAvailable()) {
          console.log('[chatStore] LLM not available — skipping init');
          return;
        }
        if (_eagerInitStarted) return;
        _eagerInitStarted = true;

        // Start init in background — don't block UI
        const llmPromise = initLLM('gemma-4-e2b');
        const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 30000));
        Promise.race([llmPromise, timeoutPromise]).then(() => {
          set({ llmStatus: getLLMStatus() });
        });

        // Poll status every 1s so UI badges update
        const poll = setInterval(() => {
          const status = getLLMStatus();
          set({ llmStatus: status });
          if (status === 'ready' || status === 'error' || status === 'unavailable') {
            clearInterval(poll);
          }
        }, 1000);
      },

      clearMessages: () => {
        aiService.resetContext();
        // Save current session before clearing
        const state = get();
        const newSessions = saveCurrentSession(state);
        set({
          messages: [],
          isStreaming: false,
          streamingContent: '',
          sessions: newSessions,
          currentSessionId: null,
        });
      },

      loadInitialGreeting: (context) => {
        const greeting = aiService.getInitialGreeting(context);
        set({ messages: [greeting] });
      },

      setVoiceListening: (listening) => set({ isVoiceListening: listening }),

      startNewSession: (dogName) => {
        // Save current session
        const state = get();
        const newSessions = saveCurrentSession(state);
        set({
          messages: [],
          sessions: newSessions,
          currentSessionId: null,
        });
        // Load greeting for new session
        if (dogName) {
          const greeting = aiService.getInitialGreeting({
            dog: null,
            latestWeight: null,
            vaccinations: [],
          });
          set({ messages: [greeting] });
        }
      },

      loadSession: (sessionId) => {
        const state = get();
        const session = state.sessions.find((s) => s.id === sessionId);
        if (session) {
          set({
            messages: session.messages,
            currentSessionId: session.id,
          });
        }
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
          messages: state.currentSessionId === sessionId ? [] : state.messages,
        }));
      },

      searchSessions: (query) => {
        const { sessions } = get();
        const lower = query.toLowerCase();
        return sessions.filter(
          (s) =>
            s.title.toLowerCase().includes(lower) ||
            s.messages.some((m) => m.content.toLowerCase().includes(lower)),
        );
      },

      exportSession: (sessionId) => {
        const { sessions } = get();
        const session = sessions.find((s) => s.id === sessionId);
        if (!session) return '';

        let exportText = `# DogVita Chat — ${session.title}\n`;
        exportText += `Date: ${new Date(session.createdAt).toLocaleDateString()}\n\n`;

        for (const msg of session.messages) {
          const role = msg.role === 'user' ? 'You' : 'DogVita';
          const time = new Date(msg.timestamp).toLocaleTimeString();
          exportText += `**${role}** (${time}):\n${msg.content}\n\n`;
        }

        return exportText;
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        messages: state.messages,
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);

export const selectMessages = (state: ChatStore) => state.messages;
