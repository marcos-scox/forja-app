import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { forjaColors } from "@/components/forja-ui";

const iconByRoute = {
  index: "fitness-center",
  cardio: "directions-run",
  history: "history",
  coach: "auto-awesome",
  settings: "settings",
} as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: forjaColors.lime,
        tabBarInactiveTintColor: forjaColors.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginTop: 2 },
        tabBarStyle: {
          backgroundColor: forjaColors.surface,
          borderTopColor: forjaColors.border,
          borderTopWidth: 1,
          height: 58 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, focused }) => (
          <MaterialIcons color={color} name={iconByRoute[route.name as keyof typeof iconByRoute]} size={focused ? 25 : 23} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Treinos" }} />
      <Tabs.Screen name="cardio" options={{ title: "Cardio" }} />
      <Tabs.Screen name="history" options={{ title: "Histórico" }} />
      <Tabs.Screen name="coach" options={{ title: "IA Coach" }} />
      <Tabs.Screen name="settings" options={{ title: "Ajustes" }} />
    </Tabs>
  );
}
