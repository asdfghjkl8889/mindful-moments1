import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeOutUp, FadeIn } from "react-native-reanimated";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrainDump {
  id: string;
  text: string;
  timestamp: number;
}

interface SortedThought {
  id: string;
  text: string;
  bucket: "control" | "release";
  timestamp: number;
}

type ActiveTab = "dump" | "sort" | "perspective";

// ─── Constants ────────────────────────────────────────────────────────────────

const DUMP_KEY = "mindful_brain_dumps";
const SORT_KEY = "mindful_sorted_thoughts";

const QUICK_BREAKS = [
  {
    id: "breathe",
    emoji: "🌬️",
    title: "Box Breathe",
    desc: "In 4 · Hold 4 · Out 4 · Hold 4",
    color: "#4FC3F7",
    bg: "#E1F5FE",
  },
  {
    id: "ground",
    emoji: "🌱",
    title: "5-4-3-2-1",
    desc: "Name 5 things you see right now",
    color: "#81C784",
    bg: "#E8F5E9",
  },
  {
    id: "move",
    emoji: "🤸",
    title: "Move It",
    desc: "10 slow neck rolls, each side",
    color: "#FFB74D",
    bg: "#FFF3E0",
  },
  {
    id: "cold",
    emoji: "🧊",
    title: "Cold Splash",
    desc: "Splash cold water on your face",
    color: "#B39DDB",
    bg: "#EDE7F6",
  },
];

const PERSPECTIVE_QUESTIONS = [
  { timeframe: "1 day", icon: "today-outline", color: "#81C784" },
  { timeframe: "1 week", icon: "calendar-outline", color: "#64B5F6" },
  { timeframe: "1 month", icon: "moon-outline", color: "#FFB74D" },
  { timeframe: "1 year", icon: "sunny-outline", color: "#F06292" },
  { timeframe: "5 years", icon: "star-outline", color: "#9575CD" },
];

const LOOP_BREAKERS = [
  "Write it down, then close the notebook.",
  'Set a 10-minute "worry window" — then let it go.',
  "Ask: Am I solving a problem or just replaying one?",
  "Is there anything I can do about this right now?",
  "What would my calmest self say about this?",
  'Name the feeling, not the story: "I feel anxious." Full stop.',
];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function OverthinkingScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<ActiveTab>("dump");

  // Brain Dump state
  const [dumpText, setDumpText] = useState("");
  const [dumps, setDumps] = useState<BrainDump[]>([]);
  const [released, setReleased] = useState(false);

  // Sort state
  const [sortInput, setSortInput] = useState("");
  const [sorted, setSorted] = useState<SortedThought[]>([]);

  // Perspective state
  const [perspThought, setPerspThought] = useState("");
  const [perspIdx, setPerspIdx] = useState(2);
  const [perspAnswer, setPerspAnswer] = useState("");

  // Quick break
  const [activeBreak, setActiveBreak] = useState<string | null>(null);

  // Loop breaker tip
  const [tipIdx, setTipIdx] = useState(0);

  // ── Load persisted data ──────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(DUMP_KEY).then((raw) => {
      if (raw) setDumps(JSON.parse(raw));
    });
    AsyncStorage.getItem(SORT_KEY).then((raw) => {
      if (raw) setSorted(JSON.parse(raw));
    });
  }, []);

  // ── Brain Dump ───────────────────────────────────────────────────────────
  const handleRelease = useCallback(async () => {
    if (!dumpText.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newDump: BrainDump = {
      id: generateId(),
      text: dumpText.trim(),
      timestamp: Date.now(),
    };
    const updated = [newDump, ...dumps];
    setDumps(updated);
    await AsyncStorage.setItem(DUMP_KEY, JSON.stringify(updated));
    setDumpText("");
    setReleased(true);
    setTimeout(() => setReleased(false), 2500);
  }, [dumpText, dumps]);

  const deleteDump = useCallback(async (id: string) => {
    const updated = dumps.filter((d) => d.id !== id);
    setDumps(updated);
    await AsyncStorage.setItem(DUMP_KEY, JSON.stringify(updated));
  }, [dumps]);

  // ── Control Sort ─────────────────────────────────────────────────────────
  const addThought = useCallback(async (bucket: "control" | "release") => {
    if (!sortInput.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const item: SortedThought = {
      id: generateId(),
      text: sortInput.trim(),
      bucket,
      timestamp: Date.now(),
    };
    const updated = [item, ...sorted];
    setSorted(updated);
    setSortInput("");
    await AsyncStorage.setItem(SORT_KEY, JSON.stringify(updated));
  }, [sortInput, sorted]);

  const deleteSorted = useCallback(async (id: string) => {
    const updated = sorted.filter((s) => s.id !== id);
    setSorted(updated);
    await AsyncStorage.setItem(SORT_KEY, JSON.stringify(updated));
  }, [sorted]);

  const clearAll = useCallback(async (key: string, setter: (v: any[]) => void) => {
    Alert.alert("Clear all?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear", style: "destructive", onPress: async () => {
          setter([]);
          await AsyncStorage.removeItem(key);
        }
      },
    ]);
  }, []);

  // ─── Render tabs ──────────────────────────────────────────────────────────

  function renderDumpTab() {
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={styles.tabIntro}>
          Empty your mind onto the page. You don't need to solve anything — just let it out.
        </Text>

        <View style={styles.dumpBox}>
          <TextInput
            style={styles.dumpInput}
            value={dumpText}
            onChangeText={setDumpText}
            placeholder="What's running on loop right now? Write it all out…"
            placeholderTextColor="rgba(0,0,0,0.3)"
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.releaseBtn, !dumpText.trim() && styles.releaseBtnDisabled]}
            onPress={handleRelease}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#FF8A65", "#FF5722"]}
              style={styles.releaseBtnGradient}
            >
              <Text style={styles.releaseBtnText}>
                {released ? "✓  Released" : "🌊  Release it"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {released && (
          <Animated.View entering={FadeInDown} style={styles.releasedMsg}>
            <Text style={styles.releasedMsgText}>
              ✨ That's off your chest. You don't have to carry it any more.
            </Text>
          </Animated.View>
        )}

        {dumps.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Previous dumps</Text>
              <TouchableOpacity onPress={() => clearAll(DUMP_KEY, setDumps)}>
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>
            </View>
            {dumps.map((d) => (
              <Animated.View key={d.id} entering={FadeInDown} style={styles.historyCard}>
                <Text style={styles.historyText} numberOfLines={4}>{d.text}</Text>
                <View style={styles.historyFooter}>
                  <Text style={styles.historyDate}>
                    {new Date(d.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  <TouchableOpacity onPress={() => deleteDump(d.id)}>
                    <Ionicons name="trash-outline" size={16} color="#EF9A9A" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.View>
    );
  }

  function renderSortTab() {
    const controlItems = sorted.filter((s) => s.bucket === "control");
    const releaseItems = sorted.filter((s) => s.bucket === "release");
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={styles.tabIntro}>
          Overthinking often mixes things you can change with things you can't. Sorting them breaks the loop.
        </Text>

        <View style={styles.sortInputBox}>
          <TextInput
            style={styles.sortInput}
            value={sortInput}
            onChangeText={setSortInput}
            placeholder="Type a thought or worry…"
            placeholderTextColor="rgba(0,0,0,0.3)"
            returnKeyType="done"
          />
          <View style={styles.sortBtns}>
            <TouchableOpacity
              style={[styles.sortBtn, styles.sortBtnControl]}
              onPress={() => addThought("control")}
              activeOpacity={0.8}
            >
              <Text style={styles.sortBtnText}>✅  In my control</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortBtn, styles.sortBtnRelease]}
              onPress={() => addThought("release")}
              activeOpacity={0.8}
            >
              <Text style={styles.sortBtnText}>🕊️  Let it go</Text>
            </TouchableOpacity>
          </View>
        </View>

        {(controlItems.length > 0 || releaseItems.length > 0) && (
          <>
            <View style={styles.sortColumns}>
              {/* In my control */}
              <View style={[styles.sortColumn, styles.sortColumnControl]}>
                <Text style={styles.sortColumnTitle}>✅ In my control</Text>
                {controlItems.length === 0
                  ? <Text style={styles.sortEmpty}>Nothing yet</Text>
                  : controlItems.map((item) => (
                    <View key={item.id} style={styles.sortChip}>
                      <Text style={styles.sortChipText} numberOfLines={3}>{item.text}</Text>
                      <TouchableOpacity onPress={() => deleteSorted(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle" size={16} color="#81C784" />
                      </TouchableOpacity>
                    </View>
                  ))
                }
              </View>

              {/* Let it go */}
              <View style={[styles.sortColumn, styles.sortColumnRelease]}>
                <Text style={styles.sortColumnTitle}>🕊️ Let it go</Text>
                {releaseItems.length === 0
                  ? <Text style={styles.sortEmpty}>Nothing yet</Text>
                  : releaseItems.map((item) => (
                    <View key={item.id} style={styles.sortChipRelease}>
                      <Text style={styles.sortChipText} numberOfLines={3}>{item.text}</Text>
                      <TouchableOpacity onPress={() => deleteSorted(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle" size={16} color="#B39DDB" />
                      </TouchableOpacity>
                    </View>
                  ))
                }
              </View>
            </View>
            <TouchableOpacity onPress={() => clearAll(SORT_KEY, setSorted)} style={styles.clearAllRow}>
              <Text style={styles.clearText}>Clear sorted thoughts</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    );
  }

  function renderPerspectiveTab() {
    const q = PERSPECTIVE_QUESTIONS[perspIdx];
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={styles.tabIntro}>
          Overthinking amplifies urgency. Zoom out and see how big this really is.
        </Text>

        <View style={styles.perspCard}>
          <Text style={styles.perspLabel}>What are you overthinking about?</Text>
          <TextInput
            style={styles.perspInput}
            value={perspThought}
            onChangeText={setPerspThought}
            placeholder="Describe it briefly…"
            placeholderTextColor="rgba(0,0,0,0.3)"
            multiline
          />
        </View>

        <Text style={styles.perspSliderLabel}>Will this matter in…</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {PERSPECTIVE_QUESTIONS.map((pq, i) => (
            <TouchableOpacity
              key={pq.timeframe}
              style={[
                styles.timeframeBtn,
                perspIdx === i && { backgroundColor: pq.color },
              ]}
              onPress={() => { setPerspIdx(i); setPerspAnswer(""); Haptics.selectionAsync(); }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={pq.icon as any}
                size={20}
                color={perspIdx === i ? "#fff" : pq.color}
              />
              <Text style={[
                styles.timeframeBtnText,
                perspIdx === i && { color: "#fff" },
              ]}>
                {pq.timeframe}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.perspAnswerBox, { borderColor: q.color }]}>
          <Text style={[styles.perspQuestion, { color: q.color }]}>
            In {q.timeframe} from now, how much will this matter?
          </Text>
          <TextInput
            style={styles.perspAnswerInput}
            value={perspAnswer}
            onChangeText={setPerspAnswer}
            placeholder="Be honest with yourself…"
            placeholderTextColor="rgba(0,0,0,0.3)"
            multiline
            textAlignVertical="top"
          />
        </View>
      </Animated.View>
    );
  }

  // ─── Full render ──────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient colors={["#FF7043", "#FFAB76", "#FFF3E0"]} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: bottomPad + 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: topPad + 12 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Overthinking</Text>
              <Text style={styles.subtitle}>Break the loop, find your calm</Text>
            </View>
          </View>

          {/* Quick break strip */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick loop-breakers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
              {QUICK_BREAKS.map((qb) => (
                <TouchableOpacity
                  key={qb.id}
                  style={[styles.breakCard, activeBreak === qb.id && { borderColor: qb.color, borderWidth: 2 }]}
                  onPress={() => {
                    setActiveBreak(activeBreak === qb.id ? null : qb.id);
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.breakEmoji}>{qb.emoji}</Text>
                  <Text style={[styles.breakTitle, { color: qb.color }]}>{qb.title}</Text>
                  <Text style={styles.breakDesc}>{qb.desc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Loop-breaker tip of the day */}
          <View style={styles.tipRow}>
            <View style={styles.tipCard}>
              <Text style={styles.tipLabel}>💡 Reminder</Text>
              <Text style={styles.tipText}>{LOOP_BREAKERS[tipIdx]}</Text>
            </View>
            <TouchableOpacity
              style={styles.tipNext}
              onPress={() => { setTipIdx((tipIdx + 1) % LOOP_BREAKERS.length); Haptics.selectionAsync(); }}
            >
              <Ionicons name="refresh" size={18} color="#FF7043" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            {(["dump", "sort", "perspective"] as ActiveTab[]).map((tab) => {
              const labels: Record<ActiveTab, string> = {
                dump: "Brain Dump",
                sort: "Control Filter",
                perspective: "Perspective",
              };
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                    {labels[tab]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tab content */}
          <View style={styles.tabContent}>
            {activeTab === "dump" && renderDumpTab()}
            {activeTab === "sort" && renderSortTab()}
            {activeTab === "perspective" && renderPerspectiveTab()}
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  title: {
    fontSize: 26,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },

  // Quick breaks
  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: "rgba(255,255,255,0.9)",
    marginLeft: 20,
    marginBottom: 10,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  breakCard: {
    width: 130,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  breakEmoji: { fontSize: 26, marginBottom: 6 },
  breakTitle: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    marginBottom: 4,
  },
  breakDesc: {
    fontSize: 11,
    fontFamily: "Nunito_400Regular",
    color: "#666",
    lineHeight: 15,
  },

  // Tip
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 12,
    gap: 10,
  },
  tipCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 14,
    padding: 14,
  },
  tipLabel: {
    fontSize: 11,
    fontFamily: "Nunito_700Bold",
    color: "#FF7043",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "#444",
    lineHeight: 20,
  },
  tipNext: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.88)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 14,
    padding: 4,
    marginBottom: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: "rgba(255,255,255,0.85)",
  },
  tabBtnTextActive: { color: "#FF7043" },

  // Tab content
  tabContent: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  tabIntro: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
    marginBottom: 16,
  },

  // Brain Dump
  dumpBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dumpInput: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: "#333",
    minHeight: 140,
    lineHeight: 22,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  releaseBtn: { borderRadius: 14, overflow: "hidden" },
  releaseBtnDisabled: { opacity: 0.45 },
  releaseBtnGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  releaseBtnText: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#fff",
  },
  releasedMsg: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  releasedMsgText: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
  },

  // History
  historySection: { marginTop: 8 },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  clearText: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: "rgba(255,255,255,0.7)",
    textDecorationLine: "underline",
  },
  historyCard: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  historyText: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "#444",
    lineHeight: 20,
    marginBottom: 8,
  },
  historyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyDate: {
    fontSize: 11,
    fontFamily: "Nunito_400Regular",
    color: "#999",
  },

  // Control Sort
  sortInputBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sortInput: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: "#333",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    marginBottom: 14,
  },
  sortBtns: { flexDirection: "row", gap: 10 },
  sortBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  sortBtnControl: { backgroundColor: "#E8F5E9" },
  sortBtnRelease: { backgroundColor: "#EDE7F6" },
  sortBtnText: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    color: "#444",
  },
  sortColumns: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  sortColumn: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    minHeight: 80,
  },
  sortColumnControl: { backgroundColor: "rgba(200,230,200,0.9)" },
  sortColumnRelease: { backgroundColor: "rgba(220,210,240,0.9)" },
  sortColumnTitle: {
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
    color: "#555",
    marginBottom: 10,
  },
  sortEmpty: {
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: "rgba(0,0,0,0.35)",
    fontStyle: "italic",
  },
  sortChip: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 10,
    padding: 9,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  sortChipRelease: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 10,
    padding: 9,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  sortChipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    color: "#444",
    lineHeight: 16,
  },
  clearAllRow: { alignItems: "center", marginTop: 4, marginBottom: 8 },

  // Perspective
  perspCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  perspLabel: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: "#888",
    marginBottom: 8,
  },
  perspInput: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: "#333",
    minHeight: 60,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  perspSliderLabel: {
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  timeframeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },
  timeframeBtnText: {
    fontSize: 13,
    fontFamily: "Nunito_700Bold",
    color: "#555",
  },
  perspAnswerBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  perspQuestion: {
    fontSize: 15,
    fontFamily: "Nunito_600SemiBold",
    marginBottom: 12,
    lineHeight: 22,
  },
  perspAnswerInput: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: "#333",
    minHeight: 80,
    lineHeight: 22,
    textAlignVertical: "top",
  },
});
