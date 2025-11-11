import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Linking } from 'react-native';
import { ConnectButton } from '@/components/ConnectButton';
import { colors } from '@/lib/theme';

/**
 * Home screen - displays welcome message and connect button
 * This is the entry point of the app where users initiate Phantom Connect
 */
export default function HomeScreen() {
  const handleOpenPortal = () => {
    Linking.openURL('https://docs.phantom.com/phantom-portal-guide');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Phantom Embedded Wallet</Text>
      <Text style={styles.subtitle}>
        Starter kit for integrating the Phantom React Native SDK with embedded
        Solana wallets. Authenticate to create or connect your Phantom wallet
        and view balances instantly.
      </Text>
      <ConnectButton />
      <TouchableOpacity style={styles.portalButton} onPress={handleOpenPortal}>
        <Text style={styles.portalButtonText}>Open Phantom Portal Guide</Text>
      </TouchableOpacity>
      <Text style={styles.footer}>
        Learn how embedded Phantom wallets work at{' '}
        <Text style={styles.link}>docs.phantom.app</Text>.
      </Text>
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
  title: {
    fontSize: 32,
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
  footer: {
    marginTop: 24,
    fontSize: 14,
    color: colors.gray400,
    textAlign: 'center',
    lineHeight: 20,
  },
  link: {
    color: colors.brand,
    fontWeight: '600',
  },
  portalButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: colors.ink,
    shadowColor: '#00000014',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 2,
  },
  portalButtonText: {
    color: colors.paper,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});


