import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../theme";

interface Props {
  offline: boolean;
}

export default function OfflineBanner({ offline }: Props) {
  if (!offline) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>No internet connection — writes queued for sync</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#B45309",
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    color: "#FEF3C7",
  },
});
