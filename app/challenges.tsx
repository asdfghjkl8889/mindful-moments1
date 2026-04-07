import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { storage, ChallengeData } from "@/lib/storage";

const LEVELS = [
  { name: "Seed", min: 0, max: 499, icon: "🌱", color: "#A5D6A7" },
  { name: "Sprout", min: 500, max: 999, icon: "🌿", color: "#66BB6A" },
  { name: "Leaf", min: 1000, max: 2499, icon: "🍃", color: "#43A047" },
  { name: "Branch", min: 2500, max: 4999, icon: "🌳", color: "#388E3C" },
  { name: "Tree", min: 5000, max: 9999, icon: "🎋", color: "#2E7D32" },
  { name: "Forest", min: 10000, max: 999999, icon: "🌲", color: "#1B5E20" },
];

const DAILY_CHALLENGES = [
  { id: "meditate5", title: "5-Minute Meditation", desc: "Complete a 5-min meditation session", icon: "leaf", xp: 50, color: "#4DB6AC", action: () => router.push("/(tabs)/meditate") },
  { id: "gratitude3", title: "Gratitude Entry", desc: "Write 3 things you're grateful for", icon: "heart", xp: 40, color: "#FF8A80", action: () => router.push("/(tabs)/journal") },
  { id: "breathe", title: "Box Breathing", desc: "Complete the breathing exercise game", icon: "water", xp: 30, color: "#81D4FA", action: () => router.push("/game/breathing") },
  { id: "mindfuleat", title: "Mindful Meal", desc: "Log a meal with the mindful eating timer", icon: "restaurant", xp: 35, color: "#FFB74D", action: () => router.push("/(tabs)/eating") },
  { id: "inspiration", title: "Daily Quote", desc: "Read your daily inspiration", icon: "sparkles", xp: 20, color: "#B39DDB", action: () => router.push("/inspiration") },
];

const WEEKLY_QUEST = {
  id: "week_warrior",
  title: "Week Warrior",
  desc: "Complete at least 3 daily challenges every day this week",
  icon: "trophy",
  xp: 500,
  color: "#FFD700",
};

const BADGES = [
  { id: "first_step", name: "First Step", desc: "Complete your first challenge", icon: "footsteps", color: "#66BB6A", xpRequired: 0 },
  { id: "zen_starter", name: "Zen Starter", desc: "Reach 100 XP", icon: "leaf", color: "#4DB6AC", xpRequired: 100 },
  { id: "mindful_500", name: "Mindful Mind", desc: "Reach 500 XP", icon: "bulb", color: "#81D4FA", xpRequired: 500 },
  { id: "sprout_badge", name: "Sprout Badge", desc: "Complete 10 challenges", icon: "flower", color: "#FFB74D", xpRequired: 300 },
  { id: "streak_3", name: "3-Day Glow", desc: "Keep a 3-day challenge streak", icon: "flame", color: "#FF8A65", xpRequired: 150 },
  { id: "meditator", name: "Meditator", desc: "Reach 1000 XP", icon: "moon", color: "#B39DDB", xpRequired: 1000 },
];

function getLevel(xp: number) {
  return LEVELS.findLast((l) => xp >= l.min) ?? LEVELS[0];
}

function getNextLevel(xp: number) {
  return LEVELS.find((l) => xp < l.max) ?? LEVELS[LEVELS.length - 1];
}

function getLevelProgress(xp: number) {
  const current = getLevel(xp);
  const range = current.max - current.min;
  const progress = xp - current.min;
  return Math.min(progress / range, 1);
}

export default function ChallengesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [data, setData] = useState<ChallengeData>({
    xp: 0, completedToday: [], badgesEarned: [], lastResetDate: "",
  });
  const [showXPModal, setShowXPModal] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [earnedTitle, setEarnedTitle] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const loadData = useCallback(async () => {
    let d = await storage.getChallengeData();
    if (d.lastResetDate !== today) {
      d = { ...d, completedToday: [], lastResetDate: today };
      await storage.saveChallengeData(d);
    }
    setData(d);
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completeChallenge = async (challenge: typeof DAILY_CHALLENGES[0]) => {
    if (data.completedToday.includes(challenge.id)) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const newXP = data.xp + challenge.xp;
    const newCompleted = [...data.completedToday, challenge.id];
    let newBadges = [...data.badgesEarned];

    if (!newBadges.includes("first_step")) newBadges.push("first_step");
    BADGES.forEach((b) => {
      if (!newBadges.includes(b.id) && newXP >= b.xpRequired && b.id !== "first_step") {
        newBadges.push(b.id);
      }
    });

    const updated: ChallengeData = {
      xp: newXP,
      completedToday: newCompleted,
      badgesEarned: newBadges,
      lastResetDate: today,
    };
    await storage.saveChallengeData(updated);
    setData(updated);
    setEarnedXP(challenge.xp);
    setEarnedTitle(challenge.title);
    setShowXPModal(true);
    setTimeout(() => setShowXPModal(false), 2000);
  };

  const level = getLevel(data.xp);
  const nextLevel = getNextLevel(data.xp);
  const progress = getLevelProgress(data.xp);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Challenges</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32 }}
      >
        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(500) : undefined}>
          <LinearGradient
            colors={[level.color + "30", level.color + "10", "#FFFFFF"]}
            style={styles.levelCard}
          >
            <View style={styles.levelRow}>
              <Text style={styles.levelEmoji}>{level.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.levelName, { color: level.color }]}>{level.name}</Text>
                <Text style={[styles.levelXP, { color: colors.text }]}>{data.xp.toLocaleString()} XP</Text>
              </View>
              <View style={styles.xpBadge}>
                <Text style={[styles.xpBadgeText, { color: level.color }]}>Lv {LEVELS.indexOf(level) + 1}</Text>
              </View>
            </View>
            <View style={[styles.progressBg, { backgroundColor: colors.cardBorder }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progress * 100)}%`, backgroundColor: level.color },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>{level.name}</Text>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                {data.xp} / {level.max} XP → {nextLevel.name}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Missions</Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          {data.completedToday.length}/{DAILY_CHALLENGES.length} completed · Resets at midnight
        </Text>

        {DAILY_CHALLENGES.map((ch, i) => {
          const done = data.completedToday.includes(ch.id);
          return (
            <Animated.View
              key={ch.id}
              entering={Platform.OS !== "web" ? FadeInDown.delay(i * 80).duration(400) : undefined}
            >
              <Pressable
                onPress={() => {
                  completeChallenge(ch);
                  ch.action();
                }}
                style={({ pressed }) => [
                  styles.challengeCard,
                  { backgroundColor: done ? ch.color + "15" : colors.card, borderColor: done ? ch.color + "40" : colors.cardBorder, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={[styles.challengeIcon, { backgroundColor: ch.color + "20" }]}>
                  <Ionicons name={ch.icon as any} size={24} color={done ? ch.color : colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.challengeTitle, { color: colors.text }]}>{ch.title}</Text>
                  <Text style={[styles.challengeDesc, { color: colors.textSecondary }]}>{ch.desc}</Text>
                </View>
                <View style={styles.challengeRight}>
                  <View style={[styles.xpPill, { backgroundColor: ch.color + "20" }]}>
                    <Text style={[styles.xpPillText, { color: ch.color }]}>+{ch.xp} XP</Text>
                  </View>
                  {done && <Ionicons name="checkmark-circle" size={22} color={ch.color} style={{ marginTop: 4 }} />}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}

        <View style={[styles.weekQuestCard, { backgroundColor: "#FFF8E1", borderColor: "#FFD54F" }]}>
          <View style={styles.weekQuestHeader}>
            <Ionicons name="trophy" size={22} color="#F9A825" />
            <Text style={styles.weekQuestLabel}>Weekly Quest</Text>
            <View style={[styles.xpPill, { backgroundColor: "#FFF3CD" }]}>
              <Text style={[styles.xpPillText, { color: "#F9A825" }]}>+{WEEKLY_QUEST.xp} XP</Text>
            </View>
          </View>
          <Text style={styles.weekQuestTitle}>{WEEKLY_QUEST.title}</Text>
          <Text style={styles.weekQuestDesc}>{WEEKLY_QUEST.desc}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Badges</Text>
        <View style={styles.badgesGrid}>
          {BADGES.map((badge) => {
            const earned = data.badgesEarned.includes(badge.id);
            return (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  { backgroundColor: earned ? badge.color + "15" : colors.card, borderColor: earned ? badge.color + "40" : colors.cardBorder },
                ]}
              >
                <View style={[styles.badgeIcon, { backgroundColor: earned ? badge.color + "25" : colors.cardBorder + "60", opacity: earned ? 1 : 0.5 }]}>
                  <Ionicons name={badge.icon as any} size={22} color={earned ? badge.color : colors.textTertiary} />
                </View>
                <Text style={[styles.badgeName, { color: earned ? colors.text : colors.textTertiary }]} numberOfLines={1}>
                  {badge.name}
                </Text>
                <Text style={[styles.badgeDesc, { color: colors.textTertiary }]} numberOfLines={2}>
                  {earned ? "Earned!" : badge.desc}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={showXPModal} transparent animationType="fade">
        <View style={styles.xpModalOverlay} pointerEvents="none">
          <Animated.View
            entering={Platform.OS !== "web" ? ZoomIn.duration(400) : undefined}
            style={styles.xpModalCard}
          >
            <Text style={styles.xpModalEmoji}>⭐</Text>
            <Text style={styles.xpModalTitle}>+{earnedXP} XP!</Text>
            <Text style={styles.xpModalSub}>{earnedTitle} complete</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  headerTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 22 },
  levelCard: {
    marginHorizontal: 20, marginTop: 4, marginBottom: 8,
    borderRadius: 20, padding: 20,
  },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  levelEmoji: { fontSize: 40 },
  levelName: { fontFamily: "Nunito_800ExtraBold", fontSize: 18 },
  levelXP: { fontFamily: "Nunito_600SemiBold", fontSize: 14, marginTop: 2 },
  xpBadge: {
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  xpBadgeText: { fontFamily: "Nunito_700Bold", fontSize: 13 },
  progressBg: { height: 10, borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 5 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  progressLabel: { fontFamily: "Nunito_500Medium", fontSize: 11 },
  sectionTitle: {
    fontFamily: "Nunito_700Bold", fontSize: 18,
    marginHorizontal: 20, marginTop: 20, marginBottom: 4,
  },
  sectionSub: { fontFamily: "Nunito_400Regular", fontSize: 13, marginHorizontal: 20, marginBottom: 12 },
  challengeCard: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 20, marginBottom: 10,
    borderRadius: 16, padding: 16, borderWidth: 1, gap: 12,
  },
  challengeIcon: {
    width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center",
  },
  challengeTitle: { fontFamily: "Nunito_700Bold", fontSize: 15, marginBottom: 3 },
  challengeDesc: { fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 16 },
  challengeRight: { alignItems: "center", gap: 4 },
  xpPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  xpPillText: { fontFamily: "Nunito_700Bold", fontSize: 12 },
  weekQuestCard: {
    marginHorizontal: 20, marginTop: 8, borderRadius: 16, padding: 18, borderWidth: 1.5, gap: 6,
  },
  weekQuestHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  weekQuestLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: "#F9A825", flex: 1 },
  weekQuestTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 17, color: "#E65100" },
  weekQuestDesc: { fontFamily: "Nunito_400Regular", fontSize: 13, color: "#795548", lineHeight: 18 },
  badgesGrid: {
    flexDirection: "row", flexWrap: "wrap",
    marginHorizontal: 20, gap: 12,
  },
  badgeCard: {
    width: "29%", borderRadius: 14, padding: 12,
    alignItems: "center", borderWidth: 1, gap: 6,
  },
  badgeIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
  },
  badgeName: { fontFamily: "Nunito_700Bold", fontSize: 11, textAlign: "center" },
  badgeDesc: { fontFamily: "Nunito_400Regular", fontSize: 10, textAlign: "center", lineHeight: 13 },
  xpModalOverlay: {
    flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.2)",
  },
  xpModalCard: {
    backgroundColor: "#fff", borderRadius: 24, padding: 32, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 10, gap: 8,
  },
  xpModalEmoji: { fontSize: 48 },
  xpModalTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 32, color: "#F9A825" },
  xpModalSub: { fontFamily: "Nunito_500Medium", fontSize: 15, color: "#666" },
});
