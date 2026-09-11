import { supabase, isSupabaseConfigured } from './supabase';
import { gpsService } from '../gps/service';
import type { PetStore } from '../../store/marketplaceStore';

export const getPetStores = async (lat: number, lng: number): Promise<PetStore[]> => {
  if (!isSupabaseConfigured()) return getDemoStores(lat, lng);

  try {
    const { data, error } = await supabase
      .from('pet_stores')
      .select('id, name, address, latitude, longitude, phone, hours');

    if (error || !data) return getDemoStores(lat, lng);

    return data.map((store) => ({
      id: store.id,
      name: store.name,
      address: store.address,
      latitude: store.latitude,
      longitude: store.longitude,
      phone: store.phone ?? undefined,
      hours: store.hours ?? undefined,
      distance: gpsService.calculateDistance(lat, lng, store.latitude, store.longitude),
    })).sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  } catch {
    return getDemoStores(lat, lng);
  }
};

const DEMO_STORES: PetStore[] = [
  {
    id: 'store_1',
    name: 'Paws & Claws Pet Supply',
    address: '123 Main St, Anytown, USA',
    latitude: 37.7749,
    longitude: -122.4194,
    phone: '+1-555-0101',
    hours: 'Mon-Sat 9am-8pm, Sun 10am-6pm',
  },
  {
    id: 'store_2',
    name: 'Happy Tails Grooming',
    address: '456 Oak Ave, Anytown, USA',
    latitude: 37.7849,
    longitude: -122.4094,
    phone: '+1-555-0102',
    hours: 'Mon-Fri 8am-6pm, Sat 9am-5pm',
  },
  {
    id: 'store_3',
    name: 'Fetch & Play Outdoors',
    address: '789 Elm Blvd, Anytown, USA',
    latitude: 37.7649,
    longitude: -122.4294,
    phone: '+1-555-0103',
    hours: 'Daily 7am-9pm',
  },
];

const getDemoStores = (lat: number, lng: number): PetStore[] =>
  DEMO_STORES.map((store) => ({
    ...store,
    distance: gpsService.calculateDistance(lat, lng, store.latitude, store.longitude),
  })).sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));