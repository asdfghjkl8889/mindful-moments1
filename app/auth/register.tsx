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

const AVATARS = ["🐢", "🌸", "🦋", "🌿", "🌻", "🐬", "🦚", "🌈"];
const AVATAR_KEYS = ["turtle", "lotus", "butterfly", "leaf", "sunflower", "dolphin", "peacock", "rainbow"];

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was your childhood nickname?",
  "What is your mother's maiden name?",
  "What was the name of your elementary school?",
  "What was your favorite childhood book?",
  "What is the name of your oldest sibling?",
  "What street did you grow up on?",
];

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarIdx, setAvatarIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryQuestion, setRecoveryQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [recoveryAnswer, setRecoveryAnswer] = useState("");
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleRegister = async () => {
    setError("");
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!email.trim()) { setError("Please enter your email"); return; }
    if (!password) { setError("Please enter a password"); return; }
    if (showRecovery && !recoveryAnswer.trim()) {
      setError("Please enter an answer for your security question"); return;
    }

    setLoading(true);
    try {
      await register(
        email.trim(), name.trim(), password, AVATAR_KEYS[avatarIdx],
        showRecovery ? recoveryQuestion : undefined,
        showRecovery ? recoveryAnswer.trim() : undefined,
      );
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
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

          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.sub}>Start your mindfulness journey today</Text>

          {/* Avatar picker */}
          <Text style={styles.label}>Choose your avatar</Text>
          <View style={styles.avatarRow}>
            {AVATARS.map((a, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setAvatarIdx(i)}
                style={[styles.avatarBtn, avatarIdx === i && styles.avatarBtnSelected]}
              >
                <Text style={styles.avatarEmoji}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fields */}
          <Text style={styles.label}>Your name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Alex"
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCapitalize="words"
            returnKeyType="next"
          />

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
            placeholder="At least 6 characters"
            placeholderTextColor="rgba(255,255,255,0.4)"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          {/* Optional security question */}
          <TouchableOpacity
            onPress={() => setShowRecovery(!showRecovery)}
            style={styles.recoveryToggle}
            activeOpacity={0.8}
          >
            <Text style={styles.recoveryToggleText}>
              {showRecovery ? "▼" : "▶"} Set a recovery question{" "}
              <Text style={{ color: "rgba(255,255,255,0.45)", fontFamily: "Nunito_400Regular" }}>
                (recommended)
              </Text>
            </Text>
          </TouchableOpacity>

          {showRecovery && (
            <View style={styles.recoveryBox}>
              <Text style={styles.recoveryHint}>
                🔐 If you forget your password, you'll answer this to recover your account.
              </Text>

              <Text style={styles.label}>Security question</Text>
              <TouchableOpacity
                style={styles.questionSelector}
                onPress={() => setShowQuestionPicker(!showQuestionPicker)}
              >
                <Text style={styles.questionSelectorText} numberOfLines={2}>{recoveryQuestion}</Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>
                  Tap to change ▼
                </Text>
              </TouchableOpacity>

              {showQuestionPicker && (
                <View style={styles.questionList}>
                  {SECURITY_QUESTIONS.map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={[
                        styles.questionOption,
                        recoveryQuestion === q && styles.questionOptionSelected,
                      ]}
                      onPress={() => { setRecoveryQuestion(q); setShowQuestionPicker(false); }}
                    >
                      <Text style={[
                        styles.questionOptionText,
                        recoveryQuestion === q && { color: "#fff", fontFamily: "Nunito_600SemiBold" },
                      ]}>
                        {q}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Your answer</Text>
              <TextInput
                style={styles.input}
                value={recoveryAnswer}
                onChangeText={setRecoveryAnswer}
                placeholder="Answer (not case sensitive)"
                placeholderTextColor="rgba(255,255,255,0.4)"
                returnKeyType="done"
              />
            </View>
          )}

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#1a4a47" />
            ) : (
              <Text style={styles.btnText}>Create Account →</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/auth/login")} style={styles.switchLink}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchBold}>Sign in</Text>
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
  },
  back: { marginBottom: 24 },
  backText: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: "rgba(255,255,255,0.8)",
  },
  heading: {
    fontSize: 30,
    fontFamily: "Nunito_800ExtraBold",
    color: "#fff",
    marginBottom: 6,
  },
  sub: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  avatarBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarBtnSelected: {
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  avatarEmoji: { fontSize: 24 },
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
  recoveryToggle: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderStyle: "dashed",
  },
  recoveryToggleText: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: "rgba(255,255,255,0.75)",
  },
  recoveryBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  recoveryHint: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.65)",
    marginBottom: 16,
    lineHeight: 18,
  },
  questionSelector: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  questionSelectorText: {
    fontSize: 14,
    fontFamily: "Nunito_500Medium",
    color: "#fff",
    lineHeight: 20,
  },
  questionList: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  questionOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  questionOptionSelected: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  questionOptionText: {
    fontSize: 13,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 18,
  },
});
