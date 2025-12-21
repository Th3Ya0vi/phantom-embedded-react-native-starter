
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';

import { Colors } from '../styles/colors';
import { Gradients } from '../styles/gradients';
import { Spacing } from '../styles/spacing';
import { Typography } from '../styles/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function DashboardScreen() {
  const router = useRouter(); // <--- 2. Initialize router
  const insets = useSafeAreaInsets();
  const userName = 'Hrishique';
  const walletBalance = '124.32 USDC';
  const walletAddress = '0x9A3f82B91A...D92C';

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
  };

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
                colors={Gradients.progress}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressFill}
              />
            </View>
          </View>
        </View>

        {/* Featured Plans - UPDATED SECTION */}
        <View style={styles.section}>
          {/* Header Row with "View All" Link */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Featured Plans</Text>
            <Pressable onPress={() => router.push('/(tabs)/plans')}>
              <Text style={styles.linkText}>View All Plans --> </Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Global 10GB', 'Europe 5GB', 'Asia 3GB','Australia 3GB','Africa 3GB'].map((plan) => (
              <View key={plan} style={styles.featuredCard}>
                <Text style={styles.featuredTitle}>{plan}</Text>
                <Text style={styles.featuredMeta}>30 days</Text>


                {/* --- CONTAINER FOR SIDE-BY-SIDE LAYOUT --- */}
              <View style={styles.priceRow}>
                <Text style={styles.featuredPrice}>$18</Text>

                <Pressable
                  style={styles.buyButton}
                  onPress={() => router.push('/(tabs)/plans')}
                >
                  <Text style={styles.buyButtonText}>Buy</Text>
                </Pressable>
              </View>

                {/* ----------------------------------------- */}


              </View>
            ))}
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
  // NEW STYLE: Flex row for Title + Link
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    ...Typography.h2,
    // marginBottom removed here because parent handles it
  },
  // NEW STYLE: The link text style
  linkText: {
    color: Colors.primary || '#AB9FF2', // Fallback color if variable missing
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
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.md,
    marginRight: Spacing.sm,
  },
  featuredTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  featuredMeta: {
    color: Colors.textSecondary,
    ...Typography.caption,
    marginTop: Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // 👈 pushes Buy to the right
    marginTop: 12,
  },

  featuredPrice: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },

  buyButton: {
     backgroundColor: '#2F66F6', // Use the specific blue hex here directly if not using the Colors variable
       // OR use: backgroundColor: Colors.primary,
       paddingHorizontal: 16,
       paddingVertical: 8,
       borderRadius: 8, // Slightly sharper corners look better with this blue
       alignSelf: 'flex-end',
       justifyContent: 'center',
       alignItems: 'center',
  },

  buyButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
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
