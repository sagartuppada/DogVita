/**
 * SetupDogProfileScreen - Dog profile creation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button, Input, Header } from '../../components/common';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';
import type { OnboardingScreenProps } from '../../navigation/types';

const BREEDS = [
  'Labrador', 'Golden Retriever', 'German Shepherd', 'French Bulldog',
  'Bulldog', 'Poodle', 'Beagle', 'Rottweiler', 'Dachshund', 'Other',
];

export default function SetupDogProfileScreen({
  navigation,
}: OnboardingScreenProps<'SetupDog'>) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [showBreedPicker, setShowBreedPicker] = useState(false);

  const isValid = name.trim().length > 0 && breed.length > 0;

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
            <Ionicons name="camera" size={28} color={colors.primary.dark} />
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
                color={colors.text.tertiary}
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

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title="Continue"
          onPress={() => navigation.navigate('PairDevice')}
          variant="primary"
          size="lg"
          disabled={!isValid}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  headerSection: {
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.styles.headingLG,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.styles.bodyMD,
    color: colors.text.secondary,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarHint: {
    ...typography.styles.caption,
    color: colors.primary.dark,
  },
  form: {
    marginBottom: spacing.lg,
  },
  breedSelector: {
    marginBottom: spacing.lg,
  },
  breedLabel: {
    ...typography.styles.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  breedValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.inputPadding.vertical,
    paddingHorizontal: spacing.inputPadding.horizontal,
  },
  breedText: {
    ...typography.styles.bodyLG,
    color: colors.text.primary,
  },
  breedPlaceholder: {
    color: colors.text.tertiary,
  },
  breedList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  breedOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  breedOptionSelected: {
    backgroundColor: colors.primary[50],
  },
  breedOptionText: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
  },
  breedOptionTextSelected: {
    color: colors.primary.dark,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
  },
});
