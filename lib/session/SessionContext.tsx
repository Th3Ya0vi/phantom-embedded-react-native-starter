import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '@/lib/storage/storage';

type SessionState = {
  user: any | null
  isAuthenticated: boolean
  isHydrated: boolean
  login: (user: any, token: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updatedUser: any) => Promise<void>
  lastPath: string | null
  savePath: (path: string) => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [lastPath, setLastPathState] = useState<string | null>(null)

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [storedUser, token, savedPath] = await Promise.all([
          storage.getUser(),
          storage.getAccessToken(),
          storage.getLastPath()
        ]);

        console.log(`[HYDRATION] User: ${!!storedUser}, Token: ${!!token}, Path: ${savedPath}`);

        if (storedUser && token) {
          const parsedUser = typeof storedUser === 'string' ? JSON.parse(storedUser) : storedUser;
          setUser(parsedUser)
        }
        setLastPathState(savedPath);
      } catch (e) {
        console.error("Hydration failed", e)
      } finally {
        setIsHydrated(true)
      }
    }

    hydrate()
  }, [])

  const savePath = async (path: string) => {
    if (!path || path === '/' || path === '/home' || path === '/index') return;
    try {
      await storage.setLastPath(path);
      setLastPathState(path);
    } catch (e) {
      console.error("Failed to save path", e);
    }
  };

  const login = async (userData: any, token: string) => {
    await storage.setUser(userData)
    await storage.setAccessToken(token)
    setUser(userData)
  }

  const logout = async () => {
    await storage.clearSession()
    await storage.removeLastPath();
    setUser(null)
    setLastPathState(null)
  }

  const updateUser = async (updatedUser: any) => {
    await storage.setUser(updatedUser)
    setUser(updatedUser)
  }

  return (
    <SessionContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isHydrated,
        login,
        logout,
        updateUser,
        lastPath,
        savePath
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return ctx
}