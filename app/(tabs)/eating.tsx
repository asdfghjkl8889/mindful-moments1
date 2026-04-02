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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { storage, EatingEntry, EATING_TIPS, getLarryMessage } from "@/lib/storage";

const TIMER_DURATIONS = [
  { label: "10 min", seconds: 600 },
  { label: "20 min", seconds: 1200 },
  { label: "30 min", seconds: 1800 },
];

const EATING_PROMPTS = [
  { at: 0, text: "Take 3 deep breaths before you begin. Notice the colors, aromas, and textures of your food." },
  { at: 120, text: "Put your utensil down between bites. Take a moment to truly taste what's in your mouth." },
  { at: 300, text: "Check in with your hunger. Are you eating because you're hungry or out of habit?" },
  { at: 480, text: "Notice the flavors — sweet, salty, sour, umami. What stands out?" },
  { at: 660, text: "Slow down. Chew each bite 20 times. Feel the texture change." },
  { at: 840, text: "Pause and check your fullness level from 1-10. Are you satisfied yet?" },
  { at: 1020, text: "Express gratitude — for this food, for the hands that made it, for your body that uses it." },
  { at: 1140, text: "Take your last bites with full presence. Notice when you feel comfortably full." },
];

function MindfulEatingTimer({ colors }: { colors: any }) {
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATIONS[1].seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(EATING_PROMPTS[0].text);
  const [showTimer, setShowTimer] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  const totalSeconds = TIMER_DURATIONS[selectedDuration].seconds;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const getPromptForElapsed = (elapsed: number) => {
    let best = EATING_PROMPTS[0].text;
    for (const p of EATING_PROMPTS) {
      if (elapsed >= p.at) best = p.text;
    }
    return best;
  };

  const startTimer = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(true);
    elapsedRef.current = totalSeconds - timeLeft;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setCurrentPrompt("Wonderful! You've completed a mindful meal. Notice how you feel.");
          return 0;
        }
        elapsedRef.current += 1;
        setCurrentPrompt(getPromptForElapsed(elapsedRef.current));
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    elapsedRef.current = 0;
    setTimeLeft(TIMER_DURATIONS[selectedDuration].seconds);
    setCurrentPrompt(EATING_PROMPTS[0].text);
  };

  useEffect(() => {
    resetTimer();
  }, [selectedDuration]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const progress = 1 - timeLeft / totalSeconds;

  if (!showTimer) {
    return (
      <Pressable
        onPress={() => setShowTimer(true)}
        style={[styles.timerBanner, { backgroundColor: "#E0F7FA", borderColor: colors.tint + "40" }]}
      >
        <LinearGradient colors={["#E0F7FA", "#E8F5E9"]} style={styles.timerBannerGrad}>
          <Ionicons name="timer" size={28} color={colors.tint} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.timerBannerTitle, { color: colors.text }]}>Mindful Eating Timer</Text>
            <Text style={[styles.timerBannerSub, { color: colors.textSecondary }]}>
              Guided prompts while you eat · 10–30 min
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <View style={[styles.timerCard, { backgroundColor: "#E8F5E9", borderColor: colors.tint + "30" }]}>
      <View style={styles.timerHeader}>
        <Ionicons name="timer" size={20} color={colors.tint} />
        <Text style={[styles.timerTitle, { color: colors.text }]}>Mindful Eating Timer</Text>
        <Pressable onPress={() => { resetTimer(); setShowTimer(false); }}>
          <Ionicons name="close" size={20} color={colors.textTertiary} />
        </Pressable>
      </View>

      <View style={styles.durationRow}>
        {TIMER_DURATIONS.map((d, i) => (
          <Pressable
            key={d.label}
            onPress={() => !isRunning && setSelectedDuration(i)}
            style={[
              styles.durationBtn,
              { backgroundColor: selectedDuration === i ? colors.tint : colors.card, borderColor: selectedDuration === i ? colors.tint : colors.cardBorder },
            ]}
          >
            <Text style={[styles.durationBtnText, { color: selectedDuration === i ? "#fff" : colors.textSecondary }]}>{d.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.timerDisplay}>
        <Text style={[styles.timerTime, { color: timeLeft === 0 ? "#66BB6A" : colors.text }]}>
          {timeLeft === 0 ? "Done!" : formatTime(timeLeft)}
        </Text>
        <View style={[styles.timerProgressBg, { backgroundColor: colors.cardBorder }]}>
          <View style={[styles.timerProgressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: colors.tint }]} />
        </View>
      </View>

      <View style={[styles.promptBox, { backgroundColor: "rgba(255,255,255,0.7)" }]}>
        <Ionicons name="leaf" size={16} color={colors.tint} />
        <Text style={[styles.promptText, { color: colors.text }]}>{currentPrompt}</Text>
      </View>

      <View style={styles.timerControls}>
        {!isRunning && timeLeft > 0 && (
          <Pressable onPress={startTimer} style={[styles.timerBtn, { backgroundColor: colors.tint }]}>
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.timerBtnText}>{timeLeft === totalSeconds ? "Start" : "Resume"}</Text>
          </Pressable>
        )}
        {isRunning && (
          <Pressable onPress={pauseTimer} style={[styles.timerBtn, { backgroundColor: "#FF8A65" }]}>
            <Ionicons name="pause" size={20} color="#fff" />
            <Text style={styles.timerBtnText}>Pause</Text>
          </Pressable>
        )}
        {timeLeft !== totalSeconds && (
          <Pressable onPress={resetTimer} style={[styles.timerBtnOutline, { borderColor: colors.cardBorder }]}>
            <Ionicons name="refresh" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

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
    <View
      style={[
        styles.tipCard,
        {
          backgroundColor: bgColors[index % bgColors.length],
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={[styles.tipIconWrap, { backgroundColor: colors.tint + "20" }]}>
        <Ionicons name={tip.icon as any} size={22} color={colors.tint} />
      </View>
      <Text style={[styles.tipTitle, { color: colors.text }]}>{tip.title}</Text>
      <Text style={[styles.tipDesc, { color: colors.textSecondary }]}>{tip.description}</Text>
    </View>
  );
}

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
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Pressable
      onLongPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
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
        <Text style={[styles.logNotes, { color: colors.textSecondary }]} numberOfLines={2}>
          {entry.notes}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function EatingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [eatingLog, setEatingLog] = useState<EatingEntry[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [showTips, setShowTips] = useState(true);
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSave = async () => {
    if (!meal.trim()) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await storage.addEatingEntry(meal.trim(), hunger, fullness, mindful, notes.trim());
    setMeal("");
    setHunger(5);
    setFullness(5);
    setMindful(false);
    setNotes("");
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
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 16 }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Mindful Eating</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Eat with awareness
          </Text>
        </View>
        <View style={styles.headerBtns}>
          <Pressable
            onPress={() => setShowTips(!showTips)}
            style={({ pressed }) => [
              styles.tipToggle,
              {
                backgroundColor: showTips ? colors.tint + "20" : colors.card,
                borderColor: showTips ? colors.tint : colors.cardBorder,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="bulb" size={18} color={showTips ? colors.tint : colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => setShowCompose(true)}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
          <MindfulEatingTimer colors={colors} />
        </View>

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
                    <Text style={[styles.larryBannerName, { color: colors.sage }]}>
                      Larry says...
                    </Text>
                    <Text style={[styles.larryBannerMsg, { color: colors.textSecondary }]}>
                      Eating mindfully means savoring every bite. Take it slow, just like me!
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tips for Mindful Eating</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tipsRow}
            >
              {EATING_TIPS.map((tip, index) => (
                <TipCard key={tip.title} tip={tip} colors={colors} index={index} />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Eating Log</Text>
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
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
                ]}
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
                Hunger Level (before eating): {hunger}/10
              </Text>
              <View style={styles.sliderRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <Pressable
                    key={`h${n}`}
                    onPress={() => { setHunger(n); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    style={[
                      styles.sliderDot,
                      {
                        backgroundColor: n <= hunger ? "#FF8A65" : colors.cardBorder,
                      },
                    ]}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 20 }]}>
                Fullness Level (after eating): {fullness}/10
              </Text>
              <View style={styles.sliderRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <Pressable
                    key={`f${n}`}
                    onPress={() => { setFullness(n); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    style={[
                      styles.sliderDot,
                      {
                        backgroundColor: n <= fullness ? Colors.light.sage : colors.cardBorder,
                      },
                    ]}
                  />
                ))}
              </View>

              <Pressable
                onPress={() => {
                  setMindful(!mindful);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
                style={[styles.mindfulToggle, { borderColor: colors.cardBorder, backgroundColor: mindful ? colors.tint + "15" : colors.card }]}
              >
                <Ionicons name={mindful ? "checkmark-circle" : "ellipse-outline"} size={22} color={mindful ? colors.tint : colors.textTertiary} />
                <Text style={[styles.mindfulToggleText, { color: colors.text }]}>
                  I ate this meal mindfully
                </Text>
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

const styles = StyleSheet.create({
  timerBanner: { borderRadius: 16, marginBottom: 12, borderWidth: 1, overflow: "hidden" },
  timerBannerGrad: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  timerBannerTitle: { fontFamily: "Nunito_700Bold", fontSize: 15 },
  timerBannerSub: { fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2 },
  timerCard: {
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12, gap: 12,
  },
  timerHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  timerTitle: { fontFamily: "Nunito_700Bold", fontSize: 15, flex: 1 },
  durationRow: { flexDirection: "row", gap: 8 },
  durationBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  durationBtnText: { fontFamily: "Nunito_600SemiBold", fontSize: 13 },
  timerDisplay: { alignItems: "center", gap: 10 },
  timerTime: { fontFamily: "Nunito_800ExtraBold", fontSize: 48 },
  timerProgressBg: { width: "100%", height: 8, borderRadius: 4, overflow: "hidden" },
  timerProgressFill: { height: "100%", borderRadius: 4 },
  promptBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, padding: 12 },
  promptText: { fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 18, flex: 1, fontStyle: "italic" },
  timerControls: { flexDirection: "row", gap: 10 },
  timerBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 12 },
  timerBtnText: { fontFamily: "Nunito_700Bold", fontSize: 15, color: "#fff" },
  timerBtnOutline: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 28 },
  subtitle: { fontFamily: "Nunito_500Medium", fontSize: 14, marginTop: 2 },
  headerBtns: { flexDirection: "row", gap: 8 },
  tipToggle: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  addBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  larryBanner: { marginHorizontal: 20, marginBottom: 8 },
  larryBannerGrad: { borderRadius: 16, padding: 16 },
  larryBannerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  larryBannerAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(123,174,127,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  larryBannerText: { flex: 1 },
  larryBannerName: { fontFamily: "Nunito_700Bold", fontSize: 14, marginBottom: 2 },
  larryBannerMsg: { fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 18 },
  sectionTitle: {
    fontFamily: "Nunito_700Bold", fontSize: 18, marginHorizontal: 20, marginTop: 20, marginBottom: 12,
  },
  tipsRow: { paddingHorizontal: 20, gap: 12 },
  tipCard: {
    width: 160, borderRadius: 16, padding: 16, borderWidth: 1, gap: 8,
  },
  tipIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tipTitle: { fontFamily: "Nunito_700Bold", fontSize: 15 },
  tipDesc: { fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 17 },
  emptyLog: { alignItems: "center", paddingHorizontal: 40, paddingVertical: 40, gap: 12 },
  emptyText: { fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center" },
  logList: { paddingHorizontal: 20, gap: 12 },
  logCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  logHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logMealRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logMeal: { fontFamily: "Nunito_700Bold", fontSize: 16 },
  logDate: { fontFamily: "Nunito_400Regular", fontSize: 11 },
  logMetrics: { gap: 8 },
  logMetric: { flexDirection: "row", alignItems: "center", gap: 8 },
  logMetricLabel: { fontFamily: "Nunito_500Medium", fontSize: 12, width: 55 },
  logBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(128,128,128,0.15)", overflow: "hidden" },
  logBarFill: { height: "100%", borderRadius: 3 },
  logMetricValue: { fontFamily: "Nunito_600SemiBold", fontSize: 12, width: 32 },
  mindfulBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  mindfulText: { fontFamily: "Nunito_500Medium", fontSize: 12 },
  logNotes: { fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 18 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  composeSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%" },
  composeHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
  },
  composeTitle: { fontFamily: "Nunito_700Bold", fontSize: 18 },
  saveBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  composeContent: { paddingHorizontal: 20, paddingBottom: 20 },
  fieldLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 15, marginBottom: 10 },
  inputField: {
    fontFamily: "Nunito_400Regular", fontSize: 15, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1,
  },
  sliderRow: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  sliderDot: { flex: 1, height: 12, borderRadius: 6 },
  mindfulToggle: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20,
    paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  mindfulToggleText: { fontFamily: "Nunito_500Medium", fontSize: 15 },
  textArea: {
    fontFamily: "Nunito_400Regular", fontSize: 15, lineHeight: 22,
    borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 80,
  },
});
