import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions, Platform } from 'react-native';
import { useNotifications } from '@/lib/ui/NotificationContext';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing } from '@/lib/theme';
import type { EsimProfile } from '@/hooks/useEsimPurchase';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ActivationModalProps {
  visible: boolean;
  onClose: () => void;
  profile: EsimProfile | null;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export function ActivationModal({ visible, onClose, profile }: ActivationModalProps) {
  const { showAlert } = useNotifications();
  const [showConfetti, setShowConfetti] = useState(false);

  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      modalScale.value = withSpring(1, { damping: 12 });
      modalOpacity.value = withTiming(1, { duration: 400 });
      // Delay confetti for a better impact
      const timer = setTimeout(() => setShowConfetti(true), 600);
      return () => clearTimeout(timer);
    } else {
      modalScale.value = withTiming(0.9);
      modalOpacity.value = withTiming(0);
      setShowConfetti(false);
    }
  }, [visible]);

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  if (!profile && !visible) return null;

  // Provide defaults if profile is null but modal is visible (during closing animation)
  const activationCode = profile?.ac || "";

  const copyToClipboard = async (text: string) => {
    if (!activationCode) return;
    await Clipboard.setStringAsync(activationCode);
    showAlert({ title: 'Copied', message: 'Activation code saved to clipboard.' });
  };

  return (
    <Modal animationType="none" transparent={true} visible={visible}>
      <View style={styles.overlay}>
        <BlurView intensity={Platform.OS === 'ios' ? 60 : 40} tint="dark" style={StyleSheet.absoluteFill} />

        <Animated.View style={[styles.containerWrapper, modalStyle]}>
          <LinearGradient
            colors={['rgba(30, 41, 59, 0.98)', 'rgba(15, 23, 42, 1.0)']}
            style={styles.container}
          >
            {/* Top Shine */}
            <LinearGradient
              colors={['rgba(0, 229, 255, 0.15)', 'transparent']}
              style={styles.topShine}
            />

            <Animated.View entering={ZoomIn.delay(300)} style={styles.successBadge}>
              <LinearGradient
                colors={['#00E5FF', '#2F66F6']}
                style={styles.badgeGradient}
              >
                <Text style={styles.successIcon}>✓</Text>
              </LinearGradient>
            </Animated.View>

            <Animated.Text entering={FadeInDown.delay(400)} style={styles.title}>
              Plan Activated! 🚀
            </Animated.Text>

            <Animated.Text entering={FadeInDown.delay(500)} style={styles.subtitle}>
              Your data is ready to soar. Scan the QR or use the manual code below.
            </Animated.Text>

            <Animated.View entering={ZoomIn.delay(600)} style={styles.qrWrapper}>
              {/* Animated Glow behind QR */}
              <LinearGradient
                colors={['#2F66F6', '#00E5FF']}
                style={styles.qrOuterGlow}
              />
              <View style={styles.qrBackground}>
                {activationCode ? (
                  <QRCode value={activationCode} size={180} />
                ) : (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>QR Code generation failed.</Text>
                  </View>
                )}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(700)} style={styles.manualBox}>
              <View style={styles.manualInfo}>
                <Text style={styles.manualLabel}>Activation Code (LPA)</Text>
                <Text style={styles.manualValue} numberOfLines={1}>
                  {activationCode.substring(0, 30)}...
                </Text>
              </View>
              <Pressable
                style={styles.copyBtn}
                onPress={() => copyToClipboard(activationCode)}
              >
                <LinearGradient
                  colors={['rgba(47, 102, 246, 0.2)', 'rgba(47, 102, 246, 0.1)']}
                  style={styles.copyGradient}
                >
                  <Text style={styles.copyBtnText}>Copy</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(800)} style={{ width: '100%' }}>
              <Pressable style={styles.doneButton} onPress={onClose}>
                <LinearGradient
                  colors={['#2F66F6', '#1E3A8A']}
                  style={styles.doneGradient}
                >
                  <Text style={styles.doneText}>START SURFING</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </LinearGradient>
        </Animated.View>

        {showConfetti && (
          <ConfettiCannon
            count={80}
            origin={{ x: width / 2, y: height / 2 }}
            autoStart={true}
            fadeOut={true}
            fallSpeed={2500}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  containerWrapper: {
    width: '100%',
    shadowColor: '#2F66F6',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  container: {
    borderRadius: 40,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  topShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 20,
    marginTop: -48, // Floating effect
    padding: 3,
    backgroundColor: '#0F172A',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  badgeGradient: {
    flex: 1,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900'
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 10
  },
  qrWrapper: {
    position: 'relative',
    marginBottom: 32,
    padding: 15,
  },
  qrOuterGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
    borderRadius: 28,
  },
  qrBackground: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  errorContainer: { padding: 40, alignItems: 'center' },
  errorText: { color: '#FF4B4B', fontSize: 14, fontWeight: '600' },
  manualBox: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: 16,
    borderRadius: 20,
    marginBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  manualInfo: {
    flex: 1,
  },
  manualLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 1
  },
  manualValue: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 12,
  },
  copyGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  copyBtnText: {
    color: '#00E5FF',
    fontWeight: '900',
    fontSize: 13,
    textTransform: 'uppercase'
  },
  doneButton: {
    width: '100%',
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2F66F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  doneGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 2
  },
});