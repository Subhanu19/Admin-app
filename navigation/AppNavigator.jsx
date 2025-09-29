import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MapScreen from "../screens/MapScreen";
import LoginScreen from "../screens/LoginScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator({ isAuthenticated, setIsAuthenticated }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: '#000000',
        },
      }}
    >
      {isAuthenticated ? (
        // Only Map screen for authenticated users
        <Stack.Screen 
          name="Map" 
          options={{ 
            title: 'Create Route',
            headerShown: true,
          }}
        >
          {(props) => (
            <MapScreen 
              {...props} 
              setIsAuthenticated={setIsAuthenticated} 
            />
          )}
        </Stack.Screen>
      ) : (
        // Login screen for unauthenticated users
        <Stack.Screen 
          name="Login" 
          options={{ headerShown: false }}
        >
          {(props) => (
            <LoginScreen 
              {...props} 
              setIsAuthenticated={setIsAuthenticated} 
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}