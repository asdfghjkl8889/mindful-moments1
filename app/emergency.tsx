import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Linking,
  Platform,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";

const HOTLINES = [
  {
    id: "988",
    name: "988 Suicide & Crisis Lifeline",
    description: "Call or text 988 — free, confidential, 24/7",
    action: "Call 988",
    icon: "call",
    color: "#EF5350",
    url: "tel:988",
  },
  {
    id: "crisis-text",
    name: "Crisis Text Line",
    description: "Text HOME to 741741 — free, 24/7 text support",
    action: "Text Now",
    icon: "chatbubble",
    color: "#E53935",
    url: "sms:741741?body=HOME",
  },
  {
    id: "nami",
    name: "NAMI Helpline",
    description: "Mon–Fri 10am–10pm ET — mental health support",
    action: "Call NAMI",
    icon: "heart",
    color: "#C62828",
    url: "tel:18009506264",
  },
  {
    id: "samhsa",
    name: "SAMHSA National Helpline",
    description: "1-800-662-4357 — substance use & mental health, 24/7",
    action: "Call Now",
    icon: "medkit",
    color: "#B71C1C",
    url: "tel:18006624357",
  },
  {
    id: "veteran",
    name: "Veterans Crisis Line",
    description: "Call 988, then press 1 — for veterans & their families",
    action: "Call Now",
    icon: "shield",
    color: "#D32F2F",
    url: "tel:988",
  },
  {
    id: "trevor",
    name: "The Trevor Project",
    description: "1-866-488-7386 — LGBTQ+ youth crisis support, 24/7",
    action: "Call Now",
    icon: "rainbow",
    color: "#E53935",
    url: "tel:18664887386",
  },
];

const GROUNDING_STEPS = [
  { num: "5", text: "things you can see" },
  { num: "4", text: "things you can touch" },
  { num: "3", text: "things you can hear" },
  { num: "2", text: "things you can smell" },
  { num: "1", text: "thing you can taste" },
];

export default function EmergencyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.root, { backgroundColor: "#FFF5F5" }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + webTopInset + 12,
            backgroundColor: "#EF5350",
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <Ionicons name="chevron-down" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerContent}>
          <Ionicons name="shield-checkmark" size={28} color="#fff" />
          <Text style={styles.headerTitle}>Crisis Support</Text>
          <Text style={styles.headerSub}>
            You are not alone. Help is available right now.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32,
          paddingTop: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: "#B71C1C" }]}>
          Emergency Hotlines
        </Text>

        {HOTLINES.map((line) => (
          <View key={line.id} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: line.color + "15" }]}>
              <Ionicons name={line.icon as any} size={24} color={line.color} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardName}>{line.name}</Text>
              <Text style={styles.cardDesc}>{line.description}</Text>
            </View>
            <Pressable
              onPress={() => openLink(line.url)}
              style={({ pressed }) => [
                styles.callBtn,
                { backgroundColor: line.color, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.callBtnText}>{line.action}</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.groundingBox}>
          <Text style={styles.groundingTitle}>5-4-3-2-1 Grounding</Text>
          <Text style={styles.groundingSubtitle}>
            Feeling overwhelmed? Try this grounding technique to anchor yourself
            in the present moment.
          </Text>
          {GROUNDING_STEPS.map((step) => (
            <View key={step.num} style={styles.groundingRow}>
              <View style={styles.groundingNum}>
                <Text style={styles.groundingNumText}>{step.num}</Text>
              </View>
              <Text style={styles.groundingText}>{step.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.breatheBox}>
          <Ionicons name="leaf" size={22} color="#EF5350" />
          <Text style={styles.breatheTitle}>Breathe with me</Text>
          <Text style={styles.breatheText}>
            Breathe in slowly for 4 counts... hold for 4... breathe out for 8.
            {"\n"}Repeat until you feel calmer.
          </Text>
        </View>

        <Text style={styles.disclaimer}>
          If you are in immediate danger, please call{" "}
          <Text
            style={styles.disclaimerBold}
            onPress={() => openLink("tel:911")}
          >
            911
          </Text>{" "}
          or go to your nearest emergency room.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  headerContent: {
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 26,
    color: "#fff",
  },
  headerSub: {
    fontFamily: "Nunito_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 17,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: "#EF5350",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1 },
  cardName: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: "#1A1A1A",
    marginBottom: 2,
  },
  cardDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    color: "#757575",
    lineHeight: 15,
  },
  callBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  callBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#fff",
  },
  groundingBox: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#EF5350",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  groundingTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 17,
    color: "#B71C1C",
    marginBottom: 6,
  },
  groundingSubtitle: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "#757575",
    lineHeight: 18,
    marginBottom: 16,
  },
  groundingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  groundingNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
  },
  groundingNumText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 16,
    color: "#EF5350",
  },
  groundingText: {
    fontFamily: "Nunito_500Medium",
    fontSize: 14,
    color: "#424242",
  },
  breatheBox: {
    backgroundColor: "#FFF9C4",
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  breatheTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: "#B71C1C",
  },
  breatheText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "#616161",
    textAlign: "center",
    lineHeight: 20,
  },
  disclaimer: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: "#9E9E9E",
    textAlign: "center",
    marginHorizontal: 32,
    marginTop: 20,
    lineHeight: 18,
  },
  disclaimerBold: {
    fontFamily: "Nunito_700Bold",
    color: "#EF5350",
  },
});
