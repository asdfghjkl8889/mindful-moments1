import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  useColorScheme,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { storage } from "@/lib/storage";

const DURATIONS = [
  { minutes: 1, label: "1 min" },
  { minutes: 3, label: "3 min" },
  { minutes: 5, label: "5 min" },
  { minutes: 10, label: "10 min" },
  { minutes: 15, label: "15 min" },
  { minutes: 20, label: "20 min" },
];

const GUIDED_MEDITATIONS = [
  {
    id: "calm",
    title: "Calm Mind",
    icon: "water",
    color: "#81D4FA",
    description: "Release tension and find inner peace",
    cues: [
      { time: 0, text: "Welcome to your calm mind meditation. Find a comfortable position and gently close your eyes." },
      { time: 10, text: "Take a deep breath in through your nose." },
      { time: 15, text: "And slowly exhale through your mouth." },
      { time: 25, text: "Let your shoulders drop. Release any tension you're holding." },
      { time: 40, text: "Breathe in deeply, filling your lungs completely." },
      { time: 46, text: "Hold for a moment." },
      { time: 50, text: "And release." },
      { time: 60, text: "Now settle into a natural breathing rhythm. Let each breath flow easily." },
      { time: 80, text: "If thoughts arise, acknowledge them gently and let them drift away like clouds." },
      { time: 110, text: "With each exhale, let go of any worry or stress." },
      { time: 140, text: "You are safe. You are calm. You are present." },
      { time: 180, text: "Continue breathing naturally. Feel the peace within you growing." },
      { time: 240, text: "Notice how your body feels. Allow yourself to sink deeper into relaxation." },
      { time: 300, text: "You're doing beautifully. Stay with this peaceful feeling." },
      { time: 420, text: "Let each breath deepen your sense of calm." },
      { time: 540, text: "Feel gratitude for this moment of stillness." },
      { time: 660, text: "You carry this peace with you always." },
    ],
  },
  {
    id: "body_scan",
    title: "Body Scan",
    icon: "body",
    color: "#B39DDB",
    description: "Awareness from head to toe",
    cues: [
      { time: 0, text: "Welcome to the body scan meditation. Lie down or sit comfortably." },
      { time: 10, text: "Take three deep breaths to settle in." },
      { time: 20, text: "Breathe in." },
      { time: 24, text: "Breathe out." },
      { time: 30, text: "Bring your attention to the top of your head. Notice any sensations there." },
      { time: 50, text: "Now move your awareness to your forehead and face. Soften your brow. Relax your jaw." },
      { time: 70, text: "Let your attention flow down to your neck and shoulders. Release any tightness." },
      { time: 100, text: "Now notice your arms and hands. Let them feel heavy and relaxed." },
      { time: 130, text: "Bring awareness to your chest. Feel it rise and fall with each breath." },
      { time: 160, text: "Move your attention to your belly. Let it be soft and relaxed." },
      { time: 200, text: "Now notice your lower back and hips. Breathe into any areas of tension." },
      { time: 240, text: "Let your awareness flow down through your legs. Feel them supported and heavy." },
      { time: 280, text: "Finally, notice your feet. Feel the connection to the ground beneath you." },
      { time: 320, text: "Now expand your awareness to your whole body. Feel it as one connected being." },
      { time: 400, text: "Rest in this full body awareness. You are whole. You are present." },
      { time: 540, text: "Continue resting in this peaceful awareness." },
    ],
  },
  {
    id: "gratitude",
    title: "Gratitude",
    icon: "heart",
    color: "#FF8A80",
    description: "Cultivate thankfulness and joy",
    cues: [
      { time: 0, text: "Welcome to the gratitude meditation. Begin with a few deep breaths." },
      { time: 12, text: "Breathe in gratitude." },
      { time: 16, text: "Breathe out tension." },
      { time: 25, text: "Think of one person who brings you joy. Picture their face clearly." },
      { time: 45, text: "Feel the warmth of appreciation for this person. Let it fill your heart." },
      { time: 70, text: "Now think of something simple you're grateful for today. Perhaps a meal, sunshine, or a kind word." },
      { time: 100, text: "Hold this feeling of gratitude in your chest. Let it expand with each breath." },
      { time: 130, text: "Think of your body and all it does for you. Thank your lungs for breathing, your heart for beating." },
      { time: 170, text: "Now extend gratitude to yourself. You showed up today. That takes courage." },
      { time: 210, text: "Breathe in appreciation. Breathe out love." },
      { time: 250, text: "Let this warmth radiate outward to everyone around you." },
      { time: 300, text: "You are surrounded by blessings, both big and small." },
      { time: 400, text: "Carry this grateful heart with you through your day." },
      { time: 540, text: "Thank yourself for taking this time to pause and appreciate." },
    ],
  },
  {
    id: "sleep",
    title: "Sleep",
    icon: "moon",
    color: "#5C6BC0",
    description: "Drift into restful sleep",
    cues: [
      { time: 0, text: "Welcome to the sleep meditation. Get comfortable in your bed and close your eyes." },
      { time: 12, text: "Take a long, slow breath in." },
      { time: 18, text: "And let it all go." },
      { time: 25, text: "With each exhale, feel yourself sinking deeper into your bed." },
      { time: 45, text: "Let go of everything that happened today. It's done. You did your best." },
      { time: 70, text: "Your body is becoming heavy and warm. Let it melt into the mattress." },
      { time: 100, text: "Relax your toes. Relax your ankles. Relax your calves." },
      { time: 130, text: "Feel the relaxation moving upward through your body." },
      { time: 160, text: "Your legs are heavy. Your hips are relaxed. Your belly is soft." },
      { time: 200, text: "Your arms are sinking. Your shoulders are dropping. Your neck is loose." },
      { time: 240, text: "Your face is smooth and peaceful. Your mind is quiet." },
      { time: 280, text: "You are floating in a sea of calm. Safe and warm." },
      { time: 340, text: "Let yourself drift. There is nothing to do. Nowhere to be." },
      { time: 420, text: "Sleep is coming to you naturally. Welcome it." },
      { time: 540, text: "Rest now. You deserve this peace." },
    ],
  },
  {
    id: "focus",
    title: "Focus",
    icon: "eye",
    color: "#4DB6AC",
    description: "Sharpen concentration and clarity",
    cues: [
      { time: 0, text: "Welcome to the focus meditation. Sit upright with your spine tall." },
      { time: 10, text: "Take a deep breath and set your intention to be fully present." },
      { time: 25, text: "Choose a single point of focus. Your breath is a good anchor." },
      { time: 40, text: "Notice the sensation of air entering your nostrils. Cool on the way in." },
      { time: 55, text: "And warm on the way out. Keep your attention right here." },
      { time: 75, text: "When your mind wanders, and it will, gently bring it back. No judgment." },
      { time: 100, text: "Each time you return your focus, you're strengthening your mind." },
      { time: 130, text: "Like a muscle, concentration grows with practice." },
      { time: 160, text: "Stay with your breath. In and out. Simple and steady." },
      { time: 200, text: "You are becoming sharper, clearer, more present with each moment." },
      { time: 250, text: "Notice how focused you feel. This is your natural state." },
      { time: 320, text: "Continue this single-pointed awareness." },
      { time: 420, text: "You are fully here. Fully awake. Fully alive." },
      { time: 540, text: "Carry this clarity into everything you do today." },
    ],
  },
];

function GuidedCard({
  meditation,
  selected,
  onPress,
  colors,
}: {
  meditation: (typeof GUIDED_MEDITATIONS)[0];
  selected: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.guidedCard,
        {
          backgroundColor: selected ? meditation.color + "20" : colors.card,
          borderColor: selected ? meditation.color : colors.cardBorder,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.guidedIconWrap, { backgroundColor: meditation.color + "20" }]}>
        <Ionicons name={meditation.icon as any} size={22} color={meditation.color} />
      </View>
      <Text style={[styles.guidedTitle, { color: colors.text }]} numberOfLines={1}>{meditation.title}</Text>
      <Text style={[styles.guidedDesc, { color: colors.textSecondary }]} numberOfLines={2}>
        {meditation.description}
      </Text>
    </Pressable>
  );
}

export default function MeditateScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [completed, setCompleted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedGuided, setSelectedGuided] = useState(GUIDED_MEDITATIONS[0]);
  const [currentCueText, setCurrentCueText] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spokenCuesRef = useRef<Set<number>>(new Set());
  const elapsedRef = useRef(0);

  const breathScale = useSharedValue(1);
  const breathOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (isActive) {
      breathScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      breathOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      breathScale.value = withTiming(1, { duration: 500 });
      breathOpacity.value = withTiming(0.3, { duration: 500 });
    }
  }, [isActive]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
    opacity: breathOpacity.value,
  }));

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            setCompleted(true);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            storage.addMeditation(selectedDuration, true);
            storage.updateStreak(selectedDuration);
            if (voiceEnabled) {
              Speech.speak("Your meditation is complete. Namaste.", {
                rate: 0.85,
                pitch: 1.0,
              });
            }
            return 0;
          }
          return prev - 1;
        });
        elapsedRef.current += 1;

        if (voiceEnabled) {
          const totalSeconds = selectedDuration * 60;
          const elapsed = totalSeconds - (timeLeft - 1);
          const cues = selectedGuided.cues;
          for (const cue of cues) {
            if (cue.time <= elapsed && cue.time >= elapsed - 2 && !spokenCuesRef.current.has(cue.time)) {
              spokenCuesRef.current.add(cue.time);
              setCurrentCueText(cue.text);
              Speech.speak(cue.text, { rate: 0.82, pitch: 1.0 });
              setTimeout(() => setCurrentCueText(""), Math.max(cue.text.length * 80, 5000));
              break;
            }
          }
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft]);

  const startMeditation = () => {
    const totalSeconds = selectedDuration * 60;
    setTimeLeft(totalSeconds);
    setIsActive(true);
    setCompleted(false);
    elapsedRef.current = 0;
    spokenCuesRef.current.clear();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (voiceEnabled) {
      const firstCue = selectedGuided.cues[0];
      if (firstCue && firstCue.time === 0) {
        spokenCuesRef.current.add(0);
        setCurrentCueText(firstCue.text);
        Speech.speak(firstCue.text, { rate: 0.82, pitch: 1.0 });
        setTimeout(() => setCurrentCueText(""), Math.max(firstCue.text.length * 80, 5000));
      }
    }
  };

  const pauseMeditation = () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    Speech.stop();
  };

  const resumeMeditation = () => {
    setIsActive(true);
  };

  const resetMeditation = () => {
    setIsActive(false);
    setCompleted(false);
    setTimeLeft(selectedDuration * 60);
    elapsedRef.current = 0;
    spokenCuesRef.current.clear();
    setCurrentCueText("");
    if (intervalRef.current) clearInterval(intervalRef.current);
    Speech.stop();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const progress = 1 - timeLeft / (selectedDuration * 60);
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const isTimerRunning = isActive || (timeLeft < selectedDuration * 60 && timeLeft > 0);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + webTopInset },
      ]}
    >
      <LinearGradient
        colors={["#FFFFFF", "#E0F7FA", "#E8F5E9"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {!isTimerRunning && !completed ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Meditate</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Choose your practice
            </Text>
          </View>

          <View style={styles.voiceRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.voiceLabel, { color: colors.text }]}>Voice Guidance</Text>
              <Text style={[styles.voiceSub, { color: colors.textSecondary }]}>
                Spoken cues during meditation
              </Text>
            </View>
            <Switch
              value={voiceEnabled}
              onValueChange={setVoiceEnabled}
              trackColor={{ false: colors.cardBorder, true: colors.tint + "60" }}
              thumbColor={voiceEnabled ? colors.tint : "#ccc"}
            />
          </View>

          <Text style={[styles.sectionLabel, { color: colors.text }]}>Guided Sessions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.guidedRow}
          >
            {GUIDED_MEDITATIONS.map((m) => (
              <GuidedCard
                key={m.id}
                meditation={m}
                selected={selectedGuided.id === m.id}
                onPress={() => {
                  setSelectedGuided(m);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
                colors={colors}
              />
            ))}
          </ScrollView>

          <View style={[styles.selectedGuided, { backgroundColor: selectedGuided.color + "12", borderColor: colors.cardBorder }]}>
            <Ionicons name={selectedGuided.icon as any} size={24} color={selectedGuided.color} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.selectedGuidedTitle, { color: colors.text }]}>{selectedGuided.title}</Text>
              <Text style={[styles.selectedGuidedDesc, { color: colors.textSecondary }]}>{selectedGuided.description}</Text>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.text }]}>Duration</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((d) => (
              <Pressable
                key={d.minutes}
                onPress={() => {
                  setSelectedDuration(d.minutes);
                  setTimeLeft(d.minutes * 60);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
                style={[
                  styles.durationBtn,
                  {
                    backgroundColor: selectedDuration === d.minutes ? colors.tint : colors.card,
                    borderColor: selectedDuration === d.minutes ? colors.tint : colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[styles.durationText, { color: selectedDuration === d.minutes ? "#fff" : colors.text }]}
                >
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.controls}>
            <Pressable
              onPress={startMeditation}
              style={({ pressed }) => [
                styles.mainBtn,
                { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.mainBtnText}>Begin {selectedGuided.title}</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {completed ? "Complete" : selectedGuided.title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isActive ? "Breathe in... Breathe out..." : completed ? "Well done! Namaste." : "Paused"}
            </Text>
          </View>

          <View style={styles.timerArea}>
            <Animated.View
              style={[styles.breathCircleOuter, breathStyle, { borderColor: selectedGuided.color }]}
            />
            <View
              style={[
                styles.timerCircle,
                {
                  backgroundColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.8)",
                  borderColor: selectedGuided.color + "40",
                },
              ]}
            >
              {completed ? (
                <Animated.View
                  entering={Platform.OS !== "web" ? FadeIn.duration(500) : undefined}
                  style={styles.completedWrap}
                >
                  <Ionicons name="checkmark-circle" size={48} color={colors.sage} />
                  <Text style={[styles.completedText, { color: colors.text }]}>Complete</Text>
                  <Text style={[styles.completedSub, { color: colors.textSecondary }]}>
                    {selectedDuration} minutes
                  </Text>
                </Animated.View>
              ) : (
                <>
                  <Text style={[styles.timerText, { color: colors.text }]}>
                    {formatTime(timeLeft)}
                  </Text>
                  {isTimerRunning && (
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${progress * 100}%`, backgroundColor: selectedGuided.color },
                        ]}
                      />
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          {!!currentCueText && voiceEnabled && (
            <View style={[styles.cueCard, { backgroundColor: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.9)" }]}>
              <Ionicons name="mic" size={16} color={selectedGuided.color} />
              <Text style={[styles.cueText, { color: colors.text }]} numberOfLines={3}>
                {currentCueText}
              </Text>
            </View>
          )}

          <View style={styles.controls}>
            {completed ? (
              <Pressable
                onPress={resetMeditation}
                style={({ pressed }) => [
                  styles.mainBtn,
                  { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="refresh" size={24} color="#fff" />
                <Text style={styles.mainBtnText}>New Session</Text>
              </Pressable>
            ) : isActive ? (
              <Pressable
                onPress={pauseMeditation}
                style={({ pressed }) => [
                  styles.mainBtn,
                  { backgroundColor: colors.amber, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="pause" size={24} color="#fff" />
                <Text style={styles.mainBtnText}>Pause</Text>
              </Pressable>
            ) : (
              <View style={styles.controlRow}>
                <Pressable
                  onPress={resetMeditation}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    { borderColor: colors.cardBorder, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Ionicons name="close" size={22} color={colors.text} />
                </Pressable>
                <Pressable
                  onPress={resumeMeditation}
                  style={({ pressed }) => [
                    styles.mainBtn,
                    { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1, flex: 1 },
                  ]}
                >
                  <Ionicons name="play" size={24} color="#fff" />
                  <Text style={styles.mainBtnText}>Resume</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={{ height: Platform.OS === "web" ? 34 : 0 }} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center" },
  header: { alignItems: "center", paddingTop: 16, paddingBottom: 8 },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 28, marginBottom: 4 },
  subtitle: { fontFamily: "Nunito_500Medium", fontSize: 15 },
  voiceRow: {
    flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginTop: 20,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, gap: 12,
  },
  voiceLabel: { fontFamily: "Nunito_700Bold", fontSize: 15 },
  voiceSub: { fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2 },
  sectionLabel: {
    fontFamily: "Nunito_700Bold", fontSize: 16, marginHorizontal: 20, marginTop: 20, marginBottom: 12,
  },
  guidedRow: { paddingHorizontal: 20, gap: 12 },
  guidedCard: {
    width: 130, borderRadius: 16, padding: 14, borderWidth: 1.5, gap: 8,
  },
  guidedIconWrap: {
    width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  guidedTitle: { fontFamily: "Nunito_700Bold", fontSize: 14 },
  guidedDesc: { fontFamily: "Nunito_400Regular", fontSize: 11, lineHeight: 15 },
  selectedGuided: {
    flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 20, marginTop: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  selectedGuidedTitle: { fontFamily: "Nunito_700Bold", fontSize: 15 },
  selectedGuidedDesc: { fontFamily: "Nunito_400Regular", fontSize: 12 },
  durationRow: {
    flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8,
    paddingHorizontal: 20, marginBottom: 20,
  },
  durationBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1,
  },
  durationText: { fontFamily: "Nunito_600SemiBold", fontSize: 14 },
  timerArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  breathCircleOuter: {
    position: "absolute", width: 240, height: 240, borderRadius: 120, borderWidth: 2,
  },
  timerCircle: {
    width: 200, height: 200, borderRadius: 100, alignItems: "center", justifyContent: "center", borderWidth: 3,
  },
  timerText: { fontFamily: "Nunito_800ExtraBold", fontSize: 44 },
  progressBarBg: {
    width: 100, height: 4, backgroundColor: "rgba(128,128,128,0.2)", borderRadius: 2, marginTop: 12, overflow: "hidden",
  },
  progressBarFill: { height: "100%", borderRadius: 2 },
  completedWrap: { alignItems: "center", gap: 4 },
  completedText: { fontFamily: "Nunito_700Bold", fontSize: 20, marginTop: 8 },
  completedSub: { fontFamily: "Nunito_500Medium", fontSize: 14 },
  cueCard: {
    flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 24, marginTop: 8,
    padding: 14, borderRadius: 14,
  },
  cueText: { fontFamily: "Nunito_500Medium", fontSize: 13, flex: 1, lineHeight: 18, fontStyle: "italic" },
  controls: { paddingHorizontal: 20, paddingBottom: 100, width: "100%" },
  controlRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  mainBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16,
  },
  mainBtnText: { fontFamily: "Nunito_700Bold", fontSize: 17, color: "#fff" },
  secondaryBtn: {
    width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
});
