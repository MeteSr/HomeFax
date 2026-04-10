import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, fonts, spacing } from "../theme";
import { useOfflineQueue } from "../hooks/useOfflineQueue";

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { pendingCount, failedCount } = useOfflineQueue();
  const queueCount = pendingCount + failedCount;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>SETTINGS</Text>

      <Pressable
        style={styles.row}
        onPress={() => navigation.navigate("QueueStatus")}
        accessibilityRole="button"
        accessibilityLabel="Offline Queue"
      >
        <Text style={styles.rowLabel}>Offline Queue</Text>
        {queueCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{queueCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    padding: spacing.lg,
  },
  heading: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.inkLight,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  rowLabel: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
  },
  badge: {
    backgroundColor: colors.rust,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: "#fff",
  },
});
