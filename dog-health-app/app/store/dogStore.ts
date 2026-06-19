/**
 * Dog store - manages dog profiles and information
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dog, CreateDogInput, UpdateDogInput } from '../types';
import { dogsService } from '../services/api/dogs';
import { supabase, isSupabaseConfigured } from '../services/api/supabase';

interface DogState {
  dogs: Dog[];
  activeDogId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface DogActions {
  setDogs: (dogs: Dog[]) => void;
  addDog: (dog: CreateDogInput) => Promise<Dog>;
  updateDog: (input: UpdateDogInput) => Promise<Dog>;
  deleteDog: (dogId: string) => Promise<void>;
  setActiveDog: (dogId: string) => void;
  getActiveDog: () => Dog | null;
  fetchDogs: () => Promise<void>;
  clearError: () => void;
  loadDemoData: () => void;
}

type DogStore = DogState & DogActions;

const initialState: DogState = {
  dogs: [],
  activeDogId: null,
  isLoading: false,
  error: null,
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
          if (index === -1) throw new Error('Dog not found');
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
          throw error;
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
        } catch (error) {
          set({ isLoading: false, error: (error as Error).message });
          throw error;
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
              set({
                dogs,
                isLoading: false,
                activeDogId: dogs.length > 0 ? (get().activeDogId || dogs[0].id) : null,
              });
              return;
            }
          }
          set({ dogs: [], activeDogId: null, isLoading: false });
        } catch (error) {
          console.warn('[dogStore.fetchDogs] Supabase fetch failed, using local data:', (error as Error).message);
          set({ isLoading: false });
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
        set({
          dogs: [demoDog],
          activeDogId: demoDog.id,
        });
      },
    }),
    {
      name: 'dog-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        dogs: state.dogs,
        activeDogId: state.activeDogId,
      }),
    }
  )
);

export const selectActiveDog = (state: DogStore) =>
  state.dogs.find((d) => d.id === state.activeDogId) || null;

export const selectAllDogs = (state: DogStore) => state.dogs;