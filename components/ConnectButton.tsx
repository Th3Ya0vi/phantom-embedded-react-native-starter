import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { useModal, useAccounts } from '@phantom/react-native-sdk';
import { colors } from '@/lib/theme';

// Use the light.png - lavender ghost on transparent background
const PhantomGhost = require('@/assets/light.png');

/**
 * ConnectButton component handles Phantom wallet authentication
 * Uses SDK v1.0.0 modal for wallet connection
 * Modal supports Google and Apple authentication
 */
export function ConnectButton() {
  const modal = useModal();
  const { isConnected } = useAccounts();

  // Auto-open modal when component mounts (if not connected)
  useEffect(() => {
    if (!isConnected && !modal.isOpened) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        modal.open();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Hide button if already connected
  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Login button - clean minimal design with Phantom ghost */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => modal.open()}
        activeOpacity={0.85}
      >
        <Image source={PhantomGhost} style={styles.ghost} resizeMode="contain" />
        <Text style={styles.buttonText}>Login with Phantom</Text>
      </TouchableOpacity>

      {/* Info text about available providers */}
      <Text style={styles.infoText}>
        Sign in with Google or Apple
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderColor: colors.lavender,
    // Subtle shadow for depth
    shadowColor: colors.lavender,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  ghost: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  buttonText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  infoText: {
    fontSize: 13,
    color: colors.gray400,
    textAlign: 'center',
  },
});
