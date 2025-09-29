import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MapScreen from "../screens/MapScreen";
import LoginScreen from "../screens/LoginScreen"; // Make sure this path is correct

const Stack = createNativeStackNavigator();

export default function AppNavigator({ isAuthenticated, setIsAuthenticated }) {
  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        <Stack.Screen name="Map" options={{ headerShown: false }}>
          {(props) => <MapScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Login" options={{ headerShown: false }}>
          {(props) => <LoginScreen {...props} setIsAuthenticated={setIsAuthenticated} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}