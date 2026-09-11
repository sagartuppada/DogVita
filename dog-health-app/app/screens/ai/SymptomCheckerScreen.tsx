/**
 * SymptomCheckerScreen - AI Disease Prediction based on symptom selection
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { Card } from '../../components/common';
import { spacing, typography, borderRadius } from '../../theme';
import type { SymptomCheckerScreenProps } from '../../navigation/types';

interface Symptom {
  id: string;
  category: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
}

interface Condition {
  name: string;
  risk: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  action: string;
  matchingSymptoms: string[];
}

const SYMPTOMS: Symptom[] = [
  { id: 'vomiting', category: 'Digestive', label: 'Vomiting', severity: 'medium' },
  { id: 'diarrhea', category: 'Digestive', label: 'Diarrhea', severity: 'medium' },
  { id: 'loss_appetite', category: 'Digestive', label: 'Loss of appetite', severity: 'medium' },
  { id: 'bloating', category: 'Digestive', label: 'Bloated abdomen', severity: 'high' },
  { id: 'coughing', category: 'Respiratory', label: 'Coughing', severity: 'medium' },
  { id: 'sneezing', category: 'Respiratory', label: 'Sneezing', severity: 'low' },
  { id: 'difficulty_breathing', category: 'Respiratory', label: 'Difficulty breathing', severity: 'high' },
  { id: 'itching', category: 'Skin', label: 'Excessive itching', severity: 'low' },
  { id: 'hair_loss', category: 'Skin', label: 'Hair loss', severity: 'medium' },
  { id: 'red_skin', category: 'Skin', label: 'Red/inflamed skin', severity: 'medium' },
  { id: 'limping', category: 'Movement', label: 'Limping', severity: 'medium' },
  { id: 'stiffness', category: 'Movement', label: 'Stiffness', severity: 'medium' },
  { id: 'reluctant_walk', category: 'Movement', label: 'Reluctant to walk', severity: 'high' },
  { id: 'seizures', category: 'Neurological', label: 'Seizures', severity: 'high' },
  { id: 'disorientation', category: 'Neurological', label: 'Disorientation', severity: 'high' },
  { id: 'lethargy', category: 'General', label: 'Lethargy', severity: 'medium' },
  { id: 'fever', category: 'General', label: 'Fever', severity: 'high' },
  { id: 'weight_loss', category: 'General', label: 'Weight loss', severity: 'medium' },
  { id: 'excessive_thirst', category: 'General', label: 'Excessive thirst', severity: 'medium' },
  { id: 'pale_gums', category: 'General', label: 'Pale gums', severity: 'high' },
  { id: 'bad_breath', category: 'General', label: 'Bad breath', severity: 'low' },
  { id: 'eye_discharge', category: 'General', label: 'Eye discharge', severity: 'low' },
  { id: 'ear_odor', category: 'General', label: 'Ear odor', severity: 'low' },
  { id: 'scooting', category: 'General', label: 'Scooting', severity: 'low' },
];

const CONDITIONS: Condition[] = [
  {
    name: 'Gastrointestinal Upset',
    risk: 'moderate',
    description: 'Common causes include dietary indiscretion, food intolerance, or infection.',
    action: 'Withhold food for 12-24 hours, then offer bland diet (rice + chicken). If vomiting persists >24h, see vet.',
    matchingSymptoms: ['vomiting', 'diarrhea', 'loss_appetite', 'bloating'],
  },
  {
    name: 'Bloat (Gastric Dilatation-Volvulus)',
    risk: 'critical',
    description: 'Life-threatening condition where stomach twists. More common in large, deep-chested breeds.',
    action: 'EMERGENCY: Go to vet immediately. Do not wait. This is life-threatening.',
    matchingSymptoms: ['bloating', 'vomiting', 'difficulty_breathing', 'lethargy', 'pale_gums'],
  },
  {
    name: 'Respiratory Infection (Kennel Cough)',
    risk: 'moderate',
    description: 'Highly contagious upper respiratory infection. Usually viral but can be bacterial.',
    action: 'Isolate from other dogs. See vet for cough suppressants or antibiotics if bacterial.',
    matchingSymptoms: ['coughing', 'sneezing', 'loss_appetite', 'lethargy'],
  },
  {
    name: 'Allergies / Dermatitis',
    risk: 'low',
    description: 'Can be environmental, food-related, or flea allergy. Very common in dogs.',
    action: 'Check for fleas. Try elimination diet. Antihistamines may help. See vet if severe.',
    matchingSymptoms: ['itching', 'hair_loss', 'red_skin', 'sneezing', 'eye_discharge'],
  },
  {
    name: 'Arthritis / Joint Pain',
    risk: 'moderate',
    description: 'Degenerative joint disease, especially in senior dogs and large breeds.',
    action: 'Provide joint supplements (glucosamine). Maintain healthy weight. See vet for pain management.',
    matchingSymptoms: ['limping', 'stiffness', 'reluctant_walk', 'lethargy'],
  },
  {
    name: 'Ear Infection',
    risk: 'low',
    description: 'Common in floppy-eared breeds. Can be bacterial, yeast, or mite-related.',
    action: 'Clean with vet-approved ear cleaner. See vet for medication if persistent.',
    matchingSymptoms: ['ear_odor', 'itching', 'red_skin'],
  },
  {
    name: 'Dental Disease',
    risk: 'moderate',
    description: 'Affects 80% of dogs over age 3. Can lead to heart, kidney, and liver issues.',
    action: 'Schedule professional dental cleaning. Start daily brushing at home.',
    matchingSymptoms: ['bad_breath', 'loss_appetite', 'weight_loss', 'lethargy'],
  },
  {
    name: 'Urinary Tract Infection / Diabetes',
    risk: 'moderate',
    description: 'Excessive thirst and urination can indicate diabetes, kidney disease, or UTI.',
    action: 'See vet for blood work and urinalysis. Early diagnosis is key for management.',
    matchingSymptoms: ['excessive_thirst', 'lethargy', 'weight_loss'],
  },
  {
    name: 'Anemia / Internal Bleeding',
    risk: 'high',
    description: 'Pale gums can indicate anemia, internal bleeding, or shock.',
    action: 'See vet promptly. This may require blood tests and imaging.',
    matchingSymptoms: ['pale_gums', 'lethargy', 'difficulty_breathing'],
  },
  {
    name: 'Neurological Issue',
    risk: 'high',
    description: 'Seizures, disorientation can indicate neurological problems.',
    action: 'See vet immediately. May need MRI, CT scan, or neurological exam.',
    matchingSymptoms: ['seizures', 'disorientation', 'lethargy'],
  },
  {
    name: 'Heatstroke',
    risk: 'critical',
    description: 'Elevated body temperature from heat exposure. Can be fatal.',
    action: 'EMERGENCY: Move to cool area, apply wet towels. Go to vet immediately.',
    matchingSymptoms: ['excessive_thirst', 'lethargy', 'difficulty_breathing', 'pale_gums', 'vomiting'],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#111827',
  },
  disclaimerCard: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.md,
    backgroundColor: '#3B82F610',
  },
  disclaimerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  disclaimerText: {
    ...typography.styles.caption,
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },
  selectedBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    marginBottom: spacing.md,
  },
  selectedText: {
    ...typography.styles.bodySM,
    color: '#6B7280',
  },
  analyzeText: {
    ...typography.styles.bodySM,
    color: '#16A34A',
    fontWeight: '700',
  },
  categorySection: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.page,
  },
  categoryTitle: {
    ...typography.styles.label,
    color: '#6B7280',
    marginBottom: spacing.sm,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  symptomChipSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  symptomLabel: {
    ...typography.styles.caption,
    color: '#111827',
  },
  symptomLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: spacing.xs,
  },
  resultsSection: {
    paddingHorizontal: spacing.page,
    marginTop: spacing.lg,
  },
  resultsTitle: {
    ...typography.styles.headingMD,
    color: '#111827',
    marginBottom: spacing.md,
  },
  urgentCard: {
    marginBottom: spacing.md,
    backgroundColor: '#EF444410',
    borderColor: '#EF444430',
    borderWidth: 1,
  },
  urgentRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  urgentText: {
    flex: 1,
  },
  urgentTitle: {
    ...typography.styles.bodyMD,
    color: '#EF4444',
    fontWeight: '700',
  },
  urgentDesc: {
    ...typography.styles.caption,
    color: '#6B7280',
    marginTop: spacing.xs,
  },
  resultCard: {
    marginBottom: spacing.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  resultRank: {
    ...typography.styles.caption,
    color: '#9CA3AF',
    fontWeight: '700',
    width: 24,
  },
  resultNameRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultName: {
    ...typography.styles.bodyMD,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
  riskText: {
    ...typography.styles.caption,
    fontWeight: '600',
  },
  resultDesc: {
    ...typography.styles.caption,
    color: '#6B7280',
    marginLeft: 32,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  matchRow: {
    marginLeft: 32,
    marginBottom: spacing.sm,
  },
  matchText: {
    ...typography.styles.caption,
    color: '#9CA3AF',
  },
  actionBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginLeft: 32,
    backgroundColor: '#16A34A10',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
  },
  actionText: {
    ...typography.styles.caption,
    color: '#111827',
    flex: 1,
    lineHeight: 18,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  noResultsText: {
    ...typography.styles.bodyMD,
    color: '#9CA3AF',
    marginTop: spacing.md,
  },
  noResultsSub: {
    ...typography.styles.caption,
    color: '#9CA3AF',
    marginTop: spacing.xs,
  },
});

const RISK_COLORS = {
  low: '#22C55E',
  moderate: '#F59E0B',
  high: '#EF4444',
  critical: '#8B0000',
};

export default function SymptomCheckerScreen({ navigation }: SymptomCheckerScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);

  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);
  const activeDog = dogs.find((d) => d.id === activeDogId) ?? null;

  const toggleSymptom = useCallback((id: string) => {
    setSelectedSymptoms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setShowResults(false);
  }, []);

  const clearAll = useCallback(() => {
    setSelectedSymptoms(new Set());
    setShowResults(false);
  }, []);

  const results = useMemo(() => {
    if (selectedSymptoms.size === 0) return [];

    const scored = CONDITIONS.map((condition) => {
      const matches = condition.matchingSymptoms.filter((s) => selectedSymptoms.has(s));
      const score = matches.length / condition.matchingSymptoms.length;
      return { ...condition, matches, score };
    });

    return scored
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [selectedSymptoms]);

  const categories = useMemo(() => {
    const cats = new Map<string, Symptom[]>();
    SYMPTOMS.forEach((s) => {
      if (!cats.has(s.category)) cats.set(s.category, []);
      cats.get(s.category)!.push(s);
    });
    return cats;
  }, []);

  const maxRisk = useMemo(() => {
    if (results.length === 0) return null;
    const order = { critical: 4, high: 3, moderate: 2, low: 1 };
    return results.reduce((max, r) => (order[r.risk] > order[max.risk] ? r : max), results[0]);
  }, [results]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Symptom Checker</Text>
        <TouchableOpacity onPress={clearAll} style={styles.backButton}>
          <Ionicons name="refresh" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Disclaimer */}
        <Card variant="default" padding="md" style={styles.disclaimerCard}>
          <View style={styles.disclaimerRow}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.disclaimerText}>
              This is not a substitute for professional veterinary care. If your dog is in distress, contact a vet immediately.
            </Text>
          </View>
        </Card>

        {/* Selected count */}
        <View style={styles.selectedBar}>
          <Text style={styles.selectedText}>
            {selectedSymptoms.size} symptom{selectedSymptoms.size !== 1 ? 's' : ''} selected
          </Text>
          {selectedSymptoms.size > 0 && (
            <TouchableOpacity onPress={() => setShowResults(true)} activeOpacity={0.7}>
              <Text style={styles.analyzeText}>Analyze →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Symptom Categories */}
        {Array.from(categories.entries()).map(([category, symptoms]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.symptomGrid}>
              {symptoms.map((symptom) => {
                const isSelected = selectedSymptoms.has(symptom.id);
                const severityColor =
                  symptom.severity === 'high'
                    ? '#EF4444'
                    : symptom.severity === 'medium'
                    ? '#F59E0B'
                    : '#22C55E';
                return (
                  <TouchableOpacity
                    key={symptom.id}
                    style={[
                      styles.symptomChip,
                      isSelected && styles.symptomChipSelected,
                    ]}
                    onPress={() => toggleSymptom(symptom.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
                    <Text style={[styles.symptomLabel, isSelected && styles.symptomLabelSelected]}>
                      {symptom.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Results */}
        {showResults && results.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Possible Conditions</Text>

            {maxRisk && (maxRisk.risk === 'critical' || maxRisk.risk === 'high') && (
              <Card variant="elevated" padding="md" style={styles.urgentCard}>
                <View style={styles.urgentRow}>
                  <Ionicons name="warning" size={24} color="#EF4444" />
                  <View style={styles.urgentText}>
                    <Text style={styles.urgentTitle}>Potential Emergency Detected</Text>
                    <Text style={styles.urgentDesc}>
                      {maxRisk.name} has been identified as a possible concern. Please contact your vet immediately.
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {results.map((result, index) => (
              <Card key={result.name} variant="default" padding="md" style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultRank}>#{index + 1}</Text>
                  <View style={styles.resultNameRow}>
                    <Text style={styles.resultName}>{result.name}</Text>
                    <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[result.risk] + '18' }]}>
                      <Text style={[styles.riskText, { color: RISK_COLORS[result.risk] }]}>
                        {result.risk.charAt(0).toUpperCase() + result.risk.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.resultDesc}>{result.description}</Text>
                <View style={styles.matchRow}>
                  <Text style={styles.matchText}>
                    Matches: {result.matches.join(', ')}
                  </Text>
                </View>
                <View style={styles.actionBox}>
                  <Ionicons name="medical" size={16} color="#16A34A" />
                  <Text style={styles.actionText}>{result.action}</Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {showResults && results.length === 0 && selectedSymptoms.size > 0 && (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={40} color="#9CA3AF" />
            <Text style={styles.noResultsText}>No matching conditions found</Text>
            <Text style={styles.noResultsSub}>
              Try selecting different symptoms or consult your vet directly.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
