import React, { useEffect, useRef } from "react";
import { View, Text, Animated as RNAnimated } from "react-native";
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
  Rect,
  Line,
} from "react-native-svg";

// ─── SVG canvas ───────────────────────────────────────────────
const VW = 300;
const VH = 215;

// ─── Brain outline (right hemisphere, lateral view, front = left) ─────────────
// Carefully plotted: goes clockwise from top-front
const BRAIN =
  "M 80,22 " +
  "C 108,16 130,14 150,16 " +   // front → top
  "C 172,14 200,16 222,22 " +   // top → back-top
  "C 246,30 264,55 268,82 " +   // back upper curve
  "C 272,108 264,132 252,148 " + // back going down
  "C 238,164 218,174 195,178 " + // back-bottom
  "C 172,182 148,182 124,180 " + // bottom middle
  "C 100,178 76,172 56,162 " +   // bottom-front
  "C 38,152 28,136 28,118 " +   // front lower
  "C 26,98 30,78 40,60 " +      // front middle
  "C 50,44 64,30 80,22 " +      // front upper → close
  "Z";

// ─── Cerebellum ──────────────────────────────────────────────
const CEREBELLUM =
  "M 230,154 " +
  "C 244,148 262,152 268,166 " +
  "C 274,180 264,194 248,196 " +
  "C 232,198 216,190 212,176 " +
  "C 208,164 218,158 230,154 Z";

// ─── Cerebellum internal lines (folia) ───────────────────────
const FOLIA = [
  "M 218,166 C 232,162 248,164 258,172",
  "M 214,178 C 228,174 244,176 254,184",
  "M 220,188 C 232,186 244,188 252,193",
];

// ─── Brain stem ──────────────────────────────────────────────
const BRAINSTEM =
  "M 164,178 C 168,188 168,200 164,206 " +
  "C 160,206 156,200 158,190 C 158,184 160,178 164,178 Z";

// ─── Gyri / cortical fold lines ──────────────────────────────
const GYRI = [
  // frontal lobe folds
  "M 46,62  C 65,54 88,50 110,52",
  "M 38,86  C 60,78 85,74 110,76  C 128,77 142,82 150,90",
  "M 33,110 C 56,103 82,100 108,102 C 128,104 145,110 155,118",
  // parietal / occipital folds
  "M 162,28 C 182,32 200,42 214,56",
  "M 165,52 C 186,56 204,66 216,80",
  "M 164,80 C 186,84 205,96 216,112",
  // temporal folds
  "M 72,164 C 96,160 122,158 148,160 C 170,161 190,166 206,174",
];

// ─── Lateral/Sylvian fissure ─────────────────────────────────
const SYLVIAN = "M 52,128 C 78,120 108,116 140,116 C 162,116 182,120 200,128";

// ─── Central sulcus ──────────────────────────────────────────
const CENTRAL_SULCUS = "M 150,18 C 152,38 150,60 145,82";

// ─── Animated wrappers ───────────────────────────────────────
const AnimatedEllipse = RNAnimated.createAnimatedComponent(Ellipse);
const AnimatedCircle = RNAnimated.createAnimatedComponent(Circle);
const AnimatedRect = RNAnimated.createAnimatedComponent(Rect);

interface Props {
  isDark: boolean;
  width?: number;
}

export function BrainDiagram({ isDark, width = 300 }: Props) {
  const scale = width / VW;
  const svgH = VH * scale;

  // PFC pulse (gentle, slow)
  const pfcOpacity = useRef(new RNAnimated.Value(0.55)).current;
  // Amygdala pulse (faster, more urgent)
  const amygScale = useRef(new RNAnimated.Value(1.0)).current;
  const amygOpacity = useRef(new RNAnimated.Value(0.85)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pfcOpacity, {
          toValue: 0.82,
          duration: 2200,
          useNativeDriver: false,
        }),
        RNAnimated.timing(pfcOpacity, {
          toValue: 0.42,
          duration: 2200,
          useNativeDriver: false,
        }),
      ])
    ).start();

    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(amygScale, {
          toValue: 1.35,
          duration: 900,
          useNativeDriver: false,
        }),
        RNAnimated.timing(amygScale, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: false,
        }),
      ])
    ).start();

    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(amygOpacity, {
          toValue: 1.0,
          duration: 700,
          useNativeDriver: false,
        }),
        RNAnimated.timing(amygOpacity, {
          toValue: 0.55,
          duration: 700,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const brainFill = isDark ? "#1E1B3A" : "#EAE5F5";
  const brainStroke = isDark ? "#5B5280" : "#9B8FC0";
  const gyriColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const fissureColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const cerebellumFill = isDark ? "#171530" : "#E0D8F0";
  const stemFill = isDark ? "#2A2548" : "#D8D0EC";

  // Amygdala pulse ring sizes (interpolated from scale)
  const pulseRx = amygScale.interpolate({ inputRange: [1, 1.35], outputRange: [22, 34] });
  const pulseRy = amygScale.interpolate({ inputRange: [1, 1.35], outputRange: [15, 24] });
  const pulseOpacity = amygScale.interpolate({ inputRange: [1, 1.35], outputRange: [0.35, 0] });

  return (
    <View style={{ width, height: svgH }}>
      <Svg width={width} height={svgH} viewBox={`0 0 ${VW} ${VH}`}>
        <Defs>
          <ClipPath id="brainClip2">
            <Path d={BRAIN} />
          </ClipPath>

          {/* Brain base */}
          <SvgLinearGradient id="brainBase2" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={isDark ? "#26224A" : "#EDE8F8"} stopOpacity="1" />
            <Stop offset="1" stopColor={isDark ? "#181530" : "#E4DDF4"} stopOpacity="1" />
          </SvgLinearGradient>

          {/* PFC fill */}
          <SvgLinearGradient id="pfcFill2" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#26A69A" stopOpacity="1" />
            <Stop offset="0.7" stopColor="#26A69A" stopOpacity="0.6" />
            <Stop offset="1" stopColor="#26A69A" stopOpacity="0" />
          </SvgLinearGradient>

          {/* Amygdala fill */}
          <RadialGradient id="amygFill2" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FF5252" stopOpacity="1" />
            <Stop offset="0.65" stopColor="#E53935" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#C62828" stopOpacity="0.6" />
          </RadialGradient>

          {/* Amygdala pulse ring */}
          <RadialGradient id="amygRing2" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FF5252" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#FF5252" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#FF5252" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* ── Brain stem ── */}
        <Path d={BRAINSTEM} fill={stemFill} stroke={brainStroke} strokeWidth={1} />

        {/* ── Cerebellum ── */}
        <Path
          d={CEREBELLUM}
          fill={cerebellumFill}
          stroke={brainStroke}
          strokeWidth={1.2}
        />
        {FOLIA.map((d, i) => (
          <Path
            key={`folia${i}`}
            d={d}
            fill="none"
            stroke={fissureColor}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        ))}

        {/* ── Main brain fill ── */}
        <Path d={BRAIN} fill="url(#brainBase2)" />

        {/* ── PFC highlighted region (clipped) ── */}
        <G clipPath="url(#brainClip2)">
          <AnimatedRect
            x={0}
            y={0}
            width={102}
            height={VH}
            fill="url(#pfcFill2)"
            opacity={pfcOpacity}
          />
        </G>

        {/* ── Gyri texture ── */}
        {GYRI.map((d, i) => (
          <Path
            key={`g${i}`}
            d={d}
            fill="none"
            stroke={gyriColor}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        ))}

        {/* ── Sulci / fissures ── */}
        <Path
          d={SYLVIAN}
          fill="none"
          stroke={fissureColor}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Path
          d={CENTRAL_SULCUS}
          fill="none"
          stroke={fissureColor}
          strokeWidth={1.8}
          strokeLinecap="round"
        />

        {/* ── Amygdala pulse ring ── */}
        <G clipPath="url(#brainClip2)">
          <AnimatedEllipse
            cx={152}
            cy={124}
            rx={pulseRx}
            ry={pulseRy}
            fill="url(#amygRing2)"
            opacity={pulseOpacity}
          />
        </G>

        {/* ── Amygdala body ── */}
        <G clipPath="url(#brainClip2)">
          <AnimatedEllipse
            cx={152}
            cy={124}
            rx={22}
            ry={15}
            fill="url(#amygFill2)"
            opacity={amygOpacity}
          />
          {/* highlight glint */}
          <Ellipse
            cx={146}
            cy={120}
            rx={6}
            ry={4}
            fill="rgba(255,255,255,0.18)"
          />
        </G>

        {/* ── Brain outline (on top for crispness) ── */}
        <Path
          d={BRAIN}
          fill="none"
          stroke={brainStroke}
          strokeWidth={1.8}
        />

        {/* ── PFC dot marker ── */}
        <Circle
          cx={62}
          cy={72}
          r={5.5}
          fill={isDark ? "#26A69A" : "#00897B"}
          stroke={isDark ? "#4DD0C4" : "#fff"}
          strokeWidth={1.5}
        />

        {/* ── PFC label line ── */}
        <Line
          x1={56}
          y1={66}
          x2={16}
          y2={46}
          stroke={isDark ? "#4DD0C4" : "#00796B"}
          strokeWidth={1.2}
          strokeDasharray="4,3"
        />
        <Circle cx={14} cy={44} r={2.5} fill={isDark ? "#4DD0C4" : "#00796B"} />

        {/* ── Amygdala dot + label line ── */}
        <Circle
          cx={174}
          cy={118}
          r={4}
          fill={isDark ? "#FF5252" : "#E53935"}
          stroke={isDark ? "#FF8A80" : "#fff"}
          strokeWidth={1.5}
        />
        <Line
          x1={178}
          y1={114}
          x2={234}
          y2={92}
          stroke={isDark ? "#FF6B6B" : "#C62828"}
          strokeWidth={1.2}
          strokeDasharray="4,3"
        />
        <Circle cx={236} cy={90} r={2.5} fill={isDark ? "#FF6B6B" : "#C62828"} />
      </Svg>

      {/* ── PFC label ── */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 30 * scale,
          pointerEvents: "none",
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? "rgba(0,105,92,0.9)" : "rgba(224,247,250,0.97)",
            borderRadius: 7,
            paddingHorizontal: 7,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: isDark ? "#26A69A" : "#80DEEA",
          }}
        >
          <Text
            style={{
              fontFamily: "Nunito_700Bold",
              fontSize: 9,
              color: isDark ? "#B2DFDB" : "#004D40",
              letterSpacing: 0.4,
            }}
          >
            PREFRONTAL CORTEX
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "Nunito_500Medium",
            fontSize: 9,
            color: isDark ? "rgba(77,208,196,0.65)" : "rgba(0,77,64,0.6)",
            marginTop: 2,
            marginLeft: 5,
          }}
        >
          Rational · calm
        </Text>
      </View>

      {/* ── Amygdala label ── */}
      <View
        style={{
          position: "absolute",
          right: 0,
          top: 76 * scale,
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        <View
          style={{
            backgroundColor: isDark ? "rgba(183,28,28,0.85)" : "rgba(255,235,238,0.97)",
            borderRadius: 7,
            paddingHorizontal: 7,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: isDark ? "#EF5350" : "#EF9A9A",
          }}
        >
          <Text
            style={{
              fontFamily: "Nunito_700Bold",
              fontSize: 9,
              color: isDark ? "#FFCDD2" : "#B71C1C",
              letterSpacing: 0.4,
            }}
          >
            AMYGDALA
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "Nunito_500Medium",
            fontSize: 9,
            color: isDark ? "rgba(255,107,107,0.65)" : "rgba(183,28,28,0.6)",
            marginTop: 2,
            marginRight: 5,
          }}
        >
          Alarm · threat
        </Text>
      </View>
    </View>
  );
}
