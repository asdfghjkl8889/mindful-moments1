import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) { setError("Please enter your email"); return; }
    if (!password) { setError("Please enter your password"); return; }

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#1a4a47", "#26A69A"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.turtle}>🐢</Text>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to continue your journey</Text>

          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            placeholderTextColor="rgba(255,255,255,0.4)"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#1a4a47" />
            ) : (
              <Text style={styles.btnText}>Sign In →</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/auth/forgot-password")}
            style={{ alignItems: "center", marginBottom: 16 }}
          >
            <Text style={[styles.switchText, { color: "rgba(255,255,255,0.55)" }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/auth/register")} style={styles.switchLink}>
            <Text style={styles.switchText}>
              Don't have an account? <Text style={styles.switchBold}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 28,
    flexGrow: 1,
    justifyContent: "center",
  },
  back: { position: "absolute", top: 0, left: 28 },
  backText: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: "rgba(255,255,255,0.8)",
  },
  turtle: {
    fontSize: 60,
    textAlign: "center",
    marginBottom: 16,
  },
  heading: {
    fontSize: 30,
    fontFamily: "Nunito_800ExtraBold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 6,
  },
  sub: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: "#fff",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  errorBox: {
    backgroundColor: "rgba(255,80,80,0.25)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.4)",
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Nunito_500Medium",
    color: "#ffcccc",
  },
  btn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  btnText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#1a4a47",
  },
  switchLink: { alignItems: "center" },
  switchText: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  switchBold: {
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
});
