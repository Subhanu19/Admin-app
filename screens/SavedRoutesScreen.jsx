import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { 
  send_route_to_server, 
  createUpRoute, 
  createDownRoute,
  deleteRouteFromServer,
  fetchAllRoutes 
} from "../utils/Api";
import { saveRoute,clearAllRoutes, deleteRoute, getSavedRoutes } from "../utils/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Light theme colors only
const Colours = {
  primary: "#FFD700",
  secondary: "rgba(11, 8, 8, 1)",
  accent: "#ff6b35",
  danger: "#dc2626",
  warning: "#f59e0b",
  success: "#10b981",
  info: "#3B82F6",
  textDark: "#000000",
  textSecondary: "#666666",
  background: "#ffffff",
  card: "#f8f9fa",
  border: "#e0e0e0"
};

export default function SavedRoutesScreen({ setIsAuthenticated }) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [downRouteStatus, setDownRouteStatus] = useState({});

  useEffect(() => {
    if (isFocused) {
      loadSavedRoutes();
    }
  }, [isFocused]);
const loadSavedRoutes = async () => {
  try {
    const localRoutes = await getSavedRoutes();

    // ❌ REMOVE any route with 0 stops (UP / DOWN / SAME PATH)
    const cleanedRoutes = localRoutes.filter(route => {
      return Array.isArray(route.stops) && route.stops.length > 0;
    });

    // 🔥 rewrite storage only if something was removed
    if (cleanedRoutes.length !== localRoutes.length) {
      await clearAllRoutes();
      for (const r of cleanedRoutes) {
        await saveRoute(r);
      }
    }

    setSavedRoutes(cleanedRoutes);
    checkDownRouteStatus(cleanedRoutes);

  } catch (error) {
    console.error("Error loading saved routes:", error);
    Alert.alert("Error", "Failed to load saved routes.");
  }
};



const checkDownRouteStatus = (routes) => {
  const status = {};

  for (const route of routes) {
    const isSamePath = route.same_path === true || route.same_path === "true";
    const direction = route.direction?.toUpperCase();
    const isUpRoute = direction === "UP";

    if (!isSamePath && isUpRoute && route.id) {
      status[route.id] = routes.some(
        r =>
          r.direction?.toUpperCase() === "DOWN" &&
          r.linked_route_id === route.id
      );
    }
  }

  setDownRouteStatus(status);
};

 


  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedRoutes();
    setRefreshing(false);
  };

  // Updated handleSaveToServer to support different path routes
  const handleSaveToServer = async (route) => {
    try {
      setLoadingRoutes(prev => ({ ...prev, [route.id]: true }));
      
      console.log('Saving route to server:', {
        route_name: route.route_name || route.up_route_name,
        same_path: route.same_path,
        direction: route.direction,
        stops: route.stops?.length || 0
      });
      
      let result;
      
      if (route.same_path === true || route.same_path === undefined) {
        // Same path route
        result = await send_route_to_server(route);
      } else if (route.same_path === false) {
        // Different path route
        if (route.direction === 'UP') {
          result = await createUpRoute(route);
          // Update the route ID if it's returned from server
          if (result.route_id) {
            // You might want to update the local storage with the server ID
          }
        } else if (route.direction === 'DOWN') {
          if (route.linked_route_id) {
            result = await createDownRoute(route, route.linked_route_id);
          } else {
            throw new Error("Linked route ID is required for DOWN route");
          }
        }
      }
      
      Alert.alert("✅ Success", "Route saved to server successfully!");
      console.log('Server response:', result);
      
    } catch (error) {
      console.error('Error saving route to server:', error);
      
      if (error.message?.includes('Authentication failed')) {
        Alert.alert(
          "Authentication Required", 
          "Please login again to save routes.",
          [
            {
              text: "Login",
              onPress: () => setIsAuthenticated(false)
            },
            {
              text: "Cancel",
              style: "cancel"
            }
          ]
        );
      } else {
        Alert.alert(
          "Error", 
          error.message || "Failed to save route to server. Please try again."
        );
      }
    } finally {
      setLoadingRoutes(prev => ({ ...prev, [route.id]: false }));
    }
  };

  const handleDeleteRoute = async (route) => {
    Alert.alert(
      "Delete Route",
      `Are you sure you want to delete "${route.route_name || route.up_route_name}"?`,
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
              // Delete from local storage
              await deleteRoute(route.id);
              
              // Optionally delete from server
              // if (route.server_id) {
              //   await deleteRouteFromServer(route.server_id);
              // }
              
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

  const handleMarkDownRoute = (route) => {
    navigation.navigate("Map", {
      routeId: route.id,
      mode: "different",
      direction: "DOWN"
    });
  };

  const handleEditRoute = (route) => {
    navigation.navigate("Map", {
      editRoute: route,
      mode: route.same_path === false ? 'different' : 'same',
      direction: route.direction || 'UP'
    });
  };

  // Updated RouteCard component with support for different path
  const RouteCard = ({ route, index }) => {
    const region = calculateRegion(route.stops);
    const isLoading = loadingRoutes[route.id];
    const isSamePath = route.same_path === true || route.same_path === "true";
    const direction = route.direction?.toUpperCase();
    const isUpRoute = direction === "UP";
    const isDownRoute = direction === "DOWN";
    const hasDownRouteCreated = downRouteStatus[route.id] === true;


    
    return (
      <View style={[styles.routeCard, { backgroundColor: Colours.card, borderColor: Colours.border }]}>
        {/* Path Type Indicator - UPDATED */}
        <View style={[
          styles.pathTypeIndicator,
          isSamePath ? styles.samePathIndicator : styles.differentPathIndicator
        ]}>
          <Text style={styles.pathTypeText}>
            {isSamePath ? "SAME PATH" : "DIFFERENT PATH"}
          </Text>
          {!isSamePath && route.linked_route_id && isDownRoute && (
            <Text style={styles.linkedRouteText}>Linked to: {route.linked_route_id}</Text>
          )}
        </View>
        
        <View style={styles.mapContainer}>
          <MapView
            style={styles.miniMap}
            region={region}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {route.stops && route.stops.map((stop, idx) => (
              <Marker
                key={idx}
                coordinate={{ 
                  latitude: parseFloat(stop.lat), 
                  longitude: parseFloat(stop.lon) 
                }}
                pinColor={stop.is_stop ? Colours.primary : Colours.secondary}
              />
            ))}
            {route.stops && route.stops.length > 1 && (
              <Polyline
                coordinates={route.stops.map(stop => ({
                  latitude: parseFloat(stop.lat),
                  longitude: parseFloat(stop.lon)
                }))}
                strokeColor={isSamePath ? Colours.primary : isUpRoute ? Colours.success : Colours.info}
                strokeWidth={3}
              />
            )}
          </MapView>
        </View>

        <View style={styles.routeInfo}>
          <View style={styles.routeHeader}>
            <View style={styles.routeNames}>
              <Text style={[styles.routeName, { color: Colours.textDark }]}>
                {isSamePath ? `${route.up_route_name} / ${route.down_route_name}` : 
                 route.route_name || route.up_route_name}
              </Text>
              
              <Text style={[styles.routeDirection, { color: Colours.textSecondary }]}>
                {isSamePath ? (
                  <>
                    <Text>↑ {route.src} → {route.dest}</Text>
                    {'\n'}
                    <Text>↓ {route.dest} → {route.src}</Text>
                  </>
                ) : (
                  <>
                    <Text>{isUpRoute ? '↑ UP: ' : '↓ DOWN: '} {route.src} → {route.dest}</Text>
                    
                  </>
                )}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={[styles.iconButton, styles.deleteButton]}
                onPress={() => handleDeleteRoute(route)}
              >
                <Ionicons name="trash-outline" size={18} color={Colours.danger} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.routeDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={14} color={Colours.textSecondary} />
              <Text style={[styles.detailText, { color: Colours.textSecondary }]}>
                {route.stops?.length || 0} stops
              </Text>
            </View>
            
            {isSamePath && route.down_departure_time && (
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={14} color={Colours.textSecondary} />
                <Text style={[styles.detailText, { color: Colours.textSecondary }]}>
                  Depart: {route.down_departure_time}
                </Text>
              </View>
            )}
            
            {/* Route Direction Badge for Different Path */}
            {!isSamePath && (
              <View style={[
                styles.directionBadge,
                isUpRoute ? styles.upDirectionBadge : styles.downDirectionBadge
              ]}>
                <Text style={styles.directionBadgeText}>
                  {isUpRoute ? "UP ROUTE" : "DOWN ROUTE"}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.actionButtonsRow}>
            {/* Save to Server Button */}
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.saveButton,
                isLoading && styles.buttonDisabled
              ]}
              onPress={() => handleSaveToServer(route)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Send to Server</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Mark Down Route Button - UPDATED LOGIC */}
            {!isSamePath && isUpRoute && (
              hasDownRouteCreated ? (
                <View style={styles.markedBadge}>
                  <Text style={styles.markedText}>MARKED</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.markDownButton]}
                  onPress={() => handleMarkDownRoute(route)}
                >
                  <Ionicons name="eye-outline" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Mark Down</Text>
                </TouchableOpacity>
              )
            )}
          </View>

        </View>
      </View>
    );
  };

  const calculateRegion = (stops) => {
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
    <View style={[styles.container, { backgroundColor: Colours.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: Colours.card, 
        borderBottomColor: Colours.border,
        paddingTop: 50,
      }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colours.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: Colours.textDark }]}>
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
            color={savedRoutes.length === 0 ? Colours.textSecondary : Colours.danger} 
          />
        </TouchableOpacity>
      </View>

      {savedRoutes.length > 0 ? (
        <ScrollView 
          style={styles.routesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.routesListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colours.primary]}
              tintColor={Colours.primary}
            />
          }
        >
          {/* Filter Options */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Showing: All Routes</Text>
            {/* You can add filter buttons here for Same Path / Different Path */}
          </View>
          
          {savedRoutes.map((route, index) => (
            <RouteCard key={route.id || index} route={route} index={index} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={64} color={Colours.textSecondary} />
          <Text style={[styles.emptyStateText, { color: Colours.textDark }]}>
            No saved routes yet
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: Colours.textSecondary }]}>
            Create your first route in the Map screen
          </Text>
          <TouchableOpacity 
            style={[styles.goToMapButton, { backgroundColor: Colours.primary }]}
            onPress={() => navigation.navigate("Map")}
          >
            <Ionicons name="add-circle-outline" size={20} color="#000" />
            <Text style={styles.goToMapButtonText}>Create Route</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logout Button */}
      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: Colours.danger }]}
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
  filterContainer: {
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    color: Colours.textSecondary,
    fontWeight: '500',
  },
  routesList: {
    flex: 1,
  },
  routesListContent: {
    padding: 16,
    paddingBottom: 100,
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
  pathTypeIndicator: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  samePathIndicator: {
    backgroundColor: Colours.warning + '20', // Light yellow
  },
  differentPathIndicator: {
    backgroundColor: Colours.info + '20', // Light blue
  },
  pathTypeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colours.textDark,
    textAlign: 'center',
  },
  linkedRouteText: {
    fontSize: 9,
    color: Colours.textSecondary,
    textAlign: 'center',
    marginTop: 2,
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
    lineHeight: 16,
  },
  linkedInfo: {
    fontSize: 10,
    color: Colours.info,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colours.border,
  },
  editButton: {
    backgroundColor: Colours.success + '10',
  },
  deleteButton: {
    backgroundColor: Colours.danger + '10',
  },
  routeDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 12,
    marginLeft: 4,
    color: Colours.textSecondary,
  },
  directionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  upDirectionBadge: {
    backgroundColor: Colours.success + '20',
    borderColor: Colours.success,
    borderWidth: 1,
  },
  downDirectionBadge: {
    backgroundColor: Colours.info + '20',
    borderColor: Colours.info,
    borderWidth: 1,
  },
  directionBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colours.textDark,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButton: {
    backgroundColor: Colours.success,
  },
  markDownButton: {
    backgroundColor: "#FF7A18", // Orange color
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markedBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FFA500', // Orange
    alignItems: 'center',
    justifyContent: 'center',
  },
  markedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  goToMapButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoutButton: {
    position: "absolute",
    bottom: 80,
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

