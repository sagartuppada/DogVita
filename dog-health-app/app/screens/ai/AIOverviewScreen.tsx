/**
 * AIOverviewScreen - AI hub / landing page for all AI features
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { useChatStore } from '../../store/chatStore';
import { isLLMAvailable } from '../../services/ai/llmService';
import { spacing, borderRadius } from '../../theme';
import type { AIOverviewTabScreenProps } from '../../navigation/types';


type Props = AIOverviewTabScreenProps<'AIOverview'>;

const FEATURE_CARDS = [
  {
    id: 'chat',
    title: 'Chat with AI',
    subtitle: 'Ask anything about your dog\'s health, nutrition, or behavior',
    icon: 'chatbubble-ellipses' as const,
    color: '#F3A93B',
    bgColor: '#F3A93B18',
    borderColor: '#F3A93B40',
    screen: 'Chatbot' as const,
  },
  {
    id: 'symptoms',
    title: 'Symptom Checker',
    subtitle: 'Select symptoms to check possible conditions',
    icon: 'medkit-outline' as const,
    color: '#F44336',
    bgColor: '#F4433612',
    borderColor: '#F4433630',
    screen: 'SymptomChecker' as const,
  },
  {
    id: 'diet',
    title: 'Diet & Feeding',
    subtitle: 'Calorie calculator, diet plan & feeding schedule',
    icon: 'restaurant-outline' as const,
    color: '#4CAF50',
    bgColor: '#4CAF5012',
    borderColor: '#4CAF5030',
    screen: 'DietFeeding' as const,
  },
] as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1F1A17',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#A39888',
    marginTop: 4,
    lineHeight: 20,
  },
  heroCard: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.lg,
    backgroundColor: '#F3A93B',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 88,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  heroArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A39888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.page,
    marginBottom: spacing.sm,
  },
  featuresRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.page,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F1A17',
    textAlign: 'center',
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.page,
    marginBottom: spacing.sm,
  },
  recentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A39888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F3A93B',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.page,
    backgroundColor: '#FBF4E4',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3A93B15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F1A17',
    marginBottom: 2,
  },
  sessionMeta: {
    fontSize: 12,
    color: '#A39888',
  },
  emptySessions: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.page,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3A93B10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F1A17',
    marginBottom: 2,
  },
  emptyText: {
    fontSize: 12,
    color: '#A39888',
    textAlign: 'center',
  },
  tipsCard: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.lg,
    backgroundColor: '#FBF4E4',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F1A17',
    marginBottom: spacing.xs,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: 12,
    color: '#6B625A',
    flex: 1,
    lineHeight: 18,
  },
});

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AIOverviewScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const sessions = useChatStore((s) => s.sessions);
  const llmStatus = useChatStore((s) => s.llmStatus);

  const activeDog = dogs.find((d) => d.id === activeDogId) ?? null;

  const recentSessions = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3),
    [sessions],
  );

  const navigateTo = (screen: string) => {
    navigation.getParent()?.navigate(screen);
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hi{activeDog ? `, ${activeDog.name}` : ''} 🐾
        </Text>
        <Text style={styles.subtitle}>
          How can I help today?
        </Text>
      </View>

      {/* Hero CTA - Chat with AI */}
      <TouchableOpacity
        style={styles.heroCard}
        activeOpacity={0.85}
        onPress={() => navigateTo('Chatbot')}
      >
        <View style={styles.heroIconWrap}>
          <Ionicons name="chatbubble-ellipses" size={26} color="#FFFFFF" />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Chat with AI</Text>
          <Text style={styles.heroSubtitle}>
            {isLLMAvailable()
              ? llmStatus === 'ready'
                ? 'Powered by local AI • No internet needed'
                : llmStatus === 'loading'
                  ? 'Loading local AI model...'
                  : 'Ask about nutrition, symptoms, exercise, or anything dog-related'
              : 'Ask about nutrition, symptoms, exercise, or anything dog-related'}
          </Text>
        </View>
        <View style={styles.heroArrow}>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Quick Tools */}
      <Text style={styles.sectionLabel}>AI Tools</Text>
      <View style={styles.featuresRow}>
        {FEATURE_CARDS.filter((f) => f.id !== 'chat').map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={[styles.featureCard, { backgroundColor: feature.bgColor, borderColor: feature.borderColor }]}
            activeOpacity={0.7}
            onPress={() => navigateTo(feature.screen)}
          >
            <View style={[styles.featureIcon, { backgroundColor: feature.bgColor }]}>
              <Ionicons name={feature.icon} size={22} color={feature.color} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Tips */}
      <View style={styles.tipsCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs }}>
          <Ionicons name="bulb-outline" size={16} color="#F3A93B" />
          <Text style={styles.tipsTitle}>Quick Tips</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="paw-outline" size={14} color="#F3A93B" style={{ marginTop: 1 }} />
          <Text style={styles.tipText}>Log your dog's weight regularly for accurate diet calculations</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="heart-outline" size={14} color="#F44336" style={{ marginTop: 1 }} />
          <Text style={styles.tipText}>Use the Symptom Checker at the first sign of unusual behavior</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="chatbubble-outline" size={14} color="#5B9BD5" style={{ marginTop: 1 }} />
          <Text style={styles.tipText}>Ask the AI assistant for personalized health advice anytime</Text>
        </View>
      </View>

      {/* Recent Conversations */}
      {recentSessions.length > 0 && (
        <>
          <View style={styles.recentHeader}>
            <Text style={styles.recentLabel}>Recent Conversations</Text>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigation.getParent()?.navigate('ChatHistory')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color="#F3A93B" />
            </TouchableOpacity>
          </View>
          {recentSessions.map((session) => {
            const msgCount = session.messages.filter((m) => m.role === 'user').length;
            return (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                activeOpacity={0.7}
                onPress={() => navigation.getParent()?.navigate('Chatbot')}
              >
                <View style={styles.sessionIcon}>
                  <Ionicons name="chatbubble" size={16} color="#F3A93B" />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle} numberOfLines={1}>
                    {session.title}
                  </Text>
                  <Text style={styles.sessionMeta}>
                    {formatRelativeTime(session.updatedAt)} · {msgCount} message{msgCount !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#A39888" />
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Empty state for no sessions */}
      {recentSessions.length === 0 && (
        <View style={styles.emptySessions}>
          <View style={styles.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={22} color="#F3A93B" />
          </View>
          <Text style={styles.emptyTitle}>Start a conversation</Text>
          <Text style={styles.emptyText}>
            Tap "Chat with AI" to ask about your dog's health, diet, or behavior
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
