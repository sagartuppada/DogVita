import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable,
  Clipboard,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { isModelDownloaded, downloadModel } from '../../services/ai/modelManager';
import { loadModel } from '../../services/ai/llmService';
import { useLlamaChat } from '../../hooks/useLlamaChat';
import { spacing, borderRadius, colors, typography, shadows } from '../../theme';

const SUGGESTIONS = [
  'How much should I feed my dog?',
  'Check heart rate',
  'Activity summary',
  'Any alerts?',
];

function TypingIndicator() {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.typingRow}>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={[styles.typingDot, { opacity: pulse, transform: [{ scale: pulse }] }]}
        />
      ))}
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const activeDog = useMemo(() => dogs.find((d) => d.id === activeDogId) ?? null, [dogs, activeDogId]);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { messages, sendMessage, isGenerating, isSearching, clearMessages, cancelGeneration } = useLlamaChat(activeDog);
  const [input, setInput] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const flatListRef = React.useRef<FlatList>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback((text: string, index: number) => {
    Clipboard.setString(text);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    setCopiedIdx(index);
    copiedTimerRef.current = setTimeout(() => setCopiedIdx(null), 1500);
  }, []);

  const initModel = React.useCallback(async () => {
    setError(null);
    setProgress(0);
    try {
      if (!(await isModelDownloaded())) {
        await downloadModel(setProgress);
      }
      await loadModel();
      setReady(true);
    } catch (e) {
      const msg = (e as Error).message || 'Failed to load model';
      setError(msg);
    }
  }, []);

  useEffect(() => {
    initModel();
  }, [initModel]);

  const scrollToBottom = React.useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleSendDirect = async (text: string) => {
    if (isGenerating) return;
    setInput('');
    setSendError(null);
    try {
      await sendMessage(text);
    } catch (e) {
      const msg = (e as Error).message || 'Generation failed';
      if (!msg.includes('cancelled')) {
        setSendError(msg);
      }
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isGenerating) return;
    setInput('');
    setSendError(null);
    try {
      await sendMessage(text);
    } catch (e) {
      const msg = (e as Error).message || 'Generation failed';
      if (!msg.includes('cancelled')) {
        setSendError(msg);
      }
    }
  };

  if (!ready) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        {error ? (
          <>
            <Ionicons name="alert-circle-outline" size={48} color={colors.status.error} />
            <Text style={[styles.loadingText, { color: colors.status.error, marginTop: spacing.md }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={initModel}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={20} color={colors.text.inverse} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            <Text style={styles.loadingText}>
              {progress > 0
                ? `Downloading model… ${Math.round(progress * 100)}%`
                : 'Preparing offline model…'}
            </Text>
            {progress > 0 && (
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            )}
          </>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        ListHeaderComponent={
          isSearching ? (
            <View style={styles.searchingBanner}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.searchingText}>Searching the web…</Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <Pressable
            onLongPress={() => item.content && handleCopy(item.content, index)}
            delayLongPress={400}
          >
            <View
              style={[
                styles.messageBubble,
                item.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {item.role === 'user' ? (
                <Text style={[styles.messageText, styles.userText]}>
                  {item.content}
                </Text>
              ) : item.content === '' ? (
                <TypingIndicator />
              ) : (
                <Text style={[styles.messageText, styles.assistantText]}>{item.content}</Text>
              )}
              {copiedIdx === index && item.content !== '' && (
                <View style={styles.copiedBadge}>
                  <Text style={styles.copiedText}>Copied!</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.primary.DEFAULT} />
            <Text style={styles.emptyTitle}>Ask about your dog</Text>
            <Text style={styles.emptySubtitle}>
              Nutrition, exercise, behavior, health — anything goes.
            </Text>
            <View style={styles.chipContainer}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.chip}
                  onPress={() => handleSendDirect(s)}
                  disabled={isGenerating}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
/>
      
      {/* Suggestion Chips */}
      {messages.length === 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsRow}>
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => handleSendDirect(s)} disabled={isGenerating} activeOpacity={0.7}>
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {sendError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#F44336" />
          <Text style={styles.errorText} numberOfLines={2}>{sendError}</Text>
          <TouchableOpacity onPress={() => setSendError(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color="#F44336" />
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing.sm }]}>
        {messages.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearMessages}
            disabled={isGenerating}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={28} color={isGenerating ? colors.text.disabled : colors.primary.DEFAULT} />
          </TouchableOpacity>
        )}
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your dog…"
          placeholderTextColor={colors.text.disabled}
          editable={!isGenerating}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        {isGenerating ? (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={cancelGeneration}
            activeOpacity={0.7}
          >
            <Ionicons name="stop-circle" size={24} color={colors.status.error} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-up-circle"
              size={24}
              color={!input.trim() ? colors.text.disabled : colors.primary.DEFAULT}
            />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.base,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.styles.bodyMD,
    color: colors.text.secondary,
  },
  progressBar: {
    width: 200,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.light,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 2,
  },
  messagesList: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary.DEFAULT,
    borderBottomRightRadius: 8,
    ...shadows.sm,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background.elevated,
    borderBottomLeftRadius: 8,
    ...shadows.sm,
  },
  messageText: {
    ...typography.styles.bodyMD,
    lineHeight: 22,
  },
  userText: {
    color: colors.text.inverse,
  },
  assistantText: {
    color: colors.text.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  emptyTitle: {
    ...typography.styles.headingSM,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.styles.bodyMD,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.page,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border.DEFAULT,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    backgroundColor: colors.primary.DEFAULT,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: borderRadius.pill,
  },
  retryText: {
    ...typography.styles.bodyMD,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.page,
    marginBottom: spacing.xs,
    backgroundColor: 'rgba(244, 67, 54, 0.07)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  errorText: {
    flex: 1,
    ...typography.styles.bodySM,
    color: colors.status.error,
  },
  clearButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  chip: {
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  chipText: {
    ...typography.styles.bodySM,
    color: colors.primary.dark,
    fontWeight: '500',
  },
  suggestionsRow: {
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  suggestionChip: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    ...shadows.sm,
  },
  suggestionText: {
    ...typography.styles.bodySM,
    color: colors.text.primary,
    fontWeight: '500',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text.disabled,
  },
  copiedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  copiedText: {
    ...typography.styles.caption,
    fontWeight: '600' as const,
    color: colors.text.inverse,
  },
  searchingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.text.tertiary,
    borderRadius: borderRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
  },
  searchingText: {
    ...typography.styles.bodySM,
    color: colors.text.inverse,
    fontWeight: '500' as const,
  },
});
