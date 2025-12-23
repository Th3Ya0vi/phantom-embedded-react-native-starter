import React, { createContext, useContext, useEffect, useState } from 'react'
import { storage } from '@/lib/storage/storage'

type SessionState = {
  user: any | null
  isAuthenticated: boolean
  isHydrated: boolean
  login: (user: any, token: string) => Promise<void>
  logout: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const hydrate = async () => {
      try {
        const storedUser = await storage.getUser()
        const token = await storage.getAccessToken()

        if (storedUser && token) {
          // Parse the user if it was stored as a string
          const parsedUser = typeof storedUser === 'string'
            ? JSON.parse(storedUser)
            : storedUser;

          setUser(parsedUser)
        }
      } catch (e) {
        console.error("Hydration failed", e)
      } finally {
        setIsHydrated(true)
      }
    }

    hydrate()
  }, [])

  const login = async (userData: any, token: string) => {
    await storage.setUser(userData)     //
    await storage.setAccessToken(token) //
    setUser(userData)
  }


  const logout = async () => {
    await storage.clearSession()
    setUser(null)
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