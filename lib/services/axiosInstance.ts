import axios, { AxiosError } from 'axios'; // ✅ Import the AxiosError class
import { storage } from '@/lib/storage/storage'
declare module 'axios' {
  export interface AxiosRequestConfig {
    isPublic?: boolean;
  }
}

// 1. Correctly initialize the queue variables
let isRefreshing = false
let failedQueue: any[] = []

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
  // Keep your live server environment variable
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 2. REQUEST INTERCEPTOR: Attach Token
instance.interceptors.request.use(
  async (config) => {

    console.log(`[AXIOS] Intercepting ${config.method?.toUpperCase()} request to: ${config.url}`);

    // 1. Check if the route is explicitly marked as public
    if (config.isPublic) {
      console.log(`[AXIOS] Public route. Sending without token.`);
      return config; // Let the request proceed immediately
    }

    try {
      const token = await storage.getAccessToken();
      console.log(`[AXIOS] Sending ${config.method?.toUpperCase()} request to: ${config.url}`);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[AXIOS] Authorization Header attached successfully.`);
        return config;
      } else {
        console.warn(`[AXIOS-SKIP] No token found for protected route: ${config.url}. Cancelling request.`);
        // This creates a custom, identifiable error that can be caught by the calling function.
        return Promise.reject(new AxiosError("No authentication token available.", "NO_TOKEN"));
      }
    } catch (e) {
      console.error('[AXIOS] Interceptor Error', e);
      return Promise.reject(e);
    }

  },
  (error) => Promise.reject(error)
);

// 3. RESPONSE INTERCEPTOR: Handle 401 Unauthorized
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // If you implement a refresh token later, add it here.
        // For now, we clear the queue and reject the call.
        processQueue(new Error('Unauthorized'), null);
        return Promise.reject(error);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default instance