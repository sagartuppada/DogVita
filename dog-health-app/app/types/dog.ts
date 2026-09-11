/**
 * Dog-related type definitions
 */

export interface Dog {
  id: string;
  species: 'dog' | 'cat';
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

export interface CreateDogInput {
  name: string;
  breed: string;
  species?: 'dog' | 'cat';
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
