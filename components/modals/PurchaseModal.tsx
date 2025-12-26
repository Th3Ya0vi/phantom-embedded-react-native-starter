import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Spacing } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { useEsimPurchase } from '@/hooks/useEsimPurchase';
import { ProcessingModal } from './ProcessingModal';
import { ActivationModal } from './ActivationModal';


// Define the shape of the Plan object
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

export function PurchaseModal({ visible, onClose, plan }: PurchaseModalProps) {
  const insets = useSafeAreaInsets();
  const { status, errorMessage, profile, purchaseEsim ,resetStatus} = useEsimPurchase();

    //  Handle Payment Click
  const handlePayment = () => {
    console.log("[UI] 'Pay Now' button clicked.");
    if (plan) {
      purchaseEsim(plan);
    } else {
      console.error("[UI] Error: No plan data found in PurchaseModal.");
    }
  };

  // Animation Value
  const rotation = useSharedValue(0);

  // Start animation when modal opens
  useEffect(() => {
    if (visible) {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 3000, // Slowed down to 3000ms for a more soothing effect
          easing: Easing.linear,
        }),
        -1 // Infinite repeat
      );
    }
  }, [visible]);

  // Animated Style for the rotating gradient background
  const animatedGradientStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      onClose(); // Hide the "Plan Summary" modal
      if (status === 'error' && errorMessage) {
        alert(errorMessage);
      }
    }
  }, [status]);

  if (!plan) return null;

  // Calculations
  const displayPrice = (plan.price / 10000).toFixed(2);
  const volumeGB = plan.volume ? (plan.volume / (1024 * 1024 * 1024)).toFixed(0) : '1';


  return (
      <>
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <BlurView intensity={80} tint="dark" style={[styles.modalContent, { paddingBottom: 0 }]}>

          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planRegion}>Global Coverage</Text>
            </View>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>${displayPrice}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <DetailItem label="Data" value={`${volumeGB} GB`} icon="📊" />
            <DetailItem label="Validity" value={`${plan.duration} Days`} icon="⏳" />
            <DetailItem label="Speed" value={plan.speed} icon="🚀" />
            <DetailItem label="Type" value="eSIM" icon="📲" />
          </View>

          {/* Payment Summary */}
          <View style={styles.summaryContainer}>
             <View style={styles.row}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${displayPrice}</Text>
             </View>
             <View style={styles.row}>
                <Text style={styles.summaryLabel}>Fees</Text>
                <Text style={styles.summaryValue}>$0.00</Text>
             </View>
             <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${displayPrice}</Text>
             </View>
          </View>

          {/* --- ANIMATED PAY BUTTON --- */}
          <Pressable onPress={handlePayment} style={styles.payButtonContainer}>

            {/* 1. The Rotating Gradient Layer (The Border) */}
            <View style={styles.animatedBorderContainer}>
               <Animated.View style={[styles.rotatingGradient, animatedGradientStyle]}>
                 <LinearGradient
                    // UPDATED COLORS:
                    // Blue -> Sky Blue -> Cyan -> Blue
                    // This creates a soothing "energy flow" that matches your button
                    colors={['#00E5FF', '#2979FF', '#00E5FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 2, y: 2}}
                    style={{ flex: 1 }}
                 />
               </Animated.View>
            </View>

            {/* 2. The Inner Content Layer (The actual button look) */}
            <View style={styles.payButtonContent}>
               <Text style={styles.payButtonText}>Pay Now</Text>
            </View>
          </Pressable>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>

          {/* Spacer for bottom safe area */}
          <View style={{ height: insets.bottom + 10, backgroundColor: 'transparent' }} />

        </BlurView>
      </View>
    </Modal>
     <ProcessingModal status={status} />

         <ActivationModal
                visible={status === 'success'}
                profile={profile}
                onClose={() => {
                   // Reset app or go to Dashboard
                   resetStatus();
                   onClose();
                }}
              />
            </>
  );
}

// Helper Component for Grid Items
const DetailItem = ({ label, value, icon }: { label: string, value: string, icon: string }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailIcon}>{icon}</Text>
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 0,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  planName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
  },
  planRegion: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 2,
  },
  priceTag: {
    backgroundColor: 'rgba(47, 102, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(47, 102, 246, 0.3)',
  },
  priceText: {
    color: '#2F66F6',
    fontSize: 20,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: Spacing.md,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  detailItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  detailLabel: {
    color: '#888',
    fontSize: 12,
  },
  detailValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 16,
    borderRadius: 16,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginBottom: 0,
  },
  summaryLabel: { color: '#AAA', fontSize: 14 },
  summaryValue: { color: '#FFF', fontSize: 14 },
  totalLabel: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  totalValue: { color: '#2F66F6', fontSize: 18, fontWeight: '700' },

  /* --- ANIMATED BUTTON STYLES --- */
  payButtonContainer: {
    position: 'relative',
    height: 56,
    borderRadius: 16,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  animatedBorderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotatingGradient: {
    width: '200%',
    height: '400%',
  },
  payButtonContent: {
    width: '98.5%',
    height: '92%',
    backgroundColor: '#1E3A8A',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  /* ---------------------------------- */

  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  }
});
