import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ChatStackParamList } from "../navigation/ChatStack";
import { getMyQuoteRequests, type QuoteRequest } from "../services/quoteService";
import { urgencyLabel, type Urgency } from "../services/quoteFormService";
import { colors, fonts, spacing, borderWidth } from "../theme";

type Props = NativeStackScreenProps<ChatStackParamList, "MyQuotes">;
type Nav   = NativeStackNavigationProp<ChatStackParamList, "MyQuotes">;

const STATUS_COLORS: Record<string, string> = {
  open:     colors.sage,
  quoted:   "#8B7A3A",
  accepted: colors.rust,
  closed:   colors.inkLight,
};

const URGENCY_COLORS: Record<Urgency, string> = {
  low:       colors.inkLight,
  medium:    "#8B7A3A",
  high:      colors.rust,
  emergency: "#8B1A1A",
};

function RequestRow({ item }: { item: QuoteRequest }) {
  const statusColor  = STATUS_COLORS[item.status]  ?? colors.inkLight;
  const urgencyColor = URGENCY_COLORS[item.urgency] ?? colors.inkLight;
  const date = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });

  return (
    <View style={styles.row}>
      <View style={[styles.indicator, { backgroundColor: urgencyColor }]} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.serviceType}>{item.serviceType}</Text>
          <Text style={[styles.statusBadge, { color: statusColor }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <View style={styles.rowMeta}>
          <Text style={styles.metaText}>{urgencyLabel(item.urgency)} urgency</Text>
          <Text style={styles.metaText}>{date}</Text>
        </View>
      </View>
    </View>
  );
}

export default function MyQuotesScreen({ route }: Props) {
  const { propertyId, propertyAddress } = route.params;
  const navigation = useNavigation<Nav>();

  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading,  setLoading]  = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getMyQuoteRequests(propertyId)
        .then(setRequests)
        .finally(() => setLoading(false));
    }, [propertyId])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>QUOTE REQUESTS</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("QuoteRequest", { propertyId, propertyAddress })}
          accessibilityRole="button"
          accessibilityLabel="New quote request"
        >
          <Text style={styles.newBtn}>+ NEW</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.rust} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <RequestRow item={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyHeading}>No requests yet.</Text>
              <Text style={styles.emptyHint}>Tap + NEW to request contractor quotes.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  header: {
    flexDirection:     "row",
    justifyContent:    "space-between",
    alignItems:        "center",
    padding:           spacing.md,
    borderBottomWidth: borderWidth,
    borderBottomColor: colors.rule,
  },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2, color: colors.inkLight },
  newBtn:       { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, color: colors.rust },

  list: { paddingVertical: spacing.sm },

  row: {
    flexDirection:     "row",
    borderBottomWidth: borderWidth,
    borderBottomColor: colors.rule,
  },
  indicator: { width: 4 },
  rowBody:   { flex: 1, padding: spacing.md },
  rowTop: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   4,
  },
  serviceType: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },
  statusBadge: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1 },
  description: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkLight, marginBottom: 6 },
  rowMeta:     { flexDirection: "row", justifyContent: "space-between" },
  metaText:    { fontFamily: fonts.mono, fontSize: 10, color: colors.inkLight, letterSpacing: 0.5 },

  emptyState: {
    flex:           1,
    alignItems:     "center",
    justifyContent: "center",
    paddingTop:     spacing.xxl,
  },
  emptyHeading: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink, marginBottom: spacing.sm },
  emptyHint:    { fontFamily: fonts.sans, fontSize: 14, color: colors.inkLight },
});
