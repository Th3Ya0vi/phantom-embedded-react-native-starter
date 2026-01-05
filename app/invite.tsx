import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  ScrollView,
  RefreshControl,
  AppState,
  Clipboard,
} from 'react-native';
import * as Linking from 'expo-linking';
import { usePrivy, useEmbeddedSolanaWallet } from '@privy-io/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack, useFocusEffect } from 'expo-router'; // ✅ Added useFocusEffect
import { Colors as ThemeColors, Spacing as ThemeSpacing } from '@/lib/theme';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useInviteActions } from '@/hooks/useInviteActions';
import { useSession } from '@/lib/session/SessionContext';
import { useApiActions } from '@/hooks/useApiActions';
import { useNotifications } from '@/lib/ui/NotificationContext';

const { width } = Dimensions.get('window');

const log = (tag: string, data?: any) => {
  const ts = new Date().toISOString().split('T')[1];
  console.log(`[${ts}] ${tag}`, data ?? '');
};

const Gradients = {
  background: ['#1a1a2e', '#16213e', '#0f3460'] as const,
  card: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)'] as const,
};

const Colors = ThemeColors || { primary: '#2F66F6', error: '#FF4B4B', textSecondary: '#A0A0A0' };
const Spacing = ThemeSpacing || { xl: 32, sm: 8, lg: 24, md: 16 };
const STATUS_COLORS = { success: '#22c55e', processing: '#F59E0B', error: '#FF4B4B' };

export default function InviteScreen() {

  const insets = useSafeAreaInsets();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const hasAttemptedLogin = useRef(false);

  // ✅ GET THE FULL USER OBJECT
  const { isHydrated, isAuthenticated, user: sessionUser } = useSession(); // sessionUser to avoid conflict if needed, but Privy uses 'user' too.
  const { user, isReady } = usePrivy();
  const wallet = useEmbeddedSolanaWallet();
  const { handleLogin } = useApiActions();
  const { showToast } = useNotifications();

  // Helper to extract Solana address from Privy user
  const getSolanaAddress = (u: any) => {
    if (!u) return null;
    const solanaAccount = u.linked_accounts?.find(
      (acc: any) => acc.type === 'wallet' && acc.chain_type === 'solana'
    );
    return solanaAccount?.address || null;
  };

  const privyAddress = getSolanaAddress(user);
  const hookAddress = wallet.status === 'connected' ? (wallet as any).address : null;
  const walletAddress = privyAddress || hookAddress;
  const isWalletReady = !!walletAddress;

  // Log wallet state for debugging
  useEffect(() => {
    if (!isReady) return;
    // Verbose logging removed for cleaner production experience
  }, [user, wallet.status, isHydrated, isAuthenticated, sessionUser, isCreatingWallet, isReady, walletAddress]);

  // ✅ AUTOMATIC WALLET CREATION
  useEffect(() => {
    const createWalletIfNeeded = async () => {
      if (!isReady) return;
      if (!user) {
        console.log('[WalletCreation] No user yet (user is null), cannot create wallet');
        return;
      }

      // If we already have an address from the user object, we don't need to create
      if (privyAddress) {
        console.log('[WalletCreation] Wallet already exists in user object:', privyAddress);
        return;
      }

      console.log('[WalletCreation] Checking status:', wallet.status);
      if (wallet.status === 'not-created') {
        console.log('[WalletCreation] Status is NOT-CREATED. Attempting to create...');
        setIsCreatingWallet(true);
        try {
          const newWallet = await wallet.create();
          console.log('[WalletCreation] ✅ wallet.create() call finished:', newWallet?.address);
          showToast('Wallet created successfully');
        } catch (err: any) {
          console.error('[WalletCreation] ❌ Error in wallet.create():', err);
          // If the error says it already exists, just log it
          if (err.message?.includes('already has') || err.message?.includes('exists')) {
            console.log('[WalletCreation] Wallet actually already exists');
          } else {
            showToast(err.message || 'Failed to create wallet');
          }
        } finally {
          setIsCreatingWallet(false);
        }
      } else {
        console.log('[WalletCreation] Skipping creation, status is:', wallet.status);
      }
    };

    createWalletIfNeeded();
  }, [user, wallet.status, isReady, privyAddress]);


  // ✅ AUTOMATIC LOGIN WHEN WALLET IS READY
  useEffect(() => {
    const performAutoLogin = async () => {
      // Only login when we have an address and we haven't tried yet
      if (
        walletAddress &&
        user &&
        !hasAttemptedLogin.current &&
        !isAuthenticated
      ) {
        const email = (user as any)?.email?.address || (user as any).linked_accounts?.find((a: any) => a.type === 'email')?.address;

        console.log('[AutoLogin] Attempting login with wallet:', walletAddress);
        console.log('[AutoLogin] Email:', email);

        hasAttemptedLogin.current = true;

        try {
          await handleLogin({ email, walletAddress });
          console.log('[AutoLogin] ✅ Login successful');
          showToast('Session synchronized');
        } catch (err: any) {
          console.error('[AutoLogin] ❌ Login failed:', err);
          showToast(err.message || 'Login sync failed');
          // Reset so user can retry if needed
          hasAttemptedLogin.current = false;
        }
      }
    };

    performAutoLogin();
  }, [walletAddress, user, isAuthenticated, handleLogin]);


  const isConnected = !!user;


  const { loginWithWallet } = useAuthActions();
  const { redeemInvite } = useInviteActions();

  /* ------------------------------------------------------------------ */
  /* LOGIN & REDIRECT LOGIC                                             */
  /* ------------------------------------------------------------------ */
  const checkSessionAndRedirect = useCallback(async () => {
    // ✅ THE CRITICAL FIX: Only redirect if the user session is valid AND inviteClaimed is true.
    if (isHydrated && isAuthenticated) {
      if (sessionUser?.inviteClaimed) {
        router.replace('/(tabs)');
        return;
      } else {
        return;
      }
    }

    // If session is valid but invite is NOT claimed, we stay on this page.
    if (isHydrated && isAuthenticated && !sessionUser?.inviteClaimed) {
      return;
    }

    // If not authenticated, but wallet is connected, try to log in.
    if (isHydrated && !isAuthenticated && isConnected && walletAddress) {
      setLoading(true);
      try {
        const loggedInUser = await loginWithWallet(walletAddress);
        // After login, re-check if their new session has inviteClaimed set
        if (loggedInUser?.inviteClaimed) {
          router.replace('/(tabs)');
        }
      } catch (err: any) {
        console.error('[Invite] Auto-login error:', err.message);
      } finally {
        setLoading(false);
      }
    }
  }, [isHydrated, isAuthenticated, sessionUser, isConnected, walletAddress, loginWithWallet]);

  useEffect(() => {
    // If the user is authenticated AND their invite status is now 'true', redirect.
    // This will fire after a successful `redeemInvite` call updates the context.
    if (isAuthenticated && sessionUser?.inviteClaimed) {
      router.replace('/(tabs)');
    }
  }, [sessionUser, isAuthenticated]);

  /* ------------------------------------------------------------------ */
  /* REFRESH HANDLERS                                                   */
  /* ------------------------------------------------------------------ */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    checkSessionAndRedirect().finally(() => setRefreshing(false));
  }, [checkSessionAndRedirect]);

  useFocusEffect(
    useCallback(() => {
      checkSessionAndRedirect();
    }, [checkSessionAndRedirect])
  );



  /* ------------------------------------------------------------------ */
  /* REDEEM LOGIC                                                       */
  /* ------------------------------------------------------------------ */
  const onRedeem = async () => {
    if (!code || loading || !isWalletReady) return;
    setError(null);
    setLoading(true);

    try {
      await redeemInvite(code.trim());
      // On successful redeem, the user object will update, and the useFocusEffect will handle the redirect.

    } catch (e: any) {
      setError(e.message || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      Clipboard.setString(walletAddress);
      showToast('Address copied to clipboard');
    }
  };

  const statusColor = isWalletReady ? STATUS_COLORS.success : STATUS_COLORS.processing;
  const isButtonDisabled = !code || loading || !isWalletReady;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {/* ... (The rest of your JSX remains exactly the same) ... */}
      <View style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <LinearGradient colors={Gradients.background} style={StyleSheet.absoluteFill} />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFF"
              colors={['#2F66F6']}
            />
          }
          alwaysBounceVertical={true}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { paddingTop: insets.top + 60 }]}
          >
            <View style={styles.content}>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>You’re Invited</Text>
                <Text style={styles.subtitle}>Enter your code to access the future of connectivity.</Text>

                <View style={[styles.walletPill, { borderColor: statusColor }]}>
                  <View style={[styles.activeDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.walletText, { color: statusColor }]}>
                    {isWalletReady
                      ? `Connected: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
                      : wallet.status === 'creating' || isCreatingWallet
                        ? 'Creating wallet...'
                        : wallet.status === 'not-created'
                          ? 'Wallet not created'
                          : `Wallet: ${wallet.status}...`}
                  </Text>
                  {!isWalletReady && (
                    <Pressable onPress={onRefresh} style={{ marginLeft: 8 }}>
                      <Text style={{ fontSize: 14 }}>🔄</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <LinearGradient colors={Gradients.card} style={styles.cardBorder}>
                <BlurView intensity={30} tint="dark" style={styles.cardBody}>
                  {/* WALLET STATUS SECTION ABOVE INPUT */}
                  <View style={styles.walletStatusSection}>
                    <Text style={styles.statusLabel}>WALLET STATUS</Text>
                    <View style={styles.statusDisplay}>
                      {isWalletReady ? (
                        <>
                          <View style={styles.addressContainer}>
                            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS.success }]} />
                            <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                              {walletAddress}
                            </Text>
                          </View>
                          <Pressable onPress={handleCopyAddress} style={styles.copyButton}>
                            <Text style={styles.copyButtonText}>COPY</Text>
                          </Pressable>
                        </>
                      ) : (
                        <View style={styles.processingContainer}>
                          <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 8 }} />
                          <Text style={styles.processingText}>
                            {wallet.status === 'creating' || isCreatingWallet
                              ? 'Creating your wallet...'
                              : 'Initializing wallet...'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={styles.label}>INVITATION CODE</Text>
                  <TextInput
                    placeholder="GSM-XX-XXX"
                    placeholderTextColor="#666"
                    value={code}
                    onChangeText={(t) => {
                      // ✅ This forces every character to uppercase as it's typed
                      setCode(t.toUpperCase());
                      setError(null);
                    }}
                    autoCapitalize="characters" // Suggests uppercase keyboard to the user
                    autoCorrect={false}         // Highly recommended for codes to prevent annoying autocorrect
                    style={[styles.input, error && styles.inputError]}
                  />

                  {error && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                  )}

                  <Pressable
                    style={[styles.primaryButton, isButtonDisabled && styles.disabledButton]}
                    disabled={isButtonDisabled}
                    onPress={onRedeem}
                  >
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Verify & Enter</Text>}
                  </Pressable>
                </BlurView>
              </LinearGradient>
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', marginBottom: Spacing.sm },
  subtitle: { color: Colors.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: Spacing.lg },
  walletPill: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.3)',
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  walletText: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  cardBorder: { borderRadius: 24, padding: 1, marginBottom: Spacing.xl },
  cardBody: { backgroundColor: 'rgba(20,20,30,0.6)', padding: Spacing.lg, borderRadius: 24 },
  label: { color: Colors.primary, fontSize: 12, fontWeight: '700', marginBottom: Spacing.sm },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 16, color: '#FFF',
    fontSize: 18, textAlign: 'center', marginBottom: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  inputError: { borderColor: '#FF6B6B' },
  errorContainer: { marginBottom: Spacing.md, padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,107,107,0.1)' },
  errorText: { color: '#FF6B6B', textAlign: 'center', fontSize: 13 },
  primaryButton: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  disabledButton: { opacity: 0.3 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  walletStatusSection: { marginBottom: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  statusLabel: { color: Colors.textSecondary, fontSize: 10, fontWeight: '700', marginBottom: Spacing.sm, letterSpacing: 1 },
  statusDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12 },
  addressContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  addressText: { color: '#FFF', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', flex: 1 },
  copyButton: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginLeft: 8 },
  copyButtonText: { color: Colors.primary, fontSize: 10, fontWeight: '700' },
  processingContainer: { flexDirection: 'row', alignItems: 'center' },
  processingText: { color: Colors.textSecondary, fontSize: 14 },
});