import { useEffect } from 'react'
import 'react-native-get-random-values';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native'
import { usePrivy } from '@privy-io/expo'
import { Stack, useRouter, Redirect } from 'expo-router'
import PrivyUI from '@/components/PrivyUI';
import { Colors, Spacing, Typography } from '@/lib/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { useSession } from '@/lib/session/SessionContext'

// Get screen dimensions for positioning background elements
const { width, height } = Dimensions.get('window');

const AppLogo = require('@/assets/default.png')

export default function HomeScreen() {
  const { user, isReady } = usePrivy()
  const { isAuthenticated, user: sessionUser } = useSession()
  const router = useRouter()

  // 1. Redirect if already connected via Privy
  if (user) {
    return <Redirect href="/invite" />
  }

  // 2. Redirect if already authenticated via backend (fallback)
  if (isAuthenticated) {
    if (sessionUser?.inviteClaimed) {
      return <Redirect href="/(tabs)" />
    }
    return <Redirect href="/invite" />
  }

  return (
    <View style={styles.container}>
      {/* 1. Hide the Default Header */}
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* 2. Premium Gradient Background */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']} // Deep Midnight Blue Gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 3. Decorative Background Glows */}
      <View style={[styles.glowCircle, styles.glowTopLeft]} />
      <View style={[styles.glowCircle, styles.glowBottomRight]} />

      {/* 4. Main Content */}
      <View style={styles.content}>

        {/* Logo Container with Glassmorphism effect */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']}
            style={styles.logoGlass}
          >
            <Image source={AppLogo} style={styles.logo} resizeMode="contain" />
          </LinearGradient>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.appName}>GeSIM</Text>
          <Text style={styles.tagline}>Private Connectivity, Anywhere</Text>
          <Text style={styles.description}>
            For DeFI users, Journalists and anyone who values privacy</Text>
        </View>


        <View style={styles.actionContainer}>
          <PrivyUI />
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service.
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Fallback color
  },
  /* Background Glows */
  glowCircle: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    opacity: 0.2,
  },
  glowTopLeft: {
    top: -100,
    left: -100,
    backgroundColor: '#6366f1', // Indigo glow
  },
  glowBottomRight: {
    bottom: -50,
    right: -50,
    backgroundColor: '#2F66F6', // Brand Blue glow
  },

  /* Layout */
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },

  /* Logo Styling */
  logoContainer: {
    marginBottom: Spacing.xl,
    shadowColor: Colors?.primary || '#2F66F6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGlass: {
    width: 180,
    height: 180,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logo: {
    width: 160,
    height: 160,
  },

  /* Text Styling */
  textContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors?.primary || '#2F66F6', // Accent color
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: Colors?.textSecondary || '#A0A0A0',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '85%',
  },

  /* Bottom Actions */
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
  },
  footerText: {
    color: Colors?.textSecondary || '#666',
    fontSize: 12,
    marginTop: Spacing.lg,
  }
})
