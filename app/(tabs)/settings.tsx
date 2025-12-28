import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Gradients } from '@/lib/theme';
import { useAuthActions } from '@/hooks/useAuthActions';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuthActions();
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleLogout = () => {
      Alert.alert(
        "Disconnect Wallet",
        "Are you sure you want to exit? This will end your session.",
        [
          { text: "Cancel", style: "cancel" },
          // The `onPress` correctly calls the function from the hook
          { text: "Disconnect", style: "destructive", onPress: logout },
        ]
      );
    };


  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>

        <View style={styles.header}>
          <Text style={styles.title}>System</Text>
          <Text style={styles.subtitle}>Configuration & Identity</Text>
        </View>

        {/* Profile Glass Card */}
        <BlurView intensity={20} tint="dark" style={styles.profileCard}>
          <LinearGradient colors={['#2F66F6', '#00E5FF']} style={styles.avatar}>
            <Text style={styles.avatarText}>H</Text>
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.profileName}>Hrishique</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Verified User</Text>
            </View>
          </View>
          <Pressable style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>
        </BlurView>

        {/* Settings Groups */}
        <SettingsGroup title="Preferences">
          <SettingsRow
            label="Dark Appearance"
            right={<Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ true: '#2F66F6' }} />}
          />
          <SettingsRow label="Default Currency" value="USDC" showChevron />
          <SettingsRow label="Language" value="English" showChevron />
        </SettingsGroup>

        <SettingsGroup title="Knowledge Base">
          <SettingsRow label="How it Works" showChevron />
          <SettingsRow label="Terms of Service" showChevron />
          <SettingsRow label="Privacy Policy" showChevron />
        </SettingsGroup>

        <SettingsGroup title="Security">
          <Pressable onPress={handleLogout}>
            <SettingsRow label="Disconnect Wallet" labelStyle={{ color: '#FF4B4B' }} icon="🔌" />
          </Pressable>
        </SettingsGroup>

        <Text style={styles.version}>GeSIM Protocol v1.0.42 • Built on Solana</Text>
      </ScrollView>
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
  header: { marginBottom: 32 },
  title: { color: '#FFF', ...Typography.h1 },
  subtitle: { color: '#94A3B8', ...Typography.body },

  /* Profile Card */
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  profileName: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  verifiedBadge: { backgroundColor: 'rgba(0, 229, 255, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
  verifiedText: { color: '#00E5FF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  editBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  editBtnText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },

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