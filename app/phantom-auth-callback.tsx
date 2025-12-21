import { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import { useAccounts } from '@phantom/react-native-sdk';
import { useRouter } from 'expo-router';
import { ConnectButton } from '@/components/ConnectButton';
import { colors } from '@/lib/theme';

// Import official Phantom logo
const PhantomLogo = require('@/assets/default.png');

/**
 * Home screen - displays welcome message and connect button
 * This is the entry point of the app where users initiate Phantom Connect
 * Updated for SDK v1.0.0-beta.26 with modal support
 */
export default function HomeScreen() {
  const { isConnected } = useAccounts();
  const router = useRouter();

  // Redirect to wallet if already connected
  useEffect(() => {
    if (isConnected) {
      router.replace('/wallet');
    }
  }, [isConnected]);

  const handleExploreDocs = () => {
    Linking.openURL('https://docs.phantom.com');
  };

  return (
    <View style={styles.container}>
      {/* Official Phantom Logo */}
      <Image
        source={PhantomLogo}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Phantom Embedded Wallet</Text>
      <Text style={styles.subtitle}>
        Login to create or access your Phantom wallet and view balances instantly.
      </Text>
      <ConnectButton />
      <TouchableOpacity onPress={handleExploreDocs} style={styles.linkButton}>
        <Text style={styles.linkText}>Explore SDK →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.paper,
    padding: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.ink,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray400,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  linkButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: colors.brand,
    fontWeight: '600',
  },
});
