import 'react-native-get-random-values'
import { Buffer } from 'buffer';

// 2. Manually polyfill global variables
global.Buffer = Buffer;

import { View, StyleSheet, Image } from 'react-native'
import { Redirect } from 'expo-router'
import { useSession } from '@/lib/session/SessionContext'
import { usePrivy } from '@privy-io/expo'
import { colors } from '@/lib/theme'

export default function Index() {
  const { isHydrated, isAuthenticated, user: sessionUser, lastPath } = useSession()
  const { user, isReady } = usePrivy()
  const isConnected = !!user;

  // 1️⃣ Wait for storage hydration AND Privy Readiness
  if (!isHydrated || !isReady) {
    return (
      <View style={styles.container}>
        <Image
          source={require('../assets/gesim_with_loading_dots.gif')}
          style={styles.splashGif}
          resizeMode="contain"
        />
      </View>
    )
  }

  // 2️⃣ Case: Backend Session Exists
  // If we have a local session, trust it and go to the app or invite
  if (isAuthenticated) {
    if (sessionUser?.inviteClaimed) {
      // Resume from last path or go to tabs root
      const resumePath = (lastPath && lastPath.includes('(tabs)')) ? lastPath : '/(tabs)';
      return <Redirect href={resumePath as any} />
    }
    return <Redirect href="/invite" />
  }

  // 3️⃣ Case: No Backend Session but Wallet Connected
  // This handles the state where Privy knows the user but the backend doesn't yet (auto-login stage)
  if (isConnected) {
    return <Redirect href="/invite" />
  }

  // 4️⃣ Default: Go to Landing Page
  return <Redirect href="/home" />
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashGif: {
    width: 200,
    height: 200,
  },
})