import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Colors as ThemeColors, Spacing as ThemeSpacing, Typography as ThemeTypography } from '@/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { PurchaseModal } from '@/components/modals/PurchaseModal'; // Ensure path is correct

const Spacing = ThemeSpacing || {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
};
const Colors = ThemeColors || {
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',
  primary: '#2F66F6',
  surface: '#1A1A1A'
};
const Typography = ThemeTypography || {
  h1: { fontSize: 32, fontWeight: '700' },
  h2: { fontSize: 24, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' }
};

const Gradients = {
  background: ['#000000', '#121212'] as const,
  primaryGlow: ['rgba(47, 102, 246, 0.3)', 'rgba(47, 102, 246, 0.1)'] as const,
};

// 1. IMPORT REAL DATA (FeaturedPlans.json)
import featuredPlansData from '@/lib/data/featuredPlans.json';

export default function DashboardScreen() {
     const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
      const [isModalVisible, setModalVisible] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userName = 'Hrishique';
  const walletBalance = '124.32 USDC';
  const walletAddress = 'fba3f82B91A...D92C';

 const handleBuyPress = (plan: any) => {
    setSelectedPlan(plan);
    setModalVisible(true);
  };

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
  };

  // 2. GET FEATURED PLANS
  const featuredPlans = featuredPlansData || [];

  return (
    <LinearGradient
      colors={Gradients.background}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Hi {userName} 👋</Text>
          <Text style={styles.subGreeting}>Welcome to GeSIM</Text>
        </View>

        {/* Wallet Card */}
        <LinearGradient
          colors={Gradients.primaryGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.walletGlow}
        >
          <Pressable style={styles.walletCard}>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
            <Text style={styles.walletBalance}>{walletBalance}</Text>

            <View style={styles.walletFooter}>
              <Text style={styles.walletAddress}>{walletAddress}</Text>
              <Pressable onPress={handleCopyAddress}>
                <Text style={styles.copyIcon}>📋</Text>
              </Pressable>
            </View>
          </Pressable>
        </LinearGradient>

        {/* Active Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Plans</Text>

          <View style={styles.planCard}>
            <Text style={styles.planTitle}>Global eSIM</Text>
            <Text style={styles.planMeta}>
              3.2 GB left · Valid 12 days
            </Text>

            <View style={styles.progressTrack}>
              <LinearGradient
                colors={Gradients.progress || ['#22c55e', '#15803d']} // Fallback if Gradients.progress missing
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressFill}
              />
            </View>
          </View>
        </View>

        {/* Featured Plans - DYNAMIC SECTION */}
        <View style={styles.section}>
          {/* Header Row with "View All" Link */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Featured Plans</Text>
            <Pressable onPress={() => router.push('/(tabs)/plans')}>
              <Text style={styles.linkText}>View All Plans --&gt; </Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredPlans.map((plan) => {
              // Calculate Price
              const displayPrice = (plan.price / 10000).toFixed(2);

              // Calculate Volume (Bytes -> GB)
              const volumeGB = plan.volume ? (plan.volume / (1024 * 1024 * 1024)).toFixed(0) : '1';
              const dataAmount = volumeGB + ' GB';

              return (
                <View key={plan.packageCode} style={styles.featuredCard}>
                  {/* Title */}
                  <Text
                    style={styles.featuredTitle}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                  >
                    {plan.name}
                  </Text>

                  {/* Data Volume (Big & Bold) */}
                  <Text style={styles.featuredData}>
                    {dataAmount}
                  </Text>

                  {/* Meta (Duration) */}
                  <Text style={styles.featuredMeta}>
                    {plan.duration} {plan.durationUnit}s
                  </Text>

                  {/* Price Row */}
                    <View style={styles.priceRow}>
                                       <Text style={styles.featuredPrice}>${displayPrice}</Text>

                                       <Pressable
                                         style={styles.buyButton}
                                         // 3. UPDATE ONPRESS
                                         onPress={() => handleBuyPress(plan)}
                                       >
                                         <Text style={styles.buyButtonText}>Buy</Text>
                                       </Pressable>
                                     </View>
                                  </View>
                                );

            })}
          </ScrollView>
        </View>

        {/* Referral */}
        <View style={styles.referralCard}>
          <Text style={styles.referralTitle}>Invite & Earn</Text>
          <Text style={styles.referralText}>
            Share your referral link and earn credits
          </Text>

          <Pressable style={styles.referralButton}>
            <Text style={styles.referralButtonText}>
              Copy Referral Link
            </Text>
          </Pressable>
        </View>
      </ScrollView>
       <PurchaseModal
                visible={isModalVisible}
                plan={selectedPlan}
                onClose={() => setModalVisible(false)}
             />

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  /* Greeting */
  greeting: {
    marginBottom: Spacing.xl,
  },
  greetingText: {
    color: Colors.textPrimary,
    ...Typography.h2,
  },
  subGreeting: {
    color: Colors.textSecondary,
    ...Typography.body,
    marginTop: Spacing.xs,
  },
  /* Wallet */
  walletGlow: {
    borderRadius: 20,
    padding: 1,
    marginBottom: Spacing.xxl,
  },
  walletCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.md,
  },
  walletLabel: {
    color: Colors.textSecondary,
    ...Typography.caption,
  },
  walletBalance: {
    color: Colors.textPrimary,
    ...Typography.h1,
    marginTop: Spacing.sm,
  },
  walletFooter: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletAddress: {
    color: Colors.textMuted,
    ...Typography.caption,
  },
  copyIcon: {
    fontSize: 16,
  },
  /* Sections */
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    ...Typography.h2,
  },
  linkText: {
    color: Colors.primary || '#AB9FF2',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  /* Active Plan */
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.md,
  },
  planTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  planMeta: {
    color: Colors.textSecondary,
    ...Typography.body,
    marginTop: Spacing.xs,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    width: '60%',
    height: '100%',
  },
  /* Featured */
  featuredCard: {
    width: 155,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.md,
    marginRight: Spacing.sm,
  },
  featuredTitle: {
    color: Colors.textSecondary, // Subtle title
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  featuredData: {
    color: Colors.textPrimary, // Big & Bold Data
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  featuredMeta: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16, // Increased spacing for balance
  },
  featuredPrice: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  buyButton: {
     backgroundColor: '#2F66F6',
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderRadius: 8,
     alignSelf: 'flex-end',
     justifyContent: 'center',
     alignItems: 'center',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  /* Referral */
  referralCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.md,
  },
  referralTitle: {
    color: Colors.textPrimary,
    ...Typography.h2,
  },
  referralText: {
    color: Colors.textSecondary,
    ...Typography.body,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  referralButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
  },
  referralButtonText: {
    color: Colors.textPrimary,
    fontWeight: '500',
  },
});
