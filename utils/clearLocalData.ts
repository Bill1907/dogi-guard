/**
 * Utility to clear all local storage data
 * Use this when you want to reset the app to a clean state
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearAllLocalData(): Promise<void> {
  try {
    console.log('🧹 Clearing all local storage data...');
    
    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    console.log('📋 Found keys:', keys);
    
    // Clear all keys
    await AsyncStorage.multiRemove(keys);
    
    console.log('✅ All local storage data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing local storage:', error);
    throw error;
  }
}

export async function clearDogData(): Promise<void> {
  try {
    console.log('🐕 Clearing dog data from local storage...');
    
    // Clear specific dog-related keys
    const keysToRemove = [
      '@DogiGuard:dogs',
      '@DogiGuard:user',
      '@DogiGuard:settings'
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    
    console.log('✅ Dog data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing dog data:', error);
    throw error;
  }
}

// For debugging - check what's stored
export async function checkStorageContents(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('📋 Storage keys:', keys);
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      console.log(`🔑 ${key}:`, value ? JSON.parse(value) : null);
    }
  } catch (error) {
    console.error('❌ Error checking storage:', error);
  }
}