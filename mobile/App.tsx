import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import PropertyListScreen from "./src/screens/PropertyListScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: "#2563EB" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "PersonalFinance" }}
        />
        <Stack.Screen
          name="PropertyList"
          component={PropertyListScreen}
          options={{ title: "부동산 검색" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
