// components/ui/CoinButton.tsx
import React, { useEffect } from 'react';
import { Text, StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface CoinButtonProps {
  onPress: () => void;
}

export function CoinButton({ onPress }: CoinButtonProps) {
  const scale = useSharedValue(1);
  const breath = useSharedValue(0);
  const glow = useSharedValue(0);
  const blink = useSharedValue(0);

  useEffect(() => {
    // Continuous breathing animation
    breath.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
    // Continuous glow animation
    glow.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
    // Continuous blink animation for the label
    blink.value = withRepeat(
      withTiming(1, { duration: 800 }),
      -1,
      true
    );
  }, []);

  const animatedButtonStyle = useAnimatedStyle(() => {
    const s = scale.value * interpolate(breath.value, [0, 1], [1, 1.05]);
    return {
      transform: [{ scale: s }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    // Increased opacity range for a stronger glow
    const opacity = interpolate(glow.value, [0, 1], [0.2, 0.6]);
    // Increased scale range for more visibility
    const s = interpolate(glow.value, [0, 1], [1, 1.4]);
    return {
      opacity,
      transform: [{ scale: s }],
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(blink.value, [0, 1], [0.3, 1]);
    const s = interpolate(blink.value, [0, 1], [0.95, 1.05]);
    return {
      opacity,
      transform: [{ scale: s }],
    };
  });

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.3, { damping: 10, stiffness: 100 }),
      withSpring(1)
    );
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.pressable}>
      <View style={styles.wrapper}>
        {/* Animated Glow Aura - Enhanced Intensity */}
        <View style={styles.glowContainer}>
          <Animated.View style={[styles.glowAura, glowStyle]} />
        </View>

        <Animated.View style={[styles.container, animatedButtonStyle]}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.gradient}
          >
            <Text style={styles.coinIcon}>🪙</Text>
            {/* Label moved to center */}
            <Animated.View style={[styles.centerLabelWrapper, animatedLabelStyle]}>
              <Text style={styles.centerLabel}>REWARDS</Text>
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
  },
  glowContainer: {
    position: 'absolute',
    top: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: 48, // Slightly larger to fit text better
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowAura: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  coinIcon: {
    fontSize: 24,
    opacity: 0.5, // Faded icon to make text pop
  },
  centerLabelWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: {
    color: '#0F172A', // Dark text for contrast against gold
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});
