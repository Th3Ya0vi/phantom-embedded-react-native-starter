import { router } from 'expo-router'
import { storage } from '@/lib/storage/storage'

export const logout = async () => {
  await storage.clearSession()
  router.replace('/login')
}
