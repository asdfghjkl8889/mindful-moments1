import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated as RNAnimated, useColorScheme } from "react-native";
import Svg, {
  Path,
  Ellipse,
  G,
  Defs,
  ClipPath,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
  Line,
  Text as SvgText,
} from "react-native-svg";
import Colors from "@/constants/colors";

const W = 280;
const H = 190;

// Brain exterior (right hemisphere, side view, front = left)
const BRAIN_OUTLINE =
  "M 138,18 C 106,8 60,24 38,56 C 18,82 18,114 30,140 C 42,164 68,176 100,180 C 126,184 155,180 180,168 C 208,154 230,130 240,104 C 250,78 244,46 226,28 C 208,12 176,5 153,11 Z";

// Prefrontal cortex region (front ~30% clipped to brain)
const PFC_REGION =
  "M 0,0 L 108,0 C 116,28 118,58 114,86 C 110,108 100,128 88,144 C 78,156 64,166 52,172 L 0,175 Z";

// Lateral/Sylvian fissure (divides frontal+parietal from temporal)
const SYLVIAN_FISSURE =
  "M 62,124 C 85,118 112,114 140,114 C 160,114 180,118 196,126";

// Gyri fold lines for texture and realism
const GYRI_LINES = [
  "M 50,68 C 68,60 88,56 108,56 C 124,56 136,60 144,66",
  "M 42,94 C 62,86 84,82 108,82 C 128,82 146,88 158,96",
  "M 164,36 C 182,40 200,50 215,64",
  "M 168,64 C 188,68 206,78 218,92",
  "M 170,96 C 192,100 212,112 220,126",
  "M 72,150 C 90,148 110,148 130,150 C 148,152 164,158 176,166",
];

// Hippocampus curve (near amygdala)
const HIPPO_CURVE = "M 145,128 C 158,130 168,134 175,140";

interface Props {
  isDark: boolean;
  width?: number;
}

export function BrainDiagram({ isDark, width = 300 }: Props) {
  const scale = width / W;
  const svgH = H * scale;

  const pfcPulse = useRef(new RNAnimated.Value(0.5)).current;
  const amygPulse = useRef(new RNAnimated.Value(0.8)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pfcPulse, { toValue: 0.85, duration: 2000, useNativeDriver: false }),
        RNAnimated.timing(pfcPulse, { toValue: 0.5, duration: 2000, useNativeDriver: false }),
      ])
    ).start();

    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(amygPulse, { toValue: 1.0, duration: 1200, useNativeDriver: false }),
        RNAnimated.timing(amygPulse, { toValue: 0.6, duration: 1200, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const brainFill = isDark ? "#1E1A2E" : "#EDE8F5";
  const brainStroke = isDark ? "#6B5FA0" : "#9C8CC8";
  const gyriColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const fissureColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  return (
    <View style={{ width, height: svgH }}>
      <Svg
        width={width}
        height={svgH}
        viewBox={`0 0 ${W} ${H}`}
      >
        <Defs>
          {/* Clip to brain outline */}
          <ClipPath id="brainClip">
            <Path d={BRAIN_OUTLINE} />
          </ClipPath>

          {/* PFC teal glow */}
          <RadialGradient id="pfcGlow" cx="35%" cy="40%" r="65%">
            <Stop offset="0" stopColor="#26A69A" stopOpacity="0.75" />
            <Stop offset="0.5" stopColor="#26A69A" stopOpacity="0.35" />
            <Stop offset="1" stopColor="#26A69A" stopOpacity="0" />
          </RadialGradient>

          {/* Amygdala red glow */}
          <RadialGradient id="amygGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#EF5350" stopOpacity="1" />
            <Stop offset="0.6" stopColor="#C62828" stopOpacity="0.8" />
            <Stop offset="1" stopColor="#B71C1C" stopOpacity="0.2" />
          </RadialGradient>

          {/* Outer amygdala pulse ring */}
          <RadialGradient id="amygPulseGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FF5252" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#FF5252" stopOpacity="0" />
          </RadialGradient>

          {/* Brain base fill gradient */}
          <SvgLinearGradient id="brainBase" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={isDark ? "#2A2040" : "#F0EBF8"} stopOpacity="1" />
            <Stop offset="1" stopColor={isDark ? "#1A1530" : "#E8E0F4"} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>

        {/* ── Brain base ── */}
        <Path d={BRAIN_OUTLINE} fill="url(#brainBase)" stroke={brainStroke} strokeWidth={1.5} />

        {/* ── PFC region (clipped to brain) ── */}
        <G clipPath="url(#brainClip)">
          <Path d={PFC_REGION} fill="url(#pfcGlow)" />
        </G>

        {/* ── Gyri texture lines ── */}
        {GYRI_LINES.map((d, i) => (
          <Path
            key={i}
            d={d}
            fill="none"
            stroke={gyriColor}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        ))}

        {/* ── Sylvian fissure ── */}
        <Path
          d={SYLVIAN_FISSURE}
          fill="none"
          stroke={fissureColor}
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* ── Hippocampus curve ── */}
        <Path
          d={HIPPO_CURVE}
          fill="none"
          stroke={isDark ? "rgba(255,200,100,0.2)" : "rgba(150,100,0,0.15)"}
          strokeWidth={4}
          strokeLinecap="round"
        />

        {/* ── Amygdala outer pulse ring ── */}
        <G clipPath="url(#brainClip)">
          <Ellipse
            cx={148}
            cy={116}
            rx={34}
            ry={24}
            fill="url(#amygPulseGlow)"
          />
        </G>

        {/* ── Amygdala body ── */}
        <G clipPath="url(#brainClip)">
          <Ellipse
            cx={148}
            cy={116}
            rx={22}
            ry={15}
            fill="url(#amygGlow)"
            stroke="#FF5252"
            strokeWidth={1}
          />
        </G>

        {/* ── Brain outline (drawn on top for crispness) ── */}
        <Path d={BRAIN_OUTLINE} fill="none" stroke={brainStroke} strokeWidth={1.5} />

        {/* ── PFC label line ── */}
        <Line x1={68} y1={60} x2={18} y2={35} stroke={isDark ? "#4DD0C4" : "#00796B"} strokeWidth={1.2} strokeDasharray="3,2" />
        <Circle cx={18} cy={35} r={3} fill={isDark ? "#4DD0C4" : "#00796B"} />
        <Line x1={68} y1={60} x2={68} y2={60} stroke="none" />

        {/* ── Amygdala label line ── */}
        <Line x1={170} y1={116} x2={220} y2={140} stroke={isDark ? "#FF6B6B" : "#C62828"} strokeWidth={1.2} strokeDasharray="3,2" />
        <Circle cx={220} cy={140} r={3} fill={isDark ? "#FF6B6B" : "#C62828"} />

        {/* ── PFC dot marker ── */}
        <Circle cx={68} cy={60} r={5} fill={isDark ? "#26A69A" : "#00897B"} opacity={0.9} />

        {/* ── Brain stem suggestion ── */}
        <Path
          d="M 155,178 C 158,184 158,188 155,192"
          fill="none"
          stroke={brainStroke}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>

      {/* ── Labels (React Native text, positioned absolutely) ── */}

      {/* PFC label */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: (22 * scale) - 2,
          alignItems: "flex-start",
        }}
        pointerEvents="none"
      >
        <View
          style={{
            backgroundColor: isDark ? "#00695C" : "#E0F7FA",
            borderRadius: 6,
            paddingHorizontal: 7,
            paddingVertical: 3,
            borderWidth: 1,
            borderColor: isDark ? "#26A69A" : "#80DEEA",
          }}
        >
          <Text
            style={{
              fontFamily: "Nunito_700Bold",
              fontSize: 9,
              color: isDark ? "#4DD0C4" : "#00695C",
              letterSpacing: 0.3,
            }}
          >
            PREFRONTAL CORTEX
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "Nunito_400Regular",
            fontSize: 8,
            color: isDark ? "rgba(77,208,196,0.7)" : "rgba(0,105,92,0.7)",
            marginTop: 2,
            marginLeft: 4,
          }}
        >
          Rational mind · calm
        </Text>
      </View>

      {/* Amygdala label */}
      <View
        style={{
          position: "absolute",
          right: 0,
          top: (132 * scale) - 6,
          alignItems: "flex-end",
        }}
        pointerEvents="none"
      >
        <View
          style={{
            backgroundColor: isDark ? "#7F1D1D" : "#FFEBEE",
            borderRadius: 6,
            paddingHorizontal: 7,
            paddingVertical: 3,
            borderWidth: 1,
            borderColor: isDark ? "#EF5350" : "#EF9A9A",
          }}
        >
          <Text
            style={{
              fontFamily: "Nunito_700Bold",
              fontSize: 9,
              color: isDark ? "#FF6B6B" : "#C62828",
              letterSpacing: 0.3,
            }}
          >
            AMYGDALA
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "Nunito_400Regular",
            fontSize: 8,
            color: isDark ? "rgba(255,107,107,0.7)" : "rgba(198,40,40,0.7)",
            marginTop: 2,
            marginRight: 4,
          }}
        >
          Stress alarm · fear
        </Text>
      </View>
    </View>
  );
}
