/**
 * Dog store - manages dog profiles and information
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dog, CreateDogInput, UpdateDogInput, WeightRecord, VaccinationRecord } from '../types';
import { dogsService } from '../services/api/dogs';
import { supabase, isSupabaseConfigured } from '../services/api/supabase';

interface DogState {
  dogs: Dog[];
  activeDogId: string | null;
  isLoading: boolean;
  error: string | null;
  // Phase 2 additions
  weightHistory: WeightRecord[];
  vaccinationRecords: VaccinationRecord[];
}

interface DogActions {
  setDogs: (dogs: Dog[]) => void;
  addDog: (dog: CreateDogInput) => Promise<Dog>;
  updateDog: (input: UpdateDogInput) => Promise<Dog | null>;
  deleteDog: (dogId: string) => Promise<void>;
  setActiveDog: (dogId: string) => void;
  getActiveDog: () => Dog | null;
  fetchDogs: () => Promise<void>;
  clearError: () => void;
  loadDemoData: () => void;
  // Weight history
  addWeightRecord: (record: Omit<WeightRecord, 'id' | 'trend'>) => WeightRecord;
  updateWeightRecord: (record: WeightRecord) => void;
  deleteWeightRecord: (recordId: string) => void;
  getWeightHistoryForDog: (dogId: string) => WeightRecord[];
  // Vaccination records
  addVaccinationRecord: (record: Omit<VaccinationRecord, 'id' | 'status'>) => VaccinationRecord;
  updateVaccinationRecord: (record: VaccinationRecord) => void;
  deleteVaccinationRecord: (recordId: string) => void;
  getVaccinationsForDog: (dogId: string) => VaccinationRecord[];
}

type DogStore = DogState & DogActions;

const initialState: DogState = {
  dogs: [],
  activeDogId: null,
  isLoading: false,
  error: null,
  weightHistory: [],
  vaccinationRecords: [],
};

export const useDogStore = create<DogStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setDogs: (dogs) => set({ dogs }),

      addDog: async (input) => {
        set({ isLoading: true, error: null });
        try {
          if (isSupabaseConfigured()) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const created = await dogsService.createDog({
                ownerId: user.id,
                name: input.name,
                breed: input.breed,
                birthDate: input.birthDate,
                weight: input.weight,
                weightUnit: input.weightUnit,
                gender: input.gender,
                imageUrl: input.imageUrl,
              });
              if (created) {
                set((state) => ({
                  dogs: [...state.dogs, created],
                  activeDogId: created.id,
                  isLoading: false,
                }));
                return created;
              }
            }
          }
          const newDog: Dog = {
            id: `dog_${Date.now()}`,
            ...input,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({
            dogs: [...state.dogs, newDog],
            activeDogId: newDog.id,
            isLoading: false,
          }));
          return newDog;
        } catch (error) {
          console.warn('[dogStore.addDog] Supabase insert failed, using local:', (error as Error).message);
          const newDog: Dog = {
            id: `dog_${Date.now()}`,
            ...input,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({
            dogs: [...state.dogs, newDog],
            activeDogId: newDog.id,
            isLoading: false,
          }));
          return newDog;
        }
      },

      updateDog: async (input) => {
        set({ isLoading: true, error: null });
        try {
          if (isSupabaseConfigured()) {
            const { id, ...updates } = input;
            const updated = await dogsService.updateDog(id, updates);
            if (updated) {
              set((state) => ({
                dogs: state.dogs.map((d) => (d.id === id ? updated : d)),
                isLoading: false,
              }));
              return updated;
            }
          }
          const { dogs } = get();
          const index = dogs.findIndex((d) => d.id === input.id);
          if (index === -1) {
            set({ isLoading: false, error: 'Dog not found' });
            return null;
          }
          const updatedDog: Dog = {
            ...dogs[index],
            ...input,
            updatedAt: new Date().toISOString(),
          };
          const newDogs = [...dogs];
          newDogs[index] = updatedDog;
          set({ dogs: newDogs, isLoading: false });
          return updatedDog;
        } catch (error) {
          set({ isLoading: false, error: (error as Error).message });
          return null;
        }
      },

      deleteDog: async (dogId) => {
        set({ isLoading: true, error: null });
        try {
          if (isSupabaseConfigured()) {
            await dogsService.deleteDog(dogId);
          }
          set((state) => ({
            dogs: state.dogs.filter((d) => d.id !== dogId),
            activeDogId: state.activeDogId === dogId ? null : state.activeDogId,
            isLoading: false,
          }));
          return;
        } catch (error) {
          set({ isLoading: false, error: (error as Error).message });
          return;
        }
      },

      setActiveDog: (dogId) => set({ activeDogId: dogId }),

      getActiveDog: () => {
        const { dogs, activeDogId } = get();
        return dogs.find((d) => d.id === activeDogId) || null;
      },

      fetchDogs: async () => {
        set({ isLoading: true, error: null });
        try {
          if (isSupabaseConfigured()) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const dogs = await dogsService.getDogs(user.id);
              // Success from server = source of truth. Replace local data.
              // Validate activeDogId still exists; reset if it was deleted server-side.
              const currentActiveId = get().activeDogId;
              const stillExists = currentActiveId
                ? dogs.some((d) => d.id === currentActiveId)
                : false;
              set({
                dogs,
                isLoading: false,
                error: null,
                activeDogId: stillExists ? currentActiveId : (dogs[0]?.id ?? null),
              });
              return;
            }
          }
          // Supabase not configured or no session: clear local dog data.
          set({ dogs: [], activeDogId: null, isLoading: false });
        } catch (error) {
          console.warn('[dogStore.fetchDogs] Supabase fetch failed, keeping local data:', (error as Error).message);
          // Keep existing local dogs on network error instead of wiping them
          set({ isLoading: false, error: (error as Error).message });
        }
      },

      clearError: () => set({ error: null }),

      loadDemoData: () => {
        const demoDog: Dog = {
          id: 'demo_dog_1',
          name: 'Buddy',
          breed: 'Golden Retriever',
          birthDate: '2022-01-15',
          weight: 30,
          weightUnit: 'kg',
          gender: 'male',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const demoWeightRecords: WeightRecord[] = [
          { id: 'w1', dogId: demoDog.id, weight: 28.5, weightUnit: 'kg', date: '2025-01-15', notes: 'Post-holiday check' },
          { id: 'w2', dogId: demoDog.id, weight: 29.2, weightUnit: 'kg', date: '2025-02-15' },
          { id: 'w3', dogId: demoDog.id, weight: 29.8, weightUnit: 'kg', date: '2025-03-15' },
          { id: 'w4', dogId: demoDog.id, weight: 30.1, weightUnit: 'kg', date: '2025-04-15' },
          { id: 'w5', dogId: demoDog.id, weight: 30.5, weightUnit: 'kg', date: '2025-05-15' },
          { id: 'w6', dogId: demoDog.id, weight: 30, weightUnit: 'kg', date: '2025-06-15', notes: 'Summer heat' },
          { id: 'w7', dogId: demoDog.id, weight: 29.8, weightUnit: 'kg', date: '2025-07-15' },
          { id: 'w8', dogId: demoDog.id, weight: 30.2, weightUnit: 'kg', date: '2025-08-15' },
          { id: 'w9', dogId: demoDog.id, weight: 30.5, weightUnit: 'kg', date: '2025-09-15' },
          { id: 'w10', dogId: demoDog.id, weight: 30.8, weightUnit: 'kg', date: '2025-10-15' },
          { id: 'w11', dogId: demoDog.id, weight: 31.2, weightUnit: 'kg', date: '2025-11-15' },
          { id: 'w12', dogId: demoDog.id, weight: 31, weightUnit: 'kg', date: '2025-12-15' },
        ];

        const demoVaccinations: VaccinationRecord[] = [
          { id: 'v1', dogId: demoDog.id, name: 'Rabies', status: 'completed', dateAdministered: '2025-01-10', nextDueDate: '2026-01-10', vetName: 'Dr. Smith', reminderEnabled: true },
          { id: 'v2', dogId: demoDog.id, name: 'DHPP (Distemper)', status: 'completed', dateAdministered: '2025-01-10', nextDueDate: '2026-01-10', vetName: 'Dr. Smith', reminderEnabled: true },
          { id: 'v3', dogId: demoDog.id, name: 'Bordetella', status: 'upcoming', nextDueDate: '2026-03-15', vetName: 'Dr. Smith', reminderEnabled: true },
          { id: 'v4', dogId: demoDog.id, name: 'Leptospirosis', status: 'upcoming', nextDueDate: '2026-04-01', reminderEnabled: true },
          { id: 'v5', dogId: demoDog.id, name: 'Lyme Disease', status: 'completed', dateAdministered: '2025-03-01', nextDueDate: '2026-03-01', reminderEnabled: false },
        ];

        set({
          dogs: [demoDog],
          activeDogId: demoDog.id,
          weightHistory: demoWeightRecords,
          vaccinationRecords: demoVaccinations,
        });
      },

      // ── Weight History ──

      addWeightRecord: (record) => {
        const { weightHistory } = get();
        const newRecord: WeightRecord = {
          ...record,
          id: `weight_${Date.now()}`,
          trend: calculateWeightTrend(record.weight, record.dogId, weightHistory),
        };
        set({
          weightHistory: [...weightHistory, newRecord].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
        });
        return newRecord;
      },

      updateWeightRecord: (record) => {
        set((state) => ({
          weightHistory: state.weightHistory.map((r) =>
            r.id === record.id ? { ...record, trend: calculateWeightTrend(record.weight, record.dogId, state.weightHistory) } : r
          ),
        }));
      },

      deleteWeightRecord: (recordId) =>
        set((state) => ({
          weightHistory: state.weightHistory.filter((r) => r.id !== recordId),
        })),

      getWeightHistoryForDog: (dogId) => {
        return get().weightHistory.filter((r) => r.dogId === dogId);
      },

      // ── Vaccination Records ──

      addVaccinationRecord: (record) => {
        const newRecord: VaccinationRecord = {
          ...record,
          id: `vacc_${Date.now()}`,
          status: determineVaccinationStatus(record as any),
        };
        set((state) => ({
          vaccinationRecords: [...state.vaccinationRecords, newRecord],
        }));
        // Schedule vaccination reminder if enabled and has a due date
        if (newRecord.reminderEnabled && newRecord.nextDueDate) {
          try {
            const { notificationsService } = require('../services/notifications');
            notificationsService.initialize().then(() => {
              const dog = get().dogs.find((d) => d.id === newRecord.dogId);
              const dogName = dog?.name ?? 'Your dog';
              const dueDate = new Date(newRecord.nextDueDate!);
              const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              notificationsService.scheduleVaccinationReminder(
                newRecord.dogId, dogName, newRecord.name, newRecord.nextDueDate!, daysUntil
              );
            }).catch((err: unknown) => console.warn('[dogStore] Vaccination reminder failed:', err));
          } catch (err) { console.warn('[dogStore] Vaccination reminder failed:', err); }
        }
        return newRecord;
      },

      updateVaccinationRecord: (record) => {
        set((state) => ({
          vaccinationRecords: state.vaccinationRecords.map((r) =>
            r.id === record.id ? { ...record, status: determineVaccinationStatus(record) } : r
          ),
        }));
        // Re-schedule vaccination reminder if enabled
        if (record.reminderEnabled && record.nextDueDate) {
          try {
            const { notificationsService } = require('../services/notifications');
            notificationsService.initialize().then(() => {
              const dog = get().dogs.find((d) => d.id === record.dogId);
              const dogName = dog?.name ?? 'Your dog';
              const dueDate = new Date(record.nextDueDate!);
              const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              // Cancel old reminder and schedule new one
              notificationsService.cancelNotificationsByPrefix(`vacc_${record.dogId}_${record.name}`);
              notificationsService.scheduleVaccinationReminder(
                record.dogId, dogName, record.name, record.nextDueDate!, daysUntil
              );
            }).catch((err: unknown) => console.warn('[dogStore] Vaccination reminder failed:', err));
          } catch (err) { console.warn('[dogStore] Vaccination reminder failed:', err); }
        }
      },

      deleteVaccinationRecord: (recordId) =>
        set((state) => ({
          vaccinationRecords: state.vaccinationRecords.filter((r) => r.id !== recordId),
        })),

      getVaccinationsForDog: (dogId) => {
        return get().vaccinationRecords.filter((r) => r.dogId === dogId);
      },
    }),
    {
      name: 'dog-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        dogs: state.dogs,
        activeDogId: state.activeDogId,
        weightHistory: state.weightHistory,
        vaccinationRecords: state.vaccinationRecords,
      }),
    }
  )
);

// Helper functions
function calculateWeightTrend(
  currentWeight: number,
  dogId: string,
  history: WeightRecord[]
): 'up' | 'down' | 'stable' {
  const dogHistory = history
    .filter((r) => r.dogId === dogId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (dogHistory.length < 2) return 'stable';
  const last = dogHistory[dogHistory.length - 1];
  const diff = currentWeight - last.weight;
  if (Math.abs(diff) < 0.3) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

function determineVaccinationStatus(record: Omit<VaccinationRecord, 'id' | 'status'>): import('../types').VaccinationStatus {
  if (record.dateAdministered && !record.nextDueDate) return 'completed';
  if (!record.nextDueDate) return 'upcoming';
  const now = new Date();
  const due = new Date(record.nextDueDate);
  if (due < now) return 'overdue';
  const daysUntil = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntil <= 30) return 'due';
  return 'upcoming';
}

export const selectActiveDog = (state: DogStore) =>
  state.dogs.find((d) => d.id === state.activeDogId) || null;

export const selectAllDogs = (state: DogStore) => state.dogs;