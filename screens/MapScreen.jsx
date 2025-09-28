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
import Colours from "../constants/Colours";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function MapScreen() {
  const navigation = useNavigation();
  const [stops, setStops] = useState([]);
  const [upRouteName, setUpRouteName] = useState("");
  const [downRouteName, setDownRouteName] = useState("");
  const [stopName, setStopName] = useState("");
  const [busPosition, setBusPosition] = useState(null);
  const [arrivalTime, setArrivalTime] = useState("");
  const [sheetIndex, setSheetIndex] = useState(0);
  const intervalRef = useRef(null);

  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

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
      }))
    };

    await saveRoute(routeData);
    Alert.alert("Success", "Route saved!");
    
    // Reset form
    setStops([]);
    setUpRouteName("");
    setDownRouteName("");
    setStopName("");
    setArrivalTime("");
    setBusPosition(null);
    
    navigation.navigate("SavedRoutes");
  };

  const handleClearRoute = () => {
    setStops([]);
    setUpRouteName("");
    setDownRouteName("");
    setStopName("");
    setArrivalTime("");
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
    <View style={{ flex: 1 }}>
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
            <View style={styles.busMarker}>
              <Text style={{ fontSize: 24 }}>🚌</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* BottomSheet */}
      <BottomSheet
        ref={sheetRef}
        index={0} // Start at 25% (minimized)
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
          backgroundColor: "white", 
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
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
            >
              <View style={[styles.buttonIcon, { backgroundColor: Colours.accent }]}>
                <Text style={styles.buttonIconText}>📍</Text>
              </View>
              <Text style={styles.buttonLabel}>Locate Me</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.buttonWrapper} 
              onPress={handleSaveRoute}
            >
              <View style={[styles.buttonIcon, { backgroundColor: Colours.primary }]}>
                <Text style={styles.buttonIconText}>💾</Text>
              </View>
              <Text style={styles.buttonLabel}>Save</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.buttonWrapper} 
              onPress={handleClearRoute}
            >
              <View style={[styles.buttonIcon, { backgroundColor: Colours.danger }]}>
                <Text style={styles.buttonIconText}>🗑</Text>
              </View>
              <Text style={styles.buttonLabel}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.buttonWrapper} 
              onPress={handleSimulateRoute}
            >
              <View style={[styles.buttonIcon, { backgroundColor: Colours.warning }]}>
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
              placeholder="Up Route Name (e.g., Sattur to Madurai)" 
              value={upRouteName} 
              onChangeText={setUpRouteName} 
              placeholderTextColor={Colours.textSecondary} 
            />
            
            <TextInput 
              style={styles.input} 
              placeholder="Down Route Name (e.g., Madurai to Sattur)" 
              value={downRouteName} 
              onChangeText={setDownRouteName} 
              placeholderTextColor={Colours.textSecondary} 
            />
            
            <TextInput 
              style={styles.input} 
              placeholder="Stop Name" 
              value={stopName} 
              onChangeText={setStopName} 
              placeholderTextColor={Colours.textSecondary} 
            />
            
            <TextInput 
              style={styles.input} 
              placeholder="Arrival Time (e.g., 08:30 AM)" 
              value={arrivalTime} 
              onChangeText={setArrivalTime} 
              placeholderTextColor={Colours.textSecondary} 
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
                >
                  <Ionicons name="trash-outline" size={18} color={Colours.danger} />
                  <Text style={styles.deleteAllText}>Delete All</Text>
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
                  >
                    <Ionicons name="close-circle" size={24} color={Colours.danger} />
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colours.textDark,
    textAlign: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
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
  },
  buttonIconText: {
    fontSize: 18,
  },
  buttonLabel: {
    fontSize: 12,
    color: Colours.textSecondary,
    fontWeight: "500",
    textAlign: "center",
  },
  formSection: {
    marginBottom: 20,
  },
  stopsSection: {
    marginBottom: 20,
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
    color: Colours.textDark,
    flex: 1,
  },
  deleteAllButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#fff0f0",
  },
  deleteAllText: {
    color: Colours.danger,
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    color: Colours.textDark,
    backgroundColor: "#f8f8f8",
    fontSize: 15,
  },
  instructionText: {
    fontSize: 14,
    color: Colours.textSecondary,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  stopItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  stopLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stopNumber: {
    backgroundColor: Colours.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
    alignItems: "center",
    marginBottom: 4,
  },
  stopName: {
    fontWeight: "bold",
    color: Colours.textDark,
    flex: 1,
  },
  stopTypeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  stopTypeActive: {
    backgroundColor: Colours.primary,
  },
  stopTypeInactive: {
    backgroundColor: Colours.secondary,
  },
  stopTypeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  stopCoordinates: {
    fontSize: 12,
    color: Colours.textSecondary,
    marginBottom: 2,
  },
  arrivalTime: {
    fontSize: 11,
    color: Colours.accent,
    fontWeight: "500",
  },
  deleteButton: {
    padding: 4,
  },
  busMarker: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});