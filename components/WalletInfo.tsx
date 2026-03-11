import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import {
  useAccounts,
  useDisconnect,
  useSolana,
  useEthereum,
  useModal,
  AddressType,
} from '@phantom/react-native-sdk';
import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  Connection,
} from '@solana/web3.js';
import { useRouter } from 'expo-router';
import { getBalance } from '@/lib/solana';
import { truncateAddress, copyToClipboard } from '@/lib/utils';
import { colors } from '@/lib/theme';


/**
 * WalletInfo component - Dashboard for connected multi-chain wallet
 * Displays Solana & Ethereum wallet addresses, balances, and signing capabilities
 * Updated for SDK v1.0.0-beta.26 with modal integration
 */
export function WalletInfo() {
  const { addresses, isConnected, walletId } = useAccounts();
  const { disconnect, isDisconnecting } = useDisconnect();
  const { solana, isAvailable: isSolanaAvailable } = useSolana();
  const { ethereum, isAvailable: isEthereumAvailable } = useEthereum();
  const modal = useModal();
  const router = useRouter();
  
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const solanaAccount = addresses?.find(addr => addr.addressType === AddressType.solana);
  const ethereumAccount = addresses?.find(addr => addr.addressType === AddressType.ethereum);

  // Redirect to home if disconnected
  useEffect(() => {
    if (!isConnected) {
      router.replace('/');
    }
  }, [isConnected]);

  // Fetch Solana balance when account is available
  useEffect(() => {
    if (solanaAccount?.address) {
      fetchBalance(solanaAccount.address);
    }
  }, [solanaAccount?.address]);

  const fetchBalance = async (address: string) => {
    setIsLoadingBalance(true);
    try {
      const bal = await getBalance(address);
      setSolBalance(bal);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleCopy = async (address: string, chain: string) => {
    await copyToClipboard(address);
    Alert.alert('Copied!', `${chain} address copied to clipboard`);
  };

  const handleSignSolanaMessage = async () => {
    if (!isSolanaAvailable || !solana) return;
    setIsSigning(true);
    try {
      const message = `Hello from Phantom SDK! Timestamp: ${Date.now()}`;
      const signature = await solana.signMessage(message);
      Alert.alert('Signed! ✓', `Signature: ${signature.signature.slice(0, 16)}...`);
    } catch (error: any) {
      if (!error?.message?.includes('cancelled')) {
        Alert.alert('Error', error?.message || 'Signing failed');
      }
    } finally {
      setIsSigning(false);
    }
  };

  const handleSendSOL = async () => {
    if (!isSolanaAvailable || !solana || !solanaAccount?.address) return;
    setIsSigning(true);
    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const { blockhash } = await connection.getLatestBlockhash();
      const fromAddress = await solana.getPublicKey();
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: new PublicKey(fromAddress),
      }).add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(fromAddress),
          toPubkey: new PublicKey(fromAddress), // sends to self as demo
          lamports: 0.001 * LAMPORTS_PER_SOL,
        })
      );
      const result = await solana.signAndSendTransaction(transaction);
      Alert.alert('Sent! ✓', `Tx: ${result.hash.slice(0, 16)}...`);
    } catch (error: any) {
      if (!error?.message?.includes('cancelled')) {
        Alert.alert('Error', error?.message || 'Transaction failed');
      }
    } finally {
      setIsSigning(false);
    }
  };

  const handleSignEthereumMessage = async () => {
    if (!isEthereumAvailable || !ethereum || !ethereumAccount?.address) return;
    setIsSigning(true);
    try {
      const message = `Hello from Phantom SDK! Timestamp: ${Date.now()}`;
      const signature = await ethereum.signPersonalMessage(message, ethereumAccount.address);
      Alert.alert('Signed! ✓', `Signature: ${signature.slice(0, 16)}...`);
    } catch (error: any) {
      if (!error?.message?.includes('cancelled')) {
        Alert.alert('Error', error?.message || 'Signing failed');
      }
    } finally {
      setIsSigning(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      router.replace('/');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const handleExploreDocs = () => {
    Linking.openURL('https://docs.phantom.com');
  };

  // Loading state while fetching wallet info
  if (!solanaAccount && !ethereumAccount) {
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
<Text style={styles.welcomeText}>Welcome back</Text>
        {walletId && (
          <Text style={styles.walletId}>{walletId.slice(0, 8)}...{walletId.slice(-4)}</Text>
        )}
      </View>

      {/* Account Settings Button - Opens SDK Modal */}
      <TouchableOpacity
        style={styles.manageButton}
        onPress={() => modal.open()}
      >
        <Text style={styles.manageButtonText}>Account Settings</Text>
      </TouchableOpacity>

      {/* Solana Card */}
      {solanaAccount && (
        <View style={styles.chainCard}>
          <View style={styles.chainHeader}>
            <View style={styles.chainBadge}>
              <Text style={styles.chainIcon}>◎</Text>
            </View>
            <Text style={styles.chainName}>Solana</Text>
            {isSolanaAvailable && <View style={styles.statusDot} />}
          </View>
          
          <TouchableOpacity 
            style={styles.addressRow}
            onPress={() => handleCopy(solanaAccount.address, 'Solana')}
          >
            <Text style={styles.addressLabel}>Address</Text>
            <Text style={styles.addressValue}>{truncateAddress(solanaAccount.address, 6)}</Text>
          </TouchableOpacity>

          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <View style={styles.balanceValue}>
              {isLoadingBalance ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : (
                <Text style={styles.balanceAmount}>{solBalance?.toFixed(4) ?? '0.0000'} SOL</Text>
              )}
              <TouchableOpacity onPress={() => fetchBalance(solanaAccount.address)}>
                <Text style={styles.refreshLink}>↻</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.signButton}
            onPress={handleSignSolanaMessage}
            disabled={isSigning || !isSolanaAvailable}
          >
            {isSigning ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.signButtonText}>Sign Message</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signButton, { marginTop: 8 }]}
            onPress={handleSendSOL}
            disabled={isSigning || !isSolanaAvailable}
          >
            {isSigning ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.signButtonText}>Send SOL (Demo)</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Ethereum Card */}
      {ethereumAccount && (
        <View style={[styles.chainCard, styles.ethCard]}>
          <View style={styles.chainHeader}>
            <View style={[styles.chainBadge, styles.ethBadge]}>
              <Text style={styles.chainIcon}>Ξ</Text>
            </View>
            <Text style={styles.chainName}>Ethereum</Text>
            {isEthereumAvailable && <View style={[styles.statusDot, styles.ethDot]} />}
          </View>
          
          <TouchableOpacity 
            style={styles.addressRow}
            onPress={() => handleCopy(ethereumAccount.address, 'Ethereum')}
          >
            <Text style={styles.addressLabel}>Address</Text>
            <Text style={styles.addressValue}>{truncateAddress(ethereumAccount.address, 6)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signButton, styles.ethSignButton]}
            onPress={handleSignEthereumMessage}
            disabled={isSigning || !isEthereumAvailable}
          >
            {isSigning ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.signButtonText}>Sign Message</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

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

        <TouchableOpacity onPress={handleExploreDocs}>
          <Text style={styles.docsLink}>Explore SDK →</Text>
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
    color: colors.gray400,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
  },
  walletId: {
    fontSize: 12,
    color: colors.gray400,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  manageButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
  ethCard: {
    borderColor: colors.blue + '30',
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
    backgroundColor: colors.lavender + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ethBadge: {
    backgroundColor: colors.blue + '20',
  },
  chainIcon: {
    fontSize: 16,
    color: colors.ink,
  },
  chainName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    marginLeft: 10,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  ethDot: {
    backgroundColor: colors.blue,
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
    color: colors.gray400,
  },
  addressValue: {
    fontSize: 13,
    color: colors.ink,
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
    color: colors.gray400,
  },
  balanceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  refreshLink: {
    fontSize: 16,
    color: colors.brand,
  },
  signButton: {
    marginTop: 12,
    backgroundColor: colors.lavender,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  ethSignButton: {
    backgroundColor: colors.blue,
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
    color: colors.ink,
    fontSize: 14,
    fontWeight: '500',
  },
  docsLink: {
    fontSize: 14,
    color: colors.brand,
    fontWeight: '500',
  },
});
