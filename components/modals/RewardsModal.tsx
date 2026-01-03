// components/modals/RewardsModal.tsx
import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList } from 'react-native';
import { BlurView } from 'expo-blur'; // Make sure this is imported
import { LinearGradient } from 'expo-linear-gradient';

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
  return (
      // ✅ The Modal itself is now fully transparent
      <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
        {/* The overlay now just centers the content, no color or blur */}
        <View style={styles.overlay}>
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={styles.container}
          >
            {/* All of your existing modal content (Header, FlatList, etc.) goes here */}
            {/* ... */}
             <View style={styles.header}>
              <Text style={styles.title}>Your Rewards</Text>
              <Text style={styles.totalCoinsLabel}>Total Accumulated</Text>
              <Text style={styles.totalCoinsValue}>{totalCoins.toLocaleString()}</Text>
            </View>

            <Text style={styles.activityTitle}>Recent Activity</Text>
            <FlatList
              data={activities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.activityRow}>
                  <Text style={styles.activityLabel}>{item.title}</Text>
                  <Text style={styles.activityPoints}>+ {item.points}</Text>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.divider} />}
            />

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // The overlay is now just for layout
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    // REMOVED background color from here
  },
  // ... all other container/header/text styles remain the same
  container: {
    width: '100%',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalCoinsLabel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 24,
  },
  totalCoinsValue: {
    color: '#FFD700',
    fontSize: 52,
    fontWeight: '800',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
totalCoinsValue: {
    color: '#FFD700',
    fontSize: 52,
    fontWeight: '800',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  activityTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityLabel: {
    color: '#E2E8F0',
    fontSize: 16,
  },
  activityPoints: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  closeButton: {
    marginTop: 32,
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#64748B',
    fontSize: 16,
     fontWeight: '600',
      },
    });