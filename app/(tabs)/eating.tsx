import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
  Platform,
  Modal,
  Alert,
  KeyboardAvoidingView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { storage, EatingEntry, EATING_TIPS, getLarryMessage } from "@/lib/storage";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Session Modes ───────────────────────────────────────────────────────────
const EATING_MODES = [
  {
    id: "quick",
    label: "Quick Pause",
    duration: 10,
    seconds: 600,
    icon: "flash",
    desc: "A brief moment of awareness before a meal",
    colors: ["#26A69A", "#00BCD4"] as const,
    accent: "#26A69A",
  },
  {
    id: "balanced",
    label: "Balanced Meal",
    duration: 20,
    seconds: 1200,
    icon: "restaurant",
    desc: "The classic mindful eating experience",
    colors: ["#7C4DFF", "#E040FB"] as const,
    accent: "#7C4DFF",
  },
  {
    id: "deep",
    label: "Deep Savoring",
    duration: 30,
    seconds: 1800,
    icon: "flower",
    desc: "Full presence — taste, texture, gratitude",
    colors: ["#FF6F61", "#FF8A65"] as const,
    accent: "#FF6F61",
  },
];

// ─── Guided Prompts ───────────────────────────────────────────────────────────
const ALL_PROMPTS = [
  { at: 0,    icon: "leaf",            text: "Take 3 slow breaths. Notice the colors, aroma, and texture of your food." },
  { at: 90,   icon: "eye",             text: "Really look at your food. What shapes, colors, and details do you notice?" },
  { at: 210,  icon: "hand-left",       text: "Put your fork down between bites. Give each mouthful your full attention." },
  { at: 360,  icon: "chatbubble",      text: "Check your hunger level from 1–10. Are you eating out of hunger or habit?" },
  { at: 510,  icon: "color-palette",   text: "Notice the flavors — sweet, salty, sour, umami. What stands out most?" },
  { at: 660,  icon: "time",            text: "Slow down even more. Chew each bite 20 times. Feel the texture change." },
  { at: 840,  icon: "battery-half",    text: "Pause. Check your fullness again. Are you still enjoying the food?" },
  { at: 1020, icon: "heart",           text: "Express gratitude — for this food, the hands that made it, your body." },
  { at: 1140, icon: "checkmark-circle",text: "Take your final bites with full presence. Notice when you feel comfortably full." },
];

function getPromptForElapsed(elapsed: number, totalSeconds: number) {
  // Scale prompts to the session length
  const scale = totalSeconds / 1800;
  let best = ALL_PROMPTS[0];
  for (const p of ALL_PROMPTS) {
    if (elapsed >= p.at * scale) best = p;
  }
  return best;
}

// ─── Animated Ring ────────────────────────────────────────────────────────────
function PulseRing({ color, size, delay }: { color: string; size: number; delay: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: delay }),
        withTiming(1.18, { duration: 2000 }),
        withTiming(1, { duration: 2000 }),
      ),
      -1
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: delay }),
        withTiming(0.15, { duration: 2000 }),
        withTiming(0.5, { duration: 2000 }),
      ),
      -1
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
        },
      ]}
    />
  );
}

// ─── Immersive Timer ──────────────────────────────────────────────────────────
function ImmersiveTimer({
  mode,
  onEnd,
  colors,
  insets,
}: {
  mode: typeof EATING_MODES[0];
  onEnd: () => void;
  colors: any;
  insets: any;
}) {
  const [timeLeft, setTimeLeft] = useState(mode.seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = 1 - timeLeft / mode.seconds;
  const currentPrompt = getPromptForElapsed(elapsedRef.current, mode.seconds);

  const startTimer = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(true);
    setStarted(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          setCompleted(true);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        elapsedRef.current += 1;
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Progress arc circumference
  const R = 80;
  const circumference = 2 * Math.PI * R;
  const strokeDash = circumference * (1 - progress);

  return (
    <View style={[imStyles.wrap, { paddingTop: insets.top + webTopInset }]}>
      <LinearGradient
        colors={[mode.colors[0] + "FF", mode.colors[1] + "CC", "#0D0D1A"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* Top bar */}
      <View style={imStyles.topBar}>
        <Pressable onPress={onEnd} style={imStyles.backBtn}>
          <Ionicons name="chevron-down" size={24} color="#fff" />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={imStyles.modeName}>{mode.label}</Text>
          <Text style={imStyles.modeSub}>{mode.duration} min · Guided session</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Center ring + timer */}
      <View style={imStyles.center}>
        <PulseRing color="rgba(255,255,255,0.4)" size={240} delay={0} />
        <PulseRing color="rgba(255,255,255,0.25)" size={280} delay={600} />
        <PulseRing color="rgba(255,255,255,0.12)" size={320} delay={1200} />

        <View style={imStyles.timerCircle}>
          {completed ? (
            <View style={{ alignItems: "center", gap: 6 }}>
              <Ionicons name="checkmark-circle" size={48} color="#fff" />
              <Text style={imStyles.completedText}>Mindful!</Text>
            </View>
          ) : (
            <>
              <Text style={imStyles.timerText}>{formatTime(timeLeft)}</Text>
              <Text style={imStyles.timerLabel}>{Math.round(progress * 100)}% complete</Text>
            </>
          )}
        </View>

        {/* Progress arc indicator */}
        <View style={imStyles.progressArcWrap}>
          <View style={[imStyles.progressArcBg, { borderColor: "rgba(255,255,255,0.15)" }]} />
          <View
            style={[
              imStyles.progressArcFill,
              {
                borderColor: "#fff",
                borderTopColor: progress > 0.25 ? "#fff" : "transparent",
                borderRightColor: progress > 0.5 ? "#fff" : "transparent",
                borderBottomColor: progress > 0.75 ? "#fff" : "transparent",
              },
            ]}
          />
        </View>
      </View>

      {/* Prompt card */}
      {started && !completed && (
        <Animated.View
          entering={Platform.OS !== "web" ? FadeIn.duration(500) : undefined}
          style={imStyles.promptCard}
        >
          <View style={imStyles.promptIconWrap}>
            <Ionicons name={currentPrompt.icon as any} size={18} color={mode.colors[0]} />
          </View>
          <Text style={imStyles.promptText}>{currentPrompt.text}</Text>
        </Animated.View>
      )}

      {!started && (
        <View style={imStyles.promptCard}>
          <View style={imStyles.promptIconWrap}>
            <Ionicons name="leaf" size={18} color={mode.colors[0]} />
          </View>
          <Text style={imStyles.promptText}>
            Sit comfortably with your meal. When you're ready, tap Begin to start your guided session.
          </Text>
        </View>
      )}

      {/* Progress steps */}
      {started && !completed && (
        <View style={imStyles.stepsRow}>
          {ALL_PROMPTS.slice(0, 6).map((_, i) => {
            const stepThreshold = (i / 6) * mode.seconds;
            const done = elapsedRef.current >= stepThreshold;
            return (
              <View
                key={i}
                style={[
                  imStyles.stepDot,
                  { backgroundColor: done ? "#fff" : "rgba(255,255,255,0.25)" },
                ]}
              />
            );
          })}
        </View>
      )}

      {/* Controls */}
      <View style={[imStyles.controls, { paddingBottom: insets.bottom + 20 }]}>
        {completed ? (
          <Pressable onPress={onEnd} style={imStyles.mainBtn}>
            <Ionicons name="checkmark" size={22} color={mode.colors[0]} />
            <Text style={[imStyles.mainBtnText, { color: mode.colors[0] }]}>Done</Text>
          </Pressable>
        ) : isRunning ? (
          <Pressable onPress={pauseTimer} style={imStyles.pauseBtn}>
            <Ionicons name="pause" size={28} color="#fff" />
          </Pressable>
        ) : (
          <View style={{ gap: 12, alignItems: "center" }}>
            <Pressable onPress={startTimer} style={imStyles.mainBtn}>
              <Ionicons name={started ? "play" : "play-circle"} size={22} color={mode.colors[0]} />
              <Text style={[imStyles.mainBtnText, { color: mode.colors[0] }]}>
                {started ? "Resume" : "Begin Session"}
              </Text>
            </Pressable>
            {started && (
              <Pressable onPress={onEnd} style={imStyles.endBtn}>
                <Text style={imStyles.endBtnText}>End session</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Mode Card ────────────────────────────────────────────────────────────────
function ModeCard({
  mode,
  onPress,
}: {
  mode: typeof EATING_MODES[0];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={modeStyles.card}>
      <LinearGradient colors={mode.colors} style={modeStyles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={modeStyles.iconWrap}>
          <Ionicons name={mode.icon as any} size={24} color="#fff" />
        </View>
        <Text style={modeStyles.label}>{mode.label}</Text>
        <Text style={modeStyles.duration}>{mode.duration} min</Text>
        <Text style={modeStyles.desc}>{mode.desc}</Text>
        <View style={modeStyles.startBadge}>
          <Text style={modeStyles.startText}>Start →</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// ─── Tip Card ─────────────────────────────────────────────────────────────────
function TipCard({
  tip,
  colors,
  index,
}: {
  tip: (typeof EATING_TIPS)[0];
  colors: any;
  index: number;
}) {
  const bgColors = ["#E8F5E9", "#E0F7FA", "#FFF8E1", "#F3E5F5", "#E3F2FD", "#FBE9E7", "#F1F8E9", "#E8EAF6"];
  return (
    <View style={[styles.tipCard, { backgroundColor: bgColors[index % bgColors.length], borderColor: colors.cardBorder }]}>
      <View style={[styles.tipIconWrap, { backgroundColor: colors.tint + "20" }]}>
        <Ionicons name={tip.icon as any} size={22} color={colors.tint} />
      </View>
      <Text style={[styles.tipTitle, { color: colors.text }]}>{tip.title}</Text>
      <Text style={[styles.tipDesc, { color: colors.textSecondary }]}>{tip.description}</Text>
    </View>
  );
}

// ─── Log Card ─────────────────────────────────────────────────────────────────
function EatingLogCard({
  entry,
  colors,
  onDelete,
}: {
  entry: EatingEntry;
  colors: any;
  onDelete: (id: string) => void;
}) {
  const dateStr = new Date(entry.timestamp).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <Pressable
      onLongPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert("Delete Entry", "Remove this eating log?", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => onDelete(entry.id) },
        ]);
      }}
      style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <View style={styles.logHeader}>
        <View style={styles.logMealRow}>
          <Ionicons name="restaurant" size={16} color={colors.tint} />
          <Text style={[styles.logMeal, { color: colors.text }]}>{entry.meal}</Text>
        </View>
        <Text style={[styles.logDate, { color: colors.textTertiary }]}>{dateStr}</Text>
      </View>
      <View style={styles.logMetrics}>
        <View style={styles.logMetric}>
          <Text style={[styles.logMetricLabel, { color: colors.textSecondary }]}>Hunger</Text>
          <View style={styles.logBarBg}>
            <View style={[styles.logBarFill, { width: `${entry.hunger * 10}%`, backgroundColor: "#FF8A65" }]} />
          </View>
          <Text style={[styles.logMetricValue, { color: colors.text }]}>{entry.hunger}/10</Text>
        </View>
        <View style={styles.logMetric}>
          <Text style={[styles.logMetricLabel, { color: colors.textSecondary }]}>Fullness</Text>
          <View style={styles.logBarBg}>
            <View style={[styles.logBarFill, { width: `${entry.fullness * 10}%`, backgroundColor: colors.sage }]} />
          </View>
          <Text style={[styles.logMetricValue, { color: colors.text }]}>{entry.fullness}/10</Text>
        </View>
      </View>
      {entry.mindful && (
        <View style={styles.mindfulBadge}>
          <Ionicons name="checkmark-circle" size={14} color={colors.sage} />
          <Text style={[styles.mindfulText, { color: colors.sage }]}>Mindful meal</Text>
        </View>
      )}
      {entry.notes ? (
        <Text style={[styles.logNotes, { color: colors.textSecondary }]} numberOfLines={2}>{entry.notes}</Text>
      ) : null}
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EatingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [eatingLog, setEatingLog] = useState<EatingEntry[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [activeMode, setActiveMode] = useState<typeof EATING_MODES[0] | null>(null);
  const [meal, setMeal] = useState("");
  const [hunger, setHunger] = useState(5);
  const [fullness, setFullness] = useState(5);
  const [mindful, setMindful] = useState(false);
  const [notes, setNotes] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const data = await storage.getEatingLog();
    setEatingLog(data);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSave = async () => {
    if (!meal.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await storage.addEatingEntry(meal.trim(), hunger, fullness, mindful, notes.trim());
    setMeal(""); setHunger(5); setFullness(5); setMindful(false); setNotes("");
    setShowCompose(false);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    await storage.deleteEatingEntry(id);
    await loadData();
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Immersive session overlay ── */}
      <Modal visible={!!activeMode} animationType="slide" statusBarTranslucent onRequestClose={() => setActiveMode(null)}>
        {activeMode && (
          <ImmersiveTimer
            mode={activeMode}
            onEnd={() => setActiveMode(null)}
            colors={colors}
            insets={insets}
          />
        )}
      </Modal>
      {/* ── Hero header ── */}
      <LinearGradient
        colors={["#E0F7FA", "#E8F5E9", "#FFF8E1"]}
        style={[styles.hero, { paddingTop: insets.top + webTopInset + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="restaurant" size={28} color="#26A69A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>Mindful Eating</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Eat with full presence</Text>
          </View>
          <View style={styles.headerBtns}>
            <Pressable
              onPress={() => setShowTips(!showTips)}
              style={[styles.iconBtn, { backgroundColor: showTips ? colors.tint + "20" : "rgba(255,255,255,0.6)", borderColor: showTips ? colors.tint : colors.cardBorder }]}
            >
              <Ionicons name="bulb" size={18} color={showTips ? colors.tint : colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => setShowCompose(true)}
              style={[styles.iconBtn, { backgroundColor: colors.tint }]}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* ── Session mode cards ── */}
        <Text style={[styles.heroSectionLabel, { color: colors.text }]}>Choose a guided session</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeRow}
        >
          {EATING_MODES.map((m) => (
            <ModeCard key={m.id} mode={m} onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setActiveMode(m);
            }} />
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── Larry banner + tips ── */}
        {showTips && (
          <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
            <View style={styles.larryBanner}>
              <LinearGradient
                colors={["#E8F5E9", "#E0F7FA"]}
                style={styles.larryBannerGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.larryBannerRow}>
                  <View style={styles.larryBannerAvatar}>
                    <MaterialCommunityIcons name="turtle" size={28} color={colors.sage} />
                  </View>
                  <View style={styles.larryBannerText}>
                    <Text style={[styles.larryBannerName, { color: colors.sage }]}>Larry says...</Text>
                    <Text style={[styles.larryBannerMsg, { color: colors.textSecondary }]}>
                      Eating mindfully means savoring every bite. Take it slow, just like me!
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mindful Eating Tips</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tipsRow}>
              {EATING_TIPS.map((tip, index) => (
                <TipCard key={tip.title} tip={tip} colors={colors} index={index} />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── Eating log ── */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Meal Log</Text>
        {eatingLog.length === 0 ? (
          <View style={styles.emptyLog}>
            <Ionicons name="restaurant-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No meals logged yet. Track your mindful eating journey!
            </Text>
          </View>
        ) : (
          <View style={styles.logList}>
            {eatingLog.map((entry, index) => (
              <Animated.View
                key={entry.id}
                entering={Platform.OS !== "web" ? FadeInDown.delay(index * 60).duration(400) : undefined}
              >
                <EatingLogCard entry={entry} colors={colors} onDelete={handleDelete} />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Log meal modal ── */}
      <Modal visible={showCompose} animationType="slide" transparent onRequestClose={() => setShowCompose(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowCompose(false)} />
          <Animated.View
            entering={Platform.OS !== "web" ? FadeIn.duration(300) : undefined}
            style={[styles.composeSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.composeHeader}>
              <Pressable onPress={() => setShowCompose(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <Text style={[styles.composeTitle, { color: colors.text }]}>Log Meal</Text>
              <Pressable
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: colors.tint }]}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.composeContent}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>What did you eat?</Text>
              <TextInput
                value={meal}
                onChangeText={setMeal}
                placeholder="e.g., Grilled chicken salad"
                placeholderTextColor={colors.textTertiary}
                style={[styles.inputField, { color: colors.text, backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              />

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 20 }]}>
                Hunger before: {hunger}/10
              </Text>
              <View style={styles.sliderRow}>
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <Pressable
                    key={`h${n}`}
                    onPress={() => { setHunger(n); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    style={[styles.sliderDot, { backgroundColor: n <= hunger ? "#FF8A65" : colors.cardBorder }]}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 20 }]}>
                Fullness after: {fullness}/10
              </Text>
              <View style={styles.sliderRow}>
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <Pressable
                    key={`f${n}`}
                    onPress={() => { setFullness(n); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    style={[styles.sliderDot, { backgroundColor: n <= fullness ? Colors.light.sage : colors.cardBorder }]}
                  />
                ))}
              </View>

              <Pressable
                onPress={() => { setMindful(!mindful); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                style={[styles.mindfulToggle, { borderColor: colors.cardBorder, backgroundColor: mindful ? colors.tint + "15" : colors.card }]}
              >
                <Ionicons name={mindful ? "checkmark-circle" : "ellipse-outline"} size={22} color={mindful ? colors.tint : colors.textTertiary} />
                <Text style={[styles.mindfulToggleText, { color: colors.text }]}>I ate this meal mindfully</Text>
              </Pressable>

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 20 }]}>Notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="How did you feel during/after eating?"
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
                style={[styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Immersive Styles ─────────────────────────────────────────────────────────
const imStyles = StyleSheet.create({
  wrap: { flex: 1 },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  modeName: { fontFamily: "Nunito_700Bold", fontSize: 18, color: "#fff" },
  modeSub: { fontFamily: "Nunito_400Regular", fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  timerCircle: {
    width: 190, height: 190, borderRadius: 95,
    backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center", justifyContent: "center",
  },
  timerText: { fontFamily: "Nunito_800ExtraBold", fontSize: 48, color: "#fff" },
  timerLabel: { fontFamily: "Nunito_400Regular", fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  completedText: { fontFamily: "Nunito_700Bold", fontSize: 22, color: "#fff" },
  progressArcWrap: { position: "absolute", width: 210, height: 210 },
  progressArcBg: { position: "absolute", width: 210, height: 210, borderRadius: 105, borderWidth: 2 },
  progressArcFill: { position: "absolute", width: 210, height: 210, borderRadius: 105, borderWidth: 3, borderColor: "#fff" },
  promptCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    marginHorizontal: 20, marginBottom: 16,
    padding: 16, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  promptIconWrap: {
    width: 34, height: 34, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.85)", alignItems: "center", justifyContent: "center",
  },
  promptText: {
    fontFamily: "Nunito_400Regular", fontSize: 14, lineHeight: 20,
    color: "rgba(255,255,255,0.95)", flex: 1, fontStyle: "italic",
  },
  stepsRow: { flexDirection: "row", gap: 6, justifyContent: "center", marginBottom: 12 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  controls: { alignItems: "center", paddingHorizontal: 24, gap: 10 },
  pauseBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  mainBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", paddingHorizontal: 32, paddingVertical: 16, borderRadius: 20,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  mainBtnText: { fontFamily: "Nunito_700Bold", fontSize: 16 },
  endBtn: { paddingVertical: 8 },
  endBtnText: { fontFamily: "Nunito_500Medium", fontSize: 14, color: "rgba(255,255,255,0.6)" },
});

// ─── Mode Card Styles ─────────────────────────────────────────────────────────
const modeStyles = StyleSheet.create({
  card: {
    width: 148, borderRadius: 20, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  gradient: { padding: 16, minHeight: 170, gap: 6 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  label: { fontFamily: "Nunito_700Bold", fontSize: 15, color: "#fff" },
  duration: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: "rgba(255,255,255,0.75)" },
  desc: { fontFamily: "Nunito_400Regular", fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 15, flex: 1 },
  startBadge: {
    alignSelf: "flex-start", marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  startText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: "#fff" },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingHorizontal: 20, paddingBottom: 20,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  heroIcon: {
    width: 54, height: 54, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center",
  },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 26 },
  subtitle: { fontFamily: "Nunito_500Medium", fontSize: 14, marginTop: 2 },
  headerBtns: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  heroSectionLabel: { fontFamily: "Nunito_700Bold", fontSize: 15, marginBottom: 12 },
  modeRow: { gap: 12, paddingBottom: 4 },
  larryBanner: { marginHorizontal: 20, marginTop: 20, borderRadius: 16, overflow: "hidden" },
  larryBannerGrad: { padding: 16 },
  larryBannerRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  larryBannerAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center",
  },
  larryBannerText: { flex: 1 },
  larryBannerName: { fontFamily: "Nunito_700Bold", fontSize: 13, marginBottom: 2 },
  larryBannerMsg: { fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontFamily: "Nunito_700Bold", fontSize: 16, marginHorizontal: 20, marginTop: 20, marginBottom: 12 },
  tipsRow: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  tipCard: {
    width: 160, borderRadius: 16, padding: 14, borderWidth: 1, gap: 8,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  tipIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tipTitle: { fontFamily: "Nunito_700Bold", fontSize: 13 },
  tipDesc: { fontFamily: "Nunito_400Regular", fontSize: 11, lineHeight: 15 },
  logList: { paddingHorizontal: 20, gap: 10 },
  logCard: {
    borderRadius: 14, padding: 14, borderWidth: 1, gap: 8,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  logHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logMealRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  logMeal: { fontFamily: "Nunito_700Bold", fontSize: 14 },
  logDate: { fontFamily: "Nunito_400Regular", fontSize: 11 },
  logMetrics: { gap: 6 },
  logMetric: { flexDirection: "row", alignItems: "center", gap: 8 },
  logMetricLabel: { fontFamily: "Nunito_400Regular", fontSize: 12, width: 52 },
  logBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(128,128,128,0.15)", overflow: "hidden" },
  logBarFill: { height: "100%", borderRadius: 3 },
  logMetricValue: { fontFamily: "Nunito_600SemiBold", fontSize: 12, width: 32, textAlign: "right" },
  mindfulBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  mindfulText: { fontFamily: "Nunito_600SemiBold", fontSize: 12 },
  logNotes: { fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 17, fontStyle: "italic" },
  emptyLog: { alignItems: "center", paddingVertical: 40, gap: 10, paddingHorizontal: 40 },
  emptyText: { fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  composeSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
    maxHeight: "85%",
  },
  composeHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(128,128,128,0.2)",
  },
  composeTitle: { fontFamily: "Nunito_700Bold", fontSize: 17 },
  saveBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  composeContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  fieldLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 14, marginBottom: 8 },
  inputField: {
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: "Nunito_400Regular", fontSize: 14,
  },
  sliderRow: { flexDirection: "row", gap: 6 },
  sliderDot: { flex: 1, height: 32, borderRadius: 8 },
  mindfulToggle: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  mindfulToggleText: { fontFamily: "Nunito_500Medium", fontSize: 14 },
  textArea: {
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: "Nunito_400Regular", fontSize: 14, minHeight: 90,
  },
});
