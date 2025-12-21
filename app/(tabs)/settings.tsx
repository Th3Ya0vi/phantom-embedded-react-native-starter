import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { Colors } from '../styles/colors';
import { Gradients } from '../styles/gradients';
import { Spacing } from '../styles/spacing';
import { Typography } from '../styles/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
      const insets = useSafeAreaInsets();
  const userName = 'Hrishique';
  const referralCode = 'GSM82K9';
  const totalReferrals = 24;
  const successfulReferrals = 17;

  const copyReferralCode = async () => {
    await Clipboard.setStringAsync(referralCode);
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
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Update your profile</Text>
              </View>

        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {/* Replace later with real image */}
            <Text style={styles.avatarText}>
              {userName.charAt(0)}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Pressable>
              <Text style={styles.editProfile}>Edit Profile</Text>
            </Pressable>
          </View>
        </View>

        {/* Referral Card */}
        <View style={styles.referralCard}>
          <Text style={styles.sectionTitle}>Referrals</Text>

          <View style={styles.referralStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalReferrals}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>

            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {successfulReferrals}
              </Text>
              <Text style={styles.statLabel}>Successful</Text>
            </View>
          </View>

          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <Pressable onPress={copyReferralCode}>
              <Text style={styles.copyText}>Copy</Text>
            </Pressable>
          </View>
        </View>

        {/* Links */}
        <View style={styles.linksSection}>
          <Pressable style={styles.linkRow}>
            <Text style={styles.linkText}>FAQs</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable style={styles.linkRow}>
            <Text style={styles.linkText}>Terms & Conditions</Text>
            <Text style={styles.chevron}>›</Text>
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

  /* Profile */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
  },
  profileInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  profileName: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  editProfile: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: Spacing.xs,
  },

  /* Referral */
  referralCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    ...Typography.h2,
    marginBottom: Spacing.md,
  },
  referralStats: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  stat: {
    flex: 1,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  codeRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  codeText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
  },
  copyText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },

  /* Links */
  linksSection: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  linkText: {
    color: Colors.textPrimary,
    fontSize: 14,
  },
  chevron: {
    color: Colors.textMuted,
    fontSize: 18,
  },
});
