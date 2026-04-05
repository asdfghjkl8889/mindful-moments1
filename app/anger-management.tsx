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

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AngerLog {
  id: string;
  trigger: string;
  intensity: number;
  bodySensations: string[];
  action: string;
  need: string;
  timestamp: number;
}

type ActiveTab = "cooldown" | "log" | "needs" | "techniques";

// ─── Constants ─────────────────────────────────────────────────────────────────

const LOG_KEY = "mindful_anger_logs";

const INTENSITY_LABELS = ["", "Mildly irritated", "Frustrated", "Quite angry", "Very angry", "Furious"];
const INTENSITY_COLORS = ["", "#FFF9C4", "#FFCC02", "#FFA726", "#EF5350", "#B71C1C"];

const BODY_SENSATIONS = [
  "Tight chest", "Clenched jaw", "Hot face", "Racing heart",
  "Tense shoulders", "Stomach knot", "Shaking hands", "Headache",
  "Heavy breathing", "Clenched fists",
];

const UNMET_NEEDS = [
  { need: "Respect",     icon: "ribbon-outline",       color: "#EF5350", desc: "You may feel disrespected or dismissed." },
  { need: "Fairness",    icon: "scale-outline",         color: "#FF7043", desc: "Something feels unjust or unfair to you." },
  { need: "Safety",      icon: "shield-outline",        color: "#FFB74D", desc: "You may feel threatened or unsafe." },
  { need: "Control",     icon: "options-outline",       color: "#26A69A", desc: "You may feel powerless or out of control." },
  { need: "Connection",  icon: "heart-outline",         color: "#F06292", desc: "You may feel unseen, unloved, or excluded." },
  { need: "Autonomy",    icon: "person-outline",        color: "#9575CD", desc: "You may feel controlled or micromanaged." },
  { need: "Recognition", icon: "star-outline",          color: "#64B5F6", desc: "Your effort or value may feel unacknowledged." },
  { need: "Boundaries",  icon: "ban-outline",           color: "#81C784", desc: "A personal boundary may have been crossed." },
];

const COOL_DOWN_TECHNIQUES = [
  {
    id: "breathe",
    emoji: "🌬️",
    title: "4-7-8 Breathing",
    color: "#64B5F6",
    science: "Activates your parasympathetic nervous system instantly.",
    steps: [
      "Breathe IN through your nose for 4 counts.",
      "HOLD your breath for 7 counts.",
      "Breathe OUT through your mouth for 8 counts.",
      "Repeat 3–4 times. Feel the tension leave.",
    ],
  },
  {
    id: "cold",
    emoji: "🧊",
    title: "Cold Water Dive Response",
    color: "#B39DDB",
    science: "Cold triggers the dive reflex — slows heart rate in seconds.",
    steps: [
      "Get a bowl of cold water (or use the sink).",
      "Hold your breath and dip your face for 15–30 seconds.",
      "Or hold ice cubes in your hands for 30 seconds.",
      "Feel your heart rate drop and anger diffuse.",
    ],
  },
  {
    id: "move",
    emoji: "🏃",
    title: "Physical Discharge",
    color: "#FF8A65",
    science: "Anger triggers adrenaline — movement burns it off safely.",
    steps: [
      "Walk briskly for 5–10 minutes.",
      "Or do 20 jumping jacks right now.",
      "Or punch a pillow or squeeze a stress ball.",
      "Physical movement clears adrenaline from your system.",
    ],
  },
  {
    id: "space",
    emoji: "🚶",
    title: "STOP Technique",
    color: "#81C784",
    science: "Creates a pause between trigger and reaction.",
    steps: [
      "STOP — do not speak or act right now.",
      "TAKE a breath — inhale slowly.",
      "OBSERVE — what are you feeling? Where?",
      "PROCEED — only now choose your response.",
    ],
  },
  {
    id: "progressive",
    emoji: "💪",
    title: "Progressive Release",
    color: "#FFD54F",
    science: "Releasing physical tension reduces emotional tension.",
    steps: [
      "Clench your fists as tight as you can. Hold 5 seconds.",
      "Release. Notice the difference.",
      "Tense your shoulders up to your ears. Hold 5 seconds.",
      "Release. Breathe.",
      "Tense your whole face. Hold 5 seconds.",
      "Release and let everything soften.",
    ],
  },
];

const DE_ESCALATION = [
  { tip: "Leave the room before you respond. You can always return.", icon: "exit-outline" },
  { tip: "Say: 'I need a moment.' You do not need to justify it.", icon: "time-outline" },
  { tip: "Never send messages in anger. Write it, then wait 10 minutes.", icon: "mail-outline" },
  { tip: "Lower your voice consciously — it lowers your emotion too.", icon: "volume-low-outline" },
  { tip: "Use 'I feel...' instead of 'You always...'", icon: "chatbubble-outline" },
  { tip: "Agree to return to the conversation when both parties are calm.", icon: "calendar-outline" },
];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function AngerManagementScreen() {
  const insets   = useSafeAreaInsets();
  const topPad   = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<ActiveTab>("cooldown");

  // Log state
  const [logs,          setLogs]          = useState<AngerLog[]>([]);
  const [trigger,       setTrigger]       = useState("");
  const [intensity,     setIntensity]     = useState(3);
  const [selectedBody,  setSelectedBody]  = useState<string[]>([]);
  const [action,        setAction]        = useState("");
  const [selectedNeed,  setSelectedNeed]  = useState("");
  const [logSaved,      setLogSaved]      = useState(false);

  // Cool-down
  const [activeBreak,   setActiveBreak]   = useState<string | null>(null);

  // Needs
  const [expandedNeed,  setExpandedNeed]  = useState<string | null>(null);

  // Timer (for space/pause)
  const [timerActive, setTimerActive]  = useState(false);
  const [timerLeft,   setTimerLeft]    = useState(600);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LOG_KEY).then((r) => { if (r) setLogs(JSON.parse(r)); });
  }, []);

  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => {
        setTimerLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setTimerActive(false);
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
  }, [timerActive]);

  const saveLog = useCallback(async () => {
    if (!trigger.trim()) return;
    const item: AngerLog = {
      id: generateId(),
      trigger: trigger.trim(),
      intensity,
      bodySensations: selectedBody,
      action: action.trim(),
      need: selectedNeed,
      timestamp: Date.now(),
    };
    const updated = [item, ...logs];
    setLogs(updated);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(updated));
    setTrigger(""); setAction(""); setSelectedBody([]); setSelectedNeed(""); setIntensity(3);
    setLogSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setLogSaved(false), 3000);
  }, [trigger, intensity, selectedBody, action, selectedNeed, logs]);

  const deleteLog = useCallback(async (id: string) => {
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(updated));
  }, [logs]);

  const toggleBody = (s: string) => {
    setSelectedBody((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
    Haptics.selectionAsync();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ─── Render tabs ────────────────────────────────────────────────────────────

  function renderCoolDown() {
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={styles.tabIntro}>
          When anger peaks, your thinking brain shuts down. Use these techniques to bring it back online before you respond.
        </Text>

        {/* 10-minute space timer */}
        <View style={styles.spaceTimer}>
          <Text style={styles.spaceTimerTitle}>⏱ 10-Minute Pause Timer</Text>
          <Text style={styles.spaceTimerDesc}>
            Remove yourself from the situation. Return only when this timer ends.
          </Text>
          {!timerActive ? (
            <TouchableOpacity
              style={styles.spaceTimerBtn}
              onPress={() => { setTimerLeft(600); setTimerActive(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }}
              activeOpacity={0.85}
            >
              <Text style={styles.spaceTimerBtnText}>Start 10-Minute Break</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ alignItems: "center" }}>
              <Text style={styles.pauseTime}>{formatTime(timerLeft)}</Text>
              <TouchableOpacity
                style={[styles.spaceTimerBtn, { backgroundColor: "rgba(255,255,255,0.3)" }]}
                onPress={() => { setTimerActive(false); setTimerLeft(600); }}
              >
                <Text style={styles.spaceTimerBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.subHeading}>Cool-down techniques — tap to expand</Text>
        {COOL_DOWN_TECHNIQUES.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.techniqueCard, activeBreak === t.id && { borderColor: t.color, borderWidth: 2 }]}
            onPress={() => { setActiveBreak(activeBreak === t.id ? null : t.id); Haptics.selectionAsync(); }}
            activeOpacity={0.85}
          >
            <View style={styles.techniqueHeader}>
              <Text style={styles.techniqueEmoji}>{t.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.techniqueTitle, { color: t.color }]}>{t.title}</Text>
                <Text style={styles.techniqueScience}>{t.science}</Text>
              </View>
              <Ionicons
                name={activeBreak === t.id ? "chevron-up" : "chevron-down"}
                size={18} color="#999"
              />
            </View>
            {activeBreak === t.id && (
              <Animated.View entering={FadeInDown} style={styles.techniqueSteps}>
                {t.steps.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={[styles.stepNum, { backgroundColor: t.color }]}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </TouchableOpacity>
        ))}

        {/* De-escalation tips */}
        <Text style={[styles.subHeading, { marginTop: 8 }]}>When it's with someone else</Text>
        {DE_ESCALATION.map((item, i) => (
          <View key={i} style={styles.deEscCard}>
            <Ionicons name={item.icon as any} size={18} color="#EF5350" style={{ marginTop: 2 }} />
            <Text style={styles.deEscText}>{item.tip}</Text>
          </View>
        ))}
      </Animated.View>
    );
  }

  function renderLog() {
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={styles.tabIntro}>
          Logging your anger after the fact reveals patterns and helps you respond better next time.
        </Text>

        {logSaved && (
          <Animated.View entering={FadeInDown} style={styles.successMsg}>
            <Text style={styles.successMsgText}>✓ Logged. Awareness is the first step to change.</Text>
          </Animated.View>
        )}

        <View style={styles.card}>
          {/* Trigger */}
          <Text style={styles.cardLabel}>What triggered it?</Text>
          <TextInput
            style={styles.textInput}
            value={trigger}
            onChangeText={setTrigger}
            placeholder="Describe the situation briefly…"
            placeholderTextColor="rgba(0,0,0,0.3)"
            multiline
          />

          {/* Intensity */}
          <Text style={[styles.cardLabel, { marginTop: 14 }]}>How intense was it? (1–5)</Text>
          <View style={styles.intensityRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.intensityBtn, intensity === n && { backgroundColor: INTENSITY_COLORS[n] }]}
                onPress={() => { setIntensity(n); Haptics.selectionAsync(); }}
              >
                <Text style={[styles.intensityNum, intensity === n && { color: n >= 4 ? "#fff" : "#333" }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {intensity > 0 && (
            <Text style={[styles.intensityLabel, { color: INTENSITY_COLORS[intensity] }]}>
              {INTENSITY_LABELS[intensity]}
            </Text>
          )}

          {/* Body sensations */}
          <Text style={[styles.cardLabel, { marginTop: 14 }]}>Where did you feel it? (select all)</Text>
          <View style={styles.chipRow}>
            {BODY_SENSATIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, selectedBody.includes(s) && styles.chipSelected]}
                onPress={() => toggleBody(s)}
              >
                <Text style={[styles.chipText, selectedBody.includes(s) && styles.chipTextSelected]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* What did you do */}
          <Text style={[styles.cardLabel, { marginTop: 14 }]}>What did you do?</Text>
          <TextInput
            style={styles.textInput}
            value={action}
            onChangeText={setAction}
            placeholder="How did you respond or want to respond…"
            placeholderTextColor="rgba(0,0,0,0.3)"
            multiline
          />

          {/* Need */}
          <Text style={[styles.cardLabel, { marginTop: 14 }]}>What need was not met?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {UNMET_NEEDS.map((n) => (
              <TouchableOpacity
                key={n.need}
                style={[styles.needPill, selectedNeed === n.need && { backgroundColor: n.color }]}
                onPress={() => { setSelectedNeed(selectedNeed === n.need ? "" : n.need); Haptics.selectionAsync(); }}
              >
                <Text style={[styles.needPillText, selectedNeed === n.need && { color: "#fff" }]}>{n.need}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveBtn, !trigger.trim() && { opacity: 0.4 }]}
            onPress={saveLog}
            activeOpacity={0.85}
          >
            <LinearGradient colors={["#EF5350", "#B71C1C"]} style={styles.saveBtnGradient}>
              <Text style={styles.saveBtnText}>Save this log</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {logs.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.subHeading}>Past logs ({logs.length})</Text>
            {logs.map((log) => (
              <Animated.View key={log.id} entering={FadeInDown} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={[styles.intensityDot, { backgroundColor: INTENSITY_COLORS[log.intensity] || "#ccc" }]} />
                  <Text style={styles.logDate}>
                    {new Date(log.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  <TouchableOpacity onPress={() => deleteLog(log.id)} style={{ marginLeft: "auto" }}>
                    <Ionicons name="trash-outline" size={15} color="#EF9A9A" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.logTrigger}>{log.trigger}</Text>
                {log.need ? <Text style={styles.logNeed}>Unmet need: {log.need}</Text> : null}
                {log.bodySensations.length > 0 && (
                  <Text style={styles.logBody}>{log.bodySensations.join(" · ")}</Text>
                )}
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.View>
    );
  }

  function renderNeeds() {
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={styles.tabIntro}>
          Anger is almost always a signal — something you need is not being met. Identifying it shifts you from reaction to understanding.
        </Text>

        <View style={styles.needsQuote}>
          <Text style={styles.needsQuoteText}>
            "Behind every anger is a hurt. Behind every hurt is a need."
          </Text>
        </View>

        {UNMET_NEEDS.map((n) => (
          <TouchableOpacity
            key={n.need}
            style={[styles.needCard, expandedNeed === n.need && { borderColor: n.color, borderWidth: 2 }]}
            onPress={() => { setExpandedNeed(expandedNeed === n.need ? null : n.need); Haptics.selectionAsync(); }}
            activeOpacity={0.85}
          >
            <View style={[styles.needIcon, { backgroundColor: n.color + "22" }]}>
              <Ionicons name={n.icon as any} size={22} color={n.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.needTitle, { color: n.color }]}>{n.need}</Text>
              <Text style={styles.needDesc}>{n.desc}</Text>
              {expandedNeed === n.need && (
                <Animated.View entering={FadeInDown} style={[styles.needExpanded, { borderLeftColor: n.color }]}>
                  <Text style={styles.needExpandedTitle}>How to address it:</Text>
                  <Text style={styles.needExpandedText}>
                    {n.need === "Respect"     && "Calmly name what felt disrespectful and what you need instead. Use 'I' statements."}
                    {n.need === "Fairness"    && "Articulate specifically what feels unfair. Propose what fairness looks like to you."}
                    {n.need === "Safety"      && "Remove yourself from the threat if possible. Name the boundary that needs to hold."}
                    {n.need === "Control"     && "Identify what you can control right now. Release what you cannot."}
                    {n.need === "Connection"  && "Name the disconnection you feel. Ask for the connection you need directly."}
                    {n.need === "Autonomy"    && "Express that you need space to make your own choices. Name the specific constraint."}
                    {n.need === "Recognition" && "Ask directly for acknowledgement. People often don't know what you need."}
                    {n.need === "Boundaries"  && "Clearly state which boundary was crossed and what the consequence will be."}
                  </Text>
                </Animated.View>
              )}
            </View>
            <Ionicons name={expandedNeed === n.need ? "chevron-up" : "chevron-down"} size={16} color="#999" />
          </TouchableOpacity>
        ))}
      </Animated.View>
    );
  }

  function renderTechniques() {
    return (
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={styles.tabIntro}>
          Long-term anger management is about changing your relationship with the emotion — not suppressing it.
        </Text>

        {[
          {
            title: "The THINK Filter",
            icon: "bulb-outline",
            color: "#FFD54F",
            points: [
              "T — Is it True?",
              "H — Is it Helpful?",
              "I — Is it Inspiring?",
              "N — Is it Necessary?",
              "K — Is it Kind?",
              "Before you act, run your response through this.",
            ],
          },
          {
            title: "Anger Journaling",
            icon: "create-outline",
            color: "#81C784",
            points: [
              "Write freely about what angered you.",
              "Then write what you wish had happened.",
              "Then write what you will do differently.",
              "Do not edit. Do not judge. Just write.",
              "Studies show journaling lowers cortisol by 20%.",
            ],
          },
          {
            title: "The 48-Hour Rule",
            icon: "time-outline",
            color: "#64B5F6",
            points: [
              "For non-urgent anger, wait 48 hours before responding.",
              "Write the message or conversation you want to have.",
              "Wait 2 days. Re-read it.",
              "Most of the time, you will rewrite it completely.",
              "Urgency in anger is almost always false urgency.",
            ],
          },
          {
            title: "Anger Triggers Inventory",
            icon: "list-outline",
            color: "#F06292",
            points: [
              "Use the Log tab for 2 weeks.",
              "Look for patterns: same person? same time of day?",
              "Identify your top 3 recurring triggers.",
              "Pre-plan your response to each one.",
              "Preparation removes the power of the trigger.",
            ],
          },
          {
            title: "Empathy Reframe",
            icon: "people-outline",
            color: "#B39DDB",
            points: [
              "Ask: what might this person be going through?",
              "Consider their stress, background, or fear.",
              "This does not excuse bad behaviour.",
              "But it dissolves the personalisation of it.",
              "Anger fades when we understand rather than judge.",
            ],
          },
        ].map((item, i) => (
          <View key={i} style={styles.techniqueBlock}>
            <View style={styles.techniqueBlockHeader}>
              <View style={[styles.techniqueBlockIcon, { backgroundColor: item.color + "33" }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={[styles.techniqueBlockTitle, { color: item.color }]}>{item.title}</Text>
            </View>
            {item.points.map((p, j) => (
              <View key={j} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: item.color }]} />
                <Text style={styles.bulletText}>{p}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.scienceCard}>
          <Text style={styles.scienceTitle}>🧠 What happens in your brain</Text>
          <Text style={styles.scienceText}>
            Anger triggers the amygdala — your brain's alarm system. It takes 20–30 minutes for adrenaline and cortisol to fully clear your bloodstream after a peak anger response. This is why "counting to 10" alone doesn't work. You need at least 20 minutes of physical distance before your pre-frontal cortex (the rational brain) comes back online.
          </Text>
        </View>
      </Animated.View>
    );
  }

  // ─── Full render ──────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <LinearGradient colors={["#C62828", "#EF5350", "#FFCCBC"]} style={{ flex: 1 }}>
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
              <Text style={styles.title}>Anger Management</Text>
              <Text style={styles.subtitle}>Understand it · Channel it · Release it</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            {(["cooldown", "log", "needs", "techniques"] as ActiveTab[]).map((tab) => {
              const labels: Record<ActiveTab, string> = {
                cooldown: "Cool Down",
                log: "Anger Log",
                needs: "Needs",
                techniques: "Techniques",
              };
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]} numberOfLines={1}>
                    {labels[tab]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.tabContent}>
            {activeTab === "cooldown"   && renderCoolDown()}
            {activeTab === "log"        && renderLog()}
            {activeTab === "needs"      && renderNeeds()}
            {activeTab === "techniques" && renderTechniques()}
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

  tabBar: {
    flexDirection: "row", marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 14, padding: 4, marginBottom: 4,
  },
  tabBtn:           { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabBtnActive:     { backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  tabBtnText:       { fontSize: 11, fontFamily: "Nunito_600SemiBold", color: "rgba(255,255,255,0.85)" },
  tabBtnTextActive: { color: "#C62828" },

  tabContent: { marginHorizontal: 20, marginTop: 16 },
  tabIntro:   { fontSize: 14, fontFamily: "Nunito_400Regular", color: "rgba(255,255,255,0.9)", lineHeight: 20, marginBottom: 16 },
  subHeading: { fontSize: 13, fontFamily: "Nunito_700Bold", color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 },

  card: {
    backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  cardLabel:  { fontSize: 13, fontFamily: "Nunito_600SemiBold", color: "#888", marginBottom: 8 },
  textInput:  { fontSize: 15, fontFamily: "Nunito_400Regular", color: "#333", minHeight: 70, lineHeight: 22, textAlignVertical: "top" },
  successMsg: { backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 14, padding: 14, marginBottom: 14, alignItems: "center" },
  successMsgText: { fontSize: 14, fontFamily: "Nunito_400Regular", color: "#333", textAlign: "center" },

  // Space timer
  spaceTimer:       { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 18, padding: 18, marginBottom: 20, alignItems: "center" },
  spaceTimerTitle:  { fontSize: 16, fontFamily: "Nunito_700Bold", color: "#fff", marginBottom: 6 },
  spaceTimerDesc:   { fontSize: 13, fontFamily: "Nunito_400Regular", color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 18, marginBottom: 14 },
  spaceTimerBtn:    { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  spaceTimerBtnText:{ fontSize: 14, fontFamily: "Nunito_700Bold", color: "#C62828" },
  pauseTime:        { fontSize: 52, fontFamily: "Nunito_700Bold", color: "#fff", marginBottom: 12 },

  // Technique cards
  techniqueCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  techniqueHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  techniqueEmoji:  { fontSize: 26 },
  techniqueTitle:  { fontSize: 15, fontFamily: "Nunito_700Bold", marginBottom: 2 },
  techniqueScience:{ fontSize: 11, fontFamily: "Nunito_400Regular", color: "#888", lineHeight: 15 },
  techniqueSteps:  { marginTop: 14, gap: 10 },
  stepRow:         { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  stepNum:         { width: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  stepNumText:     { fontSize: 11, fontFamily: "Nunito_700Bold", color: "#fff" },
  stepText:        { flex: 1, fontSize: 13, fontFamily: "Nunito_400Regular", color: "#444", lineHeight: 18 },

  deEscCard:  { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  deEscText:  { flex: 1, fontSize: 13, fontFamily: "Nunito_400Regular", color: "#444", lineHeight: 19 },

  // Intensity
  intensityRow:  { flexDirection: "row", gap: 10, marginBottom: 6 },
  intensityBtn:  { flex: 1, aspectRatio: 1, borderRadius: 12, backgroundColor: "#F5F5F5", justifyContent: "center", alignItems: "center" },
  intensityNum:  { fontSize: 18, fontFamily: "Nunito_700Bold", color: "#999" },
  intensityLabel:{ fontSize: 13, fontFamily: "Nunito_600SemiBold", marginBottom: 4 },

  // Body chips
  chipRow:       { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  chip:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: "#F5F5F5" },
  chipSelected:  { backgroundColor: "#EF5350" },
  chipText:      { fontSize: 12, fontFamily: "Nunito_600SemiBold", color: "#666" },
  chipTextSelected: { color: "#fff" },

  // Need pills
  needPill:     { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", marginRight: 8 },
  needPillText: { fontSize: 13, fontFamily: "Nunito_600SemiBold", color: "rgba(255,255,255,0.9)" },

  // Save button
  saveBtn:         { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  saveBtnGradient: { paddingVertical: 14, alignItems: "center" },
  saveBtnText:     { fontSize: 16, fontFamily: "Nunito_700Bold", color: "#fff" },

  // Log cards
  logCard:     { backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 14, padding: 14, marginBottom: 10 },
  logHeader:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  intensityDot:{ width: 10, height: 10, borderRadius: 5 },
  logDate:     { fontSize: 11, fontFamily: "Nunito_400Regular", color: "#888" },
  logTrigger:  { fontSize: 14, fontFamily: "Nunito_400Regular", color: "#333", lineHeight: 20, marginBottom: 4 },
  logNeed:     { fontSize: 12, fontFamily: "Nunito_600SemiBold", color: "#EF5350", marginBottom: 4 },
  logBody:     { fontSize: 11, fontFamily: "Nunito_400Regular", color: "#999" },

  // Needs tab
  needsQuote:      { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 14, padding: 16, marginBottom: 16 },
  needsQuoteText:  { fontSize: 15, fontFamily: "Nunito_400Regular", color: "#fff", textAlign: "center", lineHeight: 22, fontStyle: "italic" },
  needCard:        { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: "row", gap: 12, alignItems: "flex-start", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  needIcon:        { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  needTitle:       { fontSize: 15, fontFamily: "Nunito_700Bold", marginBottom: 3 },
  needDesc:        { fontSize: 12, fontFamily: "Nunito_400Regular", color: "#666", lineHeight: 17, flex: 1 },
  needExpanded:    { marginTop: 10, borderLeftWidth: 3, paddingLeft: 10 },
  needExpandedTitle: { fontSize: 12, fontFamily: "Nunito_700Bold", color: "#888", marginBottom: 4 },
  needExpandedText:  { fontSize: 13, fontFamily: "Nunito_400Regular", color: "#444", lineHeight: 19 },

  // Techniques tab
  techniqueBlock: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  techniqueBlockHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  techniqueBlockIcon:   { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },
  techniqueBlockTitle:  { fontSize: 15, fontFamily: "Nunito_700Bold" },
  bulletRow:   { flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 8 },
  bullet:      { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  bulletText:  { flex: 1, fontSize: 13, fontFamily: "Nunito_400Regular", color: "#444", lineHeight: 19 },
  scienceCard: { backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 16, padding: 16, marginBottom: 8 },
  scienceTitle:{ fontSize: 14, fontFamily: "Nunito_700Bold", color: "#333", marginBottom: 8 },
  scienceText: { fontSize: 13, fontFamily: "Nunito_400Regular", color: "#555", lineHeight: 20 },
});
