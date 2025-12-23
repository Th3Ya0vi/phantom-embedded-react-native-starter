import {Text,TextInput,Pressable} from 'react-native';
import {useAccounts,useDisconnect,useSolana,useEthereum,useModal,AddressType,} from '@phantom/react-native-sdk';
import { useState,useEffect } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthActions } from '@/hooks/useAuthActions'
import { useInviteActions } from '@/hooks/useInviteActions'
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '@/lib/session/SessionContext';
import { colors } from '@/lib/theme';
import { Spacing } from './styles/spacing';
import { Typography } from './styles/typography';

export default function InviteScreen() {
      console.log("DEBUG: InviteScreen is rendering!"); // This should show immediately when page opens
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addresses, isConnected, walletId } = useAccounts();
  const solanaAccount = addresses?.find(addr => addr.addressType === AddressType.solana);
const modal = useModal();
  const { loginWithWallet } = useAuthActions()
  const { redeemInvite } = useInviteActions()

useEffect(() => {
    if (isConnected && modal.isOpened) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        modal.close();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);


  useEffect(() => {
    const runLogin = async () => {
      // 1. Check 'addresses' instead of 'accounts'
      // 2. Ensure addresses array is not empty
      if (!isConnected || !addresses || addresses.length === 0) {
        console.log("DEBUG: Waiting for wallet connection or addresses...");
        return;
      }

      // 3. Find the Solana account safely inside the effect or
      // ensure the one outside is available
      const walletAddress = solanaAccount?.address;

      if (!walletAddress) {
        console.log("DEBUG: Wallet connected, but Solana address not found yet.");
        return;
      }

      try {
        setLoading(true); // Start loading state
        console.log("DEBUG: Attempting login with:", walletAddress);

        const user = await loginWithWallet(walletAddress);
        console.log("DEBUG: Login successful, user:", user);

        if (user && user.inviteClaimed) {
          console.log("DEBUG: Invite already claimed, redirecting...");
          router.replace('/(tabs)');
        }
      } catch (err) {
        console.error('Invite login failed:', err);
        // You might want to setError(err.message) here to show on UI
      } finally {
        setLoading(false);
      }
    };

    runLogin();
    // 4. CRITICAL: Add addresses to dependencies so it re-runs when they arrive
  }, [isConnected, addresses, solanaAccount]);

const onRedeem = async () => {
    setError(null)
    try {
      await redeemInvite(code.trim())
      router.replace('/(tabs)')
    } catch (e: any) {
      setError(e.message || 'Invalid invite code')
    }
  }


//   const validateInviteCode = async () => {
//     setLoading(true);
//     setError(null);
//
//     // ⏳ Simulate API call
//     setTimeout(() => {
//       setLoading(false);
//
//       // ✅ TEMP LOGIC (replace with API)
//       if (code.trim().toUpperCase() === 'GSM1234') {
//         router.replace('/(tabs)');
//       } else {
//         setError('Invalid invite code. Please request one.');
//       }
//     }, 1200);
//   };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>You’re Invited</Text>
        {/* --- NEW: Solana Address Display --- */}
          {solanaAccount?.address ? (
            <Text style={styles.addressLabel}>
              Wallet: {solanaAccount.address.slice(0, 6)}...{solanaAccount.address.slice(-4)}
            </Text>
          ) : (
            <Text style={styles.addressLabel}>Connecting wallet...</Text>
          )}
          {/* ----------------------------------- */}

        <Text style={styles.subtitle}>
          Enter your invitation code to access GeSIM
        </Text>

        {/* Input */}
        <TextInput
          placeholder="Enter invite code"
          placeholderTextColor={colors.textMuted}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          style={styles.input}
        />

        {/* Error */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* CTA */}
        <Pressable
          style={[
            styles.primaryButton,
            !code && styles.disabledButton,
          ]}
          disabled={!code || loading}
          onPress={onRedeem}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryButtonText}>Continue</Text>
          )}
        </Pressable>

        {/* Secondary Action */}
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push('/request-invite')}
        >
          <Text style={styles.secondaryText}>
            Don’t have a code? Request an invite
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors?.background || '#000',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },

  title: {
    color: colors?.textPrimary || '#FFFFFF',
    ...Typography.h1,
    textAlign: 'center',
  },
// NEW STYLE FOR ADDRESS
  addressLabel: {
    color: colors?.primary || '#2F66F6', // Using your new blue theme
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontFamily: 'monospace', // Gives it a "crypto" look
    fontWeight: '500',
  },
  subtitle: {
    color: colors.textSecondary,
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },

  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: colors?.textPrimary || '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 1.5,
  },

  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  primaryButton: {
    backgroundColor: '#B7B0F5',
    borderRadius: 20,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },

  secondaryButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  secondaryText: {
    color: colors?.textSecondary || '#A0A0A0',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
