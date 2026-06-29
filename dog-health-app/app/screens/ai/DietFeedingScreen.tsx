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
import { spacing, typography, borderRadius } from '../../theme';
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

function calculateDietProfile(weightKg: number, birthDate: string | undefined, activityLevel: number, bodyConditionScore: number): DietProfile {
  const stage = calculateAgeStage(birthDate);
  const stageMultiplier = LIFE_STAGE_MULTIPLIERS[stage] || 1.0;
  const rer = 70 * Math.pow(weightKg, 0.75);
  const dailyCalories = Math.round(rer * activityLevel * stageMultiplier);
  let adjustedCalories = dailyCalories;
  if (bodyConditionScore <= 2) adjustedCalories = Math.round(dailyCalories * 1.2);
  else if (bodyConditionScore >= 5) adjustedCalories = Math.round(dailyCalories * 0.8);
  const proteinGrams = Math.round(adjustedCalories * 0.25 / 4);
  const fatGrams = Math.round(adjustedCalories * 0.15 / 9);
  const carbsGrams = Math.round(adjustedCalories * 0.45 / 4);
  const fiberGrams = Math.round(weightKg * 1.5);
  const mealsPerDay = stage === 'puppy' ? 4 : stage === 'adolescent' ? 3 : 2;
  const portionPerMeal = Math.round(adjustedCalories / mealsPerDay);
  const waterLiters = Math.round(weightKg * 0.06 * 10) / 10;
  const bodyCondition = bodyConditionScore <= 2 ? 'underweight' : bodyConditionScore >= 5 ? 'overweight' : 'ideal';
  let recommendation = '';
  if (bodyCondition === 'underweight') {
    recommendation = 'Increase food portions gradually. Add high-calorie supplements.';
  } else if (bodyCondition === 'overweight') {
    recommendation = 'Reduce portions by 20%. Increase exercise. Consider weight management formula.';
  } else {
    recommendation = 'Maintain current diet and exercise. Monitor weight monthly.';
  }
  return { dailyCalories: adjustedCalories, proteinGrams, fatGrams, carbsGrams, fiberGrams, mealsPerDay, portionPerMeal, waterLiters, bodyCondition, recommendation };
}

const DEFAULT_SCHEDULES: FeedingSchedule[] = [
  { id: 'fs1', time: '08:00', portion: 200, portionUnit: 'g', foodType: 'Dry kibble', enabled: true },
  { id: 'fs2', time: '18:00', portion: 200, portionUnit: 'g', foodType: 'Dry kibble', enabled: true },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5E9CD' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  backButton: { padding: 4, width: 40 },
  title: { ...typography.styles.headingXL, color: '#1F1A17' },
  noDataCard: { marginHorizontal: 16, marginTop: 20, alignItems: 'center' },
  noDataTitle: { ...typography.styles.bodyMD, color: '#1F1A17', fontWeight: '600', marginTop: 12 },
  noDataText: { ...typography.styles.caption, color: '#A39888', marginTop: 4, textAlign: 'center' },
  infoCard: { marginHorizontal: 16, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { ...typography.styles.bodyMD, color: '#1F1A17', fontWeight: '600' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { ...typography.styles.label, color: '#6B625A', marginBottom: 12 },
  conditionRow: { flexDirection: 'row', gap: 8 },
  conditionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, backgroundColor: '#FBF4E4', borderRadius: 16, borderWidth: 1, borderColor: '#F0E8D8' },
  conditionBtnActive: { backgroundColor: '#F3A93B', borderColor: '#F3A93B' },
  conditionScore: { fontSize: 16, fontWeight: '700', color: '#1F1A17' },
  conditionScoreActive: { color: '#FFFFFF' },
  conditionLabel: { ...typography.styles.caption, color: '#A39888', marginTop: 2 },
  conditionLabelActive: { color: '#FFFFFF' },
  conditionDesc: { ...typography.styles.caption, color: '#6B625A', marginTop: 8, textAlign: 'center' },
  activityRow: { gap: 8 },
  activityBtn: { paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#FBF4E4', borderRadius: 16, borderWidth: 1, borderColor: '#F0E8D8', marginBottom: 8 },
  activityBtnActive: { backgroundColor: '#F3A93B18', borderColor: '#F3A93B' },
  activityLabel: { ...typography.styles.bodySM, color: '#1F1A17', fontWeight: '600' },
  activityLabelActive: { color: '#F3A93B' },
  activityDesc: { ...typography.styles.caption, color: '#A39888', marginTop: 2 },
  activityDescActive: { color: '#E2941C' },
  dietCard: { marginHorizontal: 16, marginBottom: 16 },
  dietCardTitle: { ...typography.styles.label, color: '#6B625A', marginBottom: 12 },
  dietStatsRow: { flexDirection: 'row', marginBottom: 16 },
  dietStat: { flex: 1, alignItems: 'center' },
  dietStatDivider: { width: 1, height: 36, backgroundColor: '#F0E8D8', alignSelf: 'center' },
  dietStatValue: { fontSize: 18, fontWeight: '700', color: '#1F1A17' },
  dietStatLabel: { ...typography.styles.caption, color: '#A39888', marginTop: 2 },
  macroRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  macroItem: { flex: 1, alignItems: 'center', backgroundColor: '#EDE2C6', borderRadius: 16, paddingVertical: 12 },
  macroValue: { ...typography.styles.bodySM, color: '#1F1A17', fontWeight: '700' },
  macroLabel: { ...typography.styles.caption, color: '#A39888', marginTop: 2 },
  recommendationBox: { flexDirection: 'row', gap: 8, backgroundColor: '#F3A93B10', borderRadius: 16, padding: 12 },
  recommendationText: { ...typography.styles.caption, color: '#1F1A17', flex: 1, lineHeight: 18 },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  emptySchedule: { ...typography.styles.caption, color: '#A39888', textAlign: 'center', paddingVertical: 12 },
  scheduleCard: { marginBottom: 12 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scheduleLeft: { flex: 1 },
  scheduleTime: { ...typography.styles.bodyMD, color: '#1F1A17', fontWeight: '700' },
  scheduleDetail: { ...typography.styles.caption, color: '#A39888', marginTop: 2 },
  scheduleActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  toggleText: { ...typography.styles.caption, fontWeight: '600' },
  editBtn: { padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#F5E9CD', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { ...typography.styles.headingLG, color: '#1F1A17' },
  modalLabel: { ...typography.styles.caption, color: '#6B625A', marginBottom: 4, marginTop: 12 },
  modalInput: { backgroundColor: '#FBF4E4', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, color: '#1F1A17', fontSize: 16, borderWidth: 1, borderColor: '#E9DDC9' },
  modalPortionRow: { flexDirection: 'row', gap: 12 },
  unitToggle: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F0E8D8' },
  unitBtn: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#EDE2C6' },
  unitBtnActive: { backgroundColor: '#F3A93B' },
  unitBtnText: { ...typography.styles.bodySM, color: '#1F1A17', fontWeight: '600' },
  unitBtnTextActive: { color: '#FFFFFF' },
  saveBtn: { backgroundColor: '#F3A93B', borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginTop: 20, marginBottom: 16 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

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
    ? latestWeight.weightUnit === 'lb' ? latestWeight.weight * 0.453592 : latestWeight.weight
    : activeDog?.weight ? activeDog.weightUnit === 'lb' ? activeDog.weight * 0.453592 : activeDog.weight : 0;

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
    setEditSchedule(null); setTimeInput(''); setPortionInput(''); setUnitInput('g'); setFoodTypeInput(''); setModalVisible(true);
  }, []);

  const openEditSchedule = useCallback((schedule: FeedingSchedule) => {
    setEditSchedule(schedule); setTimeInput(schedule.time); setPortionInput(String(schedule.portion)); setUnitInput(schedule.portionUnit); setFoodTypeInput(schedule.foodType); setModalVisible(true);
  }, []);

  const handleSaveSchedule = useCallback(() => {
    const portion = parseFloat(portionInput);
    if (!timeInput.match(/^\d{2}:\d{2}$/) || isNaN(portion) || portion <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid time (HH:MM) and portion.');
      return;
    }
    if (editSchedule) {
      setSchedules((prev) => prev.map((s) => s.id === editSchedule.id ? { ...s, time: timeInput, portion, portionUnit: unitInput, foodType: foodTypeInput || 'Food' } : s));
    } else {
      setSchedules((prev) => [...prev, { id: `fs_${Date.now()}`, time: timeInput, portion, portionUnit: unitInput, foodType: foodTypeInput || 'Food', enabled: true }]);
    }
    setModalVisible(false);
  }, [timeInput, portionInput, unitInput, foodTypeInput, editSchedule]);

  const toggleSchedule = useCallback((id: string) => { setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))); }, []);
  const deleteSchedule = useCallback((id: string) => { setSchedules((prev) => prev.filter((s) => s.id !== id)); }, []);
  const sortedSchedules = useMemo(() => [...schedules].sort((a, b) => a.time.localeCompare(b.time)), [schedules]);
  const stage = calculateAgeStage(activeDog?.birthDate);
  const stageLabel = stage.charAt(0).toUpperCase() + stage.slice(1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1F1A17" />
        </TouchableOpacity>
        <Text style={styles.title}>Diet & Feeding</Text>
        <View style={styles.backButton} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {!activeDog || weightKg <= 0 ? (
          <Card variant="default" padding="lg" style={styles.noDataCard}>
            <Ionicons name="restaurant-outline" size={40} color="#A39888" />
            <Text style={styles.noDataTitle}>No Weight Data</Text>
            <Text style={styles.noDataText}>Add a weight record for your dog to calculate diet recommendations.</Text>
          </Card>
        ) : (
          <>
            <Card variant="elevated" padding="md" style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="paw" size={20} color="#F3A93B" />
                <Text style={styles.infoText}>{activeDog.name} · {latestWeight ? `${latestWeight.weight} ${latestWeight.weightUnit}` : `${activeDog.weight} ${activeDog.weightUnit}`} · {stageLabel}</Text>
              </View>
            </Card>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Body Condition</Text>
              <View style={styles.conditionRow}>
                {BODY_CONDITIONS.map((c) => (
                  <TouchableOpacity key={c.score} style={[styles.conditionBtn, bodyConditionScore === c.score && styles.conditionBtnActive]} onPress={() => setBodyConditionScore(c.score)} activeOpacity={0.7}>
                    <Text style={[styles.conditionScore, bodyConditionScore === c.score && styles.conditionScoreActive]}>{c.score}</Text>
                    <Text style={[styles.conditionLabel, bodyConditionScore === c.score && styles.conditionLabelActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.conditionDesc}>{BODY_CONDITIONS.find((c) => c.score === bodyConditionScore)?.desc}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity Level</Text>
              <View style={styles.activityRow}>
                {ACTIVITY_MULTIPLIERS.map((a) => (
                  <TouchableOpacity key={a.label} style={[styles.activityBtn, activityLevel === a.value && styles.activityBtnActive]} onPress={() => setActivityLevel(a.value)} activeOpacity={0.7}>
                    <Text style={[styles.activityLabel, activityLevel === a.value && styles.activityLabelActive]}>{a.label}</Text>
                    <Text style={[styles.activityDesc, activityLevel === a.value && styles.activityDescActive]}>{a.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {dietProfile && (
              <Card variant="default" padding="lg" style={styles.dietCard}>
                <Text style={styles.dietCardTitle}>Daily Requirements</Text>
                <View style={styles.dietStatsRow}>
                  <View style={styles.dietStat}><Text style={styles.dietStatValue}>{dietProfile.dailyCalories}</Text><Text style={styles.dietStatLabel}>kcal/day</Text></View>
                  <View style={styles.dietStatDivider} />
                  <View style={styles.dietStat}><Text style={styles.dietStatValue}>{dietProfile.mealsPerDay}</Text><Text style={styles.dietStatLabel}>meals</Text></View>
                  <View style={styles.dietStatDivider} />
                  <View style={styles.dietStat}><Text style={styles.dietStatValue}>{dietProfile.portionPerMeal}</Text><Text style={styles.dietStatLabel}>kcal/meal</Text></View>
                  <View style={styles.dietStatDivider} />
                  <View style={styles.dietStat}><Text style={styles.dietStatValue}>{dietProfile.waterLiters}</Text><Text style={styles.dietStatLabel}>L water</Text></View>
                </View>
                <View style={styles.macroRow}>
                  <View style={styles.macroItem}><Text style={styles.macroValue}>{dietProfile.proteinGrams}g</Text><Text style={styles.macroLabel}>Protein</Text></View>
                  <View style={styles.macroItem}><Text style={styles.macroValue}>{dietProfile.fatGrams}g</Text><Text style={styles.macroLabel}>Fat</Text></View>
                  <View style={styles.macroItem}><Text style={styles.macroValue}>{dietProfile.carbsGrams}g</Text><Text style={styles.macroLabel}>Carbs</Text></View>
                  <View style={styles.macroItem}><Text style={styles.macroValue}>{dietProfile.fiberGrams}g</Text><Text style={styles.macroLabel}>Fiber</Text></View>
                </View>
                <View style={styles.recommendationBox}>
                  <Ionicons name="bulb-outline" size={18} color="#F3A93B" />
                  <Text style={styles.recommendationText}>{dietProfile.recommendation}</Text>
                </View>
              </Card>
            )}
            <View style={styles.section}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.sectionTitle}>Feeding Schedule</Text>
                <TouchableOpacity onPress={openAddSchedule} activeOpacity={0.7}>
                  <Ionicons name="add-circle" size={24} color="#F3A93B" />
                </TouchableOpacity>
              </View>
              {sortedSchedules.length === 0 ? (
                <Text style={styles.emptySchedule}>No feeding times set</Text>
              ) : sortedSchedules.map((schedule) => (
                <Card key={schedule.id} variant="default" padding="md" style={styles.scheduleCard}>
                  <View style={styles.scheduleRow}>
                    <View style={styles.scheduleLeft}>
                      <Text style={styles.scheduleTime}>{schedule.time}</Text>
                      <Text style={styles.scheduleDetail}>{schedule.portion} {schedule.portionUnit} · {schedule.foodType}</Text>
                    </View>
                    <View style={styles.scheduleActions}>
                      <TouchableOpacity onPress={() => toggleSchedule(schedule.id)} style={[styles.toggleBtn, { backgroundColor: schedule.enabled ? '#4CAF5018' : '#F0E8D8' }]}>
                        <Text style={[styles.toggleText, { color: schedule.enabled ? '#4CAF50' : '#A39888' }]}>{schedule.enabled ? 'On' : 'Off'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openEditSchedule(schedule)} style={styles.editBtn}>
                        <Ionicons name="create-outline" size={18} color="#A39888" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteSchedule(schedule.id)} style={styles.editBtn}>
                        <Ionicons name="trash-outline" size={18} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editSchedule ? 'Edit Meal' : 'Add Meal'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B625A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Time (HH:MM)</Text>
            <TextInput style={styles.modalInput} value={timeInput} onChangeText={setTimeInput} placeholder="08:00" placeholderTextColor="#A39888" />
            <Text style={styles.modalLabel}>Portion</Text>
            <View style={styles.modalPortionRow}>
              <TextInput style={[styles.modalInput, { flex: 1 }]} value={portionInput} onChangeText={(text) => setPortionInput(text.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" placeholder="200" placeholderTextColor="#A39888" />
              <View style={styles.unitToggle}>
                {(['g', 'cups'] as const).map((u) => (
                  <TouchableOpacity key={u} style={[styles.unitBtn, unitInput === u && styles.unitBtnActive]} onPress={() => setUnitInput(u)}>
                    <Text style={[styles.unitBtnText, unitInput === u && styles.unitBtnTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Text style={styles.modalLabel}>Food Type</Text>
            <TextInput style={styles.modalInput} value={foodTypeInput} onChangeText={setFoodTypeInput} placeholder="e.g. Dry kibble, Raw, Wet food" placeholderTextColor="#A39888" />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSchedule} activeOpacity={0.7}>
              <Text style={styles.saveBtnText}>{editSchedule ? 'Save Changes' : 'Add Meal'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
