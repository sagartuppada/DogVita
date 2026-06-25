/**
 * DietFeedingScreen - Calorie calculator, diet recommendations, and smart feeding schedule
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { Card, Button } from '../../components/common';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { DietFeedingScreenProps } from '../../navigation/types';

interface FeedingSchedule {
  id: string;
  time: string;
  portion: number;
  portionUnit: 'g' | 'cups';
  foodType: string;
  enabled: boolean;
}

interface DietProfile {
  dailyCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbsGrams: number;
  fiberGrams: number;
  mealsPerDay: number;
  portionPerMeal: number;
  waterLiters: number;
  bodyCondition: 'underweight' | 'ideal' | 'overweight';
  recommendation: string;
}

const BODY_CONDITIONS = [
  { label: 'Very thin', score: 1, desc: 'Ribs, spine, and hip bones visible' },
  { label: 'Underweight', score: 2, desc: 'Ribs easily visible, minimal fat' },
  { label: 'Lean', score: 3, desc: 'Ribs palpable with slight fat cover' },
  { label: 'Ideal', score: 4, desc: 'Ribs palpable with thin fat layer' },
  { label: 'Overweight', score: 5, desc: 'Ribs difficult to feel, moderate fat' },
  { label: 'Obese', score: 6, desc: 'Ribs not palpable, heavy fat cover' },
];

const ACTIVITY_MULTIPLIERS = [
  { label: 'Sedentary', value: 1.0, desc: 'Indoor, minimal exercise' },
  { label: 'Low', value: 1.2, desc: 'Short walks, gentle play' },
  { label: 'Moderate', value: 1.4, desc: 'Regular walks, active play' },
  { label: 'High', value: 1.6, desc: 'Long runs, sports, working dog' },
  { label: 'Very High', value: 1.8, desc: 'Agility, hunting, intense training' },
];

const LIFE_STAGE_MULTIPLIERS: Record<string, number> = {
  puppy: 2.0,
  adolescent: 1.5,
  adult: 1.0,
  senior: 0.8,
  pregnant: 1.8,
  nursing: 4.0,
};

function calculateAgeStage(birthDate?: string): string {
  if (!birthDate) return 'adult';
  const months = Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (months < 4) return 'puppy';
  if (months < 12) return 'adolescent';
  if (months > 84) return 'senior';
  return 'adult';
}

function calculateDietProfile(
  weightKg: number,
  birthDate: string | undefined,
  activityLevel: number,
  bodyConditionScore: number
): DietProfile {
  const stage = calculateAgeStage(birthDate);
  const stageMultiplier = LIFE_STAGE_MULTIPLIERS[stage] || 1.0;

  // RER = 70 × (weight in kg)^0.75
  const rer = 70 * Math.pow(weightKg, 0.75);
  const dailyCalories = Math.round(rer * activityLevel * stageMultiplier);

  // Body condition adjustment
  let adjustedCalories = dailyCalories;
  if (bodyConditionScore <= 2) adjustedCalories = Math.round(dailyCalories * 1.2); // gain weight
  else if (bodyConditionScore >= 5) adjustedCalories = Math.round(dailyCalories * 0.8); // lose weight

  // Macronutrients (rough estimates for standard dog food)
  const proteinGrams = Math.round(adjustedCalories * 0.25 / 4); // 25% protein
  const fatGrams = Math.round(adjustedCalories * 0.15 / 9); // 15% fat
  const carbsGrams = Math.round(adjustedCalories * 0.45 / 4); // 45% carbs
  const fiberGrams = Math.round(weightKg * 1.5); // ~1.5g per kg

  const mealsPerDay = stage === 'puppy' ? 4 : stage === 'adolescent' ? 3 : stage === 'senior' ? 2 : 2;
  const portionPerMeal = Math.round(adjustedCalories / mealsPerDay);
  const waterLiters = Math.round(weightKg * 0.06 * 10) / 10; // ~60ml per kg

  const bodyCondition = bodyConditionScore <= 2 ? 'underweight' : bodyConditionScore >= 5 ? 'overweight' : 'ideal';

  let recommendation = '';
  if (bodyCondition === 'underweight') {
    recommendation = 'Increase food portions gradually. Add high-calorie supplements. Consider more frequent meals.';
  } else if (bodyCondition === 'overweight') {
    recommendation = 'Reduce portions by 20%. Increase exercise. Consider weight management formula. No treats.';
  } else {
    recommendation = 'Maintain current diet and exercise. Monitor weight monthly. Adjust portions seasonally.';
  }

  return {
    dailyCalories: adjustedCalories,
    proteinGrams,
    fatGrams,
    carbsGrams,
    fiberGrams,
    mealsPerDay,
    portionPerMeal,
    waterLiters,
    bodyCondition,
    recommendation,
  };
}

const DEFAULT_SCHEDULES: FeedingSchedule[] = [
  { id: 'fs1', time: '08:00', portion: 200, portionUnit: 'g', foodType: 'Dry kibble', enabled: true },
  { id: 'fs2', time: '18:00', portion: 200, portionUnit: 'g', foodType: 'Dry kibble', enabled: true },
];

export default function DietFeedingScreen({ navigation }: DietFeedingScreenProps) {
  const insets = useSafeAreaInsets();
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const weightHistory = useDogStore((s) => s.weightHistory);
  const activeDog = dogs.find((d) => d.id === activeDogId) ?? null;

  const latestWeight = weightHistory
    .filter((w) => w.dogId === activeDogId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const weightKg = latestWeight
    ? latestWeight.weightUnit === 'lb'
      ? latestWeight.weight * 0.453592
      : latestWeight.weight
    : activeDog?.weight
    ? activeDog.weightUnit === 'lb'
      ? activeDog.weight * 0.453592
      : activeDog.weight
    : 0;

  const [activityLevel, setActivityLevel] = useState(1.4);
  const [bodyConditionScore, setBodyConditionScore] = useState(4);
  const [schedules, setSchedules] = useState<FeedingSchedule[]>(DEFAULT_SCHEDULES);
  const [modalVisible, setModalVisible] = useState(false);
  const [editSchedule, setEditSchedule] = useState<FeedingSchedule | null>(null);
  const [timeInput, setTimeInput] = useState('');
  const [portionInput, setPortionInput] = useState('');
  const [unitInput, setUnitInput] = useState<'g' | 'cups'>('g');
  const [foodTypeInput, setFoodTypeInput] = useState('');

  const dietProfile = useMemo(() => {
    if (weightKg <= 0) return null;
    return calculateDietProfile(weightKg, activeDog?.birthDate, activityLevel, bodyConditionScore);
  }, [weightKg, activeDog?.birthDate, activityLevel, bodyConditionScore]);

  const openAddSchedule = useCallback(() => {
    setEditSchedule(null);
    setTimeInput('');
    setPortionInput('');
    setUnitInput('g');
    setFoodTypeInput('');
    setModalVisible(true);
  }, []);

  const openEditSchedule = useCallback((schedule: FeedingSchedule) => {
    setEditSchedule(schedule);
    setTimeInput(schedule.time);
    setPortionInput(String(schedule.portion));
    setUnitInput(schedule.portionUnit);
    setFoodTypeInput(schedule.foodType);
    setModalVisible(true);
  }, []);

  const handleSaveSchedule = useCallback(() => {
    const portion = parseFloat(portionInput);
    if (!timeInput.match(/^\d{2}:\d{2}$/) || isNaN(portion) || portion <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid time (HH:MM) and portion.');
      return;
    }

    if (editSchedule) {
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === editSchedule.id
            ? { ...s, time: timeInput, portion, portionUnit: unitInput, foodType: foodTypeInput || 'Food' }
            : s
        )
      );
    } else {
      setSchedules((prev) => [
        ...prev,
        {
          id: `fs_${Date.now()}`,
          time: timeInput,
          portion,
          portionUnit: unitInput,
          foodType: foodTypeInput || 'Food',
          enabled: true,
        },
      ]);
    }
    setModalVisible(false);
  }, [timeInput, portionInput, unitInput, foodTypeInput, editSchedule]);

  const toggleSchedule = useCallback((id: string) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }, []);

  const deleteSchedule = useCallback((id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => a.time.localeCompare(b.time));
  }, [schedules]);

  const stage = calculateAgeStage(activeDog?.birthDate);
  const stageLabel = stage.charAt(0).toUpperCase() + stage.slice(1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Diet & Feeding</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {!activeDog || weightKg <= 0 ? (
          <Card variant="default" padding="lg" style={styles.noDataCard}>
            <Ionicons name="restaurant-outline" size={40} color={colors.text.tertiary} />
            <Text style={styles.noDataTitle}>No Weight Data</Text>
            <Text style={styles.noDataText}>
              Add a weight record for your dog to calculate diet recommendations.
            </Text>
          </Card>
        ) : (
          <>
            {/* Dog Info */}
            <Card variant="elevated" padding="md" style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="paw" size={20} color={colors.primary.DEFAULT} />
                <Text style={styles.infoText}>
                  {activeDog.name} · {latestWeight ? `${latestWeight.weight} ${latestWeight.weightUnit}` : `${activeDog.weight} ${activeDog.weightUnit}`} · {stageLabel}
                </Text>
              </View>
            </Card>

            {/* Body Condition Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Body Condition</Text>
              <View style={styles.conditionRow}>
                {BODY_CONDITIONS.map((c) => (
                  <TouchableOpacity
                    key={c.score}
                    style={[
                      styles.conditionBtn,
                      bodyConditionScore === c.score && styles.conditionBtnActive,
                    ]}
                    onPress={() => setBodyConditionScore(c.score)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.conditionScore,
                        bodyConditionScore === c.score && styles.conditionScoreActive,
                      ]}
                    >
                      {c.score}
                    </Text>
                    <Text
                      style={[
                        styles.conditionLabel,
                        bodyConditionScore === c.score && styles.conditionLabelActive,
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.conditionDesc}>
                {BODY_CONDITIONS.find((c) => c.score === bodyConditionScore)?.desc}
              </Text>
            </View>

            {/* Activity Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity Level</Text>
              <View style={styles.activityRow}>
                {ACTIVITY_MULTIPLIERS.map((a) => (
                  <TouchableOpacity
                    key={a.label}
                    style={[
                      styles.activityBtn,
                      activityLevel === a.value && styles.activityBtnActive,
                    ]}
                    onPress={() => setActivityLevel(a.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.activityLabel,
                        activityLevel === a.value && styles.activityLabelActive,
                      ]}
                    >
                      {a.label}
                    </Text>
                    <Text
                      style={[
                        styles.activityDesc,
                        activityLevel === a.value && styles.activityDescActive,
                      ]}
                    >
                      {a.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Diet Profile Results */}
            {dietProfile && (
              <Card variant="default" padding="lg" style={styles.dietCard}>
                <Text style={styles.dietCardTitle}>Daily Requirements</Text>

                <View style={styles.dietStatsRow}>
                  <View style={styles.dietStat}>
                    <Text style={styles.dietStatValue}>{dietProfile.dailyCalories}</Text>
                    <Text style={styles.dietStatLabel}>kcal/day</Text>
                  </View>
                  <View style={styles.dietStatDivider} />
                  <View style={styles.dietStat}>
                    <Text style={styles.dietStatValue}>{dietProfile.mealsPerDay}</Text>
                    <Text style={styles.dietStatLabel}>meals</Text>
                  </View>
                  <View style={styles.dietStatDivider} />
                  <View style={styles.dietStat}>
                    <Text style={styles.dietStatValue}>{dietProfile.portionPerMeal}</Text>
                    <Text style={styles.dietStatLabel}>kcal/meal</Text>
                  </View>
                  <View style={styles.dietStatDivider} />
                  <View style={styles.dietStat}>
                    <Text style={styles.dietStatValue}>{dietProfile.waterLiters}</Text>
                    <Text style={styles.dietStatLabel}>L water</Text>
                  </View>
                </View>

                {/* Macronutrients */}
                <View style={styles.macroRow}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{dietProfile.proteinGrams}g</Text>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{dietProfile.fatGrams}g</Text>
                    <Text style={styles.macroLabel}>Fat</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{dietProfile.carbsGrams}g</Text>
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{dietProfile.fiberGrams}g</Text>
                    <Text style={styles.macroLabel}>Fiber</Text>
                  </View>
                </View>

                {/* Recommendation */}
                <View style={styles.recommendationBox}>
                  <Ionicons name="bulb-outline" size={18} color={colors.primary.DEFAULT} />
                  <Text style={styles.recommendationText}>{dietProfile.recommendation}</Text>
                </View>
              </Card>
            )}

            {/* Feeding Schedule */}
            <View style={styles.section}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.sectionTitle}>Feeding Schedule</Text>
                <TouchableOpacity onPress={openAddSchedule} activeOpacity={0.7}>
                  <Ionicons name="add-circle" size={24} color={colors.primary.DEFAULT} />
                </TouchableOpacity>
              </View>

              {sortedSchedules.length === 0 ? (
                <Text style={styles.emptySchedule}>No feeding times set</Text>
              ) : (
                sortedSchedules.map((schedule) => (
                  <Card key={schedule.id} variant="default" padding="md" style={styles.scheduleCard}>
                    <View style={styles.scheduleRow}>
                      <View style={styles.scheduleLeft}>
                        <Text style={styles.scheduleTime}>{schedule.time}</Text>
                        <Text style={styles.scheduleDetail}>
                          {schedule.portion} {schedule.portionUnit} · {schedule.foodType}
                        </Text>
                      </View>
                      <View style={styles.scheduleActions}>
                        <TouchableOpacity
                          onPress={() => toggleSchedule(schedule.id)}
                          style={[
                            styles.toggleBtn,
                            { backgroundColor: schedule.enabled ? colors.status.success + '18' : colors.border.light },
                          ]}
                        >
                          <Text
                            style={[
                              styles.toggleText,
                              { color: schedule.enabled ? colors.status.success : colors.text.tertiary },
                            ]}
                          >
                            {schedule.enabled ? 'On' : 'Off'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openEditSchedule(schedule)} style={styles.editBtn}>
                          <Ionicons name="create-outline" size={18} color={colors.text.tertiary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteSchedule(schedule.id)} style={styles.editBtn}>
                          <Ionicons name="trash-outline" size={18} color={colors.status.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editSchedule ? 'Edit Meal' : 'Add Meal'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Time (HH:MM)</Text>
            <TextInput
              style={styles.modalInput}
              value={timeInput}
              onChangeText={setTimeInput}
              placeholder="08:00"
              placeholderTextColor={colors.text.tertiary}
            />

            <Text style={styles.modalLabel}>Portion</Text>
            <View style={styles.modalPortionRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                value={portionInput}
                onChangeText={(text) => setPortionInput(text.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="200"
                placeholderTextColor={colors.text.tertiary}
              />
              <View style={styles.unitToggle}>
                {(['g', 'cups'] as const).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitBtn, unitInput === u && styles.unitBtnActive]}
                    onPress={() => setUnitInput(u)}
                  >
                    <Text style={[styles.unitBtnText, unitInput === u && styles.unitBtnTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.modalLabel}>Food Type</Text>
            <TextInput
              style={styles.modalInput}
              value={foodTypeInput}
              onChangeText={setFoodTypeInput}
              placeholder="e.g. Dry kibble, Raw, Wet food"
              placeholderTextColor={colors.text.tertiary}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSchedule} activeOpacity={0.7}>
              <Text style={styles.saveBtnText}>{editSchedule ? 'Save Changes' : 'Add Meal'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  title: {
    ...typography.styles.headingXL,
    color: colors.text.primary,
  },
  noDataCard: {
    marginHorizontal: spacing.page,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  noDataTitle: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  noDataText: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  infoCard: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.styles.label,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  conditionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  conditionBtnActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  conditionScore: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  conditionScoreActive: {
    color: colors.white,
  },
  conditionLabel: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  conditionLabelActive: {
    color: colors.white,
  },
  conditionDesc: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  activityRow: {
    gap: spacing.sm,
  },
  activityBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  activityBtnActive: {
    backgroundColor: colors.primary.DEFAULT + '18',
    borderColor: colors.primary.DEFAULT,
  },
  activityLabel: {
    ...typography.styles.bodySM,
    color: colors.text.primary,
    fontWeight: '600',
  },
  activityLabelActive: {
    color: colors.primary.DEFAULT,
  },
  activityDesc: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  activityDescActive: {
    color: colors.primary.dark,
  },
  dietCard: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.lg,
  },
  dietCardTitle: {
    ...typography.styles.label,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  dietStatsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  dietStat: {
    flex: 1,
    alignItems: 'center',
  },
  dietStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border.light,
    alignSelf: 'center',
  },
  dietStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  dietStatLabel: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
  },
  macroValue: {
    ...typography.styles.bodySM,
    color: colors.text.primary,
    fontWeight: '700',
  },
  macroLabel: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  recommendationBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primary.DEFAULT + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  recommendationText: {
    ...typography.styles.caption,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 18,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptySchedule: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  scheduleCard: {
    marginBottom: spacing.md,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleLeft: {
    flex: 1,
  },
  scheduleTime: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  scheduleDetail: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  scheduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  toggleText: {
    ...typography.styles.caption,
    fontWeight: '600',
  },
  editBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.page,
    paddingTop: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.styles.headingLG,
    color: colors.text.primary,
  },
  modalLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  modalPortionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  unitBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
  },
  unitBtnActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  unitBtnText: {
    ...typography.styles.bodySM,
    color: colors.text.primary,
    fontWeight: '600',
  },
  unitBtnTextActive: {
    color: colors.white,
  },
  saveBtn: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
