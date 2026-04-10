import React from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuthContext } from "./src/auth/AuthContext";
import TabNavigator from "./src/navigation/TabNavigator";
import LoginScreen  from "./src/screens/LoginScreen";
import OfflineBanner from "./src/screens/OfflineBanner";
import { useNotifications } from "./src/hooks/useNotifications";
import { useOfflineQueue } from "./src/hooks/useOfflineQueue";
import { colors } from "./src/theme";

// Deep-link → screen mapping.
// Routes emitted in push notification payloads must match these paths.
const linking = {
  prefixes: ["homegentic://"],
  config: {
    screens: {
      Chat:     "chat",
      Photos:   "photos/:jobId?",
      Report:   "report/:token?",
      Settings: "settings",
      // 15.3.6 — notification deep-link routes
      Jobs:     "jobs/:jobId?",
      Leads:    "leads/:leadId?",
      Earnings: "earnings",
    },
  },
};

function RootNavigator() {
  const { authState } = useAuthContext();
  const { isOnline }  = useOfflineQueue();

  // 15.3.5 — register push token + wire notification tap handler
  useNotifications();

  return (
    <View style={styles.root}>
      <OfflineBanner offline={!isOnline} />
      {authState.status === "authenticated" ? <TabNavigator /> : <LoginScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
});

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer linking={linking}>
        <StatusBar style="dark" backgroundColor={colors.paper} />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
