/**
 * GeofenceManagerScreen - Create, edit, and delete geofences on the map
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDogStore } from '../../store/dogStore';
import { useTrackingStore } from '../../store/trackingStore';
import { Card } from '../../components/common';
import type { GeofenceManagerScreenProps } from '../../navigation/types';
import { DogMap } from '../../components/maps';
import { spacing, typography, borderRadius } from '../../theme';
import type { Geofence } from '../../types';
import { supabase } from '../../services/api/supabase';

interface GeofenceForm {
  name: string;
  radius: string;
  isActive: boolean;
  alertsEnabled: boolean;
}

const DEFAULT_RADIUS = 100;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E9CD',
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
  instruction: {
    ...typography.styles.caption,
    color: '#A39888',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  mapContainer: {
    height: 280,
    marginHorizontal: spacing.page,
    borderRadius: 16,
    overflow: 'hidden',
  },
  list: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.styles.label,
    color: '#6B625A',
    marginBottom: spacing.md,
  },
  geofenceCard: {
    marginBottom: spacing.md,
  },
  geofenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  geofenceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  geofenceInfo: {
    flex: 1,
  },
  geofenceName: {
    ...typography.styles.bodyMD,
    color: '#1F1A17',
    fontWeight: '600',
  },
  geofenceDetail: {
    ...typography.styles.caption,
    color: '#A39888',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.styles.bodyMD,
    color: '#A39888',
    marginTop: spacing.md,
  },
  emptySub: {
    ...typography.styles.caption,
    color: '#A39888',
    marginTop: spacing.xs,
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
  input: {
    backgroundColor: '#FBF4E4',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: '#1F1A17',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E9DDC9',
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
  saveButton: {
    backgroundColor: '#F3A93B',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function GeofenceManagerScreen({ navigation }: GeofenceManagerScreenProps) {
  const insets = useSafeAreaInsets();
  const geofences = useTrackingStore((s) => s.geofences);
  const addGeofence = useTrackingStore((s) => s.addGeofence);
  const updateGeofence = useTrackingStore((s) => s.updateGeofence);
  const removeGeofence = useTrackingStore((s) => s.removeGeofence);
  const dogs = useDogStore((s) => s.dogs);
  const activeDogId = useDogStore((s) => s.activeDogId);

  const activeDog = useMemo(
    () => dogs.find((d) => d.id === activeDogId) ?? null,
    [dogs, activeDogId]
  );

  const dogGeofences = useMemo(() => {
    if (!activeDogId) return [];
    return geofences.filter((g) => g.dogId === activeDogId);
  }, [geofences, activeDogId]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [tapCoordinate, setTapCoordinate] = useState<{ latitude: number; longitude: number } | null>(null);
  const [form, setForm] = useState<GeofenceForm>({
    name: '',
    radius: String(DEFAULT_RADIUS),
    isActive: true,
    alertsEnabled: true,
  });

  const handleMapPress = useCallback((coordinate: { latitude: number; longitude: number }) => {
    setTapCoordinate(coordinate);
    setEditingGeofence(null);
    setForm({
      name: 'New Geofence',
      radius: String(DEFAULT_RADIUS),
      isActive: true,
      alertsEnabled: true,
    });
    setModalVisible(true);
  }, []);

  const handleEditGeofence = useCallback((geofence: Geofence) => {
    setEditingGeofence(geofence);
    setTapCoordinate(geofence.center);
    setForm({
      name: geofence.name,
      radius: String(Math.round(geofence.radius)),
      isActive: geofence.isActive,
      alertsEnabled: geofence.alertsEnabled,
    });
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!tapCoordinate || !activeDogId) return;

    const radius = parseInt(form.radius, 10);
    if (isNaN(radius) || radius < 10) {
      Alert.alert('Invalid Radius', 'Radius must be at least 10 meters.');
      return;
    }

    if (editingGeofence) {
      updateGeofence({
        ...editingGeofence,
        name: form.name.trim() || 'Geofence',
        radius,
        isActive: form.isActive,
        alertsEnabled: form.alertsEnabled,
      });
    } else {
      let ownerId = activeDogId;
      try {
        const { data } = await supabase.auth.getUser();
        ownerId = data.user?.id ?? activeDogId;
      } catch {
        // Supabase not configured or user not authenticated — fall back to dogId as ownerId
      }
      const newGeofence: Geofence = {
        id: `gf_${Date.now()}`,
        dogId: activeDogId,
        ownerId,
        name: form.name.trim() || 'Geofence',
        center: tapCoordinate,
        radius,
        isActive: form.isActive,
        alertsEnabled: form.alertsEnabled,
      };
      await addGeofence(newGeofence);
    }

    setModalVisible(false);
    setTapCoordinate(null);
    setEditingGeofence(null);
  }, [tapCoordinate, activeDogId, form, editingGeofence, addGeofence, updateGeofence]);

  const handleDelete = useCallback(() => {
    if (!editingGeofence) return;
    Alert.alert(
      'Delete Geofence',
      `Are you sure you want to delete "${editingGeofence.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeGeofence(editingGeofence.id);
            setModalVisible(false);
            setEditingGeofence(null);
            setTapCoordinate(null);
          },
        },
      ]
    );
  }, [editingGeofence, removeGeofence]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1F1A17" />
        </TouchableOpacity>
        <Text style={styles.title}>Geofences</Text>
        <View style={styles.backButton} />
      </View>

      <Text style={styles.instruction}>
        Tap on the map to add a new geofence
      </Text>

      {/* Map */}
      <View style={styles.mapContainer}>
        <DogMap
          geofences={dogGeofences}
          onPress={handleMapPress}
          showUserLocation={true}
        />
      </View>

      {/* Geofence List */}
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          {dogGeofences.length} Geofence{dogGeofences.length !== 1 ? 's' : ''}
        </Text>
        {dogGeofences.map((geofence) => (
          <TouchableOpacity
            key={geofence.id}
            onPress={() => handleEditGeofence(geofence)}
            activeOpacity={0.7}
          >
            <Card variant="default" padding="md" style={styles.geofenceCard}>
              <View style={styles.geofenceRow}>
                <View style={[
                  styles.geofenceDot,
                  { backgroundColor: geofence.isActive ? '#F3A93B' : '#A39888' }
                ]} />
                <View style={styles.geofenceInfo}>
                  <Text style={styles.geofenceName}>{geofence.name}</Text>
                  <Text style={styles.geofenceDetail}>
                    {Math.round(geofence.radius)}m radius · {geofence.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#A39888" />
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {dogGeofences.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={40} color="#A39888" />
            <Text style={styles.emptyText}>No geofences set</Text>
            <Text style={styles.emptySub}>Tap on the map above to create one</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal for add/edit */}
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
                {editingGeofence ? 'Edit Geofence' : 'New Geofence'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B625A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(text) => setForm((f) => ({ ...f, name: text }))}
              placeholder="Geofence name"
              placeholderTextColor="#A39888"
            />

            <Text style={styles.modalLabel}>Radius (meters)</Text>
            <TextInput
              style={styles.input}
              value={form.radius}
              onChangeText={(text) => setForm((f) => ({ ...f, radius: text.replace(/[^0-9]/g, '') }))}
              keyboardType="number-pad"
              placeholder="100"
              placeholderTextColor="#A39888"
            />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Active</Text>
              <TouchableOpacity
                onPress={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                style={[
                  styles.toggle,
                  { backgroundColor: form.isActive ? '#F3A93B' : '#E9DDC9' }
                ]}
              >
                <View style={[
                  styles.toggleKnob,
                  form.isActive && styles.toggleKnobActive
                ]} />
              </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Alerts</Text>
              <TouchableOpacity
                onPress={() => setForm((f) => ({ ...f, alertsEnabled: !f.alertsEnabled }))}
                style={[
                  styles.toggle,
                  { backgroundColor: form.alertsEnabled ? '#F3A93B' : '#E9DDC9' }
                ]}
              >
                <View style={[
                  styles.toggleKnob,
                  form.alertsEnabled && styles.toggleKnobActive
                ]} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Text style={styles.saveButtonText}>
                {editingGeofence ? 'Save Changes' : 'Create Geofence'}
              </Text>
            </TouchableOpacity>

            {editingGeofence && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteButtonText}>Delete Geofence</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
