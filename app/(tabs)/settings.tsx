import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  Linking
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Make sure to use the imports that match your theme file structure
import { Colors as ThemeColors, Spacing as ThemeSpacing, Typography as ThemeTypography } from '@/lib/theme';
import { useSession } from '@/lib/session/SessionContext';

// Fallbacks to prevent crashes if theme isn't fully loaded
const Colors = ThemeColors || {
  background: '#000', surface: '#1A1A1A', textPrimary: '#FFF', textSecondary: '#AAA', border: '#333', primary: '#2F66F6', error: '#ff4b4b'
};
const Spacing = ThemeSpacing || { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const Typography = ThemeTypography || { h1: { fontSize: 32 }, h2: { fontSize: 24 }, body: { fontSize: 16 } };

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useSession(); // Access logout function

  // State
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to true since app is dark theme
  const userName = 'Hrishique';
  const referralCode = 'GSM82K9';
  const totalReferrals = 24;
  const successfulReferrals = 17;

  const copyReferralCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    Alert.alert('Copied', 'Referral code copied to clipboard!');
  };

  const handleLogout = () => {
    Alert.alert(
      "Disconnect Wallet",
      "Are you sure you want to disconnect?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace('/'); // Redirect to login
          }
        }
      ]
    );
  };

  const openLink = (url: string) => {
    // In a real app, use Linking.openURL(url) or router.push() to a webview
    console.log(`Opening ${url}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account & preferences</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.walletTag}>Phantom Connected</Text>
          </View>
          <Pressable style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>

        {/* --- SECTION: PREFERENCES --- */}
        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.cardGroup}>

          {/* Theme Toggle */}
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Dark Mode</Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: Colors.primary || '#2F66F6' }}
              thumbColor={'#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => setIsDarkMode(prev => !prev)}
              value={isDarkMode}
            />
          </View>

          {/* Currency (Future Idea) */}
          <Pressable style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowTitle}>Currency</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>USDC</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>
        </View>

        {/* --- SECTION: REFERRALS --- */}
        <View style={styles.referralCard}>
          <Text style={styles.cardTitle}>Refer & Earn</Text>
          <View style={styles.referralStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{totalReferrals}</Text>
              <Text style={styles.statLabel}>Invites</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{successfulReferrals}</Text>
              <Text style={styles.statLabel}>Successful</Text>
            </View>
          </View>
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Your Code:</Text>
            <Pressable style={styles.codeBox} onPress={copyReferralCode}>
              <Text style={styles.codeText}>{referralCode}</Text>
              <Text style={styles.copyText}>COPY</Text>
            </Pressable>
          </View>
        </View>

        {/* --- SECTION: SUPPORT & LEGAL --- */}
        <Text style={styles.sectionHeader}>Support</Text>
        <View style={styles.cardGroup}>

          <Pressable style={styles.rowItem} onPress={() => openLink('usage-flow')}>
            <Text style={styles.rowTitle}>How it Works (Usage Flow)</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable style={styles.rowItem} onPress={() => openLink('help')}>
            <Text style={styles.rowTitle}>Help Center & FAQs</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable style={styles.rowItem} onPress={() => openLink('terms')}>
            <Text style={styles.rowTitle}>Terms of Use</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

           <Pressable style={[styles.rowItem, { borderBottomWidth: 0 }]} onPress={() => openLink('privacy')}>
            <Text style={styles.rowTitle}>Privacy Policy</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* --- SECTION: DANGER ZONE --- */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Disconnect Wallet</Text>
        </Pressable>

        <Text style={styles.versionText}>GeSIM v1.0.2</Text>

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
    marginBottom: Spacing.lg,
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

  /* Profile Card */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(47, 102, 246, 0.2)', // Light blue bg
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.primary || '#2F66F6',
    fontSize: 20,
    fontWeight: '700',
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
  walletTag: {
    color: Colors.success || '#22c55e',
    fontSize: 12,
    marginTop: 2,
  },
  editButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editButtonText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },

  /* Section Headers */
  sectionHeader: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },

  /* Card Group (for lists) */
  cardGroup: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginRight: 8,
  },
  chevron: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '400',
  },

  /* Referral Card */
  referralCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(47, 102, 246, 0.2)', // Subtle blue border
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  referralStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  statSeparator: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  codeContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },
  copyText: {
    color: Colors.primary || '#2F66F6',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Logout */
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 75, 75, 0.1)', // Subtle red bg
    borderRadius: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.2)',
  },
  logoutText: {
    color: Colors.error || '#ff4b4b',
    fontWeight: '600',
    fontSize: 15,
  },
  versionText: {
    textAlign: 'center',
    color: Colors.textMuted || '#666',
    fontSize: 12,
    marginBottom: Spacing.lg,
  },
});
