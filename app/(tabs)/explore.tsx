import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";

type ExploreSection = "resources" | "courses" | "games" | "tools";

const RESOURCE_CATEGORIES = [
  { key: "sleep", label: "Sleep & Music", icon: "musical-notes" },
  { key: "guided", label: "Guided", icon: "headset" },
  { key: "reading", label: "Reading", icon: "book" },
  { key: "apps", label: "Apps", icon: "apps" },
  { key: "community", label: "Community", icon: "people" },
];

const RESOURCES = [
  { category: "sleep", title: "Soothing Relaxation", desc: "Beautiful piano by Peder B. Helland", url: "https://www.youtube.com/@SoijuSoothingRelaxation", icon: "musical-note", color: "#81D4FA" },
  { category: "sleep", title: "Ocean Waves", desc: "1 hour of calming waves", url: "https://www.youtube.com/watch?v=bn9F19Hi1Lk", icon: "water", color: "#4DB6AC" },
  { category: "sleep", title: "Forest Ambience", desc: "Nature sounds for deep focus", url: "https://www.youtube.com/watch?v=xNN7iTA57jM", icon: "leaf", color: "#66BB6A" },
  { category: "sleep", title: "Tibetan Singing Bowls", desc: "3 hours of healing sounds", url: "https://www.youtube.com/watch?v=TlpFzn3aXcg", icon: "volume-high", color: "#B39DDB" },
  { category: "sleep", title: "Rain Sounds", desc: "Relaxing rain for sleep and study", url: "https://www.youtube.com/watch?v=mPZkdNFkNps", icon: "rainy", color: "#5C6BC0" },
  { category: "sleep", title: "Napflix", desc: "Curated boring videos for sleep", url: "https://napflix.tv/", icon: "moon", color: "#7986CB" },
  { category: "guided", title: "Mindful.org Meditations", desc: "Free guided meditation library", url: "https://www.mindful.org/category/mindful-skills/meditation/guided-meditation/", icon: "leaf", color: "#4DB6AC" },
  { category: "guided", title: "UCLA Mindfulness", desc: "Free guided meditations from UCLA", url: "https://www.uclahealth.org/programs/marc/free-guided-meditations", icon: "school", color: "#42A5F5" },
  { category: "guided", title: "Tara Brach Meditations", desc: "Talks and guided meditations", url: "https://www.tarabrach.com/guided-meditations/", icon: "heart", color: "#FF8A80" },
  { category: "guided", title: "Insight Timer", desc: "World's largest free meditation library", url: "https://insighttimer.com/", icon: "timer", color: "#FFD54F" },
  { category: "reading", title: "Mindfulness Exercises", desc: "Free mindfulness courses & resources", url: "https://mindfulnessexercises.com/", icon: "book", color: "#66BB6A" },
  { category: "reading", title: "Greater Good Magazine", desc: "Science-based mindfulness articles", url: "https://greatergood.berkeley.edu/topic/mindfulness", icon: "newspaper", color: "#42A5F5" },
  { category: "reading", title: "Tiny Buddha", desc: "Simple wisdom for complex lives", url: "https://tinybuddha.com/", icon: "flower", color: "#FF8A65" },
  { category: "reading", title: "Zen Habits", desc: "Breathe. Mindfulness in daily life", url: "https://zenhabits.net/", icon: "leaf", color: "#4DB6AC" },
  { category: "apps", title: "Headspace", desc: "Meditation & sleep made simple", url: "https://www.headspace.com/", icon: "happy", color: "#FF8A65" },
  { category: "apps", title: "Calm", desc: "Sleep, meditation & relaxation", url: "https://www.calm.com/", icon: "water", color: "#81D4FA" },
  { category: "apps", title: "Waking Up", desc: "Meditation by Sam Harris", url: "https://www.wakingup.com/", icon: "sunny", color: "#FFD54F" },
  { category: "apps", title: "Ten Percent Happier", desc: "Meditation for fidgety skeptics", url: "https://www.tenpercent.com/", icon: "trending-up", color: "#66BB6A" },
  { category: "community", title: "r/Meditation", desc: "Reddit meditation community", url: "https://www.reddit.com/r/Meditation/", icon: "people", color: "#FF8A65" },
  { category: "community", title: "r/Mindfulness", desc: "Mindfulness subreddit", url: "https://www.reddit.com/r/Mindfulness/", icon: "chatbubbles", color: "#4DB6AC" },
  { category: "community", title: "Plum Village", desc: "Thich Nhat Hanh's community", url: "https://plumvillage.org/", icon: "flower", color: "#B39DDB" },
];

const COURSES = [
  {
    id: "beginner",
    title: "Mindfulness Foundations",
    description: "Start your mindfulness journey with the basics",
    icon: "leaf",
    color: "#4DB6AC",
    duration: "2 weeks",
    lessons: [
      { title: "What is Mindfulness?", desc: "Understanding awareness and presence", duration: "5 min" },
      { title: "The Breath Anchor", desc: "Using breath as your meditation anchor", duration: "8 min" },
      { title: "Body Awareness", desc: "Tuning into physical sensations", duration: "10 min" },
      { title: "Observing Thoughts", desc: "Watching thoughts without judgment", duration: "8 min" },
      { title: "Loving-Kindness Intro", desc: "Cultivating compassion for yourself", duration: "10 min" },
      { title: "Daily Mindfulness", desc: "Bringing awareness to daily activities", duration: "7 min" },
      { title: "Review & Practice", desc: "Consolidate what you've learned", duration: "15 min" },
    ],
  },
  {
    id: "stress",
    title: "Stress Relief",
    description: "Techniques to manage and reduce stress",
    icon: "water",
    color: "#81D4FA",
    duration: "1 week",
    lessons: [
      { title: "Understanding Stress", desc: "How stress affects your mind and body", duration: "5 min" },
      { title: "Progressive Relaxation", desc: "Systematically relax each muscle group", duration: "12 min" },
      { title: "Stress Breathing", desc: "4-7-8 and box breathing techniques", duration: "8 min" },
      { title: "Thought Reframing", desc: "Transform stressful thoughts", duration: "10 min" },
      { title: "Stress-Free Living", desc: "Building a low-stress lifestyle", duration: "7 min" },
    ],
  },
  {
    id: "sleep",
    title: "Better Sleep",
    description: "Fall asleep faster and sleep deeper",
    icon: "moon",
    color: "#5C6BC0",
    duration: "1 week",
    lessons: [
      { title: "Sleep Hygiene", desc: "Setting up for better sleep", duration: "5 min" },
      { title: "Wind Down Routine", desc: "Evening relaxation practices", duration: "10 min" },
      { title: "Body Scan for Sleep", desc: "Relax your body into sleep", duration: "15 min" },
      { title: "Sleep Visualization", desc: "Peaceful imagery for drifting off", duration: "12 min" },
      { title: "Mantras for Rest", desc: "Calming phrases for bedtime", duration: "8 min" },
    ],
  },
  {
    id: "gratitude",
    title: "Gratitude Practice",
    description: "Cultivate thankfulness and appreciation",
    icon: "heart",
    color: "#FF8A80",
    duration: "1 week",
    lessons: [
      { title: "Why Gratitude Matters", desc: "The science of thankfulness", duration: "5 min" },
      { title: "Gratitude Journaling", desc: "Writing your way to happiness", duration: "8 min" },
      { title: "Appreciating Others", desc: "Expressing thanks to people around you", duration: "7 min" },
      { title: "Body Gratitude", desc: "Thanking your body for all it does", duration: "10 min" },
      { title: "Gratitude Meditation", desc: "A guided gratitude practice", duration: "12 min" },
    ],
  },
  {
    id: "focus",
    title: "Laser Focus",
    description: "Sharpen concentration and mental clarity",
    icon: "eye",
    color: "#FFD54F",
    duration: "10 days",
    lessons: [
      { title: "The Focused Mind", desc: "Understanding concentration", duration: "5 min" },
      { title: "Single-Point Focus", desc: "Training attention with one object", duration: "10 min" },
      { title: "Dealing with Distractions", desc: "How to gently return focus", duration: "8 min" },
      { title: "Walking Meditation", desc: "Mindful movement for focus", duration: "12 min" },
      { title: "Focus in Daily Life", desc: "Bringing concentration everywhere", duration: "7 min" },
      { title: "Deep Work Practice", desc: "Extended focus training", duration: "15 min" },
    ],
  },
  {
    id: "anxiety",
    title: "Calming Anxiety",
    description: "Tools to ease anxious thoughts and feelings",
    icon: "shield-checkmark",
    color: "#66BB6A",
    duration: "2 weeks",
    lessons: [
      { title: "Understanding Anxiety", desc: "What anxiety is and how it works", duration: "5 min" },
      { title: "Grounding Techniques", desc: "The 5-4-3-2-1 sensory method", duration: "8 min" },
      { title: "Breath for Calm", desc: "Breathing techniques for anxiety", duration: "10 min" },
      { title: "Acceptance Practice", desc: "Making peace with uncertainty", duration: "10 min" },
      { title: "Safe Space Visualization", desc: "Creating an inner sanctuary", duration: "12 min" },
      { title: "Compassion for Anxiety", desc: "Befriending your anxious self", duration: "10 min" },
      { title: "Building Resilience", desc: "Long-term anxiety management", duration: "8 min" },
    ],
  },
];

function ResourceCard({ resource, colors }: { resource: (typeof RESOURCES)[0]; colors: any }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(resource.url)}
      style={({ pressed }) => [
        styles.resourceCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.resourceIcon, { backgroundColor: resource.color + "20" }]}>
        <Ionicons name={resource.icon as any} size={20} color={resource.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.resourceTitle, { color: colors.text }]}>{resource.title}</Text>
        <Text style={[styles.resourceDesc, { color: colors.textSecondary }]}>{resource.desc}</Text>
      </View>
      <Ionicons name="open-outline" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

function CourseCard({ course, colors, onPress }: { course: (typeof COURSES)[0]; colors: any; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.courseCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.courseIconWrap, { backgroundColor: course.color + "20" }]}>
        <Ionicons name={course.icon as any} size={24} color={course.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.courseTitle, { color: colors.text }]}>{course.title}</Text>
        <Text style={[styles.courseDesc, { color: colors.textSecondary }]}>{course.description}</Text>
        <View style={styles.courseMeta}>
          <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
          <Text style={[styles.courseMetaText, { color: colors.textTertiary }]}>{course.duration}</Text>
          <Ionicons name="list-outline" size={12} color={colors.textTertiary} />
          <Text style={[styles.courseMetaText, { color: colors.textTertiary }]}>{course.lessons.length} lessons</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [activeSection, setActiveSection] = useState<ExploreSection>("tools");
  const [resourceCategory, setResourceCategory] = useState("sleep");
  const [selectedCourse, setSelectedCourse] = useState<(typeof COURSES)[0] | null>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const sections: { key: ExploreSection; label: string; icon: string }[] = [
    { key: "tools", label: "Tools", icon: "apps" },
    { key: "resources", label: "Resources", icon: "library" },
    { key: "courses", label: "Courses", icon: "school" },
    { key: "games", label: "Games", icon: "game-controller" },
  ];

  const filteredResources = RESOURCES.filter((r) => r.category === resourceCategory);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + webTopInset + 16,
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(600) : undefined}>
        <LinearGradient
          colors={["#E0F7FA", "#C8E6C9", "#FFFFFF"]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>Explore</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Discover mindfulness resources, courses & games
          </Text>
        </LinearGradient>
      </Animated.View>

      <View style={styles.sectionTabs}>
        {sections.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => {
              setActiveSection(s.key);
              setSelectedCourse(null);
              if (Platform.OS !== "web") Haptics.selectionAsync();
            }}
            style={[
              styles.sectionTab,
              {
                backgroundColor: activeSection === s.key ? colors.tint : colors.card,
                borderColor: activeSection === s.key ? colors.tint : colors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name={s.icon as any}
              size={16}
              color={activeSection === s.key ? "#fff" : colors.text}
            />
            <Text
              style={[
                styles.sectionTabText,
                { color: activeSection === s.key ? "#fff" : colors.text },
              ]}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeSection === "resources" && (
        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>

          {/* ── Featured resource ── */}
          <Pressable
            onPress={() => Linking.openURL("https://insighttimer.com/")}
            style={({ pressed }) => [styles.featuredCard, { opacity: pressed ? 0.9 : 1 }]}
          >
            <LinearGradient colors={["#1A237E", "#283593", "#5C6BC0"]} style={styles.featuredGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.featuredBadgeWrap}>
                <Text style={styles.featuredBadge}>🎧  EDITOR'S PICK</Text>
              </View>
              <Text style={styles.featuredTitle}>Insight Timer</Text>
              <Text style={styles.featuredDesc}>The world's largest free meditation library — 190,000+ guided sessions, sleep music, and talks from top teachers.</Text>
              <View style={styles.featuredCta}>
                <Text style={styles.featuredCtaText}>Open Free</Text>
                <Ionicons name="open-outline" size={14} color="#fff" />
              </View>
              <Text style={styles.featuredEmoji}>🧘‍♀️🎵</Text>
            </LinearGradient>
          </Pressable>

          {/* ── Sleep & Music ── */}
          <Text style={[styles.toolCatTitle, { color: colors.text }]}>Sleep & Music</Text>
          <Text style={[styles.toolCatSub, { color: colors.textSecondary }]}>Ambient sounds and music to relax and drift off</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolRow}>
            {RESOURCES.filter(r => r.category === "sleep").map((r) => (
              <Pressable key={r.title} onPress={() => Linking.openURL(r.url)}
                style={({ pressed }) => [styles.resCard, { opacity: pressed ? 0.88 : 1 }]}>
                <LinearGradient colors={["#0d1b2a", r.color]} style={styles.resGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name={r.icon as any} size={26} color="#fff" style={{ marginBottom: 10 }} />
                  <Text style={styles.toolHTitle}>{r.title}</Text>
                  <Text style={styles.toolHDesc}>{r.desc}</Text>
                  <Ionicons name="open-outline" size={12} color="rgba(255,255,255,0.6)" style={{ marginTop: 6 }} />
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>

          {/* ── Guided Meditation ── */}
          <Text style={[styles.toolCatTitle, { color: colors.text }]}>Guided Meditation</Text>
          <Text style={[styles.toolCatSub, { color: colors.textSecondary }]}>Free guided sessions from world-class teachers</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolRow}>
            {RESOURCES.filter(r => r.category === "guided").map((r) => (
              <Pressable key={r.title} onPress={() => Linking.openURL(r.url)}
                style={({ pressed }) => [styles.resCard, { opacity: pressed ? 0.88 : 1 }]}>
                <LinearGradient colors={["#0d1b2a", r.color]} style={styles.resGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name={r.icon as any} size={26} color="#fff" style={{ marginBottom: 10 }} />
                  <Text style={styles.toolHTitle}>{r.title}</Text>
                  <Text style={styles.toolHDesc}>{r.desc}</Text>
                  <Ionicons name="open-outline" size={12} color="rgba(255,255,255,0.6)" style={{ marginTop: 6 }} />
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>

          {/* ── Read & Learn ── */}
          <Text style={[styles.toolCatTitle, { color: colors.text }]}>Read & Learn</Text>
          <Text style={[styles.toolCatSub, { color: colors.textSecondary }]}>Science-backed articles and mindfulness writing</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolRow}>
            {RESOURCES.filter(r => r.category === "reading").map((r) => (
              <Pressable key={r.title} onPress={() => Linking.openURL(r.url)}
                style={({ pressed }) => [styles.resCard, { opacity: pressed ? 0.88 : 1 }]}>
                <LinearGradient colors={["#0d1b2a", r.color]} style={styles.resGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name={r.icon as any} size={26} color="#fff" style={{ marginBottom: 10 }} />
                  <Text style={styles.toolHTitle}>{r.title}</Text>
                  <Text style={styles.toolHDesc}>{r.desc}</Text>
                  <Ionicons name="open-outline" size={12} color="rgba(255,255,255,0.6)" style={{ marginTop: 6 }} />
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>

          {/* ── Other Apps + Community ── */}
          <Text style={[styles.toolCatTitle, { color: colors.text }]}>Discover More</Text>
          <Text style={[styles.toolCatSub, { color: colors.textSecondary }]}>Other apps and communities worth exploring</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.toolRow, { paddingBottom: 8 }]}>
            {RESOURCES.filter(r => r.category === "apps" || r.category === "community").map((r) => (
              <Pressable key={r.title} onPress={() => Linking.openURL(r.url)}
                style={({ pressed }) => [styles.resCard, { opacity: pressed ? 0.88 : 1 }]}>
                <LinearGradient colors={["#0d1b2a", r.color]} style={styles.resGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name={r.icon as any} size={26} color="#fff" style={{ marginBottom: 10 }} />
                  <Text style={styles.toolHTitle}>{r.title}</Text>
                  <Text style={styles.toolHDesc}>{r.desc}</Text>
                  <Ionicons name="open-outline" size={12} color="rgba(255,255,255,0.6)" style={{ marginTop: 6 }} />
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>

        </Animated.View>
      )}

      {activeSection === "courses" && !selectedCourse && (
        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>

          {/* ── Featured course ── */}
          <Pressable
            onPress={() => { setSelectedCourse(COURSES[0]); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
            style={({ pressed }) => [styles.featuredCard, { opacity: pressed ? 0.9 : 1 }]}
          >
            <LinearGradient colors={["#004D40", "#00796B", "#4DB6AC"]} style={styles.featuredGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.featuredBadgeWrap}>
                <Text style={styles.featuredBadge}>🌱  START HERE</Text>
              </View>
              <Text style={styles.featuredTitle}>Mindfulness{"\n"}Foundations</Text>
              <Text style={styles.featuredDesc}>The perfect starting point — 7 lessons covering breath, body, thoughts, and daily practice.</Text>
              <View style={styles.featuredCta}>
                <Text style={styles.featuredCtaText}>Begin Course</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </View>
              <Text style={styles.featuredEmoji}>📖✨</Text>
            </LinearGradient>
          </Pressable>

          {/* ── All courses as gradient cards ── */}
          <Text style={[styles.toolCatTitle, { color: colors.text }]}>All Courses</Text>
          <Text style={[styles.toolCatSub, { color: colors.textSecondary }]}>Structured programs to build lasting habits</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.toolRow, { paddingBottom: 8 }]}>
            {COURSES.map((c) => {
              const darkColor = c.color + "DD";
              return (
                <Pressable key={c.id}
                  onPress={() => { setSelectedCourse(c); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                  style={({ pressed }) => [styles.courseHCard, { opacity: pressed ? 0.88 : 1 }]}>
                  <LinearGradient colors={[darkColor, c.color]} style={styles.courseHGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={styles.courseHIconWrap}>
                      <Ionicons name={c.icon as any} size={24} color="#fff" />
                    </View>
                    <Text style={styles.courseHTitle}>{c.title}</Text>
                    <Text style={styles.courseHDesc}>{c.description}</Text>
                    <View style={styles.courseHMeta}>
                      <Text style={styles.courseHMetaText}>{c.duration}</Text>
                      <Text style={styles.courseHMetaDot}>·</Text>
                      <Text style={styles.courseHMetaText}>{c.lessons.length} lessons</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ── 7-Day course banner ── */}
          <Pressable onPress={() => { router.push("/course-week"); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
            style={({ pressed }) => [styles.playBanner, { opacity: pressed ? 0.9 : 1 }]}>
            <LinearGradient colors={["#4A148C", "#7B1FA2", "#AB47BC"]} style={styles.playBannerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.playBannerTitle}>7-Day Wellness Course</Text>
                <Text style={styles.playBannerDesc}>Full day-by-day wellness plan with 5 sessions/day</Text>
              </View>
              <View style={styles.playBannerRight}>
                <Text style={{ fontSize: 36 }}>📅</Text>
                <View style={styles.playBannerBtn}>
                  <Text style={styles.playBannerBtnText}>Start</Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>

        </Animated.View>
      )}

      {activeSection === "courses" && selectedCourse && (
        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
          <Pressable
            onPress={() => setSelectedCourse(null)}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={18} color={colors.tint} />
            <Text style={[styles.backText, { color: colors.tint }]}>All Courses</Text>
          </Pressable>

          <View style={[styles.courseDetailHeader, { backgroundColor: selectedCourse.color + "12" }]}>
            <View style={[styles.courseDetailIcon, { backgroundColor: selectedCourse.color + "25" }]}>
              <Ionicons name={selectedCourse.icon as any} size={32} color={selectedCourse.color} />
            </View>
            <Text style={[styles.courseDetailTitle, { color: colors.text }]}>{selectedCourse.title}</Text>
            <Text style={[styles.courseDetailDesc, { color: colors.textSecondary }]}>{selectedCourse.description}</Text>
            <View style={styles.courseDetailMeta}>
              <View style={[styles.metaBadge, { backgroundColor: colors.card }]}>
                <Ionicons name="time-outline" size={14} color={colors.tint} />
                <Text style={[styles.metaBadgeText, { color: colors.text }]}>{selectedCourse.duration}</Text>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: colors.card }]}>
                <Ionicons name="list-outline" size={14} color={colors.tint} />
                <Text style={[styles.metaBadgeText, { color: colors.text }]}>{selectedCourse.lessons.length} lessons</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.lessonsTitle, { color: colors.text }]}>Lessons</Text>
          {selectedCourse.lessons.map((lesson, i) => (
            <View
              key={i}
              style={[styles.lessonCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            >
              <View style={[styles.lessonNum, { backgroundColor: selectedCourse.color + "20" }]}>
                <Text style={[styles.lessonNumText, { color: selectedCourse.color }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
                <Text style={[styles.lessonDesc, { color: colors.textSecondary }]}>{lesson.desc}</Text>
              </View>
              <Text style={[styles.lessonDuration, { color: colors.textTertiary }]}>{lesson.duration}</Text>
            </View>
          ))}
        </Animated.View>
      )}

      {activeSection === "tools" && (
        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>

          {/* ── Featured spotlight ── */}
          <Pressable
            onPress={() => { router.push("/mood-garden"); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
            style={({ pressed }) => [styles.featuredCard, { opacity: pressed ? 0.9 : 1 }]}
          >
            <LinearGradient colors={["#1B5E20", "#2E7D32", "#66BB6A"]} style={styles.featuredGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.featuredBadgeWrap}>
                <Text style={styles.featuredBadge}>✨  FEATURED TOOL</Text>
              </View>
              <Text style={styles.featuredTitle}>Mood Garden</Text>
              <Text style={styles.featuredDesc}>Watch your daily emotions bloom into a living, evolving garden. The more you track, the more it grows.</Text>
              <View style={styles.featuredCta}>
                <Text style={styles.featuredCtaText}>Open Garden</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </View>
              <Text style={styles.featuredEmoji}>🌸🌿🌻</Text>
            </LinearGradient>
          </Pressable>

          {/* ── Track & Grow ── */}
          <Text style={[styles.toolCatTitle, { color: colors.text }]}>Track & Grow</Text>
          <Text style={[styles.toolCatSub, { color: colors.textSecondary }]}>Build streaks, earn XP and measure your progress</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolRow}>
            {[
              { title: "Goals", desc: "Daily, weekly & yearly", icon: "trophy", color: "#26A69A", grad: ["#004D40", "#26A69A"], route: "/goals", emoji: "🎯" },
              { title: "Challenges", desc: "Missions, XP & badges", icon: "ribbon", color: "#FFB300", grad: ["#E65100", "#FFB300"], route: "/challenges", emoji: "🏆" },
              { title: "Circadian Rhythm", desc: "Meditate at cortisol peaks", icon: "sunny", color: "#1565C0", grad: ["#0D47A1", "#42A5F5"], route: "/circadian", emoji: "🌅" },
              { title: "7-Day Course", desc: "Full wellness week", icon: "calendar", color: "#4DB6AC", grad: ["#00695C", "#4DB6AC"], route: "/course-week", emoji: "📅" },
            ].map((t) => (
              <Pressable key={t.title} onPress={() => { router.push(t.route as any); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                style={({ pressed }) => [styles.toolHCard, { opacity: pressed ? 0.88 : 1 }]}>
                <LinearGradient colors={t.grad as any} style={styles.toolHGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.toolHEmoji}>{t.emoji}</Text>
                  <Text style={styles.toolHTitle}>{t.title}</Text>
                  <Text style={styles.toolHDesc}>{t.desc}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>

          {/* ── Clear Your Mind ── */}
          <Text style={[styles.toolCatTitle, { color: colors.text }]}>Clear Your Mind</Text>
          <Text style={[styles.toolCatSub, { color: colors.textSecondary }]}>Tools to break negative patterns and find calm fast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolRow}>
            {[
              { title: "Quick Calm", desc: "60-second resets", icon: "flash", color: "#9C27B0", grad: ["#4A148C", "#AB47BC"], route: "/quick-calm", emoji: "⚡" },
              { title: "Reframe Thoughts", desc: "CBT in 3 steps", icon: "bulb", color: "#E91E63", grad: ["#880E4F", "#F06292"], route: "/negative-thoughts", emoji: "💡" },
              { title: "Overthinking", desc: "Break thought loops", icon: "sync", color: "#FF7043", grad: ["#BF360C", "#FF7043"], route: "/overthinking", emoji: "🌀" },
              { title: "Anger Management", desc: "Cool down & log it", icon: "flame", color: "#EF5350", grad: ["#B71C1C", "#EF5350"], route: "/anger-management", emoji: "🧊" },
            ].map((t) => (
              <Pressable key={t.title} onPress={() => { router.push(t.route as any); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                style={({ pressed }) => [styles.toolHCard, { opacity: pressed ? 0.88 : 1 }]}>
                <LinearGradient colors={t.grad as any} style={styles.toolHGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.toolHEmoji}>{t.emoji}</Text>
                  <Text style={styles.toolHTitle}>{t.title}</Text>
                  <Text style={styles.toolHDesc}>{t.desc}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>

          {/* ── Play ── */}
          <Text style={[styles.toolCatTitle, { color: colors.text }]}>Play & Train</Text>
          <Text style={[styles.toolCatSub, { color: colors.textSecondary }]}>Games that secretly train your focus and breathing</Text>
          <Pressable onPress={() => { router.push("/games"); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
            style={({ pressed }) => [styles.playBanner, { opacity: pressed ? 0.9 : 1 }]}>
            <LinearGradient colors={["#1A237E", "#3949AB", "#7986CB"]} style={styles.playBannerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.playBannerTitle}>Mindful Games Hub</Text>
                <Text style={styles.playBannerDesc}>Breathing · Zen Memory · Focus Tap</Text>
              </View>
              <View style={styles.playBannerRight}>
                <Text style={{ fontSize: 36 }}>🎮</Text>
                <View style={styles.playBannerBtn}>
                  <Text style={styles.playBannerBtnText}>Play</Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>

        </Animated.View>
      )}

      {activeSection === "games" && (
        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
          <View style={styles.gamesList}>
            {[
              { key: "breathing", title: "Breathing Exercise", desc: "4-4-4 calming breath pattern", icon: "leaf", color: "#4DB6AC" },
              { key: "memory", title: "Zen Memory", desc: "Match peaceful icons to sharpen focus", icon: "grid", color: "#B39DDB" },
              { key: "focus", title: "Focus Tap", desc: "Tap targets to train concentration", icon: "eye", color: "#FF8A65" },
            ].map((game) => (
              <Pressable
                key={game.key}
                onPress={() => {
                  router.push(`/game/${game.key}`);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
                style={({ pressed }) => [
                  styles.gameCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <View style={[styles.gameIconWrap, { backgroundColor: game.color + "20" }]}>
                  <Ionicons name={game.icon as any} size={28} color={game.color} />
                </View>
                <Text style={[styles.gameTitle, { color: colors.text }]}>{game.title}</Text>
                <Text style={[styles.gameDesc, { color: colors.textSecondary }]}>{game.desc}</Text>
                <View style={[styles.playBtn, { backgroundColor: game.color }]}>
                  <Ionicons name="play" size={16} color="#fff" />
                  <Text style={styles.playBtnText}>Play</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <View style={[styles.larryBanner, { backgroundColor: "#E8F5E9", borderColor: colors.cardBorder }]}>
            <View style={styles.larryBannerRow}>
              <View style={styles.larryBannerAvatar}>
                <MaterialCommunityIcons name="turtle" size={28} color={colors.sage} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.larryBannerName, { color: colors.sage }]}>Larry's Game Corner</Text>
                <Text style={[styles.larryBannerMsg, { color: colors.textSecondary }]}>
                  Train your mind while having fun! Every game strengthens your focus.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {
    marginHorizontal: 20, borderRadius: 20, padding: 24, marginBottom: 16,
  },
  headerTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 28, marginBottom: 4 },
  headerSub: { fontFamily: "Nunito_500Medium", fontSize: 14 },
  sectionTabs: {
    flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 16,
  },
  sectionTab: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1, flex: 1, justifyContent: "center",
  },
  sectionTabText: { fontFamily: "Nunito_600SemiBold", fontSize: 13 },
  categoryRow: { paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  categoryChip: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
  },
  categoryChipText: { fontFamily: "Nunito_600SemiBold", fontSize: 12 },
  resourceList: { paddingHorizontal: 20, gap: 10 },
  resourceCard: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  resourceIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  resourceTitle: { fontFamily: "Nunito_700Bold", fontSize: 14 },
  resourceDesc: { fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2 },
  courseList: { paddingHorizontal: 20, gap: 12 },
  courseCard: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, borderWidth: 1,
  },
  courseIconWrap: {
    width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center",
  },
  courseTitle: { fontFamily: "Nunito_700Bold", fontSize: 15 },
  courseDesc: { fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2 },
  courseMeta: {
    flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6,
  },
  courseMetaText: { fontFamily: "Nunito_500Medium", fontSize: 11, marginRight: 8 },
  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 20, marginBottom: 12,
  },
  backText: { fontFamily: "Nunito_600SemiBold", fontSize: 14 },
  courseDetailHeader: {
    marginHorizontal: 20, borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 16,
  },
  courseDetailIcon: {
    width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  courseDetailTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 22, textAlign: "center" },
  courseDetailDesc: { fontFamily: "Nunito_500Medium", fontSize: 14, textAlign: "center", marginTop: 4 },
  courseDetailMeta: { flexDirection: "row", gap: 10, marginTop: 12 },
  metaBadge: {
    flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  metaBadgeText: { fontFamily: "Nunito_600SemiBold", fontSize: 12 },
  lessonsTitle: { fontFamily: "Nunito_700Bold", fontSize: 18, marginHorizontal: 20, marginBottom: 12 },
  lessonCard: {
    flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 20, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  lessonNum: {
    width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  lessonNumText: { fontFamily: "Nunito_800ExtraBold", fontSize: 14 },
  lessonTitle: { fontFamily: "Nunito_700Bold", fontSize: 14 },
  lessonDesc: { fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2 },
  lessonDuration: { fontFamily: "Nunito_500Medium", fontSize: 11 },
  gamesList: {
    flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 12,
  },
  gameCard: {
    width: "47%", flexGrow: 1, borderRadius: 16, padding: 16, borderWidth: 1, alignItems: "center", gap: 8,
  },
  gameIconWrap: {
    width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center",
  },
  gameTitle: { fontFamily: "Nunito_700Bold", fontSize: 14, textAlign: "center" },
  gameDesc: { fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "center", lineHeight: 15 },
  playBtn: {
    flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginTop: 4,
  },
  playBtnText: { fontFamily: "Nunito_700Bold", fontSize: 12, color: "#fff" },
  larryBanner: {
    marginHorizontal: 20, marginTop: 16, borderRadius: 16, padding: 16, borderWidth: 1,
  },
  larryBannerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  larryBannerAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(123,174,127,0.15)", alignItems: "center", justifyContent: "center",
  },
  larryBannerName: { fontFamily: "Nunito_700Bold", fontSize: 14, marginBottom: 2 },
  larryBannerMsg: { fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 17 },
  toolsGrid: {
    flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 12,
  },
  toolCard: { width: "47%", flexGrow: 1 },
  toolCardInner: {
    borderRadius: 18, padding: 16, alignItems: "center", gap: 8, minHeight: 130, justifyContent: "center",
  },
  toolIconWrap: {
    width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center",
  },
  toolTitle: { fontFamily: "Nunito_700Bold", fontSize: 14, textAlign: "center" },
  toolDesc: { fontFamily: "Nunito_400Regular", fontSize: 11, textAlign: "center", lineHeight: 15 },
  // ── new curated tools layout ──
  featuredCard: { marginHorizontal: 20, borderRadius: 24, overflow: "hidden", marginBottom: 24 },
  featuredGrad: { padding: 24 },
  featuredBadgeWrap: {
    backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 12,
  },
  featuredBadge: { fontFamily: "Nunito_700Bold", fontSize: 11, color: "#fff", letterSpacing: 0.6 },
  featuredTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 28, color: "#fff", marginBottom: 8 },
  featuredDesc: { fontFamily: "Nunito_500Medium", fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 20, marginBottom: 16 },
  featuredCta: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.22)", alignSelf: "flex-start",
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
  },
  featuredCtaText: { fontFamily: "Nunito_700Bold", fontSize: 14, color: "#fff" },
  featuredEmoji: { position: "absolute", bottom: 16, right: 20, fontSize: 36 },
  toolCatTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 18, marginHorizontal: 20, marginBottom: 2 },
  toolCatSub: { fontFamily: "Nunito_400Regular", fontSize: 13, marginHorizontal: 20, marginBottom: 14, lineHeight: 18 },
  toolRow: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  toolHCard: { width: 150, borderRadius: 20, overflow: "hidden" },
  toolHGrad: { padding: 18, minHeight: 130, justifyContent: "flex-end" },
  toolHEmoji: { fontSize: 30, marginBottom: 10 },
  toolHTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 15, color: "#fff", marginBottom: 4 },
  toolHDesc: { fontFamily: "Nunito_500Medium", fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 15 },
  playBanner: { marginHorizontal: 20, borderRadius: 20, overflow: "hidden", marginBottom: 8 },
  playBannerGrad: { flexDirection: "row", alignItems: "center", padding: 20, gap: 12 },
  playBannerTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 18, color: "#fff", marginBottom: 4 },
  playBannerDesc: { fontFamily: "Nunito_500Medium", fontSize: 13, color: "rgba(255,255,255,0.75)" },
  playBannerRight: { alignItems: "center", gap: 10 },
  playBannerBtn: {
    backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 16, paddingVertical: 7, borderRadius: 14,
  },
  playBannerBtnText: { fontFamily: "Nunito_700Bold", fontSize: 13, color: "#fff" },
  resCard: { width: 150, borderRadius: 20, overflow: "hidden" },
  resGrad: { padding: 16, minHeight: 140, justifyContent: "flex-end" },
  courseHCard: { width: 175, borderRadius: 20, overflow: "hidden" },
  courseHGrad: { padding: 18, minHeight: 155, justifyContent: "flex-end" },
  courseHIconWrap: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  courseHTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 14, color: "#fff", marginBottom: 4 },
  courseHDesc: { fontFamily: "Nunito_400Regular", fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 15, marginBottom: 8 },
  courseHMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  courseHMetaText: { fontFamily: "Nunito_600SemiBold", fontSize: 10, color: "rgba(255,255,255,0.75)" },
  courseHMetaDot: { fontFamily: "Nunito_700Bold", fontSize: 10, color: "rgba(255,255,255,0.5)" },
});
