
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePrivy, useEmbeddedSolanaWallet } from '@privy-io/expo';
import { useApiActions } from '@/hooks/useApiActions';
import { useNotifications } from '@/lib/ui/NotificationContext';

import {
  Colors as ThemeColors,
  Spacing as ThemeSpacing,
  Typography as ThemeTypography,
  Gradients as ThemeGradients
} from '@/lib/theme';

// Fallbacks
const Colors = ThemeColors || { primary: '#2F66F6', textPrimary: '#FFFFFF', textSecondary: '#94A3B8' };
const Spacing = ThemeSpacing || { lg: 24, xl: 32 };
const Typography = ThemeTypography || { h1: { fontSize: 32 }, h2: { fontSize: 24 }, body: { fontSize: 16 } };
const Gradients = {
  background: ThemeGradients?.background || ['#04070D', '#0F172A'],
};

// --- STATIC RECIPIENT ADDRESS ---
const GESIM_VAULT_ADDRESS = 'QgBkSapQmUqwzAU8RcP7HeR3ySPd2pbf1d2tzAEfHUz'; // Replace with your actual vault address

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  // --- HOOKS FOR DATA ---
  const { user } = usePrivy();
  const wallet = useEmbeddedSolanaWallet();

  // Helper to extract Solana address from Privy user
  const getSolanaAddress = (u: any) => {
    if (!u) return null;
    const solanaAccount = u.linked_accounts?.find(
      (acc: any) => acc.type === 'wallet' && acc.chain_type === 'solana'
    );
    return solanaAccount?.address || null;
  };

  const walletAddress = getSolanaAddress(user) || (wallet as any).address;

  const { getWalletBalance, handleSendTransaction } = useApiActions();
  const { showAlert } = useNotifications();

  // --- STATE TO HOLD BALANCES ---
  const [walletData, setWalletData] = useState({
    totalValue: 0,
    solBalance: 0,
    solValue: 0,
    usdcBalance: 0,
  });

  // --- DATA FETCHING LOGIC ---
  const fetchData = useCallback(async () => {
    if (!walletAddress) return;
    console.log("[WALLET] Fetching balances for:", walletAddress);
    const data = await getWalletBalance(walletAddress);
    if (data) {
      setWalletData(data);
    }
  }, [walletAddress]); // Stable dependency

  useEffect(() => {
    fetchData();
  }, [walletAddress]); // Only re-run if address changes

  const onRefresh = () => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  };

  // --- ACTIONS ---
  const handleSend = async () => {
    const amountToSend = '0.01'; // Static amount for testing
    const tokenToSend = 'USDC';

    if (walletData.usdcBalance < parseFloat(amountToSend)) {
      showAlert({
        title: "Insufficient Balance",
        message: `You need at least ${amountToSend} USDC.`
      });
      return;
    }

    showAlert({
      title: "Confirm Transfer",
      message: `Send ${amountToSend} ${tokenToSend} to GeSIM Vault?`,
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const signature = await handleSendTransaction(amountToSend, tokenToSend);
              if (signature) {
                showAlert({ title: "Success", message: "Transaction Sent!" });
                fetchData(); // Refresh balances
              }
            } catch (e: any) {
              showAlert({ title: "Error", message: e.message || "An unknown error occurred" });
            }
          }
        }
      ]
    });
  };

  const copyAddress = async () => {
    if (!walletAddress) return;
    await Clipboard.setStringAsync(walletAddress);
    showAlert({
      title: 'Copied',
      message: 'Address copied to clipboard!\n\n⚠️ Only transfer SOL & USDC tokens to this address.'
    });
  };

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not Connected';

  return (
    <LinearGradient colors={Gradients.background as any} style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E5FF" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Vault</Text>
          <Text style={styles.subtitle}>Your On-Chain Assets</Text>
        </View>

        {/* --- DYNAMIC BALANCE CARD --- */}
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={['rgba(47, 102, 246, 0.4)', 'rgba(0, 229, 255, 0.1)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.cardGlow}
          />
          <BlurView intensity={40} tint="dark" style={styles.balanceCard}>
            <Text style={styles.label}>Total Estimated Value</Text>
            <Text style={styles.balanceValue}>${walletData.totalValue.toFixed(4)}</Text>

            <Pressable onPress={copyAddress} style={styles.addressPill}>
              <View style={styles.dot} />
              <Text style={styles.addressText}>{truncatedAddress}</Text>
              <Text style={styles.copyText}>COPY</Text>
            </Pressable>
          </BlurView>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <ActionButton icon="⬆️" label="Send" onPress={handleSend} />
          <ActionButton icon="⬇️" label="Receive" onPress={copyAddress} />
          {/*    <ActionButton icon="🔄" label="Swap" />  */}
        </View>

        {/* --- DYNAMIC ASSETS SECTION --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assets</Text>
          <AssetRow
            name="USD Coin"
            symbol="USDC"
            amount={walletData.usdcBalance.toFixed(2)}
            value={`$${walletData.usdcBalance.toFixed(2)}`}
            color="#2F66F6"
          />
          <AssetRow
            name="Solana"
            symbol="SOL"
            amount={walletData.solBalance.toFixed(4)}
            value={`$${walletData.solValue.toFixed(2)}`}
            color="#8b5cf6"
          />
        </View>

        {/* Transaction History (Static for now)
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Activity</Text>
                <TransactionRow type="Purchase" desc="eSIM Spain 5GB" date="Today" />
                <TransactionRow type="Received" desc="From External Wallet" date="Yesterday" />
              </View>*/}
      </ScrollView>
    </LinearGradient>
  );
}

// --- SUB-COMPONENTS ---
const ActionButton = ({ icon, label, onPress }: any) => (
  <Pressable onPress={onPress} style={styles.actionWrapper}>
    <BlurView intensity={20} tint="dark" style={styles.actionBtn}>
      <Text style={styles.actionIcon}>{icon}</Text>
    </BlurView>
    <Text style={styles.actionLabel}>{label}</Text>
  </Pressable>
);

const AssetRow = ({ name, symbol, amount, value, color }: any) => (
  <BlurView intensity={10} tint="dark" style={styles.assetCard}>
    <View style={[styles.assetIcon, { backgroundColor: color + '20', borderColor: color + '40' }]}>
      <Text style={{ color, fontWeight: '700' }}>{name[0]}</Text>
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={styles.assetName}>{name}</Text>
      <Text style={styles.assetSymbol}>{symbol}</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={styles.assetAmount}>{amount}</Text>
      <Text style={styles.assetValue}>{value}</Text>
    </View>
  </BlurView>
);

const TransactionRow = ({ type, desc, date }: any) => (
  <View style={styles.txRow}>
    <View style={styles.txTimeline}>
      <View style={styles.txDot} />
      <View style={styles.txLine} />
    </View>
    <View style={styles.txContent}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.txTitle}>{type}</Text>
        <Text style={styles.txDate}>{date}</Text>
      </View>
      <Text style={styles.txDesc}>{desc}</Text>
    </View>
  </View>
);

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  header: { marginBottom: 32 },
  title: { ...Typography.h1 },
  subtitle: { ...Typography.body, marginTop: 4 },
  cardContainer: { position: 'relative', marginBottom: 32 },
  cardGlow: { position: 'absolute', top: -10, left: -10, right: -10, bottom: -10, borderRadius: 32, opacity: 0.5 },
  balanceCard: { borderRadius: 32, padding: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  balanceValue: { color: Colors.textPrimary, fontSize: 42, fontWeight: '800', marginVertical: 12 },
  addressPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 12, alignSelf: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00E5FF', marginRight: 8 },
  addressText: { color: Colors.textPrimary, fontSize: 12, fontFamily: 'monospace' },
  copyText: { color: Colors.primary, fontSize: 10, fontWeight: '800', marginLeft: 12 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 40 },
  actionWrapper: { alignItems: 'center' },
  actionBtn: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionIcon: { fontSize: 24 },
  actionLabel: { color: Colors.textSecondary, marginTop: 8, fontSize: 12, fontWeight: '600' },
  section: { marginBottom: 32 },
  sectionTitle: { ...Typography.h2, marginBottom: 16 },
  assetCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  assetIcon: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  assetName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  assetSymbol: { color: Colors.textSecondary, fontSize: 12 },
  assetAmount: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  assetValue: { color: Colors.textSecondary, fontSize: 12 },
  txRow: { flexDirection: 'row', height: 70 },
  txTimeline: { alignItems: 'center', width: 20 },
  txDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  txLine: { flex: 1, width: 2, backgroundColor: `rgba(47, 102, 246, 0.2)`, marginVertical: 4 },
  txContent: { flex: 1, marginLeft: 16 },
  txTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  txDate: { color: '#475569', fontSize: 12 },
  txDesc: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 }
});


