import React, { useState, useCallback, useEffect, useRef } from "react";
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
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
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

interface Prediction {
  id: string;
  text: string;
  timestamp: number;
  resolved: boolean;
  happened: boolean | null;
}

type ActiveTab = "dump" | "sort" | "perspective" | "timer";

// ─── Constants ────────────────────────────────────────────────────────────────

const DUMP_KEY     = "mindful_brain_dumps";
const SORT_KEY     = "mindful_sorted_thoughts";
const PREDICT_KEY  = "mindful_predictions";

const QUICK_BREAKS = [
  {
    id: "breathe",
    emoji: "🌬️",
    title: "Box Breathe",
    color: "#4FC3F7",
    steps: [
      "Sit upright and close your eyes.",
      "Breathe IN slowly for 4 counts.",
      "HOLD your breath for 4 counts.",
      "Breathe OUT for 4 counts.",
      "HOLD empty for 4 counts.",
      "Repeat 4–6 times. Notice the quiet.",
    ],
  },
  {
    id: "ground",
    emoji: "🌱",
    title: "5-4-3-2-1",
    color: "#81C784",
    steps: [
      "Look around. Name 5 things you can SEE.",
      "Notice 4 things you can TOUCH.",
      "Listen for 3 things you can HEAR.",
      "Find 2 things you can SMELL.",
      "Notice 1 thing you can TASTE.",
      "Take a slow breath. You are here.",
    ],
  },
  {
    id: "move",
    emoji: "🤸",
    title: "Body Reset",
    color: "#FFB74D",
    steps: [
      "Stand up and shake out your hands.",
      "Roll your shoulders back 5 times.",
      "Tilt your head slowly side to side.",
      "Take 3 deep breaths with your arms raised.",
      "Shake out your whole body for 10 seconds.",
      "Feel the tension dissolve.",
    ],
  },
  {
    id: "cold",
    emoji: "🧊",
    title: "Cold Reset",
    color: "#B39DDB",
    steps: [
      "Go to the bathroom or kitchen sink.",
      "Run cold water over your wrists for 30s.",
      "Splash cold water on your face gently.",
      "Pat dry slowly and mindfully.",
      "Look in the mirror and take 3 breaths.",
      "Cold activates your parasympathetic system.",
    ],
  },
  {
    id: "journal",
    emoji: "✍️",
    title: "3-Line Dump",
    color: "#F06292",
    steps: [
      "Pick up a pen and paper — or use the Dump tab.",
      "Write the thought racing in your mind.",
      "Write one thing that is actually true right now.",
      "Write one thing you are grateful for.",
      "Close the journal. The thought is contained.",
      "You do not need to keep carrying it.",
    ],
  },
];

const LOOP_BREAKERS = [
  "Write it down, then close the notebook.",
  'Set a 10-minute "worry window" — then let it go.',
  "Ask: Am I solving a problem or just replaying one?",
  "Is there anything I can do about this right now?",
  "What would my calmest self say about this?",
  'Name the feeling, not the story: "I feel anxious." Full stop.',
  "Worry is imagination used against yourself.",
  "Your brain is trying to protect you — thank it, then redirect it.",
  "The present moment is the only place you can act.",
  "Thinking about a problem ≠ solving a problem.",
];

const OVERTHINKER_TYPES = [
  {
    type: "The Worrier",
    icon: "cloud-outline",
    color: "#64B5F6",
    desc: "You catastrophise future events and play out worst-case scenarios.",
    tip: "Ask yourself: What is the most likely outcome — not the worst one?",
  },
  {
    type: "The Ruminator",
    icon: "refresh-outline",
    color: "#F06292",
    desc: "You replay past events on loop, analysing what you said or did.",
    tip: "The past is information, not a life sentence. What can you learn and release?",
  },
  {
    type: "The Perfectionist",
    icon: "checkmark-circle-outline",
    color: "#81C784",
    desc: "You overanalyse every decision, afraid of making the wrong choice.",
    tip: "Good enough, done — beats perfect, never. Progress over perfection.",
  },
  {
    type: "The Analyser",
    icon: "analytics-outline",
    color: "#FFB74D",
    desc: "You overprocess information and struggle to reach a conclusion.",
    tip: "Set a decision deadline. After that deadline, commit and move forward.",
  },
];

const PERSPECTIVE_QUESTIONS = [
  { timeframe: "1 day",   icon: "today-outline",     color: "#81C784" },
  { timeframe: "1 week",  icon: "calendar-outline",  color: "#64B5F6" },
  { timeframe: "1 month", icon: "moon-outline",      color: "#FFB74D" },
  { timeframe: "1 year",  icon: "sunny-outline",     color: "#F06292" },
  { timeframe: "5 years", icon: "star-outline",      color: "#9575CD" },
];

const TIMER_OPTIONS = [5, 10, 15, 20];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function OverthinkingScreen() {
  const insets   = useSafeAreaInsets();
  const topPad   = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<ActiveTab>("dump");

  // Brain Dump
  const [dumpText,  setDumpText]  = useState("");
  const [dumps,     setDumps]     = useState<BrainDump[]>([]);
  const [released,  setReleased]  = useState(false);

  // Sort
  const [sortInput, setSortInput] = useState("");
  const [sorted,    setSorted]    = useState<SortedThought[]>([]);

  // Perspective
  const [perspThought,  setPerspThought]  = useState("");
  const [perspIdx,      setPerspIdx]      = useState(2);
  const [perspAnswer,   setPerspAnswer]   = useState("");
  const [predictions,   setPredictions]  = useState<Prediction[]>([]);
  const [predInput,     setPredInput]    = useState("");
  const [selectedType,  setSelectedType] = useState<number | null>(null);

  // Worry timer
  const [timerMins,    setTimerMins]    = useState(10);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerLeft,    setTimerLeft]    = useState(600);
  const [timerDone,    setTimerDone]    = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Quick break
  const [activeBreak, setActiveBreak] = useState<string | null>(null);
  const [tipIdx,      setTipIdx]      = useState(0);

  // ── Persistence ─────────────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(DUMP_KEY).then((r)    => { if (r) setDumps(JSON.parse(r)); });
    AsyncStorage.getItem(SORT_KEY).then((r)    => { if (r) setSorted(JSON.parse(r)); });
    AsyncStorage.getItem(PREDICT_KEY).then((r) => { if (r) setPredictions(JSON.parse(r)); });
  }, []);

  // ── Worry timer logic ────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setTimerRunning(false);
            setTimerDone(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const startTimer = () => {
    setTimerLeft(timerMins * 60);
    setTimerDone(false);
    setTimerRunning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const stopTimer = () => {
    setTimerRunning(false);
    setTimerLeft(timerMins * 60);
    setTimerDone(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ── Brain Dump ───────────────────────────────────────────────────────────────
  const handleRelease = useCallback(async () => {
    if (!dumpText.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const item: BrainDump = { id: generateId(), text: dumpText.trim(), timestamp: Date.now() };
    const updated = [item, ...dumps];
    setDumps(updated);
    await AsyncStorage.setItem(DUMP_KEY, JSON.stringify(updated));
    setDumpText("");
    setReleased(true);
    setTimeout(() => setReleased(false), 3000);
  }, [dumpText, dumps]);

  const deleteDump = useCallback(async (id: string) => {
    const updated = dumps.filter((d) => d.id !== id);
    setDumps(updated);
    await AsyncStorage.setItem(DUMP_KEY, JSON.stringify(updated));
  }, [dumps]);

  // ── Control Sort ─────────────────────────────────────────────────────────────
  const addThought = useCallback(async (bucket: "control" | "release") => {
    if (!sortInput.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const item: SortedThought = { id: generateId(), text: sortInput.trim(), bucket, timestamp: Date.now() };
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

  // ── Predictions ──────────────────────────────────────────────────────────────
  const addPrediction = useCallback(async () => {
    if (!predInput.trim()) return;
    const item: Prediction = { id: generateId(), text: predInput.trim(), timestamp: Date.now(), resolved: false, happened: null };
    const updated = [item, ...predictions];
    setPredictions(updated);
    setPredInput("");
    await AsyncStorage.setItem(PREDICT_KEY, JSON.stringify(updated));
  }, [predInput, predictions]);

  const resolvePrediction = useCallback(async (id: string, happened: boolean) => {
    const updated = predictions.map((p) => p.id === id ? { ...p, resolved: true, happened } : p);
    setPredictions(updated);
    await AsyncStorage.setItem(PREDICT_KEY, JSON.stringify(updated));
  }, [predictions]);

  const clearAll = useCallback(async (key: string, setter: (v: any[]) => void) => {
    Alert.alert("Clear all?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: async () => { setter([]); await AsyncStorage.removeItem(key); } },
    ]);
  }, []);

  // ─── Render tabs ──────────────────────────────────────────────────────────────

  function renderDumpTab() {
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={styles.tabIntro}>
          Empty your mind onto the page. You don't need to solve anything — just let it out.
        </Text>

        <View style={styles.card}>
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
            <LinearGradient colors={["#FF8A65", "#FF5722"]} style={styles.releaseBtnGradient}>
              <Text style={styles.releaseBtnText}>
                {released ? "✓  Released" : "🌊  Release it"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {released && (
          <Animated.View entering={FadeInDown} style={styles.successMsg}>
            <Text style={styles.successMsgText}>
              ✨ That's off your chest. You don't have to carry it any more.
            </Text>
          </Animated.View>
        )}

        {/* Overthinker types */}
        <Text style={styles.subHeading}>Which type am I right now?</Text>
        {OVERTHINKER_TYPES.map((t, i) => (
          <TouchableOpacity
            key={t.type}
            style={[styles.typeCard, selectedType === i && { borderColor: t.color, borderWidth: 2 }]}
            onPress={() => { setSelectedType(selectedType === i ? null : i); Haptics.selectionAsync(); }}
            activeOpacity={0.85}
          >
            <View style={[styles.typeIcon, { backgroundColor: t.color + "22" }]}>
              <Ionicons name={t.icon as any} size={20} color={t.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.typeTitle, { color: t.color }]}>{t.type}</Text>
              <Text style={styles.typeDesc}>{t.desc}</Text>
              {selectedType === i && (
                <Animated.View entering={FadeInDown} style={[styles.typeTip, { borderLeftColor: t.color }]}>
                  <Text style={styles.typeTipText}>💡 {t.tip}</Text>
                </Animated.View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {dumps.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.subHeading}>Previous dumps</Text>
              <TouchableOpacity onPress={() => clearAll(DUMP_KEY, setDumps)}>
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>
            </View>
            {dumps.map((d) => (
              <Animated.View key={d.id} entering={FadeInDown} style={styles.historyCard}>
                <Text style={styles.historyText} numberOfLines={4}>{d.text}</Text>
                <View style={styles.rowBetween}>
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
          Overthinking blurs the line between what you can change and what you can't. Sorting them breaks the loop.
        </Text>

        <View style={styles.card}>
          <TextInput
            style={styles.sortInput}
            value={sortInput}
            onChangeText={setSortInput}
            placeholder="Type a thought or worry…"
            placeholderTextColor="rgba(0,0,0,0.3)"
            returnKeyType="done"
          />
          <View style={styles.sortBtns}>
            <TouchableOpacity style={[styles.sortBtn, styles.sortBtnControl]} onPress={() => addThought("control")} activeOpacity={0.8}>
              <Text style={styles.sortBtnText}>✅  I can control this</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sortBtn, styles.sortBtnRelease]} onPress={() => addThought("release")} activeOpacity={0.8}>
              <Text style={styles.sortBtnText}>🕊️  Let it go</Text>
            </TouchableOpacity>
          </View>
        </View>

        {(controlItems.length > 0 || releaseItems.length > 0) && (
          <>
            <View style={styles.sortColumns}>
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
                  ))}
              </View>
              <View style={[styles.sortColumn, styles.sortColumnRelease]}>
                <Text style={styles.sortColumnTitle}>🕊️ Let it go</Text>
                {releaseItems.length === 0
                  ? <Text style={styles.sortEmpty}>Nothing yet</Text>
                  : releaseItems.map((item) => (
                    <View key={item.id} style={[styles.sortChip, { backgroundColor: "rgba(255,255,255,0.75)" }]}>
                      <Text style={styles.sortChipText} numberOfLines={3}>{item.text}</Text>
                      <TouchableOpacity onPress={() => deleteSorted(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle" size={16} color="#B39DDB" />
                      </TouchableOpacity>
                    </View>
                  ))}
              </View>
            </View>

            {/* Insight */}
            {controlItems.length > 0 && releaseItems.length > 0 && (
              <View style={styles.insightCard}>
                <Text style={styles.insightText}>
                  You have {controlItems.length} thing{controlItems.length > 1 ? "s" : ""} to act on,
                  and {releaseItems.length} to release. Focus your energy only on what you can change.
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={() => clearAll(SORT_KEY, setSorted)} style={{ alignItems: "center", marginTop: 8 }}>
              <Text style={styles.clearText}>Clear all thoughts</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    );
  }

  function renderPerspectiveTab() {
    const q = PERSPECTIVE_QUESTIONS[perspIdx];
    const resolved   = predictions.filter((p) => p.resolved);
    const unresolved = predictions.filter((p) => !p.resolved);
    const didHappen  = resolved.filter((p) => p.happened).length;
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={styles.tabIntro}>
          Overthinking amplifies urgency. Zoom out, and see how big this really is.
        </Text>

        {/* Perspective shift */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>What are you overthinking about?</Text>
          <TextInput
            style={styles.perspInput}
            value={perspThought}
            onChangeText={setPerspThought}
            placeholder="Describe it briefly…"
            placeholderTextColor="rgba(0,0,0,0.3)"
            multiline
          />
        </View>

        <Text style={styles.subHeading}>Will this matter in…</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {PERSPECTIVE_QUESTIONS.map((pq, i) => (
            <TouchableOpacity
              key={pq.timeframe}
              style={[styles.timeframeBtn, perspIdx === i && { backgroundColor: pq.color }]}
              onPress={() => { setPerspIdx(i); setPerspAnswer(""); Haptics.selectionAsync(); }}
              activeOpacity={0.8}
            >
              <Ionicons name={pq.icon as any} size={20} color={perspIdx === i ? "#fff" : pq.color} />
              <Text style={[styles.timeframeBtnText, perspIdx === i && { color: "#fff" }]}>{pq.timeframe}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: q.color }]}>
          <Text style={[styles.cardLabel, { color: q.color }]}>In {q.timeframe} from now, how much will this matter?</Text>
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

        {/* Did it happen tracker */}
        <Text style={styles.subHeading}>Did it happen? Tracker</Text>
        <Text style={styles.tabIntro}>
          Log your catastrophic predictions. Come back later to check if they came true.
        </Text>

        {resolved.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statNum}>{resolved.length}</Text>
              <Text style={styles.statLabel}>resolved</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: "rgba(129,199,132,0.3)" }]}>
              <Text style={[styles.statNum, { color: "#388E3C" }]}>{resolved.length - didHappen}</Text>
              <Text style={styles.statLabel}>never happened</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: "rgba(239,154,154,0.3)" }]}>
              <Text style={[styles.statNum, { color: "#C62828" }]}>{didHappen}</Text>
              <Text style={styles.statLabel}>did happen</Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <TextInput
            style={styles.sortInput}
            value={predInput}
            onChangeText={setPredInput}
            placeholder="I'm afraid that…"
            placeholderTextColor="rgba(0,0,0,0.3)"
            returnKeyType="done"
            onSubmitEditing={addPrediction}
          />
          <TouchableOpacity
            style={[styles.addBtn, !predInput.trim() && { opacity: 0.4 }]}
            onPress={addPrediction}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Log this prediction</Text>
          </TouchableOpacity>
        </View>

        {unresolved.map((p) => (
          <View key={p.id} style={styles.predCard}>
            <Text style={styles.predText}>{p.text}</Text>
            <Text style={styles.predDate}>
              {new Date(p.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </Text>
            <Text style={[styles.cardLabel, { marginTop: 8 }]}>Did it happen?</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
              <TouchableOpacity style={styles.predBtnNo}  onPress={() => resolvePrediction(p.id, false)}>
                <Text style={styles.predBtnNoText}>No, it didn't</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.predBtnYes} onPress={() => resolvePrediction(p.id, true)}>
                <Text style={styles.predBtnYesText}>Yes it did</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {resolved.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.subHeading}>Resolved predictions</Text>
            {resolved.map((p) => (
              <View key={p.id} style={[styles.predCard, { opacity: 0.7 }]}>
                <Text style={styles.predText}>{p.text}</Text>
                <View style={[styles.resolvedBadge, p.happened ? styles.badgeHappened : styles.badgeDidnt]}>
                  <Text style={styles.resolvedBadgeText}>
                    {p.happened ? "It happened" : "Never happened ✓"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Animated.View>
    );
  }

  function renderTimerTab() {
    const progress = timerLeft / (timerMins * 60);
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={styles.tabIntro}>
          Give yourself a scheduled "worry window." Worry as hard as you can for this time — then you must stop.
        </Text>

        {!timerRunning && !timerDone && (
          <>
            <Text style={styles.subHeading}>How long is your worry window?</Text>
            <View style={styles.timerOptions}>
              {TIMER_OPTIONS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.timerOption, timerMins === m && styles.timerOptionActive]}
                  onPress={() => { setTimerMins(m); setTimerLeft(m * 60); Haptics.selectionAsync(); }}
                >
                  <Text style={[styles.timerOptionText, timerMins === m && styles.timerOptionTextActive]}>
                    {m} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.timerDisplay}>
          <Text style={styles.timerTime}>
            {timerDone ? "Done!" : formatTime(timerLeft)}
          </Text>
          {timerRunning && (
            <View style={styles.timerProgressBar}>
              <View style={[styles.timerProgressFill, { width: `${progress * 100}%` as any }]} />
            </View>
          )}
          {timerDone ? (
            <View style={styles.timerDoneMsg}>
              <Text style={styles.timerDoneTitle}>Worry window closed 🎉</Text>
              <Text style={styles.timerDoneText}>
                You gave those thoughts their time. Now it's over. Any further worry today is optional — and you can choose to let it go.
              </Text>
            </View>
          ) : (
            <Text style={styles.timerHint}>
              {timerRunning
                ? "Worry deeply. Write it down. When the timer ends, you're done."
                : "Press start. Worry fully for the allotted time. Then stop."}
            </Text>
          )}
        </View>

        <View style={styles.timerBtns}>
          {!timerRunning && !timerDone && (
            <TouchableOpacity style={styles.timerStartBtn} onPress={startTimer} activeOpacity={0.85}>
              <LinearGradient colors={["#FF8A65", "#FF5722"]} style={styles.timerBtnGradient}>
                <Text style={styles.timerBtnText}>Start Worry Window</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {timerRunning && (
            <TouchableOpacity style={styles.timerStopBtn} onPress={stopTimer} activeOpacity={0.85}>
              <Text style={styles.timerStopText}>Stop & Reset</Text>
            </TouchableOpacity>
          )}
          {timerDone && (
            <TouchableOpacity style={styles.timerStartBtn} onPress={stopTimer} activeOpacity={0.85}>
              <LinearGradient colors={["#81C784", "#388E3C"]} style={styles.timerBtnGradient}>
                <Text style={styles.timerBtnText}>Reset</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Science note */}
        <View style={styles.scienceCard}>
          <Text style={styles.scienceTitle}>🧠 Why this works</Text>
          <Text style={styles.scienceText}>
            Scheduled worry time is a clinically validated CBT technique. Postponing worry to a set window reduces intrusive thoughts throughout the day and weakens the habit loop of rumination.
          </Text>
        </View>
      </Animated.View>
    );
  }

  // ─── Full render ──────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
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
              <Text style={styles.subtitle}>Break the loop · Find your calm</Text>
            </View>
          </View>

          {/* Quick break cards */}
          <View style={{ marginBottom: 8 }}>
            <Text style={styles.sectionLabel}>Instant loop-breakers — tap to expand</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}>
              {QUICK_BREAKS.map((qb) => (
                <TouchableOpacity
                  key={qb.id}
                  style={[styles.breakCard, activeBreak === qb.id && { borderColor: qb.color, borderWidth: 2 }]}
                  onPress={() => { setActiveBreak(activeBreak === qb.id ? null : qb.id); Haptics.selectionAsync(); }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.breakEmoji}>{qb.emoji}</Text>
                  <Text style={[styles.breakTitle, { color: qb.color }]}>{qb.title}</Text>
                  {activeBreak === qb.id
                    ? qb.steps.map((step, i) => (
                      <Text key={i} style={styles.breakStep}>{i + 1}. {step}</Text>
                    ))
                    : <Text style={styles.breakTap}>Tap for steps</Text>
                  }
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Rotating tip */}
          <View style={styles.tipRow}>
            <View style={styles.tipCard}>
              <Text style={styles.tipLabel}>💡 Reminder</Text>
              <Text style={styles.tipText}>{LOOP_BREAKERS[tipIdx]}</Text>
            </View>
            <TouchableOpacity style={styles.tipNext} onPress={() => { setTipIdx((tipIdx + 1) % LOOP_BREAKERS.length); Haptics.selectionAsync(); }}>
              <Ionicons name="refresh" size={18} color="#FF7043" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            {(["dump", "sort", "perspective", "timer"] as ActiveTab[]).map((tab) => {
              const labels: Record<ActiveTab, string> = { dump: "Brain Dump", sort: "Control Filter", perspective: "Perspective", timer: "Worry Timer" };
              return (
                <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)}>
                  <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]} numberOfLines={1}>
                    {labels[tab]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.tabContent}>
            {activeTab === "dump"        && renderDumpTab()}
            {activeTab === "sort"        && renderSortTab()}
            {activeTab === "perspective" && renderPerspectiveTab()}
            {activeTab === "timer"       && renderTimerTab()}
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 20, paddingBottom: 20, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center", alignItems: "center", marginTop: 2,
  },
  title:    { fontSize: 26, fontFamily: "Nunito_700Bold",    color: "#fff" },
  subtitle: { fontSize: 14, fontFamily: "Nunito_400Regular", color: "rgba(255,255,255,0.85)", marginTop: 2 },

  sectionLabel: {
    fontSize: 12, fontFamily: "Nunito_600SemiBold",
    color: "rgba(255,255,255,0.85)", marginLeft: 20, marginBottom: 10,
    textTransform: "uppercase", letterSpacing: 0.4,
  },

  breakCard: {
    width: 150, backgroundColor: "#fff", borderRadius: 16,
    padding: 14, marginRight: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  breakEmoji: { fontSize: 26, marginBottom: 6 },
  breakTitle: { fontSize: 13, fontFamily: "Nunito_700Bold", marginBottom: 6 },
  breakTap:   { fontSize: 11, fontFamily: "Nunito_400Regular", color: "#999", fontStyle: "italic" },
  breakStep:  { fontSize: 11, fontFamily: "Nunito_400Regular", color: "#555", lineHeight: 16, marginBottom: 2 },

  tipRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginVertical: 12, gap: 10 },
  tipCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 14, padding: 14 },
  tipLabel: { fontSize: 11, fontFamily: "Nunito_700Bold", color: "#FF7043", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  tipText:  { fontSize: 14, fontFamily: "Nunito_400Regular", color: "#444", lineHeight: 20 },
  tipNext:  { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.88)", justifyContent: "center", alignItems: "center" },

  tabBar: {
    flexDirection: "row", marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 14, padding: 4, marginBottom: 4,
  },
  tabBtn:           { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabBtnActive:     { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabBtnText:       { fontSize: 11, fontFamily: "Nunito_600SemiBold", color: "rgba(255,255,255,0.85)" },
  tabBtnTextActive: { color: "#FF7043" },

  tabContent: { marginHorizontal: 20, marginTop: 16 },
  tabIntro:   { fontSize: 14, fontFamily: "Nunito_400Regular", color: "rgba(255,255,255,0.9)", lineHeight: 20, marginBottom: 16 },
  subHeading: { fontSize: 13, fontFamily: "Nunito_700Bold", color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10, marginTop: 4 },

  card: {
    backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  cardLabel: { fontSize: 13, fontFamily: "Nunito_600SemiBold", color: "#888", marginBottom: 8 },

  dumpInput: {
    fontSize: 15, fontFamily: "Nunito_400Regular", color: "#333",
    minHeight: 120, lineHeight: 22, textAlignVertical: "top", marginBottom: 12,
  },
  releaseBtn:          { borderRadius: 14, overflow: "hidden" },
  releaseBtnDisabled:  { opacity: 0.45 },
  releaseBtnGradient:  { paddingVertical: 14, alignItems: "center" },
  releaseBtnText:      { fontSize: 16, fontFamily: "Nunito_700Bold", color: "#fff" },
  successMsg:          { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 14, padding: 14, marginBottom: 12 },
  successMsgText:      { fontSize: 14, fontFamily: "Nunito_400Regular", color: "#555", textAlign: "center", lineHeight: 20 },

  typeCard: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 14,
    padding: 14, marginBottom: 10, gap: 12, alignItems: "flex-start",
  },
  typeIcon:  { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  typeTitle: { fontSize: 14, fontFamily: "Nunito_700Bold", marginBottom: 3 },
  typeDesc:  { fontSize: 12, fontFamily: "Nunito_400Regular", color: "#666", lineHeight: 17 },
  typeTip:   { marginTop: 8, borderLeftWidth: 3, paddingLeft: 8 },
  typeTipText: { fontSize: 12, fontFamily: "Nunito_400Regular", color: "#444", lineHeight: 18 },

  rowBetween:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  clearText:    { fontSize: 12, fontFamily: "Nunito_400Regular", color: "rgba(255,255,255,0.7)", textDecorationLine: "underline" },
  historyCard:  { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 14, padding: 14, marginBottom: 10 },
  historyText:  { fontSize: 14, fontFamily: "Nunito_400Regular", color: "#444", lineHeight: 20, marginBottom: 8 },
  historyDate:  { fontSize: 11, fontFamily: "Nunito_400Regular", color: "#999" },

  sortInput:    { fontSize: 15, fontFamily: "Nunito_400Regular", color: "#333", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#EEE", marginBottom: 14 },
  sortBtns:     { flexDirection: "row", gap: 10 },
  sortBtn:      { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  sortBtnControl:  { backgroundColor: "#E8F5E9" },
  sortBtnRelease:  { backgroundColor: "#EDE7F6" },
  sortBtnText:     { fontSize: 13, fontFamily: "Nunito_700Bold", color: "#444" },
  sortColumns:     { flexDirection: "row", gap: 12, marginBottom: 10 },
  sortColumn:      { flex: 1, borderRadius: 16, padding: 12, minHeight: 80 },
  sortColumnControl: { backgroundColor: "rgba(200,230,200,0.9)" },
  sortColumnRelease: { backgroundColor: "rgba(220,210,240,0.9)" },
  sortColumnTitle: { fontSize: 12, fontFamily: "Nunito_700Bold", color: "#555", marginBottom: 10 },
  sortEmpty:       { fontSize: 12, fontFamily: "Nunito_400Regular", color: "rgba(0,0,0,0.35)", fontStyle: "italic" },
  sortChip:        { backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 10, padding: 9, marginBottom: 6, flexDirection: "row", alignItems: "flex-start", gap: 6 },
  sortChipText:    { flex: 1, fontSize: 12, fontFamily: "Nunito_400Regular", color: "#444", lineHeight: 16 },
  insightCard:     { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 14, padding: 14, marginBottom: 12 },
  insightText:     { fontSize: 13, fontFamily: "Nunito_400Regular", color: "#555", lineHeight: 20, textAlign: "center" },

  perspInput:      { fontSize: 15, fontFamily: "Nunito_400Regular", color: "#333", minHeight: 60, lineHeight: 22, textAlignVertical: "top" },
  timeframeBtn:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 24, paddingHorizontal: 14, paddingVertical: 9, marginRight: 10 },
  timeframeBtnText:{ fontSize: 13, fontFamily: "Nunito_700Bold", color: "#555" },
  perspAnswerInput:{ fontSize: 15, fontFamily: "Nunito_400Regular", color: "#333", minHeight: 80, lineHeight: 22, textAlignVertical: "top" },

  statsRow:  { flexDirection: "row", gap: 10, marginBottom: 14 },
  statPill:  { flex: 1, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 12, padding: 10, alignItems: "center" },
  statNum:   { fontSize: 22, fontFamily: "Nunito_700Bold", color: "#fff" },
  statLabel: { fontSize: 10, fontFamily: "Nunito_400Regular", color: "rgba(255,255,255,0.8)", marginTop: 2 },

  addBtn:     { backgroundColor: "rgba(255,112,67,0.15)", borderRadius: 10, paddingVertical: 10, alignItems: "center", marginTop: 6 },
  addBtnText: { fontSize: 14, fontFamily: "Nunito_600SemiBold", color: "#FF7043" },

  predCard:       { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 14, padding: 14, marginBottom: 10 },
  predText:       { fontSize: 14, fontFamily: "Nunito_400Regular", color: "#333", lineHeight: 20, marginBottom: 4 },
  predDate:       { fontSize: 11, fontFamily: "Nunito_400Regular", color: "#999" },
  predBtnNo:      { flex: 1, backgroundColor: "#E8F5E9", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  predBtnNoText:  { fontSize: 13, fontFamily: "Nunito_600SemiBold", color: "#388E3C" },
  predBtnYes:     { flex: 1, backgroundColor: "#FCE4EC", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  predBtnYesText: { fontSize: 13, fontFamily: "Nunito_600SemiBold", color: "#C62828" },
  resolvedBadge:  { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  badgeDidnt:     { backgroundColor: "#E8F5E9" },
  badgeHappened:  { backgroundColor: "#FCE4EC" },
  resolvedBadgeText: { fontSize: 12, fontFamily: "Nunito_600SemiBold", color: "#555" },

  timerOptions:     { flexDirection: "row", gap: 10, marginBottom: 20 },
  timerOption:      { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.35)", alignItems: "center" },
  timerOptionActive:{ backgroundColor: "#fff" },
  timerOptionText:  { fontSize: 15, fontFamily: "Nunito_600SemiBold", color: "rgba(255,255,255,0.85)" },
  timerOptionTextActive: { color: "#FF7043" },
  timerDisplay:  { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 24, padding: 30, alignItems: "center", marginBottom: 20 },
  timerTime:     { fontSize: 56, fontFamily: "Nunito_700Bold", color: "#fff", letterSpacing: -1 },
  timerHint:     { fontSize: 13, fontFamily: "Nunito_400Regular", color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 20, marginTop: 12 },
  timerProgressBar:  { width: "100%", height: 6, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 3, marginTop: 16 },
  timerProgressFill: { height: 6, backgroundColor: "#fff", borderRadius: 3 },
  timerDoneMsg:  { alignItems: "center", marginTop: 12 },
  timerDoneTitle:{ fontSize: 18, fontFamily: "Nunito_700Bold", color: "#fff", marginBottom: 8 },
  timerDoneText: { fontSize: 13, fontFamily: "Nunito_400Regular", color: "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 20 },
  timerBtns:     { marginBottom: 20 },
  timerStartBtn: { borderRadius: 16, overflow: "hidden" },
  timerBtnGradient: { paddingVertical: 16, alignItems: "center" },
  timerBtnText:  { fontSize: 17, fontFamily: "Nunito_700Bold", color: "#fff" },
  timerStopBtn:  { paddingVertical: 14, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center" },
  timerStopText: { fontSize: 16, fontFamily: "Nunito_600SemiBold", color: "#fff" },
  scienceCard:   { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 16, padding: 16 },
  scienceTitle:  { fontSize: 14, fontFamily: "Nunito_700Bold", color: "#444", marginBottom: 8 },
  scienceText:   { fontSize: 13, fontFamily: "Nunito_400Regular", color: "#666", lineHeight: 20 },
});
