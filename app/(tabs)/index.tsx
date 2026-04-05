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
  withDelay,
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

const MOOD_PLANT_MAP: Record<string, { emoji: string; color: string; name: string }> = {
  happy:   { emoji: "🌻", color: "#FFD54F", name: "Sunflower" },
  good:    { emoji: "🌸", color: "#FF8A80", name: "Blossom" },
  neutral: { emoji: "🪷", color: "#B39DDB", name: "Lotus" },
  sad:     { emoji: "🌿", color: "#66BB6A", name: "Fern" },
  stressed:{ emoji: "🌵", color: "#4DB6AC", name: "Cactus" },
};

const GARDEN_INSIGHTS: Record<string, string> = {
  happy: "Your garden is blooming with joy 🌻",
  good: "Cherry blossoms fill your garden 🌸",
  neutral: "Lotus flowers grow in still water 🪷",
  sad: "Ferns flourish after rain 🌿",
  stressed: "Your cactus stands tall and resilient 🌵",
};

function MiniMoodGarden({ moods, isDark }: { moods: MoodEntry[]; isDark: boolean }) {
  const colors = isDark ? Colors.dark : Colors.light;
  const recent = moods.slice(-14);

  const counts: Record<string, number> = {};
  for (const m of recent) counts[m.mood] = (counts[m.mood] || 0) + 1;

  type PlantItem = { emoji: string; size: number; x: number; key: string };
  const plants: PlantItem[] = [];
  const positions: number[] = [];
  const gardenW = 260;

  for (const [moodKey, count] of Object.entries(counts)) {
    const info = MOOD_PLANT_MAP[moodKey];
    if (!info) continue;
    const num = Math.min(count, 3);
    for (let i = 0; i < num; i++) {
      let x: number;
      let attempts = 0;
      do { x = 8 + Math.floor(Math.random() * (gardenW - 40)); attempts++; }
      while (positions.some((p) => Math.abs(p - x) < 38) && attempts < 20);
      positions.push(x);
      plants.push({ emoji: info.emoji, size: 22 + Math.floor(Math.random() * 12), x, key: `${moodKey}_${i}` });
    }
  }
  plants.sort((a, b) => a.x - b.x);

  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const positiveCount = (counts.happy || 0) + (counts.good || 0);
  const health = recent.length > 0 ? Math.round((positiveCount / recent.length) * 100) : 0;
  const insight = dominant ? GARDEN_INSIGHTS[dominant] : "Log a mood to grow your garden 🌱";

  const sway = useSharedValue(0);
  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);
  const swayStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway.value * 3}deg` }] }));

  const hour = new Date().getHours();
  const skyColors: [string, string] =
    hour >= 6 && hour < 9 ? ["#FFE0B2", "#81D4FA"] :
    hour >= 9 && hour < 17 ? ["#B3E5FC", "#E8F5E9"] :
    hour >= 17 && hour < 20 ? ["#FF8A65", "#FFB74D"] :
    ["#283593", "#1A237E"];

  return (
    <Pressable
      onPress={() => router.push("/mood-garden" as any)}
      style={({ pressed }) => [
        styles.miniGardenCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.93 : 1 },
      ]}
    >
      <View style={styles.miniGardenHeader}>
        <View style={styles.miniGardenTitleRow}>
          <Text style={{ fontSize: 18 }}>🌿</Text>
          <Text style={[styles.miniGardenTitle, { color: colors.text }]}>Mood Garden</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {recent.length > 0 && (
            <View style={[styles.miniHealthBadge, {
              backgroundColor: health >= 60 ? "#66BB6A20" : health >= 30 ? "#FFD54F20" : "#FF8A8020",
            }]}>
              <Text style={[styles.miniHealthText, {
                color: health >= 60 ? "#388E3C" : health >= 30 ? "#F57F17" : "#C62828",
              }]}>{health}% healthy</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </View>
      </View>

      <LinearGradient colors={skyColors} style={styles.miniSky} />
      <View style={styles.miniGrass}>
        {plants.length === 0 ? (
          <View style={styles.miniEmptyGarden}>
            <Text style={{ fontSize: 28 }}>🌱</Text>
            <Text style={[styles.miniEmptyText, { color: "#2E7D32" }]}>Log a mood to plant your garden</Text>
          </View>
        ) : (
          plants.map((p) => (
            <Animated.View key={p.key} style={[{ position: "absolute", bottom: 2, left: p.x }, swayStyle]}>
              <Text style={{ fontSize: p.size }}>{p.emoji}</Text>
            </Animated.View>
          ))
        )}
      </View>

      <Text style={[styles.miniInsight, { color: colors.textSecondary }]}>{insight}</Text>
    </Pressable>
  );
}

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

const QUICK_ACTIONS = [
  { icon: "musical-notes", label: "Meditate", color: "#26A69A", bg: "#E0F7FA", route: "/(tabs)/meditate" },
  { icon: "book", label: "Journal", color: "#FF8A65", bg: "#FFF3E0", route: "/(tabs)/journal" },
  { icon: "flash", label: "Quick Calm", color: "#9C27B0", bg: "#F3E5F5", route: "/quick-calm" },
  { icon: "leaf", label: "Breathe", color: "#EF5350", bg: "#FFEBEE", route: "/game/breathing" },
] as const;

function QuickActions() {
  return (
    <View style={qaStyles.row}>
      {QUICK_ACTIONS.map((action) => (
        <Pressable
          key={action.label}
          onPress={() => router.push(action.route as any)}
          style={({ pressed }) => [qaStyles.pill, { backgroundColor: action.bg, opacity: pressed ? 0.82 : 1 }]}
        >
          <View style={[qaStyles.iconCircle, { backgroundColor: action.color + "22" }]}>
            <Ionicons name={action.icon as any} size={22} color={action.color} />
          </View>
          <Text style={[qaStyles.pillLabel, { color: action.color }]}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const qaStyles = StyleSheet.create({
  row: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginTop: 16, marginBottom: 4 },
  pill: {
    flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 20, gap: 8,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  pillLabel: { fontFamily: "Nunito_700Bold", fontSize: 11 },
});

const FOR_YOU: Record<string, { title: string; sub: string; icon: string; color: string; route: string }[]> = {
  happy: [
    { title: "Mood Garden", sub: "Your garden is blooming", icon: "leaf", color: "#66BB6A", route: "/mood-garden" },
    { title: "Focus Session", sub: "Ride this energy", icon: "radio-button-on", color: "#26A69A", route: "/(tabs)/meditate" },
    { title: "Gratitude Wall", sub: "Capture the moment", icon: "images", color: "#FF8A65", route: "/(tabs)/journal" },
  ],
  good: [
    { title: "Body Scan", sub: "Deepen your awareness", icon: "body", color: "#B39DDB", route: "/(tabs)/meditate" },
    { title: "Daily Inspiration", sub: "Explore 100+ quotes", icon: "sparkles", color: "#26A69A", route: "/inspiration" },
    { title: "Challenges", sub: "Level up your practice", icon: "trophy", color: "#FFD54F", route: "/challenges" },
  ],
  neutral: [
    { title: "Calm Mind", sub: "Find your center", icon: "water", color: "#81D4FA", route: "/(tabs)/meditate" },
    { title: "Quick Calm", sub: "Under 90 seconds", icon: "flash", color: "#9C27B0", route: "/quick-calm" },
    { title: "Gratitude Wall", sub: "Shift your perspective", icon: "images", color: "#FF8A65", route: "/(tabs)/journal" },
  ],
  sad: [
    { title: "Self-Compassion", sub: "Be kind to yourself", icon: "heart", color: "#EF5350", route: "/quick-calm" },
    { title: "Body Scan", sub: "Ground in your body", icon: "body", color: "#B39DDB", route: "/(tabs)/meditate" },
    { title: "Reframe Thoughts", sub: "CBT thought record", icon: "bulb", color: "#FF8A65", route: "/negative-thoughts" },
  ],
  stressed: [
    { title: "Breathe Now", sub: "Instant calm in 60s", icon: "leaf", color: "#EF5350", route: "/game/breathing" },
    { title: "Quick Calm", sub: "Box breath + grounding", icon: "flash", color: "#9C27B0", route: "/quick-calm" },
    { title: "Crisis Support", sub: "You are not alone", icon: "shield-checkmark", color: "#FF8A65", route: "/emergency" },
  ],
  default: [
    { title: "Calm Mind", sub: "Start your practice", icon: "water", color: "#81D4FA", route: "/(tabs)/meditate" },
    { title: "Daily Inspiration", sub: "100+ mindful quotes", icon: "sparkles", color: "#26A69A", route: "/inspiration" },
    { title: "Quick Calm", sub: "Under 90 seconds", icon: "flash", color: "#9C27B0", route: "/quick-calm" },
  ],
};

function ForYouSection({ mood, isDark }: { mood: string | null; isDark: boolean }) {
  const colors = isDark ? Colors.dark : Colors.light;
  const recs = FOR_YOU[mood ?? "default"] ?? FOR_YOU.default;

  return (
    <View style={{ marginTop: 28 }}>
      <View style={fyStyles.header}>
        <Text style={[fyStyles.title, { color: colors.text }]}>For You Today</Text>
        <View style={[fyStyles.badge, { backgroundColor: colors.tint + "18" }]}>
          <Text style={[fyStyles.badgeText, { color: colors.tint }]}>Personalized</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={fyStyles.cardRow}
      >
        {recs.map((rec) => (
          <Pressable
            key={rec.title}
            onPress={() => router.push(rec.route as any)}
            style={({ pressed }) => [
              fyStyles.card,
              { backgroundColor: rec.color + "12", borderColor: rec.color + "30", opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <View style={[fyStyles.cardIcon, { backgroundColor: rec.color + "20" }]}>
              <Ionicons name={rec.icon as any} size={20} color={rec.color} />
            </View>
            <Text style={[fyStyles.cardTitle, { color: colors.text }]}>{rec.title}</Text>
            <Text style={[fyStyles.cardSub, { color: colors.textSecondary }]}>{rec.sub}</Text>
            <View style={[fyStyles.cardChip, { backgroundColor: rec.color }]}>
              <Text style={fyStyles.cardChipText}>Open</Text>
              <Ionicons name="arrow-forward" size={10} color="#fff" />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const fyStyles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginBottom: 14 },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 18 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontFamily: "Nunito_600SemiBold", fontSize: 11 },
  cardRow: { paddingHorizontal: 20, gap: 12 },
  card: {
    width: 150, borderRadius: 20, padding: 16, borderWidth: 1, gap: 8,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontFamily: "Nunito_700Bold", fontSize: 14 },
  cardSub: { fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 16 },
  cardChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  cardChipText: { fontFamily: "Nunito_700Bold", fontSize: 11, color: "#fff" },
});

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

  const heroGradient = useMemo((): [string, string, string] => {
    const h = new Date().getHours();
    if (h >= 5 && h < 9)  return ["#FFB74D", "#FFA726", "#E0F7FA"];
    if (h >= 9 && h < 12) return ["#81D4FA", "#4FC3F7", "#E8F5E9"];
    if (h >= 12 && h < 17) return ["#4DB6AC", "#26A69A", "#B2EBF2"];
    if (h >= 17 && h < 20) return ["#FF8A65", "#FF7043", "#FFB74D"];
    return ["#7986CB", "#5C6BC0", "#B39DDB"];
  }, []);

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: 0,
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* ─── Immersive Hero ─── */}
      <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(700) : undefined}>
        <LinearGradient
          colors={heroGradient}
          style={[styles.hero, { paddingTop: insets.top + webTopInset + 20 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroTopRow}>
            <View style={[styles.streakBadge, { backgroundColor: "rgba(255,255,255,0.35)" }]}>
              <Ionicons name="flame" size={14} color="#FF6B6B" />
              <Text style={styles.streakBadgeText}>
                {streak.currentStreak} day streak
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/profile")}
              style={({ pressed }) => [
                styles.profileBtn,
                { backgroundColor: "rgba(255,255,255,0.35)", opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="person" size={20} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.heroGreeting}>
            {getGreeting()}{profile.name ? `, ${profile.name}` : ""}
          </Text>
          <Text style={styles.heroTitle}>Your mindful space</Text>
          <Text style={styles.heroSub}>How are you feeling today?</Text>
        </LinearGradient>
      </Animated.View>

      {/* ─── Mood Row ─── */}
      <View style={[styles.moodRow, { marginTop: -8 }]}>
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

      {/* ─── Quick Actions ─── */}
      <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(100).duration(600) : undefined}>
        <QuickActions />
      </Animated.View>

      {/* ─── For You Today ─── */}
      <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(160).duration(600) : undefined}>
        <ForYouSection mood={selectedMood} isDark={isDark} />
      </Animated.View>

      <Animated.View
        entering={Platform.OS !== "web" ? FadeInDown.delay(200).duration(600) : undefined}
        style={{ marginHorizontal: 20, marginTop: 20 }}
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

      <Animated.View
        entering={Platform.OS !== "web" ? FadeInDown.delay(450).duration(600) : undefined}
        style={{ paddingHorizontal: 20, marginTop: 4 }}
      >
        <MiniMoodGarden moods={allMoods} isDark={isDark} />
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

    <Pressable
      onPress={() => router.push("/emergency")}
      style={({ pressed }) => [
        styles.emergencyFab,
        {
          bottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90,
          opacity: pressed ? 0.88 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Ionicons name="shield-checkmark" size={18} color="#fff" />
      <Text style={styles.emergencyFabText}>Crisis Support</Text>
    </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1 },
  emergencyFab: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#EF5350",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    shadowColor: "#EF5350",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  emergencyFabText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: "#fff",
  },
  hero: {
    paddingHorizontal: 24, paddingBottom: 32,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  streakBadge: {
    flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  streakBadgeText: { fontFamily: "Nunito_700Bold", fontSize: 13, color: "#fff" },
  profileBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
  },
  heroGreeting: { fontFamily: "Nunito_500Medium", fontSize: 16, color: "rgba(255,255,255,0.85)", marginBottom: 6 },
  heroTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 30, color: "#fff", marginBottom: 8 },
  heroSub: { fontFamily: "Nunito_500Medium", fontSize: 14, color: "rgba(255,255,255,0.75)" },
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
  miniGardenCard: {
    borderRadius: 20, borderWidth: 1, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  miniGardenHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  miniGardenTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniGardenTitle: { fontFamily: "Nunito_700Bold", fontSize: 16 },
  miniHealthBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  miniHealthText: { fontFamily: "Nunito_700Bold", fontSize: 11 },
  miniSky: { height: 40, width: "100%" },
  miniGrass: {
    height: 64, backgroundColor: "#A5D6A7", width: "100%",
    position: "relative",
  },
  miniEmptyGarden: { flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  miniEmptyText: { fontFamily: "Nunito_500Medium", fontSize: 13 },
  miniInsight: {
    fontFamily: "Nunito_500Medium", fontSize: 13, textAlign: "center",
    paddingHorizontal: 16, paddingVertical: 10,
  },
});
