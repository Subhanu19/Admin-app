import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useColorScheme } from "react-native";
import MapScreen from "../screens/MapScreen.jsx";
import LoginScreen from "../screens/LoginScreen.jsx";
import SavedRoutesScreen from "../screens/SavedRoutesScreen.jsx";

const Stack = createNativeStackNavigator();

export default function AppNavigator({ isAuthenticated, setIsAuthenticated }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDarkMode ? '#000000' : '#ffffff',
        },
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Map">
            {(props) => (
              <MapScreen 
                {...props} 
                setIsAuthenticated={setIsAuthenticated}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="SavedRoutes">
            {(props) => (
              <SavedRoutesScreen 
                {...props} 
                setIsAuthenticated={setIsAuthenticated}
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
              />
            )}
          </Stack.Screen>
        </>
      ) : (
        <Stack.Screen name="Login">
          {(props) => (
            <LoginScreen 
              {...props} 
              setIsAuthenticated={setIsAuthenticated}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}