import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Image,
  UIManager
} from 'react-native';
import { storage } from '@/lib/storage/storage'
import { LinearGradient } from 'expo-linear-gradient';
import { CoinButton } from '@/components/ui/CoinButton'; // Import the updated CoinButton
import { RewardsModal, RewardActivity } from '@/components/modals/RewardsModal'; // Import the new RewardsModal
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { usePrivy, useEmbeddedSolanaWallet } from '@privy-io/expo'; // For wallet address
import * as Clipboard from 'expo-clipboard';
import { useNotifications } from '@/lib/ui/NotificationContext';
import React, { useState, useEffect, useCallback } from 'react';

import {
  Colors as ThemeColors,
  Spacing as ThemeSpacing,
  Typography as ThemeTypography,
  Gradients as ThemeGradients
} from '@/lib/theme';

import { useSession } from '@/lib/session/SessionContext';
import { useApiActions } from '@/hooks/useApiActions';
import { PurchaseModal } from '@/components/modals/PurchaseModal';
import { ActivationModal } from '@/components/modals/ActivationModal';
const featuredPlansData = require('@/lib/data/featuredPlans.json');

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);

// if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

// --- FALLBACKS ---
const Colors = ThemeColors || { primary: '#2F66F6', textPrimary: '#FFFFFF', textSecondary: '#94A3B8' };
const Spacing = ThemeSpacing || { lg: 24, xl: 32 };
const Typography = ThemeTypography || { h2: { fontSize: 24 }, body: { fontSize: 16 } };
const Gradients = {
  background: ThemeGradients?.background || ['#04070D', '#0F172A'],
};

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: sessionUser, isAuthenticated } = useSession();
  const { user: privyUser } = usePrivy();
  const wallet = useEmbeddedSolanaWallet();

  const getSolanaAddress = (u: any) => {
    if (!u) return null;
    const solanaAccount = u.linked_accounts?.find(
      (acc: any) => acc.type === 'wallet' && acc.chain_type === 'solana'
    );
    return solanaAccount?.address || null;
  };

  const walletAddress = getSolanaAddress(privyUser) || (wallet as any).address;

  const {
    handleGetUserSubscriptions,
    handleUsageCheck,
    handleCancelEsimProfile,
    getWalletBalance,
    handleGetRewardsSummary
  } = useApiActions();
  const { showAlert } = useNotifications();

  const user = sessionUser;

  // --- REWARDS STATE ---
  const [isRewardsModalVisible, setRewardsModalVisible] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [rewardActivities, setRewardActivities] = useState<RewardActivity[]>([
    { id: '1', title: 'Account Creation', points: 500 },
    { id: '2', title: 'First Purchase', points: 100 },
    { id: '3', title: 'Subsequent Purchase', points: 50 },
    { id: '4', title: 'X- Endorsement', points: 200 },
  ]);

  // --- REWARDS FETCHING ---
  const fetchRewards = React.useCallback(async (userId: string) => {
    try {
      const total = await handleGetRewardsSummary(userId);
      if (typeof total === 'number') setEarnedCoins(total);
    } catch (err) {
      console.warn("[DASHBOARD] Rewards fetch skipped or failed.");
    }
  }, [handleGetRewardsSummary]);

  // --- DASHBOARD STATE ---
  const [walletData, setWalletData] = useState({ totalValue: 0, solBalance: 0, usdcBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isFetchingRef = React.useRef(false);
  const lastFetchRef = React.useRef(0);

  // State for Purchase Modal
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  // --- BLUR ANIMATION ---
  const blurIntensity = useSharedValue(0);
  useEffect(() => {
    blurIntensity.value = withTiming(isRewardsModalVisible ? (Platform.OS === 'ios' ? 100 : 85) : 0, {
      duration: 400,
    });
  }, [isRewardsModalVisible]);

  const animatedBlurStyle = useAnimatedStyle(() => ({
    opacity: blurIntensity.value > 0 ? 1 : 0,
  }));

  // State for QR Code Modal
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedForQr, setSelectedForQr] = useState<any | null>(null);

  const fetchData = React.useCallback(async () => {
    const userId = user?.id || user?._id;
    const token = await storage.getAccessToken();

    if (!isAuthenticated || !userId || !token) {
      if (isAuthenticated) console.log("[DASHBOARD] Fetch abort: No session.");
      if (!isAuthenticated) {
        setSubscriptions([]);
        setEarnedCoins(0);
      }
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Prevent redundant calls within 2 seconds
    const now = Date.now();
    if (isFetchingRef.current || (now - lastFetchRef.current < 2000)) return;

    try {
      isFetchingRef.current = true;
      lastFetchRef.current = now;
      setLoading(true);

      const [subsResponse] = await Promise.all([
        handleGetUserSubscriptions(userId),
        fetchRewards(userId)
      ]);

      const rawSubs = Array.isArray(subsResponse) ? subsResponse : subsResponse?.data || [];
      const activeSubs = rawSubs
        .filter((s: any) => s && s.esimTranNo && !['CANCEL', 'SUSPEND', 'DELETED'].includes(s.esimStatus))
        .slice(0, 3);

      if (activeSubs.length > 0) {
        const tranNoList = activeSubs.map((s: any) => s.esimTranNo);
        const usageResponse = await handleUsageCheck({ esimTranNoList: tranNoList });
        const rawUsage = usageResponse?.data?.obj || usageResponse?.obj || [];
        const usageData = Array.isArray(rawUsage) ? rawUsage : [];
        const merged = activeSubs.map((sub: any) => ({
          ...sub,
          usage: usageData.find((u: any) => u.esimTranNo === sub.esimTranNo),
          ac: sub.esimId || sub.ac
        }));
        setSubscriptions(merged);
      } else {
        setSubscriptions([]);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSubscriptions([]);
      } else if (error.message?.includes('No token')) {
        console.log("[DASHBOARD] Auth lost.");
      } else {
        console.error("[DASHBOARD] Fetch Failed:", error.message);
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, handleGetUserSubscriptions, handleUsageCheck, fetchRewards, isAuthenticated]);

  const handleCancelPlan = (esimTranNo: string, iccid: string) => {
    showAlert({
      title: "Cancel Plan",
      message: "Are you sure you want to permanently cancel this eSIM?",
      buttons: [
        { text: "Dismiss", style: "cancel" },
        {
          text: "Confirm Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await handleCancelEsimProfile(esimTranNo, iccid);
              await fetchData();
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    });
  };

  const copyAddress = async () => {
    if (!walletAddress) return;
    await Clipboard.setStringAsync(walletAddress);
    showAlert({ title: 'Copied', message: 'Address copied!' });
  };

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not Connected';

  const refreshPlanUsage = async (esimTranNo: string) => {
    if (updatingIds.includes(esimTranNo)) return;
    setUpdatingIds(prev => [...prev, esimTranNo]);
    try {
      const usageResponse = await handleUsageCheck({ esimTranNoList: [esimTranNo] });
      const rawUsage = usageResponse?.data?.obj || usageResponse?.obj || [];
      const newUsage = Array.isArray(rawUsage) ? rawUsage[0] : null;
      if (newUsage) {
        setSubscriptions(prev => prev.map(sub =>
          sub.esimTranNo === esimTranNo ? { ...sub, usage: newUsage } : sub
        ));
      }
    } finally {
      setUpdatingIds(prev => prev.filter(id => id !== esimTranNo));
    }
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleViewQr = (plan: any) => {
    setSelectedForQr(plan);
    setQrModalVisible(true);
  };

  const fetchWalletData = React.useCallback(async () => {
    if (!walletAddress) return;
    const data = await getWalletBalance(walletAddress);
    setWalletData(data);
  }, [walletAddress, getWalletBalance]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      if (walletAddress) fetchWalletData();
    }
  }, [isAuthenticated, walletAddress]); // Removed unstable dependencies

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchData(), fetchWalletData()]).finally(() => setRefreshing(false));
  };

  const formatBytes = (bytes: any) => {
    const b = parseInt(bytes || 0);
    if (b === 0) return '0.00 GB';
    return (b / (1024 ** 3)).toFixed(2) + ' GB';
  };

  const PlanSkeleton = () => (
    <View style={styles.planCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <ShimmerPlaceholder shimmerColors={['#1E293B', '#334155', '#1E293B']} style={{ width: 150, height: 22, borderRadius: 4 }} />
          <ShimmerPlaceholder shimmerColors={['#1E293B', '#334155', '#1E293B']} style={{ width: 100, height: 14, borderRadius: 4, marginTop: 12 }} />
        </View>
        <ShimmerPlaceholder shimmerColors={['#1E293B', '#334155', '#1E293B']} style={{ width: 80, height: 80, borderRadius: 20 }} />
      </View>
      <ShimmerPlaceholder shimmerColors={['#1E293B', '#334155', '#1E293B']} style={{ width: '100%', height: 8, borderRadius: 4, marginTop: 20 }} />
    </View>
  );

  return (
    <LinearGradient colors={Gradients.background as any} style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E5FF" />}
      >
        {/* ✅ UPDATED WELCOME SECTION */}
        <View style={styles.headerRow}>
          {/* Greeting on the left */}

          <View style={styles.greeting}>
            <Text style={styles.greetingText}>
              Hi {(privyUser as any)?.email?.address?.split('@')[0] ||
                (privyUser as any)?.linked_accounts?.find((a: any) => a.type === 'google_oauth')?.name?.split(' ')[0] ||
                'Degen'} 👋
            </Text>
            <Text style={styles.subGreeting}>GeSIM Control Center</Text>
          </View>
          {/* Coin Button on the right, now opens the modal */}
          <CoinButton onPress={() => setRewardsModalVisible(true)} />
        </View>


        {/* --- WALLET CARD SECTION --- */}
        <View style={styles.section}>
          <View style={styles.walletCardContainer}>
            {/* Background Glow */}
            <LinearGradient
              colors={['rgba(47, 102, 246, 0.4)', 'rgba(0, 229, 255, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.walletCardGlow}
            />
            <BlurView intensity={Platform.OS === 'ios' ? 40 : 20} tint="dark" style={styles.walletCard}>
              <View>
                <Text style={styles.walletLabel}>SOL WALLET</Text>

                <Text style={styles.walletBalance}>${walletData.totalValue.toFixed(4)}</Text>
              </View>
              <Pressable style={styles.addressPill} onPress={copyAddress}>
                <Text style={styles.addressText}>{truncatedAddress}</Text>
                <Text style={styles.copyIcon}>📋</Text>
              </Pressable>
            </BlurView>
          </View>
        </View>
        {/* --- END OF WALLET CARD SECTION --- */}



        {/* ACTIVE PLANS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Data</Text>

          {loading && !refreshing ? (
            <><PlanSkeleton /><PlanSkeleton /></>
          ) : subscriptions.length > 0 ? (
            subscriptions.map((item) => {
              const total = parseInt(item.usage?.totalVolume || item.volume || 0);
              const used = parseInt(item.usage?.orderUsage || 0);
              const remaining = Math.max(0, total - used);
              const percentage = total > 0 ? (remaining / total) * 100 : 0;
              const isExpanded = expandedId === item.esimTranNo;

              return (
                <View key={item.id} style={styles.planCard}>
                  {/* --- CARD MAIN CONTENT --- */}
                  <View style={styles.cardMain}>
                    {/* Left side: Info */}
                    <View style={styles.infoGroup}>
                      <Text style={styles.planTitle} numberOfLines={1}>{item.planRef}</Text>

                      <View style={styles.activeBadge}>
                        <View style={styles.dot} />
                        <Text style={styles.activeText}>ACTIVE</Text>
                      </View>

                      <View style={styles.usageContainer}>
                        <Text style={styles.usageValue}>{formatBytes(remaining)}</Text>
                        <Text style={styles.usageLabel}> of {formatBytes(total)}</Text>
                      </View>
                    </View>

                    {/* Right side: Stylized QR Button */}
                    <Pressable onPress={() => handleViewQr(item)} style={styles.qrButton}>
                      {/* ✅ REPLACED with an Image component */}
                      <Image
                        source={require('../../assets/qr-icon.png')}
                        style={styles.qrIconImage}
                      />
                      <Text style={styles.qrButtonText}>View QR</Text>
                    </Pressable>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressTrack}>
                    <LinearGradient
                      colors={['#2F66F6', '#00E5FF']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${percentage}%` }]}
                    />
                  </View>

                  {/* --- COLLAPSIBLE "MORE OPTIONS" SECTION --- */}
                  <View style={styles.expandWrapper}>
                    <Pressable
                      onPress={() => toggleExpand(item.esimTranNo)}
                      style={[styles.expandHeader, isExpanded && styles.expandHeaderActive]}
                    >
                      <Text style={styles.expandText}>
                        {isExpanded ? 'Hide Options' : 'Expand for more Options'}
                      </Text>
                      <View style={styles.chevronContainer}>
                        <Text style={styles.chevronIcon}>{isExpanded ? '▲' : '▼'}</Text>
                      </View>
                    </Pressable>

                    {isExpanded && (
                      <View style={styles.actionRow}>
                        <Pressable
                          style={[styles.actionBtn, styles.cancelBtn]}
                          onPress={() => handleCancelPlan(item.esimTranNo, item.iccid)}
                        >
                          <Text style={styles.actionBtnText}>CANCEL</Text>
                        </Pressable>

                        <Pressable
                          style={[styles.actionBtn, styles.topUpBtn]}
                          onPress={() => router.push('/(tabs)/plans')}
                        >
                          <Text style={styles.actionBtnText}>TOP-UP</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                  {/* --- END OF COLLAPSIBLE SECTION --- */}

                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🛰️</Text>
              <Text style={styles.emptyTitle}>Disconnected</Text>
              <Text style={styles.emptySub}>No active data detected on your account.</Text>
              <Pressable style={styles.emptyButton} onPress={() => router.push('/(tabs)/plans')}>
                <Text style={styles.emptyButtonText}>Purchase eSIM</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* FEATURED */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Featured Deals</Text>
            <Pressable onPress={() => router.push('/(tabs)/plans')}><Text style={styles.viewAll}>Market</Text></Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredPlansData.map((plan: any) => (
              <View key={plan.packageCode} style={styles.featuredCard}>
                <Text style={styles.fTitle} numberOfLines={1}>{plan.name}</Text>
                <Text style={styles.fData}>{(plan.volume / (1024 ** 3)).toFixed(0)} GB</Text>
                <View style={styles.featuredFooter}>
                  <Text style={styles.fPrice}>${(plan.price * 1.4 / 10000).toFixed(2)}</Text>
                  <Pressable style={styles.fBuyBtn} onPress={() => { setSelectedPlan(plan); setModalVisible(true); }}>
                    <Text style={styles.fBuyText}>Buy</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* RENDER MODALS */}
      {/* 1. The actual Rewards Modal (now with a transparent background) */}
      <RewardsModal
        visible={isRewardsModalVisible}
        onClose={() => setRewardsModalVisible(false)}
        totalCoins={earnedCoins}
        activities={rewardActivities}
      />

      {/* Parental Blur for RewardsModal (Fixes Android Blur) */}
      {isRewardsModalVisible && (
        <AnimatedBlurView
          intensity={Platform.OS === 'ios' ? 100 : 85}
          tint="dark"
          style={[StyleSheet.absoluteFill, animatedBlurStyle, { zIndex: 99 }]}
        />
      )}

      {/* ... Your other modals (PurchaseModal, ActivationModal) ... */}

      <ActivationModal
        visible={qrModalVisible}
        profile={selectedForQr}
        // ✅ CORRECTED LOGIC
        onClose={() => {
          // 1. First, close the modal
          setQrModalVisible(false);
          // 2. Then, manually trigger a data refresh on the Dashboard
          console.log("[CALLBACK] Modal closed. Triggering dashboard refresh...");
          fetchData();
        }}
      />

      <PurchaseModal
        visible={isModalVisible}
        plan={selectedPlan}
        // You should do the same for the purchase modal!
        onClose={() => {
          setModalVisible(false);
          // If a purchase might result in a new plan, refresh here too.
          fetchData();
        }}
      />
    </LinearGradient>
  );
}

// --- FINAL STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  greeting: {},
  greetingText: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subGreeting: { color: '#00E5FF', fontSize: 13, fontWeight: '600', letterSpacing: 1.5 },
  section: { marginBottom: 32 },
  sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAll: { color: '#2F66F6', fontWeight: '800' },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg, // Assuming Spacing.lg is your standard padding
    marginBottom: 32,
  },


  /* --- CARD STYLES --- */
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28,
    padding: 24,
    paddingBottom: 0, // Removed bottom padding to let expander touch edge
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden' // Vital for the bottom rounded corners
  },
  cardMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoGroup: {
    flex: 1,
    justifyContent: 'center'
  },
  planTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5FF',
    marginRight: 6
  },
  activeText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  usageContainer: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  usageValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800'
  },
  usageLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500'
  },

  qrButton: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: 'rgba(47, 102, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(47, 102, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  qrIconImage: {
    width: 28, // Adjust size as needed
    height: 28, // Adjust size as needed
    marginBottom: 4,
  },
  qrButtonText: {
    color: '#2F66F6',
    fontSize: 10,
    fontWeight: '800',
  },

  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  /* --- EXPANDABLE STYLES --- */
  expandWrapper: {
    marginTop: 20,
    marginHorizontal: -24, // Pull to edges
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)'
  },
  expandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  expandHeaderActive: { backgroundColor: 'rgba(255,255,255,0.05)' },
  expandText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  chevronContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chevronIcon: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  topUpBtn: {
    backgroundColor: 'rgba(47, 102, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(47, 102, 246, 0.3)'
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#FFF'
  },

  /* Empty State */
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 32, borderWidth: 1, borderColor: '#1E293B', borderStyle: 'dashed' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#64748B', fontSize: 14, marginTop: 6, marginBottom: 24, textAlign: 'center' },
  emptyButton: { backgroundColor: '#2F66F6', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20 },
  emptyButtonText: { color: '#FFF', fontWeight: '800' },

  /* Featured Cards */
  featuredCard: { width: 145, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 18, marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  fTitle: { color: Colors.textSecondary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  fData: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginVertical: 6 },
  featuredFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  fPrice: { color: '#00E5FF', fontSize: 16, fontWeight: '700' },
  fBuyBtn: { backgroundColor: '#2F66F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  fBuyText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  walletCardContainer: {
    position: 'relative',
    marginBottom: 16, // Space between this and the next section
  },
  walletCardGlow: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    bottom: -10,
    borderRadius: 32,
    opacity: 0.6,
  },
  walletCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  walletLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  walletBalance: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addressText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: 'monospace',
    marginRight: 8,
  },
  copyIcon: {
    color: '#64748B',
    fontSize: 14,
  }
});
