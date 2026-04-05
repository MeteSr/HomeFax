import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Lead } from "../services/contractorService";
import ChatScreen       from "../screens/ChatScreen";
import LeadFeedScreen   from "../screens/LeadFeedScreen";
import LeadDetailScreen from "../screens/LeadDetailScreen";
import EarningsScreen   from "../screens/EarningsScreen";
import { colors, fonts } from "../theme";

export type ContractorStackParamList = {
  Chat:       undefined;
  LeadFeed:   undefined;
  LeadDetail: { lead: Lead };
  Earnings:   undefined;
};

const Stack = createNativeStackNavigator<ContractorStackParamList>();

export default function ContractorStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle:      { backgroundColor: colors.paper },
        headerTintColor:  colors.ink,
        headerTitleStyle: { fontFamily: fonts.mono, fontSize: 11 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Chat"       component={ChatScreen}       options={{ headerShown: false }} />
      <Stack.Screen name="LeadFeed"   component={LeadFeedScreen}   options={{ title: "OPEN LEADS" }} />
      <Stack.Screen name="LeadDetail" component={LeadDetailScreen} options={{ title: "LEAD DETAIL" }} />
      <Stack.Screen name="Earnings"   component={EarningsScreen}   options={{ title: "EARNINGS" }} />
    </Stack.Navigator>
  );
}
