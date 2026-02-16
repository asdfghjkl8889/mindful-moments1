import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { storage, MoodEntry, StreakData } from "@/lib/storage";

const MOODS = [
  { key: "happy" as const, icon: "sunny", label: "Happy", color: "#66BB6A" },
  {
    key: "good" as const,
    icon: "happy",
    label: "Good",
    color: "#81C784",
  },
  {
    key: "neutral" as const,
    icon: "remove-circle",
    label: "Okay",
    color: "#FFD54F",
  },
  { key: "sad" as const, icon: "rainy", label: "Sad", color: "#FF8A65" },
  {
    key: "stressed" as const,
    icon: "thunderstorm",
    label: "Stressed",
    color: "#EF5350",
  },
];

function MoodButton({
  mood,
  selected,
  onPress,
}: {
  mood: (typeof MOODS)[0];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.moodBtn,
        selected && { backgroundColor: mood.color + "20", borderColor: mood.color },
        pressed && { transform: [{ scale: 0.92 }] },
      ]}
    >
      <Ionicons
        name={mood.icon as any}
        size={28}
        color={selected ? mood.color : "#B2BEC3"}
      />
      <Text
        style={[
          styles.moodLabel,
          { color: selected ? mood.color : "#B2BEC3" },
        ]}
      >
        {mood.label}
      </Text>
    </Pressable>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
  isDark,
}: {
  icon: string;
  value: string | number;
  label: string;
  color: string;
  isDark: boolean;
}) {
  const colors = isDark ? Colors.dark : Colors.light;
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [selectedMood, setSelectedMood] = useState<MoodEntry["mood"] | null>(
    null,
  );
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: "",
    totalSessions: 0,
    totalMinutes: 0,
  });
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [moodSaved, setMoodSaved] = useState(false);

  const loadData = useCallback(async () => {
    const [streakData, moods] = await Promise.all([
      storage.getStreak(),
      storage.getMoods(),
    ]);
    setStreak(streakData);
    setRecentMoods(moods.slice(0, 7));

    const today = new Date().toISOString().split("T")[0];
    const todayMood = moods.find((m) => m.date === today);
    if (todayMood) {
      setSelectedMood(todayMood.mood);
      setMoodSaved(true);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleMoodSelect = async (mood: MoodEntry["mood"]) => {
    if (moodSaved) return;
    setSelectedMood(mood);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await storage.addMood(mood, "");
    setMoodSaved(true);
    await loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + webTopInset + 16,
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Animated.View
        entering={Platform.OS !== "web" ? FadeInDown.duration(600) : undefined}
      >
        <LinearGradient
          colors={
            isDark
              ? ["#0A2E2A", "#1A1A2E"]
              : ["#E0F2F1", "#C8E6C9", "#FAFAF5"]
          }
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            How are you feeling?
          </Text>
        </LinearGradient>
      </Animated.View>

      <View style={styles.moodRow}>
        {MOODS.map((mood) => (
          <MoodButton
            key={mood.key}
            mood={mood}
            selected={selectedMood === mood.key}
            onPress={() => handleMoodSelect(mood.key)}
          />
        ))}
      </View>

      {moodSaved && (
        <View style={styles.moodSavedWrap}>
          <Ionicons name="checkmark-circle" size={16} color={colors.sage} />
          <Text style={[styles.moodSavedText, { color: colors.sage }]}>
            Today's mood recorded
          </Text>
        </View>
      )}

      <Animated.View
        entering={
          Platform.OS !== "web" ? FadeInDown.delay(200).duration(600) : undefined
        }
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Your Progress
        </Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="flame"
            value={streak.currentStreak}
            label="Day Streak"
            color="#FF6B6B"
            isDark={isDark}
          />
          <StatCard
            icon="time"
            value={streak.totalMinutes}
            label="Total Min"
            color={colors.tint}
            isDark={isDark}
          />
          <StatCard
            icon="heart"
            value={streak.totalSessions}
            label="Sessions"
            color={colors.lavender}
            isDark={isDark}
          />
        </View>
      </Animated.View>

      {recentMoods.length > 0 && (
        <Animated.View
          entering={
            Platform.OS !== "web"
              ? FadeInRight.delay(400).duration(600)
              : undefined
          }
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Moods
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodHistoryRow}
          >
            {recentMoods.map((entry) => {
              const moodData = MOODS.find((m) => m.key === entry.mood);
              return (
                <View
                  key={entry.id}
                  style={[
                    styles.moodHistoryCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={moodData?.icon as any}
                    size={22}
                    color={moodData?.color}
                  />
                  <Text
                    style={[
                      styles.moodHistoryLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {new Date(entry.timestamp).toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

      <Animated.View
        entering={
          Platform.OS !== "web"
            ? FadeInDown.delay(500).duration(600)
            : undefined
        }
      >
        <View
          style={[
            styles.quoteCard,
            { backgroundColor: colors.tealLight, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons
            name="sparkles"
            size={20}
            color={colors.tint}
            style={{ marginBottom: 8 }}
          />
          <Text style={[styles.quoteText, { color: colors.text }]}>
            "The present moment is filled with joy and happiness. If you are
            attentive, you will see it."
          </Text>
          <Text style={[styles.quoteAuthor, { color: colors.textSecondary }]}>
            - Thich Nhat Hanh
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  greeting: {
    fontFamily: "Nunito_500Medium",
    fontSize: 15,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 26,
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  moodBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 62,
    height: 72,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 4,
  },
  moodLabel: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11,
  },
  moodSavedWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  moodSavedText: {
    fontFamily: "Nunito_500Medium",
    fontSize: 13,
  },
  sectionTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    gap: 6,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 22,
  },
  statLabel: {
    fontFamily: "Nunito_500Medium",
    fontSize: 11,
  },
  moodHistoryRow: {
    paddingHorizontal: 20,
    gap: 10,
  },
  moodHistoryCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    width: 64,
    gap: 6,
  },
  moodHistoryLabel: {
    fontFamily: "Nunito_500Medium",
    fontSize: 11,
  },
  quoteCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  quoteText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 22,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontFamily: "Nunito_500Medium",
    fontSize: 13,
    textAlign: "right",
  },
});
