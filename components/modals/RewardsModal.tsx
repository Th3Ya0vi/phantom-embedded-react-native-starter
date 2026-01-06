// components/modals/RewardsModal.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  EntryAnimationsValues,
  FadeInUp,
  ZoomIn,
  SlideInDown
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width, height } = Dimensions.get('window');

export interface RewardActivity {
  id: string;
  title: string;
  points: number;
}

interface RewardsModalProps {
  visible: boolean;
  onClose: () => void;
  totalCoins: number;
  activities: RewardActivity[];
}

export function RewardsModal({ visible, onClose, totalCoins, activities }: RewardsModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [displayCoins, setDisplayCoins] = useState(0);

  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      modalScale.value = withSpring(1, { damping: 15 });
      modalOpacity.value = withTiming(1, { duration: 300 });

      // Counting animation for coins
      let start = 0;
      const end = totalCoins;
      const duration = 1500;

      const timer = setInterval(() => {
        start += Math.ceil(end / 60);
        if (start >= end) {
          setDisplayCoins(end);
          clearInterval(timer);
          setShowConfetti(true); // Boom! Confetti when count reaches total
        } else {
          setDisplayCoins(start);
        }
      }, 16);

      return () => {
        clearInterval(timer);
        setShowConfetti(false);
      };
    } else {
      modalScale.value = withTiming(0.8, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 200 });
      setShowConfetti(false);
    }
  }, [visible, totalCoins]);

  const modalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={true} onRequestClose={onClose} animationType="none">
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View style={[styles.containerWrapper, modalStyle]}>
          <LinearGradient
            colors={['rgba(30, 41, 59, 0.99)', 'rgba(15, 23, 42, 1.0)']}
            style={styles.container}
          >
            {/* Top Decorative Handle - Improved Design */}
            <View style={styles.handleContainer}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.handle}
              />
            </View>

            {/* Inner Glow Border */}
            <View style={styles.innerGlow} />

            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.titleWrapper}>
                  <Animated.Text entering={FadeInUp.delay(200)} style={styles.title}>
                    REWARDS PROGRAM
                  </Animated.Text>
                  <Animated.View
                    entering={FadeInUp.delay(400)}
                    style={styles.titleUnderline}
                  />
                </View>
              </View>

              <View style={styles.headerRow}>
                <Animated.View entering={ZoomIn.delay(400)} style={styles.coinCircle}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500', '#FF8C00']}
                    style={styles.coinGradient}
                  >
                    <Text style={styles.coinEmoji}>🪙</Text>
                  </LinearGradient>
                </Animated.View>

                <View style={styles.balanceContainer}>
                  <Text style={styles.totalCoinsLabel}>Your Balance</Text>
                  <Animated.Text style={styles.totalCoinsValue}>
                    {displayCoins.toLocaleString()}
                  </Animated.Text>
                </View>
              </View>
            </View>

            <Text style={styles.activityTitle}>Magical Perks</Text>
            <FlatList
              data={activities}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <Animated.View
                  entering={SlideInDown.delay(600 + index * 100)}
                  style={styles.activityRow}
                >
                  <View style={styles.activityIconWrapper}>
                    <Text style={styles.activityIcon}>{index % 2 === 0 ? '💎' : '🌟'}</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityLabel}>{item.title}</Text>
                    <Text style={styles.activityDate}>Unlocked</Text>
                  </View>
                  <Text style={styles.activityPoints}>+{item.points}</Text>
                </Animated.View>
              )}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              style={styles.list}
            />

            <Pressable style={styles.closeButton} onPress={onClose}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.closeButtonGradient}
              >
                <Text style={styles.closeButtonText}>Done</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {showConfetti && (
          <ConfettiCannon
            count={60}
            origin={{ x: width / 2, y: height / 2 }}
            autoStart={true}
            fadeOut={true}
            fallSpeed={3000}
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
    padding: 16, // Reduced padding
  },
  containerWrapper: {
    width: '95%', // Slightly narrower
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  container: {
    width: '100%',
    borderRadius: 32, // Slightly smaller radius
    padding: 20, // Significantly reduced from 32
    paddingTop: 12, // Reduced top padding to accommodate handle
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    maxHeight: height * 0.85,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    margin: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTop: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleWrapper: {
    alignItems: 'center',
  },
  title: {
    color: '#94A3B8',
    fontSize: 10, // Even smaller
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  titleUnderline: {
    width: 20,
    height: 1,
    backgroundColor: 'rgba(0, 229, 255, 0.5)',
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  balanceContainer: {
    alignItems: 'flex-start',
  },
  coinCircle: {
    width: 48, // Compact size
    height: 48,
    borderRadius: 24,
    padding: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  coinGradient: {
    flex: 1,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  coinEmoji: {
    fontSize: 22,
  },
  totalCoinsLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  totalCoinsValue: {
    color: '#FFD700',
    fontSize: 32, // Much smaller for better fit
    fontWeight: '900',
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  activityTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  list: {
    maxHeight: Platform.OS === 'ios' ? 220 : 200,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
  },
  activityIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityIcon: {
    fontSize: 14,
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
  },
  activityDate: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 0,
  },
  activityPoints: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 8,
  },
  closeButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});