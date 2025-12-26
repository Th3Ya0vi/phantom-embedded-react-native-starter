import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { PurchaseModal } from '@/components/modals/PurchaseModal';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors as ThemeColors, Spacing as ThemeSpacing, Typography as ThemeTypography } from '@/lib/theme';

// 2. FALLBACK OBJECTS
const Colors = ThemeColors || {
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',
  primary: '#2F66F6',
  surface: '#1A1A1A'
};

const Spacing = ThemeSpacing || {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
};

const Typography = ThemeTypography || {
  h1: { fontSize: 32, fontWeight: '700' },
  h2: { fontSize: 24, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' }
};

const Gradients = {
  background: ['#000000', '#121212'] as const,
  primaryGlow: ['rgba(47, 102, 246, 0.3)', 'rgba(47, 102, 246, 0.1)'] as const,
};

// Import your real data
import allPlansData from '@/lib/data/allPlans.json';

const REGIONS = ['Global', 'Europe', 'Asia', 'USA', 'Africa'];
const ITEMS_PER_PAGE = 15; // Number of items to load at a time

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
    const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
    const [isModalVisible, setModalVisible] = useState(false);


  // STATE MANAGEMENT
  const [activeRegion, setActiveRegion] = useState('Global');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // PAGINATION STATE
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 1. EXTRACT UNIQUE COUNTRIES FOR AUTOCOMPLETE
  const allLocationNames = useMemo(() => {
    const locations = new Set<string>();
    allPlansData.forEach(plan => {
      const locName = plan.locationNetworkList?.[0]?.locationName;
      if (locName) locations.add(locName);
    });
    return Array.from(locations).sort();
  }, []);

  // 2. FILTER SUGGESTIONS
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return allLocationNames.filter(name =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6);
  }, [searchQuery, allLocationNames]);

  // 3. MAIN FILTERING LOGIC
  // This calculates the TOTAL available results based on filters
  const allFilteredPlans = useMemo(() => {
    let data = allPlansData;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(plan => {
        const nameMatch = plan.name.toLowerCase().includes(lowerQuery);
        const countryName = plan.locationNetworkList?.[0]?.locationName || '';
        const countryMatch = countryName.toLowerCase().includes(lowerQuery);
        return nameMatch || countryMatch;
      });
    }
    else if (activeRegion !== 'Global') {
       data = data.filter(plan =>
         plan.name.includes(activeRegion) ||
         plan.locationNetworkList?.[0]?.locationName?.includes(activeRegion)
       );
    }

    return data;
  }, [searchQuery, activeRegion]);

  // 4. RESET PAGINATION WHEN FILTERS CHANGE
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, activeRegion]);

  // 5. SLICE DATA FOR RENDERING
  // Only show the items allowed by visibleCount
  const displayedPlans = useMemo(() => {
    return allFilteredPlans.slice(0, visibleCount);
  }, [allFilteredPlans, visibleCount]);

  // 6. LOAD MORE FUNCTION
  const handleLoadMore = () => {
    if (isLoadingMore) return;
    if (visibleCount >= allFilteredPlans.length) return;

    setIsLoadingMore(true);

    // Slight delay to simulate network/smoothing and show spinner
    setTimeout(() => {
        setVisibleCount(prev => prev + ITEMS_PER_PAGE);
        setIsLoadingMore(false);
    }, 200);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const renderPlanItem = ({ item }: { item: any }) => {
    const displayPrice = (item.price / 10000).toFixed(2);
    const volumeGB = item.volume ? (item.volume / (1024 * 1024 * 1024)).toFixed(0) : '1';
    const dataAmount = volumeGB + ' GB';

    const countryInfo = item.locationNetworkList?.[0];
    const countryName = countryInfo?.locationName || 'Global';

    return (
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
        style={styles.planGlow}
      >
        <BlurView intensity={30} tint="dark" style={styles.planCard}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planTitle}>{item.name}</Text>
              <Text style={styles.planCountry}>{countryName}</Text>
            </View>
            <Text style={styles.planPrice}>${displayPrice}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.planMeta}>{dataAmount}</Text>
            <Text style={styles.planMetaSeparator}>·</Text>
            <Text style={styles.planMeta}>{item.duration} {item.durationUnit}s</Text>
          </View>

          <Text style={styles.planHint}>
            Speed: {item.speed}
          </Text>

          <Pressable
                      style={styles.buyButton}
                      // 3. Update onPress
                      onPress={() => {
                         setSelectedPlan(item);
                         setModalVisible(true);
                      }}
                    >
                      <Text style={styles.buyText}>Buy Plan</Text>
                    </Pressable>
        </BlurView>
      </LinearGradient>
    );
  };

  // Footer component for loader
  const renderFooter = () => {
    if (!isLoadingMore) return <View style={{ height: Spacing.xxl }} />;
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss();
      setShowSuggestions(false);
    }}>
      <LinearGradient
        colors={Gradients.background}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        {/* Header Section */}
        <View style={{ zIndex: 10 }}>
          <View style={styles.header}>
            <Text style={styles.title}>Data Plans</Text>
            <Text style={styles.subtitle}>Find the right plan for your journey</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <BlurView intensity={40} tint="dark" style={styles.searchBlur}>
              <TextInput
                placeholder="Search country or region"
                placeholderTextColor={Colors?.textMuted || '#666'}
                style={styles.searchInput}
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setShowSuggestions(true);
                }}
              />
            </BlurView>

            {/* --- AUTOCOMPLETE DROPDOWN --- */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((item, index) => (
                  <Pressable
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(item)}
                  >
                    <Text style={styles.suggestionText}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Region Selector */}
          {!searchQuery && (
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.regionScroll}
                keyboardShouldPersistTaps="handled"
              >
                {REGIONS.map((region) => {
                  const isActive = region === activeRegion;
                  return (
                    <Pressable
                      key={region}
                      onPress={() => setActiveRegion(region)}
                    >
                      <LinearGradient
                        colors={isActive ? Gradients.primaryGlow : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)']}
                        style={styles.regionOuter}
                      >
                        <BlurView intensity={25} tint="dark" style={styles.regionChip}>
                          <Text style={[styles.regionText, isActive && { color: Colors?.textPrimary || '#fff' }]}>
                            {region}
                          </Text>
                        </BlurView>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Plans List */}
        <FlatList
          data={displayedPlans} // Uses the sliced data
          renderItem={renderPlanItem}
          keyExtractor={(item) => item.packageCode}
          contentContainerStyle={styles.plans}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"

          // INFINITE SCROLL PROPS
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5} // Trigger when user scrolls to within 50% of the bottom
          ListFooterComponent={renderFooter}

          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No plans found for "{searchQuery}"</Text>
          }
        />
         <PurchaseModal
                 visible={isModalVisible}
                 plan={selectedPlan}
                 onClose={() => setModalVisible(false)}
              />


      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.lg },
  title: { color: Colors?.textPrimary || '#fff', ...Typography.h1 },
  subtitle: { color: Colors?.textSecondary || '#aaa', ...Typography.body, marginTop: Spacing.xs },

  /* Search */
  searchWrapper: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, position: 'relative', zIndex: 20 },
  searchBlur: { borderRadius: 16, overflow: 'hidden' },
  searchInput: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, color: Colors?.textPrimary || '#fff', fontSize: 14, height: 44 },

  /* Autocomplete Suggestions */
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors?.surface || '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    overflow: 'hidden'
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  suggestionText: {
    color: Colors?.textPrimary || '#fff',
    fontSize: 14
  },

  /* Regions */
  regionScroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  regionOuter: { borderRadius: 20, marginRight: Spacing.sm, padding: 1 },
  regionChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20 },
  regionText: { color: Colors?.textSecondary || '#aaa', fontSize: 14, fontWeight: '500' },

  /* Plans List */
  plans: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  planGlow: { borderRadius: 22, marginBottom: Spacing.lg, padding: 1 },
  planCard: { borderRadius: 22, padding: Spacing.lg, overflow: 'hidden' },

  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planTitle: { color: Colors?.textPrimary || '#fff', fontSize: 16, fontWeight: '600' },
  planCountry: { color: Colors?.textMuted || '#666', fontSize: 13, marginTop: 2 },

  planPrice: { color: Colors?.textPrimary || '#fff', fontSize: 18, fontWeight: '700' },

  metaRow: { flexDirection: 'row', marginTop: Spacing.sm },
  planMeta: { color: Colors?.textSecondary || '#ccc', fontSize: 14, fontWeight: '500' },
  planMetaSeparator: { color: Colors?.textMuted || '#666', marginHorizontal: 6 },

  planHint: { color: Colors?.textMuted || '#666', fontSize: 12, marginTop: Spacing.sm },

  buyButton: {
    backgroundColor: Colors?.primary || '#2F66F6',
    marginTop: Spacing.md,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center'
  },
  buyText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },

  emptyText: { color: Colors?.textMuted || '#666', textAlign: 'center', marginTop: 40 },

  /* Footer Loader */
  loaderFooter: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
