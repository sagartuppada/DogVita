/**
 * DogCard - Displays dog summary card
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, StatusBadge } from '../../components/common';
import { colors, spacing, typography } from '../../theme';
import { Dog } from '../../types';

interface DogCardProps {
  dog: Dog;
  onPress?: () => void;
  isActive?: boolean;
}

export const DogCard: React.FC<DogCardProps> = ({ dog, onPress, isActive = false }) => {
  const age = new Date().getFullYear() - new Date(dog.birthDate).getFullYear();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card variant={isActive ? 'elevated' : 'default'} style={isActive ? styles.activeCard : undefined}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="paw" size={32} color={colors.primary[600]} />
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{dog.name}</Text>
              {isActive && <StatusBadge label="Active" variant="success" size="sm" />}
            </View>
            <Text style={styles.breed}>{dog.breed}</Text>
          </View>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.statText}>{age} years</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="fitness-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.statText}>{dog.weight} {dog.weightUnit}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name={dog.gender === 'male' ? 'male' : 'female'} size={16} color={colors.text.secondary} />
            <Text style={styles.statText}>{dog.gender}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  activeCard: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.styles.titleLarge,
    color: colors.text.primary,
  },
  breed: {
    ...typography.styles.bodyMedium,
    color: colors.text.secondary,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
  },
});

export default DogCard;