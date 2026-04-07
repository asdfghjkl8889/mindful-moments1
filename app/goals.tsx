import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  useColorScheme,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { storage } from "@/lib/storage";

const GOALS_KEY = "mindful_goals";

type Period = "daily" | "weekly" | "monthly" | "yearly";

interface Goal {
  id: string;
  period: Period;
  title: string;
  emoji: string;
  color: string;
  completions: string[];
  createdAt: string;
}

const PERIOD_LABELS: Record<Period, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const PERIOD_XP: Record<Period, number> = {
  daily: 10,
  weekly: 30,
  monthly: 60,
  yearly: 150,
};

const PERIOD_COLORS: Record<Period, [string, string, string]> = {
  daily: ["#26A69A", "#00897B", "#00695C"],
  weekly: ["#1565C0", "#1976D2", "#42A5F5"],
  monthly: ["#6A1B9A", "#7B1FA2", "#AB47BC"],
  yearly: ["#E65100", "#F57C00", "#FFA726"],
};

const SUGGESTIONS: Record<Period, { title: string; emoji: string; color: string }[]> = {
  daily: [
    { title: "Meditate for 10 minutes", emoji: "🧘", color: "#26A69A" },
    { title: "Write in my journal", emoji: "📝", color: "#42A5F5" },
    { title: "Drink 8 glasses of water", emoji: "💧", color: "#29B6F6" },
    { title: "30 minutes without screens", emoji: "📵", color: "#66BB6A" },
    { title: "Morning stretch or movement", emoji: "☀️", color: "#FFA726" },
  ],
  weekly: [
    { title: "Exercise 3 times this week", emoji: "🏃", color: "#EF5350" },
    { title: "Call or meet a friend", emoji: "📞", color: "#42A5F5" },
    { title: "Cook a healthy meal", emoji: "🥗", color: "#66BB6A" },
    { title: "Try a new relaxation technique", emoji: "🌿", color: "#26A69A" },
    { title: "Read for 30 minutes", emoji: "📚", color: "#AB47BC" },
  ],
  monthly: [
    { title: "Complete a wellness challenge", emoji: "🎯", color: "#FF7043" },
    { title: "Declutter one space at home", emoji: "🧹", color: "#FFA726" },
    { title: "Write a monthly reflection", emoji: "💭", color: "#AB47BC" },
    { title: "Try something new", emoji: "🌱", color: "#66BB6A" },
    { title: "Rest and proper self-care day", emoji: "🛁", color: "#42A5F5" },
  ],
  yearly: [
    { title: "Build a daily meditation habit", emoji: "🌟", color: "#FFC107" },
    { title: "Read 12 books", emoji: "📖", color: "#AB47BC" },
    { title: "Improve my physical fitness", emoji: "💪", color: "#EF5350" },
    { title: "Prioritise my mental health", emoji: "🧠", color: "#26A69A" },
    { title: "Take a meaningful trip", emoji: "🌍", color: "#42A5F5" },
  ],
};

const EMOJI_OPTIONS = ["🎯","🌟","💧","🏃","📝","🧘","❤️","🌱","📚","🎨","💪","🌿","☀️","🌙","🍎","📞","🛁","💭","🏆","✨"];
const COLOR_OPTIONS = ["#26A69A","#42A5F5","#EF5350","#FFA726","#66BB6A","#AB47BC","#FF7043","#EC407A"];

function getDailyKey(date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function getWeekKey(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${weekNo}`;
}

function getMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getYearKey(date = new Date()): string {
  return `${date.getFullYear()}`;
}

function getPeriodKey(period: Period, date = new Date()): string {
  switch (period) {
    case "daily": return getDailyKey(date);
    case "weekly": return getWeekKey(date);
    case "monthly": return getMonthKey(date);
    case "yearly": return getYearKey(date);
  }
}

function getDailyStreak(completions: string[]): number {
  if (!completions.length) return 0;
  const set = new Set(completions);
  const today = getDailyKey();
  const yesterday = getDailyKey(new Date(Date.now() - 86400000));
  if (!set.has(today) && !set.has(yesterday)) return 0;
  let streak = 0;
  let checkDate = set.has(today) ? today : yesterday;
  for (let i = 0; i < 365; i++) {
    if (set.has(checkDate)) {
      streak++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = getDailyKey(d);
    } else {
      break;
    }
  }
  return streak;
}

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default function GoalsScreen() {
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [activePeriod, setActivePeriod] = useState<Period>("daily");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newEmoji, setNewEmoji] = useState("🎯");
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(GOALS_KEY);
      setGoals(raw ? JSON.parse(raw) : []);
    } catch {}
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const saveGoals = async (updated: Goal[]) => {
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(updated));
    setGoals(updated);
  };

  const periodGoals = goals.filter((g) => g.period === activePeriod);
  const currentKey = getPeriodKey(activePeriod);
  const completedGoals = periodGoals.filter((g) => g.completions.includes(currentKey));
  const doneCount = completedGoals.length;
  const totalCount = periodGoals.length;

  const toggleGoal = useCallback(
    async (goalId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;
      const key = getPeriodKey(goal.period);
      const isDone = goal.completions.includes(key);

      if (Platform.OS !== "web") {
        isDone
          ? Haptics.selectionAsync()
          : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const updated = goals.map((g) => {
        if (g.id !== goalId) return g;
        const completions = isDone
          ? g.completions.filter((c) => c !== key)
          : [...g.completions, key];
        return { ...g, completions };
      });

      await saveGoals(updated);

      if (!isDone) {
        try {
          const cd = await storage.getChallengeData();
          cd.xp += PERIOD_XP[goal.period];
          await storage.saveChallengeData(cd);
        } catch {}
        setJustCompleted(goalId);
        setTimeout(() => setJustCompleted(null), 2000);
      }
    },
    [goals]
  );

  const addGoal = useCallback(async () => {
    if (!newTitle.trim()) return;
    const goal: Goal = {
      id: genId(),
      period: activePeriod,
      title: newTitle.trim(),
      emoji: newEmoji,
      color: newColor,
      completions: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...goals, goal];
    await saveGoals(updated);
    setShowAdd(false);
    setNewTitle("");
    setNewEmoji("🎯");
    setNewColor(COLOR_OPTIONS[0]);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [goals, activePeriod, newTitle, newEmoji, newColor]);

  const quickAddGoal = useCallback(
    async (suggestion: { title: string; emoji: string; color: string }) => {
      if (Platform.OS !== "web") Haptics.selectionAsync();
      const goal: Goal = {
        id: genId(),
        period: activePeriod,
        title: suggestion.title,
        emoji: suggestion.emoji,
        color: suggestion.color,
        completions: [],
        createdAt: new Date().toISOString(),
      };
      const updated = [...goals, goal];
      await saveGoals(updated);
    },
    [goals, activePeriod]
  );

  const deleteGoal = (goalId: string) => {
    Alert.alert("Remove Goal", "Remove this goal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const updated = goals.filter((g) => g.id !== goalId);
          await saveGoals(updated);
          if (Platform.OS !== "web") Haptics.selectionAsync();
        },
      },
    ]);
  };

  const gradientColors = PERIOD_COLORS[activePeriod];

  const periodLabels: { period: Period; icon: keyof typeof Ionicons.glyphMap }[] = [
    { period: "daily", icon: "sunny" },
    { period: "weekly", icon: "calendar" },
    { period: "monthly", icon: "moon" },
    { period: "yearly", icon: "star" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={gradientColors}
        style={{
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: 0,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginRight: 10 }}>
            <Ionicons name="chevron-back" size={26} color="rgba(255,255,255,0.9)" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 24, color: "#fff" }}>
              Goals
            </Text>
            <Text style={{ fontFamily: "Nunito_400Regular", fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>
              Small intentions, lasting change
            </Text>
          </View>
          {totalCount > 0 && (
            <View style={{ alignItems: "center", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontFamily: "Nunito_800ExtraBold", fontSize: 20, color: "#fff" }}>
                {doneCount}/{totalCount}
              </Text>
              <Text style={{ fontFamily: "Nunito_500Medium", fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
                {PERIOD_LABELS[activePeriod].toLowerCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Period tabs */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingBottom: 0 }}>
          {periodLabels.map(({ period, icon }) => {
            const isActive = activePeriod === period;
            return (
              <Pressable
                key={period}
                onPress={() => {
                  setActivePeriod(period);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 10,
                  borderBottomWidth: 3,
                  borderBottomColor: isActive ? "#fff" : "transparent",
                }}
              >
                <Ionicons name={icon} size={16} color={isActive ? "#fff" : "rgba(255,255,255,0.45)"} />
                <Text
                  style={{
                    fontFamily: isActive ? "Nunito_700Bold" : "Nunito_400Regular",
                    fontSize: 11,
                    color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                    marginTop: 3,
                  }}
                >
                  {PERIOD_LABELS[period]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 80),
          paddingTop: 16,
        }}
      >
        {/* Progress bar */}
        {totalCount > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.text, opacity: 0.7 }}>
                {doneCount === totalCount
                  ? "All done! Great work."
                  : `${totalCount - doneCount} remaining`}
              </Text>
              <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: gradientColors[1] }}>
                {totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}%
              </Text>
            </View>
            <View style={{ height: 8, backgroundColor: isDark ? "#2C2C2C" : "#E8E8E8", borderRadius: 4, overflow: "hidden" }}>
              <Animated.View
                style={{
                  height: 8,
                  width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%`,
                  backgroundColor: gradientColors[1],
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
        )}

        {/* Goals list */}
        {periodGoals.length > 0 ? (
          <View style={{ paddingHorizontal: 16, gap: 8 }}>
            {periodGoals.map((goal, i) => {
              const key = getPeriodKey(goal.period);
              const isDone = goal.completions.includes(key);
              const isJustDone = justCompleted === goal.id;
              const streak = goal.period === "daily" ? getDailyStreak(goal.completions) : 0;

              return (
                <Animated.View
                  key={goal.id}
                  entering={Platform.OS !== "web" ? FadeInDown.delay(i * 60).duration(350) : undefined}
                >
                  <Pressable
                    onPress={() => toggleGoal(goal.id)}
                    onLongPress={() => deleteGoal(goal.id)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDone
                        ? isDark ? `${goal.color}22` : `${goal.color}15`
                        : isDark ? "#1C1C1C" : "#FAFAFA",
                      borderRadius: 16,
                      padding: 14,
                      borderWidth: 1.5,
                      borderColor: isDone ? goal.color : isDark ? "#282828" : "#EBEBEB",
                      opacity: pressed ? 0.8 : 1,
                      gap: 12,
                    })}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: isDone ? goal.color : isDark ? "#444" : "#CECECE",
                        backgroundColor: isDone ? goal.color : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isDone && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>

                    <Text style={{ fontSize: 22, lineHeight: 26 }}>{goal.emoji}</Text>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: "Nunito_600SemiBold",
                          fontSize: 14,
                          color: isDone ? (isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)") : colors.text,
                          textDecorationLine: isDone ? "line-through" : "none",
                        }}
                      >
                        {goal.title}
                      </Text>
                      {activePeriod === "daily" && streak > 0 && (
                        <Text style={{ fontFamily: "Nunito_500Medium", fontSize: 11, color: "#FF7043", marginTop: 2 }}>
                          {streak} day streak 🔥
                        </Text>
                      )}
                    </View>

                    {isJustDone && (
                      <Animated.View
                        entering={Platform.OS !== "web" ? ZoomIn.duration(300) : undefined}
                        style={{
                          backgroundColor: goal.color,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 11, color: "#fff" }}>
                          +{PERIOD_XP[goal.period]} XP
                        </Text>
                      </Animated.View>
                    )}

                    {!isJustDone && !isDone && (
                      <Text style={{ fontFamily: "Nunito_500Medium", fontSize: 11, color: isDark ? "#444" : "#C8C8C8" }}>
                        +{PERIOD_XP[goal.period]} XP
                      </Text>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}

            <Pressable
              onPress={() => setShowAdd(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 16,
                padding: 14,
                borderWidth: 1.5,
                borderColor: isDark ? "#2C2C2C" : "#E0E0E0",
                borderStyle: "dashed",
                marginTop: 4,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="add-circle-outline" size={18} color={gradientColors[1]} />
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: gradientColors[1] }}>
                Add {PERIOD_LABELS[activePeriod]} Goal
              </Text>
            </Pressable>
          </View>
        ) : (
          /* Empty state with suggestions */
          <View style={{ paddingHorizontal: 16 }}>
            <Text
              style={{
                fontFamily: "Nunito_700Bold",
                fontSize: 15,
                color: colors.text,
                marginBottom: 12,
                marginLeft: 4,
              }}
            >
              Quick add a {PERIOD_LABELS[activePeriod].toLowerCase()} goal
            </Text>
            <View style={{ gap: 8 }}>
              {SUGGESTIONS[activePeriod].map((s, i) => (
                <Animated.View
                  key={s.title}
                  entering={Platform.OS !== "web" ? FadeInDown.delay(i * 60).duration(350) : undefined}
                >
                  <Pressable
                    onPress={() => quickAddGoal(s)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDark ? "#1A1A1A" : "#FAFAFA",
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1.5,
                      borderColor: isDark ? "#2C2C2C" : "#EBEBEB",
                      gap: 12,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                    <Text
                      style={{
                        fontFamily: "Nunito_500Medium",
                        fontSize: 14,
                        color: colors.text,
                        flex: 1,
                      }}
                    >
                      {s.title}
                    </Text>
                    <View
                      style={{
                        backgroundColor: s.color,
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 11, color: "#fff" }}>
                        + Add
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            <Pressable
              onPress={() => setShowAdd(true)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 14,
                padding: 14,
                marginTop: 8,
                borderWidth: 1.5,
                borderColor: gradientColors[1],
                borderStyle: "dashed",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="create-outline" size={18} color={gradientColors[1]} />
              <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: gradientColors[1] }}>
                Write my own goal
              </Text>
            </Pressable>
          </View>
        )}

        {/* Science note */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 20,
            backgroundColor: isDark ? "#0D1B2A" : "#EEF6FF",
            borderRadius: 16,
            padding: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Ionicons name="bulb" size={15} color={gradientColors[1]} />
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: gradientColors[1] }}>
              Why goals support mental health
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "Nunito_400Regular",
              fontSize: 13,
              lineHeight: 20,
              color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)",
            }}
          >
            {"Setting intentions across different time horizons gives your brain a sense of direction and agency — two of the biggest predictors of emotional wellbeing. Daily goals build momentum. Weekly and monthly goals build identity. Yearly goals connect you to a bigger purpose. Together they lower the ambient anxiety that comes from feeling like life is just happening to you."}
          </Text>
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAdd}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdd(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
          onPress={() => setShowAdd(false)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: isDark ? "#1A1A1A" : "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24),
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 18, color: colors.text, flex: 1 }}>
                New {PERIOD_LABELS[activePeriod]} Goal
              </Text>
              <Pressable onPress={() => setShowAdd(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            {/* Emoji picker */}
            <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Choose an icon
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {EMOJI_OPTIONS.map((em) => (
                  <Pressable
                    key={em}
                    onPress={() => setNewEmoji(em)}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor:
                        newEmoji === em
                          ? isDark ? "#333" : "#F0F0F0"
                          : "transparent",
                      borderWidth: newEmoji === em ? 2 : 1,
                      borderColor:
                        newEmoji === em
                          ? gradientColors[1]
                          : isDark ? "#2C2C2C" : "#E8E8E8",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{em}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Title input */}
            <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Goal
            </Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder={`e.g. ${SUGGESTIONS[activePeriod][0].title}`}
              placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
              style={{
                fontFamily: "Nunito_400Regular",
                fontSize: 15,
                color: colors.text,
                backgroundColor: isDark ? "#252525" : "#F5F5F5",
                borderRadius: 12,
                padding: 14,
                marginBottom: 18,
                borderWidth: 1,
                borderColor: isDark ? "#333" : "#E8E8E8",
              }}
              returnKeyType="done"
              onSubmitEditing={addGoal}
              autoFocus
            />

            {/* Colour picker */}
            <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Colour
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
              {COLOR_OPTIONS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setNewColor(c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: c,
                    borderWidth: newColor === c ? 3 : 0,
                    borderColor: isDark ? "#fff" : "#333",
                    transform: [{ scale: newColor === c ? 1.15 : 1 }],
                  }}
                />
              ))}
            </View>

            <Pressable
              onPress={addGoal}
              style={({ pressed }) => ({
                backgroundColor: newTitle.trim() ? gradientColors[1] : (isDark ? "#333" : "#E0E0E0"),
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: "Nunito_700Bold",
                  fontSize: 15,
                  color: newTitle.trim() ? "#fff" : (isDark ? "#555" : "#AAAAAA"),
                }}
              >
                Add Goal
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
