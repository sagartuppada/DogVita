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
  vetInfo?: VetInfo;
}

// ── Weight History ──

export interface WeightRecord {
  id: string;
  dogId: string;
  weight: number;
  weightUnit: 'kg' | 'lb';
  date: string;
  notes?: string;
  trend?: 'up' | 'down' | 'stable';
}

export type WeightRecordInput = Omit<WeightRecord, 'id' | 'trend'>;

// ── Vaccination Records ──

export type VaccinationStatus = 'upcoming' | 'due' | 'overdue' | 'completed' | 'skipped';

export interface VaccinationRecord {
  id: string;
  dogId: string;
  name: string;
  status: VaccinationStatus;
  dateAdministered?: string;
  nextDueDate?: string;
  vetName?: string;
  batchNumber?: string;
  notes?: string;
  reminderEnabled: boolean;
}

export type VaccinationRecordInput = Omit<VaccinationRecord, 'id' | 'status'> & {
  status?: VaccinationStatus;
};

// ── Breed Info (enriched) ──

export interface BreedInfo {
  id: string;
  name: string;
  size: DogSize;
  avgLifeSpan: string;
  avgWeightKg: { min: number; max: number };
  avgHeightCm: { min: number; max: number };
  traits: string[];
  healthConcerns: string[];
  temperament: string[];
  exerciseNeeds: 'low' | 'moderate' | 'high';
  groomingNeeds: 'low' | 'moderate' | 'high';
  trainability: 'easy' | 'moderate' | 'stubborn';
  description: string;
  origin: string;
}