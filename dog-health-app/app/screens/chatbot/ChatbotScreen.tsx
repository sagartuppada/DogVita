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
import { colors, spacing, borderRadius } from '../../theme';
import type { ChatbotTabScreenProps } from '../../navigation/types';
import type { ChatMessage } from '../../services/ai';

const QUICK_ACTIONS = [
  { icon: 'fitness-outline', label: 'Diet', screen: 'DietFeeding' as const, color: colors.status.success },
  { icon: 'medkit-outline', label: 'Symptoms', screen: 'SymptomChecker' as const, color: colors.status.error },
  { icon: 'restaurant-outline', label: 'Calories', screen: 'DietFeeding' as const, color: colors.primary.DEFAULT },
  { icon: 'paw-outline', label: 'Profile', screen: 'DogProfile' as const, color: colors.status.info },
];

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAI]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="paw" size={12} color={colors.white} />
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

export default function ChatbotScreen({ navigation }: ChatbotTabScreenProps<'Chatbot'>) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');

  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isTyping);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const loadInitialGreeting = useChatStore((s) => s.loadInitialGreeting);
  const clearMessages = useChatStore((s) => s.clearMessages);

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
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isTyping]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    sendMessage(text, context);
  }, [inputText, context, sendMessage]);

  const handleQuickReply = useCallback(
    (reply: string) => {
      sendMessage(reply, context);
    },
    [context, sendMessage],
  );

  const handleQuickAction = useCallback(
    (screen: string) => {
      if (screen === 'DogProfile' && activeDog) {
        navigation.getParent()?.navigate('DogProfile', { dogId: activeDog.id });
      } else {
        navigation.getParent()?.navigate(screen as any);
      }
    },
    [activeDog, navigation],
  );

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
            <Ionicons name="sparkles" size={16} color={colors.primary.DEFAULT} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>AI Health Assistant</Text>
            <Text style={styles.headerSubtitle}>
              {activeDog ? `Helping with ${activeDog.name}` : 'Ask anything about dog health'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearMessages} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={18} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsRow}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.quickActionBtn}
            onPress={() => handleQuickAction(action.screen)}
            activeOpacity={0.7}
          >
            <Ionicons name={action.icon as any} size={16} color={action.color} />
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
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
          isTyping ? (
            <View style={styles.typingRow}>
              <View style={styles.aiAvatarSmall}>
                <Ionicons name="paw" size={10} color={colors.white} />
              </View>
              <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
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
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about nutrition, exercise, health..."
            placeholderTextColor={colors.text.tertiary}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isTyping}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
        <View style={{ height: insets.bottom }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
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
    backgroundColor: colors.primary.DEFAULT + '18',
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
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.text.tertiary,
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
    borderBottomColor: colors.border.light,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.primary,
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
    backgroundColor: colors.primary.DEFAULT,
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
    backgroundColor: colors.primary.DEFAULT,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.background.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userBubbleText: {
    color: colors.white,
  },
  aiBubbleText: {
    color: colors.text.primary,
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
    backgroundColor: colors.primary.DEFAULT,
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
    borderTopColor: colors.border.light,
  },
  quickReplyBtn: {
    backgroundColor: colors.primary.DEFAULT + '10',
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT + '30',
  },
  quickReplyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.DEFAULT,
  },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.page,
    paddingTop: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text.primary,
    fontSize: 14,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginRight: spacing.sm,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.border.light,
  },
});
