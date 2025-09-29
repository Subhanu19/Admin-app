import React, { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import MapScreen from "./screens/MapScreen";
import LoginScreen from "./screens/LoginScreen";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <BottomSheetModalProvider>
          {isAuthenticated ? (
            <MapScreen setIsAuthenticated={setIsAuthenticated} />
          ) : (
            <LoginScreen setIsAuthenticated={setIsAuthenticated} />
          )}
        </BottomSheetModalProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}