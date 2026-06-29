/**
 * VaccinationRecordsScreen - Manage dog vaccination records
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
import { Card, EmptyState } from '../../components/common';
import { spacing, typography, borderRadius } from '../../theme';
import type { VaccinationRecordsScreenProps } from '../../navigation/types';
import type { VaccinationStatus, VaccinationRecord } from '../../types';

const VACCINE_NAMES = [
  'Rabies',
  'DHPP (Distemper)',
  'Bordetella',
  'Leptospirosis',
  'Lyme Disease',
  'Canine Influenza',
  'Parvovirus',
  'Coronavirus',
  'Other',
];

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const daysUntil = (dateStr?: string) => {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return days;
};

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
    color: '#1F1A17',
  },
  summaryCard: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#EDE2C6',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  summaryText: {
    ...typography.styles.bodySM,
    fontWeight: '600',
  },
  listHeader: {
    paddingHorizontal: spacing.page,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  listTitle: {
    ...typography.styles.label,
    color: '#6B625A',
  },
  recordCard: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.md,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    ...typography.styles.bodyMD,
    color: '#1F1A17',
    fontWeight: '600',
  },
  recordMeta: {
    marginTop: 2,
  },
  recordMetaText: {
    ...typography.styles.caption,
    color: '#A39888',
  },
  recordVet: {
    ...typography.styles.caption,
    color: '#6B625A',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  statusText: {
    ...typography.styles.caption,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F5E9CD',
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
    color: '#1F1A17',
  },
  modalLabel: {
    ...typography.styles.caption,
    color: '#6B625A',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  modalInput: {
    backgroundColor: '#FBF4E4',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: '#1F1A17',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E9DDC9',
  },
  nameSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FBF4E4',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: '#E9DDC9',
  },
  nameSelectorText: {
    ...typography.styles.bodyMD,
    color: '#1F1A17',
  },
  nameSelectorPlaceholder: {
    ...typography.styles.bodyMD,
    color: '#A39888',
  },
  namePicker: {
    backgroundColor: '#FBF4E4',
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#F0E8D8',
  },
  nameOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  nameOptionActive: {
    backgroundColor: '#F3A93B18',
  },
  nameOptionText: {
    ...typography.styles.bodySM,
    color: '#1F1A17',
  },
  nameOptionTextActive: {
    color: '#F3A93B',
    fontWeight: '600',
  },
  nameInput: {
    ...typography.styles.bodyMD,
    color: '#1F1A17',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0E8D8',
    marginTop: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  toggleLabel: {
    ...typography.styles.bodyMD,
    color: '#1F1A17',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  saveBtn: {
    backgroundColor: '#F3A93B',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnText: {
    color: '#FFFFFF',
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
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
});

const STATUS_CONFIG: Record<VaccinationStatus, { color: string; bg: string; label: string; icon: string }> = {
  completed: { color: '#4CAF50', bg: '#4CAF5018', label: 'Completed', icon: 'checkmark-circle' },
  upcoming: { color: '#5B9BD5', bg: '#5B9BD518', label: 'Upcoming', icon: 'time' },
  due: { color: '#FF9800', bg: '#FF980018', label: 'Due Soon', icon: 'alert-circle' },
  overdue: { color: '#F44336', bg: '#F4433618', label: 'Overdue', icon: 'warning' },
  skipped: { color: '#A39888', bg: '#A3988812', label: 'Skipped', icon: 'close-circle' },
};

export default function VaccinationRecordsScreen({ navigation, route }: VaccinationRecordsScreenProps) {
  const insets = useSafeAreaInsets();
  const dogId = route.params?.dogId;
  const dogs = useDogStore((s) => s.dogs);
  const vaccinationRecords = useDogStore((s) => s.vaccinationRecords);
  const addVaccinationRecord = useDogStore((s) => s.addVaccinationRecord);
  const updateVaccinationRecord = useDogStore((s) => s.updateVaccinationRecord);
  const deleteVaccinationRecord = useDogStore((s) => s.deleteVaccinationRecord);

  const dog = useMemo(() => dogs.find((d) => d.id === dogId) ?? null, [dogs, dogId]);

  const dogVaccinations = useMemo(() => {
    return vaccinationRecords.filter((r) => r.dogId === dogId);
  }, [vaccinationRecords, dogId]);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [editRecord, setEditRecord] = React.useState<VaccinationRecord | null>(null);
  const [vaccineName, setVaccineName] = React.useState('');
  const [administeredDate, setAdministeredDate] = React.useState('');
  const [nextDueDate, setNextDueDate] = React.useState('');
  const [vetName, setVetName] = React.useState('');
  const [batchNumber, setBatchNumber] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [reminderEnabled, setReminderEnabled] = React.useState(true);
  const [showNamePicker, setShowNamePicker] = React.useState(false);

  const openAdd = useCallback(() => {
    setEditRecord(null);
    setVaccineName('');
    setAdministeredDate('');
    setNextDueDate('');
    setVetName('');
    setBatchNumber('');
    setNotes('');
    setReminderEnabled(true);
    setShowNamePicker(false);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((record: VaccinationRecord) => {
    setEditRecord(record);
    setVaccineName(record.name);
    setAdministeredDate(record.dateAdministered ?? '');
    setNextDueDate(record.nextDueDate ?? '');
    setVetName(record.vetName ?? '');
    setBatchNumber(record.batchNumber ?? '');
    setNotes(record.notes ?? '');
    setReminderEnabled(record.reminderEnabled);
    setShowNamePicker(false);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!dogId) return;
    if (!vaccineName.trim()) {
      Alert.alert('Missing Name', 'Please enter a vaccine name.');
      return;
    }

    const payload = {
      dogId,
      name: vaccineName.trim(),
      dateAdministered: administeredDate.trim() || undefined,
      nextDueDate: nextDueDate.trim() || undefined,
      vetName: vetName.trim() || undefined,
      batchNumber: batchNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      reminderEnabled,
    };

    if (editRecord) {
      updateVaccinationRecord({ ...editRecord, ...payload });
    } else {
      addVaccinationRecord(payload);
    }
    setModalVisible(false);
  }, [dogId, vaccineName, administeredDate, nextDueDate, vetName, batchNumber, notes, reminderEnabled, editRecord, addVaccinationRecord, updateVaccinationRecord]);

  const handleDelete = useCallback((recordId: string) => {
    Alert.alert('Delete Record', 'Remove this vaccination record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteVaccinationRecord(recordId) },
    ]);
  }, [deleteVaccinationRecord]);

  const sortedRecords = useMemo(() => {
    const statusOrder = { overdue: 0, due: 1, upcoming: 2, completed: 3, skipped: 4 };
    return [...dogVaccinations].sort((a, b) => {
      const sa = statusOrder[a.status];
      const sb = statusOrder[b.status];
      if (sa !== sb) return sa - sb;
      if (a.nextDueDate && b.nextDueDate) return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
      return 0;
    });
  }, [dogVaccinations]);

  const overdueCount = dogVaccinations.filter((v) => v.status === 'overdue').length;
  const dueCount = dogVaccinations.filter((v) => v.status === 'due').length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1F1A17" />
        </TouchableOpacity>
        <Text style={styles.title}>Vaccinations</Text>
        <TouchableOpacity onPress={openAdd} style={styles.backButton}>
          <Ionicons name="add" size={24} color="#F3A93B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        {(overdueCount > 0 || dueCount > 0) && (
          <Card variant="elevated" padding="md" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              {overdueCount > 0 && (
                <View style={styles.summaryBadge}>
                  <Ionicons name="warning" size={16} color="#F44336" />
                  <Text style={[styles.summaryText, { color: '#F44336' }]}>
                    {overdueCount} overdue
                  </Text>
                </View>
              )}
              {dueCount > 0 && (
                <View style={styles.summaryBadge}>
                  <Ionicons name="alert-circle" size={16} color="#FF9800" />
                  <Text style={[styles.summaryText, { color: '#FF9800' }]}>
                    {dueCount} due soon
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Records */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {dogVaccinations.length} Record{dogVaccinations.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {sortedRecords.length === 0 ? (
          <EmptyState
            icon="medical-outline"
            title="No Vaccinations"
            message="Tap + to add vaccination records for your dog."
          />
        ) : (
          sortedRecords.map((record) => {
            const status = STATUS_CONFIG[record.status];
            const days = daysUntil(record.nextDueDate);
            return (
              <TouchableOpacity
                key={record.id}
                onPress={() => openEdit(record)}
                onLongPress={() => handleDelete(record.id)}
                activeOpacity={0.7}
              >
                <Card variant="default" padding="md" style={styles.recordCard}>
                  <View style={styles.recordRow}>
                    <View style={[styles.statusIcon, { backgroundColor: status.bg }]}>
                      <Ionicons name={status.icon as any} size={18} color={status.color} />
                    </View>
                    <View style={styles.recordInfo}>
                      <Text style={styles.recordName}>{record.name}</Text>
                      <View style={styles.recordMeta}>
                        <Text style={styles.recordMetaText}>
                          {record.dateAdministered ? `Given: ${formatDate(record.dateAdministered)}` : 'Not yet given'}
                        </Text>
                        {record.nextDueDate && (
                          <Text style={[
                            styles.recordMetaText,
                            days !== null && days <= 0 && { color: '#F44336' },
                            days !== null && days > 0 && days <= 30 && { color: '#FF9800' },
                          ]}>
                            {days !== null ? (days <= 0 ? `Overdue by ${Math.abs(days)} days` : `Due in ${days} days`) : ''}
                          </Text>
                        )}
                      </View>
                      {record.vetName && (
                        <Text style={styles.recordVet}>Vet: {record.vetName}</Text>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
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
              <Text style={styles.modalTitle}>
                {editRecord ? 'Edit Vaccination' : 'Add Vaccination'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B625A" />
              </TouchableOpacity>
            </View>

            {/* Vaccine Name */}
            <Text style={styles.modalLabel}>Vaccine Name</Text>
            <TouchableOpacity
              style={styles.nameSelector}
              onPress={() => setShowNamePicker((s) => !s)}
              activeOpacity={0.7}
            >
              <Text style={vaccineName ? styles.nameSelectorText : styles.nameSelectorPlaceholder}>
                {vaccineName || 'Select or type a vaccine name'}
              </Text>
              <Ionicons name={showNamePicker ? 'chevron-up' : 'chevron-down'} size={16} color="#A39888" />
            </TouchableOpacity>

            {showNamePicker && (
              <View style={styles.namePicker}>
                {VACCINE_NAMES.map((name) => (
                  <TouchableOpacity
                    key={name}
                    style={[
                      styles.nameOption,
                      vaccineName === name && styles.nameOptionActive,
                    ]}
                    onPress={() => {
                      setVaccineName(name);
                      setShowNamePicker(false);
                    }}
                  >
                    <Text style={[
                      styles.nameOptionText,
                      vaccineName === name && styles.nameOptionTextActive,
                    ]}>{name}</Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  style={styles.nameInput}
                  value={vaccineName}
                  onChangeText={(text) => {
                    setVaccineName(text);
                    if (!VACCINE_NAMES.includes(text)) setShowNamePicker(false);
                  }}
                  placeholder="Custom name..."
                  placeholderTextColor="#A39888"
                />
              </View>
            )}

            <Text style={styles.modalLabel}>Date Administered</Text>
            <TextInput
              style={styles.modalInput}
              value={administeredDate}
              onChangeText={setAdministeredDate}
              placeholder="YYYY-MM-DD (optional)"
              placeholderTextColor="#A39888"
            />

            <Text style={styles.modalLabel}>Next Due Date</Text>
            <TextInput
              style={styles.modalInput}
              value={nextDueDate}
              onChangeText={setNextDueDate}
              placeholder="YYYY-MM-DD (optional)"
              placeholderTextColor="#A39888"
            />

            <Text style={styles.modalLabel}>Vet Name</Text>
            <TextInput
              style={styles.modalInput}
              value={vetName}
              onChangeText={setVetName}
              placeholder="Optional"
              placeholderTextColor="#A39888"
            />

            <Text style={styles.modalLabel}>Batch Number</Text>
            <TextInput
              style={styles.modalInput}
              value={batchNumber}
              onChangeText={setBatchNumber}
              placeholder="Optional"
              placeholderTextColor="#A39888"
            />

            <Text style={styles.modalLabel}>Notes</Text>
            <TextInput
              style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional"
              placeholderTextColor="#A39888"
              multiline
            />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Enable Reminder</Text>
              <TouchableOpacity
                onPress={() => setReminderEnabled((r) => !r)}
                style={[
                  styles.toggle,
                  { backgroundColor: reminderEnabled ? '#F3A93B' : '#E9DDC9' },
                ]}
              >
                <View style={[styles.toggleKnob, reminderEnabled && styles.toggleKnobActive]} />
              </TouchableOpacity>
            </View>

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
