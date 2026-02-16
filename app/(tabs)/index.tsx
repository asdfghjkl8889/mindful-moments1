import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import {
  storage,
  MoodEntry,
  StreakData,
  ProfileData,
  getDailyQuote,
  getRandomQuote,
  getLarryMessage,
} from "@/lib/storage";

const MOODS = [
  { key: "happy" as const, icon: "sunny", label: "Happy", color: "#66BB6A" },
  { key: "good" as const, icon: "happy", label: "Good", color: "#81C784" },
  { key: "neutral" as const, icon: "remove-circle", label: "Okay", color: "#FFD54F" },
  { key: "sad" as const, icon: "rainy", label: "Sad", color: "#FF8A65" },
  { key: "stressed" as const, icon: "thunderstorm", label: "Stressed", color: "#EF5350" },
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
      <Text style={[styles.moodLabel, { color: selected ? mood.color : "#B2BEC3" }]}>
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
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function LarryTurtle({ message, isDark }: { message: string; isDark: boolean }) {
  const colors = isDark ? Colors.dark : Colors.light;
  const bobValue = useSharedValue(0);

  useEffect(() => {
    bobValue.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobValue.value }],
  }));

  return (
    <View
      style={[
        styles.larryCard,
        { backgroundColor: "#E8F5E9", borderColor: colors.cardBorder },
      ]}
    >
      <View style={styles.larryRow}>
        <Animated.View style={[styles.larryAvatar, bobStyle]}>
          <MaterialCommunityIcons name="turtle" size={36} color={colors.sage} />
        </Animated.View>
        <View style={styles.larryTextWrap}>
          <Text style={[styles.larryName, { color: colors.sage }]}>Larry the Turtle</Text>
          <Text style={[styles.larryMessage, { color: colors.textSecondary }]}>
            {message}
          </Text>
        </View>
      </View>
    </View>
  );
}

function MoodCalendar({ moods, isDark }: { moods: MoodEntry[]; isDark: boolean }) {
  const colors = isDark ? Colors.dark : Colors.light;
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const moodMap = useMemo(() => {
    const map: Record<string, MoodEntry["mood"]> = {};
    moods.forEach((m) => {
      map[m.date] = m.mood;
    });
    return map;
  }, [moods]);

  const getMoodColor = (mood: MoodEntry["mood"] | undefined) => {
    if (!mood) return "transparent";
    const m = MOODS.find((mo) => mo.key === mood);
    return m ? m.color : "transparent";
  };

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<View key={`empty-${i}`} style={styles.calDay} />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const mood = moodMap[dateStr];
    const mColor = getMoodColor(mood);
    const isToday = d === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();

    days.push(
      <View
        key={d}
        style={[
          styles.calDay,
          mood ? { backgroundColor: mColor + "25" } : {},
          isToday ? { borderWidth: 1.5, borderColor: colors.tint } : {},
        ]}
      >
        <Text
          style={[
            styles.calDayText,
            { color: mood ? mColor : colors.textTertiary },
            isToday && { color: colors.tint, fontFamily: "Nunito_700Bold" },
          ]}
        >
          {d}
        </Text>
        {mood && <View style={[styles.calDot, { backgroundColor: mColor }]} />}
      </View>,
    );
  }

  return (
    <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.calHeader}>
        <Pressable onPress={goToPrevMonth} style={styles.calNavBtn}>
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </Pressable>
        <Text style={[styles.calMonthText, { color: colors.text }]}>{monthName}</Text>
        <Pressable onPress={goToNextMonth} style={styles.calNavBtn}>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
      <View style={styles.calWeekRow}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <Text key={i} style={[styles.calWeekDay, { color: colors.textTertiary }]}>{d}</Text>
        ))}
      </View>
      <View style={styles.calGrid}>{days}</View>
      <View style={styles.calLegend}>
        {MOODS.map((m) => (
          <View key={m.key} style={styles.calLegendItem}>
            <View style={[styles.calLegendDot, { backgroundColor: m.color }]} />
            <Text style={[styles.calLegendText, { color: colors.textTertiary }]}>{m.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [selectedMood, setSelectedMood] = useState<MoodEntry["mood"] | null>(null);
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0, longestStreak: 0, lastActiveDate: "", totalSessions: 0, totalMinutes: 0,
  });
  const [allMoods, setAllMoods] = useState<MoodEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [moodSaved, setMoodSaved] = useState(false);
  const [quote, setQuote] = useState(getDailyQuote());
  const [larryMsg] = useState(getLarryMessage());
  const [profile, setProfile] = useState<ProfileData>({ name: "", avatar: "lotus" });

  const loadData = useCallback(async () => {
    const [streakData, moods, profileData] = await Promise.all([
      storage.getStreak(),
      storage.getMoods(),
      storage.getProfile(),
    ]);
    setStreak(streakData);
    setAllMoods(moods);
    setProfile(profileData);

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
    setQuote(getRandomQuote());
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

  const shuffleQuote = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setQuote(getRandomQuote());
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const recentMoods = allMoods.slice(0, 7);

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
      <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(600) : undefined}>
        <LinearGradient
          colors={["#E0F7FA", "#C8E6C9", "#FFFFFF"]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {getGreeting()}{profile.name ? `, ${profile.name}` : ""}
              </Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                How are you feeling?
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/profile")}
              style={({ pressed }) => [
                styles.profileBtn,
                { backgroundColor: colors.tint + "20", opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="person" size={20} color={colors.tint} />
            </Pressable>
          </View>
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
        entering={Platform.OS !== "web" ? FadeInDown.delay(150).duration(600) : undefined}
        style={{ marginHorizontal: 20, marginTop: 8 }}
      >
        <LarryTurtle message={larryMsg} isDark={isDark} />
      </Animated.View>

      <Animated.View
        entering={Platform.OS !== "web" ? FadeInDown.delay(250).duration(600) : undefined}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Progress</Text>
        <View style={styles.statsRow}>
          <StatCard icon="flame" value={streak.currentStreak} label="Day Streak" color="#FF6B6B" isDark={isDark} />
          <StatCard icon="time" value={streak.totalMinutes} label="Total Min" color={colors.tint} isDark={isDark} />
          <StatCard icon="heart" value={streak.totalSessions} label="Sessions" color={colors.lavender} isDark={isDark} />
        </View>
      </Animated.View>

      <Animated.View
        entering={Platform.OS !== "web" ? FadeInDown.delay(300).duration(600) : undefined}
      >
        <Pressable onPress={() => router.push("/inspiration")}>
          <View
            style={[styles.quoteCard, { backgroundColor: colors.tealLight, borderColor: colors.cardBorder }]}
          >
            <View style={styles.quoteHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="sparkles" size={20} color={colors.tint} />
                <Text style={[styles.quoteBadge, { color: colors.tint }]}>Daily Inspiration</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </View>
            <Text style={[styles.quoteText, { color: colors.text }]}>
              "{quote.text}"
            </Text>
            <Text style={[styles.quoteAuthor, { color: colors.textSecondary }]}>
              - {quote.author}
            </Text>
          </View>
        </Pressable>

        <Pressable onPress={shuffleQuote} style={styles.shuffleWrap}>
          <Ionicons name="shuffle" size={14} color={colors.textTertiary} />
          <Text style={[styles.shuffleText, { color: colors.textTertiary }]}>Shuffle quote</Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        entering={Platform.OS !== "web" ? FadeInDown.delay(400).duration(600) : undefined}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mood Calendar</Text>
        <View style={{ paddingHorizontal: 20 }}>
          <MoodCalendar moods={allMoods} isDark={isDark} />
        </View>
      </Animated.View>

      {recentMoods.length > 0 && (
        <Animated.View
          entering={Platform.OS !== "web" ? FadeInRight.delay(500).duration(600) : undefined}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Moods</Text>
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
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  <Ionicons name={moodData?.icon as any} size={22} color={moodData?.color} />
                  <Text style={[styles.moodHistoryLabel, { color: colors.textSecondary }]}>
                    {new Date(entry.timestamp).toLocaleDateString("en-US", { weekday: "short" })}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    marginHorizontal: 20, borderRadius: 20, padding: 24, marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  profileBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
  },
  greeting: { fontFamily: "Nunito_500Medium", fontSize: 15, marginBottom: 4 },
  headerTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 26 },
  moodRow: {
    flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 8,
  },
  moodBtn: {
    alignItems: "center", justifyContent: "center", width: 62, height: 72, borderRadius: 16, borderWidth: 2, borderColor: "transparent", gap: 4,
  },
  moodLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 11 },
  moodSavedWrap: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8, paddingHorizontal: 20,
  },
  moodSavedText: { fontFamily: "Nunito_500Medium", fontSize: 13 },
  larryCard: {
    borderRadius: 16, padding: 16, borderWidth: 1,
  },
  larryRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  larryAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(123,174,127,0.15)", alignItems: "center", justifyContent: "center",
  },
  larryTextWrap: { flex: 1 },
  larryName: { fontFamily: "Nunito_700Bold", fontSize: 14, marginBottom: 2 },
  larryMessage: { fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 18 },
  sectionTitle: {
    fontFamily: "Nunito_700Bold", fontSize: 18, marginHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  statsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1, gap: 6,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  statValue: { fontFamily: "Nunito_800ExtraBold", fontSize: 22 },
  statLabel: { fontFamily: "Nunito_500Medium", fontSize: 11 },
  quoteCard: {
    marginHorizontal: 20, marginTop: 24, borderRadius: 16, padding: 20, borderWidth: 1,
  },
  quoteHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8,
  },
  quoteBadge: { fontFamily: "Nunito_600SemiBold", fontSize: 13 },
  quoteText: {
    fontFamily: "Nunito_600SemiBold", fontSize: 15, fontStyle: "italic", lineHeight: 22, marginBottom: 8,
  },
  quoteAuthor: { fontFamily: "Nunito_500Medium", fontSize: 13, textAlign: "right" },
  shuffleWrap: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8, paddingHorizontal: 20,
  },
  shuffleText: { fontFamily: "Nunito_500Medium", fontSize: 12 },
  calendarCard: {
    borderRadius: 16, padding: 16, borderWidth: 1,
  },
  calHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
  },
  calNavBtn: { padding: 4 },
  calMonthText: { fontFamily: "Nunito_700Bold", fontSize: 16 },
  calWeekRow: {
    flexDirection: "row", marginBottom: 8,
  },
  calWeekDay: {
    flex: 1, textAlign: "center", fontFamily: "Nunito_600SemiBold", fontSize: 11,
  },
  calGrid: {
    flexDirection: "row", flexWrap: "wrap",
  },
  calDay: {
    width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 8,
  },
  calDayText: { fontFamily: "Nunito_500Medium", fontSize: 12 },
  calDot: {
    width: 4, height: 4, borderRadius: 2, marginTop: 2,
  },
  calLegend: {
    flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 12,
  },
  calLegendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  calLegendDot: { width: 8, height: 8, borderRadius: 4 },
  calLegendText: { fontFamily: "Nunito_500Medium", fontSize: 10 },
  moodHistoryRow: { paddingHorizontal: 20, gap: 10 },
  moodHistoryCard: {
    alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 14, borderWidth: 1, width: 64, gap: 6,
  },
  moodHistoryLabel: { fontFamily: "Nunito_500Medium", fontSize: 11 },
});
