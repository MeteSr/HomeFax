import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ContractorStackParamList } from "../navigation/ContractorStack";
import { getLeads, filterLeadsBySpecialties, Lead } from "../services/contractorService";
import { colors, fonts, spacing, borderWidth } from "../theme";

type Nav = NativeStackNavigationProp<ContractorStackParamList, "LeadFeed">;

const URGENCY_COLOR: Record<string, string> = {
  Emergency: colors.rust,
  High:      "#C9882E",
  Medium:    colors.inkLight,
  Low:       colors.rule,
};

function LeadCard({ lead, onPress }: { lead: Lead; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${lead.serviceType} lead — ${lead.urgency} urgency`}
    >
      <View style={[styles.urgencyBar, { backgroundColor: URGENCY_COLOR[lead.urgency] }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.serviceType}>{lead.serviceType}</Text>
          <Text style={[styles.urgencyTag, { color: URGENCY_COLOR[lead.urgency] }]}>
            {lead.urgency.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>{lead.description}</Text>
        <Text style={styles.zip}>{lead.propertyZip}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function LeadFeedScreen() {
  const navigation = useNavigation<Nav>();
  const [leads, setLeads]     = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeads()
      .then((all) => setLeads(filterLeadsBySpecialties(all, [])))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.rust} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>OPEN LEADS</Text>
        <Text style={styles.count}>{leads.length}</Text>
      </View>
      <FlatList
        data={leads}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <LeadCard
            lead={item}
            onPress={() => navigation.navigate("LeadDetail", { lead: item })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No open leads matching your specialties.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  center:    { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: borderWidth,
    borderBottomColor: colors.rule,
  },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2, color: colors.inkLight },
  count:        { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
  list: { padding: spacing.md },
  card: {
    flexDirection: "row",
    borderWidth: borderWidth,
    borderColor: colors.rule,
    marginBottom: spacing.sm,
  },
  urgencyBar: { width: 4 },
  cardBody:   { flex: 1, padding: spacing.md },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  serviceType: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },
  urgencyTag:  { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1 },
  description: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkLight, lineHeight: 18 },
  zip:         { fontFamily: fonts.mono, fontSize: 10, color: colors.inkLight, marginTop: 4, letterSpacing: 0.5 },
  empty:       { fontFamily: fonts.sans, fontSize: 14, color: colors.inkLight, textAlign: "center", marginTop: spacing.xl },
});
