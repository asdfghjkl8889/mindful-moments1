import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeInDown,
  FadeIn,
  Easing,
} from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";

interface Exercise {
  id: string;
  title: string;
  tagline: string;
  seconds: number;
  icon: string;
  color: string;
  bg: string;
  steps: { at: number; text: string }[];
  science: string;
}

const EXERCISES: Exercise[] = [
  {
    id: "box_breath",
    title: "Box Breath",
    tagline: "Reset in 60 seconds",
    seconds: 64,
    icon: "square-outline",
    color: "#4DB6AC",
    bg: "#E0F7FA",
    steps: [
      { at: 0, text: "Let's do box breathing. Inhale for 4 counts." },
      { at: 5, text: "Hold for 4 counts." },
      { at: 9, text: "Exhale slowly for 4 counts." },
      { at: 13, text: "Hold for 4 counts." },
      { at: 17, text: "Inhale again for 4 counts." },
      { at: 22, text: "Hold for 4." },
      { at: 26, text: "Breathe out for 4." },
      { at: 30, text: "Hold for 4." },
      { at: 34, text: "One more cycle. Breathe in." },
      { at: 39, text: "Hold." },
      { at: 43, text: "Breathe out slowly." },
      { at: 47, text: "Hold and notice how calm you feel." },
      { at: 52, text: "Return to natural breathing. Beautiful work." },
    ],
    science: "Box breathing is used by Navy SEALs to reset under pressure. It activates your parasympathetic nervous system in seconds.",
  },
  {
    id: "grounding",
    title: "5-4-3-2-1 Ground",
    tagline: "Anchor to the present",
    seconds: 75,
    icon: "footsteps",
    color: "#66BB6A",
    bg: "#E8F5E9",
    steps: [
      { at: 0, text: "Let's ground you in this moment. Look around you." },
      { at: 4, text: "Name 5 things you can see. Take your time." },
      { at: 18, text: "Good. Now notice 4 things you can physically feel." },
      { at: 32, text: "Now 3 things you can hear. Really listen." },
      { at: 45, text: "2 things you can smell — even faint scents count." },
      { at: 55, text: "And 1 thing you can taste." },
      { at: 63, text: "You are HERE. Fully present. Safe in this moment." },
    ],
    science: "The 5-4-3-2-1 technique activates multiple senses simultaneously, interrupting the anxiety cycle and returning awareness to the present.",
  },
  {
    id: "gratitude_burst",
    title: "Gratitude Burst",
    tagline: "Shift your state fast",
    seconds: 60,
    icon: "heart",
    color: "#FF8A80",
    bg: "#FCE4EC",
    steps: [
      { at: 0, text: "A gratitude burst rewires your brain in 60 seconds. Let's go." },
      { at: 5, text: "Think of one person you're grateful for. Picture their face." },
      { at: 16, text: "Feel appreciation for something simple — warm water, food, safety." },
      { at: 28, text: "What's one thing that went right today, no matter how small?" },
      { at: 40, text: "Place your hand on your heart. Feel it beating — it's been working for you every second." },
      { at: 52, text: "Gratitude unlocked. Carry this warmth forward." },
    ],
    science: "Research shows that 60 seconds of genuine gratitude increases serotonin production and reduces cortisol by up to 23%.",
  },
  {
    id: "cold_splash",
    title: "Cold Splash Reset",
    tagline: "Instant nervous system reset",
    seconds: 45,
    icon: "water",
    color: "#42A5F5",
    bg: "#E3F2FD",
    steps: [
      { at: 0, text: "This one requires a sink. Go to the nearest faucet." },
      { at: 6, text: "Run cold water." },
      { at: 10, text: "Splash cold water on your face 3 times. The cold activates your dive reflex." },
      { at: 20, text: "Pat dry. Notice how alert and clear your mind feels." },
      { at: 28, text: "Hold cold water on your wrists for 10 seconds." },
      { at: 38, text: "Your heart rate has slowed. You're reset." },
    ],
    science: "Cold water on the face activates the mammalian dive reflex, instantly slowing heart rate and calming the nervous system.",
  },
  {
    id: "power_shake",
    title: "Body Shake",
    tagline: "Release stored tension",
    seconds: 50,
    icon: "body",
    color: "#FFD54F",
    bg: "#FFF8E1",
    steps: [
      { at: 0, text: "Stand up if you can. We're going to release tension from your body." },
      { at: 5, text: "Shake your hands vigorously — like you're shaking off water." },
      { at: 13, text: "Shake your arms, shoulders, loosen your jaw." },
      { at: 22, text: "Gently bounce on your knees. Let your whole body loosen up." },
      { at: 33, text: "Take a deep breath in and reach your arms up high." },
      { at: 39, text: "Exhale forcefully and drop your arms. Let everything go." },
      { at: 45, text: "Stand still. Notice the warmth and aliveness in your body." },
    ],
    science: "Shaking is how animals discharge stress after a threat. Humans suppress this reflex — releasing it physically completes the stress cycle.",
  },
  {
    id: "self_compassion",
    title: "Self-Compassion Pause",
    tagline: "Be your own best friend",
    seconds: 70,
    icon: "rose",
    color: "#B39DDB",
    bg: "#F3E5F5",
    steps: [
      { at: 0, text: "Place both hands on your heart. Feel the warmth." },
      { at: 8, text: "Say to yourself: 'This is a moment of suffering.'" },
      { at: 16, text: "And: 'Suffering is a part of life. I am not alone.'" },
      { at: 26, text: "Now: 'May I be kind to myself in this moment.'" },
      { at: 35, text: "Think of someone you deeply love. Now offer that same love to yourself." },
      { at: 48, text: "You deserve the same compassion you give others. Always." },
      { at: 58, text: "Rest here. You are enough exactly as you are." },
    ],
    science: "Dr. Kristin Neff's research shows self-compassion reduces anxiety, depression, and perfectionism while increasing resilience and emotional wellbeing.",
  },
];

function TimerRing({ progress, color, size = 120 }: { progress: number; color: string; size?: number }) {
  const strokeW = 8;
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - progress);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeW, borderColor: color + "30",
          position: "absolute",
        }}
      />
      <View
        style={{
          width: size - strokeW * 2, height: size - strokeW * 2,
          borderRadius: (size - strokeW * 2) / 2,
          borderWidth: strokeW,
          borderColor: color,
          borderStyle: "solid",
          position: "absolute",
          opacity: progress,
        }}
      />
    </View>
  );
}

export default function QuickCalmScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const [active, setActive] = useState<Exercise | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [done, setDone] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spokenRef = useRef<Set<number>>(new Set());
  const totalRef = useRef(0);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      Speech.stop();
    };
  }, []);

  const startExercise = (ex: Exercise) => {
    setActive(ex);
    setTimeLeft(ex.seconds);
    setDone(false);
    setCurrentStep("");
    spokenRef.current.clear();
    totalRef.current = ex.seconds;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    const firstStep = ex.steps[0];
    if (firstStep) {
      spokenRef.current.add(0);
      setCurrentStep(firstStep.text);
      Speech.speak(firstStep.text, { rate: 0.84, pitch: 1.0 });
      setTimeout(() => setCurrentStep(""), Math.max(firstStep.text.length * 70, 4000));
    }

    let elapsed = 0;
    intervalRef.current = setInterval(() => {
      elapsed++;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setDone(true);
          pulseScale.value = withTiming(1, { duration: 300 });
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Speech.speak("Well done. Take a deep breath and carry this calm with you.", { rate: 0.84, pitch: 1.0 });
          return 0;
        }
        return prev - 1;
      });

      for (const step of ex.steps) {
        if (step.at <= elapsed && step.at >= elapsed - 1 && !spokenRef.current.has(step.at)) {
          spokenRef.current.add(step.at);
          setCurrentStep(step.text);
          Speech.speak(step.text, { rate: 0.84, pitch: 1.0 });
          setTimeout(() => setCurrentStep(""), Math.max(step.text.length * 70, 4000));
          break;
        }
      }
    }, 1000);
  };

  const stopExercise = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    Speech.stop();
    pulseScale.value = withTiming(1, { duration: 300 });
    setActive(null);
    setDone(false);
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const progress = active ? 1 - timeLeft / totalRef.current : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={active ? [active.bg, "#FFFFFF"] : ["#E8F5E9", "#FFF8E1", "#FCE4EC"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}>
        <Pressable
          onPress={() => { active ? stopExercise() : router.back(); }}
          hitSlop={12}
        >
          <Ionicons name={active ? "close" : "chevron-back"} size={26} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.title, { color: colors.text }]}>
            {active ? active.title : "Quick Calm"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {active ? active.tagline : "60-second mindfulness resets"}
          </Text>
        </View>
      </View>

      {!active ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40, gap: 12, paddingTop: 4,
          }}
        >
          <View style={[styles.introBanner, { backgroundColor: "rgba(255,255,255,0.85)" }]}>
            <Ionicons name="flash" size={20} color="#FFD54F" />
            <Text style={[styles.introText, { color: colors.text }]}>
              Feeling overwhelmed? Pick an exercise and let your voice guide you back to calm in under 90 seconds.
            </Text>
          </View>

          {EXERCISES.map((ex, i) => (
            <Animated.View
              key={ex.id}
              entering={Platform.OS !== "web" ? FadeInDown.delay(i * 80).duration(400) : undefined}
            >
              <Pressable
                onPress={() => startExercise(ex)}
                style={({ pressed }) => [styles.exCard, { backgroundColor: ex.bg, opacity: pressed ? 0.88 : 1 }]}
              >
                <View style={[styles.exIcon, { backgroundColor: ex.color + "25" }]}>
                  <Ionicons name={ex.icon as any} size={26} color={ex.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exTitle, { color: "#1A1A1A" }]}>{ex.title}</Text>
                  <Text style={[styles.exTagline, { color: "#616161" }]}>{ex.tagline}</Text>
                  <Text style={[styles.exScience, { color: "#757575" }]} numberOfLines={2}>{ex.science}</Text>
                </View>
                <View style={styles.exRight}>
                  <Text style={[styles.exTime, { color: ex.color }]}>{ex.seconds}s</Text>
                  <Ionicons name="play-circle" size={30} color={ex.color} />
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.activeWrap}>
          <Animated.View style={[styles.timerWrap, pulseStyle]}>
            <View
              style={[styles.timerCircle, {
                borderColor: active.color + "40",
                backgroundColor: done ? active.color + "15" : "rgba(255,255,255,0.8)",
              }]}
            >
              {done ? (
                <Animated.View
                  entering={Platform.OS !== "web" ? FadeIn.duration(400) : undefined}
                  style={styles.doneWrap}
                >
                  <Ionicons name="checkmark-circle" size={52} color={active.color} />
                  <Text style={[styles.doneText, { color: "#1A1A1A" }]}>Complete!</Text>
                </Animated.View>
              ) : (
                <>
                  <Text style={[styles.timerNum, { color: active.color }]}>{timeLeft}</Text>
                  <Text style={[styles.timerSec, { color: "#9E9E9E" }]}>seconds</Text>
                </>
              )}
            </View>
          </Animated.View>

          <View style={[styles.progressBarBg, { backgroundColor: active.color + "20", marginHorizontal: 40 }]}>
            <Animated.View
              style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: active.color }]}
            />
          </View>

          {!!currentStep && !done && (
            <Animated.View
              entering={Platform.OS !== "web" ? FadeIn.duration(300) : undefined}
              style={[styles.stepCard, { backgroundColor: "rgba(255,255,255,0.95)" }]}
            >
              <Ionicons name="mic" size={15} color={active.color} />
              <Text style={[styles.stepText, { color: "#1A1A1A" }]}>{currentStep}</Text>
            </Animated.View>
          )}

          {!done && (
            <View style={[styles.scienceCard, { backgroundColor: "rgba(255,255,255,0.7)" }]}>
              <Ionicons name="school-outline" size={14} color="#9E9E9E" />
              <Text style={[styles.scienceText, { color: "#757575" }]}>{active.science}</Text>
            </View>
          )}

          <View style={styles.activeControls}>
            {done ? (
              <>
                <Pressable
                  onPress={stopExercise}
                  style={({ pressed }) => [
                    styles.ctrlBtn,
                    { backgroundColor: active.color, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.ctrlBtnText}>Try Another</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={stopExercise}
                style={({ pressed }) => [
                  styles.ctrlBtnOutline,
                  { borderColor: active.color, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="stop" size={18} color={active.color} />
                <Text style={[styles.ctrlBtnOutlineText, { color: active.color }]}>Stop</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 24 },
  subtitle: { fontFamily: "Nunito_400Regular", fontSize: 13, marginTop: 2 },
  introBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderRadius: 14, padding: 14,
  },
  introText: { flex: 1, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 19 },
  exCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 18, padding: 16,
  },
  exIcon: {
    width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center",
  },
  exTitle: { fontFamily: "Nunito_700Bold", fontSize: 16 },
  exTagline: { fontFamily: "Nunito_500Medium", fontSize: 12, marginTop: 2 },
  exScience: { fontFamily: "Nunito_400Regular", fontSize: 11, lineHeight: 16, marginTop: 4 },
  exRight: { alignItems: "center", gap: 4 },
  exTime: { fontFamily: "Nunito_700Bold", fontSize: 12 },
  activeWrap: { flex: 1, alignItems: "center", paddingTop: 20, gap: 20 },
  timerWrap: { alignItems: "center", justifyContent: "center" },
  timerCircle: {
    width: 160, height: 160, borderRadius: 80, borderWidth: 3,
    alignItems: "center", justifyContent: "center",
  },
  timerNum: { fontFamily: "Nunito_800ExtraBold", fontSize: 52 },
  timerSec: { fontFamily: "Nunito_500Medium", fontSize: 14, marginTop: -4 },
  doneWrap: { alignItems: "center", gap: 8 },
  doneText: { fontFamily: "Nunito_700Bold", fontSize: 22 },
  progressBarBg: {
    height: 6, borderRadius: 3, overflow: "hidden", alignSelf: "stretch",
  },
  progressBarFill: { height: "100%", borderRadius: 3 },
  stepCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    borderRadius: 14, padding: 14, marginHorizontal: 24, alignSelf: "stretch",
  },
  stepText: { flex: 1, fontFamily: "Nunito_500Medium", fontSize: 14, lineHeight: 20 },
  scienceCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    borderRadius: 14, padding: 12, marginHorizontal: 24, alignSelf: "stretch",
  },
  scienceText: { flex: 1, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 17 },
  activeControls: { paddingBottom: 40 },
  ctrlBtn: {
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16,
  },
  ctrlBtnText: { fontFamily: "Nunito_700Bold", fontSize: 16, color: "#fff" },
  ctrlBtnOutline: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 16, borderWidth: 2,
  },
  ctrlBtnOutlineText: { fontFamily: "Nunito_700Bold", fontSize: 15 },
});
