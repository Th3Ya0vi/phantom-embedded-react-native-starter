import React, { useEffect, useState } from 'react';
import 'react-native-get-random-values';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { useLoginWithOAuth, usePrivy } from '@privy-io/expo';
import { colors } from '@/lib/theme';

/**
 * ConnectButton component handles Privy authentication
 */
export function ConnectButton() {
  const { user } = usePrivy();
  const { login, state } = useLoginWithOAuth();
  const [error, setError] = useState<string | null>(null);

  // Monitor OAuth state changes
  useEffect(() => {
    console.log('[ConnectButton] OAuth state changed:', state.status);

    if (state.status === 'error') {
      const errorMsg = `OAuth Error: ${state.error?.message || 'Unknown error'}`;
      console.error('[ConnectButton]', errorMsg);
      setError(errorMsg);
    } else if (state.status === 'initial') {
      setError(null);
    } else if (state.status === 'loading') {
      console.log('[ConnectButton] OAuth in progress...');
    } else if (state.status === 'done') {
      console.log('[ConnectButton] OAuth completed!');
      setError(null);
    }
  }, [state]);

  // Clear error after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async () => {
    try {
      console.log('[ConnectButton] Starting Google OAuth login...');
      console.log('[ConnectButton] Expected redirect URI: gesim://privy-oauth');
      setError(null);

      await login({
        provider: 'google',
        redirectUri: 'privy-oauth' // Path only, SDK adds scheme
      });

      console.log('[ConnectButton] Login call completed');
    } catch (e: any) {
      const errorMsg = e?.message || 'Login failed';
      console.error('[ConnectButton] Login error:', errorMsg, e);
      setError(errorMsg);
    }
  };

  if (user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        activeOpacity={0.85}
        disabled={state.status === 'loading'}
      >
        <Text style={styles.buttonText}>
          {state.status === 'loading' ? 'Logging in...' : 'Login with Google'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.infoText}>
        Sign in securely with Privy
      </Text>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      )}

      {/* Debug Info */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>OAuth State: {state.status}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
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
    borderColor: colors.lavender || '#E6E6FA',
    shadowColor: colors.lavender || '#E6E6FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    color: colors.textPrimary || colors.ink,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  infoText: {
    fontSize: 13,
    color: colors.gray400,
    textAlign: 'center',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    width: '100%',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  debugContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  debugText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
