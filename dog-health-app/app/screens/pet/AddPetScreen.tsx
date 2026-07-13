import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { colors, spacing, borderRadius, typography } from '../../theme';

const DOG_BREEDS = [
  'Labrador Retriever', 'German Shepherd', 'Golden Retriever',
  'French Bulldog', 'Bulldog', 'Poodle', 'Beagle', 'Rottweiler',
  'Dachshund', 'German Shorthaired Pointer',
];

const CAT_BREEDS = [
  'Domestic Shorthair', 'Persian', 'Siamese', 'Maine Coon',
  'Bengal', 'Ragdoll', 'British Shorthair', 'Abyssinian',
];

export default function AddPetScreen() {
  const navigation = useNavigation();
  const addDog = useDogStore((s) => s.addDog);

  const [species, setSpecies] = useState<'dog' | 'cat'>('dog');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [gender, setGender] = useState<'male' | 'female' | undefined>();

  const breeds = species === 'dog' ? DOG_BREEDS : CAT_BREEDS;

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name.');
      return;
    }
    if (!breed) {
      Alert.alert('Required', 'Please select a breed.');
      return;
    }

    const birthDate = age
      ? new Date(Date.now() - Number(age) * 365.25 * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    addDog({
      name: name.trim(),
      breed,
      species,
      birthDate,
      weight: weight ? Number(weight) : undefined,
      weightUnit,
      gender,
    });

    navigation.goBack();
  }, [name, breed, species, age, weight, weightUnit, gender, addDog, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Pet</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Species</Text>
        <View style={styles.speciesRow}>
          {(['dog', 'cat'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.speciesPill, species === s && styles.speciesPillActive]}
              onPress={() => { setSpecies(s); setBreed(''); }}
            >
              <Ionicons
                name={s === 'dog' ? 'paw' : 'cat'}
                size={18}
                color={species === s ? colors.white : colors.text.secondary}
              />
              <Text style={[styles.speciesLabel, species === s && styles.speciesLabelActive]}>
                {s === 'dog' ? 'Dog' : 'Cat'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Pet name"
          placeholderTextColor={colors.text.tertiary}
        />

        <Text style={styles.label}>Breed *</Text>
        <View style={styles.breedGrid}>
          {breeds.map((b) => (
            <TouchableOpacity
              key={b}
              style={[styles.breedPill, breed === b && styles.breedPillActive]}
              onPress={() => setBreed(b)}
            >
              <Text style={[styles.breedLabel, breed === b && styles.breedLabelActive]}>
                {b}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Age (years)</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder="e.g. 3"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Weight</Text>
        <View style={styles.weightRow}>
          <TextInput
            style={[styles.input, styles.weightInput]}
            value={weight}
            onChangeText={setWeight}
            placeholder="e.g. 25"
            placeholderTextColor={colors.text.tertiary}
            keyboardType="numeric"
          />
          <View style={styles.unitRow}>
            {(['kg', 'lb'] as const).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.unitPill, weightUnit === u && styles.unitPillActive]}
                onPress={() => setWeightUnit(u)}
              >
                <Text style={[styles.unitLabel, weightUnit === u && styles.unitLabelActive]}>
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.label}>Photo</Text>
        <TouchableOpacity style={styles.photoPlaceholder} activeOpacity={0.7}>
          <Ionicons name="camera-outline" size={40} color={colors.text.secondary} />
          <Text style={styles.photoText}>Add Photo</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {(['male', 'female'] as const).map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderPill, gender === g && styles.genderPillActive]}
              onPress={() => setGender(gender === g ? undefined : g)}
            >
              <Ionicons
                name={g === 'male' ? 'male' : 'female'}
                size={18}
                color={gender === g ? colors.white : colors.text.secondary}
              />
              <Text style={[styles.genderLabel, gender === g && styles.genderLabelActive]}>
                {g === 'male' ? 'Male' : 'Female'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Add Pet</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + spacing.sm,
    paddingBottom: spacing.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.styles.headingMD, fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  label: { ...typography.styles.caption, color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.styles.bodyMD,
    color: colors.text.primary,
  },
  speciesRow: { flexDirection: 'row', gap: spacing.sm },
  speciesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background.card,
  },
  speciesPillActive: { backgroundColor: colors.primary.DEFAULT },
  speciesLabel: { ...typography.styles.bodyMD, color: colors.text.secondary },
  speciesLabelActive: { color: colors.white },
  breedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  breedPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background.card,
  },
  breedPillActive: { backgroundColor: colors.primary.DEFAULT },
  breedLabel: { ...typography.styles.caption, color: colors.text.secondary },
  breedLabelActive: { color: colors.white },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  weightInput: { flex: 1 },
  unitRow: { flexDirection: 'row', gap: spacing.xs },
  unitPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background.card,
  },
  unitPillActive: { backgroundColor: colors.primary.DEFAULT },
  unitLabel: { ...typography.styles.bodyMD, color: colors.text.secondary },
  unitLabelActive: { color: colors.white },
  genderRow: { flexDirection: 'row', gap: spacing.sm },
  genderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background.card,
  },
  genderPillActive: { backgroundColor: colors.primary.DEFAULT },
  genderLabel: { ...typography.styles.bodyMD, color: colors.text.secondary },
  genderLabelActive: { color: colors.white },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  photoText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  saveBtn: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnText: { ...typography.styles.bodyMD, color: colors.white, fontWeight: '600' },
});
