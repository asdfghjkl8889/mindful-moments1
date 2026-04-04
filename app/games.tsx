import React, { useEffect, useState } from "react";
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { storage } from "@/lib/storage";

const GAMES = [
  {
    id: "breathing",
    title: "Breathing Exercise",
    subtitle: "Calm your nervous system",
    desc: "Follow the animated circle through the 4-4-4 breathing pattern. Each cycle guides you: inhale, hold, exhale. Voice-guided with 6 calming cycles.",
    icon: "leaf",
    color: "#4DB6AC",
    gradient: ["#E0F7FA", "#B2EBF2"] as [string, string],
    badge: "Calming",
    duration: "~3 min",
  },
  {
    id: "memory",
    title: "Zen Memory",
    subtitle: "Sharpen focus and presence",
    desc: "Match pairs of mindful icons — leaf, flower, heart, moon and more. Each match trains your attention and grounds you in the present moment.",
    icon: "grid",
    color: "#B39DDB",
    gradient: ["#F3E5F5", "#E1BEE7"] as [string, string],
    badge: "Focus",
    duration: "~5 min",
  },
  {
    id: "focus",
    title: "Focus Tap",
    subtitle: "Train laser concentration",
    desc: "Tap the glowing targets as they appear across the screen. Builds your ability to sustain attention — a core skill for mindfulness.",
    icon: "eye",
    color: "#FF8A65",
    gradient: ["#FBE9E7", "#FFCCBC"] as [string, string],
    badge: "Attention",
    duration: "~4 min",
  },
];

export default function GamesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const all = await storage.getGameScores();
      const best: Record<string, number> = {};
      for (const s of all) {
        if (!best[s.game] || s.score > best[s.game]) best[s.game] = s.score;
      }
      setScores(best);
    })();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#E0F7FA", "#F3E5F5", "#FBE9E7"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.title, { color: colors.text }]}>Mindful Games</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Train your mind through play
          </Text>
        </View>
        <View style={[styles.controllerBadge, { backgroundColor: "#4DB6AC20" }]}>
          <Ionicons name="game-controller" size={20} color="#4DB6AC" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40,
          gap: 16,
          paddingTop: 8,
        }}
      >
        <View style={[styles.bannerCard, { backgroundColor: "rgba(255,255,255,0.85)" }]}>
          <Ionicons name="sparkles" size={18} color="#FFD54F" />
          <Text style={[styles.bannerText, { color: colors.text }]}>
            Games here aren't for entertainment — they're science-backed practices disguised as play. Each session rewires your nervous system.
          </Text>
        </View>

        {GAMES.map((game, i) => (
          <Animated.View
            key={game.id}
            entering={Platform.OS !== "web" ? FadeInDown.delay(i * 100).duration(400) : undefined}
          >
            <Pressable
              onPress={() => {
                router.push(`/game/${game.id}` as any);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
            >
              <LinearGradient
                colors={game.gradient}
                style={styles.gameCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.gameCardTop}>
                  <View style={[styles.gameIconWrap, { backgroundColor: game.color + "25" }]}>
                    <Ionicons name={game.icon as any} size={32} color={game.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <View style={styles.gameCardTitleRow}>
                      <Text style={[styles.gameTitle, { color: "#1A1A1A" }]}>{game.title}</Text>
                      <View style={[styles.gameBadge, { backgroundColor: game.color + "25" }]}>
                        <Text style={[styles.gameBadgeText, { color: game.color }]}>{game.badge}</Text>
                      </View>
                    </View>
                    <Text style={[styles.gameSub, { color: "#616161" }]}>{game.subtitle}</Text>
                  </View>
                </View>

                <Text style={[styles.gameDesc, { color: "#424242" }]}>{game.desc}</Text>

                <View style={styles.gameCardFooter}>
                  <View style={styles.gameMetaRow}>
                    <Ionicons name="time-outline" size={13} color="#757575" />
                    <Text style={[styles.gameMeta, { color: "#757575" }]}>{game.duration}</Text>
                  </View>
                  {scores[game.id] != null && (
                    <View style={styles.gameMetaRow}>
                      <Ionicons name="trophy-outline" size={13} color={game.color} />
                      <Text style={[styles.gameMeta, { color: game.color }]}>
                        Best: {scores[game.id]}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.playChip, { backgroundColor: game.color }]}>
                    <Text style={styles.playChipText}>Play</Text>
                    <Ionicons name="arrow-forward" size={13} color="#fff" />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ))}

        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(400).duration(400) : undefined}>
          <View style={[styles.tipCard, { backgroundColor: "rgba(255,255,255,0.85)", borderColor: colors.cardBorder }]}>
            <Text style={[styles.tipTitle, { color: colors.text }]}>Why play mindfully?</Text>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color="#66BB6A" />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>Builds attention span (proven by cognitive science)</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color="#66BB6A" />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>Reduces anxiety by activating the parasympathetic system</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color="#66BB6A" />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>Play daily for 10 minutes to see measurable improvements</Text>
            </View>
          </View>
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
  controllerBadge: {
    width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center",
  },
  bannerCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderRadius: 14, padding: 14,
  },
  bannerText: { flex: 1, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 19 },
  gameCard: {
    borderRadius: 20, padding: 18, gap: 12,
  },
  gameCardTop: { flexDirection: "row", alignItems: "center" },
  gameIconWrap: {
    width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center",
  },
  gameCardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  gameTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 18 },
  gameSub: { fontFamily: "Nunito_500Medium", fontSize: 13, marginTop: 3 },
  gameBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  gameBadgeText: { fontFamily: "Nunito_700Bold", fontSize: 11 },
  gameDesc: { fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 19 },
  gameCardFooter: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  gameMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  gameMeta: { fontFamily: "Nunito_500Medium", fontSize: 12 },
  playChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginLeft: "auto",
  },
  playChipText: { fontFamily: "Nunito_700Bold", fontSize: 13, color: "#fff" },
  tipCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  tipTitle: { fontFamily: "Nunito_700Bold", fontSize: 15, marginBottom: 4 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tipText: { fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 18, flex: 1 },
});
