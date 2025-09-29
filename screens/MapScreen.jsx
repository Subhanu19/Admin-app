import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { saveRoute } from "../utils/storage";
import { send_route_to_server } from "../utils/Api";
import Colours from "../constants/Colours";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Custom color theme with black background
const CustomColours = {
  primary: "#e8c513e7",
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

export default function MapScreen({ setIsAuthenticated }) {
  const navigation = useNavigation();
  const [stops, setStops] = useState([]);
  const [upRouteName, setUpRouteName] = useState("");
  const [downRouteName, setDownRouteName] = useState("");
  const [stopName, setStopName] = useState("");
  const [busPosition, setBusPosition] = useState(null);
  const [arrivalTime, setArrivalTime] = useState("");
  const [downDepartureTime, setDownDepartureTime] = useState("");
  const [sheetIndex, setSheetIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef(null);

  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

  // Logout function
  const handleLogout = () => {
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
  };

  const handleMapPress = (e) => {
    // Don't add stops when sheet is fully expanded
    if (sheetIndex === 2) return;
    
    if (!stopName.trim()) {
      Alert.alert("Error", "Please enter a stop name first.");
      return;
    }
    const newStop = {
      location_name: stopName.trim(),
      lat: e.nativeEvent.coordinate.latitude.toString(),
      lon: e.nativeEvent.coordinate.longitude.toString(),
      is_stop: true, // Default to true for bus stops
      arrival_time: arrivalTime.trim() || null,
    };
    setStops([...stops, newStop]);
    setStopName("");
    setArrivalTime("");
  };

  const handleLocateMe = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Enable location permissions.");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

    if (!stopName.trim()) {
      Alert.alert("Error", "Please enter a stop name first.");
      return;
    }

    const newStop = {
      location_name: stopName.trim(),
      lat: loc.coords.latitude.toString(),
      lon: loc.coords.longitude.toString(),
      is_stop: true,
      arrival_time: arrivalTime.trim() || null,
    };
    setStops([...stops, newStop]);
    setStopName("");
    setArrivalTime("");
  };

  // Delete a single stop
  const handleDeleteStop = (index) => {
    Alert.alert(
      "Delete Stop",
      "Are you sure you want to delete this stop?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedStops = stops.filter((_, i) => i !== index);
            setStops(updatedStops);
          }
        }
      ]
    );
  };

  // Delete all stops
  const handleDeleteAllStops = () => {
    if (stops.length === 0) return;
    
    Alert.alert(
      "Delete All Stops",
      "Are you sure you want to delete all stops?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete All",
          style: "destructive",
          onPress: () => {
            setStops([]);
            setBusPosition(null);
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        }
      ]
    );
  };

  const handleSaveRoute = async () => {
    if (stops.length < 2) {
      Alert.alert("Error", "At least 2 stops required.");
      return;
    }
    if (!upRouteName.trim() || !downRouteName.trim()) {
      Alert.alert("Error", "Please enter both route names.");
      return;
    }

    setIsSaving(true);

    try {
      // Create the data structure according to the new format
      const routeData = {
        up_route_name: upRouteName.trim(),
        down_route_name: downRouteName.trim(),
        src: stops[0]?.location_name || "Start",
        dest: stops[stops.length - 1]?.location_name || "End",
        stops: stops.map((stop, index) => ({
          location_name: stop.location_name,
          lat: stop.lat,
          lon: stop.lon,
          is_stop: stop.is_stop,
          arrival_time: stop.arrival_time || null
        })),
        down_departure_time: downDepartureTime.trim() || null
      };

      // Save to local storage
      await saveRoute(routeData);
      
      // Send to server
      await send_route_to_server(routeData);
      
      Alert.alert("Success", "Route saved locally and sent to server!");
      
      // Reset form
      setStops([]);
      setUpRouteName("");
      setDownRouteName("");
      setStopName("");
      setArrivalTime("");
      setDownDepartureTime("");
      setBusPosition(null);
      
      // REMOVED: navigation.navigate("SavedRoutes");
      
    } catch (error) {
      console.error("Error saving route:", error);
      Alert.alert(
        "Save Error", 
        error.message === "Network request failed" 
          ? "Failed to connect to server. Route saved locally only."
          : "Error saving route. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearRoute = () => {
    setStops([]);
    setUpRouteName("");
    setDownRouteName("");
    setStopName("");
    setArrivalTime("");
    setDownDepartureTime("");
    setBusPosition(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleSimulateRoute = () => {
    if (stops.length < 2) {
      Alert.alert("Error", "Need at least 2 stops to simulate.");
      return;
    }

    let index = 0;
    setBusPosition({
      latitude: parseFloat(stops[0].lat),
      longitude: parseFloat(stops[0].lon),
    });

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (index < stops.length - 1) {
        const start = {
          latitude: parseFloat(stops[index].lat),
          longitude: parseFloat(stops[index].lon),
        };
        const end = {
          latitude: parseFloat(stops[index + 1].lat),
          longitude: parseFloat(stops[index + 1].lon),
        };

        let step = 0;
        const totalSteps = 20;

        const move = setInterval(() => {
          step++;
          const lat = start.latitude + ((end.latitude - start.latitude) / totalSteps) * step;
          const lng = start.longitude + ((end.longitude - start.longitude) / totalSteps) * step;

          setBusPosition({ latitude: lat, longitude: lng });

          if (step >= totalSteps) {
            clearInterval(move);
            index++;
          }
        }, 300);
      } else {
        clearInterval(intervalRef.current);
      }
    }, 7000);
  };

  const handleSheetChange = (index) => {
    setSheetIndex(index);
  };

  // Toggle is_stop for a stop
  const toggleStopType = (index) => {
    const updatedStops = stops.map((stop, i) => 
      i === index ? { ...stop, is_stop: !stop.is_stop } : stop
    );
    setStops(updatedStops);
  };

  return (
    <View style={{ flex: 1, backgroundColor: CustomColours.background }}>
      {/* Map - Always visible in background */}
      <MapView
        style={{ flex: 1 }}
        initialRegion={{ 
          latitude: 9.917, 
          longitude: 78.119, 
          latitudeDelta: 0.2, 
          longitudeDelta: 0.2 
        }}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {stops.map((stop, idx) => (
          <Marker
            key={idx}
            coordinate={{ 
              latitude: parseFloat(stop.lat), 
              longitude: parseFloat(stop.lon) 
            }}
            title={`${idx + 1}. ${stop.location_name}`}
            description={stop.is_stop ? "Bus Stop" : "Passing Point"}
            pinColor={stop.is_stop ? CustomColours.primary : CustomColours.secondary}
          />
        ))}
        {stops.length > 1 && (
          <Polyline
            coordinates={stops.map((s) => ({ 
              latitude: parseFloat(s.lat), 
              longitude: parseFloat(s.lon) 
            }))}
            strokeColor={CustomColours.primary}
            strokeWidth={4}
          />
        )}
        {busPosition && (
          <Marker coordinate={busPosition}>
            <View style={styles.busMarker}>
              <Text style={{ fontSize: 24 }}>🚌</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color="white" />
      </TouchableOpacity>

      {/* BottomSheet */}
      <BottomSheet
        ref={sheetRef}
        index={0} // Start at 25% (minimized)
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        enablePanDownToClose={false}
        handleIndicatorStyle={{
          backgroundColor: CustomColours.primary,
          width: 40,
          height: 4,
          borderRadius: 2,
        }}
        backgroundStyle={{ 
          backgroundColor: CustomColours.card, 
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 8,
        }}
      >
        <BottomSheetScrollView 
          style={styles.sheetContent}
          contentContainerStyle={styles.sheetContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Route</Text>
          </View>

          {/* All Four Buttons in Horizontal Layout */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.buttonWrapper} 
              onPress={handleLocateMe}
              disabled={isSaving}
            >
              <View style={[styles.buttonIcon, { backgroundColor: CustomColours.accent }]}>
                <Text style={styles.buttonIconText}>📍</Text>
              </View>
              <Text style={styles.buttonLabel}>Locate Me</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.buttonWrapper} 
              onPress={handleSaveRoute}
              disabled={isSaving}
            >
              <View style={[styles.buttonIcon, { 
                backgroundColor: isSaving ? CustomColours.textSecondary : CustomColours.primary 
              }]}>
                <Text style={styles.buttonIconText}>
                  {isSaving ? "⏳" : "💾"}
                </Text>
              </View>
              <Text style={styles.buttonLabel}>
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.buttonWrapper} 
              onPress={handleClearRoute}
              disabled={isSaving}
            >
              <View style={[styles.buttonIcon, { backgroundColor: CustomColours.danger }]}>
                <Text style={styles.buttonIconText}>🗑</Text>
              </View>
              <Text style={styles.buttonLabel}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.buttonWrapper} 
              onPress={handleSimulateRoute}
              disabled={isSaving}
            >
              <View style={[styles.buttonIcon, { backgroundColor: CustomColours.warning }]}>
                <Text style={styles.buttonIconText}>🚍</Text>
              </View>
              <Text style={styles.buttonLabel}>Simulate</Text>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Route Details</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="Up Route Name (e.g., Sattur to Kamaraj-College)" 
              value={upRouteName} 
              onChangeText={setUpRouteName} 
              placeholderTextColor={CustomColours.textSecondary}
              editable={!isSaving}
            />
            
            <TextInput 
              style={styles.input} 
              placeholder="Down Route Name (e.g., Kamaraj-College to Sattur)" 
              value={downRouteName} 
              onChangeText={setDownRouteName} 
              placeholderTextColor={CustomColours.textSecondary}
              editable={!isSaving}
            />
            
            <TextInput 
              style={styles.input} 
              placeholder="Stop Name" 
              value={stopName} 
              onChangeText={setStopName} 
              placeholderTextColor={CustomColours.textSecondary}
              editable={!isSaving}
            />
            
            <TextInput 
              style={styles.input} 
              placeholder="Arrival Time (e.g., 08:30)" 
              value={arrivalTime} 
              onChangeText={setArrivalTime} 
              placeholderTextColor={CustomColours.textSecondary}
              editable={!isSaving}
            />

            <TextInput 
              style={styles.input} 
              placeholder="Down Departure Time (e.g., 16:40)" 
              value={downDepartureTime} 
              onChangeText={setDownDepartureTime} 
              placeholderTextColor={CustomColours.textSecondary}
              editable={!isSaving}
            />

            <Text style={styles.instructionText}>
              👉 Tap on the map to add stops
            </Text>
          </View>

          {/* Stops List */}
          {stops.length > 0 && (
            <View style={styles.stopsSection}>
              <View style={styles.stopsHeader}>
                <Text style={styles.sectionTitle}>
                  Route Stops ({stops.length}) - {stops[0]?.location_name} to {stops[stops.length - 1]?.location_name}
                </Text>
                <TouchableOpacity 
                  style={styles.deleteAllButton}
                  onPress={handleDeleteAllStops}
                  disabled={isSaving}
                >
                  <Ionicons name="trash-outline" size={24} color={CustomColours.danger} />
                </TouchableOpacity>
              </View>
              {stops.map((stop, idx) => (
                <View key={idx} style={styles.stopItem}>
                  <View style={styles.stopLeft}>
                    <View style={styles.stopNumber}>
                      <Text style={styles.stopNumberText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.stopInfo}>
                      <View style={styles.stopHeader}>
                        <Text style={styles.stopName}>{stop.location_name}</Text>
                        <TouchableOpacity 
                          style={[styles.stopTypeButton, stop.is_stop ? styles.stopTypeActive : styles.stopTypeInactive]}
                          onPress={() => toggleStopType(idx)}
                          disabled={isSaving}
                        >
                          <Text style={styles.stopTypeText}>
                            {stop.is_stop ? "Stop" : "Pass"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.stopCoordinates}>
                        {parseFloat(stop.lat).toFixed(4)}, {parseFloat(stop.lon).toFixed(4)}
                      </Text>
                      {stop.arrival_time && (
                        <Text style={styles.arrivalTime}>
                          🕒 {stop.arrival_time}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteStop(idx)}
                    disabled={isSaving}
                  >
                    <Ionicons name="close-circle" size={24} color={isSaving ? CustomColours.textSecondary : CustomColours.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    flex: 1,
    backgroundColor: "#000000",
  },
  sheetContentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  buttonWrapper: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  buttonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonIconText: {
    fontSize: 18,
  },
  buttonLabel: {
    fontSize: 12,
    color: "#a0a0a0",
    fontWeight: "600",
    textAlign: "center",
  },
  formSection: {
    marginBottom: 20,
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  stopsSection: {
    marginBottom: 20,
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333333",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  stopsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
  },
  deleteAllButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#2a1a1a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    color: "#ffffff",
    backgroundColor: "#2a2a2a",
    fontSize: 15,
    fontWeight: "500",
  },
  instructionText: {
    fontSize: 14,
    color: "#a0a0a0",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  stopItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333333",
  },
  stopLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stopNumber: {
    backgroundColor: "#e8c513e7",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  stopNumberText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  stopInfo: {
    flex: 1,
  },
  stopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  stopName: {
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
    marginRight: 8,
    fontSize: 15,
  },
  stopTypeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    minWidth: 55,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  stopTypeActive: {
    backgroundColor: "#e8c513e7",
  },
  stopTypeInactive: {
    backgroundColor: "rgba(11, 8, 8, 1)",
  },
  stopTypeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  stopCoordinates: {
    fontSize: 12,
    color: "#a0a0a0",
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  arrivalTime: {
    fontSize: 11,
    color: "#ff6b35",
    fontWeight: "600",
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  busMarker: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#e8c513e7",
  },
  // Logout button styles
  logoutButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "#dc2626",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
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