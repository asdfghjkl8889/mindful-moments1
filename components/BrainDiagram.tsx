import React from "react";
import { Image } from "react-native";

interface Props {
  isDark: boolean;
  width?: number;
}

export function BrainDiagram({ width = 300 }: Props) {
  const height = width * (3 / 4);
  return (
    <Image
      source={require("@/assets/images/brain_diagram_nobg.png")}
      style={{ width, height, borderRadius: 12 }}
      resizeMode="contain"
    />
  );
}
