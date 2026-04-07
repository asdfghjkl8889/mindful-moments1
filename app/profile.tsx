import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { storage, ProfileData, StreakData } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/query-client";

const AVATARS = [
  { key: "lotus", icon: "flower", color: "#B39DDB" },
  { key: "leaf", icon: "leaf", color: "#66BB6A" },
  { key: "sun", icon: "sunny", color: "#FFD54F" },
  { key: "moon", icon: "moon", color: "#81D4FA" },
  { key: "star", icon: "star", color: "#FF8A65" },
  { key: "heart", icon: "heart", color: "#EF5350" },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    avatar: "lotus",
  });
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: "",
    totalSessions: 0,
    totalMinutes: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [moodCount, setMoodCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);

  const loadData = useCallback(async () => {
    const [p, s, moods, journals] = await Promise.all([
      storage.getProfile(),
      storage.getStreak(),
      storage.getMoods(),
      storage.getJournals(),
    ]);
    setProfile(p);
    setStreak(s);
    setMoodCount(moods.length);
    setJournalCount(journals.length);
    setEditName(p.name);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveName = async () => {
    const updated = { ...profile, name: editName.trim() };
    await storage.saveProfile(updated);
    setProfile(updated);
    setIsEditing(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleAvatarSelect = async (key: string) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    const updated = { ...profile, avatar: key };
    await storage.saveProfile(updated);
    setProfile(updated);
  };

  const currentAvatar = AVATARS.find((a) => a.key === profile.avatar) || AVATARS[0];

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + webTopInset,
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={
          isDark
            ? [currentAvatar.color + "30", colors.background]
            : [currentAvatar.color + "25", colors.background]
        }
        style={styles.headerGradient}
      >
        <View style={styles.closeRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.closeBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: currentAvatar.color + "20" },
          ]}
        >
          <Ionicons
            name={currentAvatar.icon as any}
            size={48}
            color={currentAvatar.color}
          />
        </View>

        {isEditing ? (
          <View style={styles.editNameRow}>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
              style={[
                styles.nameInput,
                {
                  color: colors.text,
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.card,
                },
              ]}
              autoFocus
            />
            <Pressable
              onPress={handleSaveName}
              style={[styles.saveNameBtn, { backgroundColor: colors.tint }]}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setIsEditing(true)}>
            <Text style={[styles.name, { color: colors.text }]}>
              {profile.name || "Tap to set name"}
            </Text>
          </Pressable>
        )}

        <Text style={[styles.memberSince, { color: colors.textSecondary }]}>
          Mindful Moments Member
        </Text>
      </LinearGradient>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Choose Avatar
      </Text>
      <View style={styles.avatarRow}>
        {AVATARS.map((a) => (
          <Pressable
            key={a.key}
            onPress={() => handleAvatarSelect(a.key)}
            style={[
              styles.avatarOption,
              {
                backgroundColor:
                  profile.avatar === a.key ? a.color + "20" : colors.card,
                borderColor:
                  profile.avatar === a.key ? a.color : colors.cardBorder,
              },
            ]}
          >
            <Ionicons name={a.icon as any} size={24} color={a.color} />
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Statistics
      </Text>
      <View style={styles.statsGrid}>
        {[
          {
            icon: "flame",
            value: streak.currentStreak,
            label: "Current Streak",
            color: "#FF6B6B",
          },
          {
            icon: "trophy",
            value: streak.longestStreak,
            label: "Longest Streak",
            color: "#FFD54F",
          },
          {
            icon: "time",
            value: streak.totalMinutes,
            label: "Minutes Meditated",
            color: colors.tint,
          },
          {
            icon: "leaf",
            value: streak.totalSessions,
            label: "Meditation Sessions",
            color: colors.sage,
          },
          {
            icon: "happy",
            value: moodCount,
            label: "Moods Logged",
            color: "#81C784",
          },
          {
            icon: "book",
            value: journalCount,
            label: "Journal Entries",
            color: colors.lavender,
          },
        ].map((stat) => (
          <View
            key={stat.label}
            style={[
              styles.statCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.statIconWrap,
                { backgroundColor: stat.color + "18" },
              ]}
            >
              <Ionicons name={stat.icon as any} size={18} color={stat.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Account section */}
      <View style={{ paddingHorizontal: 20, marginTop: 24, gap: 10 }}>
        {user && (
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.tealLight, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="cloud-done" size={20} color={colors.tint} />
            <View style={{ flex: 1 }}>
              <Text style={[{ fontFamily: "Nunito_600SemiBold", fontSize: 13, color: colors.tint }]}>
                Progress saved to cloud
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {user.email}
              </Text>
            </View>
          </View>
        )}

        <Pressable
          style={[
            styles.infoCard,
            { backgroundColor: isDark ? "#3a1a1a" : "#fff0f0", borderColor: "#ffcccc" },
          ]}
          onPress={() => {
            if (Platform.OS !== "web") {
              Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Sign Out",
                  style: "destructive",
                  onPress: async () => {
                    await logout();
                    router.replace("/welcome");
                  },
                },
              ]);
            } else {
              logout().then(() => router.replace("/welcome"));
            }
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#e53935" />
          <Text style={[styles.infoText, { color: "#e53935", fontFamily: "Nunito_600SemiBold" }]}>
            Sign Out
          </Text>
        </Pressable>

        {/* Disclaimer */}
        <View
          style={[
            styles.disclaimerCard,
            { backgroundColor: isDark ? "#1a2520" : "#f0faf9", borderColor: isDark ? "#2d4a3e" : "#b2dfdb" },
          ]}
        >
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            Mindful Moments is a general wellness app and is not a substitute for professional medical advice. If you are in crisis, use the Emergency Resources in the app.
          </Text>
        </View>

        {/* Legal links */}
        <View style={styles.legalRow}>
          <Pressable
            onPress={() => Linking.openURL(new URL("/privacy-policy", getApiUrl()).toString())}
          >
            <Text style={[styles.legalLink, { color: colors.tint }]}>Privacy Policy</Text>
          </Pressable>
          <Text style={[styles.legalDot, { color: colors.textSecondary }]}>{"\u00b7"}</Text>
          <Pressable
            onPress={() => router.push("/emergency")}
          >
            <Text style={[styles.legalLink, { color: colors.tint }]}>Emergency Resources</Text>
          </Pressable>
        </View>

        <Text style={[styles.versionText, { color: colors.textSecondary }]}>
          Mindful Moments v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  closeRow: {
    alignSelf: "stretch",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  closeBtn: {
    padding: 4,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  name: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 24,
    textAlign: "center",
  },
  editNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameInput: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 180,
    textAlign: "center",
  },
  saveNameBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  memberSince: {
    fontFamily: "Nunito_500Medium",
    fontSize: 14,
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  avatarOption: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 10,
  },
  statCard: {
    width: "47%",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 6,
    flexGrow: 1,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 22,
  },
  statLabel: {
    fontFamily: "Nunito_500Medium",
    fontSize: 12,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  disclaimerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  disclaimerText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  legalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  legalLink: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    textDecorationLine: "underline",
  },
  legalDot: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
  },
  versionText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  infoText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
