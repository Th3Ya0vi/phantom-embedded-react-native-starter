import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// 2. Manually polyfill global variables
global.Buffer = Buffer;
import { PrivyElements } from '@privy-io/expo/ui';
import { Stack } from 'expo-router'
import { NotificationProvider } from '@/lib/ui/NotificationContext';
import { SessionProvider } from '@/lib/session/SessionContext'
import { PrivyProvider } from '@privy-io/expo';
import { colors } from '@/lib/theme'
import * as Sentry from '@sentry/react-native'
  ;
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';

WebBrowser.maybeCompleteAuthSession();

// Add deep link debugging
Linking.addEventListener('url', (event) => {
  console.log('=== DEEP LINK RECEIVED ===');
  console.log('URL:', event.url);
});

Sentry.init({
  dsn: 'https://fa8cdab53fb922ded18414ada485bd85@o4510642072911872.ingest.us.sentry.io/4510642073829376',
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

export default function RootLayout() {
  // Fallback to empty string if extra is undefined to avoid crashes, but these should be in app.json
  const privyAppId = Constants.expoConfig?.extra?.privyAppId || '';
  const privyClientId = Constants.expoConfig?.extra?.privyClientId || '';

  // Note: passkeyAssociatedDomain needs to be handled if PrivyProvider accepts it, otherwise it might be for specific passkey config.
  // Checking Privy docs (implicit knowledge), we usually pass appId and clientId.

  return (
    <PrivyProvider
      appId={privyAppId}
      clientId={privyClientId}
      config={{
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
      } as any}
    >

      <NotificationProvider>
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

            {/* CONNECT */}
            <Stack.Screen
              name="home"
              options={{
                title: 'Wallet',
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
      </NotificationProvider>
      <PrivyElements />
    </PrivyProvider>
  )
}
