import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  AppState,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useAccounts, AddressType } from '@phantom/react-native-sdk';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack, useFocusEffect } from 'expo-router'; // ✅ Added useFocusEffect
import { Colors as ThemeColors, Spacing as ThemeSpacing } from '@/lib/theme';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useInviteActions } from '@/hooks/useInviteActions';
import { useSession } from '@/lib/session/SessionContext';

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

  // ✅ GET THE FULL USER OBJECT
  const { isHydrated, isAuthenticated, user } = useSession();
  const { addresses, isConnected } = useAccounts();
  const { loginWithWallet } = useAuthActions();
  const { redeemInvite } = useInviteActions();

  const solanaAccount = addresses?.find((addr) => addr.addressType === AddressType.solana);
  const walletAddress = solanaAccount?.address;

  /* ------------------------------------------------------------------ */
  /* LOGIN & REDIRECT LOGIC                                             */
  /* ------------------------------------------------------------------ */
  const checkSessionAndRedirect = useCallback(async () => {
    log('REDIRECT_CHECK_START', {
      isHydrated,
      isAuthenticated,
      inviteClaimed: user?.inviteClaimed,
      isConnected,
      hasAddress: !!walletAddress
    });

    // ✅ THE CRITICAL FIX: Only redirect if the user object exists AND inviteClaimed is true.
    if (isHydrated && isAuthenticated) {
        if(user?.inviteClaimed){
      log('REDIRECTING: User session is valid and invite is already claimed.',user?.inviteClaimed);
      router.replace('/(tabs)');
      return;
      }else {
   log('REDIRECTING FAILED: User session is valid and invite not claimed.',user.inviteClaimed);

          return ;}
    }

    // If session is valid but invite is NOT claimed, we stay on this page.
    if (isHydrated && isAuthenticated && !user?.inviteClaimed) {
        log('STAYING: User is logged in but has not claimed an invite yet.');
        return;
    }

    // If not authenticated, but wallet is connected, try to log in.
    if (isHydrated && !isAuthenticated && isConnected && walletAddress) {
      log('ATTEMPTING_AUTO_LOGIN', { walletAddress });
      setLoading(true);
      try {
        const loggedInUser = await loginWithWallet(walletAddress);
       log('User-LOGGED_IN', { inviteClaimed: loggedInUser?.inviteClaimed });
        // After login, re-check if their new session has inviteClaimed set
        if (loggedInUser?.inviteClaimed) {
          log('AUTO_LOGIN_SUCCESS: Invite claimed. Redirecting.');
          router.replace('/(tabs)');
        } else {
          log('AUTO_LOGIN_SUCCESS: User can now enter code.');
        }
      } catch (err: any) {
        log('AUTO_LOGIN_ERROR', err.message);
      } finally {
        setLoading(false);
      }
    } else {
        log('WAITING: Prerequisites for auto-login not met.');
    }
  }, [isHydrated, isAuthenticated, user, isConnected, walletAddress, loginWithWallet]);

useEffect(() => {
    log('STATE_WATCHER_EFFECT', { isAuthenticated, inviteClaimed: user?.inviteClaimed });

    // If the user is authenticated AND their invite status is now 'true', redirect.
    // This will fire after a successful `redeemInvite` call updates the context.
    if (isAuthenticated && user?.inviteClaimed) {
      log('STATE_WATCHER: Invite status is now claimed. Redirecting...');
      router.replace('/(tabs)');
    }
  }, [user, isAuthenticated]);

  /* ------------------------------------------------------------------ */
  /* REFRESH HANDLERS                                                   */
  /* ------------------------------------------------------------------ */
  const onRefresh = useCallback(() => {
    log('PULL_TO_REFRESH_TRIGGERED');
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
    if (!code || loading) return;
    setError(null);
    setLoading(true);
    try {
      await redeemInvite(code.trim());
      // On successful redeem, the user object will update, and the useFocusEffect will handle the redirect.
      log('REDEEM_SUCCESS: Invite claimed. Awaiting redirect.');

    } catch (e: any) {
      setError(e.message || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = walletAddress ? STATUS_COLORS.success : STATUS_COLORS.processing;

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
                    {walletAddress
                      ? `Connected: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
                      : 'Syncing with Phantom...'}
                  </Text>
                  <Pressable onPress={onRefresh} style={{ marginLeft: 8 }}>
                    <Text style={{ fontSize: 14 }}>🔄</Text>
                  </Pressable>
                </View>
              </View>

              <LinearGradient colors={Gradients.card} style={styles.cardBorder}>
                <BlurView intensity={30} tint="dark" style={styles.cardBody}>
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
                    style={[styles.primaryButton, (!code || loading) && styles.disabledButton]}
                    disabled={!code || loading}
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
  disabledButton: { opacity: 0.5 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});