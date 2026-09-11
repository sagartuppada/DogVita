/**
 * DogProfileScreen - View and edit dog profile details
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { Card, Input, Button } from '../../components/common';
import { spacing, typography, borderRadius } from '../../theme';
import type { DogProfileScreenProps } from '../../navigation/types';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' as const },
  { label: 'Female', value: 'female' as const },
];

const WEIGHT_UNITS = [
  { label: 'kg', value: 'kg' as const },
  { label: 'lb', value: 'lb' as const },
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
    ...typography.styles.headingLG,
    color: '#111827',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.styles.bodyMD,
    color: '#9CA3AF',
    marginTop: spacing.md,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  photoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#16A34A18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  photoLabel: {
    ...typography.styles.headingMD,
    color: '#111827',
  },
  photoSub: {
    ...typography.styles.bodySM,
    color: '#9CA3AF',
    marginTop: 2,
  },
  ageBadge: {
    ...typography.styles.caption,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: spacing.xs,
    backgroundColor: '#16A34A12',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  quickLinks: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.page,
    marginBottom: spacing.lg,
  },
  quickLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  quickLinkText: {
    ...typography.styles.bodySM,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
  },
  card: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.styles.label,
    color: '#6B7280',
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.styles.label,
    color: '#6B7280',
    marginBottom: spacing.sm,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: '#EDE2C6',
    borderWidth: 1.5,
    borderColor: '#F0E8D8',
  },
  genderOptionActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  genderOptionText: {
    ...typography.styles.bodyMD,
    color: '#111827',
    fontWeight: '600',
  },
  genderOptionTextActive: {
    color: '#FFFFFF',
  },
  weightRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  weightInput: {
    flex: 1,
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  unitOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#EDE2C6',
  },
  unitOptionActive: {
    backgroundColor: '#16A34A',
  },
  unitOptionText: {
    ...typography.styles.bodySM,
    color: '#111827',
    fontWeight: '600',
  },
  unitOptionTextActive: {
    color: '#FFFFFF',
  },
  readOnlyFields: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8D8',
  },
  infoLabel: {
    ...typography.styles.bodySM,
    color: '#9CA3AF',
  },
  infoValue: {
    ...typography.styles.bodySM,
    color: '#111827',
    fontWeight: '500',
  },
  actions: {
    marginHorizontal: spacing.page,
    marginTop: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
});

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

export default function DogProfileScreen({ navigation, route }: DogProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const dogId = route.params?.dogId;
  const dogs = useDogStore((s) => s.dogs);
  const updateDog = useDogStore((s) => s.updateDog);
  const deleteDog = useDogStore((s) => s.deleteDog);

  const dog = useMemo(() => dogs.find((d) => d.id === dogId) ?? null, [dogs, dogId]);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(dog?.name ?? '');
  const [breed, setBreed] = useState(dog?.breed ?? '');
  const [birthDate, setBirthDate] = useState(dog?.birthDate ?? '');
  const [weight, setWeight] = useState(dog?.weight ? String(dog.weight) : '');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>(dog?.weightUnit ?? 'kg');
  const [gender, setGender] = useState<'male' | 'female' | undefined>(dog?.gender);
  const [microchipId, setMicrochipId] = useState(dog?.microchipId ?? '');
  const [vetName, setVetName] = useState(dog?.vetInfo?.name ?? '');
  const [vetPhone, setVetPhone] = useState(dog?.vetInfo?.phone ?? '');
  const [vetAddress, setVetAddress] = useState(dog?.vetInfo?.address ?? '');

  const age = useMemo(() => {
    if (!dog?.birthDate) return null;
    const birth = new Date(dog.birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    if (months < 0) return `${years - 1} years ${12 + months} months`;
    if (years === 0) return `${months} months`;
    return `${years} years ${months} months`;
  }, [dog?.birthDate]);

  const handleSave = useCallback(async () => {
    if (!dogId) return;
    if (!name.trim()) {
      Alert.alert('Error', 'Dog name is required');
      return;
    }

    const weightNum = weight.trim() ? parseFloat(weight) : undefined;

    await updateDog({
      id: dogId,
      name: name.trim(),
      breed: breed.trim(),
      birthDate: birthDate.trim() || undefined,
      weight: weightNum,
      weightUnit,
      gender,
      microchipId: microchipId.trim() || undefined,
      vetInfo: vetName.trim()
        ? { name: vetName.trim(), phone: vetPhone.trim(), address: vetAddress.trim() }
        : undefined,
    });

    setIsEditing(false);
  }, [dogId, name, breed, birthDate, weight, weightUnit, gender, microchipId, vetName, vetPhone, vetAddress, updateDog]);

  const handleDelete = useCallback(() => {
    if (!dogId) return;
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete ${dog?.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDog(dogId);
            navigation.goBack();
          },
        },
      ]
    );
  }, [dogId, dog?.name, deleteDog, navigation]);

  if (!dog) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Ionicons name="paw-outline" size={48} color="#9CA3AF" />
          <Text style={styles.errorText}>Dog not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Profile' : dog.name}</Text>
        <TouchableOpacity onPress={() => setIsEditing((e) => !e)} style={styles.backButton}>
          <Ionicons name={isEditing ? 'close' : 'create-outline'} size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo Placeholder */}
        <View style={styles.photoSection}>
          <View style={styles.photoCircle}>
            <Ionicons name="paw" size={40} color="#16A34A" />
          </View>
          <Text style={styles.photoLabel}>{dog.name}</Text>
          <Text style={styles.photoSub}>{dog.breed}</Text>
          {age && <Text style={styles.ageBadge}>{age} old</Text>}
        </View>

        {/* Profile Fields */}
        <Card variant="default" padding="lg" style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Info</Text>

          {isEditing ? (
            <>
              <Input label="Name" value={name} onChangeText={setName} placeholder="Dog's name" />
              <Input label="Breed" value={breed} onChangeText={setBreed} placeholder="e.g. Golden Retriever" />
              <Input label="Birth Date" value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" />

              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.genderOption,
                      gender === option.value && styles.genderOptionActive,
                    ]}
                    onPress={() => setGender(option.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={option.value === 'male' ? 'male' : 'female'}
                      size={18}
                      color={gender === option.value ? '#FFFFFF' : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.genderOptionText,
                        gender === option.value && styles.genderOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Weight</Text>
              <View style={styles.weightRow}>
                <Input
                  containerStyle={styles.weightInput}
                  value={weight}
                  onChangeText={(text) => setWeight(text.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholder="0.0"
                />
                <View style={styles.unitToggle}>
                  {WEIGHT_UNITS.map((u) => (
                    <TouchableOpacity
                      key={u.value}
                      style={[
                        styles.unitOption,
                        weightUnit === u.value && styles.unitOptionActive,
                      ]}
                      onPress={() => setWeightUnit(u.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.unitOptionText,
                          weightUnit === u.value && styles.unitOptionTextActive,
                        ]}
                      >
                        {u.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Input label="Microchip ID" value={microchipId} onChangeText={setMicrochipId} placeholder="Optional" />
            </>
          ) : (
            <View style={styles.readOnlyFields}>
              <InfoRow label="Name" value={dog.name} />
              <InfoRow label="Breed" value={dog.breed} />
              <InfoRow label="Birth Date" value={dog.birthDate ? new Date(dog.birthDate).toLocaleDateString() : '--'} />
              <InfoRow label="Gender" value={dog.gender ? (dog.gender === 'male' ? 'Male' : 'Female') : '--'} />
              <InfoRow label="Weight" value={dog.weight ? `${dog.weight} ${dog.weightUnit || 'kg'}` : '--'} />
              <InfoRow label="Microchip" value={dog.microchipId || '--'} />
            </View>
          )}
        </Card>

        {/* Vet Info */}
        <Card variant="default" padding="lg" style={styles.card}>
          <Text style={styles.sectionTitle}>Veterinary Information</Text>

          {isEditing ? (
            <>
              <Input label="Vet Name" value={vetName} onChangeText={setVetName} placeholder="Dr. Smith" />
              <Input label="Phone" value={vetPhone} onChangeText={setVetPhone} keyboardType="phone-pad" placeholder="+1 234 567 8900" />
              <Input label="Address" value={vetAddress} onChangeText={setVetAddress} placeholder="Clinic address" multiline numberOfLines={2} />
            </>
          ) : (
            <View style={styles.readOnlyFields}>
              <InfoRow label="Vet Name" value={dog.vetInfo?.name || '--'} />
              <InfoRow label="Phone" value={dog.vetInfo?.phone || '--'} />
              <InfoRow label="Address" value={dog.vetInfo?.address || '--'} />
            </View>
          )}
        </Card>

        {/* Actions */}
        {isEditing ? (
          <View style={styles.actions}>
            <Button title="Save Changes" onPress={handleSave} variant="primary" />
            <Button title="Cancel" onPress={() => setIsEditing(false)} variant="ghost" />
          </View>
        ) : (
          <View style={styles.actions}>
            <Button title="Edit Profile" onPress={() => setIsEditing(true)} variant="outline" />
            <Button
              title="Delete Profile"
              onPress={handleDelete}
              variant="ghost"
              textStyle={{ color: '#EF4444' }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
