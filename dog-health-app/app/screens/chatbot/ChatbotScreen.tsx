/**
 * ChatbotScreen - AI health assistant chat
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { useChatStore } from '../../store/chatStore';
import { useTrackingStore } from '../../store/trackingStore';
import { useHealthStore } from '../../store/healthStore';
import { spacing, borderRadius } from '../../theme';
import { isSTTAvailable, isTTSAvailable, startListening, stopListening, speak, stopSpeaking } from '../../services/ai/voiceService';
import type { ChatbotScreenProps } from '../../navigation/types';
import type { ChatMessage } from '../../services/ai';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8D8',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3A93B18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F1A17',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A39888',
    marginTop: 1,
  },
  clearBtn: {
    padding: spacing.xs,
  },
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8D8',
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF4E4',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 4,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F1A17',
  },
  messagesFlex: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    maxWidth: '82%',
  },
  bubbleRowUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  bubbleRowAI: {
    alignSelf: 'flex-start',
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3A93B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
    marginTop: 2,
  },
  bubble: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  userBubble: {
    backgroundColor: '#F3A93B',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FBF4E4',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userBubbleText: {
    color: '#FFFFFF',
  },
  aiBubbleText: {
    color: '#1F1A17',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  aiAvatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3A93B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  quickRepliesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F0E8D8',
  },
  quickReplyBtn: {
    backgroundColor: '#F3A93B10',
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: '#F3A93B30',
  },
  quickReplyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F3A93B',
  },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: '#F0E8D8',
    backgroundColor: '#F5E9CD',
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.page,
    paddingTop: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FBF4E4',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: '#1F1A17',
    fontSize: 14,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    marginRight: spacing.sm,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3A93B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#F0E8D8',
  },
  voiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FBF4E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  voiceBtnActive: {
    backgroundColor: '#F4433620',
    borderColor: '#F44336',
  },
  ttsBtn: {
    padding: spacing.xs,
  },
});

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="paw" size={12} color="#FFFFFF" />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.bubbleText, isUser ? styles.userBubbleText : styles.aiBubbleText]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
};

export default function ChatbotScreen({ navigation }: ChatbotScreenProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');

  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isTyping);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const loadInitialGreeting = useChatStore((s) => s.loadInitialGreeting);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const startNewSession = useChatStore((s) => s.startNewSession);
  const isVoiceListening = useChatStore((s) => s.isVoiceListening);
  const setVoiceListening = useChatStore((s) => s.setVoiceListening);

  const llmStatus = useChatStore((s) => s.llmStatus);
  const initModelEagerly = useChatStore((s) => s.initModelEagerly);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  // Eagerly init LLM when chat screen opens — model loads in background
  useEffect(() => {
    initModelEagerly();
  }, []);

  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const weightHistory = useDogStore((s) => s.weightHistory);
  const vaccinationRecords = useDogStore((s) => s.vaccinationRecords);
  const currentMetrics = useHealthStore((s) => s.currentMetrics);

  const activeDog = dogs.find((d) => d.id === activeDogId) ?? null;
  const latestWeight = weightHistory
    .filter((w) => w.dogId === activeDogId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] ?? null;
  const dogVaccinations = vaccinationRecords.filter((v) => v.dogId === activeDogId);
  const metrics = activeDogId ? currentMetrics[activeDogId] : null;

  const context = {
    dog: activeDog,
    latestWeight,
    vaccinations: dogVaccinations,
    recentActivity: metrics?.activity
      ? { steps: metrics.activity.steps, activeMinutes: metrics.activity.activeMinutes }
      : undefined,
  };



  useEffect(() => {
    if (messages.length === 0) {
      loadInitialGreeting(context);
    }
  }, []);

  useEffect(() => {
    if (flatListRef.current && (messages.length > 0 || isStreaming)) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isTyping, isStreaming, streamingContent]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    sendMessage(text, context);
    // Speak AI response if TTS enabled
    if (ttsEnabled) {
      setTimeout(() => {
        const msgs = useChatStore.getState().messages;
        const lastAI = [...msgs].reverse().find((m) => m.role === 'assistant');
        if (lastAI) speak(lastAI.content);
      }, 800);
    }
  }, [inputText, context, sendMessage, ttsEnabled]);

  const handleQuickReply = useCallback(
    (reply: string) => {
      sendMessage(reply, context);
    },
    [context, sendMessage],
  );

  const handleVoiceInput = useCallback(async () => {
    if (isVoiceListening) {
      await stopListening();
      setVoiceListening(false);
      return;
    }
    const started = await startListening(
      (text) => {
        setVoiceListening(false);
        setInputText(text);
        // Auto-send after voice input
        sendMessage(text, context);
      },
      (partial) => setInputText(partial),
    );
    if (started) setVoiceListening(true);
  }, [isVoiceListening, context, sendMessage, setVoiceListening]);

  const handleNewChat = useCallback(() => {
    startNewSession(activeDog?.name);
  }, [startNewSession, activeDog]);



  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    return <MessageBubble message={item} />;
  }, []);

  const lastMessage = messages[messages.length - 1];
  const quickReplies = lastMessage?.role === 'assistant' ? lastMessage.quickReplies : undefined;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerLeft}>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={16} color="#F3A93B" />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>AI Health Assistant</Text>
            <Text style={styles.headerSubtitle}>
              {activeDog ? `Helping with ${activeDog.name}` : 'Ask anything about dog health'}
              {llmStatus === 'ready' ? ' • Local AI' : llmStatus === 'loading' ? ' • Loading model...' : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleNewChat} style={styles.clearBtn}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#A39888" />
        </TouchableOpacity>
        <TouchableOpacity onPress={clearMessages} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={18} color="#A39888" />
        </TouchableOpacity>
      </View>



      {/* Messages - takes remaining space */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        style={styles.messagesFlex}
        ListFooterComponent={
          isStreaming ? (
            <View style={[styles.bubbleRow, styles.bubbleRowAI]}>
              <View style={styles.aiAvatar}>
                <Ionicons name="paw" size={12} color="#FFFFFF" />
              </View>
              <View style={[styles.bubble, styles.aiBubble]}>
                <Text style={[styles.bubbleText, styles.aiBubbleText]}>
                  {streamingContent || '...'}{'\u2588'}
                </Text>
              </View>
            </View>
          ) : isTyping ? (
            <View style={styles.typingRow}>
              <View style={styles.aiAvatarSmall}>
                <Ionicons name="paw" size={10} color="#FFFFFF" />
              </View>
              <ActivityIndicator size="small" color="#F3A93B" />
            </View>
          ) : null
        }
      />

      {/* Quick Replies */}
      {quickReplies && quickReplies.length > 0 && (
        <View style={styles.quickRepliesRow}>
          {quickReplies.map((reply) => (
            <TouchableOpacity
              key={reply}
              style={styles.quickReplyBtn}
              onPress={() => handleQuickReply(reply)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickReplyLabel}>{reply}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input Bar - pinned above tab bar */}
      <View style={styles.inputBar}>
        <View style={styles.inputInner}>
          {isSTTAvailable() && (
            <TouchableOpacity
              style={[styles.voiceBtn, isVoiceListening && styles.voiceBtnActive]}
              onPress={handleVoiceInput}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isVoiceListening ? 'stop-circle' : 'mic'}
                size={20}
                color={isVoiceListening ? '#F44336' : '#A39888'}
              />
            </TouchableOpacity>
          )}
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={isVoiceListening ? 'Listening...' : 'Ask about nutrition, exercise, health...'}
            placeholderTextColor="#A39888"
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          {isTTSAvailable() && (
            <TouchableOpacity onPress={() => setTtsEnabled(!ttsEnabled)} style={styles.ttsBtn}>
              <Ionicons
                name={ttsEnabled ? 'volume-high' : 'volume-mute'}
                size={20}
                color={ttsEnabled ? '#F3A93B' : '#A39888'}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping || isStreaming}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={{ height: insets.bottom }} />
      </View>
    </View>
  );
}
