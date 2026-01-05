import { useLogin } from "@privy-io/expo/ui";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Gradients } from "@/lib/theme";

export default function PrivyUI() {
  const [error, setError] = useState("");

  const { login } = useLogin();

  const handleLogin = () => {
    setError("");
    login({ loginMethods: ["email"] })
      .then((session) => {
        console.log("User logged in", session.user);
      })
      .catch((err) => {
        setError(JSON.stringify(err.error || err) as string);
      });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleLogin}
        style={styles.buttonContainer}
      >
        <LinearGradient
          colors={Gradients.primaryGlow as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <MaterialCommunityIcons name="email-outline" size={24} color="#FFF" style={styles.icon} />
          <Text style={styles.buttonText}>Continue with Email</Text>
        </LinearGradient>
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  buttonContainer: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255, 75, 75, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
});
