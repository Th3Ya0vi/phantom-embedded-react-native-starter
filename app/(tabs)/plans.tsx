import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { Colors } from '../styles/colors';
import { Gradients } from '../styles/gradients';
import { Spacing } from '../styles/spacing';
import { Typography } from '../styles/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const REGIONS = ['Global', 'Europe', 'Asia', 'USA'];

export default function PlansScreen() {
  const activeRegion = 'Global';
    const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={Gradients.background}
    style={[
      styles.container,
      { paddingTop: insets.top }
      ]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Data Plans</Text>
        <Text style={styles.subtitle}>
          Find the right plan for your journey
        </Text>
      </View>

      {/* 🔍 Search Bar (Glass) */}
      <View style={styles.searchWrapper}>
        <BlurView intensity={40} tint="dark" style={styles.searchBlur}>
          <TextInput
            placeholder="Search country or region"
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
        </BlurView>
      </View>

      {/* Region Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.regionScroll}
      >
        {REGIONS.map((region) => {
          const isActive = region === activeRegion;

          return (
            <LinearGradient
              key={region}
              colors={
                isActive
                  ? Gradients.primaryGlow
                  : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)']
              }
              style={styles.regionOuter}
            >
              <BlurView intensity={25} tint="dark" style={styles.regionChip}>
                <Text
                  style={[
                    styles.regionText,
                    isActive && { color: Colors.textPrimary },
                  ]}
                >
                  {region}
                </Text>
              </BlurView>
            </LinearGradient>
          );
        })}
      </ScrollView>

      {/* Plans */}
      <ScrollView contentContainerStyle={styles.plans}>
        {[1, 2, 3].map((_, i) => (
          <LinearGradient
            key={i}
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
            style={styles.planGlow}
          >
            <BlurView intensity={30} tint="dark" style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>Global eSIM</Text>
                <Text style={styles.planPrice}>$18</Text>
              </View>

              <Text style={styles.planMeta}>10 GB · 30 days</Text>
              <Text style={styles.planHint}>
                Best for multi-country trips
              </Text>

              <Pressable style={styles.buyButton}>
                            <Text style={styles.buyText}>Buy Plan</Text>
                          </Pressable>

            </BlurView>
          </LinearGradient>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Header */
  header: {
    padding: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    ...Typography.h1,
  },
  subtitle: {
    color: Colors.textSecondary,
    ...Typography.body,
    marginTop: Spacing.xs,
  },

  /* Search */
  searchWrapper: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchInput: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 14,
  },

  /* Regions */
  regionScroll: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  regionOuter: {
    borderRadius: 20,
    marginRight: Spacing.sm,
    padding: 1,
  },
  regionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  regionText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },

  /* Plans */
  plans: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  planGlow: {
    borderRadius: 22,
    marginBottom: Spacing.lg,
    padding: 1,
  },
  planCard: {
    borderRadius: 22,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  planPrice: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  planMeta: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  planHint: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: Spacing.sm,
  },

  buyButton: {
      backgroundColor: '#2F66F6',
    marginTop: Spacing.md,
    borderRadius: 14,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  buyText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});
