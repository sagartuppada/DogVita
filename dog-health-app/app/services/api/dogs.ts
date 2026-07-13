import { supabase, isSupabaseConfigured } from './supabase';
import type { Dog } from '../../types';

async function ensureProfileExists(userId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (existing) return true;

  const { error } = await supabase
    .from('profiles')
    .insert({ id: userId });

  if (error) {
    console.warn('[dogsService.ensureProfileExists] Failed to create profile:', error.message);
    return false;
  }
  return true;
}

export const dogsService = {
  async getDogs(userId: string): Promise<Dog[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[dogsService.getDogs]', error);
      return [];
    }

    return (data ?? []).map(mapDogRow);
  },

  async getDog(dogId: string): Promise<Dog | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .eq('id', dogId)
      .single();

    if (error) {
      console.error('[dogsService.getDog]', error);
      return null;
    }

    return mapDogRow(data as Record<string, unknown>);
  },

  async createDog(input: {
    ownerId: string;
    name: string;
    breed: string;
    birthDate?: string;
    weight?: number;
    weightUnit?: 'kg' | 'lb';
    gender?: 'male' | 'female';
    imageUrl?: string;
  }): Promise<Dog | null> {
    if (!isSupabaseConfigured()) return null;

    await ensureProfileExists(input.ownerId);

    const insertData: Record<string, unknown> = {
      owner_id: input.ownerId,
      name: input.name,
      breed: input.breed,
      is_active: true,
    };

    if (input.birthDate) insertData.birth_date = input.birthDate;
    if (input.weight != null) {
      insertData.weight_kg = input.weightUnit === 'lb' ? input.weight * 0.453592 : input.weight;
    }
    if (input.gender) insertData.gender = input.gender;
    if (input.imageUrl) insertData.photo_url = input.imageUrl;

    const { data, error } = await supabase
      .from('dogs')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('[dogsService.createDog]', error);
      throw new Error(`Failed to create dog: ${error.message}`);
    }

    return mapDogRow(data as Record<string, unknown>);
  },

  async updateDog(
    dogId: string,
    updates: Partial<{
      name: string;
      breed: string;
      birthDate: string;
      weight: number;
      weightUnit: 'kg' | 'lb';
      imageUrl: string;
    }>
  ): Promise<Dog | null> {
    if (!isSupabaseConfigured()) return null;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.breed !== undefined) dbUpdates.breed = updates.breed;
    if (updates.birthDate !== undefined) dbUpdates.birth_date = updates.birthDate;
    if (updates.weight !== undefined) {
      dbUpdates.weight_kg =
        updates.weightUnit === 'lb' ? updates.weight * 0.453592 : updates.weight;
    }
    if (updates.imageUrl !== undefined) dbUpdates.photo_url = updates.imageUrl;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('dogs')
      .update(dbUpdates)
      .eq('id', dogId)
      .select()
      .single();

    if (error) {
      console.error('[dogsService.updateDog]', error);
      throw new Error(`Failed to update dog: ${error.message}`);
    }

    return mapDogRow(data as Record<string, unknown>);
  },

  async deleteDog(dogId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase.from('dogs').delete().eq('id', dogId);

    if (error) {
      console.error('[dogsService.deleteDog]', error);
      throw new Error(`Failed to delete dog: ${error.message}`);
    }
    return true;
  },
};

function mapDogRow(row: Record<string, unknown>): Dog {
  const weightKg = (row.weight_kg as number) ?? 0;
  return {
    id: row.id as string,
    species: (row.species as 'dog' | 'cat') || 'dog',
    name: row.name as string,
    breed: (row.breed as string) || '',
    birthDate: (row.birth_date as string) || '',
    weight: Number(weightKg.toFixed(2)),
    weightUnit: 'kg',
    gender: (row.gender as 'male' | 'female') || 'male',
    imageUrl: row.photo_url as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) || (row.created_at as string),
  };
}

export default dogsService;