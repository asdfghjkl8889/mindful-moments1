import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { storage, WeekCourseProgress } from "@/lib/storage";

interface Session {
  id: string;
  time: string;
  timeIcon: string;
  timeColor: string;
  title: string;
  duration: string;
  description: string;
  type: "meditation" | "meal" | "exercise" | "environment" | "mindset";
}

interface DayPlan {
  day: number;
  theme: string;
  themeColor: string;
  gradientColors: [string, string];
  sessions: Session[];
}

const WEEK_PLAN: DayPlan[] = [
  {
    day: 1,
    theme: "Awakening",
    themeColor: "#FF8A65",
    gradientColors: ["#FFE0B2", "#FFFFFF"],
    sessions: [
      { id: "d1_sunrise", time: "Sunrise (6–7am)", timeIcon: "sunny", timeColor: "#FF8A65", title: "Morning Breath Meditation", duration: "10 min", description: "Sit quietly, close your eyes, and follow the natural rhythm of your breath. Notice each inhale as a new beginning. Set an intention for your day with kindness.", type: "meditation" },
      { id: "d1_meal1", time: "Breakfast", timeIcon: "restaurant", timeColor: "#66BB6A", title: "Nourishing Breakfast", duration: "20 min", description: "Oatmeal with berries, a handful of walnuts, and green tea. Eat slowly — put your fork down between bites. Taste each spoonful.", type: "meal" },
      { id: "d1_midday", time: "Midday (12–1pm)", timeIcon: "partly-sunny", timeColor: "#FFD54F", title: "Mindful Walking", duration: "15 min", description: "Walk outside at a slow, steady pace. Feel each footstep. Notice five things around you — colors, sounds, textures. Leave your phone behind.", type: "exercise" },
      { id: "d1_mid_afternoon", time: "Mid-Afternoon (3pm)", timeIcon: "leaf", timeColor: "#4DB6AC", title: "Body Scan Check-In", duration: "8 min", description: "Sit comfortably, close your eyes, and slowly scan from your feet to your head. Release any tension you find. Breathe into tight areas.", type: "meditation" },
      { id: "d1_env", time: "Afternoon", timeIcon: "home", timeColor: "#B39DDB", title: "Declutter One Space", duration: "15 min", description: "Choose one small area — a desk, a drawer, a shelf. Clear it completely. A tidy environment signals calm to your brain. Keep only what you love.", type: "environment" },
      { id: "d1_sunset", time: "Sunset (6–7pm)", timeIcon: "partly-sunny-outline", timeColor: "#FF8A80", title: "Gratitude Reflection", duration: "10 min", description: "Write down 3 things that went well today, no matter how small. Pause on each one and really feel the gratitude. This rewires your brain toward positivity.", type: "mindset" },
      { id: "d1_dinner", time: "Dinner", timeIcon: "restaurant", timeColor: "#66BB6A", title: "Plant-Rich Dinner", duration: "30 min", description: "Grilled salmon or tofu with roasted sweet potato and steamed broccoli. Eat at the table, without screens. Chew thoroughly.", type: "meal" },
      { id: "d1_evening", time: "Evening (9pm)", timeIcon: "moon", timeColor: "#5C6BC0", title: "Wind-Down Meditation", duration: "12 min", description: "Lie down comfortably. Breathe in for 4 counts, hold for 4, out for 8. Let thoughts drift like clouds. Invite sleep gently.", type: "meditation" },
    ],
  },
  {
    day: 2,
    theme: "Grounding",
    themeColor: "#66BB6A",
    gradientColors: ["#E8F5E9", "#FFFFFF"],
    sessions: [
      { id: "d2_sunrise", time: "Sunrise (6–7am)", timeIcon: "sunny", timeColor: "#FF8A65", title: "5-Senses Morning Practice", duration: "10 min", description: "Before rising, notice 5 things you can hear, 4 you can feel (sheets, air), 3 smells, 2 sights, 1 taste. Ground yourself in the present moment before the day begins.", type: "meditation" },
      { id: "d2_meal1", time: "Breakfast", timeIcon: "restaurant", timeColor: "#66BB6A", title: "Protein-Power Breakfast", duration: "20 min", description: "Greek yogurt parfait with banana, chia seeds, and honey. Or 2 eggs with spinach and whole-grain toast. Avoid rushing — enjoy each bite.", type: "meal" },
      { id: "d2_exercise", time: "Morning", timeIcon: "fitness", timeColor: "#FF8A65", title: "Gentle Yoga Stretches", duration: "20 min", description: "Try cat-cow, child's pose, forward fold, and warrior pose. Focus on your breath synchronizing with movement. No rush, no competition.", type: "exercise" },
      { id: "d2_midday", time: "Midday (12–1pm)", timeIcon: "partly-sunny", timeColor: "#FFD54F", title: "Loving-Kindness Meditation", duration: "12 min", description: "Silently repeat: 'May I be happy. May I be healthy. May I be at peace.' Then extend this to someone you love, then a neutral person, then someone difficult.", type: "meditation" },
      { id: "d2_mid_afternoon", time: "Mid-Afternoon (3pm)", timeIcon: "leaf", timeColor: "#4DB6AC", title: "Thought Journal", duration: "10 min", description: "Write one negative thought you had today. Then write three pieces of evidence AGAINST it. Challenge the thought — is it really true? What would you tell a friend?", type: "mindset" },
      { id: "d2_env", time: "Afternoon", timeIcon: "home", timeColor: "#B39DDB", title: "Add a Plant or Nature Element", duration: "10 min", description: "Place a plant, a stone, or a bowl of water somewhere you spend time. Nature elements lower cortisol. Open a window for fresh air.", type: "environment" },
      { id: "d2_sunset", time: "Sunset (6–7pm)", timeIcon: "partly-sunny-outline", timeColor: "#FF8A80", title: "Breathwork Session", duration: "10 min", description: "Practice box breathing: Inhale 4 counts, hold 4, exhale 4, hold 4. Repeat 6 times. This activates your parasympathetic nervous system.", type: "meditation" },
      { id: "d2_evening", time: "Evening (9pm)", timeIcon: "moon", timeColor: "#5C6BC0", title: "Digital Detox Hour", duration: "60 min", description: "No screens for one hour before bed. Read a physical book, take a warm bath, or do light stretching. Let your mind decompress naturally.", type: "environment" },
    ],
  },
  {
    day: 3,
    theme: "Clarity",
    themeColor: "#42A5F5",
    gradientColors: ["#E3F2FD", "#FFFFFF"],
    sessions: [
      { id: "d3_sunrise", time: "Sunrise (6–7am)", timeIcon: "sunny", timeColor: "#FF8A65", title: "Morning Journaling", duration: "15 min", description: "Write 3 pages of stream-of-consciousness — no editing, no judgment. This 'morning pages' technique clears mental clutter and reveals what truly matters to you.", type: "mindset" },
      { id: "d3_meal1", time: "Breakfast", timeIcon: "restaurant", timeColor: "#66BB6A", title: "Brain-Boosting Breakfast", duration: "20 min", description: "Blueberry smoothie with spinach, flaxseeds, and almond milk. Or avocado toast with an egg. Omega-3s and antioxidants support mental clarity.", type: "meal" },
      { id: "d3_midday", time: "Midday (12–1pm)", timeIcon: "partly-sunny", timeColor: "#FFD54F", title: "Focus Meditation", duration: "15 min", description: "Choose a single object — a candle, a stone, or a point on the wall. Keep your full attention there. When your mind wanders, gently return without judgment.", type: "meditation" },
      { id: "d3_exercise", time: "Mid-Morning", timeIcon: "fitness", timeColor: "#FF8A65", title: "30-Minute Walk or Cycle", duration: "30 min", description: "Moderate cardio increases BDNF, the brain's growth hormone. Walk briskly or cycle. Notice your environment. Leave your earbuds out for 10 minutes.", type: "exercise" },
      { id: "d3_mid_afternoon", time: "Mid-Afternoon (3pm)", timeIcon: "leaf", timeColor: "#4DB6AC", title: "Cognitive Reframing Practice", duration: "12 min", description: "Identify one worry. Ask: Is this fact or opinion? Is it in my control? What's the best/worst/most likely outcome? Write a balanced, realistic perspective.", type: "mindset" },
      { id: "d3_sunset", time: "Sunset (6–7pm)", timeIcon: "partly-sunny-outline", timeColor: "#FF8A80", title: "Nature Sit Spot", duration: "15 min", description: "Find a spot outdoors — a bench, garden, or window. Sit still for 15 minutes and simply observe nature. No phone. Let thoughts settle like sediment in water.", type: "meditation" },
      { id: "d3_dinner", time: "Dinner", timeIcon: "restaurant", timeColor: "#66BB6A", title: "Anti-Inflammatory Dinner", duration: "30 min", description: "Turmeric lentil soup with whole-grain bread, or quinoa bowl with roasted vegetables and tahini. These foods reduce inflammation linked to depression.", type: "meal" },
      { id: "d3_evening", time: "Evening (9pm)", timeIcon: "moon", timeColor: "#5C6BC0", title: "Progressive Muscle Relaxation", duration: "15 min", description: "Tense each muscle group for 5 seconds, then release. Start at your feet, move up to your face. Feel the contrast between tension and release.", type: "meditation" },
    ],
  },
  {
    day: 4,
    theme: "Compassion",
    themeColor: "#FF8A80",
    gradientColors: ["#FCE4EC", "#FFFFFF"],
    sessions: [
      { id: "d4_sunrise", time: "Sunrise (6–7am)", timeIcon: "sunny", timeColor: "#FF8A65", title: "Self-Compassion Meditation", duration: "15 min", description: "Place your hand on your heart. Say 'I am doing my best.' Breathe love into yourself. Acknowledge that suffering is part of being human — you are not alone.", type: "meditation" },
      { id: "d4_meal1", time: "Breakfast", timeIcon: "restaurant", timeColor: "#66BB6A", title: "Mood-Lifting Breakfast", duration: "20 min", description: "Whole-grain pancakes with banana and dark chocolate chips, or a fruit salad with a small handful of almonds. Serotonin is produced partly from tryptophan-rich foods.", type: "meal" },
      { id: "d4_exercise", time: "Morning", timeIcon: "fitness", timeColor: "#FF8A65", title: "Dance or Free Movement", duration: "20 min", description: "Put on your favorite songs and move freely. No choreography needed. Dance releases endorphins and shakes loose emotional tension held in the body.", type: "exercise" },
      { id: "d4_midday", time: "Midday (12–1pm)", timeIcon: "partly-sunny", timeColor: "#FFD54F", title: "Acts of Kindness Practice", duration: "15 min", description: "Do one unexpected kind act — a message to a friend, a compliment to a stranger, or a donation. Compassion for others is medicine for your own mind.", type: "mindset" },
      { id: "d4_mid_afternoon", time: "Mid-Afternoon (3pm)", timeIcon: "leaf", timeColor: "#4DB6AC", title: "Guided Visualization", duration: "12 min", description: "Close your eyes. Visualize a peaceful place — a forest, beach, or garden. Add details: light, sounds, smells. Rest here for 10 minutes. Your brain treats it as real.", type: "meditation" },
      { id: "d4_env", time: "Afternoon", timeIcon: "home", timeColor: "#B39DDB", title: "Create a Calm Corner", duration: "20 min", description: "Designate one small corner of your home as your peace space. Add a candle, cushion, or calming object. This becomes your brain's anchor for relaxation.", type: "environment" },
      { id: "d4_sunset", time: "Sunset (6–7pm)", timeIcon: "partly-sunny-outline", timeColor: "#FF8A80", title: "Forgiveness Reflection", duration: "15 min", description: "Write about something you're holding against yourself or another. Forgiveness isn't condoning — it's releasing the weight you carry. Write: 'I release this now.'", type: "mindset" },
      { id: "d4_evening", time: "Evening (9pm)", timeIcon: "moon", timeColor: "#5C6BC0", title: "Yoga Nidra Sleep", duration: "20 min", description: "Lie still and follow a body-rotation practice: bring your awareness to each part of the body in sequence. This state between waking and sleeping is deeply restorative.", type: "meditation" },
    ],
  },
  {
    day: 5,
    theme: "Strength",
    themeColor: "#FF6B6B",
    gradientColors: ["#FFEBEE", "#FFFFFF"],
    sessions: [
      { id: "d5_sunrise", time: "Sunrise (6–7am)", timeIcon: "sunny", timeColor: "#FF8A65", title: "Power Affirmations", duration: "10 min", description: "Stand tall, breathe deeply, and say aloud: 'I am capable. I am resilient. I handle challenges with grace.' Repeat 10 times. Feel the words, don't just say them.", type: "mindset" },
      { id: "d5_meal1", time: "Breakfast", timeIcon: "restaurant", timeColor: "#66BB6A", title: "Energy Breakfast", duration: "20 min", description: "Steel-cut oatmeal with walnuts, flaxseed, and cinnamon. Or a savory bowl with eggs, black beans, and salsa. Complex carbs provide sustained mental energy.", type: "meal" },
      { id: "d5_exercise", time: "Morning", timeIcon: "fitness", timeColor: "#FF8A65", title: "Strength Training or Resistance", duration: "30 min", description: "Bodyweight exercises: squats, push-ups, lunges, plank. Do 3 sets of 10. Physical strength and mental strength are deeply connected.", type: "exercise" },
      { id: "d5_midday", time: "Midday (12–1pm)", timeIcon: "partly-sunny", timeColor: "#FFD54F", title: "Mindful Eating Timer Session", duration: "20 min", description: "Use the mindful eating timer during your lunch. Put your phone away. Eat half as fast as usual. Notice flavors, textures, and the moment of fullness.", type: "meal" },
      { id: "d5_mid_afternoon", time: "Mid-Afternoon (3pm)", timeIcon: "leaf", timeColor: "#4DB6AC", title: "Challenging Negative Thoughts", duration: "15 min", description: "Use the Thought Record: Write the thought, rate its intensity, list evidence for and against it, create a balanced alternative, and rerate how you feel.", type: "mindset" },
      { id: "d5_sunset", time: "Sunset (6–7pm)", timeIcon: "partly-sunny-outline", timeColor: "#FF8A80", title: "Sunset Breathing", duration: "10 min", description: "Watch the sky change (or imagine it). With each color shift, let go of one worry. Breathe in the colors. Exhale what no longer serves you.", type: "meditation" },
      { id: "d5_env", time: "Evening", timeIcon: "home", timeColor: "#B39DDB", title: "Optimize Your Sleep Space", duration: "15 min", description: "Lower room temperature to 65–68°F. Use blackout curtains or an eye mask. Remove electronics from the bedroom. Your sleep environment is your recovery zone.", type: "environment" },
      { id: "d5_evening", time: "Evening (9pm)", timeIcon: "moon", timeColor: "#5C6BC0", title: "Anchor Breath Meditation", duration: "12 min", description: "Focus entirely on your breath for 12 minutes. When thoughts arise, label them 'thinking' and return to breath. Each return is one rep of mental strength training.", type: "meditation" },
    ],
  },
  {
    day: 6,
    theme: "Connection",
    themeColor: "#BA68C8",
    gradientColors: ["#F3E5F5", "#FFFFFF"],
    sessions: [
      { id: "d6_sunrise", time: "Sunrise (6–7am)", timeIcon: "sunny", timeColor: "#FF8A65", title: "Intentions for Connection", duration: "10 min", description: "Set an intention to be truly present with every person you encounter today. Meditate on what it feels like to be fully listened to — then offer that to others.", type: "meditation" },
      { id: "d6_meal1", time: "Breakfast", timeIcon: "restaurant", timeColor: "#66BB6A", title: "Share a Meal", duration: "30 min", description: "Eat breakfast with someone — a family member, friend, or neighbor. Eat slowly. Put devices away. Real conversation over a meal is nourishment beyond nutrition.", type: "meal" },
      { id: "d6_exercise", time: "Morning", timeIcon: "fitness", timeColor: "#FF8A65", title: "Partner or Group Activity", duration: "30 min", description: "Go for a walk with someone, try a group fitness class, or play a sport. Social exercise doubles the mental health benefit of solo exercise.", type: "exercise" },
      { id: "d6_midday", time: "Midday (12–1pm)", timeIcon: "partly-sunny", timeColor: "#FFD54F", title: "Mindful Listening Practice", duration: "15 min", description: "In your next conversation, practice listening without planning your reply. Notice the speaker's emotions, not just their words. Reflect back what you heard.", type: "mindset" },
      { id: "d6_mid_afternoon", time: "Mid-Afternoon (3pm)", timeIcon: "leaf", timeColor: "#4DB6AC", title: "Heart-Opening Meditation", duration: "12 min", description: "Breathe in through your heart. On the exhale, send warmth to someone who needs it. Repeat for 3 people. Connection starts within and radiates outward.", type: "meditation" },
      { id: "d6_env", time: "Afternoon", timeIcon: "home", timeColor: "#B39DDB", title: "Add Light & Scent to Your Space", duration: "15 min", description: "Open blinds to maximize natural light. Try lavender, eucalyptus, or citrus essential oils — these scents measurably reduce anxiety and improve mood.", type: "environment" },
      { id: "d6_sunset", time: "Sunset (6–7pm)", timeIcon: "partly-sunny-outline", timeColor: "#FF8A80", title: "Write a Letter of Appreciation", duration: "15 min", description: "Write a heartfelt note to someone who has positively impacted your life. You don't need to send it — the act of writing rewires your brain toward gratitude.", type: "mindset" },
      { id: "d6_evening", time: "Evening (9pm)", timeIcon: "moon", timeColor: "#5C6BC0", title: "Full-Body Release Meditation", duration: "15 min", description: "Starting at the crown of your head, release tension downward through your body with each exhale. By the time you reach your feet, feel completely heavy and at peace.", type: "meditation" },
    ],
  },
  {
    day: 7,
    theme: "Integration",
    themeColor: "#26A69A",
    gradientColors: ["#E0F7FA", "#FFFFFF"],
    sessions: [
      { id: "d7_sunrise", time: "Sunrise (6–7am)", timeIcon: "sunny", timeColor: "#FF8A65", title: "Week Review Meditation", duration: "20 min", description: "Sit quietly and journey back through the week. What did you learn? What shifted? What do you want to carry forward? End by setting intentions for the next 7 days.", type: "meditation" },
      { id: "d7_meal1", time: "Breakfast", timeIcon: "restaurant", timeColor: "#66BB6A", title: "Celebrate with a Special Breakfast", duration: "30 min", description: "Make something special — fresh fruit bowl, homemade granola, or your favorite healthy meal. You've completed a full week. Savor every bite with appreciation.", type: "meal" },
      { id: "d7_exercise", time: "Morning", timeIcon: "fitness", timeColor: "#FF8A65", title: "Gentle Full-Body Flow", duration: "30 min", description: "A gentle yoga or pilates flow incorporating everything: breathwork, strength, flexibility, balance. Treat this as a celebration of your body and all it does.", type: "exercise" },
      { id: "d7_midday", time: "Midday (12–1pm)", timeIcon: "partly-sunny", timeColor: "#FFD54F", title: "Mindfulness in Nature", duration: "30 min", description: "Spend 30 minutes outdoors in a natural setting. Sit by water, under trees, or on grass. Research shows 30 minutes in nature reduces cortisol by 21%.", type: "meditation" },
      { id: "d7_mid_afternoon", time: "Mid-Afternoon (3pm)", timeIcon: "leaf", timeColor: "#4DB6AC", title: "Future Self Visualization", duration: "15 min", description: "Close your eyes and meet your future self — 6 months from now, having continued this practice. What do they look like? How do they feel? What advice do they give you?", type: "mindset" },
      { id: "d7_env", time: "Afternoon", timeIcon: "home", timeColor: "#B39DDB", title: "Design Your Ongoing Ritual", duration: "20 min", description: "Choose 3 daily practices from this week that resonated most. Write them down as your personal morning, midday, and evening ritual. Commit to 30 more days.", type: "environment" },
      { id: "d7_sunset", time: "Sunset (6–7pm)", timeIcon: "partly-sunny-outline", timeColor: "#FF8A80", title: "Full Gratitude Practice", duration: "15 min", description: "Write 10 things you're grateful for — specific, sensory, and varied. Research shows 10 gratitudes creates a stronger effect than 3. Let each one truly land.", type: "mindset" },
      { id: "d7_dinner", time: "Dinner", timeIcon: "restaurant", timeColor: "#66BB6A", title: "Celebration Dinner", duration: "45 min", description: "Cook a nourishing meal you love. Eat slowly, savor every bite. End the week with the same presence and awareness you've been practicing all week.", type: "meal" },
      { id: "d7_evening", time: "Evening (9pm)", timeIcon: "moon", timeColor: "#5C6BC0", title: "Loving-Kindness for All Beings", duration: "20 min", description: "Begin with yourself, expand to loved ones, then your community, then all beings on earth. End with: 'May all beings everywhere be happy and free from suffering.'", type: "meditation" },
    ],
  },
];

const SESSION_TYPE_COLORS: Record<Session["type"], { bg: string; icon: string }> = {
  meditation: { bg: "#E0F7FA", icon: "#4DB6AC" },
  meal: { bg: "#E8F5E9", icon: "#66BB6A" },
  exercise: { bg: "#FFF3E0", icon: "#FF8A65" },
  environment: { bg: "#F3E5F5", icon: "#B39DDB" },
  mindset: { bg: "#FCE4EC", icon: "#FF8A80" },
};

const SESSION_TYPE_LABELS: Record<Session["type"], string> = {
  meditation: "Meditation",
  meal: "Healthy Meal",
  exercise: "Exercise",
  environment: "Environment",
  mindset: "Mindset",
};

export default function CourseWeekScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [progress, setProgress] = useState<WeekCourseProgress>({ completedSessions: [], startedDate: "" });
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  const speakSession = (session: Session) => {
    Speech.stop();
    if (speakingId === session.id) {
      setSpeakingId(null);
      return;
    }
    setSpeakingId(session.id);
    const script = `${session.title}. ${session.description}`;
    Speech.speak(script, {
      rate: 0.82,
      pitch: 1.0,
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  const loadProgress = useCallback(async () => {
    const p = await storage.getWeekCourseProgress();
    setProgress(p);
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const toggleSession = async (sessionId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    let updated: WeekCourseProgress;
    if (progress.completedSessions.includes(sessionId)) {
      updated = { ...progress, completedSessions: progress.completedSessions.filter((s) => s !== sessionId) };
    } else {
      const startedDate = progress.startedDate || new Date().toISOString().split("T")[0];
      updated = { ...progress, completedSessions: [...progress.completedSessions, sessionId], startedDate };
    }
    setProgress(updated);
    await storage.saveWeekCourseProgress(updated);
  };

  const totalSessions = WEEK_PLAN.reduce((acc, d) => acc + d.sessions.length, 0);
  const completedCount = progress.completedSessions.length;
  const overallProgress = totalSessions > 0 ? completedCount / totalSessions : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>7-Day Wellness Journey</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {completedCount}/{totalSessions} sessions complete
          </Text>
        </View>
      </View>

      <View style={[styles.overallProgressBar, { marginHorizontal: 20, marginBottom: 12 }]}>
        <View style={[styles.overallProgressBg, { backgroundColor: colors.cardBorder }]}>
          <View style={[styles.overallProgressFill, { width: `${Math.round(overallProgress * 100)}%` }]} />
        </View>
        <Text style={[styles.overallProgressText, { color: colors.textSecondary }]}>
          {Math.round(overallProgress * 100)}% complete
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32, paddingHorizontal: 20 }}
      >
        {WEEK_PLAN.map((day, di) => {
          const dayCompleted = day.sessions.filter((s) => progress.completedSessions.includes(s.id)).length;
          const isExpanded = expandedDay === day.day;

          return (
            <Animated.View
              key={day.day}
              entering={Platform.OS !== "web" ? FadeInDown.delay(di * 60).duration(400) : undefined}
              style={{ marginBottom: 12 }}
            >
              <Pressable
                onPress={() => setExpandedDay(isExpanded ? null : day.day)}
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              >
                <LinearGradient
                  colors={day.gradientColors}
                  style={[styles.dayHeader, { borderColor: day.themeColor + "30" }]}
                >
                  <View style={[styles.dayNum, { backgroundColor: day.themeColor }]}>
                    <Text style={styles.dayNumText}>Day {day.day}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dayTheme, { color: day.themeColor }]}>{day.theme}</Text>
                    <Text style={[styles.dayProgress, { color: colors.textSecondary }]}>
                      {dayCompleted}/{day.sessions.length} sessions
                    </Text>
                  </View>
                  <View style={styles.dayRight}>
                    {dayCompleted === day.sessions.length && (
                      <Ionicons name="checkmark-circle" size={22} color={day.themeColor} />
                    )}
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={colors.textTertiary}
                    />
                  </View>
                </LinearGradient>
              </Pressable>

              {isExpanded && (
                <View style={[styles.sessionsContainer, { borderColor: colors.cardBorder }]}>
                  {day.sessions.map((session, si) => {
                    const done = progress.completedSessions.includes(session.id);
                    const typeStyle = SESSION_TYPE_COLORS[session.type];
                    return (
                      <View key={session.id} style={[styles.sessionRow, si < day.sessions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder }]}>
                        <View style={styles.sessionLeft}>
                          <View style={[styles.timeRow]}>
                            <Ionicons name={session.timeIcon as any} size={12} color={session.timeColor} />
                            <Text style={[styles.sessionTime, { color: session.timeColor }]}>{session.time}</Text>
                          </View>
                          <View style={[styles.typeTag, { backgroundColor: typeStyle.bg }]}>
                            <Text style={[styles.typeTagText, { color: typeStyle.icon }]}>
                              {SESSION_TYPE_LABELS[session.type]}
                            </Text>
                          </View>
                          <Text style={[styles.sessionTitle, { color: colors.text }]}>{session.title}</Text>
                          <Text style={[styles.sessionDuration, { color: colors.textTertiary }]}>{session.duration}</Text>
                          <Text style={[styles.sessionDesc, { color: colors.textSecondary }]}>{session.description}</Text>
                          <Pressable
                            onPress={() => speakSession(session)}
                            style={[styles.listenBtn, { backgroundColor: speakingId === session.id ? typeStyle.icon + "20" : colors.cardBorder + "60" }]}
                          >
                            <Ionicons
                              name={speakingId === session.id ? "stop-circle" : "volume-high"}
                              size={13}
                              color={speakingId === session.id ? typeStyle.icon : colors.textSecondary}
                            />
                            <Text style={[styles.listenBtnText, { color: speakingId === session.id ? typeStyle.icon : colors.textSecondary }]}>
                              {speakingId === session.id ? "Stop" : "Listen"}
                            </Text>
                          </Pressable>
                        </View>
                        <Pressable
                          onPress={() => toggleSession(session.id)}
                          style={[
                            styles.checkBtn,
                            { borderColor: done ? typeStyle.icon : colors.cardBorder, backgroundColor: done ? typeStyle.icon : "transparent" },
                          ]}
                        >
                          {done && <Ionicons name="checkmark" size={14} color="#fff" />}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 8,
  },
  headerTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 20 },
  headerSub: { fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 1 },
  overallProgressBar: {},
  overallProgressBg: {
    height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 4,
  },
  overallProgressFill: {
    height: "100%", borderRadius: 4, backgroundColor: "#26A69A",
  },
  overallProgressText: { fontFamily: "Nunito_500Medium", fontSize: 11, textAlign: "right" },
  dayHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 16, borderWidth: 1,
  },
  dayNum: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  dayNumText: { fontFamily: "Nunito_800ExtraBold", fontSize: 13, color: "#fff" },
  dayTheme: { fontFamily: "Nunito_800ExtraBold", fontSize: 17 },
  dayProgress: { fontFamily: "Nunito_400Regular", fontSize: 12, marginTop: 2 },
  dayRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  sessionsContainer: {
    borderWidth: 1, borderRadius: 16, overflow: "hidden",
    marginTop: -4,
  },
  sessionRow: {
    flexDirection: "row", alignItems: "flex-start",
    padding: 16, gap: 12,
  },
  sessionLeft: { flex: 1, gap: 4 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  sessionTime: { fontFamily: "Nunito_600SemiBold", fontSize: 11 },
  typeTag: {
    alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  typeTagText: { fontFamily: "Nunito_600SemiBold", fontSize: 10 },
  sessionTitle: { fontFamily: "Nunito_700Bold", fontSize: 15 },
  sessionDuration: { fontFamily: "Nunito_500Medium", fontSize: 11 },
  sessionDesc: { fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 17, marginTop: 4 },
  checkBtn: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2,
    alignItems: "center", justifyContent: "center", marginTop: 4,
  },
  listenBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, marginTop: 6,
  },
  listenBtnText: { fontFamily: "Nunito_600SemiBold", fontSize: 11 },
});
