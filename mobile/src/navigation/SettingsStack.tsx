import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsScreen    from "../screens/SettingsScreen";
import QueueStatusScreen from "../screens/QueueStatusScreen";
import { colors, fonts }  from "../theme";
import { useOfflineQueue } from "../hooks/useOfflineQueue";

export type SettingsStackParamList = {
  SettingsHome: undefined;
  QueueStatus:  undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

function QueueStatusScreenWrapper() {
  const { items, retry, discard } = useOfflineQueue();
  return <QueueStatusScreen items={items} onRetry={retry} onDiscard={discard} />;
}

export default function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:       { backgroundColor: colors.paper },
        headerTintColor:   colors.ink,
        headerTitleStyle:  { fontFamily: fonts.mono, fontSize: 11 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ title: "SETTINGS" }}
      />
      <Stack.Screen
        name="QueueStatus"
        component={QueueStatusScreenWrapper}
        options={{ title: "OFFLINE QUEUE" }}
      />
    </Stack.Navigator>
  );
}
