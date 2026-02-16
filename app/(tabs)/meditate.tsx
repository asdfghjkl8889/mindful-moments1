import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { storage } from "@/lib/storage";

const DURATIONS = [
  { minutes: 1, label: "1 min" },
  { minutes: 3, label: "3 min" },
  { minutes: 5, label: "5 min" },
  { minutes: 10, label: "10 min" },
  { minutes: 15, label: "15 min" },
  { minutes: 20, label: "20 min" },
];

export default function MeditateScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const breathScale = useSharedValue(1);
  const breathOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (isActive) {
      breathScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
      breathOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, {
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.2, {
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      );
    } else {
      breathScale.value = withTiming(1, { duration: 500 });
      breathOpacity.value = withTiming(0.3, { duration: 500 });
    }
  }, [isActive]);

  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
    opacity: breathOpacity.value,
  }));

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            setCompleted(true);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            }
            storage.addMeditation(selectedDuration, true);
            storage.updateStreak(selectedDuration);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft]);

  const startMeditation = () => {
    setTimeLeft(selectedDuration * 60);
    setIsActive(true);
    setCompleted(false);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const pauseMeditation = () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resumeMeditation = () => {
    setIsActive(true);
  };

  const resetMeditation = () => {
    setIsActive(false);
    setCompleted(false);
    setTimeLeft(selectedDuration * 60);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const progress =
    1 - timeLeft / (selectedDuration * 60);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const isTimerRunning = isActive || (timeLeft < selectedDuration * 60 && timeLeft > 0);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + webTopInset },
      ]}
    >
      <LinearGradient
        colors={
          isDark
            ? ["#1A1A2E", "#0A2E2A", "#1A1A2E"]
            : ["#FAFAF5", "#E0F2F1", "#E8F5E9"]
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Meditate</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isActive
            ? "Breathe in... Breathe out..."
            : completed
              ? "Well done! Namaste."
              : "Find your calm"}
        </Text>
      </View>

      <View style={styles.timerArea}>
        <Animated.View
          style={[
            styles.breathCircleOuter,
            breathStyle,
            {
              borderColor: colors.tint,
            },
          ]}
        />
        <View
          style={[
            styles.timerCircle,
            {
              backgroundColor: isDark
                ? "rgba(0,0,0,0.4)"
                : "rgba(255,255,255,0.8)",
              borderColor: colors.tint + "40",
            },
          ]}
        >
          {completed ? (
            <Animated.View
              entering={Platform.OS !== "web" ? FadeIn.duration(500) : undefined}
              style={styles.completedWrap}
            >
              <Ionicons name="checkmark-circle" size={48} color={colors.sage} />
              <Text
                style={[styles.completedText, { color: colors.text }]}
              >
                Complete
              </Text>
              <Text
                style={[styles.completedSub, { color: colors.textSecondary }]}
              >
                {selectedDuration} minutes
              </Text>
            </Animated.View>
          ) : (
            <>
              <Text style={[styles.timerText, { color: colors.text }]}>
                {formatTime(timeLeft)}
              </Text>
              {isTimerRunning && (
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: colors.tint,
                      },
                    ]}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </View>

      {!isTimerRunning && !completed && (
        <View style={styles.durationRow}>
          {DURATIONS.map((d) => (
            <Pressable
              key={d.minutes}
              onPress={() => {
                setSelectedDuration(d.minutes);
                setTimeLeft(d.minutes * 60);
                if (Platform.OS !== "web") {
                  Haptics.selectionAsync();
                }
              }}
              style={[
                styles.durationBtn,
                {
                  backgroundColor:
                    selectedDuration === d.minutes
                      ? colors.tint
                      : colors.card,
                  borderColor:
                    selectedDuration === d.minutes
                      ? colors.tint
                      : colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.durationText,
                  {
                    color:
                      selectedDuration === d.minutes ? "#fff" : colors.text,
                  },
                ]}
              >
                {d.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.controls}>
        {completed ? (
          <Pressable
            onPress={resetMeditation}
            style={({ pressed }) => [
              styles.mainBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.mainBtnText}>New Session</Text>
          </Pressable>
        ) : isActive ? (
          <Pressable
            onPress={pauseMeditation}
            style={({ pressed }) => [
              styles.mainBtn,
              {
                backgroundColor: colors.amber,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="pause" size={24} color="#fff" />
            <Text style={styles.mainBtnText}>Pause</Text>
          </Pressable>
        ) : isTimerRunning ? (
          <View style={styles.controlRow}>
            <Pressable
              onPress={resetMeditation}
              style={({ pressed }) => [
                styles.secondaryBtn,
                {
                  borderColor: colors.cardBorder,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={resumeMeditation}
              style={({ pressed }) => [
                styles.mainBtn,
                {
                  backgroundColor: colors.tint,
                  opacity: pressed ? 0.85 : 1,
                  flex: 1,
                },
              ]}
            >
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.mainBtnText}>Resume</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={startMeditation}
            style={({ pressed }) => [
              styles.mainBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.mainBtnText}>Begin</Text>
          </Pressable>
        )}
      </View>

      <View style={{ height: Platform.OS === "web" ? 34 : 0 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 28,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Nunito_500Medium",
    fontSize: 15,
  },
  timerArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  breathCircleOuter: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
  },
  timerText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 44,
  },
  progressBarBg: {
    width: 100,
    height: 4,
    backgroundColor: "rgba(128,128,128,0.2)",
    borderRadius: 2,
    marginTop: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  completedWrap: {
    alignItems: "center",
    gap: 4,
  },
  completedText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 20,
    marginTop: 8,
  },
  completedSub: {
    fontFamily: "Nunito_500Medium",
    fontSize: 14,
  },
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  durationBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  durationText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    width: "100%",
  },
  controlRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  mainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  mainBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 17,
    color: "#fff",
  },
  secondaryBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
