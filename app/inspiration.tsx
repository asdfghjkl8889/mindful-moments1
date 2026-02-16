import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  useColorScheme,
  Platform,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { QUOTES, QUOTE_CATEGORIES, QuoteCategory } from "@/lib/storage";

export default function InspirationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<QuoteCategory | "all">("all");
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredQuotes = useMemo(() => {
    if (selectedCategory === "all") return QUOTES;
    return QUOTES.filter((q) => q.category === selectedCategory);
  }, [selectedCategory]);

  const currentQuote = filteredQuotes[currentIndex % filteredQuotes.length];
  const categoryData = QUOTE_CATEGORIES.find((c) => c.key === currentQuote?.category);

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredQuotes.length);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredQuotes.length) % filteredQuotes.length);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const shuffleQuote = () => {
    setCurrentIndex(Math.floor(Math.random() * filteredQuotes.length));
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const shareQuote = async () => {
    if (!currentQuote) return;
    try {
      await Share.share({
        message: `"${currentQuote.text}" - ${currentQuote.author}`,
      });
    } catch {}
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  if (!currentQuote) return null;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <LinearGradient
        colors={["#FFFFFF", "#E0F7FA", "#F3E5F5"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={{ paddingTop: insets.top + webTopInset }}>
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.navBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: colors.text }]}>Daily Inspiration</Text>
          <View style={{ width: 38 }} />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        <Pressable
          onPress={() => {
            setSelectedCategory("all");
            setCurrentIndex(0);
          }}
          style={[
            styles.catChip,
            {
              backgroundColor: selectedCategory === "all" ? colors.tint : colors.card,
              borderColor: selectedCategory === "all" ? colors.tint : colors.cardBorder,
            },
          ]}
        >
          <Text
            style={[styles.catChipText, { color: selectedCategory === "all" ? "#fff" : colors.text }]}
          >
            All
          </Text>
        </Pressable>
        {QUOTE_CATEGORIES.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => {
              setSelectedCategory(c.key);
              setCurrentIndex(0);
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
            style={[
              styles.catChip,
              {
                backgroundColor: selectedCategory === c.key ? c.color + "25" : colors.card,
                borderColor: selectedCategory === c.key ? c.color : colors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name={c.icon as any}
              size={14}
              color={selectedCategory === c.key ? c.color : colors.textSecondary}
            />
            <Text
              style={[styles.catChipText, { color: selectedCategory === c.key ? c.color : colors.text }]}
            >
              {c.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.quoteArea}>
        <View style={[styles.categoryBadge, { backgroundColor: (categoryData?.color || colors.tint) + "20" }]}>
          <Ionicons name={(categoryData?.icon || "sparkles") as any} size={14} color={categoryData?.color || colors.tint} />
          <Text style={[styles.categoryBadgeText, { color: categoryData?.color || colors.tint }]}>
            {categoryData?.label || "Mindfulness"}
          </Text>
        </View>

        <View style={styles.quoteBlock}>
          <Ionicons name="chatbubble-ellipses" size={28} color={colors.tint + "40"} style={{ marginBottom: 12 }} />
          <Text style={[styles.quoteText, { color: colors.text }]}>
            "{currentQuote.text}"
          </Text>
          <Text style={[styles.quoteAuthor, { color: colors.textSecondary }]}>
            {currentQuote.author}
          </Text>
        </View>

        <Text style={[styles.counter, { color: colors.textTertiary }]}>
          {(currentIndex % filteredQuotes.length) + 1} of {filteredQuotes.length}
        </Text>

        <View style={styles.navRow}>
          <Pressable
            onPress={goPrev}
            style={({ pressed }) => [styles.arrowBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={shuffleQuote}
            style={({ pressed }) => [styles.shuffleBtn, { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="shuffle" size={20} color="#fff" />
          </Pressable>

          <Pressable
            onPress={shareQuote}
            style={({ pressed }) => [styles.arrowBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={goNext}
            style={({ pressed }) => [styles.arrowBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </Pressable>
        </View>

        <Text style={[styles.encouragement, { color: colors.textSecondary }]}>
          Take a deep breath. You have the strength within you to handle anything.
        </Text>
      </View>

      <View style={{ height: Platform.OS === "web" ? 34 : 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 8,
  },
  navBtn: { padding: 8 },
  navTitle: { fontFamily: "Nunito_700Bold", fontSize: 17 },
  categoryRow: {
    paddingHorizontal: 20, gap: 8, paddingVertical: 8,
  },
  catChip: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  catChipText: { fontFamily: "Nunito_600SemiBold", fontSize: 13 },
  quoteArea: {
    flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28,
  },
  categoryBadge: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14, marginBottom: 20,
  },
  categoryBadgeText: { fontFamily: "Nunito_600SemiBold", fontSize: 12 },
  quoteBlock: { alignItems: "center", marginBottom: 20 },
  quoteText: {
    fontFamily: "Nunito_700Bold", fontSize: 20, textAlign: "center", lineHeight: 30,
    fontStyle: "italic", marginBottom: 16,
  },
  quoteAuthor: { fontFamily: "Nunito_600SemiBold", fontSize: 14, textAlign: "center" },
  counter: { fontFamily: "Nunito_500Medium", fontSize: 12, marginBottom: 16 },
  navRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  arrowBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  shuffleBtn: {
    width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center",
  },
  encouragement: {
    fontFamily: "Nunito_500Medium", fontSize: 13, textAlign: "center", marginTop: 24, lineHeight: 19,
  },
});
