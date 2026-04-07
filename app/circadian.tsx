import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";
import { storage } from "@/lib/storage";

const SCREEN_W = Dimensions.get("window").width;
const GRAPH_W = SCREEN_W - 48;
const GRAPH_H = 150;
const START_HOUR = 4;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const CIRCADIAN_KEY = "mindful_circadian_log";

const CORTISOL_POINTS = [
  { hour: 4,    val: 0.08 },
  { hour: 5,    val: 0.20 },
  { hour: 5.5,  val: 0.42 },
  { hour: 6,    val: 0.65 },
  { hour: 6.5,  val: 0.84 },
  { hour: 7,    val: 0.94 },
  { hour: 7.5,  val: 1.00 },
  { hour: 8,    val: 0.97 },
  { hour: 9,    val: 0.86 },
  { hour: 10,   val: 0.74 },
  { hour: 11,   val: 0.66 },
  { hour: 12,   val: 0.58 },
  { hour: 13,   val: 0.49 },
  { hour: 13.5, val: 0.43 },
  { hour: 14,   val: 0.40 },
  { hour: 14.5, val: 0.44 },
  { hour: 15,   val: 0.52 },
  { hour: 15.5, val: 0.57 },
  { hour: 16,   val: 0.58 },
  { hour: 16.5, val: 0.52 },
  { hour: 17,   val: 0.45 },
  { hour: 17.5, val: 0.38 },
  { hour: 18,   val: 0.32 },
  { hour: 18.5, val: 0.26 },
  { hour: 19,   val: 0.22 },
  { hour: 20,   val: 0.18 },
  { hour: 21,   val: 0.14 },
  { hour: 22,   val: 0.11 },
  { hour: 23,   val: 0.09 },
  { hour: 24,   val: 0.07 },
];

interface MeditationWindow {
  id: string;
  title: string;
  timeRange: string;
  startHour: number;
  endHour: number;
  color: string;
  lightColor: string;
  darkBg: string;
  icon: keyof typeof Ionicons.glyphMap;
  why: string;
  xp: number;
}

const WINDOWS: MeditationWindow[] = [
  {
    id: "dawn",
    title: "Dawn Rise",
    timeRange: "5:30 – 7:30am",
    startHour: 5.5,
    endHour: 7.5,
    color: "#E65100",
    lightColor: "#FFF3E0",
    darkBg: "#2D1A00",
    icon: "sunny",
    why: "Cortisol surges 50-100% within 30 minutes of waking — the Cortisol Awakening Response. Meditating here anchors your nervous system before the spike peaks, setting a calm foundation that carries through the morning.",
    xp: 20,
  },
  {
    id: "midday",
    title: "Midday Reset",
    timeRange: "12:00 – 1:30pm",
    startHour: 12.0,
    endHour: 13.5,
    color: "#0277BD",
    lightColor: "#E1F5FE",
    darkBg: "#001B2D",
    icon: "partly-sunny",
    why: "After the morning cortisol peak, levels dip around noon. A short meditation at this natural pause prevents afternoon stress from accumulating and recharges focus for the second half of the day.",
    xp: 15,
  },
  {
    id: "afternoon",
    title: "Afternoon Lift",
    timeRange: "2:30 – 4:30pm",
    startHour: 14.5,
    endHour: 16.5,
    color: "#00695C",
    lightColor: "#E0F7FA",
    darkBg: "#001A17",
    icon: "leaf",
    why: "The post-lunch cortisol trough (2-3pm) is when focus and willpower dip lowest. Meditation here creates a micro-recovery, preventing the stress rebound that typically spikes cortisol again in the late afternoon.",
    xp: 15,
  },
  {
    id: "sunset",
    title: "Sunset Unwind",
    timeRange: "5:30 – 7:30pm",
    startHour: 17.5,
    endHour: 19.5,
    color: "#AD1457",
    lightColor: "#FCE4EC",
    darkBg: "#2D0015",
    icon: "sunset",
    why: "As light fades, cortisol transitions toward melatonin production. Meditating at this boundary helps your body shift from alert to recovery mode — a crucial reset for accumulated daily stress.",
    xp: 20,
  },
  {
    id: "evening",
    title: "Evening Wind-Down",
    timeRange: "8:30 – 10:00pm",
    startHour: 20.5,
    endHour: 22.0,
    color: "#4527A0",
    lightColor: "#EDE7F6",
    darkBg: "#150A2D",
    icon: "moon",
    why: "At the lowest cortisol point of your 24-hour cycle, the nervous system is primed for deep relaxation. Meditation here activates the parasympathetic response, lowers core body temperature, and directly improves sleep quality.",
    xp: 25,
  },
];

function toX(hour: number): number {
  return ((hour - START_HOUR) / TOTAL_HOURS) * GRAPH_W;
}

function toY(val: number): number {
  return (1 - val) * GRAPH_H;
}

function interpolateVal(hour: number): number {
  for (let i = 0; i < CORTISOL_POINTS.length - 1; i++) {
    const a = CORTISOL_POINTS[i];
    const b = CORTISOL_POINTS[i + 1];
    if (a.hour <= hour && b.hour >= hour) {
      const t = (hour - a.hour) / (b.hour - a.hour);
      return a.val + t * (b.val - a.val);
    }
  }
  return 0.1;
}

function LineSegment({
  x1, y1, x2, y2, color, thickness = 2.5,
}: {
  x1: number; y1: number; x2: number; y2: number; color: string; thickness?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  return (
    <View
      style={{
        position: "absolute",
        left: midX - length / 2,
        top: midY - thickness / 2,
        width: length,
        height: thickness,
        backgroundColor: color,
        borderRadius: thickness / 2,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

function CortisolGraph({
  completedWindows,
  isDark,
}: {
  completedWindows: string[];
  isDark: boolean;
}) {
  const currentHour = new Date().getHours() + new Date().getMinutes() / 60;

  return (
    <View style={{ width: GRAPH_W, height: GRAPH_H + 22 }}>
      {WINDOWS.map((w) => {
        const x1 = toX(w.startHour);
        const x2 = toX(w.endHour);
        const done = completedWindows.includes(w.id);
        return (
          <View
            key={w.id}
            style={{
              position: "absolute",
              left: x1,
              top: 0,
              width: x2 - x1,
              height: GRAPH_H,
              backgroundColor: w.color,
              opacity: done ? 0.18 : 0.07,
              borderRadius: 4,
            }}
          />
        );
      })}

      {[0.25, 0.5, 0.75].map((frac) => (
        <View
          key={frac}
          style={{
            position: "absolute",
            left: 0,
            top: toY(frac),
            width: GRAPH_W,
            height: 1,
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
          }}
        />
      ))}

      {CORTISOL_POINTS.slice(0, -1).map((pt, i) => {
        const next = CORTISOL_POINTS[i + 1];
        const x1 = toX(pt.hour);
        const y1 = toY(pt.val);
        const x2 = toX(next.hour);
        const y2 = toY(next.val);
        const avg = (pt.val + next.val) / 2;
        const r = Math.round(30 + avg * 170);
        const g = Math.round(165 - avg * 90);
        const b = Math.round(154 - avg * 110);
        return (
          <LineSegment
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            color={`rgb(${r},${g},${b})`}
            thickness={2.5}
          />
        );
      })}

      {currentHour >= START_HOUR && currentHour <= END_HOUR && (
        <View
          style={{
            position: "absolute",
            left: toX(currentHour) - 1,
            top: 0,
            width: 2,
            height: GRAPH_H,
            backgroundColor: "#FF5722",
            opacity: 0.85,
            borderRadius: 1,
          }}
        />
      )}

      {WINDOWS.map((w) => {
        const midHour = (w.startHour + w.endHour) / 2;
        const midX = toX(midHour);
        const val = interpolateVal(midHour);
        const dotY = toY(val);
        const done = completedWindows.includes(w.id);
        return (
          <View
            key={w.id}
            style={{
              position: "absolute",
              left: midX - 9,
              top: dotY - 9,
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: done ? w.color : (isDark ? "#2C2C2C" : "#E8E8E8"),
              borderWidth: 2,
              borderColor: done ? w.color : (isDark ? "#444" : "#BDBDBD"),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {done && <Ionicons name="checkmark" size={10} color="#fff" />}
          </View>
        );
      })}

      {[6, 9, 12, 15, 18, 21].map((h) => (
        <Text
          key={h}
          style={{
            position: "absolute",
            left: toX(h) - 12,
            top: GRAPH_H + 4,
            fontSize: 10,
            color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)",
            fontFamily: "Nunito_400Regular",
            width: 24,
            textAlign: "center",
          }}
        >
          {h > 12 ? `${h - 12}p` : h === 12 ? "12p" : `${h}a`}
        </Text>
      ))}
    </View>
  );
}

type WindowStatus = "done" | "open" | "upcoming" | "missed";

export default function CircadianScreen() {
  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const colors = isDark ? Colors.dark : Colors.light;

  const [completedWindows, setCompletedWindows] = useState<string[]>([]);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [streak, setStreak] = useState(0);
  const [justLogged, setJustLogged] = useState<string | null>(null);

  const dateStr = new Date().toISOString().split("T")[0];
  const currentHour = new Date().getHours() + new Date().getMinutes() / 60;

  const loadData = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CIRCADIAN_KEY);
      const log: Record<string, string[]> = raw ? JSON.parse(raw) : {};
      setCompletedWindows(log[dateStr] || []);

      let s = 0;
      const today = new Date();
      for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        if (log[key] && log[key].length > 0) {
          s++;
        } else if (i > 0) {
          break;
        }
      }
      setStreak(s);

      const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
      let xp = 0;
      for (const [k, wins] of Object.entries(log)) {
        if (new Date(k).getTime() >= weekAgo) {
          for (const wid of wins) {
            const w = WINDOWS.find((x) => x.id === wid);
            if (w) xp += w.xp;
          }
        }
      }
      setTotalXpEarned(xp);
    } catch {}
  }, [dateStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const markDone = useCallback(
    async (windowId: string) => {
      if (completedWindows.includes(windowId)) return;
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      const win = WINDOWS.find((w) => w.id === windowId)!;
      try {
        const raw = await AsyncStorage.getItem(CIRCADIAN_KEY);
        const log: Record<string, string[]> = raw ? JSON.parse(raw) : {};
        const todayList = log[dateStr] || [];
        todayList.push(windowId);
        log[dateStr] = todayList;
        await AsyncStorage.setItem(CIRCADIAN_KEY, JSON.stringify(log));

        const cd = await storage.getChallengeData();
        cd.xp += win.xp;
        await storage.saveChallengeData(cd);
      } catch {}

      setCompletedWindows((prev) => [...prev, windowId]);
      setJustLogged(windowId);
      setTimeout(() => setJustLogged(null), 2500);
      loadData();
    },
    [completedWindows, dateStr, loadData]
  );

  function getStatus(w: MeditationWindow): WindowStatus {
    if (completedWindows.includes(w.id)) return "done";
    if (currentHour >= w.startHour && currentHour <= w.endHour) return "open";
    if (currentHour < w.startHour) return "upcoming";
    return "missed";
  }

  const doneCount = completedWindows.length;
  const totalDayXp = completedWindows.reduce((acc, wid) => {
    const w = WINDOWS.find((x) => x.id === wid);
    return acc + (w ? w.xp : 0);
  }, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={
          isDark
            ? ["#1A237E", "#283593", "#1565C0"]
            : ["#E3F2FD", "#BBDEFB", "#90CAF9"]
        }
        style={{
          paddingTop:
            insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: 18,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={{ marginRight: 10 }}
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color={isDark ? "#fff" : "#0D47A1"}
            />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Nunito_800ExtraBold",
                fontSize: 22,
                color: isDark ? "#fff" : "#0D47A1",
              }}
            >
              Circadian Rhythm
            </Text>
            <Text
              style={{
                fontFamily: "Nunito_400Regular",
                fontSize: 12,
                color: isDark ? "rgba(255,255,255,0.65)" : "rgba(13,71,161,0.75)",
                marginTop: 1,
              }}
            >
              Meditate at your body's natural energy transitions
            </Text>
          </View>
          <View
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.14)"
                : "rgba(13,71,161,0.1)",
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 5,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Nunito_800ExtraBold",
                fontSize: 18,
                color: isDark ? "#82B1FF" : "#0D47A1",
              }}
            >
              {doneCount}/5
            </Text>
            <Text
              style={{
                fontFamily: "Nunito_500Medium",
                fontSize: 10,
                color: isDark ? "rgba(130,177,255,0.7)" : "rgba(13,71,161,0.6)",
              }}
            >
              today
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom:
            insets.bottom + (Platform.OS === "web" ? 34 : 20),
        }}
      >
        {/* Stats row */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            gap: 8,
            marginTop: 14,
          }}
        >
          {[
            { label: "STREAK", value: streak > 0 ? `${streak}` : "0", unit: streak === 1 ? "day" : "days", accent: "#FF5722" },
            { label: "XP TODAY", value: `+${totalDayXp}`, unit: "bonus xp", accent: "#FFB300" },
            { label: "THIS WEEK", value: `+${totalXpEarned}`, unit: "xp earned", accent: "#00897B" },
          ].map((s) => (
            <View
              key={s.label}
              style={{
                flex: 1,
                backgroundColor: isDark ? "#1C1C1C" : "#F5F5F5",
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 8,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Nunito_800ExtraBold",
                  fontSize: 22,
                  color: s.accent,
                }}
              >
                {s.value}
                {s.label === "STREAK" && streak > 0 ? " 🔥" : ""}
              </Text>
              <Text
                style={{
                  fontFamily: "Nunito_500Medium",
                  fontSize: 10,
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                  marginTop: 2,
                  textAlign: "center",
                }}
              >
                {s.unit}
              </Text>
            </View>
          ))}
        </View>

        {/* Graph card */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 14,
            backgroundColor: isDark ? "#161616" : "#FAFAFA",
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: isDark ? "#282828" : "#E8E8E8",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons
              name="analytics"
              size={15}
              color={isDark ? "#82B1FF" : "#1565C0"}
            />
            <Text
              style={{
                fontFamily: "Nunito_700Bold",
                fontSize: 13,
                color: isDark ? "#82B1FF" : "#1565C0",
                marginLeft: 5,
                flex: 1,
              }}
            >
              Daily Cortisol Curve
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <View
                style={{
                  width: 12,
                  height: 2,
                  backgroundColor: "#FF5722",
                  borderRadius: 1,
                }}
              />
              <Text
                style={{
                  fontFamily: "Nunito_400Regular",
                  fontSize: 10,
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)",
                }}
              >
                now
              </Text>
            </View>
          </View>

          <CortisolGraph completedWindows={completedWindows} isDark={isDark} />

          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}
          >
            {WINDOWS.map((w) => {
              const done = completedWindows.includes(w.id);
              return (
                <View
                  key={w.id}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: done
                        ? w.color
                        : isDark
                        ? "#3A3A3A"
                        : "#D0D0D0",
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: "Nunito_400Regular",
                      fontSize: 10,
                      color: done
                        ? w.color
                        : isDark
                        ? "rgba(255,255,255,0.35)"
                        : "rgba(0,0,0,0.3)",
                    }}
                  >
                    {w.title}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Window cards */}
        <Text
          style={{
            fontFamily: "Nunito_700Bold",
            fontSize: 16,
            marginHorizontal: 20,
            marginTop: 20,
            marginBottom: 10,
            color: colors.text,
          }}
        >
          Today's Meditation Windows
        </Text>

        {WINDOWS.map((w, i) => {
          const status = getStatus(w);
          const isDone = status === "done";
          const isOpen = status === "open";
          const isMissed = status === "missed";
          const wasJustLogged = justLogged === w.id;

          const borderColor = isDone
            ? w.color
            : isOpen
            ? w.color
            : isDark
            ? "#282828"
            : "#E8E8E8";

          const bgColor = isDone
            ? isDark
              ? w.darkBg
              : w.lightColor
            : isOpen
            ? isDark
              ? `${w.darkBg}CC`
              : `${w.lightColor}BB`
            : isDark
            ? "#161616"
            : "#FAFAFA";

          const textOpacity = isMissed && !isDone ? 0.35 : 1;

          return (
            <Animated.View
              key={w.id}
              entering={
                Platform.OS !== "web"
                  ? FadeInDown.delay(i * 70).duration(380)
                  : undefined
              }
              style={{ marginHorizontal: 16, marginBottom: 10 }}
            >
              <View
                style={{
                  borderRadius: 18,
                  borderWidth: 1.5,
                  borderColor,
                  backgroundColor: bgColor,
                  overflow: "hidden",
                }}
              >
                {isOpen && (
                  <View
                    style={{
                      backgroundColor: w.color,
                      paddingHorizontal: 14,
                      paddingVertical: 4,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#fff",
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: "Nunito_700Bold",
                        fontSize: 11,
                        color: "#fff",
                        letterSpacing: 0.6,
                        flex: 1,
                      }}
                    >
                      OPEN NOW
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Nunito_700Bold",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.85)",
                      }}
                    >
                      +{w.xp} XP AVAILABLE
                    </Text>
                  </View>
                )}

                <View style={{ padding: 14 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor:
                          isDone || isOpen
                            ? w.color
                            : isDark
                            ? "#2A2A2A"
                            : "#EFEFEF",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name={isDone ? "checkmark-circle" : w.icon}
                        size={22}
                        color={
                          isDone || isOpen
                            ? "#fff"
                            : isDark
                            ? "#555"
                            : "#BDBDBD"
                        }
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: "Nunito_700Bold",
                          fontSize: 15,
                          color: colors.text,
                          opacity: textOpacity,
                        }}
                      >
                        {w.title}
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Nunito_500Medium",
                          fontSize: 12,
                          color: isDone || isOpen ? w.color : colors.text,
                          opacity: isDone || isOpen ? 1 : 0.45,
                          marginTop: 1,
                        }}
                      >
                        {w.timeRange}
                      </Text>
                    </View>

                    {isDone ? (
                      <View
                        style={{
                          backgroundColor: w.color,
                          borderRadius: 10,
                          paddingHorizontal: 9,
                          paddingVertical: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "Nunito_700Bold",
                            fontSize: 12,
                            color: "#fff",
                          }}
                        >
                          +{w.xp} XP ✓
                        </Text>
                      </View>
                    ) : !isMissed ? (
                      <Text
                        style={{
                          fontFamily: "Nunito_600SemiBold",
                          fontSize: 13,
                          color: isOpen ? w.color : isDark ? "#444" : "#C8C8C8",
                        }}
                      >
                        +{w.xp} XP
                      </Text>
                    ) : null}
                  </View>

                  <Text
                    style={{
                      fontFamily: "Nunito_400Regular",
                      fontSize: 13,
                      lineHeight: 19,
                      color: colors.text,
                      opacity: textOpacity * 0.7,
                      marginBottom: isDone ? 0 : 12,
                    }}
                  >
                    {w.why}
                  </Text>

                  {!isDone && (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable
                        onPress={() => {
                          if (Platform.OS !== "web") Haptics.selectionAsync();
                          router.push("/(tabs)/meditate");
                        }}
                        style={({ pressed }) => ({
                          flex: 1,
                          backgroundColor:
                            isOpen ? w.color : isDark ? "#252525" : "#F0F0F0",
                          borderRadius: 11,
                          paddingVertical: 10,
                          alignItems: "center",
                          opacity: pressed ? 0.8 : 1,
                        })}
                      >
                        <Text
                          style={{
                            fontFamily: "Nunito_700Bold",
                            fontSize: 13,
                            color:
                              isOpen ? "#fff" : isDark ? "#666" : "#888",
                          }}
                        >
                          Meditate Now
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => markDone(w.id)}
                        style={({ pressed }) => ({
                          flex: 1,
                          backgroundColor: isDark ? "#1A1A1A" : "#fff",
                          borderWidth: 1.5,
                          borderColor:
                            isOpen
                              ? w.color
                              : isDark
                              ? "#333"
                              : "#E0E0E0",
                          borderRadius: 11,
                          paddingVertical: 10,
                          alignItems: "center",
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text
                          style={{
                            fontFamily: "Nunito_700Bold",
                            fontSize: 13,
                            color: wasJustLogged
                              ? w.color
                              : isOpen
                              ? w.color
                              : isDark
                              ? "#555"
                              : "#AAAAAA",
                          }}
                        >
                          {wasJustLogged ? "Logged! ✓" : "I already meditated"}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          );
        })}

        {/* Science section */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 6,
            marginBottom: 6,
            backgroundColor: isDark ? "#0A1929" : "#E8F4FD",
            borderRadius: 18,
            padding: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: isDark ? "#1565C0" : "#1565C0",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Ionicons name="flask" size={17} color="#fff" />
            </View>
            <Text
              style={{
                fontFamily: "Nunito_700Bold",
                fontSize: 15,
                color: isDark ? "#82B1FF" : "#1565C0",
              }}
            >
              The Science Behind This
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "Nunito_400Regular",
              fontSize: 13,
              lineHeight: 21,
              color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.6)",
            }}
          >
            {"Cortisol is your body's primary stress and wakefulness hormone. It follows a predictable 24-hour pattern: a sharp surge after waking (the Cortisol Awakening Response), a gradual decline through the day with small fluctuations, and a low point overnight.\n\nMeditation reduces cortisol by activating the parasympathetic nervous system. Timing your practice at the natural peaks and troughs amplifies this effect — working with your biology, not against it. Over time, consistent circadian meditation lowers baseline cortisol, improves sleep architecture, and builds emotional resilience."}
          </Text>
        </View>

        {/* Progress footer */}
        {doneCount === 5 && (
          <Animated.View
            entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}
            style={{
              marginHorizontal: 16,
              marginTop: 8,
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={["#1B5E20", "#2E7D32", "#43A047"]}
              style={{ padding: 20, alignItems: "center" }}
            >
              <Text style={{ fontSize: 36, marginBottom: 6 }}>🌟</Text>
              <Text
                style={{
                  fontFamily: "Nunito_800ExtraBold",
                  fontSize: 18,
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                Perfect Rhythm Day!
              </Text>
              <Text
                style={{
                  fontFamily: "Nunito_400Regular",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.8)",
                  textAlign: "center",
                }}
              >
                All 5 windows completed. Your nervous system is thanking you.
              </Text>
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  marginTop: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Nunito_700Bold",
                    fontSize: 14,
                    color: "#fff",
                  }}
                >
                  +{totalDayXp} XP earned today
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
