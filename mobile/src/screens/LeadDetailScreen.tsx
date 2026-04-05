import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ContractorStackParamList } from "../navigation/ContractorStack";
import { colors, fonts, spacing, borderWidth } from "../theme";

type Props = NativeStackScreenProps<ContractorStackParamList, "LeadDetail">;

export default function LeadDetailScreen({ route, navigation }: Props) {
  const { lead } = route.params;
  const [amount, setAmount]       = useState("");
  const [timeline, setTimeline]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitBid() {
    const dollars = parseFloat(amount);
    const days    = parseInt(timeline, 10);
    if (!dollars || !days) {
      Alert.alert("Missing info", "Enter a bid amount and timeline to continue.");
      return;
    }

    Alert.alert(
      "Confirm bid",
      `Bid $${dollars.toLocaleString()} with a ${days}-day timeline on this ${lead.serviceType} job?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            setSubmitting(true);
            // TODO: wire to quoteService.submitBid() via agent
            await new Promise((r) => setTimeout(r, 600));
            setSubmitting(false);
            Alert.alert("Bid submitted", "You'll be notified when the homeowner responds.", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.serviceType}>{lead.serviceType}</Text>
        <Text style={styles.urgency}>{lead.urgency.toUpperCase()}</Text>
        <Text style={styles.description}>{lead.description}</Text>
        <Text style={styles.zip}>{lead.propertyZip}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formLabel}>YOUR BID</Text>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldHint}>Amount ($)</Text>
          <TextInput
            style={styles.fieldInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="1500"
            placeholderTextColor={colors.inkLight}
            keyboardType="numeric"
            accessibilityLabel="Bid amount"
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldHint}>Timeline (days)</Text>
          <TextInput
            style={styles.fieldInput}
            value={timeline}
            onChangeText={setTimeline}
            placeholder="5"
            placeholderTextColor={colors.inkLight}
            keyboardType="numeric"
            accessibilityLabel="Timeline in days"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={submitBid}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Submit bid"
        >
          {submitting
            ? <ActivityIndicator color={colors.paper} size="small" />
            : <Text style={styles.submitBtnText}>SUBMIT BID</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  hero: {
    padding: spacing.lg,
    borderBottomWidth: borderWidth,
    borderBottomColor: colors.rule,
  },
  serviceType: { fontFamily: fonts.serif, fontSize: 28, color: colors.ink, marginBottom: 4 },
  urgency:     { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 2, color: colors.rust, marginBottom: spacing.sm },
  description: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink, lineHeight: 22, marginBottom: spacing.sm },
  zip:         { fontFamily: fonts.mono, fontSize: 11, color: colors.inkLight, letterSpacing: 0.5 },
  form: { padding: spacing.lg },
  formLabel: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2, color: colors.inkLight, marginBottom: spacing.md },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: borderWidth,
    borderBottomColor: colors.rule,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  fieldHint: { fontFamily: fonts.mono, fontSize: 11, color: colors.inkLight, width: 130 },
  fieldInput: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 4,
  },
  submitBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.rust,
    padding: spacing.md,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2, color: colors.paper },
});
