import React from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Spacing } from '@/lib/theme';
import type { PurchaseStatus } from '@/hooks/useEsimPurchase';

interface ProcessingModalProps {
  status: PurchaseStatus;
}

const statusMessages: Record<PurchaseStatus, string> = {
  idle: 'Initializing...',
  ordering: 'Securing your connection...',
  provisioning: 'Provisioning your digital SIM...',
  success: 'Connection Ready',
  error: 'Action Required',
};

export function ProcessingModal({ status }: ProcessingModalProps) {
  const isVisible = status === 'ordering' || status === 'provisioning';

  return (
    <Modal animationType="fade" transparent={true} visible={isVisible}>
      <View style={styles.overlay}>
        {/* Full screen blur for a soothing focus effect */}
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={styles.card}>
          <View style={styles.loaderContainer}>
             <ActivityIndicator size="large" color="#00E5FF" />
          </View>
          <Text style={styles.title}>{statusMessages[status]}</Text>
          <Text style={styles.subtitle}>
            {status === 'provisioning' ? "Setting up your global network access. This usually takes 15-30 seconds." : "Preparing your order details..."}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)', // Deep Slate with opacity
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loaderContainer: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  text: { color: '#FFF', fontSize: 16, fontWeight: '500', marginTop: Spacing.md, textAlign: 'center' },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  }
});
