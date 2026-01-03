// File: app/(tabs)/_layout.tsx
import React, { useEffect } from 'react';
import 'react-native-get-random-values'

import { Ionicons } from '@expo/vector-icons'; // We use this for icons
import { Redirect, Tabs } from 'expo-router';
import { useSession } from '@/lib/session/SessionContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuthActions } from '@/hooks/useAuthActions'; // Import your robust logout
import { Colors } from '@/lib/theme';
import { useAccounts } from '@phantom/react-native-sdk';

export default function TabLayout() {
     const { isAuthenticated, isHydrated } = useSession();
       const { isConnected } = useAccounts();
       const { logout } = useAuthActions(); // This is the version that handles API + Wallet + Redirect

     // 1. SECURITY SYNC: Automatically log out if wallet is disconnected
      useEffect(() => {
          if (isHydrated && !isConnected && isAuthenticated) {
            console.log("[SECURITY] Wallet disconnected manually. Wiping local session...");
         //   logout(); // Just clear the local token
          }
        }, [isConnected, isAuthenticated, isHydrated]);

        // 1. Wait for storage
        if (!isHydrated) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2F66F6" />
            </View>
          );
        }

        // 2. THE GATEKEEPER
        // If no token exists, the user is NOT allowed in this folder. Redirect to Home.
        if (!isAuthenticated) {
          console.log("[LAYOUT] No session. Redirecting to home.");
          return <Redirect href="/home" />;
        }


  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2F66F6', // Using the purple from your app.json
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Shows the title at the top of the screen
        tabBarStyle: {
          backgroundColor: '#1a1a1a', // Dark theme background
          borderTopWidth: 0,
        },
        headerStyle: {
            backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
      }}
    >
      {/* 1. Dashboard Tab */}
      <Tabs.Screen
        name="index" // This links to index.tsx in this folder
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* 2. Data Plans Tab */}
      <Tabs.Screen
        name="plans" // This links to plans.tsx
        options={{
          title: 'Data Plans',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cellular" size={size} color={color} />
          ),
        }}
      />

      {/* 3. Wallet Tab */}
      <Tabs.Screen
        name="wallet" // This links to wallet.tsx
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />

      {/* 4. Settings Tab */}
      <Tabs.Screen
        name="settings" // This links to settings.tsx
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
