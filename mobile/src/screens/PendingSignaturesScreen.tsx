import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  getPendingSignatureJobs,
  sortPendingJobs,
  formatPendingStatus,
  formatEarnings,
  PendingSignatureJob,
} from "../services/contractorService";
import { colors, fonts, spacing, borderWidth } from "../theme";

function JobRow({ job }: { job: PendingSignatureJob }) {
  const isActionRequired = job.awaitingRole === "contractor";
  const statusColor = isActionRequired ? colors.rust : colors.inkLight;

  return (
    <View style={styles.row}>
      <View style={[styles.indicator, { backgroundColor: statusColor }]} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.serviceType}>{job.serviceType}</Text>
          <Text style={[styles.status, { color: statusColor }]}>
            {formatPendingStatus(job.awaitingRole).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.address} numberOfLines={1}>{job.propertyAddress}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{job.completedDate}</Text>
          <Text style={styles.metaText}>{formatEarnings(job.amountCents)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function PendingSignaturesScreen() {
  const [jobs, setJobs]       = useState<PendingSignatureJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPendingSignatureJobs()
      .then((all) => setJobs(sortPendingJobs(all)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.rust} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>PENDING SIGNATURES</Text>
        {jobs.length > 0 && (
          <Text style={styles.count}>{jobs.length}</Text>
        )}
      </View>
      <FlatList
        data={jobs}
        keyExtractor={(j) => j.id}
        renderItem={({ item }) => <JobRow job={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyHeading}>All caught up.</Text>
            <Text style={styles.emptyHint}>No jobs are waiting for a signature.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  center:    { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper },
  header: {
    flexDirection:      "row",
    justifyContent:     "space-between",
    alignItems:         "center",
    padding:            spacing.md,
    borderBottomWidth:  borderWidth,
    borderBottomColor:  colors.rule,
  },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2, color: colors.inkLight },
  count:        { fontFamily: fonts.serif, fontSize: 22, color: colors.rust },
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
  status:      { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1 },
  address:     { fontFamily: fonts.sans, fontSize: 13, color: colors.inkLight, marginBottom: 6 },
  meta:        { flexDirection: "row", gap: spacing.md },
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
