import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Spacing } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { useAccounts, AddressType } from '@phantom/react-native-sdk';

import { useApiActions } from '@/hooks/useApiActions';
import { useSession } from '@/lib/session/SessionContext';
import { ActivationModal } from './ActivationModal';

// --- TYPE DEFINITIONS ---
interface Plan {
  packageCode: string;
  name: string;
  price: number;
  volume: number;
  duration: number;
  durationUnit: string;
  speed: string;
}

interface PurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  plan: Plan | null;
}

// --- SUB-COMPONENT FOR CHECKLIST ---
const ChecklistItem = ({ label, status }: { label: string, status: 'pending' | 'in-progress' | 'done' }) => {
    const opacity = useSharedValue(1);

    useEffect(() => {
      if (status === 'in-progress') {
        opacity.value = withRepeat(
          withSequence(withTiming(0.6, { duration: 700 }), withTiming(1, { duration: 700 })),
          -1,
          true
        );
      } else {
        opacity.value = withTiming(1);
      }
    }, [status]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: status === 'in-progress' ? opacity.value : 1,
    }));

    return (
      <Animated.View style={[styles.checklistItem, animatedStyle]}>
        <Text style={[styles.checklistIcon, status === 'done' && styles.checklistDoneIcon]}>
          {status === 'done' ? '✓' : '●'}
        </Text>
        <Text style={[styles.checklistLabel, status === 'pending' && styles.checklistPendingLabel, status === 'done' && styles.checklistDoneLabel]}>
          {label}
        </Text>
      </Animated.View>
    );
};

export function PurchaseModal({ visible, onClose, plan }: PurchaseModalProps) {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { processEsimPurchase, getWalletBalance } = useApiActions();
  const { addresses } = useAccounts();

  // --- STATE ---
  const [purchaseStep, setPurchaseStep] = useState<'IDLE' | 'PAYING' | 'LOGGING' | 'PROVISIONING' | 'SUCCESS'>('IDLE');
  const [provisionedProfile, setProvisionedProfile] = useState<any>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(true);
  const [walletData, setWalletData] = useState({ solBalance: 0, usdcBalance: 0, solValueUsd: 0 });

  const rotation = useSharedValue(0);

  // --- FETCH BALANCES ---
  useEffect(() => {
    const loadBalances = async () => {
      if (visible && addresses) {
        setIsFetchingBalance(true);
        const solAccount = addresses.find(a => a.addressType === AddressType.solana);
        if (solAccount) {
          const data = await getWalletBalance(solAccount.address);
          setWalletData({
            solBalance: data.solBalance || 0,
            usdcBalance: data.usdcBalance || 0,
            solValueUsd: data.solValue || 0
          });
        }
        setIsFetchingBalance(false);
      }
    };

    if (visible) {
      rotation.value = withRepeat(withTiming(360, { duration: 3000, easing: Easing.linear }), -1);
      setPurchaseStep('IDLE');
      loadBalances();
    }
  }, [visible, addresses]);

  // --- VALIDATION LOGIC ---
  const planPriceUsdc = useMemo(() => (plan ? plan.price / 10000 : 0), [plan]);
  const hasEnoughSol = walletData.solValueUsd >= 0.25;
  const hasEnoughUsdc = walletData.usdcBalance >= planPriceUsdc;
  const canProceed = hasEnoughSol && hasEnoughUsdc;

  const animatedGradientStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  const handlePayment = async () => {
    if (!plan || !user?.id || !canProceed) return;
    try {
      const response = await processEsimPurchase(plan, user.id, (stage) => {
        setPurchaseStep(stage);
      });
      if (response) {
        const allocatedProfile = response?.data?.obj?.esimList?.[0];
        if (allocatedProfile) {
          setProvisionedProfile(allocatedProfile);
        } else {
          throw new Error("Your eSIM is being prepared but the QR code is not ready yet.");
        }
      }
    } catch (error: any) {
      setPurchaseStep('IDLE');
      Alert.alert("Purchase Failed", error.message || "An unexpected error occurred.");
    }
  };

  if (!plan) return null;

  const isProcessing = purchaseStep !== 'IDLE';
  const volumeGB = plan.volume ? (plan.volume / (1024 ** 3)).toFixed(0) : '1';

  return (
    <>
      <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={!isProcessing ? onClose : undefined} />
          <BlurView intensity={90} tint="dark" style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.handleBar} />

            {isProcessing ? (
               /* --- 1. PROCESSING VIEW (CHECKLIST) --- */
               <View style={styles.processingContainer}>
                 <View style={styles.statusHeader}>
                    <View style={styles.processingBadge}>
                        <Text style={styles.tickIcon}>⚙️</Text>
                    </View>
                 </View>
                 <Text style={styles.processingTitle}>Finalizing Your Plan</Text>

                 <View style={styles.checklistContainer}>
                   <ChecklistItem
                     label="Processing Payment"
                     status={purchaseStep === 'PAYING' ? 'in-progress' : 'done'}
                   />
                   <ChecklistItem
                     label="Verifying Transaction"
                     status={purchaseStep === 'PAYING' ? 'pending' : (purchaseStep === 'LOGGING' ? 'in-progress' : 'done')}
                   />
                   <ChecklistItem
                     label="Allocating eSIM Profile"
                     status={purchaseStep === 'PROVISIONING' ? 'in-progress' : (['PAYING', 'LOGGING'].includes(purchaseStep) ? 'pending' : 'done')}
                   />
                 </View>

                 {purchaseStep === 'SUCCESS' && (
                   <Pressable style={styles.doneButton} onPress={() => { onClose(); setPurchaseStep('IDLE'); }}>
                     <Text style={styles.doneButtonText}>VIEW ESIM</Text>
                   </Pressable>
                 )}
               </View>
            ) : (
              /* --- 2. IDLE VIEW (DETAILS & BALANCES) --- */
              <>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planRegion}>Global Coverage</Text>
                    </View>
                    <View style={styles.priceTag}>
                        <Text style={styles.priceText}>${planPriceUsdc.toFixed(2)}</Text>
                    </View>
                </View>

                {/* --- WALLET BALANCE SECTION --- */}
                <View style={styles.balanceSummary}>
                    <Text style={styles.balanceLabel}>Your Balance</Text>
                    <View style={styles.balanceRow}>
                        <Text style={[styles.balanceValue, !hasEnoughUsdc && { color: '#FF4B4B' }]}>
                            {walletData.usdcBalance.toFixed(2)} USDC
                        </Text>
                        <View style={styles.balanceDivider} />
                        <Text style={[styles.balanceValue, !hasEnoughSol && { color: '#FF4B4B' }]}>
                            {walletData.solBalance.toFixed(4)} SOL (${walletData.solValueUsd.toFixed(2)})
                        </Text>
                    </View>
                </View>

                {/* --- WARNING UI --- */}
                {!canProceed && !isFetchingBalance && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>⚠️ Action Required</Text>
                    {!hasEnoughUsdc && (
                        <Text style={styles.warningText}>• Add more USDC to cover the plan cost.</Text>
                    )}
                    {!hasEnoughSol && (
                        <Text style={styles.warningText}>• Add at least $1.00 in SOL to cover Network Gas Fees.</Text>
                    )}
                  </View>
                )}

                <View style={styles.detailsGrid}>
                    <DetailItem label="Data" value={`${volumeGB} GB`} icon="📊" />
                    <DetailItem label="Validity" value={`${plan.duration} Days`} icon="⏳" />
                </View>

                {/* --- ACTION BUTTON --- */}
                <Pressable
                  onPress={handlePayment}
                  disabled={!canProceed || isFetchingBalance}
                  style={[styles.payButtonContainer, (!canProceed || isFetchingBalance) && styles.disabledButton]}
                >
                  {/* 1. ANIMATED BORDER / BACKGROUND LAYER */}
                  <View style={styles.animatedBorderContainer}>
                    {canProceed && !isFetchingBalance && (
                      <Animated.View style={[styles.rotatingGradient, animatedGradientStyle]}>
                        {/* Updated colors to match Data Plans theme */}
                        <LinearGradient
                          colors={['#2F66F6', '#00E5FF', '#2F66F6']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ flex: 1 }}
                        />
                      </Animated.View>
                    )}
                  </View>

                  {/* 2. BUTTON CONTENT LAYER */}
                  <View style={[
                    styles.payButtonContent,
                    !canProceed && { backgroundColor: '#1E293B' },
                    canProceed && { backgroundColor: 'transparent' } // Allows the gradient to show through
                  ]}>
                    {canProceed && !isFetchingBalance && (
                      <LinearGradient
                        colors={['#2F66F6', '#00E5FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                    )}

                    {isFetchingBalance ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={[
                        styles.payButtonText,
                        !canProceed && { color: '#64748B' },
                        canProceed && { color: '#FFFFFF', fontWeight: '900' }
                      ]}>
                        {canProceed ? 'PAY NOW  →' : 'INSUFFICIENT FUNDS'}
                      </Text>
                    )}
                  </View>
                </Pressable>

                <Pressable onPress={onClose} style={styles.cancelButton}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </>
            )}
          </BlurView>
        </View>
      </Modal>

      <ActivationModal
        visible={purchaseStep === 'SUCCESS'}
        profile={provisionedProfile}
        onClose={() => { setPurchaseStep('IDLE'); onClose(); }}
      />
    </>
  );
}

const DetailItem = ({ label, value, icon }: any) => (
    <View style={styles.detailItem}>
        <Text style={styles.detailIcon}>{icon}</Text>
        <View>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { backgroundColor: '#0F172A', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: Spacing.lg, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' ,overflow: 'hidden',},
  handleBar: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },

  // Checklist Styles
  processingContainer: { paddingVertical: 40, alignItems: 'center' },
  statusHeader: { marginBottom: 24, height: 80, justifyContent: 'center' },
  processingBadge: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(47, 102, 246, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#2F66F6' },
  tickIcon: { fontSize: 40 },
  processingTitle: { color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 32 },
  checklistContainer: { width: '100%', padding: 20, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, gap: 16 },
  checklistItem: { flexDirection: 'row', alignItems: 'center' },
  checklistIcon: { fontSize: 18, color: '#00E5FF', marginRight: 12, width: 24 },
  checklistDoneIcon: { color: '#22C55E' },
  checklistLabel: { fontSize: 16, color: '#FFF', fontWeight: '600' },
  checklistPendingLabel: { color: '#475569' },
  checklistDoneLabel: { color: '#94A3B8', textDecorationLine: 'line-through' },
  doneButton: { marginTop: 32, backgroundColor: '#2F66F6', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 20 },
  doneButtonText: { color: '#FFF', fontWeight: '800', letterSpacing: 1 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  planName: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  planRegion: { color: '#64748B', fontSize: 13 },
  priceTag: { backgroundColor: 'rgba(0, 229, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  priceText: { color: '#00E5FF', fontSize: 18, fontWeight: '800' },

  balanceSummary: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  balanceLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceValue: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  balanceDivider: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 12 },

  warningBox: { backgroundColor: 'rgba(255, 75, 75, 0.1)', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 75, 75, 0.3)' },
  warningTitle: { color: '#FF4B4B', fontWeight: '800', fontSize: 14, marginBottom: 6 },
  warningText: { color: '#FF9494', fontSize: 12, fontWeight: '500', marginBottom: 4 },

  detailsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  detailItem: { width: '48%', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 16 },
  detailIcon: { fontSize: 18, marginRight: 10 },
  detailLabel: { color: '#64748B', fontSize: 10, fontWeight: '600' },
  detailValue: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  payButtonContainer: { position: 'relative', height: 60, borderRadius: 20, marginBottom: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  disabledButton: { opacity: 0.8 },
  animatedBorderContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  rotatingGradient: { width: '150%', height: '150%' },
  payButtonContent: {
    width: '98%',
    height: '92%',
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    overflow: 'hidden', // Required for the internal LinearGradient
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5, // Matches the premium look
    textTransform: 'uppercase', // Matches Data Plans style
  },
  cancelButton: { paddingVertical: 12, alignItems: 'center' },
  cancelText: {
      color: '#94A3B8', // ✅ FIX: A much lighter, more visible Slate/Grey color
      fontSize: 14,
      fontWeight: '700', // Bolder to improve readability
      letterSpacing: 0.5,
    },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 }
});