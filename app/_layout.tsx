// MUST be first
import 'react-native-get-random-values'

import { Stack } from 'expo-router'
import { ToastProvider } from '@/lib/ui/ToastContext';
import { SessionProvider } from '@/lib/session/SessionContext'
import {
  PhantomProvider,
  AddressType,
  darkTheme,
  type PhantomSDKConfig,
  type PhantomDebugConfig,
} from '@phantom/react-native-sdk'
import { colors } from '@/lib/theme'

export default function RootLayout() {
  const appId = process.env.EXPO_PUBLIC_PHANTOM_APP_ID || ''
  const scheme = process.env.EXPO_PUBLIC_APP_SCHEME || 'phantomwallet'

  const config: PhantomSDKConfig = {
    appId,
    scheme,
    providers: ['google', 'apple'],
    addressTypes: [AddressType.solana, AddressType.ethereum],
    authOptions: {
      redirectUrl: `${scheme}://invite`,
    },
  }

  const debugConfig: PhantomDebugConfig = {
    enabled: __DEV__,
  }

  const customTheme = {
    ...darkTheme,
    brand: colors.brand,
    borderRadius: 12,
  }

  return (
    <PhantomProvider
      config={config}
      debugConfig={debugConfig}
      theme={customTheme}
      appName="Phantom Wallet"
    >
    <ToastProvider>
      <SessionProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.paper },
            headerTintColor: colors.ink,
            headerTitleStyle: { fontWeight: 'bold' },
            headerShadowVisible: false,
          }}
        >
          {/* GATE SCREEN – NO HEADER */}
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />

          {/* PHANTOM CONNECT */}
          <Stack.Screen
            name="home"
            options={{
              title: 'Phantom Wallet',
              headerBackVisible: false,
            }}
          />

          {/* MAIN APP */}
          <Stack.Screen
            name="wallet"
            options={{
              title: 'Dashboard',
              headerBackVisible: false,
              gestureEnabled: false,
            }}
          />

          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />
        </Stack>
      </SessionProvider>
      </ToastProvider>
    </PhantomProvider>
  )
}
