/**
 * Dog-related type definitions
 */

export interface Dog {
  id: string;
  name: string;
  breed: string;
  birthDate?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lb';
  gender?: 'male' | 'female';
  imageUrl?: string;
  microchipId?: string;
  vetInfo?: VetInfo;
  createdAt: string;
  updatedAt: string;
}

export interface VetInfo {
  name: string;
  phone: string;
  address: string;
  email?: string;
}

export interface DogProfile extends Dog {
  ownerId: string;
  isActive: boolean;
}

export type DogSize = 'small' | 'medium' | 'large' | 'giant';

export interface DogActivity {
  id: string;
  dogId: string;
  type: ActivityType;
  duration: number;
  distance?: number;
  caloriesBurned?: number;
  steps: number;
  timestamp: string;
}

export type ActivityType = 'walk' | 'run' | 'play' | 'rest' | 'sleep' | 'other';

export interface DogSleep {
  id: string;
  dogId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  quality: SleepQuality;
  interruptions?: number;
}

export type SleepQuality = 'excellent' | 'good' | 'fair' | 'poor';

export interface DogBreed {
  id: string;
  name: string;
  size: DogSize;
  avgLifeSpan: string;
  traits: string[];
}

export interface CreateDogInput {
  name: string;
  breed: string;
  birthDate?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lb';
  gender?: 'male' | 'female';
  imageUrl?: string;
  microchipId?: string;
}

export interface UpdateDogInput extends Partial<CreateDogInput> {
  id: string;
}