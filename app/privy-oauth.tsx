import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { usePrivy, useEmbeddedSolanaWallet } from '@privy-io/expo';
import { colors } from '@/lib/theme';

/**
 * OAuth Redirect Handler for Privy
 * 
 * When the OAuth flow completes, the browser redirects to `gesim://privy-oauth`.
 * This screen is triggered by that deep link. The Privy SDK automatically processes
 * the OAuth callback in the background - we just wait for the user to become available
 * and then navigate to the appropriate screen.
 */
export default function PrivyOAuthRedirect() {
    const router = useRouter();
    const { user, isReady } = usePrivy();
    const wallet = useEmbeddedSolanaWallet();
    const [statusMessage, setStatusMessage] = useState('Initializing...');

    useEffect(() => {
        console.log('=== PRIVY OAUTH REDIRECT SCREEN MOUNTED ===');
        console.log('[OAuth Redirect] isReady:', isReady);
        console.log('[OAuth Redirect] user:', user?.id || 'null');
        console.log('[OAuth Redirect] wallet status:', wallet.status);

        // Wait for Privy to be ready
        if (!isReady) {
            console.log('[OAuth Redirect] Waiting for Privy to initialize...');
            setStatusMessage('Waiting for Privy to initialize...');
            return;
        }

        setStatusMessage('Checking authentication...');

        // Once ready, check if we have a user
        if (user) {
            console.log('[OAuth Redirect] ✅ Login successful! User:', user.id);
            console.log('[OAuth Redirect] User email:', (user as any)?.email?.address);
            setStatusMessage('Login successful!');

            // Get wallet address if available
            const walletAddress = wallet.status === 'connected' ? (wallet as any).address : null;
            if (walletAddress) {
                console.log('[OAuth Redirect] ✅ Embedded wallet address:', walletAddress);
            } else {
                console.log('[OAuth Redirect] ⚠️ Wallet status:', wallet.status);
            }

            // Navigate to invite screen (or wallet if already claimed)
            console.log('[OAuth Redirect] Navigating to /invite in 1 second...');
            setStatusMessage('Redirecting to app...');
            setTimeout(() => {
                router.replace('/invite');
            }, 1000);
        } else {
            console.log('[OAuth Redirect] ❌ No user found after OAuth redirect');
            console.log('[OAuth Redirect] This means the OAuth flow did not complete successfully');
            setStatusMessage('Login failed - no user found');
            setTimeout(() => {
                console.log('[OAuth Redirect] Redirecting back to home...');
                router.replace('/home');
            }, 2000);
        }
    }, [isReady, user, router]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
            <Text style={styles.text}>{statusMessage}</Text>
            {__DEV__ && (
                <View style={styles.debugContainer}>
                    <Text style={styles.debugText}>Ready: {isReady ? 'Yes' : 'No'}</Text>
                    <Text style={styles.debugText}>User: {user ? user.id : 'null'}</Text>
                    <Text style={styles.debugText}>Wallet: {wallet.status}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    text: {
        marginTop: 16,
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    debugContainer: {
        marginTop: 24,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        width: '90%',
    },
    debugText: {
        color: colors.textSecondary,
        fontSize: 12,
        fontFamily: 'monospace',
        marginVertical: 2,
    },
});
