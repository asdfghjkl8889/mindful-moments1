import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
  Platform,
  Modal,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { storage, EatingEntry, EATING_TIPS, getLarryMessage } from "@/lib/storage";

function TipCard({
  tip,
  colors,
  index,
}: {
  tip: (typeof EATING_TIPS)[0];
  colors: any;
  index: number;
}) {
  const bgColors = ["#E8F5E9", "#E0F2F1", "#FFF8E1", "#F3E5F5", "#E3F2FD", "#FBE9E7", "#F1F8E9", "#E8EAF6"];
  const bgColorsDark = ["#1B3B2A", "#0A2E2A", "#2A2520", "#2A1E3A", "#1A2A3A", "#2A1E1A", "#1E2A1A", "#1A1E3A"];

  return (
    <View
      style={[
        styles.tipCard,
        {
          backgroundColor: colors.background === "#1A1A2E" ? bgColorsDark[index % bgColorsDark.length] : bgColors[index % bgColors.length],
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={[styles.tipIconWrap, { backgroundColor: colors.tint + "20" }]}>
        <Ionicons name={tip.icon as any} size={22} color={colors.tint} />
      </View>
      <Text style={[styles.tipTitle, { color: colors.text }]}>{tip.title}</Text>
      <Text style={[styles.tipDesc, { color: colors.textSecondary }]}>{tip.description}</Text>
    </View>
  );
}

function EatingLogCard({
  entry,
  colors,
  onDelete,
}: {
  entry: EatingEntry;
  colors: any;
  onDelete: (id: string) => void;
}) {
  const dateStr = new Date(entry.timestamp).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Pressable
      onLongPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        Alert.alert("Delete Entry", "Remove this eating log?", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => onDelete(entry.id) },
        ]);
      }}
      style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      <View style={styles.logHeader}>
        <View style={styles.logMealRow}>
          <Ionicons name="restaurant" size={16} color={colors.tint} />
          <Text style={[styles.logMeal, { color: colors.text }]}>{entry.meal}</Text>
        </View>
        <Text style={[styles.logDate, { color: colors.textTertiary }]}>{dateStr}</Text>
      </View>
      <View style={styles.logMetrics}>
        <View style={styles.logMetric}>
          <Text style={[styles.logMetricLabel, { color: colors.textSecondary }]}>Hunger</Text>
          <View style={styles.logBarBg}>
            <View style={[styles.logBarFill, { width: `${entry.hunger * 10}%`, backgroundColor: "#FF8A65" }]} />
          </View>
          <Text style={[styles.logMetricValue, { color: colors.text }]}>{entry.hunger}/10</Text>
        </View>
        <View style={styles.logMetric}>
          <Text style={[styles.logMetricLabel, { color: colors.textSecondary }]}>Fullness</Text>
          <View style={styles.logBarBg}>
            <View style={[styles.logBarFill, { width: `${entry.fullness * 10}%`, backgroundColor: colors.sage }]} />
          </View>
          <Text style={[styles.logMetricValue, { color: colors.text }]}>{entry.fullness}/10</Text>
        </View>
      </View>
      {entry.mindful && (
        <View style={styles.mindfulBadge}>
          <Ionicons name="checkmark-circle" size={14} color={colors.sage} />
          <Text style={[styles.mindfulText, { color: colors.sage }]}>Mindful meal</Text>
        </View>
      )}
      {entry.notes ? (
        <Text style={[styles.logNotes, { color: colors.textSecondary }]} numberOfLines={2}>
          {entry.notes}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function EatingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [eatingLog, setEatingLog] = useState<EatingEntry[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [meal, setMeal] = useState("");
  const [hunger, setHunger] = useState(5);
  const [fullness, setFullness] = useState(5);
  const [mindful, setMindful] = useState(false);
  const [notes, setNotes] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const data = await storage.getEatingLog();
    setEatingLog(data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSave = async () => {
    if (!meal.trim()) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await storage.addEatingEntry(meal.trim(), hunger, fullness, mindful, notes.trim());
    setMeal("");
    setHunger(5);
    setFullness(5);
    setMindful(false);
    setNotes("");
    setShowCompose(false);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    await storage.deleteEatingEntry(id);
    await loadData();
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 16 }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Mindful Eating</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Eat with awareness
          </Text>
        </View>
        <View style={styles.headerBtns}>
          <Pressable
            onPress={() => setShowTips(!showTips)}
            style={({ pressed }) => [
              styles.tipToggle,
              {
                backgroundColor: showTips ? colors.tint + "20" : colors.card,
                borderColor: showTips ? colors.tint : colors.cardBorder,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="bulb" size={18} color={showTips ? colors.tint : colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => setShowCompose(true)}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {showTips && (
          <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
            <View style={styles.larryBanner}>
              <LinearGradient
                colors={isDark ? ["#1B3B2A", "#0A2E2A"] : ["#E8F5E9", "#E0F2F1"]}
                style={styles.larryBannerGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.larryBannerRow}>
                  <View style={styles.larryBannerAvatar}>
                    <MaterialCommunityIcons name="turtle" size={28} color={colors.sage} />
                  </View>
                  <View style={styles.larryBannerText}>
                    <Text style={[styles.larryBannerName, { color: colors.sage }]}>
                      Larry says...
                    </Text>
                    <Text style={[styles.larryBannerMsg, { color: colors.textSecondary }]}>
                      Eating mindfully means savoring every bite. Take it slow, just like me!
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tips for Mindful Eating</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tipsRow}
            >
              {EATING_TIPS.map((tip, index) => (
                <TipCard key={tip.title} tip={tip} colors={colors} index={index} />
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Eating Log</Text>
        {eatingLog.length === 0 ? (
          <View style={styles.emptyLog}>
            <Ionicons name="restaurant-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No meals logged yet. Track your mindful eating journey!
            </Text>
          </View>
        ) : (
          <View style={styles.logList}>
            {eatingLog.map((entry, index) => (
              <Animated.View
                key={entry.id}
                entering={Platform.OS !== "web" ? FadeInDown.delay(index * 60).duration(400) : undefined}
              >
                <EatingLogCard entry={entry} colors={colors} onDelete={handleDelete} />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={showCompose} animationType="slide" transparent onRequestClose={() => setShowCompose(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowCompose(false)} />
          <Animated.View
            entering={Platform.OS !== "web" ? FadeIn.duration(300) : undefined}
            style={[styles.composeSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.composeHeader}>
              <Pressable onPress={() => setShowCompose(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <Text style={[styles.composeTitle, { color: colors.text }]}>Log Meal</Text>
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.composeContent}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>What did you eat?</Text>
              <TextInput
                value={meal}
                onChangeText={setMeal}
                placeholder="e.g., Grilled chicken salad"
                placeholderTextColor={colors.textTertiary}
                style={[styles.inputField, { color: colors.text, backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              />

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 20 }]}>
                Hunger Level (before eating): {hunger}/10
              </Text>
              <View style={styles.sliderRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <Pressable
                    key={`h${n}`}
                    onPress={() => { setHunger(n); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    style={[
                      styles.sliderDot,
                      {
                        backgroundColor: n <= hunger ? "#FF8A65" : colors.cardBorder,
                      },
                    ]}
                  />
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 20 }]}>
                Fullness Level (after eating): {fullness}/10
              </Text>
              <View style={styles.sliderRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <Pressable
                    key={`f${n}`}
                    onPress={() => { setFullness(n); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                    style={[
                      styles.sliderDot,
                      {
                        backgroundColor: n <= fullness ? Colors.light.sage : colors.cardBorder,
                      },
                    ]}
                  />
                ))}
              </View>

              <Pressable
                onPress={() => {
                  setMindful(!mindful);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
                style={[styles.mindfulToggle, { borderColor: colors.cardBorder, backgroundColor: mindful ? colors.tint + "15" : colors.card }]}
              >
                <Ionicons name={mindful ? "checkmark-circle" : "ellipse-outline"} size={22} color={mindful ? colors.tint : colors.textTertiary} />
                <Text style={[styles.mindfulToggleText, { color: colors.text }]}>
                  I ate this meal mindfully
                </Text>
              </Pressable>

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 20 }]}>Notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="How did you feel during/after eating?"
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
                style={[styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 28 },
  subtitle: { fontFamily: "Nunito_500Medium", fontSize: 14, marginTop: 2 },
  headerBtns: { flexDirection: "row", gap: 8 },
  tipToggle: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  addBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  larryBanner: { marginHorizontal: 20, marginBottom: 8 },
  larryBannerGrad: { borderRadius: 16, padding: 16 },
  larryBannerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  larryBannerAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(123,174,127,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  larryBannerText: { flex: 1 },
  larryBannerName: { fontFamily: "Nunito_700Bold", fontSize: 14, marginBottom: 2 },
  larryBannerMsg: { fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 18 },
  sectionTitle: {
    fontFamily: "Nunito_700Bold", fontSize: 18, marginHorizontal: 20, marginTop: 20, marginBottom: 12,
  },
  tipsRow: { paddingHorizontal: 20, gap: 12 },
  tipCard: {
    width: 160, borderRadius: 16, padding: 16, borderWidth: 1, gap: 8,
  },
  tipIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tipTitle: { fontFamily: "Nunito_700Bold", fontSize: 15 },
  tipDesc: { fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 17 },
  emptyLog: { alignItems: "center", paddingHorizontal: 40, paddingVertical: 40, gap: 12 },
  emptyText: { fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center" },
  logList: { paddingHorizontal: 20, gap: 12 },
  logCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  logHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logMealRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logMeal: { fontFamily: "Nunito_700Bold", fontSize: 16 },
  logDate: { fontFamily: "Nunito_400Regular", fontSize: 11 },
  logMetrics: { gap: 8 },
  logMetric: { flexDirection: "row", alignItems: "center", gap: 8 },
  logMetricLabel: { fontFamily: "Nunito_500Medium", fontSize: 12, width: 55 },
  logBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(128,128,128,0.15)", overflow: "hidden" },
  logBarFill: { height: "100%", borderRadius: 3 },
  logMetricValue: { fontFamily: "Nunito_600SemiBold", fontSize: 12, width: 32 },
  mindfulBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  mindfulText: { fontFamily: "Nunito_500Medium", fontSize: 12 },
  logNotes: { fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 18 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  composeSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%" },
  composeHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
  },
  composeTitle: { fontFamily: "Nunito_700Bold", fontSize: 18 },
  saveBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  composeContent: { paddingHorizontal: 20, paddingBottom: 20 },
  fieldLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 15, marginBottom: 10 },
  inputField: {
    fontFamily: "Nunito_400Regular", fontSize: 15, paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1,
  },
  sliderRow: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  sliderDot: { flex: 1, height: 12, borderRadius: 6 },
  mindfulToggle: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20,
    paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  mindfulToggleText: { fontFamily: "Nunito_500Medium", fontSize: 15 },
  textArea: {
    fontFamily: "Nunito_400Regular", fontSize: 15, lineHeight: 22,
    borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 80,
  },
});
