import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'

const ToastContext = createContext<any>(null)

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const showToast = useCallback((msg: string) => {
    // Clear existing timer if a new toast is called
    if (timerRef.current) clearTimeout(timerRef.current)

    setMessage(msg)

    timerRef.current = setTimeout(() => {
      setMessage(null)
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <View style={styles.toast}>
          <Text style={styles.text}>{message}</Text>
        </View>
      )}
    </ToastContext.Provider>
  )
}

// Improved hook with safety check
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider. Check your app/_layout.tsx')
  }
  return context
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100, // Moved up slightly to be above bottom tabs
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.9)', // Slightly transparent black
    padding: 16,
    borderRadius: 12,
    zIndex: 9999,      // Ensure it stays on top of everything (iOS)
    elevation: 10,     // Ensure it stays on top of everything (Android)
    borderWidth: 1,
    borderColor: '#333'
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500'
  },
})