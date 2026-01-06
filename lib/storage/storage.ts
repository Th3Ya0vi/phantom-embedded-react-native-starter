import { StorageKey } from './types'
import { asyncStorage } from './asyncStorage'
import { secureStorage } from './secureStorage'
import * as SecureStore from 'expo-secure-store'


export const storage = {
  // ----- User (non-sensitive)
  setUser: async (user: any) => {
    if (!user || typeof user !== 'object') {
      console.warn('Storage.setUser received invalid user:', user)
      return
    }
    await SecureStore.setItemAsync(
      StorageKey.USER,
      JSON.stringify(user)
    )
  },

  getUser: async () => {
    const userString = await SecureStore.getItemAsync(StorageKey.USER);
    if (!userString) return null;
    try {
      return JSON.parse(userString);
    } catch (e) {
      return userString;
    }
  },

  async removeUser() {
    await SecureStore.deleteItemAsync(StorageKey.USER);
  },

  // ----- Tokens (sensitive)
  async getAccessToken() {
    return SecureStore.getItemAsync(StorageKey.ACCESS_TOKEN);
  },

  setAccessToken: async (token: string) => {
    if (!token || typeof token !== 'string') {
      console.warn('Storage.setAccessToken received invalid token:', token)
      return
    }
    await SecureStore.setItemAsync(StorageKey.ACCESS_TOKEN, token)
  },

  async removeAccessToken() {
    await SecureStore.deleteItemAsync(StorageKey.ACCESS_TOKEN);
  },

  // ----- Refresh Token
  async getRefreshToken() {
    return SecureStore.getItemAsync(StorageKey.REFRESH_TOKEN);
  },

  async setRefreshToken(token: string) {
    if (!token) return;
    await SecureStore.setItemAsync(StorageKey.REFRESH_TOKEN, token);
  },

  async removeRefreshToken() {
    await SecureStore.deleteItemAsync(StorageKey.REFRESH_TOKEN);
  },

  // ----- Full logout
  async clearSession() {
    console.log("[STORAGE] Clearing all session data...");
    await Promise.all([
      SecureStore.deleteItemAsync(StorageKey.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(StorageKey.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(StorageKey.USER),
      SecureStore.deleteItemAsync('user_session'), // Cleanup old key just in case
    ]);
    console.log("[STORAGE] Session data cleared.");
  },

  // ----- Navigation State
  setLastPath: async (path: string) => {
    await asyncStorage.set(StorageKey.LAST_PATH, path);
  },

  getLastPath: async (): Promise<string | null> => {
    return asyncStorage.get<string>(StorageKey.LAST_PATH);
  },

  removeLastPath: async () => {
    await asyncStorage.remove(StorageKey.LAST_PATH);
  },

  // ----- Rewards
  setRewardsBalance: async (balance: number) => {
    await asyncStorage.set(StorageKey.REWARDS_BALANCE, balance.toString());
  },

  getRewardsBalance: async (): Promise<number> => {
    const val = await asyncStorage.get<string>(StorageKey.REWARDS_BALANCE);
    return val ? parseInt(val, 10) : 0;
  }
}