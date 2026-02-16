import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  useColorScheme,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { storage } from "@/lib/storage";

function BreathingGame({ colors, onBack }: { colors: any; onBack: () => void }) {
  const [phase, setPhase] = useState<"idle" | "inhale" | "hold" | "exhale">("idle");
  const [cycles, setCycles] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scale = useSharedValue(1);
  const circleOpacity = useSharedValue(0.3);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: circleOpacity.value,
  }));

  const startBreathing = () => {
    setIsActive(true);
    setCycles(0);
    runCycle();
  };

  const runCycle = () => {
    setPhase("inhale");
    scale.value = withTiming(1.4, { duration: 4000, easing: Easing.inOut(Easing.ease) });
    circleOpacity.value = withTiming(0.7, { duration: 4000 });

    timerRef.current = setTimeout(() => {
      setPhase("hold");
      timerRef.current = setTimeout(() => {
        setPhase("exhale");
        scale.value = withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) });
        circleOpacity.value = withTiming(0.3, { duration: 4000 });
        timerRef.current = setTimeout(() => {
          setCycles((prev) => {
            const next = prev + 1;
            if (next < 6) {
              runCycle();
            } else {
              setIsActive(false);
              setPhase("idle");
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              storage.addGameScore("breathing", next);
            }
            return next;
          });
        }, 4000);
      }, 4000);
    }, 4000);
  };

  const stopBreathing = () => {
    setIsActive(false);
    setPhase("idle");
    if (timerRef.current) clearTimeout(timerRef.current);
    scale.value = withTiming(1, { duration: 300 });
    circleOpacity.value = withTiming(0.3, { duration: 300 });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const phaseText = phase === "inhale" ? "Breathe In" : phase === "hold" ? "Hold" : phase === "exhale" ? "Breathe Out" : "Ready";

  return (
    <View style={styles.gameContainer}>
      <Text style={[styles.gameTitle, { color: colors.text }]}>Breathing Exercise</Text>
      <Text style={[styles.gameSub, { color: colors.textSecondary }]}>4-4-4 calming pattern</Text>

      <View style={styles.breathArea}>
        <Animated.View
          style={[styles.breathCircle, breatheStyle, { borderColor: colors.tint, backgroundColor: colors.tint + "15" }]}
        />
        <Text style={[styles.phaseText, { color: colors.text }]}>{phaseText}</Text>
        {isActive && (
          <Text style={[styles.cycleText, { color: colors.textSecondary }]}>Cycle {cycles + 1} of 6</Text>
        )}
      </View>

      <View style={styles.gameControls}>
        {!isActive ? (
          <Pressable
            onPress={startBreathing}
            style={({ pressed }) => [styles.gameBtn, { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.gameBtnText}>{cycles > 0 ? "Again" : "Start"}</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={stopBreathing}
            style={({ pressed }) => [styles.gameBtn, { backgroundColor: colors.amber, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="stop" size={20} color="#fff" />
            <Text style={styles.gameBtnText}>Stop</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const ICONS = ["leaf", "flower", "heart", "star", "moon", "sunny", "water", "diamond"];

function MemoryGame({ colors }: { colors: any }) {
  const [cards, setCards] = useState<{ id: number; icon: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const initGame = useCallback(() => {
    const selected = ICONS.slice(0, 6);
    const pairs = [...selected, ...selected];
    const shuffled = pairs
      .map((icon, i) => ({ id: i, icon, flipped: false, matched: false, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map((c, i) => ({ ...c, id: i }));
    setCards(shuffled);
    setFlippedIds([]);
    setMoves(0);
    setMatches(0);
    setGameOver(false);
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  const handleCardPress = (id: number) => {
    if (flippedIds.length >= 2) return;
    const card = cards[id];
    if (card.flipped || card.matched) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();

    const newCards = [...cards];
    newCards[id] = { ...newCards[id], flipped: true };
    setCards(newCards);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const [first, second] = newFlipped;
      if (newCards[first].icon === newCards[second].icon) {
        setTimeout(() => {
          const matched = [...newCards];
          matched[first] = { ...matched[first], matched: true };
          matched[second] = { ...matched[second], matched: true };
          setCards(matched);
          setFlippedIds([]);
          const newMatches = matches + 1;
          setMatches(newMatches);
          if (newMatches === 6) {
            setGameOver(true);
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            storage.addGameScore("memory", Math.max(0, 100 - (moves + 1 - 6) * 5));
          }
        }, 300);
      } else {
        setTimeout(() => {
          const reset = [...newCards];
          reset[first] = { ...reset[first], flipped: false };
          reset[second] = { ...reset[second], flipped: false };
          setCards(reset);
          setFlippedIds([]);
        }, 800);
      }
    }
  };

  return (
    <View style={styles.gameContainer}>
      <Text style={[styles.gameTitle, { color: colors.text }]}>Zen Memory</Text>
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreText, { color: colors.textSecondary }]}>Moves: {moves}</Text>
        <Text style={[styles.scoreText, { color: colors.textSecondary }]}>Matches: {matches}/6</Text>
      </View>

      <View style={styles.memoryGrid}>
        {cards.map((card) => (
          <Pressable
            key={card.id}
            onPress={() => handleCardPress(card.id)}
            style={[
              styles.memoryCard,
              {
                backgroundColor: card.flipped || card.matched ? card.matched ? colors.sage + "30" : colors.tint + "20" : colors.card,
                borderColor: card.matched ? colors.sage : colors.cardBorder,
              },
            ]}
          >
            {card.flipped || card.matched ? (
              <Ionicons name={card.icon as any} size={28} color={card.matched ? colors.sage : colors.tint} />
            ) : (
              <Ionicons name="help" size={28} color={colors.textTertiary} />
            )}
          </Pressable>
        ))}
      </View>

      {gameOver && (
        <View style={styles.gameOverWrap}>
          <Ionicons name="trophy" size={32} color={colors.amber} />
          <Text style={[styles.gameOverText, { color: colors.text }]}>Completed in {moves} moves!</Text>
          <Pressable
            onPress={initGame}
            style={({ pressed }) => [styles.gameBtn, { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1, marginTop: 8 }]}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.gameBtnText}>Play Again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function FocusTapGame({ colors }: { colors: any }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [gameOver, setGameOver] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenW = Dimensions.get("window").width;

  const moveTarget = () => {
    setTargetPos({
      x: 20 + Math.random() * (screenW - 120),
      y: 20 + Math.random() * 200,
    });
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsActive(true);
    setGameOver(false);
    moveTarget();
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            setGameOver(true);
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            storage.addGameScore("focus", score);
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

  const handleTap = () => {
    if (!isActive) return;
    setScore((prev) => prev + 1);
    moveTarget();
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.gameContainer}>
      <Text style={[styles.gameTitle, { color: colors.text }]}>Focus Tap</Text>
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreText, { color: colors.textSecondary }]}>Score: {score}</Text>
        <Text style={[styles.scoreText, { color: colors.textSecondary }]}>Time: {timeLeft}s</Text>
      </View>

      <View style={[styles.tapArea, { borderColor: colors.cardBorder }]}>
        {isActive && (
          <Pressable
            onPress={handleTap}
            style={[styles.target, { left: targetPos.x, top: targetPos.y, backgroundColor: colors.tint }]}
          >
            <Ionicons name="leaf" size={24} color="#fff" />
          </Pressable>
        )}
        {!isActive && !gameOver && (
          <Pressable
            onPress={startGame}
            style={({ pressed }) => [styles.gameBtn, { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.gameBtnText}>Start</Text>
          </Pressable>
        )}
        {gameOver && (
          <View style={styles.gameOverWrap}>
            <Ionicons name="trophy" size={32} color={colors.amber} />
            <Text style={[styles.gameOverText, { color: colors.text }]}>Score: {score}</Text>
            <Pressable
              onPress={startGame}
              style={({ pressed }) => [styles.gameBtn, { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1, marginTop: 8 }]}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.gameBtnText}>Play Again</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export default function GameScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + webTopInset },
      ]}
    >
      <LinearGradient
        colors={isDark ? ["#1A1A2E", "#0A2E2A"] : ["#FAFAF5", "#E0F2F1"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.navBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
      </View>

      {type === "breathing" && <BreathingGame colors={colors} onBack={() => router.back()} />}
      {type === "memory" && <MemoryGame colors={colors} />}
      {type === "focus" && <FocusTapGame colors={colors} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8,
  },
  navBtn: { padding: 8 },
  gameContainer: { flex: 1, alignItems: "center", paddingHorizontal: 20, paddingTop: 8 },
  gameTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 24, marginBottom: 4 },
  gameSub: { fontFamily: "Nunito_500Medium", fontSize: 14, marginBottom: 16 },
  scoreRow: { flexDirection: "row", gap: 20, marginBottom: 16 },
  scoreText: { fontFamily: "Nunito_600SemiBold", fontSize: 14 },
  breathArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  breathCircle: {
    width: 180, height: 180, borderRadius: 90, borderWidth: 2, position: "absolute",
  },
  phaseText: { fontFamily: "Nunito_800ExtraBold", fontSize: 22 },
  cycleText: { fontFamily: "Nunito_500Medium", fontSize: 14, marginTop: 8 },
  gameControls: { paddingBottom: 100, width: "100%" },
  gameBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14,
  },
  gameBtnText: { fontFamily: "Nunito_700Bold", fontSize: 15, color: "#fff" },
  memoryGrid: {
    flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 8,
  },
  memoryCard: {
    width: 72, height: 72, borderRadius: 14, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5,
  },
  tapArea: {
    flex: 1, width: "100%", borderRadius: 16, borderWidth: 1, marginBottom: 100,
    justifyContent: "center", alignItems: "center", overflow: "hidden",
  },
  target: {
    position: "absolute", width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center",
  },
  gameOverWrap: { alignItems: "center", gap: 8 },
  gameOverText: { fontFamily: "Nunito_700Bold", fontSize: 20, marginTop: 4 },
});
