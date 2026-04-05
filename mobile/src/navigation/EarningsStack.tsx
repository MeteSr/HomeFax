import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors, fonts } from "../theme";
import EarningsScreen          from "../screens/EarningsScreen";
import PendingSignaturesScreen from "../screens/PendingSignaturesScreen";

export type EarningsStackParamList = {
  Earnings:           undefined;
  PendingSignatures:  undefined;
};

const Stack = createNativeStackNavigator<EarningsStackParamList>();

export default function EarningsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:         { backgroundColor: colors.paper },
        headerTintColor:     colors.ink,
        headerTitleStyle:    { fontFamily: fonts.mono, fontSize: 11 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Earnings"          component={EarningsScreen}          options={{ title: "EARNINGS" }} />
      <Stack.Screen name="PendingSignatures" component={PendingSignaturesScreen} options={{ title: "PENDING SIGNATURES" }} />
    </Stack.Navigator>
  );
}
