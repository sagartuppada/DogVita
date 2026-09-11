/**
 * AIOverviewScreen - AI hub / landing page for all AI features
 */

import React from 'react';
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
import { spacing, borderRadius } from '../../theme';
import type { AIOverviewTabScreenProps } from '../../navigation/types';

type Props = AIOverviewTabScreenProps<'AIOverview'>;

const FEATURE_CARDS = [
  {
    id: 'chat',
    title: 'Chat with AI',
    subtitle: 'Ask anything about your dog\'s health, nutrition, or behavior',
    icon: 'chatbubble-ellipses' as const,
    color: '#16A34A',
    bgColor: '#16A34A18',
    borderColor: '#16A34A40',
    screen: 'Chat' as const,
  },
  {
    id: 'symptoms',
    title: 'Symptom Checker',
    subtitle: 'Select symptoms to check possible conditions',
    icon: 'medkit-outline' as const,
    color: '#EF4444',
    bgColor: '#EF444412',
    borderColor: '#EF444430',
    screen: 'SymptomChecker' as const,
  },
  {
    id: 'diet',
    title: 'Diet & Feeding',
    subtitle: 'Calorie calculator, diet plan & feeding schedule',
    icon: 'restaurant-outline' as const,
    color: '#22C55E',
    bgColor: '#22C55E12',
    borderColor: '#22C55E30',
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
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 20,
  },
  heroCard: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.lg,
    backgroundColor: '#16A34A',
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
    color: '#9CA3AF',
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
    color: '#111827',
    textAlign: 'center',
  },
  tipsCard: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
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
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },
});

export default function AIOverviewScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const activeDog = dogs.find((d) => d.id === activeDogId) ?? null;

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
        onPress={() => navigateTo('Chat')}
      >
        <View style={styles.heroIconWrap}>
          <Ionicons name="chatbubble-ellipses" size={26} color="#FFFFFF" />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>Chat with AI</Text>
          <Text style={styles.heroSubtitle}>
            Ask about nutrition, symptoms, exercise, or anything dog-related
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
          <Ionicons name="bulb-outline" size={16} color="#16A34A" />
          <Text style={styles.tipsTitle}>Quick Tips</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="paw-outline" size={14} color="#16A34A" style={{ marginTop: 1 }} />
          <Text style={styles.tipText}>Log your dog's weight regularly for accurate diet calculations</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="heart-outline" size={14} color="#EF4444" style={{ marginTop: 1 }} />
          <Text style={styles.tipText}>Use the Symptom Checker at the first sign of unusual behavior</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="chatbubble-outline" size={14} color="#3B82F6" style={{ marginTop: 1 }} />
          <Text style={styles.tipText}>Ask the AI assistant for personalized health advice anytime</Text>
        </View>
      </View>
    </ScrollView>
  );
}
