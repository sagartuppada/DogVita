/**
 * WeightHistoryScreen - Track and visualize weight over time
 */

import React, { useMemo, useCallback } from 'react';
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
import { Card, Button, EmptyState } from '../../components/common';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { WeightHistoryScreenProps } from '../../navigation/types';

const formatWeight = (weight: number, unit: 'kg' | 'lb') => {
  return `${weight.toFixed(1)} ${unit}`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return { icon: 'trending-up', color: colors.status.warning };
    case 'down':
      return { icon: 'trending-down', color: colors.status.info };
    default:
      return { icon: 'remove', color: colors.text.tertiary };
  }
};

export default function WeightHistoryScreen({ navigation, route }: WeightHistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const dogId = route.params?.dogId;
  const dogs = useDogStore((s) => s.dogs);
  const weightHistory = useDogStore((s) => s.weightHistory);
  const addWeightRecord = useDogStore((s) => s.addWeightRecord);
  const deleteWeightRecord = useDogStore((s) => s.deleteWeightRecord);
  const updateWeightRecord = useDogStore((s) => s.updateWeightRecord);

  const dog = useMemo(() => dogs.find((d) => d.id === dogId) ?? null, [dogs, dogId]);

  const dogWeightHistory = useMemo(() => {
    return weightHistory
      .filter((r) => r.dogId === dogId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [weightHistory, dogId]);

  const latest = dogWeightHistory[dogWeightHistory.length - 1];
  const earliest = dogWeightHistory[0];
  const totalChange = latest && earliest ? latest.weight - earliest.weight : 0;

  const [modalVisible, setModalVisible] = React.useState(false);
  const [editRecord, setEditRecord] = React.useState<typeof dogWeightHistory[0] | null>(null);
  const [weightInput, setWeightInput] = React.useState('');
  const [dateInput, setDateInput] = React.useState('');
  const [notesInput, setNotesInput] = React.useState('');
  const [unitInput, setUnitInput] = React.useState<'kg' | 'lb'>('kg');

  const openAdd = useCallback(() => {
    setEditRecord(null);
    setWeightInput('');
    setDateInput(new Date().toISOString().split('T')[0]);
    setNotesInput('');
    setUnitInput(dog?.weightUnit ?? 'kg');
    setModalVisible(true);
  }, [dog?.weightUnit]);

  const openEdit = useCallback((record: typeof dogWeightHistory[0]) => {
    setEditRecord(record);
    setWeightInput(String(record.weight));
    setDateInput(record.date);
    setNotesInput(record.notes ?? '');
    setUnitInput(record.weightUnit);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!dogId) return;
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
      return;
    }
    if (!dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Invalid Date', 'Please enter date as YYYY-MM-DD.');
      return;
    }

    if (editRecord) {
      updateWeightRecord({
        ...editRecord,
        weight,
        weightUnit: unitInput,
        date: dateInput,
        notes: notesInput.trim() || undefined,
      });
    } else {
      addWeightRecord({
        dogId,
        weight,
        weightUnit: unitInput,
        date: dateInput,
        notes: notesInput.trim() || undefined,
      });
    }
    setModalVisible(false);
  }, [dogId, weightInput, dateInput, notesInput, unitInput, editRecord, addWeightRecord, updateWeightRecord]);

  const handleDelete = useCallback((recordId: string) => {
    Alert.alert('Delete Entry', 'Remove this weight record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWeightRecord(recordId) },
    ]);
  }, [deleteWeightRecord]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Weight History</Text>
        <TouchableOpacity onPress={openAdd} style={styles.backButton}>
          <Ionicons name="add" size={24} color={colors.primary.DEFAULT} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        {dogWeightHistory.length > 1 && (
          <Card variant="elevated" padding="md" style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {latest ? formatWeight(latest.weight, latest.weightUnit) : '--'}
                </Text>
                <Text style={styles.statLabel}>Current</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: totalChange > 0 ? colors.status.warning : totalChange < 0 ? colors.status.info : colors.text.primary }]}>
                  {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)} {latest?.weightUnit}
                </Text>
                <Text style={styles.statLabel}>Total Change</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{dogWeightHistory.length}</Text>
                <Text style={styles.statLabel}>Entries</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Current weight vs target */}
        {dog?.weight && (
          <Card variant="default" padding="md" style={styles.targetCard}>
            <View style={styles.targetRow}>
              <Ionicons name="scale-outline" size={20} color={colors.primary.DEFAULT} />
              <Text style={styles.targetText}>
                Target: {dog.weight} {dog.weightUnit || 'kg'}
              </Text>
              {latest && (
                <Text style={styles.targetDiff}>
                  {Math.abs(latest.weight - dog.weight).toFixed(1)} {latest.weightUnit} {latest.weight > dog.weight ? 'over' : 'under'}
                </Text>
              )}
            </View>
          </Card>
        )}

        {/* Weight List */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Records</Text>
        </View>

        {dogWeightHistory.length === 0 ? (
          <EmptyState
            icon="scale-outline"
            title="No Weight Records"
            message="Tap + to add your first weight entry."
          />
        ) : (
          dogWeightHistory.map((record, index) => {
            const trend = getTrendIcon(record.trend);
            const isLast = index === dogWeightHistory.length - 1;
            return (
              <TouchableOpacity
                key={record.id}
                onPress={() => openEdit(record)}
                onLongPress={() => handleDelete(record.id)}
                activeOpacity={0.7}
              >
                <Card variant="default" padding="md" style={styles.recordCard}>
                  <View style={styles.recordRow}>
                    <View style={styles.recordLeft}>
                      <Text style={styles.recordWeight}>
                        {formatWeight(record.weight, record.weightUnit)}
                      </Text>
                      <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                      {record.notes && (
                        <Text style={styles.recordNotes} numberOfLines={1}>
                          {record.notes}
                        </Text>
                      )}
                    </View>
                    <View style={styles.recordRight}>
                      {!isLast && (
                        <Ionicons name={trend.icon as any} size={18} color={trend.color} />
                      )}
                      {isLast && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editRecord ? 'Edit Weight' : 'Add Weight'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Weight</Text>
            <View style={styles.modalWeightRow}>
              <TextInput
                style={styles.modalInput}
                value={weightInput}
                onChangeText={(text) => setWeightInput(text.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={colors.text.tertiary}
              />
              <View style={styles.unitToggle}>
                {(['kg', 'lb'] as const).map((u) => (
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

            <Text style={styles.modalLabel}>Date</Text>
            <TextInput
              style={styles.modalInput}
              value={dateInput}
              onChangeText={setDateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.tertiary}
            />

            <Text style={styles.modalLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
              value={notesInput}
              onChangeText={setNotesInput}
              placeholder="e.g. Post-holiday check"
              placeholderTextColor={colors.text.tertiary}
              multiline
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
              <Text style={styles.saveBtnText}>{editRecord ? 'Save Changes' : 'Add Record'}</Text>
            </TouchableOpacity>

            {editRecord && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  setModalVisible(false);
                  handleDelete(editRecord.id);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteBtnText}>Delete Record</Text>
              </TouchableOpacity>
            )}
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
  statsCard: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border.light,
    alignSelf: 'center',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  targetCard: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.md,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  targetText: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  targetDiff: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
  },
  listHeader: {
    paddingHorizontal: spacing.page,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  listTitle: {
    ...typography.styles.label,
    color: colors.text.secondary,
  },
  recordCard: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.md,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordLeft: {
    flex: 1,
  },
  recordWeight: {
    ...typography.styles.bodyMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  recordDate: {
    ...typography.styles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  recordNotes: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  currentBadge: {
    backgroundColor: colors.primary.DEFAULT + '18',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
  currentBadgeText: {
    ...typography.styles.caption,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
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
  modalWeightRow: {
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
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteBtn: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  deleteBtnText: {
    color: colors.status.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
