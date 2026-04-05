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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {RESOURCE_CATEGORIES.map((c) => (
              <Pressable
                key={c.key}
                onPress={() => {
                  setResourceCategory(c.key);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: resourceCategory === c.key ? colors.tint + "20" : colors.card,
                    borderColor: resourceCategory === c.key ? colors.tint : colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name={c.icon as any}
                  size={14}
                  color={resourceCategory === c.key ? colors.tint : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: resourceCategory === c.key ? colors.tint : colors.textSecondary },
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.resourceList}>
            {filteredResources.map((r, i) => (
              <ResourceCard key={i} resource={r} colors={colors} />
            ))}
          </View>
        </Animated.View>
      )}

      {activeSection === "courses" && !selectedCourse && (
        <Animated.View entering={Platform.OS !== "web" ? FadeInDown.duration(400) : undefined}>
          <View style={styles.courseList}>
            {COURSES.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                colors={colors}
                onPress={() => {
                  setSelectedCourse(c);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
              />
            ))}
          </View>
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
          <View style={styles.toolsGrid}>
            {[
              { title: "Challenges", desc: "Daily missions, XP & badges", icon: "trophy", color: "#FFD54F", bg: "#FFF8E1", route: "/challenges" },
              { title: "7-Day Course", desc: "Full wellness week program", icon: "calendar", color: "#4DB6AC", bg: "#E0F7FA", route: "/course-week" },
              { title: "Overthinking", desc: "Break thought loops & find calm", icon: "sync-circle", color: "#FF7043", bg: "#FBE9E7", route: "/overthinking" },
              { title: "Anger Management", desc: "Cool down, log & understand anger", icon: "flame", color: "#EF5350", bg: "#FFEBEE", route: "/anger-management" },
              { title: "Reframe Thoughts", desc: "CBT thought challenging tool", icon: "bulb", color: "#FF8A80", bg: "#FCE4EC", route: "/negative-thoughts" },
              { title: "Mood Garden", desc: "Your emotions as a living garden", icon: "flower", color: "#66BB6A", bg: "#E8F5E9", route: "/mood-garden" },
              { title: "Quick Calm", desc: "60-second mindfulness resets", icon: "flash", color: "#B39DDB", bg: "#F3E5F5", route: "/quick-calm" },
              { title: "Mindful Games", desc: "Breathing, memory & focus games", icon: "game-controller", color: "#FF8A65", bg: "#FBE9E7", route: "/games" },
            ].map((tool, i) => (
              <Animated.View
                key={tool.title}
                entering={Platform.OS !== "web" ? FadeInDown.delay(i * 60).duration(400) : undefined}
                style={styles.toolCard}
              >
                <Pressable
                  onPress={() => { router.push(tool.route as any); if (Platform.OS !== "web") Haptics.selectionAsync(); }}
                  style={({ pressed }) => [
                    styles.toolCardInner,
                    { backgroundColor: tool.bg, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View style={[styles.toolIconWrap, { backgroundColor: tool.color + "30" }]}>
                    <Ionicons name={tool.icon as any} size={28} color={tool.color} />
                  </View>
                  <Text style={[styles.toolTitle, { color: "#1A1A1A" }]}>{tool.title}</Text>
                  <Text style={[styles.toolDesc, { color: "#616161" }]}>{tool.desc}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
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
});
