/**
 * SetupDogProfileScreen - Dog profile creation (saves to Supabase)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button, Input, Header } from '../../components/common';
import { spacing, typography, borderRadius, shadows } from '../../theme';
import { useDogStore } from '../../store/dogStore';
import type { OnboardingScreenProps } from '../../navigation/types';

const BREEDS = [
  'Labrador', 'Golden Retriever', 'German Shepherd', 'French Bulldog',
  'Bulldog', 'Poodle', 'Beagle', 'Rottweiler', 'Dachshund', 'Other',
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    ...typography.styles.headingLG,
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    ...typography.styles.bodyMD,
    color: '#6B7280',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#F3C45A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarHint: {
    ...typography.styles.caption,
    color: '#15803D',
  },
  form: {
    marginBottom: 16,
  },
  breedSelector: {
    marginBottom: 16,
  },
  breedLabel: {
    ...typography.styles.label,
    color: '#6B7280',
    marginBottom: 8,
  },
  breedValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EDE2C6',
    borderWidth: 1.5,
    borderColor: '#F0E8D8',
    borderRadius: 16,
    paddingVertical: spacing.inputPadding.vertical,
    paddingHorizontal: spacing.inputPadding.horizontal,
  },
  breedText: {
    ...typography.styles.bodyLG,
    color: '#111827',
  },
  breedPlaceholder: {
    color: '#9CA3AF',
  },
  breedList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E8D8',
    marginBottom: 16,
    ...shadows.md,
  },
  breedOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8D8',
  },
  breedOptionSelected: {
    backgroundColor: '#F0FDF4',
  },
  breedOptionText: {
    ...typography.styles.bodyMD,
    color: '#111827',
  },
  breedOptionTextSelected: {
    color: '#15803D',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
  },
});

export default function SetupDogProfileScreen({
  navigation,
}: OnboardingScreenProps<'SetupDog'>) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [showBreedPicker, setShowBreedPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValid = name.trim().length > 0 && breed.length > 0;

  const addDog = useDogStore((s) => s.addDog);

  const handleContinue = async () => {
    if (!isValid) return;
    setLoading(true);

    try {
      const birthDate = age ? calculateBirthDate(parseInt(age)) : undefined;

      await addDog({
        name: name.trim(),
        breed,
        birthDate,
        weight: weight ? parseFloat(weight) : undefined,
        weightUnit: 'kg',
      });

      navigation.navigate('PairDevice');
    } catch (err) {
      Alert.alert('Error', `Failed to save dog profile: ${(err as Error).message}`);
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header showBack onBack={() => navigation.goBack()} title="" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>Tell us about your dog</Text>
          <Text style={styles.subtitle}>This helps us personalize the experience</Text>
        </View>

        {/* Dog Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Ionicons name="camera" size={28} color="#15803D" />
          </View>
          <Text style={styles.avatarHint}>Add a photo</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Name"
            placeholder="e.g. Buddy"
            value={name}
            onChangeText={setName}
          />

          <TouchableOpacity
            onPress={() => setShowBreedPicker(!showBreedPicker)}
            style={styles.breedSelector}
            activeOpacity={0.7}
          >
            <Text style={styles.breedLabel}>Breed</Text>
            <View style={styles.breedValue}>
              <Text style={[styles.breedText, !breed && styles.breedPlaceholder]}>
                {breed || 'Select breed'}
              </Text>
              <Ionicons
                name={showBreedPicker ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#9CA3AF"
              />
            </View>
          </TouchableOpacity>

          {showBreedPicker && (
            <View style={styles.breedList}>
              {BREEDS.map((b) => (
                <TouchableOpacity
                  key={b}
                  onPress={() => {
                    setBreed(b);
                    setShowBreedPicker(false);
                  }}
                  style={[
                    styles.breedOption,
                    breed === b && styles.breedOptionSelected,
                  ]}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      styles.breedOptionText,
                      breed === b && styles.breedOptionTextSelected,
                    ]}
                  >
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Age"
                placeholder="Years"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Weight"
                placeholder="kg"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          size="lg"
          disabled={!isValid}
          loading={loading}
        />
      </View>
    </View>
  );
}

function calculateBirthDate(ageYears: number): string {
  const now = new Date();
  now.setFullYear(now.getFullYear() - ageYears);
  return now.toISOString().split('T')[0];
}
