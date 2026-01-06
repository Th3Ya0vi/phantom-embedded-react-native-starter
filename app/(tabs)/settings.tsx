import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Gradients } from '@/lib/theme';
import { usePrivy } from '@privy-io/expo';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useNotifications } from '@/lib/ui/NotificationContext';
import * as WebBrowser from 'expo-web-browser';
import { HowItWorksModal } from '@/components/modals/HowItWorksModal';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuthActions();
  const { showAlert } = useNotifications();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);

  const { user: privyUser } = usePrivy();

  const handleOpenTerms = () => WebBrowser.openBrowserAsync('https://www.gesim.xyz/terms');
  const handleOpenPrivacy = () => WebBrowser.openBrowserAsync('https://www.gesim.xyz/privacy');
  const handleOpenTelegram = () => WebBrowser.openBrowserAsync('https://t.me/Charchit_web3');
  const handleOpenMail = () => Linking.openURL('mailto:contact@gesim.xyz');

  const userName = (privyUser as any)?.email?.address?.split('@')[0] ||
    (privyUser as any)?.linked_accounts?.find((a: any) => a.type === 'google_oauth')?.name?.split(' ')[0] ||
    'Degen';

  const userInitial = userName[0].toUpperCase();

  const handleLogout = () => {
    showAlert({
      title: "Sign Out",
      message: "Are you sure you want to exit? This will end your session.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: logout },
      ]
    });
  };


  return (
    <LinearGradient colors={Gradients.background as any} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>System</Text>
            <Text style={styles.subtitle}>Configuration & Identity</Text>
          </View>
          <Pressable onPress={handleLogout} style={styles.headerLogoutBtn}>
            <Text style={styles.headerLogoutText}>Sign Out</Text>
          </Pressable>
        </View>

        {/* Profile Glass Card */}
        <BlurView intensity={20} tint="dark" style={styles.profileCard}>
          <LinearGradient colors={['#2F66F6', '#00E5FF']} style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.profileName}>{userName.toUpperCase()}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Verified User</Text>
            </View>
          </View>
          {/*}    <Pressable style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>*/}
        </BlurView>

        {/* Settings Groups */}
        <SettingsGroup title="Preferences">
          {/*} <SettingsRow
            label="Dark Appearance"
            right={<Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ true: '#2F66F6' }} />}
          /> */}
          <SettingsRow label="Default Currency" value="USDC" />
          <SettingsRow label="Language" value="English" />
        </SettingsGroup>

        <SettingsGroup title="Knowledge Base">
          <Pressable onPress={() => setHowItWorksVisible(true)}>
            <SettingsRow label="How it Works" showChevron />
          </Pressable>
          <Pressable onPress={handleOpenTerms}>
            <SettingsRow label="Terms of Service" showChevron />
          </Pressable>
          <Pressable onPress={handleOpenPrivacy}>
            <SettingsRow label="Privacy Policy" showChevron />
          </Pressable>
        </SettingsGroup>

        <SettingsGroup title="Support">
          <Pressable onPress={handleOpenMail}>
            <SettingsRow label="Mail us" value="contact@gesim.xyz" showChevron icon="📧" />
          </Pressable>
          <Pressable onPress={handleOpenTelegram}>
            <SettingsRow label="Chat with us" value="Telegram" showChevron icon="💬" />
          </Pressable>
        </SettingsGroup>

        <Text style={styles.version}>GeSIM Protocol v1.0.42 • Built on Solana</Text>
      </ScrollView>

      <HowItWorksModal
        visible={howItWorksVisible}
        onClose={() => setHowItWorksVisible(false)}
      />
    </LinearGradient>
  );
}

// Sub-components for Settings
const SettingsGroup = ({ title, children }: any) => (
  <View style={styles.groupContainer}>
    <Text style={styles.groupTitle}>{title}</Text>
    <BlurView intensity={10} tint="dark" style={styles.groupCard}>
      {children}
    </BlurView>
  </View>
);

const SettingsRow = ({ label, value, right, showChevron, labelStyle, icon }: any) => (
  <View style={styles.row}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {icon && <Text style={{ marginRight: 12 }}>{icon}</Text>}
      <Text style={[styles.rowLabel, labelStyle]}>{label}</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {right && right}
      {showChevron && <Text style={styles.chevron}>›</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32
  },
  headerLogoutBtn: {
    backgroundColor: 'rgba(255, 75, 75, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.3)',
  },
  headerLogoutText: {
    color: '#FF4B4B',
    fontSize: 13,
    fontWeight: '700',
  },
  title: { ...Typography.h1, marginBottom: 8 },
  subtitle: { ...Typography.body },

  /* Profile Card */
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  profileName: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  verifiedBadge: { backgroundColor: 'rgba(0, 229, 255, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
  verifiedText: { color: '#00E5FF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  editBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  editBtnText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },

  /* Grouping */
  groupContainer: { marginBottom: 24 },
  groupTitle: { color: '#475569', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginLeft: 8 },
  groupCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  rowLabel: { color: '#E2E8F0', fontSize: 15, fontWeight: '500' },
  rowValue: { color: '#64748B', fontSize: 14, marginRight: 8 },
  chevron: { color: '#334155', fontSize: 20, fontWeight: '300' },
  version: { textAlign: 'center', color: '#1E293B', fontSize: 11, fontWeight: '600', marginTop: 20 }
});