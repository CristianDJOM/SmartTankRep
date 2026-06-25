import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import StackNavigator from "./navigation/StackNavigator";
import { UserContext } from "./UserContext";

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <UserContext>
        <StackNavigator />
      </UserContext>
    </SafeAreaProvider>
  );
}
