
// File: app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // We use this for icons

export default function TabLayout() {
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
