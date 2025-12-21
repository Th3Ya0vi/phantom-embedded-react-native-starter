import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

import { Colors } from '../styles/colors';
import { Gradients } from '../styles/gradients';
import { Spacing } from '../styles/spacing';
import { Typography } from '../styles/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function WalletScreen() {
      const insets = useSafeAreaInsets();
  const walletAddress = '0x9A3f82B91A...D92C';
  const totalBalance = '$124.32';

  const copyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
  };

  return (
    <View style={[
                  styles.container,
                  // 3. APPLY TOP PADDING HERE
                  { paddingTop: insets.top }
                ]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.subtitle}>Your on-chain identity</Text>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={Gradients.primaryGlow}
          style={styles.balanceGlow}
        >
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceValue}>{totalBalance}</Text>

            <View style={styles.addressRow}>
              <Text style={styles.addressText}>{walletAddress}</Text>
              <Pressable onPress={copyAddress}>
                <Text style={styles.copyIcon}>📋</Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionIcon}>⬆️</Text>
            <Text style={styles.actionText}>Send</Text>
          </Pressable>

          <Pressable style={styles.actionButton}>
            <Text style={styles.actionIcon}>⬇️</Text>
            <Text style={styles.actionText}>Receive</Text>
          </Pressable>
        </View>

        {/* Assets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assets</Text>

          <View style={styles.assetRow}>
            <Text style={styles.assetName}>USDC</Text>
            <View style={styles.assetRight}>
              <Text style={styles.assetAmount}>124.32</Text>
              <Text style={styles.assetValue}>$124.32</Text>
            </View>
          </View>

          <View style={styles.assetRow}>
            <Text style={styles.assetName}>SOL</Text>
            <View style={styles.assetRight}>
              <Text style={styles.assetAmount}>0.82</Text>
              <Text style={styles.assetValue}>$38.10</Text>
            </View>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          <View style={styles.txRow}>
            <Text style={styles.txText}>Received USDC</Text>
            <Text style={styles.txAmount}>+10</Text>
          </View>

          <View style={styles.txRow}>
            <Text style={styles.txText}>Paid for eSIM</Text>
            <Text style={styles.txAmount}>-18</Text>
          </View>

          <Pressable>
            <Text style={styles.viewAll}>View all transactions →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.textPrimary,
    ...Typography.h1,
  },
  subtitle: {
    color: Colors.textSecondary,
    ...Typography.body,
    marginTop: Spacing.xs,
  },

  balanceGlow: {
    borderRadius: 22,
    padding: 1,
    marginBottom: Spacing.xl,
  },
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: Spacing.lg,
  },
  balanceLabel: {
    color: Colors.textSecondary,
    ...Typography.caption,
  },
  balanceValue: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  addressRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressText: {
    color: Colors.textMuted,
    ...Typography.caption,
  },
  copyIcon: {
    fontSize: 16,
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.md,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },

  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    ...Typography.h2,
    marginBottom: Spacing.md,
  },

  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  assetName: {
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetAmount: {
    color: Colors.textPrimary,
  },
  assetValue: {
    color: Colors.textSecondary,
    fontSize: 12,
  },

  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  txText: {
    color: Colors.textPrimary,
  },
  txAmount: {
    color: Colors.textPrimary,
  },
  viewAll: {
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontSize: 13,
  },
});
