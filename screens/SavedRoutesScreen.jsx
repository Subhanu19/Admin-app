import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  useColorScheme,
  ActivityIndicator
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getSavedRoutes, deleteRoute, clearAllRoutes } from "../utils/storage";
import { send_route_to_server } from "../utils/Api"; // Import your API function

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Color themes (keep your existing color definitions)
const LightColours = {
  primary: "#FFD700",
  secondary: "rgba(11, 8, 8, 1)",
  accent: "#ff6b35",
  danger: "#dc2626",
  warning: "#f59e0b",
  success: "#10b981",
  textDark: "#000000",
  textSecondary: "#666666",
  background: "#ffffff",
  card: "#f8f9fa",
  border: "#e0e0e0"
};

const DarkColours = {
  primary: "#FFD700",
  secondary: "rgba(11, 8, 8, 1)",
  accent: "#ff6b35",
  danger: "#dc2626",
  warning: "#f59e0b",
  success: "#10b981",
  textDark: "#ffffff",
  textSecondary: "#a0a0a0",
  background: "#000000",
  card: "#1a1a1a",
  border: "#333333"
};

export default function SavedRoutesScreen({ setIsAuthenticated, isDarkMode, setIsDarkMode }) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  
  const colours = isDarkMode ? DarkColours : LightColours;
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState({}); // Track loading state for each route

  useEffect(() => {
    if (isFocused) {
      loadSavedRoutes();
    }
  }, [isFocused]);

  const loadSavedRoutes = async () => {
    try {
      const routes = await getSavedRoutes();
      setSavedRoutes(routes);
    } catch (error) {
      console.error("Error loading saved routes:", error);
      Alert.alert("Error", "Failed to load saved routes.");
    }
  };

  // New function to handle saving route to server
  const handleSaveToServer = async (route) => {
    try {
      setLoadingRoutes(prev => ({ ...prev, [route.id]: true }));
      
      console.log('Saving route to server:', route);
      
      // Prepare the route data in the format expected by your API
      const routeData = {
        up_route_name: route.up_route_name,
        down_route_name: route.down_route_name,
        src: route.src,
        dest: route.dest,
        up_departure_time: route.up_departure_time,
        down_departure_time: route.down_departure_time,
        stops: route.stops.map(stop => ({
          lat: stop.lat,
          lon: stop.lon,
          location_name: stop.location_name,
          is_stop: stop.is_stop || false
        }))
      };

      const result = await send_route_to_server(routeData);
      
      Alert.alert("Success", "Route saved to server successfully!");
      console.log('Server response:', result);
      
    } catch (error) {
      console.error('Error saving route to server:', error);
      Alert.alert(
        "Error", 
        error.message || "Failed to save route to server. Please try again."
      );
    } finally {
      setLoadingRoutes(prev => ({ ...prev, [route.id]: false }));
    }
  };

  // Updated RouteCard component with Save button
  const RouteCard = ({ route, index }) => {
    const region = calculateRegion(route.stops);
    const isLoading = loadingRoutes[route.id];
    
    return (
      <View style={[styles.routeCard, { backgroundColor: colours.card, borderColor: colours.border }]}>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.miniMap}
            region={region}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {route.stops.map((stop, idx) => (
              <Marker
                key={idx}
                coordinate={{ 
                  latitude: parseFloat(stop.lat), 
                  longitude: parseFloat(stop.lon) 
                }}
                pinColor={stop.is_stop ? colours.primary : colours.secondary}
              />
            ))}
            {route.stops.length > 1 && (
              <Polyline
                coordinates={route.stops.map(stop => ({
                  latitude: parseFloat(stop.lat),
                  longitude: parseFloat(stop.lon)
                }))}
                strokeColor={colours.primary}
                strokeWidth={3}
              />
            )}
          </MapView>
        </View>

        <View style={styles.routeInfo}>
          <View style={styles.routeHeader}>
            <View style={styles.routeNames}>
              <Text style={[styles.routeName, { color: colours.textDark }]}>
                {route.up_route_name}
              </Text>
              <Text style={[styles.routeDirection, { color: colours.textSecondary }]}>
                ↑ {route.src} → {route.dest}
              </Text>
              <Text style={[styles.routeDirection, { color: colours.textSecondary }]}>
                ↓ {route.dest} → {route.src}
              </Text>
            </View>
            
            <View style={styles.cardActions}>
              {/* Save to Server Button */}
              <TouchableOpacity 
                style={[
                  styles.saveButton, 
                  { backgroundColor: colours.success },
                  isLoading && styles.saveButtonDisabled
                ]}
                onPress={() => handleSaveToServer(route)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={16} color="white" />
                )}
                <Text style={styles.saveButtonText}>
                  {isLoading ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
              
              {/* Delete Button */}
              <TouchableOpacity 
                style={styles.deleteCardButton}
                onPress={() => handleDeleteRoute(route.id)}
              >
                <Ionicons name="trash-outline" size={20} color={colours.danger} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.routeDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={14} color={colours.textSecondary} />
              <Text style={[styles.detailText, { color: colours.textSecondary }]}>
                {route.stops.length} stops
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={14} color={colours.textSecondary} />
              <Text style={[styles.detailText, { color: colours.textSecondary }]}>
                Depart: {route.down_departure_time}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Keep your existing handleDeleteRoute, handleClearAllRoutes, calculateRegion functions
  const handleDeleteRoute = (routeId) => {
    Alert.alert(
      "Delete Route",
      "Are you sure you want to delete this route?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRoute(routeId);
              await loadSavedRoutes();
              Alert.alert("Success", "Route deleted successfully!");
            } catch (error) {
              Alert.alert("Error", "Failed to delete route.");
            }
          }
        }
      ]
    );
  };

  const handleClearAllRoutes = () => {
    if (savedRoutes.length === 0) {
      Alert.alert("Info", "No routes to delete.");
      return;
    }

    Alert.alert(
      "Clear All Routes",
      "Are you sure you want to delete ALL saved routes? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllRoutes();
              setSavedRoutes([]);
              Alert.alert("Success", "All routes deleted successfully!");
            } catch (error) {
              Alert.alert("Error", "Failed to delete routes.");
            }
          }
        }
      ]
    );
  };

  const calculateRegion = (stops) => {
    // ... keep your existing calculateRegion function
    if (!stops || stops.length === 0) {
      return {
        latitude: 9.917,
        longitude: 78.119,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2
      };
    }

    const lats = stops.map(stop => parseFloat(stop.lat));
    const lons = stops.map(stop => parseFloat(stop.lon));
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    const latitudeDelta = (maxLat - minLat) * 1.5;
    const longitudeDelta = (maxLon - minLon) * 1.5;
    
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: Math.max(latitudeDelta, 0.01),
      longitudeDelta: Math.max(longitudeDelta, 0.01)
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: colours.background }]}>
      {/* Header remains the same */}
      <View style={[styles.header, { 
        backgroundColor: colours.card, 
        borderBottomColor: colours.border,
        paddingTop: 50,
      }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colours.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colours.textDark }]}>
          Saved Routes ({savedRoutes.length})
        </Text>
        
        <TouchableOpacity 
          style={styles.clearAllButton}
          onPress={handleClearAllRoutes}
          disabled={savedRoutes.length === 0}
        >
          <Ionicons 
            name="trash-bin-outline" 
            size={24} 
            color={savedRoutes.length === 0 ? colours.textSecondary : colours.danger} 
          />
        </TouchableOpacity>
      </View>

      {savedRoutes.length > 0 ? (
        <ScrollView 
          style={styles.routesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.routesListContent}
        >
          {savedRoutes.map((route, index) => (
            <RouteCard key={route.id || index} route={route} index={index} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={64} color={colours.textSecondary} />
          <Text style={[styles.emptyStateText, { color: colours.textSecondary }]}>
            No saved routes yet
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: colours.textSecondary }]}>
            Create your first route in the Map screen
          </Text>
          <TouchableOpacity 
            style={[styles.goToMapButton, { backgroundColor: colours.primary }]}
            onPress={() => navigation.navigate("Map")}
          >
            <Text style={styles.goToMapButtonText}>Create Route</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logout Button */}
      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: colours.danger }]}
        onPress={() => {
          Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Logout", 
                style: "destructive",
                onPress: () => setIsAuthenticated(false)
              }
            ]
          );
        }}
      >
        <Ionicons name="log-out-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  clearAllButton: {
    padding: 8,
    width: 40,
    alignItems: "flex-end",
  },
  routesList: {
    flex: 1,
  },
  routesListContent: {
    padding: 16,
    paddingBottom: 80,
  },
  routeCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  mapContainer: {
    height: 120,
    width: "100%",
  },
  miniMap: {
    flex: 1,
  },
  routeInfo: {
    padding: 12,
  },
  routeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  routeNames: {
    flex: 1,
    marginRight: 8,
  },
  routeName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  routeDirection: {
    fontSize: 12,
    marginBottom: 2,
  },
  // New styles for card actions
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteCardButton: {
    padding: 4,
  },
  routeDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  goToMapButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  goToMapButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoutButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
});