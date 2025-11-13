import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { clearSession, send_route_to_server } from "../utils/Api";
import { saveRoute } from "../utils/storage";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Light theme colors only
const Colours = {
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
  // Source and Destination fields
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const intervalRef = useRef(null);

  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ["25%", "50%","75%","90%","100%"], []);

  // Format time automatically as HH:MM
  const formatTime = (text, setter) => {
    // Remove non-numeric chars
    const cleaned = text.replace(/\D/g, "");
    
    let formatted = cleaned;
    if (cleaned.length >= 3) {
      formatted = cleaned.slice(0, 2) + ":" + cleaned.slice(2, 4);
    }
    
    setter(formatted.slice(0, 5)); // Keep only HH:MM
  };

  // Validate correct HH:MM format
  const validateTime = (time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

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
          onPress: async () => {
            await clearSession(); // Clear session from SecureStore
            setIsAuthenticated(false);
          }
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

    if (!arrivalTime.trim()) {
      Alert.alert("Error", "Please enter arrival time for this stop.");
      return;
    }

    // Validate arrival time format
    if (!validateTime(arrivalTime)) {
      Alert.alert("Invalid Time", "Please enter arrival time in HH:MM format (e.g., 09:30)");
      return;
    }

    const newStop = {
      stop_sequence: stops.length + 1,
      location_name: stopName.trim(),
      lat: e.nativeEvent.coordinate.latitude.toString(),
      lon: e.nativeEvent.coordinate.longitude.toString(),
      is_stop: true,
      arrival_time: arrivalTime.trim(),
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

    if (!arrivalTime.trim()) {
      Alert.alert("Error", "Please enter arrival time for this stop.");
      return;
    }

    // Validate arrival time format
    if (!validateTime(arrivalTime)) {
      Alert.alert("Invalid Time", "Please enter arrival time in HH:MM format (e.g., 09:30)");
      return;
    }

    const newStop = {
      stop_sequence: stops.length + 1,
      location_name: stopName.trim(),
      lat: loc.coords.latitude.toString(),
      lon: loc.coords.longitude.toString(),
      is_stop: true,
      arrival_time: arrivalTime.trim(),
    };
    setStops([...stops, newStop]);
    setStopName("");
    setArrivalTime("");
  };

  // Delete a single stop and reorder sequences
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
            const updatedStops = stops.filter((_, i) => i !== index)
              .map((stop, i) => ({
                ...stop,
                stop_sequence: i + 1
              }));
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

  // UPDATED handleSaveRoute with source and destination validation
  const handleSaveRoute = async () => {
    if (stops.length < 2) {
      Alert.alert("Error", "At least 2 stops required.");
      return;
    }
    if (!upRouteName.trim() || !downRouteName.trim()) {
      Alert.alert("Error", "Please enter both route names.");
      return;
    }

    // Check if source and destination are provided
    if (!source.trim() || !destination.trim()) {
      Alert.alert("Error", "Please enter both source and destination.");
      return;
    }

    // Check if all stops have arrival time
    const stopsWithoutArrivalTime = stops.filter(stop => !stop.arrival_time);
    if (stopsWithoutArrivalTime.length > 0) {
      Alert.alert("Error", "All stops must have arrival time.");
      return;
    }

    // Check if departure time is provided
    if (!downDepartureTime.trim()) {
      Alert.alert("Error", "Please enter down departure time.");
      return;
    }

    // Validate all arrival times
    const invalidArrivalTimes = stops.filter(stop => !validateTime(stop.arrival_time));
    if (invalidArrivalTimes.length > 0) {
      Alert.alert("Invalid Time", "Please ensure all arrival times are in HH:MM format (e.g., 09:30)");
      return;
    }

    // Validate departure time
    if (!validateTime(downDepartureTime)) {
      Alert.alert("Invalid Time", "Please enter departure time in HH:MM format (e.g., 09:30)");
      return;
    }

    setIsSaving(true);

    try {
      const routeData = {
        up_route_name: upRouteName.trim(),
        down_route_name: downRouteName.trim(),
        src: source.trim(),
        dest: destination.trim(),
        stops: stops.map((stop, index) => ({
          stop_sequence: stop.stop_sequence,
          location_name: stop.location_name,
          lat: stop.lat,
          lon: stop.lon,
          is_stop: stop.is_stop,
          arrival_time: stop.arrival_time
        })),
        down_departure_time: downDepartureTime.trim()
      };

      // Save locally first
      await saveRoute(routeData);
      
      // Try to send to server
      try {
        console.log('Attempting to send route to server...');
        await send_route_to_server(routeData);
        Alert.alert("Success", "Route saved locally and sent to server!");
      } catch (serverError) {
        console.error('Server sync error:', serverError);
        if (serverError.message.includes('Authentication failed')) {
          Alert.alert(
            "Authentication Required", 
            "Route saved locally. Please login again to sync with server.",
            [
              {
                text: "OK",
                onPress: () => {
                  // Optionally logout user or show login prompt
                  // handleLogout();
                }
              }
            ]
          );
        } else {
          Alert.alert(
            "Server Sync Failed", 
            "Route saved locally but could not sync with server: " + serverError.message
          );
        }
      }
      
      // Clear form on success
      setStops([]);
      setUpRouteName("");
      setDownRouteName("");
      setStopName("");
      setArrivalTime("");
      setDownDepartureTime("");
      setBusPosition(null);
      setSource("");
      setDestination("");
      
    } catch (error) {
      console.error("Error saving route:", error);
      Alert.alert(
        "Save Error", 
        "Error saving route locally. Please try again."
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
    setSource("");
    setDestination("");
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
    <View style={{ flex: 1, backgroundColor: Colours.background }}>
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
            title={`${stop.stop_sequence}. ${stop.location_name}`}
            description={stop.is_stop ? `Bus Stop - Arrival: ${stop.arrival_time}` : `Passing Point - Arrival: ${stop.arrival_time}`}
            pinColor={stop.is_stop ? Colours.primary : Colours.secondary}
          />
        ))}
        {stops.length > 1 && (
          <Polyline
            coordinates={stops.map((s) => ({ 
              latitude: parseFloat(s.lat), 
              longitude: parseFloat(s.lon) 
            }))}
            strokeColor={Colours.primary}
            strokeWidth={4}
          />
        )}
        {busPosition && (
          <Marker coordinate={busPosition}>
            <View style={[styles.busMarker, { borderColor: Colours.primary }]}>
              <Text style={{ fontSize: 24 }}>🚌</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Saved Routes Button */}
      <TouchableOpacity 
        style={[styles.savedRoutesButton, { backgroundColor: Colours.card }]}
        onPress={() => navigation.navigate("SavedRoutes")}
      >
        <Ionicons name="list" size={24} color={Colours.primary} />
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: Colours.danger }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color="white" />
      </TouchableOpacity>

      {/* BottomSheet */}
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        enablePanDownToClose={false}
        handleIndicatorStyle={{
          backgroundColor: Colours.primary,
          width: 40,
          height: 4,
          borderRadius: 2,
        }}
        backgroundStyle={{ 
          backgroundColor: Colours.card, 
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
          style={[styles.sheetContent, { backgroundColor: Colours.background }]}
          contentContainerStyle={styles.sheetContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={[styles.header, { borderBottomColor: Colours.border }]}>
            <Text style={[styles.headerTitle, { color: Colours.textDark }]}>Create Route</Text>
          </View>

          {/* All Four Buttons in Horizontal Layout */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.buttonWrapper} 
              onPress={handleLocateMe}
              disabled={isSaving}
            >
              <View style={[styles.buttonIcon, { backgroundColor: Colours.accent }]}>
                <Ionicons name="locate" size={24} color="white" />
              </View>
              <Text style={[styles.buttonLabel, { color: Colours.textSecondary }]}>Locate Me</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.buttonWrapper} 
              onPress={handleSaveRoute}
              disabled={isSaving}
            >
              <View style={[styles.buttonIcon, { 
                backgroundColor: isSaving ? Colours.textSecondary : Colours.primary 
              }]}>
                <Ionicons 
                  name={isSaving ? "hourglass" : "save"} 
                  size={24} 
                  color="white" 
                />
              </View>
              <Text style={[styles.buttonLabel, { color: Colours.textSecondary }]}>
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.buttonWrapper} 
              onPress={handleClearRoute}
              disabled={isSaving}
            >
              <View style={[styles.buttonIcon, { backgroundColor: Colours.danger }]}>
                <Ionicons name="trash" size={24} color="white" />
              </View>
              <Text style={[styles.buttonLabel, { color: Colours.textSecondary }]}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.buttonWrapper} 
              onPress={handleSimulateRoute}
              disabled={isSaving}
            >
              <View style={[styles.buttonIcon, { backgroundColor: Colours.warning }]}>
                <Ionicons name="bus" size={24} color="white" />
              </View>
              <Text style={[styles.buttonLabel, { color: Colours.textSecondary }]}>Simulate</Text>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={[styles.formSection, { 
            backgroundColor: Colours.card, 
            borderColor: Colours.border 
          }]}>
            <Text style={[styles.sectionTitle, { color: Colours.textDark }]}>Route Details</Text>
            
            <TextInput 
              style={[styles.input, { 
                color: Colours.textDark, 
                backgroundColor: "#ffffff",
                borderColor: Colours.border 
              }]} 
              placeholder="Up Route Name (e.g., Sattur to Kcet)" 
              value={upRouteName} 
              onChangeText={setUpRouteName} 
              placeholderTextColor={Colours.textSecondary}
              editable={!isSaving}
            />
            
            <TextInput 
              style={[styles.input, { 
                color: Colours.textDark, 
                backgroundColor: "#ffffff",
                borderColor: Colours.border 
              }]} 
              placeholder="Down Route Name (e.g., Kcet to Sattur)" 
              value={downRouteName} 
              onChangeText={setDownRouteName} 
              placeholderTextColor={Colours.textSecondary}
              editable={!isSaving}
            />

            {/* Source and Destination fields side by side */}
            <View style={styles.rowContainer}>
              <View style={styles.halfInputContainer}>
                <TextInput 
                  style={[styles.halfInput, { 
                    color: Colours.textDark, 
                    backgroundColor: "#ffffff",
                    borderColor: Colours.border 
                  }]} 
                  placeholder="Source *" 
                  value={source} 
                  onChangeText={setSource} 
                  placeholderTextColor={Colours.textSecondary}
                  editable={!isSaving}
                />
              </View>
              <View style={styles.halfInputContainer}>
                <TextInput 
                  style={[styles.halfInput, { 
                    color: Colours.textDark, 
                    backgroundColor: "#ffffff",
                    borderColor: Colours.border 
                  }]} 
                  placeholder="Destination *" 
                  value={destination} 
                  onChangeText={setDestination} 
                  placeholderTextColor={Colours.textSecondary}
                  editable={!isSaving}
                />
              </View>
            </View>
            
            <TextInput 
              style={[styles.input, { 
                color: Colours.textDark, 
                backgroundColor: "#ffffff",
                borderColor: Colours.border 
              }]} 
              placeholder="Stop Name *" 
              value={stopName} 
              onChangeText={setStopName} 
              placeholderTextColor={Colours.textSecondary}
              editable={!isSaving}
            />

            {/* Arrival Time Input */}
            <TextInput
              style={[styles.input, { 
                color: Colours.textDark, 
                backgroundColor: "#ffffff",
                borderColor: Colours.border 
              }]} 
              placeholder="Arrival Time (HH:MM) *" 
              value={arrivalTime} 
              onChangeText={(text) => formatTime(text, setArrivalTime)}
              placeholderTextColor={Colours.textSecondary}
              editable={!isSaving}
              keyboardType="numeric"
              maxLength={5}
            />

            {/* Departure Time Input */}
            <TextInput
              style={[styles.input, { 
                color: Colours.textDark, 
                backgroundColor: "#ffffff",
                borderColor: Colours.border 
              }]} 
              placeholder="Departure Time (HH:MM) *" 
              value={downDepartureTime} 
              onChangeText={(text) => formatTime(text, setDownDepartureTime)}
              placeholderTextColor={Colours.textSecondary}
              editable={!isSaving}
              keyboardType="numeric"
              maxLength={5}
            />

            <Text style={[styles.instructionText, { color: Colours.textSecondary }]}>
              👉 Tap on the map to add stops (Arrival Time is required)
            </Text>
          </View>

          {/* Stops List */}
          {stops.length > 0 && (
            <View style={[styles.stopsSection, { 
              backgroundColor: Colours.card, 
              borderColor: Colours.border 
            }]}>
              <View style={styles.stopsHeader}>
                <Text style={[styles.sectionTitle, { color: Colours.textDark }]}>
                  Route Stops ({stops.length}) - {source || stops[0]?.location_name} to {destination || stops[stops.length - 1]?.location_name}
                </Text>
                <TouchableOpacity 
                  style={[styles.deleteAllButton, { backgroundColor: "#ffe6e6" }]}
                  onPress={handleDeleteAllStops}
                  disabled={isSaving}
                >
                  <Ionicons name="trash-outline" size={24} color={Colours.danger} />
                </TouchableOpacity>
              </View>
              {stops.map((stop, idx) => (
                <View key={idx} style={[styles.stopItem, { 
                  backgroundColor: "#f8f9fa",
                  borderColor: Colours.border 
                }]}>
                  <View style={styles.stopLeft}>
                    <View style={[styles.stopNumber, { backgroundColor: Colours.primary }]}>
                      <Text style={styles.stopNumberText}>{stop.stop_sequence}</Text>
                    </View>
                    <View style={styles.stopInfo}>
                      <View style={styles.stopHeader}>
                        <Text style={[styles.stopName, { color: Colours.textDark }]}>{stop.location_name}</Text>
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
                      <Text style={[styles.stopCoordinates, { color: Colours.textSecondary }]}>
                        {parseFloat(stop.lat).toFixed(4)}, {parseFloat(stop.lon).toFixed(4)}
                      </Text>
                      <Text style={[styles.arrivalTime, { color: Colours.primary }]}>
                        🕒 Arrival: {stop.arrival_time}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteStop(idx)}
                    disabled={isSaving}
                  >
                    <Ionicons 
                      name="close-circle" 
                      size={24} 
                      color={isSaving ? Colours.textSecondary : Colours.danger} 
                    />
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
  },
  sheetContentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
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
  buttonLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  formSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    flex: 1,
  },
  deleteAllButton: {
    padding: 8,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    fontWeight: "500",
  },
  // Styles for side-by-side inputs
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  halfInputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  halfInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    fontWeight: "500",
  },
  instructionText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  stopItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  stopLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stopNumber: {
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
    color: "black",
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
    backgroundColor: "#FFD700",
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
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  arrivalTime: {
    fontSize: 11,
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
  },
  // Saved Routes Button
  savedRoutesButton: {
    position: "absolute",
    top: 50,
    right: 20,
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
  // Logout button
  logoutButton: {
    position: "absolute",
    top: 110,
    right: 20,
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