/**
 * Dog store - manages dog profiles and information
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dog, CreateDogInput, UpdateDogInput } from '../types';

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
          set({ isLoading: false, error: (error as Error).message });
          throw error;
        }
      },

      updateDog: async (input) => {
        set({ isLoading: true, error: null });
        try {
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
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false, error: (error as Error).message });
        }
      },

      clearError: () => set({ error: null }),
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