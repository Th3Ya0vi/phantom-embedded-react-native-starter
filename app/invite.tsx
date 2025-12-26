import {
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  View,StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions
} from 'react-native';
import { useAccounts, useModal, AddressType } from '@phantom/react-native-sdk';
import { Colors as ThemeColors, Spacing as ThemeSpacing, Typography } from '@/lib/theme';
import { useState, useEffect } from 'react';
import { router ,Stack} from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useInviteActions } from '@/hooks/useInviteActions';

const { width } = Dimensions.get('window');

// Fallback Gradients if not yet in theme
const Gradients = {
  background: ['#1a1a2e', '#16213e', '#0f3460'] as const, // Deep Midnight Blue
  card: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)'] as const,
};

const Colors = ThemeColors || {
  primary: '#2F66F6',
  error: '#FF4B4B',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',
  // add other defaults if needed
};

const Spacing = ThemeSpacing || {
  xl: 32, sm: 8, lg: 24, md: 16
};

export default function InviteScreen() {
  const insets = useSafeAreaInsets();

  // State
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hooks
  const { addresses, isConnected } = useAccounts();
  const solanaAccount = addresses?.find(addr => addr.addressType === AddressType.solana);
  const modal = useModal();
  const { loginWithWallet } = useAuthActions();
  const { redeemInvite } = useInviteActions();

  // Close modal automatically if open
  useEffect(() => {
    if (isConnected && modal.isOpened) {
      const timer = setTimeout(() => modal.close(), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-login logic
  useEffect(() => {
    const runLogin = async () => {
      if (!isConnected || !addresses || addresses.length === 0) return;

      const walletAddress = solanaAccount?.address;
      if (!walletAddress) return;

      try {
        // Only show loading if we are actually checking invites
        // setLoading(true); // Optional: can keep UI interactive

        const user = await loginWithWallet(walletAddress);

        if (user && user.inviteClaimed) {
          router.replace('/(tabs)');
        }
      } catch (err) {
        console.error('Invite login check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    runLogin();
  }, [isConnected, addresses, solanaAccount]);

  const onRedeem = async () => {
    if (!code) return;
    setError(null);
    setLoading(true);
    try {
      await redeemInvite(code.trim());
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1 }}>

              <Stack.Screen options={{ headerShown: false }} />
        {/* 1. Background Gradient */}
        <LinearGradient
          colors={Gradients.background}
          style={StyleSheet.absoluteFill}
        />

        {/* 2. Decorative Glows */}
        <View style={[styles.glowCircle, styles.glowTopLeft]} />
        <View style={[styles.glowCircle, styles.glowBottomRight]} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.container, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.content}>

            {/* Header Section */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>You’re Invited</Text>
              <Text style={styles.subtitle}>
                Enter your exclusive code to access the future of connectivity.
              </Text>

              {/* Connected Wallet Pill */}
              {solanaAccount?.address ? (
                <View style={styles.walletPill}>
                  <View style={styles.activeDot} />
                  <Text style={styles.walletText}>
                    Connected: {solanaAccount.address.slice(0, 4)}...{solanaAccount.address.slice(-4)}
                  </Text>
                </View>
              ) : (
                <View style={[styles.walletPill, { borderColor: Colors.error }]}>
                   <Text style={[styles.walletText, { color: Colors.error }]}>Wallet not connected</Text>
                </View>
              )}
            </View>

            {/* Glassmorphism Card */}
            <LinearGradient
              colors={Gradients.card}
              style={styles.cardBorder}
            >
              <BlurView intensity={30} tint="dark" style={styles.cardBody}>

                <Text style={styles.label}>INVITATION CODE</Text>

                <TextInput
                  placeholder="GSM-XXXX-XXXX"
                  placeholderTextColor="#666"
                  value={code}
                  onChangeText={(text) => {
                    setCode(text);
                    setError(null);
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[styles.input, error && styles.inputError]}
                />

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    (!code || loading) && styles.disabledButton,
                    pressed && styles.pressedButton
                  ]}
                  disabled={!code || loading}
                  onPress={onRedeem}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify & Enter</Text>
                  )}
                </Pressable>

              </BlurView>
            </LinearGradient>

            {/* Footer */}
            <Pressable
              style={styles.footerButton}
              onPress={() => router.push('/request-invite')}
            >
              <Text style={styles.footerText}>
                Don’t have a code? <Text style={styles.linkText}>Request Access</Text>
              </Text>
            </Pressable>

          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },

  /* Background Elements */
  glowCircle: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    opacity: 0.15,
  },
  glowTopLeft: {
    top: -100,
    left: -100,
    backgroundColor: '#6366f1', // Indigo
  },
  glowBottomRight: {
    bottom: -100,
    right: -100,
    backgroundColor: Colors?.primary || '#2F66F6', // Blue
  },

  /* Header */
  headerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors?.textSecondary || '#A0A0A0',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    maxWidth: '85%',
  },

  /* Wallet Pill */
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e', // Green
    marginRight: 8,
  },
  walletText: {
    color: Colors?.textMuted || '#999',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '500',
  },

  /* Card */
  cardBorder: {
    borderRadius: 24,
    padding: 1, // Creates the border gradient effect
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  cardBody: {
    backgroundColor: 'rgba(20,20,30,0.6)', // Slightly opaque inner
    padding: Spacing.lg,
    borderRadius: 24,
  },
  label: {
    color: Colors?.primary || '#2F66F6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.lg,
  },
  inputError: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },

  /* Error Message */
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  errorIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '500',
  },

  /* Main Button */
  primaryButton: {
    backgroundColor: Colors?.primary || '#2F66F6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors?.primary || '#2F66F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  pressedButton: {
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  /* Footer */
  footerButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  footerText: {
    color: Colors?.textSecondary || '#A0A0A0',
    fontSize: 14,
  },
  linkText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
