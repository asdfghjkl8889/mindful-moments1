import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ThoughtRecord {
  id: string;
  negativeThought: string;
  intensity: number;
  evidenceFor: string;
  evidenceAgainst: string;
  balancedThought: string;
  newIntensity: number;
  timestamp: number;
}

const DISTORTIONS = [
  { id: "all_or_nothing", label: "All-or-Nothing", desc: "Seeing things in black and white", icon: "remove-circle" },
  { id: "catastrophizing", label: "Catastrophizing", desc: "Expecting the worst outcome", icon: "thunderstorm" },
  { id: "mind_reading", label: "Mind Reading", desc: "Assuming what others think", icon: "eye-off" },
  { id: "emotional_reason", label: "Emotional Reasoning", desc: "Feelings = facts", icon: "heart-dislike" },
  { id: "should", label: "Should Statements", desc: "'I should/must/have to'", icon: "warning" },
  { id: "labeling", label: "Labeling", desc: "Defining yourself by failures", icon: "pricetag" },
  { id: "filtering", label: "Mental Filter", desc: "Focusing only on negatives", icon: "funnel" },
  { id: "personalization", label: "Personalization", desc: "Blaming yourself for everything", icon: "person" },
];

const REFRAME_TIPS = [
  { q: "Is this thought based on facts or feelings?", icon: "search" },
  { q: "What would I tell a close friend thinking this?", icon: "chatbubble-ellipses" },
  { q: "Is there another way to view this situation?", icon: "refresh-circle" },
  { q: "Will this matter in 5 years?", icon: "time" },
  { q: "What's the best, worst, and most realistic outcome?", icon: "stats-chart" },
  { q: "Am I assuming the worst without evidence?", icon: "help-circle" },
];

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const STORAGE_KEY = "mindful_thought_records";

async function getRecords(): Promise<ThoughtRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveRecord(record: ThoughtRecord): Promise<void> {
  const records = await getRecords();
  records.unshift(record);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

async function deleteRecord(id: string): Promise<void> {
  const records = await getRecords();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records.filter((r) => r.id !== id)));
}

type Step = "start" | "record" | "history";

export default function NegativeThoughtsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [step, setStep] = useState<Step>("start");
  const [negativeThought, setNegativeThought] = useState("");
  const [intensity, setIntensity] = useState(7);
  const [evidenceFor, setEvidenceFor] = useState("");
  const [evidenceAgainst, setEvidenceAgainst] = useState("");
  const [balancedThought, setBalancedThought] = useState("");
  const [newIntensity, setNewIntensity] = useState(5);
  const [selectedDistortion, setSelectedDistortion] = useState<string | null>(null);
  const [records, setRecords] = useState<ThoughtRecord[]>([]);
  const [formStep, setFormStep] = useState(1);
  const [saved, setSaved] = useState(false);

  const loadRecords = useCallback(async () => {
    const r = await getRecords();
    setRecords(r);
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleSave = async () => {
    if (!negativeThought.trim() || !balancedThought.trim()) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const record: ThoughtRecord = {
      id: generateId(),
      negativeThought: negativeThought.trim(),
      intensity,
      evidenceFor: evidenceFor.trim(),
      evidenceAgainst: evidenceAgainst.trim(),
      balancedThought: balancedThought.trim(),
      newIntensity,
      timestamp: Date.now(),
    };
    await saveRecord(record);
    setSaved(true);
    await loadRecords();
    setTimeout(() => {
      setSaved(false);
      setStep("start");
      setNegativeThought("");
      setIntensity(7);
      setEvidenceFor("");
      setEvidenceAgainst("");
      setBalancedThought("");
      setNewIntensity(5);
      setSelectedDistortion(null);
      setFormStep(1);
    }, 2000);
  };

  const handleDeleteRecord = (id: string) => {
    Alert.alert("Delete Record", "Remove this thought record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          await deleteRecord(id);
          await loadRecords();
        }
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Challenge Thoughts</Text>
        <Pressable onPress={() => setStep(step === "history" ? "start" : "history")} hitSlop={12}>
          <Ionicons name="time-outline" size={24} color={colors.tint} />
        </Pressable>
      </View>

      {step === "start" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32 }}
        >
          <LinearGradient colors={["#FCE4EC", "#F3E5F5", "#FFFFFF"]} style={styles.heroBanner}>
            <Text style={styles.heroEmoji}>🧠</Text>
            <Text style={styles.heroTitle}>Reframe Your Thoughts</Text>
            <Text style={styles.heroDesc}>
              Our thoughts shape how we feel. Learn to identify cognitive distortions and replace them with balanced, realistic perspectives.
            </Text>
            <Pressable
              onPress={() => setStep("record")}
              style={({ pressed }) => [styles.startBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="pencil" size={18} color="#fff" />
              <Text style={styles.startBtnText}>Start Thought Record</Text>
            </Pressable>
          </LinearGradient>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Common Thought Traps</Text>
          <View style={styles.distortionsGrid}>
            {DISTORTIONS.map((d) => (
              <Animated.View
                key={d.id}
                entering={Platform.OS !== "web" ? FadeInDown.delay(50).duration(400) : undefined}
                style={[styles.distortionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <Ionicons name={d.icon as any} size={20} color="#FF8A80" />
                <Text style={[styles.distortionLabel, { color: colors.text }]}>{d.label}</Text>
                <Text style={[styles.distortionDesc, { color: colors.textSecondary }]}>{d.desc}</Text>
              </Animated.View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Questions to Ask Yourself</Text>
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {REFRAME_TIPS.map((tip, i) => (
              <View key={i} style={[styles.tipRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Ionicons name={tip.icon as any} size={18} color={colors.tint} />
                <Text style={[styles.tipText, { color: colors.text }]}>{tip.q}</Text>
              </View>
            ))}
          </View>

          {records.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Records</Text>
              <View style={{ paddingHorizontal: 20, gap: 10 }}>
                {records.slice(0, 3).map((r) => (
                  <Pressable
                    key={r.id}
                    onLongPress={() => handleDeleteRecord(r.id)}
                    style={[styles.recordCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  >
                    <View style={styles.recordHeader}>
                      <Text style={[styles.recordThought, { color: colors.text }]} numberOfLines={2}>{r.negativeThought}</Text>
                      <View style={styles.intensityChange}>
                        <Text style={[styles.intensityNum, { color: "#FF8A80" }]}>{r.intensity}</Text>
                        <Ionicons name="arrow-forward" size={12} color={colors.textTertiary} />
                        <Text style={[styles.intensityNum, { color: "#66BB6A" }]}>{r.newIntensity}</Text>
                      </View>
                    </View>
                    <Text style={[styles.recordBalanced, { color: colors.textSecondary }]} numberOfLines={2}>
                      → {r.balancedThought}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {step === "record" && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32, paddingHorizontal: 20 }}
          >
            <View style={styles.stepIndicator}>
              {[1, 2, 3].map((s) => (
                <View key={s} style={[styles.stepDot, { backgroundColor: formStep >= s ? "#FF8A80" : colors.cardBorder }]} />
              ))}
              <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>Step {formStep} of 3</Text>
            </View>

            {formStep === 1 && (
              <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
                <Text style={[styles.formSection, { color: colors.text }]}>The Negative Thought</Text>
                <Text style={[styles.formHint, { color: colors.textSecondary }]}>
                  Write the exact thought, as if you were speaking it in your head.
                </Text>
                <TextInput
                  value={negativeThought}
                  onChangeText={setNegativeThought}
                  placeholder="e.g., 'I always mess everything up'"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  textAlignVertical="top"
                  style={[styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                />

                <Text style={[styles.formSection, { color: colors.text, marginTop: 20 }]}>
                  How strong is this feeling? {intensity}/10
                </Text>
                <View style={styles.sliderRow}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => { setIntensity(n); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                      style={[styles.sliderDot, { backgroundColor: n <= intensity ? "#FF8A80" : colors.cardBorder }]}
                    />
                  ))}
                </View>

                <Text style={[styles.formSection, { color: colors.text, marginTop: 20 }]}>
                  Which thought trap is this? (optional)
                </Text>
                <View style={styles.distortionPicker}>
                  {DISTORTIONS.map((d) => (
                    <Pressable
                      key={d.id}
                      onPress={() => setSelectedDistortion(selectedDistortion === d.id ? null : d.id)}
                      style={[
                        styles.distortionPill,
                        { borderColor: selectedDistortion === d.id ? "#FF8A80" : colors.cardBorder, backgroundColor: selectedDistortion === d.id ? "#FCE4EC" : colors.card },
                      ]}
                    >
                      <Text style={[styles.distortionPillText, { color: selectedDistortion === d.id ? "#E91E63" : colors.text }]}>{d.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  onPress={() => negativeThought.trim() && setFormStep(2)}
                  style={[styles.nextBtn, { backgroundColor: negativeThought.trim() ? "#FF8A80" : colors.cardBorder }]}
                >
                  <Text style={[styles.nextBtnText, { color: negativeThought.trim() ? "#fff" : colors.textTertiary }]}>Next →</Text>
                </Pressable>
              </Animated.View>
            )}

            {formStep === 2 && (
              <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
                <Text style={[styles.thoughtBubble, { backgroundColor: "#FCE4EC", color: "#C62828" }]}>
                  "{negativeThought}"
                </Text>

                <Text style={[styles.formSection, { color: colors.text }]}>Evidence FOR this thought</Text>
                <Text style={[styles.formHint, { color: colors.textSecondary }]}>
                  What facts support this thought? (Not feelings — actual evidence.)
                </Text>
                <TextInput
                  value={evidenceFor}
                  onChangeText={setEvidenceFor}
                  placeholder="e.g., I made an error at work last Tuesday"
                  placeholderTextColor={colors.textTertiary}
                  multiline textAlignVertical="top"
                  style={[styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                />

                <Text style={[styles.formSection, { color: colors.text, marginTop: 20 }]}>Evidence AGAINST this thought</Text>
                <Text style={[styles.formHint, { color: colors.textSecondary }]}>
                  What facts challenge this thought? Think of times the opposite was true.
                </Text>
                <TextInput
                  value={evidenceAgainst}
                  onChangeText={setEvidenceAgainst}
                  placeholder="e.g., I successfully completed the Johnson project, my manager praised me last month"
                  placeholderTextColor={colors.textTertiary}
                  multiline textAlignVertical="top"
                  style={[styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                />

                <View style={styles.navRow}>
                  <Pressable onPress={() => setFormStep(1)} style={[styles.backBtn, { borderColor: colors.cardBorder }]}>
                    <Text style={[styles.backBtnText, { color: colors.text }]}>← Back</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setFormStep(3)}
                    style={[styles.nextBtn, { flex: 1, backgroundColor: "#FF8A80" }]}
                  >
                    <Text style={[styles.nextBtnText, { color: "#fff" }]}>Next →</Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {formStep === 3 && (
              <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
                <Text style={[styles.formSection, { color: colors.text }]}>The Balanced Thought</Text>
                <Text style={[styles.formHint, { color: colors.textSecondary }]}>
                  Write a fair, realistic thought that takes the evidence into account. It doesn't have to be positive — just balanced.
                </Text>
                <TextInput
                  value={balancedThought}
                  onChangeText={setBalancedThought}
                  placeholder="e.g., 'I sometimes make mistakes, but I also have many successes. I'm learning and growing.'"
                  placeholderTextColor={colors.textTertiary}
                  multiline textAlignVertical="top"
                  style={[styles.textArea, { minHeight: 100, color: colors.text, backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                />

                <Text style={[styles.formSection, { color: colors.text, marginTop: 20 }]}>
                  How intense is the feeling now? {newIntensity}/10
                </Text>
                <View style={styles.sliderRow}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => { setNewIntensity(n); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                      style={[styles.sliderDot, { backgroundColor: n <= newIntensity ? "#66BB6A" : colors.cardBorder }]}
                    />
                  ))}
                </View>

                <View style={[styles.beforeAfter, { backgroundColor: "#E8F5E9" }]}>
                  <Text style={styles.beforeAfterLabel}>Your shift:</Text>
                  <Text style={styles.beforeAfterNums}>
                    {intensity} → {newIntensity}{" "}
                    {newIntensity < intensity ? "📉 Improving!" : newIntensity === intensity ? "🔄 Still processing" : "🔼 Keep practicing"}
                  </Text>
                </View>

                {saved ? (
                  <View style={styles.savedBanner}>
                    <Ionicons name="checkmark-circle" size={24} color="#66BB6A" />
                    <Text style={styles.savedText}>Thought record saved!</Text>
                  </View>
                ) : (
                  <View style={styles.navRow}>
                    <Pressable onPress={() => setFormStep(2)} style={[styles.backBtn, { borderColor: colors.cardBorder }]}>
                      <Text style={[styles.backBtnText, { color: colors.text }]}>← Back</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleSave}
                      style={[styles.nextBtn, { flex: 1, backgroundColor: "#66BB6A" }]}
                    >
                      <Text style={[styles.nextBtnText, { color: "#fff" }]}>Save Record ✓</Text>
                    </Pressable>
                  </View>
                )}
              </Animated.View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {step === "history" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32, paddingHorizontal: 20 }}
        >
          <Text style={[styles.sectionTitle, { color: colors.text, marginHorizontal: 0, marginTop: 12 }]}>Your Thought Records</Text>
          {records.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>📝</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No records yet. Start your first thought record!</Text>
              <Pressable onPress={() => setStep("record")} style={[styles.startBtn, { marginTop: 8 }]}>
                <Text style={styles.startBtnText}>Start Now</Text>
              </Pressable>
            </View>
          ) : (
            records.map((r) => (
              <Pressable
                key={r.id}
                onLongPress={() => handleDeleteRecord(r.id)}
                style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <View style={styles.recordHeader}>
                  <Text style={[styles.historyDate, { color: colors.textTertiary }]}>
                    {new Date(r.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Text>
                  <View style={styles.intensityChange}>
                    <Text style={[styles.intensityNum, { color: "#FF8A80" }]}>{r.intensity}</Text>
                    <Ionicons name="arrow-forward" size={12} color={colors.textTertiary} />
                    <Text style={[styles.intensityNum, { color: "#66BB6A" }]}>{r.newIntensity}</Text>
                  </View>
                </View>
                <Text style={[styles.recordThought, { color: colors.text }]} numberOfLines={2}>{r.negativeThought}</Text>
                <Text style={[styles.recordBalanced, { color: colors.textSecondary }]} numberOfLines={2}>→ {r.balancedThought}</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  headerTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 20 },
  heroBanner: { marginHorizontal: 20, marginTop: 4, borderRadius: 20, padding: 24, alignItems: "center", gap: 8 },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 22, color: "#B71C1C", textAlign: "center" },
  heroDesc: { fontFamily: "Nunito_400Regular", fontSize: 13, color: "#616161", textAlign: "center", lineHeight: 19 },
  startBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FF8A80", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, marginTop: 8,
  },
  startBtnText: { fontFamily: "Nunito_700Bold", fontSize: 15, color: "#fff" },
  sectionTitle: {
    fontFamily: "Nunito_700Bold", fontSize: 17, marginHorizontal: 20, marginTop: 20, marginBottom: 12,
  },
  distortionsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 10 },
  distortionCard: {
    width: "46%", borderRadius: 14, padding: 12, borderWidth: 1, gap: 4,
  },
  distortionLabel: { fontFamily: "Nunito_700Bold", fontSize: 12 },
  distortionDesc: { fontFamily: "Nunito_400Regular", fontSize: 11, lineHeight: 14 },
  tipRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 12, padding: 14, borderWidth: 1,
  },
  tipText: { fontFamily: "Nunito_500Medium", fontSize: 13, flex: 1, lineHeight: 18 },
  recordCard: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 6 },
  recordHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  recordThought: { fontFamily: "Nunito_600SemiBold", fontSize: 14, lineHeight: 19 },
  recordBalanced: { fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 16 },
  intensityChange: { flexDirection: "row", alignItems: "center", gap: 4 },
  intensityNum: { fontFamily: "Nunito_700Bold", fontSize: 14 },
  stepIndicator: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 16 },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepLabel: { fontFamily: "Nunito_500Medium", fontSize: 12, marginLeft: 4 },
  formSection: { fontFamily: "Nunito_700Bold", fontSize: 16, marginBottom: 6 },
  formHint: { fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 17, marginBottom: 10 },
  textArea: {
    fontFamily: "Nunito_400Regular", fontSize: 14, lineHeight: 20,
    borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 80,
  },
  sliderRow: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  sliderDot: { flex: 1, height: 12, borderRadius: 6 },
  distortionPicker: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  distortionPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5,
  },
  distortionPillText: { fontFamily: "Nunito_600SemiBold", fontSize: 12 },
  nextBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center", marginTop: 20,
  },
  nextBtnText: { fontFamily: "Nunito_700Bold", fontSize: 16 },
  navRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  backBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  backBtnText: { fontFamily: "Nunito_600SemiBold", fontSize: 14 },
  thoughtBubble: {
    borderRadius: 14, padding: 16, fontFamily: "Nunito_600SemiBold", fontSize: 15,
    fontStyle: "italic", lineHeight: 21, marginBottom: 20,
  },
  beforeAfter: {
    borderRadius: 12, padding: 14, alignItems: "center", gap: 4, marginTop: 12,
  },
  beforeAfterLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: "#388E3C" },
  beforeAfterNums: { fontFamily: "Nunito_800ExtraBold", fontSize: 20, color: "#2E7D32" },
  savedBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20, padding: 16,
    backgroundColor: "#E8F5E9", borderRadius: 14,
  },
  savedText: { fontFamily: "Nunito_700Bold", fontSize: 16, color: "#388E3C" },
  historyCard: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 8, marginBottom: 10 },
  historyDate: { fontFamily: "Nunito_400Regular", fontSize: 11 },
  emptyState: { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyText: { fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
});
