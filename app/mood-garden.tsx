import React, { useEffect, useState, useRef, useMemo } from "react";
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
const GARDEN_W = Math.min(SCREEN_W - 40, 400);

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

  const getMoodColor = (mood: MoodEntry["mood"] | undefined) => {
    if (!mood) return "transparent";
    return MOODS.find((m) => m.key === mood)?.color ?? "transparent";
  };

  const goToPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const goToNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const cells = Array.from({ length: firstDayOfWeek + daysInMonth }, (_, i) => {
    if (i < firstDayOfWeek) return null;
    const day = i - firstDayOfWeek + 1;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { day, mood: moodMap[dateStr] };
  });

  return (
    <View style={{ backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 16, padding: 16, width: GARDEN_W }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Pressable onPress={goToPrev} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color={colors.tint} />
        </Pressable>
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 15, color: colors.text }}>{monthName}</Text>
        <Pressable onPress={goToNext} hitSlop={12}>
          <Ionicons name="chevron-forward" size={20} color={colors.tint} />
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <Text key={d} style={{ flex: 1, textAlign: "center", fontFamily: "Nunito_600SemiBold", fontSize: 11, color: colors.textSecondary }}>{d}</Text>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {cells.map((cell, i) => (
          <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
            {cell ? (
              <View style={{
                flex: 1, borderRadius: 8, alignItems: "center", justifyContent: "center",
                backgroundColor: cell.mood ? getMoodColor(cell.mood) + "55" : "transparent",
              }}>
                <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: colors.text }}>{cell.day}</Text>
                {cell.mood && (
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: getMoodColor(cell.mood), marginTop: 1 }} />
                )}
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {MOODS.map((m) => (
          <View key={m.key} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: m.color }} />
            <Text style={{ fontFamily: "Nunito_500Medium", fontSize: 11, color: colors.textSecondary }}>{m.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const MOOD_PLANT: Record<string, { emoji: string; name: string; color: string; description: string }> = {
  happy: { emoji: "🌻", name: "Sunflower", color: "#FFD54F", description: "Joy & radiance" },
  good: { emoji: "🌸", name: "Cherry Blossom", color: "#FF8A80", description: "Contentment & grace" },
  neutral: { emoji: "🪷", name: "Lotus", color: "#B39DDB", description: "Calm & balance" },
  sad: { emoji: "🌿", name: "Fern", color: "#66BB6A", description: "Growth through rain" },
  stressed: { emoji: "🌵", name: "Cactus", color: "#4DB6AC", description: "Resilience & strength" },
};

function PlantSprite({ plant, delay = 0 }: { plant: Plant; delay?: number }) {
  const sway = useSharedValue(0);

  useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const swayStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value * 4}deg` }],
  }));

  return (
    <Animated.View
      entering={Platform.OS !== "web" ? FadeIn.delay(delay).duration(600) : undefined}
      style={[
        styles.plantSprite,
        { left: plant.x, bottom: 0 },
      ]}
    >
      <Animated.View style={[{ transformOrigin: "bottom" }, swayStyle]}>
        <Text style={{ fontSize: plant.size }}>{plant.emoji}</Text>
      </Animated.View>
      <Text style={[styles.plantName, { color: plant.color }]}>{plant.name}</Text>
    </Animated.View>
  );
}

function GardenScene({ plants, mood }: { plants: Plant[]; mood: string }) {
  const skyColors = (): [string, string, string] => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 9) return ["#FFE0B2", "#81D4FA", "#E3F2FD"];
    if (hour >= 9 && hour < 17) return ["#E3F2FD", "#B3E5FC", "#E8F5E9"];
    if (hour >= 17 && hour < 20) return ["#FF8A65", "#FFB74D", "#FFF176"];
    return ["#1A237E", "#283593", "#3949AB"];
  };

  const [s1, s2, s3] = skyColors();

  return (
    <View style={[styles.gardenScene, { width: GARDEN_W }]}>
      <LinearGradient colors={[s1, s2, s3]} style={styles.sky} />
      <View style={styles.grass}>
        {plants.length === 0 ? (
          <View style={styles.emptyGarden}>
            <Text style={{ fontSize: 40 }}>🌱</Text>
            <Text style={styles.emptyGardenText}>Log your first mood{"\n"}to grow your garden</Text>
          </View>
        ) : (
          plants.map((p, i) => <PlantSprite key={p.id} plant={p} delay={i * 150} />)
        )}
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
  const [gardenHealth, setGardenHealth] = useState(0);
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
    const totalSlots = GARDEN_W - 60;
    let pid = 0;

    for (const [moodKey, count] of Object.entries(counts)) {
      const info = MOOD_PLANT[moodKey];
      if (!info) continue;
      const numPlants = Math.min(count, 4);
      for (let i = 0; i < numPlants; i++) {
        let x: number;
        let attempts = 0;
        do {
          x = 10 + Math.floor(Math.random() * totalSlots);
          attempts++;
        } while (positions.some((p) => Math.abs(p - x) < 45) && attempts < 20);
        positions.push(x);
        gardenPlants.push({
          id: `${moodKey}_${i}`,
          mood: moodKey,
          emoji: info.emoji,
          name: info.name,
          color: info.color,
          x,
          size: 28 + Math.floor(Math.random() * 16),
          description: info.description,
        });
        pid++;
      }
    }

    gardenPlants.sort((a, b) => a.x - b.x);
    setPlants(gardenPlants);

    const positiveCount = (counts.happy || 0) + (counts.good || 0);
    const total = recent.length;
    const health = Math.round((positiveCount / total) * 100);
    setGardenHealth(health);

    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const insightMap: Record<string, string> = {
      happy: "Your garden is thriving! Joy and sunflowers fill your days. Keep shining. 🌻",
      good: "Cherry blossoms bloom — you're in a state of gentle contentment. Beautiful. 🌸",
      neutral: "Lotus flowers grow in still water. Your calm balance is a gift. 🪷",
      sad: "Ferns grow strongest after rain. Your resilience is taking root. 🌿",
      stressed: "Cacti thrive in harsh conditions. Your strength is your superpower. 🌵",
    };
    setInsight(insightMap[dominant] || "Your garden reflects your inner world. Keep tending to it.");
  };

  const moodCounts = moods.slice(-14).reduce((acc, m) => {
    acc[m.mood] = (acc[m.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#E8F5E9", "#F3E5F5", "#E0F7FA"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.title, { color: colors.text }]}>Mood Garden</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your inner world, growing</Text>
        </View>
        <View style={[styles.healthBadge, {
          backgroundColor: gardenHealth >= 60 ? "#66BB6A20" : gardenHealth >= 30 ? "#FFD54F20" : "#FF8A8020",
        }]}>
          <Text style={[styles.healthPct, {
            color: gardenHealth >= 60 ? "#388E3C" : gardenHealth >= 30 ? "#F57F17" : "#C62828",
          }]}>
            {gardenHealth}%
          </Text>
          <Text style={[styles.healthLabel, { color: colors.textSecondary }]}>health</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40,
          alignItems: "center",
          paddingTop: 8,
        }}
      >
        <GardenScene plants={plants} mood="neutral" />

        {insight ? (
          <Animated.View
            entering={Platform.OS !== "web" ? FadeInDown.delay(300).duration(500) : undefined}
            style={[styles.insightCard, { backgroundColor: "rgba(255,255,255,0.9)", marginHorizontal: 20 }]}
          >
            <Ionicons name="sparkles" size={18} color="#FFD54F" />
            <Text style={[styles.insightText, { color: colors.text }]}>{insight}</Text>
          </Animated.View>
        ) : null}

        <Animated.View
          entering={Platform.OS !== "web" ? FadeInDown.delay(450).duration(500) : undefined}
          style={[styles.legendCard, { backgroundColor: "rgba(255,255,255,0.9)", marginHorizontal: 20 }]}
        >
          <Text style={[styles.legendTitle, { color: colors.text }]}>Your Garden (last 14 days)</Text>
          <View style={styles.legendGrid}>
            {Object.entries(MOOD_PLANT).map(([key, val]) => (
              <View key={key} style={styles.legendItem}>
                <Text style={{ fontSize: 22 }}>{val.emoji}</Text>
                <View>
                  <Text style={[styles.legendName, { color: colors.text }]}>{val.name}</Text>
                  <Text style={[styles.legendCount, { color: colors.textSecondary }]}>
                    {moodCounts[key] || 0} times
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View
          entering={Platform.OS !== "web" ? FadeInDown.delay(600).duration(500) : undefined}
          style={[styles.tipCard, { backgroundColor: "rgba(255,255,255,0.9)", marginHorizontal: 20 }]}
        >
          <Text style={[styles.tipTitle, { color: colors.text }]}>Tend your garden 🌿</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            Log your mood daily on the Home screen. Each entry plants a seed. Happy moods grow sunflowers, calm moods grow lotus, and even stress grows a resilient cactus. Every emotion belongs here.
          </Text>
        </Animated.View>

        {moods.length > 0 && (
          <Animated.View
            entering={Platform.OS !== "web" ? FadeInDown.delay(700).duration(500) : undefined}
            style={{ width: GARDEN_W, marginBottom: 12 }}
          >
            <Text style={[styles.tipTitle, { color: colors.text, marginBottom: 12 }]}>Recent Moods</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}>
              {moods.slice(0, 10).map((entry) => {
                const moodData = MOODS.find((m) => m.key === entry.mood);
                return (
                  <View
                    key={entry.id}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      borderRadius: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      alignItems: "center",
                      gap: 6,
                      minWidth: 62,
                    }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: moodData?.color + "22", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name={moodData?.icon as any} size={22} color={moodData?.color} />
                    </View>
                    <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 11, color: colors.textSecondary }}>
                      {new Date(entry.timestamp).toLocaleDateString("en-US", { weekday: "short" })}
                    </Text>
                    <Text style={{ fontFamily: "Nunito_500Medium", fontSize: 10, color: colors.textSecondary }}>
                      {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        <Animated.View
          entering={Platform.OS !== "web" ? FadeInDown.delay(800).duration(500) : undefined}
          style={{ marginHorizontal: 20, marginBottom: 12 }}
        >
          <Text style={[styles.tipTitle, { color: colors.text, marginBottom: 12 }]}>Mood Calendar 📅</Text>
          <MoodCalendar moods={moods} isDark={isDark} />
        </Animated.View>
      </ScrollView>
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
  healthBadge: { borderRadius: 12, padding: 10, alignItems: "center" },
  healthPct: { fontFamily: "Nunito_800ExtraBold", fontSize: 18 },
  healthLabel: { fontFamily: "Nunito_500Medium", fontSize: 11 },
  gardenScene: {
    height: 220, borderRadius: 20, overflow: "hidden", marginHorizontal: 20, marginBottom: 16,
  },
  sky: { position: "absolute", top: 0, left: 0, right: 0, height: "65%" },
  grass: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
    backgroundColor: "#A5D6A7", borderTopLeftRadius: 16, borderTopRightRadius: 16,
    overflow: "hidden",
  },
  emptyGarden: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyGardenText: {
    fontFamily: "Nunito_600SemiBold", fontSize: 14, color: "#2E7D32", textAlign: "center", lineHeight: 20,
  },
  plantSprite: {
    position: "absolute", alignItems: "center", gap: 2,
  },
  plantName: { fontFamily: "Nunito_600SemiBold", fontSize: 9 },
  insightCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderRadius: 16, padding: 14, marginBottom: 12, width: GARDEN_W,
  },
  insightText: { flex: 1, fontFamily: "Nunito_500Medium", fontSize: 14, lineHeight: 20 },
  legendCard: {
    borderRadius: 16, padding: 16, marginBottom: 12, width: GARDEN_W,
  },
  legendTitle: { fontFamily: "Nunito_700Bold", fontSize: 15, marginBottom: 12 },
  legendGrid: { gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  legendName: { fontFamily: "Nunito_600SemiBold", fontSize: 13 },
  legendCount: { fontFamily: "Nunito_400Regular", fontSize: 12 },
  tipCard: { borderRadius: 16, padding: 16, marginBottom: 12, width: GARDEN_W, gap: 8 },
  tipTitle: { fontFamily: "Nunito_700Bold", fontSize: 15 },
  tipText: { fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 19 },
});
