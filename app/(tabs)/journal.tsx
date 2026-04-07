import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  useColorScheme,
  Platform,
  Modal,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { storage, JournalEntry, GratitudeTile } from "@/lib/storage";
import { MiniCharacter } from "@/components/Characters";

const { width: SCREEN_W } = Dimensions.get("window");
const TILE_SIZE = (Math.min(SCREEN_W, 500) - 48) / 2;

type JournalTab = "journal" | "wall";

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
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert("Delete Entry", "Remove this journal entry?", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => onDelete(entry.id) },
        ]);
      }}
      style={[styles.journalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
    >
      {entry.photoUri && (
        <Image source={{ uri: entry.photoUri }} style={styles.cardPhoto} contentFit="cover" transition={300} />
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Ionicons name="book" size={16} color={colors.tint} />
          <Text style={[styles.cardDate, { color: colors.textSecondary }]}>{dateStr}</Text>
        </View>
        {entry.gratitude.length > 0 && (
          <View style={styles.gratitudeSection}>
            <Text style={[styles.gratitudeTitle, { color: colors.text }]}>Grateful for</Text>
            {entry.gratitude.map((g, i) => (
              <View key={i} style={styles.gratitudeItem}>
                <Ionicons name="heart" size={12} color={colors.coral} />
                <Text style={[styles.gratitudeText, { color: colors.textSecondary }]}>{g}</Text>
              </View>
            ))}
          </View>
        )}
        {entry.reflection ? (
          <Text style={[styles.reflectionText, { color: colors.textSecondary }]} numberOfLines={3}>
            {entry.reflection}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function GratitudeTileCard({
  tile,
  colors,
  onDelete,
}: {
  tile: GratitudeTile;
  colors: any;
  onDelete: (id: string) => void;
}) {
  const dateStr = new Date(tile.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Pressable
      onLongPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert("Delete Tile", "Remove this gratitude tile?", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => onDelete(tile.id) },
        ]);
      }}
      style={[styles.tile, { width: TILE_SIZE }]}
    >
      <Image source={{ uri: tile.photoUri }} style={styles.tileImage} contentFit="cover" transition={300} />
      <View style={styles.tileOverlay}>
        <Text style={styles.tileDateText}>{dateStr}</Text>
        {tile.caption ? (
          <Text style={styles.tileCaptionText} numberOfLines={3}>{tile.caption}</Text>
        ) : null}
        <Ionicons name="heart" size={14} color="rgba(255,255,255,0.8)" style={{ marginTop: 2 }} />
      </View>
    </Pressable>
  );
}

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<JournalTab>("journal");

  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [tiles, setTiles] = useState<GratitudeTile[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [showTileCompose, setShowTileCompose] = useState(false);

  const [gratitude1, setGratitude1] = useState("");
  const [gratitude2, setGratitude2] = useState("");
  const [gratitude3, setGratitude3] = useState("");
  const [reflection, setReflection] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [tilePhotoUri, setTilePhotoUri] = useState<string | null>(null);
  const [tileCaption, setTileCaption] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [j, t] = await Promise.all([storage.getJournals(), storage.getGratitudeTiles()]);
    setJournals(j);
    setTiles(t);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const pickImage = async (forTile = false) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: forTile ? [1, 1] : [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      if (forTile) setTilePhotoUri(result.assets[0].uri);
      else setPhotoUri(result.assets[0].uri);
      if (Platform.OS !== "web") Haptics.selectionAsync();
    }
  };

  const takePhoto = async (forTile = false) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera permission is required to take photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: forTile ? [1, 1] : [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      if (forTile) setTilePhotoUri(result.assets[0].uri);
      else setPhotoUri(result.assets[0].uri);
      if (Platform.OS !== "web") Haptics.selectionAsync();
    }
  };

  const handleSave = async () => {
    const gratitudes = [gratitude1, gratitude2, gratitude3].filter((g) => g.trim() !== "");
    if (gratitudes.length === 0 && reflection.trim() === "" && !photoUri) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await storage.addJournal(gratitudes, reflection.trim(), photoUri);
    setGratitude1(""); setGratitude2(""); setGratitude3("");
    setReflection(""); setPhotoUri(null); setShowCompose(false);
    await loadData();
  };

  const handleSaveTile = async () => {
    if (!tilePhotoUri) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await storage.addGratitudeTile(tilePhotoUri, tileCaption.trim());
    setTilePhotoUri(null); setTileCaption(""); setShowTileCompose(false);
    await loadData();
  };

  const handleDeleteJournal = async (id: string) => {
    await storage.deleteJournal(id);
    await loadData();
  };

  const handleDeleteTile = async (id: string) => {
    await storage.deleteGratitudeTile(id);
    await loadData();
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const journalPhotos: GratitudeTile[] = [
    ...tiles,
    ...journals
      .filter((j) => j.photoUri)
      .map((j) => ({
        id: j.id + "_photo",
        photoUri: j.photoUri!,
        caption: j.gratitude[0] || j.reflection.slice(0, 60) || "",
        timestamp: j.timestamp,
      })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 16 }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Journal</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {tab === "journal"
              ? `${journals.length} ${journals.length === 1 ? "entry" : "entries"}`
              : `${journalPhotos.length} gratitude tiles`}
          </Text>
        </View>
        <Pressable
          onPress={() => { tab === "journal" ? setShowCompose(true) : setShowTileCompose(true); }}
          style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <View style={[styles.tabRow, { borderColor: colors.cardBorder }]}>
        {(["journal", "wall"] as JournalTab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[
              styles.tabBtn,
              tab === t && { borderBottomColor: colors.tint, borderBottomWidth: 2 },
            ]}
          >
            <Ionicons
              name={t === "journal" ? "book" : "images"}
              size={15}
              color={tab === t ? colors.tint : colors.textTertiary}
            />
            <Text style={[styles.tabLabel, { color: tab === t ? colors.tint : colors.textTertiary }]}>
              {t === "journal" ? "Entries" : "Gratitude Wall"}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "journal" ? (
        journals.length === 0 ? (
          <View style={styles.emptyState}>
            <MiniCharacter
              character="luna"
              message="Hi! I am Luna. I will keep your journal safe. Write your first entry — even one sentence counts."
            />
          </View>
        ) : (
          <FlatList
            data={journals}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <Animated.View entering={Platform.OS !== "web" ? FadeInDown.delay(index * 60).duration(400) : undefined}>
                <JournalCard entry={item} colors={colors} onDelete={handleDeleteJournal} />
              </Animated.View>
            )}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 12 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )
      ) : (
        journalPhotos.length === 0 ? (
          <View style={styles.emptyState}>
            <MiniCharacter
              character="luna"
              message="Your Gratitude Wall is empty! Add a photo of something you are thankful for. Every picture tells a story."
            />
          </View>
        ) : (
          <FlatList
            data={journalPhotos}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 8 }}
            renderItem={({ item, index }) => (
              <Animated.View entering={Platform.OS !== "web" ? FadeIn.delay(index * 50).duration(400) : undefined}>
                <GratitudeTileCard
                  tile={item}
                  colors={colors}
                  onDelete={handleDeleteTile}
                />
              </Animated.View>
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 8, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListHeaderComponent={
              <View style={[styles.wallBanner, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Ionicons name="heart" size={16} color={colors.coral} />
                <Text style={[styles.wallBannerText, { color: colors.textSecondary }]}>
                  Long-press any tile to delete it. Journal photos appear here automatically.
                </Text>
              </View>
            }
          />
        )
      )}

      <Modal visible={showCompose} animationType="slide" transparent onRequestClose={() => setShowCompose(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowCompose(false)} />
          <Animated.View
            entering={Platform.OS !== "web" ? FadeIn.duration(300) : undefined}
            style={[styles.composeSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.composeHeader}>
              <Pressable onPress={() => setShowCompose(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <Text style={[styles.composeTitle, { color: colors.text }]}>New Entry</Text>
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [styles.saveBtn, { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 }]}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.composeContent}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Add a Photo</Text>
              {photoUri ? (
                <View style={styles.photoPreviewWrap}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
                  <Pressable
                    onPress={() => setPhotoUri(null)}
                    style={[styles.removePhotoBtn, { backgroundColor: "rgba(0,0,0,0.6)" }]}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.photoButtons}>
                  <Pressable
                    onPress={() => pickImage(false)}
                    style={[styles.photoBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  >
                    <Ionicons name="images" size={22} color={colors.tint} />
                    <Text style={[styles.photoBtnText, { color: colors.text }]}>Gallery</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => takePhoto(false)}
                    style={[styles.photoBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  >
                    <Ionicons name="camera" size={22} color={colors.tint} />
                    <Text style={[styles.photoBtnText, { color: colors.text }]}>Camera</Text>
                  </Pressable>
                </View>
              )}

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 20 }]}>I'm grateful for...</Text>
              {[
                { val: gratitude1, set: setGratitude1, num: 1 },
                { val: gratitude2, set: setGratitude2, num: 2 },
                { val: gratitude3, set: setGratitude3, num: 3 },
              ].map(({ val, set, num }) => (
                <View key={num} style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
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

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 20 }]}>Reflection</Text>
              <TextInput
                value={reflection}
                onChangeText={setReflection}
                placeholder="How was your day? What's on your mind?"
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
                style={[styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showTileCompose} animationType="slide" transparent onRequestClose={() => setShowTileCompose(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowTileCompose(false)} />
          <Animated.View
            entering={Platform.OS !== "web" ? FadeIn.duration(300) : undefined}
            style={[styles.composeSheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.composeHeader}>
              <Pressable onPress={() => setShowTileCompose(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <Text style={[styles.composeTitle, { color: colors.text }]}>Gratitude Tile</Text>
              <Pressable
                onPress={handleSaveTile}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: tilePhotoUri ? colors.tint : colors.cardBorder, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.composeContent}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Photo of Gratitude *</Text>
              <Text style={[styles.tileHint, { color: colors.textSecondary }]}>
                Capture something that made your heart smile today.
              </Text>
              {tilePhotoUri ? (
                <View style={styles.tilePreviewWrap}>
                  <Image source={{ uri: tilePhotoUri }} style={styles.tilePreview} contentFit="cover" />
                  <Pressable
                    onPress={() => setTilePhotoUri(null)}
                    style={[styles.removePhotoBtn, { backgroundColor: "rgba(0,0,0,0.6)" }]}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.photoButtons}>
                  <Pressable
                    onPress={() => pickImage(true)}
                    style={[styles.photoBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  >
                    <Ionicons name="images" size={22} color="#FF8A80" />
                    <Text style={[styles.photoBtnText, { color: colors.text }]}>Gallery</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => takePhoto(true)}
                    style={[styles.photoBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  >
                    <Ionicons name="camera" size={22} color="#FF8A80" />
                    <Text style={[styles.photoBtnText, { color: colors.text }]}>Camera</Text>
                  </Pressable>
                </View>
              )}

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 20 }]}>Caption (optional)</Text>
              <TextInput
                value={tileCaption}
                onChangeText={setTileCaption}
                placeholder="What are you grateful for in this photo?"
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
                style={[styles.textArea, { color: colors.text, backgroundColor: colors.card, borderColor: colors.cardBorder, minHeight: 80 }]}
              />
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  title: { fontFamily: "Nunito_800ExtraBold", fontSize: 28 },
  subtitle: { fontFamily: "Nunito_500Medium", fontSize: 14, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tabRow: {
    flexDirection: "row", borderBottomWidth: 1, marginBottom: 4,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 13 },
  emptyState: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 12,
  },
  emptyTitle: { fontFamily: "Nunito_700Bold", fontSize: 18 },
  emptyText: { fontFamily: "Nunito_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
  journalCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardPhoto: { width: "100%", height: 180 },
  cardBody: { padding: 16, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardDate: { fontFamily: "Nunito_500Medium", fontSize: 13 },
  gratitudeSection: { gap: 6 },
  gratitudeTitle: { fontFamily: "Nunito_600SemiBold", fontSize: 14, marginBottom: 2 },
  gratitudeItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 4 },
  gratitudeText: { fontFamily: "Nunito_400Regular", fontSize: 14, flex: 1 },
  reflectionText: { fontFamily: "Nunito_400Regular", fontSize: 14, lineHeight: 20 },
  wallBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, padding: 10, borderWidth: 1, marginBottom: 8,
  },
  wallBannerText: { flex: 1, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 17 },
  tile: {
    borderRadius: 16, overflow: "hidden", height: TILE_SIZE,
  },
  tileImage: { width: "100%", height: "100%" },
  tileOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.42)", padding: 10, gap: 3,
  },
  tileDateText: { fontFamily: "Nunito_600SemiBold", fontSize: 10, color: "rgba(255,255,255,0.7)" },
  tileCaptionText: { fontFamily: "Nunito_500Medium", fontSize: 12, color: "#fff", lineHeight: 16 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  composeSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%" },
  composeHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
  },
  composeTitle: { fontFamily: "Nunito_700Bold", fontSize: 18 },
  saveBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  composeContent: { paddingHorizontal: 20, paddingBottom: 20 },
  fieldLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 15, marginBottom: 8 },
  tileHint: { fontFamily: "Nunito_400Regular", fontSize: 13, marginBottom: 12, marginTop: -4, lineHeight: 18 },
  photoButtons: { flexDirection: "row", gap: 12 },
  photoBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  photoBtnText: { fontFamily: "Nunito_600SemiBold", fontSize: 14 },
  photoPreviewWrap: { position: "relative", borderRadius: 12, overflow: "hidden" },
  photoPreview: { width: "100%", height: 180, borderRadius: 12 },
  tilePreviewWrap: { position: "relative", borderRadius: 12, overflow: "hidden" },
  tilePreview: { width: "100%", height: 240, borderRadius: 12 },
  removePhotoBtn: {
    position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14,
    paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },
  input: { flex: 1, fontFamily: "Nunito_400Regular", fontSize: 15 },
  textArea: {
    fontFamily: "Nunito_400Regular", fontSize: 15, lineHeight: 22,
    borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 120,
  },
});
