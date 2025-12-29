import 'react-native-get-random-values'
import { Buffer } from 'buffer';

// 2. Manually polyfill global variables
  global.Buffer = Buffer;

import { ActivityIndicator, View ,StyleSheet} from 'react-native'
import { Redirect } from 'expo-router'
import { useSession } from '@/lib/session/SessionContext'
import { useAccounts } from '@phantom/react-native-sdk'
import { colors } from '@/lib/theme'

export default function Index() {
  const { isHydrated, isAuthenticated } = useSession()
  const { isConnected } = useAccounts()

  // 1️⃣ Wait for storage hydration
  if (!isHydrated) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // 2️⃣ Wallet not connected
  if (!isConnected) {
    return <Redirect href="/home" />
  }

  // 3️⃣ Wallet connected + backend session OK
  if (isAuthenticated) {
    return <Redirect href="/wallet" />
  }

if (isConnected) {
      return <Redirect href="/invite" />
    }
  // 4️⃣ Wallet connected but no backend session yet
 // return <Redirect href="/home" />


}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
})