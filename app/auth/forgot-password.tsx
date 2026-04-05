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
import { getApiUrl } from "@/lib/query-client";

type Step = "email" | "answer" | "done";

function apiUrl(path: string) {
  return new URL(path, getApiUrl()).toString();
}

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleEmailSubmit = async () => {
    setError("");
    if (!email.trim()) { setError("Please enter your email"); return; }

    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/auth/security-question?email=${encodeURIComponent(email.trim())}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setQuestion(data.question);
      setStep("answer");
    } catch (err: any) {
      setError(err.message || "Could not find account");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError("");
    if (!answer.trim()) { setError("Please answer the security question"); return; }
    if (!newPassword) { setError("Please enter a new password"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }

    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), answer: answer.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Reset failed. Please try again.");
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
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {step === "email" && (
            <>
              <Text style={styles.lockEmoji}>🔐</Text>
              <Text style={styles.heading}>Forgot Password?</Text>
              <Text style={styles.sub}>
                Enter your email and we'll ask your security question to verify it's you.
              </Text>

              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.4)"
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="done"
                onSubmitEditing={handleEmailSubmit}
              />

              {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.6 }]}
                onPress={handleEmailSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color="#1a4a47" /> : <Text style={styles.btnText}>Continue →</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === "answer" && (
            <>
              <Text style={styles.lockEmoji}>🛡️</Text>
              <Text style={styles.heading}>Security Question</Text>
              <Text style={styles.sub}>Answer your security question, then set a new password.</Text>

              <View style={styles.questionBox}>
                <Text style={styles.questionText}>{question}</Text>
              </View>

              <Text style={styles.label}>Your answer</Text>
              <TextInput
                style={styles.input}
                value={answer}
                onChangeText={setAnswer}
                placeholder="Your answer (not case sensitive)"
                placeholderTextColor="rgba(255,255,255,0.4)"
                returnKeyType="next"
              />

              <Text style={styles.label}>New password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 6 characters"
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry
                returnKeyType="next"
              />

              <Text style={styles.label}>Confirm new password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat your new password"
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />

              {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.6 }]}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color="#1a4a47" /> : <Text style={styles.btnText}>Reset Password →</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === "done" && (
            <View style={styles.successWrap}>
              <Text style={styles.successEmoji}>✅</Text>
              <Text style={styles.heading}>Password Reset!</Text>
              <Text style={styles.sub}>Your password has been updated. Sign in with your new password.</Text>

              <TouchableOpacity
                style={[styles.btn, { marginTop: 32 }]}
                onPress={() => router.replace("/auth/login")}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>Sign In →</Text>
              </TouchableOpacity>
            </View>
          )}
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
  lockEmoji: {
    fontSize: 56,
    textAlign: "center",
    marginBottom: 16,
  },
  heading: {
    fontSize: 28,
    fontFamily: "Nunito_800ExtraBold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
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
  questionBox: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  questionText: {
    fontSize: 15,
    fontFamily: "Nunito_600SemiBold",
    color: "#fff",
    textAlign: "center",
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
  successWrap: {
    alignItems: "center",
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
});
