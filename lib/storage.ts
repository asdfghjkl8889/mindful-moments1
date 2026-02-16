import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  MOODS: "mindful_moods",
  JOURNALS: "mindful_journals",
  MEDITATIONS: "mindful_meditations",
  STREAK: "mindful_streak",
  PROFILE: "mindful_profile",
  EATING_LOG: "mindful_eating",
  GAME_SCORES: "mindful_game_scores",
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

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getDateStr(d?: Date): string {
  const date = d || new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export const QUOTES = [
  { text: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
  { text: "In today's rush, we all think too much, seek too much, want too much, and forget about the joy of just being.", author: "Eckhart Tolle" },
  { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" },
  { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh" },
  { text: "The greatest weapon against stress is our ability to choose one thought over another.", author: "William James" },
  { text: "Mindfulness is a way of befriending ourselves and our experience.", author: "Jon Kabat-Zinn" },
  { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
  { text: "Be where you are, not where you think you should be.", author: "Unknown" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  { text: "You yourself, as much as anybody in the entire universe, deserve your love and affection.", author: "Buddha" },
  { text: "Breathe. Let go. And remind yourself that this very moment is the only one you know you have for sure.", author: "Oprah Winfrey" },
  { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
  { text: "Smile, breathe, and go slowly.", author: "Thich Nhat Hanh" },
  { text: "Every morning we are born again. What we do today is what matters most.", author: "Buddha" },
  { text: "The little things? The little moments? They aren't little.", author: "Jon Kabat-Zinn" },
  { text: "With every breath, the old moment is lost; a new moment arrives.", author: "Gautama Buddha" },
  { text: "Respond; don't react. Listen; don't talk. Think; don't assume.", author: "Raji Lukkoor" },
  { text: "You can't stop the waves, but you can learn to surf.", author: "Jon Kabat-Zinn" },
  { text: "Be happy in the moment, that's enough. Each moment is all we need, not more.", author: "Mother Teresa" },
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
};
