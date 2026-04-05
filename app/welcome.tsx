import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const FEATURES = [
  { emoji: "🧘", label: "Guided Meditation" },
  { emoji: "📓", label: "Gratitude Journal" },
  { emoji: "🌱", label: "Mood Garden" },
  { emoji: "🎮", label: "Mindful Games" },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const turtleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(turtleAnim, { toValue: -8, duration: 1600, useNativeDriver: true }),
        Animated.timing(turtleAnim, { toValue: 8, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <LinearGradient
      colors={["#1a4a47", "#26A69A", "#4DB6AC", "#80CBC4"]}
      locations={[0, 0.35, 0.7, 1]}
      style={styles.container}
    >
      {/* Soft circles for depth */}
      <View style={[styles.circle1, { opacity: 0.15 }]} />
      <View style={[styles.circle2, { opacity: 0.1 }]} />

      <Animated.View
        style={[
          styles.content,
          { paddingTop: topPad + 20, paddingBottom: bottomPad + 20 },
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Turtle mascot */}
        <Animated.Text
          style={[styles.turtle, { transform: [{ translateY: turtleAnim }] }]}
        >
          🐢
        </Animated.Text>

        <Text style={styles.appName}>Mindful Moments</Text>
        <Text style={styles.tagline}>Your daily wellness sanctuary</Text>

        {/* Feature pills */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.pill}>
              <Text style={styles.pillEmoji}>{f.emoji}</Text>
              <Text style={styles.pillText}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/auth/register")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Create Free Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push("/auth/login")}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.privacy}>
          Your data is saved securely to the cloud ☁️
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  circle1: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: "#fff",
    top: -width * 0.4,
    left: -width * 0.1,
  },
  circle2: {
    position: "absolute",
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: "#fff",
    bottom: -width * 0.2,
    right: -width * 0.2,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  turtle: {
    fontSize: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 34,
    fontFamily: "Nunito_800ExtraBold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 36,
  },
  features: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 48,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  pillEmoji: {
    fontSize: 16,
  },
  pillText: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: "#fff",
  },
  buttons: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: "#1a4a47",
  },
  secondaryBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
  },
  secondaryBtnText: {
    fontSize: 17,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  privacy: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
});
