import React from "react";
import { View, Text, Image } from "react-native";

interface Props {
  isDark: boolean;
  width?: number;
}

export function BrainDiagram({ isDark, width = 300 }: Props) {
  const height = width * (3 / 4);

  return (
    <View style={{ width, height }}>
      <Image
        source={require("@/assets/images/brain_diagram_nobg.png")}
        style={{ width, height }}
        resizeMode="contain"
      />

      {/* Prefrontal Cortex label — top-left, over the teal region */}
      <View
        style={{
          position: "absolute",
          top: height * 0.06,
          left: width * 0.0,
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            backgroundColor: "#00897B",
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontFamily: "Nunito_700Bold",
              fontSize: 11,
              color: "#fff",
              letterSpacing: 0.3,
            }}
          >
            Prefrontal Cortex
          </Text>
        </View>
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 16, color: "#00897B", marginLeft: 18, marginTop: 2 }}>↘</Text>
      </View>

      {/* Amygdala label — positioned over the red dot (center-right of brain) */}
      <View
        style={{
          position: "absolute",
          top: height * 0.44,
          right: width * 0.04,
          alignItems: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#C62828",
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontFamily: "Nunito_700Bold",
              fontSize: 11,
              color: "#fff",
              letterSpacing: 0.3,
            }}
          >
            Amygdala
          </Text>
        </View>
        <Text style={{ fontSize: 18, marginRight: 14, lineHeight: 14, textAlign: "right" }}>↙</Text>
      </View>
    </View>
  );
}
