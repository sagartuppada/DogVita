/**
 * SetupDogProfileScreen - Add dog profile
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Input, Card } from '../../components/common';
import { colors, spacing, typography } from '../../theme';
import { OnboardingStackParamList } from '../../navigation/types';
import { useDogStore } from '../../store';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'SetupDogProfile'>;

export const SetupDogProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const addDog = useDogStore((state) => state.addDog);

  const handleCreateProfile = async () => {
    if (!name.trim() || !breed.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await addDog({
        name: name.trim(),
        breed: breed.trim(),
        birthDate: new Date(Date.now() - parseInt(age || '0') * 365 * 24 * 60 * 60 * 1000).toISOString(),
        weight: parseFloat(weight) || 0,
        weightUnit: 'kg',
        gender: 'male',
      });
      navigation.navigate('PairDevice');
    } catch {
      Alert.alert('Error', 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Add your dog</Text>
          <Text style={styles.subtitle}>Enter your dog's information</Text>
        </View>
        <Card style={styles.form}>
          <Input label="Dog's Name" placeholder="e.g., Buddy" value={name} onChangeText={setName} />
          <Input label="Breed" placeholder="e.g., Golden Retriever" value={breed} onChangeText={setBreed} />
          <Input
            label="Age (years)"
            placeholder="e.g., 3"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
          <Input
            label="Weight (kg)"
            placeholder="e.g., 25"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
        </Card>
        <View style={styles.buttons}>
          <Button
            title="Continue"
            onPress={handleCreateProfile}
            loading={loading}
            style={styles.button}
          />
          <Button
            title="Skip for now"
            onPress={() => navigation.navigate('PairDevice')}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    padding: spacing.page,
  },
  header: {
    marginBottom: spacing.xxl,
    marginTop: spacing.lg,
  },
  title: {
    ...typography.styles.headlineMedium,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.styles.bodyLarge,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  form: {
    marginBottom: spacing.lg,
  },
  buttons: {
    gap: spacing.md,
  },
  button: {
    marginBottom: spacing.sm,
  },
});

export default SetupDogProfileScreen;