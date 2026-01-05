import React, { useEffect, useState } from 'react';
import 'react-native-get-random-values'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Clipboard,
} from 'react-native';
import { usePrivy, useEmbeddedSolanaWallet } from '@privy-io/expo';
import { useRouter, useRootNavigationState } from 'expo-router';
import { getBalance } from '@/lib/solana';
import { truncateAddress } from '@/lib/utils';
import { colors } from '@/lib/theme';
import { useApiActions } from '@/hooks/useApiActions';
import { useNotifications } from '@/lib/ui/NotificationContext';

// Import App logo
const AppLogo = require('@/assets/default.png');

/**
 * WalletInfo component - Dashboard for connected wallet
 * Uses Privy Embedded Solana Wallet
 */
export function WalletInfo() {
  const { user, logout } = usePrivy();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { getWalletBalance } = useApiActions();
  const { showAlert } = useNotifications();

  // Privy Embedded Wallet
  const wallet = useEmbeddedSolanaWallet();
  // Safe access to provider via casting if types are missing
  const provider = (wallet as any).provider;

  const [walletData, setWalletData] = useState({
    solBalance: 0,
    usdcBalance: 0,
    totalValue: 0,
    solValue: 0,
  });
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Address logic
  const getSolanaAddress = (u: any) => {
    if (!u) return null;
    const solanaAccount = u.linked_accounts?.find(
      (acc: any) => acc.type === 'wallet' && acc.chain_type === 'solana'
    );
    return solanaAccount?.address || null;
  };

  const walletAddress = getSolanaAddress(user) || (wallet as any).address;

  // Redirect to home if disconnected
  useEffect(() => {
    const navigationReady = rootNavigationState?.key;
    if (navigationReady && !user) {
      const timer = setTimeout(() => {
        router.replace('/');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, rootNavigationState?.key]);

  // Fetch balance
  useEffect(() => {
    if (walletAddress) {
      fetchBalance(walletAddress);
    }
  }, [walletAddress]);

  const fetchBalance = async (address: string) => {
    setIsLoadingBalance(true);
    try {
      const data = await getWalletBalance(address);
      if (data) {
        setWalletData(data);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleCopy = async (address: string, chain: string) => {
    Clipboard.setString(address);
    showAlert({
      title: 'Copied!',
      message: `${chain} address copied to clipboard`,
    });
  };

  const handleSignSolanaMessage = async () => {
    if (!provider) return;
    setIsSigning(true);
    try {
      const message = `Hello from GeSIM! Timestamp: ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await provider.signMessage(encodedMessage);
      showAlert({
        title: 'Signed! ✓',
        message: `Signature: ${signature.toString()}`,
      });
    } catch (error: any) {
      showAlert({
        title: 'Error',
        message: error?.message || 'Signing failed',
      });
    } finally {
      setIsSigning(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Disconnect failed:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (!user || !walletAddress) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand} />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome</Text>
        <Text style={styles.walletId}>{user.id.slice(0, 10)}...</Text>
      </View>

      {/* Solana Card */}
      <View style={styles.chainCard}>
        <View style={styles.chainHeader}>
          <View style={styles.chainBadge}>
            <Text style={styles.chainIcon}>◎</Text>
          </View>
          <Text style={styles.chainName}>Solana</Text>
          <View style={styles.statusDot} />
        </View>

        <TouchableOpacity
          style={styles.addressRow}
          onPress={() => handleCopy(walletAddress, 'Solana')}
        >
          <Text style={styles.addressLabel}>Address</Text>
          <Text style={styles.addressValue}>{truncateAddress(walletAddress, 6)}</Text>
        </TouchableOpacity>

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>SOL Balance</Text>
          <View style={styles.balanceValue}>
            {isLoadingBalance ? (
              <ActivityIndicator size="small" color={colors.brand} />
            ) : (
              <Text style={styles.balanceAmount}>{walletData.solBalance?.toFixed(4) ?? '0.0000'} SOL</Text>
            )}
          </View>
        </View>

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>USDC Balance</Text>
          <View style={styles.balanceValue}>
            {isLoadingBalance ? (
              <ActivityIndicator size="small" color={colors.brand} />
            ) : (
              <Text style={styles.balanceAmount}>${walletData.usdcBalance?.toFixed(2) ?? '0.00'} USDC</Text>
            )}
            <TouchableOpacity onPress={() => fetchBalance(walletAddress)}>
              <Text style={styles.refreshLink}>↻</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.signButton}
          onPress={handleSignSolanaMessage}
          disabled={isSigning}
        >
          {isSigning ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.signButtonText}>Sign Message</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleDisconnect}
          disabled={isDisconnecting}
        >
          {isDisconnecting ? (
            <ActivityIndicator color={colors.ink} size="small" />
          ) : (
            <Text style={styles.logoutText}>Log Out</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.paper,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  walletId: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  chainCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.paper,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  chainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chainBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: (colors.lavender || '#E6E6FA') + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainIcon: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  chainName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 10,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  addressLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  addressValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  balanceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  refreshLink: {
    fontSize: 16,
    color: colors.brand,
  },
  signButton: {
    marginTop: 12,
    backgroundColor: colors.lavender || '#E6E6FA',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  signButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 16,
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  logoutText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
});
