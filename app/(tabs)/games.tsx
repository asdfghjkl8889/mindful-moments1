import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
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

type GameType = "breathing" | "memory" | "focus" | null;

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
            if (next >= 5) {
              setIsActive(false);
              setPhase("idle");
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              storage.addGameScore("breathing", next);
              return next;
            }
            return next;
          });
        }, 4000);
      }, 4000);
    }, 4000);
  };

  useEffect(() => {
    if (isActive && phase === "idle" && cycles > 0 && cycles < 5) {
      runCycle();
    }
  }, [cycles]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const phaseText = phase === "inhale" ? "Breathe In..." : phase === "hold" ? "Hold..." : phase === "exhale" ? "Breathe Out..." : cycles >= 5 ? "Well Done!" : "4-4-4 Breathing";
  const phaseSubText = phase === "idle" && cycles < 5 ? "Complete 5 breathing cycles" : phase === "idle" && cycles >= 5 ? `You completed ${cycles} cycles!` : `Cycle ${cycles + 1} of 5`;

  return (
    <View style={styles.gameScreen}>
      <View style={styles.gameHeader}>
        <Pressable onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.gameHeaderTitle, { color: colors.text }]}>Breathing Exercise</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.breathCenter}>
        <Animated.View
          style={[
            styles.breathCircle,
            breatheStyle,
            { borderColor: colors.tint, backgroundColor: colors.tint + "15" },
          ]}
        />
        <View style={styles.breathTextWrap}>
          <Text style={[styles.breathPhase, { color: colors.text }]}>{phaseText}</Text>
          <Text style={[styles.breathSub, { color: colors.textSecondary }]}>{phaseSubText}</Text>
        </View>
      </View>

      {!isActive && cycles < 5 && (
        <Pressable
          onPress={startBreathing}
          style={({ pressed }) => [
            styles.gameBtn,
            { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="play" size={22} color="#fff" />
          <Text style={styles.gameBtnText}>Start</Text>
        </Pressable>
      )}

      {cycles >= 5 && (
        <Pressable
          onPress={() => { setCycles(0); setPhase("idle"); }}
          style={({ pressed }) => [
            styles.gameBtn,
            { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="refresh" size={22} color="#fff" />
          <Text style={styles.gameBtnText}>Again</Text>
        </Pressable>
      )}
    </View>
  );
}

const MEMORY_ICONS = ["leaf", "flower", "sunny", "moon", "star", "heart", "water", "cloud"];

interface MemoryCard {
  id: number;
  icon: string;
  flipped: boolean;
  matched: boolean;
}

function MemoryGame({ colors, onBack }: { colors: any; onBack: () => void }) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const lockRef = useRef(false);

  const initGame = useCallback(() => {
    const icons = MEMORY_ICONS.slice(0, 6);
    const pairs = [...icons, ...icons];
    const shuffled = pairs.sort(() => Math.random() - 0.5);
    setCards(
      shuffled.map((icon, i) => ({ id: i, icon, flipped: false, matched: false })),
    );
    setFlippedIds([]);
    setMoves(0);
    setMatchedCount(0);
    lockRef.current = false;
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCardPress = (id: number) => {
    if (lockRef.current) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    if (Platform.OS !== "web") Haptics.selectionAsync();

    const newCards = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    setCards(newCards);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      lockRef.current = true;
      const [first, second] = newFlipped;
      const c1 = newCards.find((c) => c.id === first)!;
      const c2 = newCards.find((c) => c.id === second)!;

      if (c1.icon === c2.icon) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first || c.id === second ? { ...c, matched: true } : c,
            ),
          );
          setMatchedCount((m) => {
            const next = m + 1;
            if (next === 6) {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              storage.addGameScore("memory", moves + 1);
            }
            return next;
          });
          setFlippedIds([]);
          lockRef.current = false;
        }, 300);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first || c.id === second ? { ...c, flipped: false } : c,
            ),
          );
          setFlippedIds([]);
          lockRef.current = false;
        }, 800);
      }
    }
  };

  const won = matchedCount === 6;

  return (
    <View style={styles.gameScreen}>
      <View style={styles.gameHeader}>
        <Pressable onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.gameHeaderTitle, { color: colors.text }]}>Zen Memory</Text>
        <Text style={[styles.movesText, { color: colors.textSecondary }]}>{moves} moves</Text>
      </View>

      {won ? (
        <View style={styles.wonWrap}>
          <Ionicons name="trophy" size={48} color={colors.amber} />
          <Text style={[styles.wonText, { color: colors.text }]}>You won!</Text>
          <Text style={[styles.wonSub, { color: colors.textSecondary }]}>
            Completed in {moves} moves
          </Text>
          <Pressable
            onPress={initGame}
            style={({ pressed }) => [
              styles.gameBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1, marginTop: 16 },
            ]}
          >
            <Ionicons name="refresh" size={22} color="#fff" />
            <Text style={styles.gameBtnText}>Play Again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.memoryGrid}>
          {cards.map((card) => (
            <Pressable
              key={card.id}
              onPress={() => handleCardPress(card.id)}
              style={[
                styles.memoryCard,
                {
                  backgroundColor:
                    card.matched
                      ? colors.tint + "20"
                      : card.flipped
                        ? colors.card
                        : colors.tint + "10",
                  borderColor: card.matched
                    ? colors.tint
                    : card.flipped
                      ? colors.cardBorder
                      : colors.tint + "30",
                },
              ]}
            >
              {card.flipped || card.matched ? (
                <Ionicons name={card.icon as any} size={28} color={card.matched ? colors.tint : colors.text} />
              ) : (
                <Ionicons name="help" size={28} color={colors.tint + "50"} />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function FocusGame({ colors, onBack }: { colors: any; onBack: () => void }) {
  const [score, setScore] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetPos, setTargetPos] = useState({ x: 100, y: 200 });
  const [gameOver, setGameOver] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenW = Math.min(Dimensions.get("window").width - 40, 360);

  const moveTarget = () => {
    setTargetPos({
      x: Math.random() * (screenW - 60),
      y: Math.random() * 300 + 40,
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
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            setGameOver(true);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive]);

  useEffect(() => {
    if (gameOver && score > 0) {
      storage.addGameScore("focus", score);
    }
  }, [gameOver]);

  const handleTap = () => {
    if (!isActive) return;
    setScore((s) => s + 1);
    moveTarget();
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.gameScreen}>
      <View style={styles.gameHeader}>
        <Pressable onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.gameHeaderTitle, { color: colors.text }]}>Focus Tap</Text>
        <Text style={[styles.movesText, { color: colors.textSecondary }]}>
          {isActive ? `${timeLeft}s` : "30s"}
        </Text>
      </View>

      {!isActive && !gameOver ? (
        <View style={styles.wonWrap}>
          <Ionicons name="fitness" size={48} color={colors.tint} />
          <Text style={[styles.wonText, { color: colors.text }]}>Focus Tap</Text>
          <Text style={[styles.wonSub, { color: colors.textSecondary }]}>
            Tap the lotus as many times as you can in 30 seconds!
          </Text>
          <Pressable
            onPress={startGame}
            style={({ pressed }) => [
              styles.gameBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1, marginTop: 16 },
            ]}
          >
            <Ionicons name="play" size={22} color="#fff" />
            <Text style={styles.gameBtnText}>Start</Text>
          </Pressable>
        </View>
      ) : gameOver ? (
        <View style={styles.wonWrap}>
          <Ionicons name="trophy" size={48} color={colors.amber} />
          <Text style={[styles.wonText, { color: colors.text }]}>Time's Up!</Text>
          <Text style={[styles.wonSub, { color: colors.textSecondary }]}>
            You scored {score} taps
          </Text>
          <Pressable
            onPress={startGame}
            style={({ pressed }) => [
              styles.gameBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1, marginTop: 16 },
            ]}
          >
            <Ionicons name="refresh" size={22} color="#fff" />
            <Text style={styles.gameBtnText}>Play Again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.focusArea, { width: screenW, height: 380 }]}>
          <Text style={[styles.focusScore, { color: colors.text }]}>{score}</Text>
          <Pressable
            onPress={handleTap}
            style={[
              styles.focusTarget,
              { left: targetPos.x, top: targetPos.y, backgroundColor: colors.tint + "20" },
            ]}
          >
            <Ionicons name="flower" size={36} color={colors.tint} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function GamesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [activeGame, setActiveGame] = useState<GameType>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  if (activeGame === "breathing") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + webTopInset }]}>
        <BreathingGame colors={colors} onBack={() => setActiveGame(null)} />
      </View>
    );
  }
  if (activeGame === "memory") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + webTopInset }]}>
        <MemoryGame colors={colors} onBack={() => setActiveGame(null)} />
      </View>
    );
  }
  if (activeGame === "focus") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + webTopInset }]}>
        <FocusGame colors={colors} onBack={() => setActiveGame(null)} />
      </View>
    );
  }

  const games = [
    {
      key: "breathing" as const,
      title: "Breathing Exercise",
      description: "4-4-4 breathing pattern to calm your mind and reduce stress",
      icon: "cloud",
      gradient: isDark ? ["#0A2E2A", "#1B3B2A"] as const : ["#E0F2F1", "#C8E6C9"] as const,
      iconColor: colors.tint,
    },
    {
      key: "memory" as const,
      title: "Zen Memory",
      description: "Match pairs of nature icons to sharpen your focus and memory",
      icon: "grid",
      gradient: isDark ? ["#2A1E3A", "#1A1A2E"] as const : ["#F3E5F5", "#E8EAF6"] as const,
      iconColor: colors.lavender,
    },
    {
      key: "focus" as const,
      title: "Focus Tap",
      description: "Tap the lotus as fast as you can to train your concentration",
      icon: "fitness",
      gradient: isDark ? ["#2A2520", "#1A1A2E"] as const : ["#FFF8E1", "#FFF3E0"] as const,
      iconColor: colors.amber,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + webTopInset + 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.listHeader}>
        <Text style={[styles.title, { color: colors.text }]}>Games</Text>
        <Text style={[styles.listSubtitle, { color: colors.textSecondary }]}>
          Play mindfulness games with Larry!
        </Text>
      </View>

      <View style={styles.larryGameBanner}>
        <LinearGradient
          colors={isDark ? ["#1B3B2A", "#0A2E2A"] : ["#E8F5E9", "#C8E6C9"]}
          style={styles.larryBannerGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.larryBannerRow}>
            <View style={styles.larryBannerAvatar}>
              <MaterialCommunityIcons name="turtle" size={28} color={colors.sage} />
            </View>
            <View style={styles.larryBannerTextWrap}>
              <Text style={[styles.larryBannerName, { color: colors.sage }]}>Larry's Game Corner</Text>
              <Text style={[styles.larryBannerMsg, { color: colors.textSecondary }]}>
                Games are a great way to practice focus and relaxation. Let's play!
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {games.map((game, index) => (
        <Animated.View
          key={game.key}
          entering={Platform.OS !== "web" ? FadeInDown.delay(index * 100).duration(500) : undefined}
        >
          <Pressable
            onPress={() => {
              setActiveGame(game.key);
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <LinearGradient
              colors={game.gradient}
              style={styles.gameCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.gameCardIcon, { backgroundColor: game.iconColor + "20" }]}>
                <Ionicons name={game.icon as any} size={28} color={game.iconColor} />
              </View>
              <View style={styles.gameCardText}>
                <Text style={[styles.gameCardTitle, { color: colors.text }]}>{game.title}</Text>
                <Text style={[styles.gameCardDesc, { color: colors.textSecondary }]}>{game.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listHeader: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 28 },
  listSubtitle: { fontFamily: "Nunito_500Medium", fontSize: 14, marginTop: 4 },
  larryGameBanner: { marginHorizontal: 20, marginBottom: 16 },
  larryBannerGrad: { borderRadius: 16, padding: 16 },
  larryBannerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  larryBannerAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(123,174,127,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  larryBannerTextWrap: { flex: 1 },
  larryBannerName: { fontFamily: "Nunito_700Bold", fontSize: 14, marginBottom: 2 },
  larryBannerMsg: { fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 18 },
  gameCard: {
    marginHorizontal: 20, marginBottom: 12, borderRadius: 16, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
  },
  gameCardIcon: {
    width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center",
  },
  gameCardText: { flex: 1 },
  gameCardTitle: { fontFamily: "Nunito_700Bold", fontSize: 16, marginBottom: 2 },
  gameCardDesc: { fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 18 },
  gameScreen: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  gameHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20,
  },
  gameHeaderTitle: { fontFamily: "Nunito_700Bold", fontSize: 20 },
  movesText: { fontFamily: "Nunito_600SemiBold", fontSize: 14 },
  breathCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  breathCircle: {
    position: "absolute", width: 200, height: 200, borderRadius: 100, borderWidth: 3,
  },
  breathTextWrap: { alignItems: "center", gap: 8 },
  breathPhase: { fontFamily: "Nunito_800ExtraBold", fontSize: 24 },
  breathSub: { fontFamily: "Nunito_500Medium", fontSize: 14 },
  gameBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, alignSelf: "center",
  },
  gameBtnText: { fontFamily: "Nunito_700Bold", fontSize: 17, color: "#fff" },
  wonWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  wonText: { fontFamily: "Nunito_800ExtraBold", fontSize: 28 },
  wonSub: { fontFamily: "Nunito_500Medium", fontSize: 15, textAlign: "center" },
  memoryGrid: {
    flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10,
    paddingTop: 20,
  },
  memoryCard: {
    width: 72, height: 72, borderRadius: 16, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  focusArea: { alignSelf: "center", position: "relative" },
  focusScore: { fontFamily: "Nunito_800ExtraBold", fontSize: 48, textAlign: "center", marginBottom: 10 },
  focusTarget: {
    position: "absolute", width: 60, height: 60, borderRadius: 30,
    alignItems: "center", justifyContent: "center",
  },
});
