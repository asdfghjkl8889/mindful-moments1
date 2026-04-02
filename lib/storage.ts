import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  MOODS: "mindful_moods",
  JOURNALS: "mindful_journals",
  MEDITATIONS: "mindful_meditations",
  STREAK: "mindful_streak",
  PROFILE: "mindful_profile",
  EATING_LOG: "mindful_eating",
  GAME_SCORES: "mindful_game_scores",
  CHALLENGES: "mindful_challenges",
  WEEK_COURSE: "mindful_week_course",
};

export interface MoodEntry {
  id: string;
  mood: "happy" | "good" | "neutral" | "sad" | "stressed";
  note: string;
  timestamp: number;
  date: string;
}

export interface JournalEntry {
  id: string;
  gratitude: string[];
  reflection: string;
  photoUri: string | null;
  timestamp: number;
  date: string;
}

export interface MeditationSession {
  id: string;
  duration: number;
  completed: boolean;
  timestamp: number;
  date: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalSessions: number;
  totalMinutes: number;
}

export interface ProfileData {
  name: string;
  avatar: string;
}

export interface EatingEntry {
  id: string;
  meal: string;
  hunger: number;
  fullness: number;
  mindful: boolean;
  notes: string;
  timestamp: number;
  date: string;
}

export interface GameScore {
  id: string;
  game: string;
  score: number;
  timestamp: number;
}

export interface ChallengeData {
  xp: number;
  completedToday: string[];
  badgesEarned: string[];
  lastResetDate: string;
}

export interface WeekCourseProgress {
  completedSessions: string[];
  startedDate: string;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getDateStr(d?: Date): string {
  const date = d || new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export type QuoteCategory = "mindfulness" | "peace" | "strength" | "gratitude" | "wisdom" | "nature" | "love";

export interface Quote {
  text: string;
  author: string;
  category: QuoteCategory;
}

export const QUOTE_CATEGORIES: { key: QuoteCategory; label: string; icon: string; color: string }[] = [
  { key: "mindfulness", label: "Mindfulness", icon: "leaf", color: "#4DB6AC" },
  { key: "peace", label: "Peace", icon: "water", color: "#81D4FA" },
  { key: "strength", label: "Strength", icon: "fitness", color: "#FF8A65" },
  { key: "gratitude", label: "Gratitude", icon: "heart", color: "#FF8A80" },
  { key: "wisdom", label: "Wisdom", icon: "bulb", color: "#FFD54F" },
  { key: "nature", label: "Nature", icon: "flower", color: "#66BB6A" },
  { key: "love", label: "Love", icon: "sparkles", color: "#B39DDB" },
];

export const QUOTES: Quote[] = [
  { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh", category: "mindfulness" },
  { text: "In today's rush, we all think too much, seek too much, want too much, and forget about the joy of just being.", author: "Eckhart Tolle", category: "mindfulness" },
  { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott", category: "peace" },
  { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh", category: "mindfulness" },
  { text: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James", category: "strength" },
  { text: "Mindfulness is a way of befriending ourselves and our experience.", author: "Jon Kabat-Zinn", category: "mindfulness" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha", category: "wisdom" },
  { text: "Be where you are, not where you think you should be.", author: "Unknown", category: "mindfulness" },
  { text: "The mind is everything. What you think you become.", author: "Buddha", category: "wisdom" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha", category: "peace" },
  { text: "You yourself, as much as anybody in the entire universe, deserve your love and affection.", author: "Buddha", category: "love" },
  { text: "Breathe. Let go. And remind yourself that this very moment is the only one you know you have for sure.", author: "Oprah Winfrey", category: "mindfulness" },
  { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu", category: "nature" },
  { text: "Smile, breathe, and go slowly.", author: "Thich Nhat Hanh", category: "peace" },
  { text: "Every morning we are born again. What we do today is what matters most.", author: "Buddha", category: "wisdom" },
  { text: "The little things? The little moments? They aren't little.", author: "Jon Kabat-Zinn", category: "gratitude" },
  { text: "With every breath, the old moment is lost; a new moment arrives.", author: "Gautama Buddha", category: "mindfulness" },
  { text: "Respond; don't react. Listen; don't talk. Think; don't assume.", author: "Raji Lukkoor", category: "wisdom" },
  { text: "You can't stop the waves, but you can learn to surf.", author: "Jon Kabat-Zinn", category: "strength" },
  { text: "Be happy in the moment, that's enough. Each moment is all we need, not more.", author: "Mother Teresa", category: "peace" },
  { text: "The only way to live is by accepting each minute as an unrepeatable miracle.", author: "Tara Brach", category: "mindfulness" },
  { text: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama", category: "wisdom" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", category: "strength" },
  { text: "Gratitude turns what we have into enough.", author: "Anonymous", category: "gratitude" },
  { text: "The earth has music for those who listen.", author: "William Shakespeare", category: "nature" },
  { text: "Look at the trees, look at the birds, look at the clouds, look at the stars.", author: "Osho", category: "nature" },
  { text: "Where there is love there is life.", author: "Mahatma Gandhi", category: "love" },
  { text: "The quieter you become, the more you can hear.", author: "Ram Dass", category: "peace" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", category: "strength" },
  { text: "Realize deeply that the present moment is all you have.", author: "Eckhart Tolle", category: "mindfulness" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", category: "wisdom" },
  { text: "Let go of the thoughts that don't make you strong.", author: "Karen Salmansohn", category: "strength" },
  { text: "If you want to conquer the anxiety of life, live in the moment, live in the breath.", author: "Amit Ray", category: "mindfulness" },
  { text: "Every day may not be good, but there is something good in every day.", author: "Alice Morse Earle", category: "gratitude" },
  { text: "When you arise in the morning, think of what a precious privilege it is to be alive.", author: "Marcus Aurelius", category: "gratitude" },
  { text: "The sun is a daily reminder that we too can rise again from the darkness.", author: "Sara Ajna", category: "nature" },
  { text: "He who lives in harmony with himself lives in harmony with the universe.", author: "Marcus Aurelius", category: "peace" },
  { text: "I am not what happened to me. I am what I choose to become.", author: "Carl Jung", category: "strength" },
  { text: "Love is the bridge between you and everything.", author: "Rumi", category: "love" },
  { text: "Let yourself be silently drawn by the strange pull of what you really love.", author: "Rumi", category: "love" },
  { text: "Your task is not to seek for love, but to find all the barriers within yourself that you have built against it.", author: "Rumi", category: "love" },
  { text: "The wound is the place where the light enters you.", author: "Rumi", category: "strength" },
  { text: "Be grateful for whoever comes, because each has been sent as a guide from beyond.", author: "Rumi", category: "gratitude" },
  { text: "Adopt the pace of nature: her secret is patience.", author: "Ralph Waldo Emerson", category: "nature" },
  { text: "In every walk with nature one receives far more than he seeks.", author: "John Muir", category: "nature" },
  { text: "The mind that is anxious about future events is miserable.", author: "Seneca", category: "peace" },
  { text: "Nothing is worth more than this day.", author: "Goethe", category: "mindfulness" },
  { text: "It is not enough to be busy. So are the ants. The question is: What are we busy about?", author: "Henry David Thoreau", category: "wisdom" },
  { text: "Silence is a source of great strength.", author: "Lao Tzu", category: "peace" },
  { text: "Life is available only in the present moment.", author: "Thich Nhat Hanh", category: "mindfulness" },
  { text: "What you are is what you have been. What you'll be is what you do now.", author: "Buddha", category: "wisdom" },
  { text: "The soul always knows what to do to heal itself. The challenge is to silence the mind.", author: "Caroline Myss", category: "wisdom" },
  { text: "If you are depressed you are living in the past. If you are anxious you are living in the future. If you are at peace you are living in the present.", author: "Lao Tzu", category: "peace" },
  { text: "Be kind whenever possible. It is always possible.", author: "Dalai Lama", category: "love" },
  { text: "Joy is not in things; it is in us.", author: "Richard Wagner", category: "gratitude" },
  { text: "Earth provides enough to satisfy every man's needs, but not every man's greed.", author: "Mahatma Gandhi", category: "nature" },
  { text: "I have decided to stick with love. Hate is too great a burden to bear.", author: "Martin Luther King Jr.", category: "love" },
  { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi", category: "strength" },
  { text: "Acknowledging the good that you already have in your life is the foundation for all abundance.", author: "Eckhart Tolle", category: "gratitude" },
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela", category: "strength" },
  { text: "Keep your face always toward the sunshine, and shadows will fall behind you.", author: "Walt Whitman", category: "nature" },
  { text: "To see a world in a grain of sand and heaven in a wildflower.", author: "William Blake", category: "nature" },
  { text: "We can never obtain peace in the outer world until we make peace with ourselves.", author: "Dalai Lama", category: "peace" },
  { text: "Wherever you go, there you are.", author: "Jon Kabat-Zinn", category: "mindfulness" },
  { text: "The purpose of life is not to be happy. It is to be useful, honorable, compassionate.", author: "Ralph Waldo Emerson", category: "wisdom" },
  { text: "When one door of happiness closes, another opens.", author: "Helen Keller", category: "strength" },
  { text: "Enjoy the little things, for one day you may look back and realize they were the big things.", author: "Robert Brault", category: "gratitude" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien", category: "wisdom" },
  { text: "The clearest way into the Universe is through a forest wilderness.", author: "John Muir", category: "nature" },
  { text: "Where there is great love, there are always miracles.", author: "Willa Cather", category: "love" },
  { text: "You are enough just as you are.", author: "Meghan Markle", category: "strength" },
  { text: "Gratitude is not only the greatest of virtues, but the parent of all others.", author: "Cicero", category: "gratitude" },
  { text: "Still water runs deep.", author: "Latin Proverb", category: "peace" },
  { text: "A loving heart is the truest wisdom.", author: "Charles Dickens", category: "love" },
  { text: "The secret of health for both mind and body is not to mourn for the past, nor to worry about the future.", author: "Buddha", category: "mindfulness" },
  { text: "Every flower must grow through dirt.", author: "Laurie Jean Sennott", category: "nature" },
  { text: "When you change the way you look at things, the things you look at change.", author: "Wayne Dyer", category: "wisdom" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb", category: "strength" },
  { text: "Gratitude makes sense of our past, brings peace for today, and creates a vision for tomorrow.", author: "Melody Beattie", category: "gratitude" },
  { text: "The best and most beautiful things in the world cannot be seen or even touched. They must be felt with the heart.", author: "Helen Keller", category: "love" },
  { text: "Water is the softest thing, yet it can penetrate mountains and earth.", author: "Lao Tzu", category: "nature" },
  { text: "Patience is the companion of wisdom.", author: "Saint Augustine", category: "wisdom" },
  { text: "If you want others to be happy, practice compassion. If you want to be happy, practice compassion.", author: "Dalai Lama", category: "love" },
  { text: "The greatest discovery of any generation is that a human being can alter his life by altering his attitude.", author: "William James", category: "strength" },
  { text: "There are only two ways to live your life. One is as though nothing is a miracle. The other is as though everything is.", author: "Albert Einstein", category: "gratitude" },
  { text: "One moment of patience may ward off great disaster. One moment of impatience may ruin a whole life.", author: "Chinese Proverb", category: "peace" },
  { text: "Look deep into nature, and then you will understand everything better.", author: "Albert Einstein", category: "nature" },
  { text: "Your calm mind is the ultimate weapon against your challenges.", author: "Bryant McGill", category: "peace" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle", category: "wisdom" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "strength" },
  { text: "Let us be grateful to the people who make us happy.", author: "Marcel Proust", category: "gratitude" },
  { text: "To love and be loved is to feel the sun from both sides.", author: "David Viscott", category: "love" },
  { text: "Everything has beauty, but not everyone sees it.", author: "Confucius", category: "nature" },
  { text: "Within you there is a stillness and a sanctuary to which you can retreat at any time.", author: "Hermann Hesse", category: "peace" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", category: "strength" },
  { text: "We tend to forget that happiness doesn't come as a result of getting something we don't have.", author: "Frederick Koenig", category: "gratitude" },
  { text: "Attention is the rarest and purest form of generosity.", author: "Simone Weil", category: "mindfulness" },
  { text: "Deep in their roots, all flowers keep the light.", author: "Theodore Roethke", category: "nature" },
  { text: "Compassion is the basis of morality.", author: "Arthur Schopenhauer", category: "love" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "strength" },
  { text: "The present moment is the only moment available to us, and it is the door to all moments.", author: "Thich Nhat Hanh", category: "mindfulness" },
];

export function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

export function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

export const LARRY_MESSAGES = [
  "Hey friend! Remember to take a deep breath today.",
  "You're doing amazing! Keep up the good work.",
  "Larry is proud of you for showing up today!",
  "Slow and steady wins the race - just like me!",
  "Take it one moment at a time. You've got this!",
  "Remember, even small steps count. I should know!",
  "Larry says: Don't forget to drink water today!",
  "Your mindfulness journey is beautiful. Keep going!",
  "Hey! Larry here. Have you smiled today?",
  "Every breath is a chance to begin again.",
  "Larry's tip: Put your phone down and look at the sky for a minute!",
  "You showed up today, and that's what matters most.",
];

export function getLarryMessage() {
  const hour = new Date().getHours();
  const index = (hour + new Date().getDate()) % LARRY_MESSAGES.length;
  return LARRY_MESSAGES[index];
}

export const EATING_TIPS = [
  { title: "Eat Slowly", description: "Put your fork down between bites. Chew each mouthful 20-30 times.", icon: "time" },
  { title: "Notice Colors", description: "Look at the colors on your plate. Appreciate the visual beauty of your food.", icon: "color-palette" },
  { title: "Smell Your Food", description: "Before eating, take a moment to inhale the aroma of your meal.", icon: "flower" },
  { title: "No Screens", description: "Turn off TV, phone, and computer during meals. Be present with your food.", icon: "phone-portrait" },
  { title: "Gratitude", description: "Thank the hands that prepared your food and the earth that grew it.", icon: "heart" },
  { title: "Hunger Check", description: "Before eating, rate your hunger 1-10. Eat when you're at 3-4, stop at 7.", icon: "analytics" },
  { title: "Texture Awareness", description: "Notice the texture of each bite - is it crunchy, smooth, chewy?", icon: "finger-print" },
  { title: "Small Portions", description: "Start with smaller portions. You can always get more if you're still hungry.", icon: "resize" },
];

export const storage = {
  async getMoods(): Promise<MoodEntry[]> {
    const raw = await AsyncStorage.getItem(KEYS.MOODS);
    return raw ? JSON.parse(raw) : [];
  },

  async addMood(mood: MoodEntry["mood"], note: string): Promise<MoodEntry> {
    const moods = await this.getMoods();
    const entry: MoodEntry = {
      id: generateId(),
      mood,
      note,
      timestamp: Date.now(),
      date: getDateStr(),
    };
    moods.unshift(entry);
    await AsyncStorage.setItem(KEYS.MOODS, JSON.stringify(moods));
    return entry;
  },

  async deleteMood(id: string): Promise<void> {
    const moods = await this.getMoods();
    const filtered = moods.filter((m) => m.id !== id);
    await AsyncStorage.setItem(KEYS.MOODS, JSON.stringify(filtered));
  },

  async getJournals(): Promise<JournalEntry[]> {
    const raw = await AsyncStorage.getItem(KEYS.JOURNALS);
    return raw ? JSON.parse(raw) : [];
  },

  async addJournal(
    gratitude: string[],
    reflection: string,
    photoUri: string | null,
  ): Promise<JournalEntry> {
    const journals = await this.getJournals();
    const entry: JournalEntry = {
      id: generateId(),
      gratitude,
      reflection,
      photoUri,
      timestamp: Date.now(),
      date: getDateStr(),
    };
    journals.unshift(entry);
    await AsyncStorage.setItem(KEYS.JOURNALS, JSON.stringify(journals));
    return entry;
  },

  async deleteJournal(id: string): Promise<void> {
    const journals = await this.getJournals();
    const filtered = journals.filter((j) => j.id !== id);
    await AsyncStorage.setItem(KEYS.JOURNALS, JSON.stringify(filtered));
  },

  async getMeditations(): Promise<MeditationSession[]> {
    const raw = await AsyncStorage.getItem(KEYS.MEDITATIONS);
    return raw ? JSON.parse(raw) : [];
  },

  async addMeditation(
    duration: number,
    completed: boolean,
  ): Promise<MeditationSession> {
    const sessions = await this.getMeditations();
    const entry: MeditationSession = {
      id: generateId(),
      duration,
      completed,
      timestamp: Date.now(),
      date: getDateStr(),
    };
    sessions.unshift(entry);
    await AsyncStorage.setItem(KEYS.MEDITATIONS, JSON.stringify(sessions));
    return entry;
  },

  async getStreak(): Promise<StreakData> {
    const raw = await AsyncStorage.getItem(KEYS.STREAK);
    return raw
      ? JSON.parse(raw)
      : {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: "",
          totalSessions: 0,
          totalMinutes: 0,
        };
  },

  async updateStreak(minutesAdded: number): Promise<StreakData> {
    const streak = await this.getStreak();
    const today = getDateStr();
    const yesterday = getDateStr(new Date(Date.now() - 86400000));

    if (streak.lastActiveDate === today) {
      streak.totalMinutes += minutesAdded;
      streak.totalSessions += 1;
    } else if (
      streak.lastActiveDate === yesterday ||
      streak.lastActiveDate === ""
    ) {
      streak.currentStreak += 1;
      streak.totalMinutes += minutesAdded;
      streak.totalSessions += 1;
      streak.lastActiveDate = today;
    } else {
      streak.currentStreak = 1;
      streak.totalMinutes += minutesAdded;
      streak.totalSessions += 1;
      streak.lastActiveDate = today;
    }

    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(streak));
    return streak;
  },

  async getProfile(): Promise<ProfileData> {
    const raw = await AsyncStorage.getItem(KEYS.PROFILE);
    return raw ? JSON.parse(raw) : { name: "", avatar: "lotus" };
  },

  async saveProfile(profile: ProfileData): Promise<void> {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  async getEatingLog(): Promise<EatingEntry[]> {
    const raw = await AsyncStorage.getItem(KEYS.EATING_LOG);
    return raw ? JSON.parse(raw) : [];
  },

  async addEatingEntry(
    meal: string,
    hunger: number,
    fullness: number,
    mindful: boolean,
    notes: string,
  ): Promise<EatingEntry> {
    const log = await this.getEatingLog();
    const entry: EatingEntry = {
      id: generateId(),
      meal,
      hunger,
      fullness,
      mindful,
      notes,
      timestamp: Date.now(),
      date: getDateStr(),
    };
    log.unshift(entry);
    await AsyncStorage.setItem(KEYS.EATING_LOG, JSON.stringify(log));
    return entry;
  },

  async deleteEatingEntry(id: string): Promise<void> {
    const log = await this.getEatingLog();
    const filtered = log.filter((e) => e.id !== id);
    await AsyncStorage.setItem(KEYS.EATING_LOG, JSON.stringify(filtered));
  },

  async getGameScores(): Promise<GameScore[]> {
    const raw = await AsyncStorage.getItem(KEYS.GAME_SCORES);
    return raw ? JSON.parse(raw) : [];
  },

  async addGameScore(game: string, score: number): Promise<GameScore> {
    const scores = await this.getGameScores();
    const entry: GameScore = {
      id: generateId(),
      game,
      score,
      timestamp: Date.now(),
    };
    scores.unshift(entry);
    await AsyncStorage.setItem(KEYS.GAME_SCORES, JSON.stringify(scores));
    return entry;
  },

  async getChallengeData(): Promise<ChallengeData> {
    const raw = await AsyncStorage.getItem(KEYS.CHALLENGES);
    if (!raw) return { xp: 0, completedToday: [], badgesEarned: [], lastResetDate: "" };
    return JSON.parse(raw);
  },

  async saveChallengeData(data: ChallengeData): Promise<void> {
    await AsyncStorage.setItem(KEYS.CHALLENGES, JSON.stringify(data));
  },

  async getWeekCourseProgress(): Promise<WeekCourseProgress> {
    const raw = await AsyncStorage.getItem(KEYS.WEEK_COURSE);
    if (!raw) return { completedSessions: [], startedDate: "" };
    return JSON.parse(raw);
  },

  async saveWeekCourseProgress(data: WeekCourseProgress): Promise<void> {
    await AsyncStorage.setItem(KEYS.WEEK_COURSE, JSON.stringify(data));
  },
};
