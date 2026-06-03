/**
 * Storage Service - MMKV-based fast key-value storage
 */

import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mmkv = new MMKV({ id: 'dog-health-storage' });

class StorageService {
  private static instance: StorageService;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  setItem(key: string, value: string): void {
    mmkv.set(key, value);
  }

  getItem(key: string): string | undefined {
    return mmkv.getString(key);
  }

  setObject<T>(key: string, value: T): void {
    mmkv.set(key, JSON.stringify(value));
  }

  getObject<T>(key: string): T | undefined {
    const value = mmkv.getString(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  deleteItem(key: string): void {
    mmkv.delete(key);
  }

  contains(key: string): boolean {
    return mmkv.contains(key);
  }

  getAllKeys(): string[] {
    return mmkv.getAllKeys();
  }

  clearAll(): void {
    mmkv.clearAll();
  }

  async setAsync(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async getAsync(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async setObjectAsync<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async getObjectAsync<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    }
    return null;
  }

  async deleteAsync(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async getAllKeysAsync(): Promise<string[]> {
    return await AsyncStorage.getAllKeys();
  }
}

export const storageService = StorageService.getInstance();
export default storageService;