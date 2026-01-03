// MUST be first
import 'react-native-get-random-values'
import { Buffer } from 'buffer';

// 2. Manually polyfill global variables
  global.Buffer = Buffer;


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
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://fa8cdab53fb922ded18414ada485bd85@o4510642072911872.ingest.us.sentry.io/4510642073829376',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default function RootLayout() {
  const appId = process.env.EXPO_PUBLIC_PHANTOM_APP_ID || ''
  const scheme = process.env.EXPO_PUBLIC_APP_SCHEME || 'phantomwallet'

  const config: PhantomSDKConfig = {
    appId,
    scheme,
    providers: ['google', 'apple'],
    addressTypes: [AddressType.solana, AddressType.ethereum],
    authOptions: {
      redirectUrl: `${scheme}://home`,
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
