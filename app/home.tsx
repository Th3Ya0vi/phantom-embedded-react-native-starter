import { useEffect } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native'
import { useAccounts } from '@phantom/react-native-sdk'
import { useAuthActions } from '@/hooks/useAuthActions'
import { useRouter } from 'expo-router'
import { ConnectButton } from '@/components/ConnectButton'
import { colors } from '@/lib/theme'
import { Redirect } from 'expo-router';

const PhantomLogo = require('@/assets/default.png')

export default function HomeScreen() {
  const { isConnected } = useAccounts()
  const router = useRouter()

  useEffect(() => {
      const login = async () => {
        if (!isConnected || !accounts?.[0]) return

        const walletAddress = accounts[0].address

        await loginWithWallet(walletAddress)

        // session is set → index.tsx would also redirect,
        // but we can be explicit
        router.replace('/wallet')
      }

      login()
    }, [isConnected])

    if (isConnected) {
          return <Redirect href="/invite" />
        }

  return (
    <View style={styles.container}>
      <Image source={PhantomLogo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Phantom Embedded Wallet</Text>
      <Text style={styles.subtitle}>
        Login to create or access your Phantom wallet and view balances instantly.
      </Text>
      <ConnectButton />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  linkButton: {
    marginTop: 16,
  },
  linkText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: '500',
  },
})
