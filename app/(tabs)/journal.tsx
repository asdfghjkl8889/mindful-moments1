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
  Modal,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeIn,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { storage, JournalEntry } from "@/lib/storage";

function JournalCard({
  entry,
  colors,
  onDelete,
}: {
  entry: JournalEntry;
  colors: any;
  onDelete: (id: string) => void;
}) {
  const dateStr = new Date(entry.timestamp).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <Pressable
      onLongPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        Alert.alert("Delete Entry", "Remove this journal entry?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => onDelete(entry.id),
          },
        ]);
      }}
      style={[
        styles.journalCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="book" size={16} color={colors.tint} />
        <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
          {dateStr}
        </Text>
      </View>

      {entry.gratitude.length > 0 && (
        <View style={styles.gratitudeSection}>
          <Text style={[styles.gratitudeTitle, { color: colors.text }]}>
            Grateful for
          </Text>
          {entry.gratitude.map((g, i) => (
            <View key={i} style={styles.gratitudeItem}>
              <Ionicons name="heart" size={12} color={colors.coral} />
              <Text
                style={[styles.gratitudeText, { color: colors.textSecondary }]}
              >
                {g}
              </Text>
            </View>
          ))}
        </View>
      )}

      {entry.reflection ? (
        <Text
          style={[styles.reflectionText, { color: colors.textSecondary }]}
          numberOfLines={3}
        >
          {entry.reflection}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [gratitude1, setGratitude1] = useState("");
  const [gratitude2, setGratitude2] = useState("");
  const [gratitude3, setGratitude3] = useState("");
  const [reflection, setReflection] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const data = await storage.getJournals();
    setJournals(data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSave = async () => {
    const gratitudes = [gratitude1, gratitude2, gratitude3].filter(
      (g) => g.trim() !== "",
    );
    if (gratitudes.length === 0 && reflection.trim() === "") return;

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await storage.addJournal(gratitudes, reflection.trim());
    setGratitude1("");
    setGratitude2("");
    setGratitude3("");
    setReflection("");
    setShowCompose(false);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    await storage.deleteJournal(id);
    await loadData();
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + webTopInset + 16 },
        ]}
      >
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Journal</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {journals.length} {journals.length === 1 ? "entry" : "entries"}
          </Text>
        </View>
        <Pressable
          onPress={() => setShowCompose(true)}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {journals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            Start journaling
          </Text>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            Write down what you're grateful for and reflect on your day.
          </Text>
        </View>
      ) : (
        <FlatList
          data={journals}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={
                Platform.OS !== "web"
                  ? FadeInDown.delay(index * 80).duration(400)
                  : undefined
              }
            >
              <JournalCard
                entry={item}
                colors={colors}
                onDelete={handleDelete}
              />
            </Animated.View>
          )}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 120,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <Modal
        visible={showCompose}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCompose(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowCompose(false)}
          />
          <Animated.View
            entering={
              Platform.OS !== "web" ? FadeIn.duration(300) : undefined
            }
            style={[
              styles.composeSheet,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <View style={styles.composeHeader}>
              <Pressable onPress={() => setShowCompose(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <Text style={[styles.composeTitle, { color: colors.text }]}>
                New Entry
              </Text>
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.saveBtn,
                  {
                    backgroundColor: colors.tint,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.composeContent}
            >
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                I'm grateful for...
              </Text>
              {[
                { val: gratitude1, set: setGratitude1, num: 1 },
                { val: gratitude2, set: setGratitude2, num: 2 },
                { val: gratitude3, set: setGratitude3, num: 3 },
              ].map(({ val, set, num }) => (
                <View
                  key={num}
                  style={[
                    styles.inputRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons name="heart" size={14} color={colors.coral} />
                  <TextInput
                    value={val}
                    onChangeText={set}
                    placeholder={`Gratitude ${num}`}
                    placeholderTextColor={colors.textTertiary}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>
              ))}

              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.text, marginTop: 20 },
                ]}
              >
                Reflection
              </Text>
              <TextInput
                value={reflection}
                onChangeText={setReflection}
                placeholder="How was your day? What's on your mind?"
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
                style={[
                  styles.textArea,
                  {
                    color: colors.text,
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 28,
  },
  subtitle: {
    fontFamily: "Nunito_500Medium",
    fontSize: 14,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
  },
  emptyText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  journalCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardDate: {
    fontFamily: "Nunito_500Medium",
    fontSize: 13,
  },
  gratitudeSection: {
    gap: 6,
  },
  gratitudeTitle: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    marginBottom: 2,
  },
  gratitudeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
  },
  gratitudeText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    flex: 1,
  },
  reflectionText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  composeSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  composeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  composeTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  composeContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  fieldLabel: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 15,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
  },
  textArea: {
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    lineHeight: 22,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    minHeight: 120,
  },
});
