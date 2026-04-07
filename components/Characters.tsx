import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  FadeIn,
  Easing,
} from "react-native-reanimated";

const { width: W, height: H } = Dimensions.get("window");

// ─── Character Definitions ────────────────────────────────────────────────────

export type CharacterKey = "larry" | "sage" | "luna" | "blaze";

export const CHARACTERS: Record<
  CharacterKey,
  { name: string; emoji: string; color: string; bg: string; role: string }
> = {
  larry: {
    name: "Larry",
    emoji: "🐢",
    color: "#00897B",
    bg: "#E0F2F1",
    role: "Your mindfulness buddy",
  },
  sage: {
    name: "Sage",
    emoji: "🦥",
    color: "#7B1FA2",
    bg: "#F3E5F5",
    role: "Your calm guide",
  },
  luna: {
    name: "Luna",
    emoji: "🦉",
    color: "#E65100",
    bg: "#FFF3E0",
    role: "Your journaling friend",
  },
  blaze: {
    name: "Blaze",
    emoji: "🦊",
    color: "#BF360C",
    bg: "#FBE9E7",
    role: "Your challenge champion",
  },
};

export const LARRY_MOOD_MESSAGES: Record<string, string> = {
  happy:
    "You are absolutely glowing today! That energy is contagious. Keep shining! 💚",
  good: "Great day ahead of you! Steady and strong, just like a turtle. You have got this!",
  neutral:
    "Slow and steady wins the race. Even calm, ordinary days have real value.",
  sad: "Hey, I am right here with you. It is okay to not be okay. Gentle days count too.",
  stressed:
    "Let us take one slow breath together. One thing at a time. You have handled hard days before.",
};

// ─── CharacterBubble ──────────────────────────────────────────────────────────

export function CharacterBubble({
  character = "larry",
  message,
  size = 72,
  showName = true,
  animation = "bob",
}: {
  character?: CharacterKey;
  message: string;
  size?: number;
  showName?: boolean;
  animation?: "bob" | "bounce" | "sway";
}) {
  const { name, emoji, color, bg } = CHARACTERS[character];
  const anim = useSharedValue(0);

  useEffect(() => {
    if (animation === "bob") {
      anim.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(6, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else if (animation === "bounce") {
      anim.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 380, easing: Easing.out(Easing.ease) }),
          withTiming(2, { duration: 260, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      anim.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    }
  }, [animation]);

  const animStyle = useAnimatedStyle(() => ({
    transform:
      animation === "sway"
        ? [{ rotate: `${anim.value}deg` }]
        : [{ translateY: anim.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(500)} style={cbStyles.row}>
      <View style={cbStyles.charCol}>
        <Animated.View style={animStyle}>
          <View
            style={[
              cbStyles.charCircle,
              { backgroundColor: bg, width: size, height: size, borderRadius: size / 2 },
            ]}
          >
            <Text style={{ fontSize: size * 0.52 }}>{emoji}</Text>
          </View>
        </Animated.View>
        {showName && (
          <Text style={[cbStyles.charName, { color }]}>{name}</Text>
        )}
      </View>
      <View style={[cbStyles.bubble, { borderLeftColor: color }]}>
        <Text style={[cbStyles.bubbleLabel, { color }]}>{name} says</Text>
        <Text style={cbStyles.bubbleText}>{message}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  "#FF6B6B", "#FFE66D", "#4ECDC4", "#A8E6CF",
  "#FF8E53", "#C3A6FF", "#FF85A2", "#6BCB77",
];
const CONFETTI_N = 32;

function ConfettiPiece({ index }: { index: number }) {
  const x      = (index / CONFETTI_N) * W + (Math.random() * 24 - 12);
  const delay  = Math.random() * 900;
  const dur    = 2000 + Math.random() * 1200;
  const color  = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const sz     = 6 + Math.random() * 10;
  const circle = index % 3 === 0;

  const y   = useSharedValue(-40);
  const rot = useSharedValue(0);
  const op  = useSharedValue(0);

  useEffect(() => {
    op.value  = withDelay(delay, withTiming(1, { duration: 80 }));
    y.value   = withDelay(delay, withTiming(H + 80, { duration: dur }));
    rot.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 700 }), -1, false),
    );
  }, []);

  const st = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: x,
    top: y.value,
    width: sz,
    height: circle ? sz : sz * 0.42,
    borderRadius: circle ? sz / 2 : 2,
    backgroundColor: color,
    opacity: op.value,
    transform: [{ rotate: `${rot.value}deg` }],
  }));

  return <Animated.View style={st} />;
}

// ─── CelebrationOverlay ───────────────────────────────────────────────────────

export function CelebrationOverlay({
  visible,
  character = "larry",
  title,
  message,
  onDismiss,
}: {
  visible: boolean;
  character?: CharacterKey;
  title: string;
  message: string;
  onDismiss: () => void;
}) {
  const { name, emoji, color, bg } = CHARACTERS[character];
  const bounce = useSharedValue(0);
  const scale  = useSharedValue(0.3);

  useEffect(() => {
    if (visible) {
      scale.value  = withSpring(1, { damping: 12, stiffness: 160 });
      bounce.value = withDelay(
        420,
        withRepeat(
          withSequence(
            withTiming(-22, { duration: 320, easing: Easing.out(Easing.ease) }),
            withTiming(0,   { duration: 260, easing: Easing.in(Easing.ease) }),
            withTiming(-9,  { duration: 200 }),
            withTiming(0,   { duration: 180 }),
          ),
          3,
          false,
        ),
      );
    } else {
      scale.value  = 0.3;
      bounce.value = 0;
    }
  }, [visible]);

  const charStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={celStyles.overlay}>
        {Array.from({ length: CONFETTI_N }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
        <Animated.View style={[celStyles.card, cardStyle]}>
          <Animated.View style={charStyle}>
            <View style={[celStyles.charCircle, { backgroundColor: bg }]}>
              <Text style={celStyles.charEmoji}>{emoji}</Text>
            </View>
          </Animated.View>
          <Text style={[celStyles.charLabel, { color }]}>{name} says...</Text>
          <Text style={celStyles.title}>{title}</Text>
          <Text style={celStyles.message}>{message}</Text>
          <TouchableOpacity
            style={[celStyles.btn, { backgroundColor: color }]}
            onPress={onDismiss}
            activeOpacity={0.85}
          >
            <Text style={celStyles.btnText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── MiniCharacter ────────────────────────────────────────────────────────────
// Small floating character for empty states

export function MiniCharacter({
  character = "luna",
  message,
}: {
  character?: CharacterKey;
  message: string;
}) {
  const { name, emoji, color, bg } = CHARACTERS[character];
  const bob = useSharedValue(0);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={miniStyles.wrapper}
    >
      <Animated.View style={bobStyle}>
        <View style={[miniStyles.circle, { backgroundColor: bg }]}>
          <Text style={miniStyles.emoji}>{emoji}</Text>
        </View>
      </Animated.View>
      <Text style={[miniStyles.name, { color }]}>{name}</Text>
      <View style={[miniStyles.bubble, { borderColor: color + "40" }]}>
        <Text style={miniStyles.bubbleText}>{message}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cbStyles = StyleSheet.create({
  row:       { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 6 },
  charCol:   { alignItems: "center", gap: 5 },
  charCircle:{
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  charName:  { fontFamily: "Nunito_700Bold", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  bubble:    {
    flex: 1, backgroundColor: "#fff", borderRadius: 18,
    borderTopLeftRadius: 4, padding: 14, borderLeftWidth: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  bubbleLabel:{ fontFamily: "Nunito_700Bold", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5, opacity: 0.7 },
  bubbleText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: "#333", lineHeight: 21 },
});

const celStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.62)",
    justifyContent: "center", alignItems: "center",
  },
  card: {
    backgroundColor: "#fff", borderRadius: 30, padding: 28, alignItems: "center",
    width: W * 0.84, maxWidth: 360,
    shadowColor: "#000", shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22, shadowRadius: 24, elevation: 20,
  },
  charCircle: { width: 104, height: 104, borderRadius: 52, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  charEmoji:  { fontSize: 58 },
  charLabel:  { fontFamily: "Nunito_700Bold", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  title:      { fontFamily: "Nunito_800ExtraBold", fontSize: 22, color: "#1A1A1A", textAlign: "center", marginBottom: 8 },
  message:    { fontFamily: "Nunito_400Regular", fontSize: 15, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  btn:        { borderRadius: 16, paddingVertical: 15, width: "100%", alignItems: "center" },
  btnText:    { fontFamily: "Nunito_700Bold", fontSize: 16, color: "#fff" },
});

const miniStyles = StyleSheet.create({
  wrapper:    { alignItems: "center", paddingVertical: 24, gap: 6 },
  circle:     { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  emoji:      { fontSize: 48 },
  name:       { fontFamily: "Nunito_700Bold", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  bubble:     { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1.5, padding: 14, maxWidth: 280, marginTop: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  bubbleText: { fontFamily: "Nunito_400Regular", fontSize: 14, color: "#444", lineHeight: 21, textAlign: "center" },
});
