import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  MOODS: "mindful_moods",
  JOURNALS: "mindful_journals",
  MEDITATIONS: "mindful_meditations",
  STREAK: "mindful_streak",
  PROFILE: "mindful_profile",
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

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getDateStr(d?: Date): string {
  const date = d || new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

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
  ): Promise<JournalEntry> {
    const journals = await this.getJournals();
    const entry: JournalEntry = {
      id: generateId(),
      gratitude,
      reflection,
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
    const yesterday = getDateStr(
      new Date(Date.now() - 86400000),
    );

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
};
