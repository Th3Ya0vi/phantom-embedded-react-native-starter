import axios from 'axios'
import { storage } from '@/lib/storage/storage'
import { apiService } from '@/lib/services/apiService'
import { logout } from '@/lib/auth/authService'

let isRefreshing = false
let pendingRequests: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

const instance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 15000,
})

instance.interceptors.request.use(async (config) => {
  const token = await storage.getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => instance(originalRequest))
      }

      isRefreshing = true

      try {
        const refreshToken = await storage.getRefreshToken()
        if (!refreshToken) throw new Error('No refresh token')

        const res = await apiService.refreshAuth(refreshToken)

        await storage.setAccessToken(res.accessToken)

        if (res.refreshToken) {
          await storage.setRefreshToken(res.refreshToken)
        }

        processQueue(null, res.accessToken)
        return instance(originalRequest)
      } catch (err) {
        processQueue(err, null)
        await logout()
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default instance
