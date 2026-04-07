import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  useColorScheme,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { storage, MoodEntry } from "@/lib/storage";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W, 430);

interface Plant {
  id: string;
  mood: string;
  emoji: string;
  name: string;
  color: string;
  x: number;
  size: number;
  description: string;
}

const MOODS = [
  { key: "happy",    icon: "sunny",          color: "#66BB6A", label: "Happy" },
  { key: "good",     icon: "happy",          color: "#81C784", label: "Good" },
  { key: "neutral",  icon: "remove-circle",  color: "#FFD54F", label: "Okay" },
  { key: "sad",      icon: "rainy",          color: "#FF8A65", label: "Sad" },
  { key: "stressed", icon: "thunderstorm",   color: "#EF5350", label: "Stressed" },
];

const MOOD_PLANT: Record<string, { emoji: string; name: string; color: string; darkColor: string; description: string }> = {
  happy:   { emoji: "🌻", name: "Sunflower",      color: "#FFD54F", darkColor: "#F57F17", description: "Joy & radiance" },
  good:    { emoji: "🌸", name: "Cherry Blossom", color: "#FF8A80", darkColor: "#C62828", description: "Contentment & grace" },
  neutral: { emoji: "🪷", name: "Lotus",          color: "#B39DDB", darkColor: "#4527A0", description: "Calm & balance" },
  sad:     { emoji: "🌿", name: "Fern",           color: "#66BB6A", darkColor: "#1B5E20", description: "Growth through rain" },
  stressed:{ emoji: "🌵", name: "Cactus",         color: "#4DB6AC", darkColor: "#004D40", description: "Resilience & strength" },
};

function PlantSprite({ plant, delay = 0 }: { plant: Plant; delay?: number }) {
  const sway = useSharedValue(0);
  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false,
    );
  }, []);
  const swayStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway.value * 4}deg` }] }));

  return (
    <Animated.View
      entering={Platform.OS !== "web" ? FadeIn.delay(delay).duration(600) : undefined}
      style={[styles.plantSprite, { left: plant.x, bottom: 0 }]}
    >
      <Animated.View style={swayStyle}>
        <Text style={{ fontSize: plant.size }}>{plant.emoji}</Text>
      </Animated.View>
      <Text style={[styles.plantLabel, { color: plant.color }]}>{plant.name}</Text>
    </Animated.View>
  );
}

function GardenHero({ plants, insetTop }: { plants: Plant[]; insetTop: number }) {
  const hour = new Date().getHours();
  const skyColors: [string, string, string] =
    hour >= 6  && hour < 9  ? ["#FF8A65", "#FFD54F", "#81D4FA"] :
    hour >= 9  && hour < 17 ? ["#64B5F6", "#B3E5FC", "#C8E6C9"] :
    hour >= 17 && hour < 20 ? ["#FF7043", "#FF8A65", "#FFB74D"] :
                               ["#0D1B4B", "#1A237E", "#283593"];

  const gardenW = CARD_W;

  return (
    <View style={[styles.heroWrap, { width: CARD_W }]}>
      <LinearGradient colors={skyColors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <View style={styles.grassLayer}>
        {plants.length === 0 ? (
          <View style={styles.emptyGarden}>
            <Text style={{ fontSize: 44 }}>🌱</Text>
            <Text style={styles.emptyText}>Log your first mood{"\n"}to grow your garden</Text>
          </View>
        ) : (
          plants.map((p, i) => <PlantSprite key={p.id} plant={p} delay={i * 120} />)
        )}
      </View>
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.55)"]}
        style={styles.heroOverlay}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />
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
    moods.forEach((m) => { map[m.date] = m.mood; });
    return map;
  }, [moods]);

  const getMoodColor = (mood: MoodEntry["mood"] | undefined) =>
    mood ? (MOODS.find((m) => m.key === mood)?.color ?? "transparent") : "transparent";

  const goToPrev = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(viewYear - 1)) : setViewMonth(viewMonth - 1);
  const goToNext = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(viewYear + 1)) : setViewMonth(viewMonth + 1);

  const cells = Array.from({ length: firstDayOfWeek + daysInMonth }, (_, i) => {
    if (i < firstDayOfWeek) return null;
    const day = i - firstDayOfWeek + 1;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { day, mood: moodMap[dateStr] };
  });

  const isToday = (day: number) => {
    const t = new Date();
    return day === t.getDate() && viewMonth === t.getMonth() && viewYear === t.getFullYear();
  };

  return (
    <View style={[styles.calCard, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.92)" }]}>
      <View style={styles.calHeader}>
        <Pressable onPress={goToPrev} hitSlop={14} style={styles.calNavBtn}>
          <Ionicons name="chevron-back" size={18} color={colors.tint} />
        </Pressable>
        <Text style={[styles.calMonth, { color: colors.text }]}>{monthName}</Text>
        <Pressable onPress={goToNext} hitSlop={14} style={styles.calNavBtn}>
          <Ionicons name="chevron-forward" size={18} color={colors.tint} />
        </Pressable>
      </View>

      <View style={styles.calDaysRow}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <Text key={d} style={[styles.calDayLabel, { color: colors.textSecondary }]}>{d}</Text>
        ))}
      </View>

      <View style={styles.calGrid}>
        {cells.map((cell, i) => (
          <View key={i} style={styles.calCell}>
            {cell ? (
              <View style={[
                styles.calDayInner,
                cell.mood ? { backgroundColor: getMoodColor(cell.mood) + "40" } : {},
                isToday(cell.day) ? { borderWidth: 1.5, borderColor: colors.tint } : {},
              ]}>
                <Text style={[styles.calDayNum, { color: colors.text }]}>{cell.day}</Text>
                {cell.mood && <View style={[styles.calDot, { backgroundColor: getMoodColor(cell.mood) }]} />}
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.calLegend}>
        {MOODS.map((m) => (
          <View key={m.key} style={styles.calLegendItem}>
            <View style={[styles.calLegendDot, { backgroundColor: m.color }]} />
            <Text style={[styles.calLegendText, { color: colors.textSecondary }]}>{m.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function MoodGardenScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [insight, setInsight] = useState("");

  useEffect(() => {
    (async () => {
      const data = await storage.getMoods();
      setMoods(data);
      buildGarden(data);
    })();
  }, []);

  const buildGarden = (data: MoodEntry[]) => {
    const recent = data.slice(-14);
    if (recent.length === 0) { setInsight("Your garden is waiting for its first mood entry."); return; }

    const counts: Record<string, number> = {};
    for (const m of recent) counts[m.mood] = (counts[m.mood] || 0) + 1;

    const gardenPlants: Plant[] = [];
    const positions: number[] = [];
    const totalSlots = CARD_W - 80;

    for (const [moodKey, count] of Object.entries(counts)) {
      const info = MOOD_PLANT[moodKey];
      if (!info) continue;
      for (let i = 0; i < Math.min(count, 4); i++) {
        let x: number, attempts = 0;
        do { x = 10 + Math.floor(Math.random() * totalSlots); attempts++; }
        while (positions.some((p) => Math.abs(p - x) < 45) && attempts < 20);
        positions.push(x);
        gardenPlants.push({
          id: `${moodKey}_${i}`, mood: moodKey,
          emoji: info.emoji, name: info.name, color: info.color,
          x, size: 28 + Math.floor(Math.random() * 16), description: info.description,
        });
      }
    }

    gardenPlants.sort((a, b) => a.x - b.x);
    setPlants(gardenPlants);

    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const insightMap: Record<string, string> = {
      happy:   "Your garden is thriving! Joy and sunflowers fill your days.",
      good:    "Cherry blossoms bloom — you're in a state of gentle contentment.",
      neutral: "Lotus flowers grow in still water. Your calm balance is a gift.",
      sad:     "Ferns grow strongest after rain. Your resilience is taking root.",
      stressed:"Cacti thrive in harsh conditions. Your strength is your superpower.",
    };
    setInsight(insightMap[dominant] || "Your garden reflects your inner world.");
  };

  const moodCounts = moods.slice(-14).reduce((acc, m) => {
    acc[m.mood] = (acc[m.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalEntries = moods.length;
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#0A1628" : "#EAF4EE" }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40 }}
      >
        {/* ── Hero Garden ── */}
        <View style={{ position: "relative" }}>
          <GardenHero plants={plants} insetTop={insets.top + webTopInset} />

          {/* Back button floating over hero */}
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={[styles.backBtn, { top: insets.top + webTopInset + 12 }]}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          {/* Title overlaid at bottom of hero */}
          <View style={styles.heroTitle}>
            <Text style={styles.heroTitleText}>Mood Garden</Text>
            <Text style={styles.heroSubText}>Your inner world, growing</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>

          {/* ── Insight card ── */}
          {insight ? (
            <Animated.View
              entering={Platform.OS !== "web" ? FadeInDown.delay(200).duration(500) : undefined}
            >
              <LinearGradient
                colors={isDark ? ["#1A2F1E", "#1E3D24"] : ["#1B5E20", "#2E7D32"]}
                style={styles.insightCard}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Text style={styles.insightEmoji}>
                  {dominantMood ? MOOD_PLANT[dominantMood[0]]?.emoji : "🌿"}
                </Text>
                <Text style={styles.insightText}>"{insight}"</Text>
                <Text style={styles.insightSub}>Based on your last 14 days</Text>
              </LinearGradient>
            </Animated.View>
          ) : null}

          {/* ── Stats strip ── */}
          <Animated.View
            entering={Platform.OS !== "web" ? FadeInDown.delay(280).duration(500) : undefined}
            style={styles.statsRow}
          >
            <View style={[styles.statPill, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.85)" }]}>
              <Text style={[styles.statVal, { color: colors.text }]}>{totalEntries}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Total logs</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.85)" }]}>
              <Text style={[styles.statVal, { color: colors.text }]}>{Object.keys(moodCounts).length}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Moods this fortnight</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.85)" }]}>
              <Text style={{ fontSize: 20 }}>{dominantMood ? MOOD_PLANT[dominantMood[0]]?.emoji : "🌱"}</Text>
              <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Top mood</Text>
            </View>
          </Animated.View>

          {/* ── Plant breakdown ── */}
          <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(360).duration(500) : undefined}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Your Plants</Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>Grown from your last 14 days</Text>
          </Animated.View>
        </View>

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(400).duration(500) : undefined}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plantRow}>
            {Object.entries(MOOD_PLANT).map(([key, val]) => {
              const count = moodCounts[key] || 0;
              return (
                <View key={key} style={styles.plantCard}>
                  <LinearGradient
                    colors={[val.darkColor, val.color]}
                    style={styles.plantCardGrad}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.plantCardEmoji}>{val.emoji}</Text>
                    <Text style={styles.plantCardName}>{val.name}</Text>
                    <Text style={styles.plantCardDesc}>{val.description}</Text>
                    <View style={styles.plantCardCount}>
                      <Text style={styles.plantCardCountNum}>{count}</Text>
                      <Text style={styles.plantCardCountLabel}>logged</Text>
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>

        <View style={{ paddingHorizontal: 20 }}>
          {/* ── Recent Moods ── */}
          {moods.length > 0 && (
            <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(480).duration(500) : undefined}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Recent Moods</Text>
              <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>Your last 10 check-ins</Text>
            </Animated.View>
          )}
        </View>

        {moods.length > 0 && (
          <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(510).duration(500) : undefined}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
              {moods.slice(0, 10).map((entry) => {
                const moodData = MOODS.find((m) => m.key === entry.mood);
                const plant = MOOD_PLANT[entry.mood];
                return (
                  <View key={entry.id} style={styles.recentCard}>
                    <LinearGradient
                      colors={[plant?.darkColor ?? "#333", plant?.color ?? "#666"]}
                      style={styles.recentGrad}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.recentEmoji}>{plant?.emoji ?? "🌱"}</Text>
                      <Text style={styles.recentDay}>
                        {new Date(entry.timestamp).toLocaleDateString("en-US", { weekday: "short" })}
                      </Text>
                      <Text style={styles.recentDate}>
                        {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Text>
                    </LinearGradient>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── Calendar ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(600).duration(500) : undefined}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Mood Calendar</Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>A full view of your emotional journey</Text>
            <MoodCalendar moods={moods} isDark={isDark} />
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  heroWrap: {
    height: 300,
    position: "relative",
    overflow: "hidden",
  },
  grassLayer: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: "48%",
    backgroundColor: "#66BB6A",
    overflow: "hidden",
  },
  heroOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
  },
  heroTitle: {
    position: "absolute", bottom: 20, left: 22,
  },
  heroTitleText: {
    fontFamily: "Nunito_800ExtraBold", fontSize: 30, color: "#fff",
    textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  heroSubText: {
    fontFamily: "Nunito_400Regular", fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 2,
  },
  backBtn: {
    position: "absolute", left: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center", justifyContent: "center",
  },

  plantSprite: { position: "absolute", alignItems: "center", gap: 2 },
  plantLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 9 },
  emptyGarden: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { fontFamily: "Nunito_600SemiBold", fontSize: 14, color: "#2E7D32", textAlign: "center", lineHeight: 20 },

  insightCard: {
    borderRadius: 20, padding: 20, marginTop: 20, marginBottom: 8,
  },
  insightEmoji: { fontSize: 36, marginBottom: 10 },
  insightText: { fontFamily: "Nunito_700Bold", fontSize: 16, color: "#fff", lineHeight: 24, fontStyle: "italic" },
  insightSub: { fontFamily: "Nunito_500Medium", fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 10 },

  statsRow: { flexDirection: "row", gap: 10, marginTop: 12, marginBottom: 4 },
  statPill: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 4 },
  statVal: { fontFamily: "Nunito_800ExtraBold", fontSize: 22 },
  statLbl: { fontFamily: "Nunito_500Medium", fontSize: 10, textAlign: "center" },

  sectionHeading: { fontFamily: "Nunito_800ExtraBold", fontSize: 20, marginTop: 24, marginBottom: 2 },
  sectionSub: { fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 14 },

  plantRow: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  plantCard: { width: 148, borderRadius: 20, overflow: "hidden" },
  plantCardGrad: { padding: 18, minHeight: 170, justifyContent: "flex-end" },
  plantCardEmoji: { fontSize: 38, marginBottom: 10 },
  plantCardName: { fontFamily: "Nunito_800ExtraBold", fontSize: 14, color: "#fff", marginBottom: 2 },
  plantCardDesc: { fontFamily: "Nunito_400Regular", fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 15, marginBottom: 10 },
  plantCardCount: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  plantCardCountNum: { fontFamily: "Nunito_800ExtraBold", fontSize: 22, color: "#fff" },
  plantCardCountLabel: { fontFamily: "Nunito_500Medium", fontSize: 11, color: "rgba(255,255,255,0.7)" },

  recentRow: { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },
  recentCard: { width: 78, borderRadius: 18, overflow: "hidden" },
  recentGrad: { padding: 12, paddingVertical: 16, alignItems: "center", gap: 6 },
  recentEmoji: { fontSize: 28 },
  recentDay: { fontFamily: "Nunito_700Bold", fontSize: 12, color: "#fff" },
  recentDate: { fontFamily: "Nunito_500Medium", fontSize: 10, color: "rgba(255,255,255,0.75)" },

  calCard: { borderRadius: 20, padding: 18, marginTop: 0 },
  calHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  calNavBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  calMonth: { fontFamily: "Nunito_700Bold", fontSize: 16 },
  calDaysRow: { flexDirection: "row", marginBottom: 8 },
  calDayLabel: { flex: 1, textAlign: "center", fontFamily: "Nunito_600SemiBold", fontSize: 11 },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  calDayInner: { flex: 1, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  calDayNum: { fontFamily: "Nunito_600SemiBold", fontSize: 12 },
  calDot: { width: 5, height: 5, borderRadius: 3, marginTop: 1 },
  calLegend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  calLegendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  calLegendDot: { width: 10, height: 10, borderRadius: 5 },
  calLegendText: { fontFamily: "Nunito_500Medium", fontSize: 11 },
});
