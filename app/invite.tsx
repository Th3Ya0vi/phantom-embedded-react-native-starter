import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from './styles/colors';
import { Spacing } from './styles/spacing';
import { Typography } from './styles/typography';

export default function InviteScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateInviteCode = async () => {
    setLoading(true);
    setError(null);

    // ⏳ Simulate API call
    setTimeout(() => {
      setLoading(false);

      // ✅ TEMP LOGIC (replace with API)
      if (code.trim().toUpperCase() === 'GSM1234') {
        router.replace('/(tabs)');
      } else {
        setError('Invalid invite code. Please request one.');
      }
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>You’re Invited</Text>
        <Text style={styles.subtitle}>
          Enter your invitation code to access GeSIM
        </Text>

        {/* Input */}
        <TextInput
          placeholder="Enter invite code"
          placeholderTextColor={Colors.textMuted}
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          style={styles.input}
        />

        {/* Error */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* CTA */}
        <Pressable
          style={[
            styles.primaryButton,
            !code && styles.disabledButton,
          ]}
          disabled={!code || loading}
          onPress={validateInviteCode}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryButtonText}>Continue</Text>
          )}
        </Pressable>

        {/* Secondary Action */}
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push('/request-invite')}
        >
          <Text style={styles.secondaryText}>
            Don’t have a code? Request an invite
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },

  title: {
    color: Colors.textPrimary,
    ...Typography.h1,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },

  input: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 1.5,
  },

  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  primaryButton: {
    backgroundColor: '#B7B0F5',
    borderRadius: 20,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },

  secondaryButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  secondaryText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
