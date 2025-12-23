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
       'user_session',
       JSON.stringify(user)
     )
   },



   getUser: async () => {
      // FIX: Use 'SecureStore' (the library)
      const userString = await SecureStore.getItemAsync('user_session');

      if (!userString) return null;

      try {
        return JSON.parse(userString);
      } catch (e) {
        return userString;
      }
    },

 async removeUser() {
     // FIX: Use 'SecureStore' (the library)
     await SecureStore.deleteItemAsync('user_session');
     return asyncStorage.remove(StorageKey.USER);
   },


  // ----- Tokens (sensitive)
  async getAccessToken() {
    return secureStorage.get(StorageKey.ACCESS_TOKEN)
  },

  setAccessToken: async (token: string) => {
    if (!token || typeof token !== 'string') {
      console.warn('Storage.setAccessToken received invalid token:', token)
      return
    }

    await SecureStore.setItemAsync('access_token', token)
  },


  async removeAccessToken() {
    return secureStorage.remove(StorageKey.ACCESS_TOKEN)
  },

// ----- Refresh Token
async getRefreshToken() {
  return secureStorage.get('REFRESH_TOKEN')
},

async setRefreshToken(token: string) {
  return secureStorage.set('REFRESH_TOKEN', token)
},

async removeRefreshToken() {
  return secureStorage.remove('REFRESH_TOKEN')
},


  // ----- Full logout
  async clearSession() {
    await Promise.all([
      secureStorage.remove('ACCESS_TOKEN'),
      secureStorage.remove('REFRESH_TOKEN'),
      asyncStorage.remove('USER'),
    ])
  }
}