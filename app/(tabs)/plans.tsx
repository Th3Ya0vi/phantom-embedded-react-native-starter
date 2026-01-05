import React, { useState, useMemo, useEffect, useCallback, memo } from 'react'; import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors as ThemeColors, Spacing as ThemeSpacing, Typography as ThemeTypography } from '@/lib/theme';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

// Fallbacks
const Colors = ThemeColors || { primary: '#2F66F6', textPrimary: '#FFF', textSecondary: '#AAA', surface: '#1A1A1A' };
const Spacing = ThemeSpacing || { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
const Typography = ThemeTypography || { h1: { fontSize: 32 }, h2: { fontSize: 24 }, body: { fontSize: 16 } };
const Gradients = {
  background: ['#04070D', '#0F172A'] as const,
  primaryGlow: ['rgba(47, 102, 246, 0.3)', 'rgba(47, 102, 246, 0.1)'] as const,
};

import allPlansData from '@/lib/data/allPlans.json';
import { PurchaseModal } from '@/components/modals/PurchaseModal';

const REGIONS = ['Global', 'Europe', 'Asia', 'USA', 'Africa'];
const ITEMS_PER_PAGE = 10;

// --- PRE-CALCULATE DATA (ONCE) ---
// We map the 1,800+ items outside the render loop or useMemo to avoid repetetive work
const PRE_PROCESSED_PLANS = allPlansData.map(plan => ({
  ...plan,
  locationName: plan.locationNetworkList?.[0]?.locationName || 'Global',
  displayPrice: (plan.price * 1.4 / 10000).toFixed(2),
  displayVolume: plan.volume ? (plan.volume / (1024 ** 3)).toFixed(0) + ' GB' : '1 GB'
}));

// --- 1. MEMOIZED PLAN ITEM (Futuristic Design) ---
const PlanItem = memo(({ item, onBuy }: { item: any, onBuy: (item: any) => void }) => {
  // Performance Safeguard: BlurView is intensive on Android
  const UseBlur = Platform.OS === 'ios';

  if (!item) return null;

  return (
    <View style={styles.cardContainer}>
      {/* Outer Glow Border */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <View style={styles.cardInnerWrapper}>
          {UseBlur ? (
            <BlurView intensity={40} tint="dark" style={styles.cardContent}>
              <PlanItemContent item={item} onBuy={onBuy} />
            </BlurView>
          ) : (
            <View style={[styles.cardContent, { backgroundColor: 'rgba(15, 23, 42, 0.92)' }]}>
              <PlanItemContent item={item} onBuy={onBuy} />
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
});

// Extracted content to avoid duplication inside PlanItem
const PlanItemContent = ({ item, onBuy }: { item: any, onBuy: (item: any) => void }) => (
  <>
    {/* Header: Title & Price */}
    <View style={styles.cardHeader}>
      <View style={styles.titleGroup}>
        <Text style={styles.planTitle} numberOfLines={1}>{item.name || 'Data Plan'}</Text>
        <View style={styles.regionBadge}>
          <Text style={styles.regionBadgeText}>{(item.locationName || 'GLOBAL').toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.priceGroup}>
        <Text style={styles.currency}>$</Text>
        <Text style={styles.price}>{item.displayPrice || '0.00'}</Text>
      </View>
    </View>

    {/* Divider */}
    <View style={styles.divider} />

    {/* Details Row (Grid Layout) */}
    <View style={styles.detailsRow}>
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>DATA</Text>
        <Text style={styles.detailValue}>{item.displayVolume}</Text>
      </View>
      <View style={styles.verticalLine} />
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>VALIDITY</Text>
        <Text style={styles.detailValue}>{item.duration || 0} Days</Text>
      </View>
      <View style={styles.verticalLine} />
      <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>SPEED</Text>
        <Text style={styles.detailValue}>{item.speed || '4G/5G'}</Text>
      </View>
    </View>

    {/* Buy Button (Neon Style) */}
    <Pressable
      style={({ pressed }) => [styles.buyButton, pressed && { opacity: 0.8 }]}
      onPress={() => onBuy(item)}
    >
      <LinearGradient
        colors={['#2F66F6', '#00E5FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.buyGradient}
      >
        <Text style={styles.buyText}>Purchase Plan</Text>
        <Text style={styles.arrow}>→</Text>
      </LinearGradient>
    </Pressable>
  </>
);

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const [activeRegion, setActiveRegion] = useState('Global');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // --- 2. LIGHT FILTERING (Using Pre-processed Data) ---
  const allFilteredPlans = useMemo(() => {
    let filtered = PRE_PROCESSED_PLANS;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.locationName.toLowerCase().includes(lowerQuery)
      );
    } else if (activeRegion !== 'Global') {
      filtered = filtered.filter(p =>
        p.name.includes(activeRegion) ||
        p.locationName.includes(activeRegion)
      );
    }
    return filtered;
  }, [searchQuery, activeRegion]);

  const displayedPlans = useMemo(() => allFilteredPlans.slice(0, visibleCount), [allFilteredPlans, visibleCount]);

  const handleLoadMore = useCallback(() => {
    if (visibleCount < allFilteredPlans.length) {
      setVisibleCount(prev => prev + ITEMS_PER_PAGE);
    }
  }, [visibleCount, allFilteredPlans.length]);

  const handleBuy = useCallback((item: any) => {
    setSelectedPlan(item);
    setModalVisible(true);
  }, []);

  // Performance: Optimized key extractor
  const renderPlan = useCallback(({ item }: { item: any }) => (
    <PlanItem item={item} onBuy={handleBuy} />
  ), [handleBuy]);

  return (
    <LinearGradient colors={Gradients.background} style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); }}>
        <View style={{ zIndex: 10 }}>
          <View style={styles.header}>
            <Text style={styles.title}>Data Plans</Text>
            <Text style={styles.subtitle}>Select a high-speed package</Text>
          </View>

          <View style={styles.searchWrapper}>
            <BlurView intensity={20} tint="dark" style={styles.searchBlur}>
              <TextInput
                placeholder="Search country..."
                placeholderTextColor="#64748B"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setVisibleCount(ITEMS_PER_PAGE); // Reset count on search
                }}
              />
            </BlurView>
          </View>

          {!searchQuery && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.regionScroll}
              removeClippedSubviews={false}
            >
              {REGIONS.map((region) => (
                <Pressable
                  key={region}
                  onPress={() => {
                    setActiveRegion(region);
                    setVisibleCount(ITEMS_PER_PAGE); // Reset count
                  }}
                  style={styles.regionOuter}
                >
                  <View style={[styles.regionChip, activeRegion === region && styles.activeChip]}>
                    <Text style={[styles.regionText, activeRegion === region && { color: '#000' }]}>{region}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </TouchableWithoutFeedback>

      <FlatList
        data={(isLoading ? [1, 2, 3, 4] : displayedPlans) as any[]}
        renderItem={({ item }) => isLoading ? <PlanSkeleton /> : renderPlan({ item })}
        keyExtractor={(item, index) => isLoading ? `skeleton-${index}` : item.packageCode}
        contentContainerStyle={styles.plans}
        onEndReached={isLoading ? null : handleLoadMore}
        onEndReachedThreshold={0.6}
        // ... (rest of FlatList props)
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
      />

      <PurchaseModal visible={isModalVisible} plan={selectedPlan} onClose={() => setModalVisible(false)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.lg },
  title: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#94A3B8', fontSize: 14, marginTop: 4 },

  /* Search & Region */
  searchWrapper: { paddingHorizontal: Spacing.lg, marginBottom: 16 },
  searchBlur: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.3)' },
  searchInput: { padding: 14, color: '#FFF', fontSize: 16 },
  regionScroll: { paddingHorizontal: Spacing.lg, paddingBottom: 16 },
  regionOuter: { marginRight: 8 },
  regionChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  activeChip: { backgroundColor: '#00E5FF', borderColor: '#00E5FF' },
  regionText: { color: '#94A3B8', fontWeight: '700', fontSize: 12 },

  plans: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },

  /* --- NEW CARD STYLES --- */
  cardContainer: { marginBottom: 16 },
  cardBorder: { borderRadius: 24, padding: 1 }, // Creates gradient border
  cardInnerWrapper: { borderRadius: 24, overflow: 'hidden' },
  cardContent: { borderRadius: 24, padding: 20, backgroundColor: 'rgba(15, 23, 42, 0.6)' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleGroup: { flex: 1, paddingRight: 10 },
  planTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 6 },

  regionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(47, 102, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  regionBadgeText: { color: '#2F66F6', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  priceGroup: { flexDirection: 'row', alignItems: 'flex-start' },
  currency: { color: '#00E5FF', fontSize: 14, fontWeight: '600', marginTop: 4, marginRight: 2 },
  price: { color: '#FFF', fontSize: 24, fontWeight: '800' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },

  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailItem: { alignItems: 'center', flex: 1 },
  detailLabel: { color: '#64748B', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  detailValue: { color: '#E2E8F0', fontSize: 14, fontWeight: '600' },
  verticalLine: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },

  buyButton: { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
  buyGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14 },
  buyText: { color: '#FFF', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  arrow: { color: '#FFF', marginLeft: 8, fontSize: 16, fontWeight: '800' },

  /* Skeleton */
  skeletonCard: {
    height: 180,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    marginBottom: 16,
    overflow: 'hidden'
  },
  shimmer: {
    width: '100%',
    height: '100%',
    borderRadius: 24
  }
});

// --- SKELETON COMPONENT ---
const PlanSkeleton = () => (
  <View style={styles.skeletonCard}>
    <ShimmerPlaceholder
      shimmerColors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
      style={styles.shimmer}
    />
  </View>
);
