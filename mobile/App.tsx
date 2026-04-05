import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuthContext } from "./src/auth/AuthContext";
import TabNavigator from "./src/navigation/TabNavigator";
import LoginScreen from "./src/screens/LoginScreen";
import { colors } from "./src/theme";

const linking = {
  prefixes: ["homefax://"],
  config: {
    screens: {
      Chat:     "chat",
      Photos:   "photos/:jobId?",
      Report:   "report/:token?",
      Settings: "settings",
    },
  },
};

function RootNavigator() {
  const { authState } = useAuthContext();

  if (authState.status === "authenticated") {
    return <TabNavigator />;
  }

  // idle | loading | error → show login
  return <LoginScreen />;
}

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
