/**
 * Chat store - manages AI chat message history
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiService, ChatMessage } from '../services/ai';

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
}

interface ChatActions {
  sendMessage: (content: string, context: Parameters<typeof aiService.sendMessage>[1]) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  loadInitialGreeting: (context: Parameters<typeof aiService.getInitialGreeting>[0]) => void;
}

type ChatStore = ChatState & ChatActions;

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isTyping: false,

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

        // Simulate AI response with slight delay for realism
        setTimeout(() => {
          const aiResponse = aiService.sendMessage(content, context);
          set((state) => ({
            messages: [...state.messages, aiResponse],
            isTyping: false,
          }));
        }, 600);
      },

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      clearMessages: () => set({ messages: [] }),

      loadInitialGreeting: (context) => {
        const greeting = aiService.getInitialGreeting(context);
        set({ messages: [greeting] });
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);

export const selectMessages = (state: ChatStore) => state.messages;
