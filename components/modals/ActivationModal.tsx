import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { BlurView } from 'expo-blur';
import { Spacing } from '@/lib/theme';
import type { EsimProfile } from '@/hooks/useEsimPurchase';

interface ActivationModalProps {
  visible: boolean;
  onClose: () => void;
  profile: EsimProfile | null;
}

export function ActivationModal({ visible, onClose, profile }: ActivationModalProps) {
  if (!profile) return null;
  const activationCode = profile?.ac || "";
  const iccid = profile?.iccid || "Not Available";


  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Activation code saved to clipboard.');
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={styles.container}>
          <View style={styles.successBadge}>
            <Text style={styles.successIcon}>✓</Text>
          </View>

          <Text style={styles.title}>Ready for Departure</Text>
          <Text style={styles.subtitle}>Your eSIM has been provisioned. Scan the QR code to activate your data.</Text>

          <View style={styles.qrWrapper}>
            <View style={styles.qrGlow} />
            <View style={styles.qrBackground}>

                {activationCode ? (
                  <QRCode value={activationCode} size={180} />
                ) : (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>QR Code not available.</Text>
                  </View>
                )}
              </View>
          </View>

          <View style={styles.manualBox}>
            <View>
              <Text style={styles.manualLabel}>Activation Code (LPA)</Text>
              <Text style={styles.manualValue} numberOfLines={1}>{profile.ac.substring(0, 30)}...</Text>
            </View>
            <Pressable style={styles.copyBtn} onPress={() => copyToClipboard(profile.ac)}>
              <Text style={styles.copyBtnText}>Copy</Text>
            </Pressable>
          </View>

          <Pressable style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneText}>CLose</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 32,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1E3A8A', // Deep Blue Border
    shadowColor: "#2F66F6",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  successBadge: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#00C853',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16, marginTop: -45,
    borderWidth: 4, borderColor: '#0F172A'
  },
  successIcon: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  title: { color: '#FFF', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: '#94A3B8', textAlign: 'center', marginBottom: 30, fontSize: 14, lineHeight: 20 },
  qrWrapper: { position: 'relative', marginBottom: 30 },
  qrGlow: {
    position: 'absolute', top: -10, left: -10, right: -10, bottom: -10,
    backgroundColor: '#2F66F6', opacity: 0.15, borderRadius: 20, blurRadius: 20
  },
  qrBackground: { backgroundColor: '#FFF', padding: 12, borderRadius: 16 },
  manualBox: {
    width: '100%', backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: 16,
    borderRadius: 16, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  manualLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  manualValue: { color: '#FFF', fontSize: 13, fontFamily: 'monospace', width: '75%' },
  copyBtn: { backgroundColor: 'rgba(47, 102, 246, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  copyBtnText: { color: '#2F66F6', fontWeight: '700', fontSize: 12 },
  doneButton: { backgroundColor: '#2F66F6', width: '100%', padding: 18, borderRadius: 16, alignItems: 'center' },
  doneText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});