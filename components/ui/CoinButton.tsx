// components/ui/CoinButton.tsx
import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

interface CoinButtonProps {
  onPress: () => void;
}

export function CoinButton({ onPress }: CoinButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // Perform a satisfying bounce animation on every press
    scale.value = withSequence(withSpring(1.2), withSpring(1));
    // Call the function passed from the parent to open the modal
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Text style={styles.coinIcon}>🪙</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.1)', // Gold tint
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  coinIcon: {
    fontSize: 28,
  },
});
