import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';import {
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

// --- 1. MEMOIZED PLAN ITEM (Futuristic Design) ---
const PlanItem = memo(({ item, onBuy }: { item: any, onBuy: (item: any) => void }) => {
  return (
    <View style={styles.cardContainer}>
      {/* Outer Glow Border */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <BlurView intensity={Platform.OS === 'ios' ? 40 : 20} tint="dark" style={styles.cardContent}>

          {/* Header: Title & Price */}
          <View style={styles.cardHeader}>
            <View style={styles.titleGroup}>
              <Text style={styles.planTitle}>{item.name}</Text>
              <View style={styles.regionBadge}>
                <Text style={styles.regionText}>{item.locationName.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.priceGroup}>
              <Text style={styles.currency}>$</Text>
              <Text style={styles.price}>{item.displayPrice}</Text>
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
              <Text style={styles.detailValue}>{item.duration} Days</Text>
            </View>
            <View style={styles.verticalLine} />
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>SPEED</Text>
              <Text style={styles.detailValue}>{item.speed}</Text>
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

        </BlurView>
      </LinearGradient>
    </View>
  );
});

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const [activeRegion, setActiveRegion] = useState('Global');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  // --- 2. PRE-CALCULATE DATA ---
  const allFilteredPlans = useMemo(() => {
    let data = allPlansData.map(plan => ({
      ...plan,
      locationName: plan.locationNetworkList?.[0]?.locationName || 'Global',
      displayPrice: (plan.price / 10000).toFixed(2),
      displayVolume: plan.volume ? (plan.volume / (1024 ** 3)).toFixed(0) + ' GB' : '1 GB'
    }));

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return data.filter(p => p.name.toLowerCase().includes(lowerQuery) || p.locationName.toLowerCase().includes(lowerQuery));
    }
    if (activeRegion !== 'Global') {
      return data.filter(p => p.name.includes(activeRegion) || p.locationName.includes(activeRegion));
    }
    return data;
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

  return (
    <LinearGradient colors={Gradients.background} style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowSuggestions(false); }}>
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
                onFocus={() => setShowSuggestions(true)}
                onChangeText={setSearchQuery}
              />
            </BlurView>
          </View>

          {!searchQuery && (
             <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.regionScroll}
                // ✅ PROP IS NOW CORRECTLY PLACED
                removeClippedSubviews={false}
              >
              {REGIONS.map((region) => (
                <Pressable key={region} onPress={() => setActiveRegion(region)} style={styles.regionOuter}>
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
        data={displayedPlans}
        renderItem={({ item }) => <PlanItem item={item} onBuy={handleBuy} />}
        keyExtractor={(item) => item.packageCode}
        contentContainerStyle={styles.plans}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        initialNumToRender={8}
        windowSize={5}
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
  regionText: { color: '#2F66F6', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

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
  arrow: { color: '#FFF', marginLeft: 8, fontSize: 16, fontWeight: '800' }
});
