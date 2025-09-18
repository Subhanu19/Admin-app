import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import MapView, { Marker, Polyline, LatLng } from "react-native-maps";
import * as Location from "expo-location";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { saveRoute, RouteStop } from "../utils/storage"; // ✅ fixed import
import Colours from "../constants/Colours";

type MapScreenNavProp = NativeStackNavigationProp<RootStackParamList, "Map">;

export default function MapScreen() {
  const navigation = useNavigation<MapScreenNavProp>();
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [routeName, setRouteName] = useState("");
  const [stopName, setStopName] = useState("");
  const [busPosition, setBusPosition] = useState<LatLng | null>(null);
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 📍 Tap on Map to add stop
  const handleMapPress = (e: any) => {
    if (!stopName.trim()) {
      Alert.alert("Error", "Please enter a stop name first.");
      return;
    }
    const newStop: RouteStop = {
      Lat: e.nativeEvent.coordinate.latitude.toString(),
      Lon: e.nativeEvent.coordinate.longitude.toString(),
      LocationName: stopName.trim(),
    };
    setStops([...stops, newStop]);
    setStopName("");
  };

  // 📍 Locate Me
  const handleLocateMe = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Enable location permissions.");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    if (!stopName.trim()) {
      Alert.alert("Error", "Please enter a stop name first.");
      return;
    }

    const newStop: RouteStop = {
      Lat: loc.coords.latitude.toString(),
      Lon: loc.coords.longitude.toString(),
      LocationName: stopName.trim(),
    };
    setStops([...stops, newStop]);
    setStopName("");
  };

  // 💾 Save Route
  const handleSaveRoute = async () => {
    if (stops.length < 2) {
      Alert.alert("Error", "At least 2 stops required.");
      return;
    }
    if (!routeName.trim()) {
      Alert.alert("Error", "Please enter a route name.");
      return;
    }

    await saveRoute(routeName.trim(), stops, departureTime, arrivalTime);
    Alert.alert("Success", "Route saved!");
    setStops([]);
    setRouteName("");
    setStopName("");
    setDepartureTime("");
    setArrivalTime("");
    setBusPosition(null);
    navigation.navigate("SavedRoutes");
  };

  // 🗑 Clear Route
  const handleClearRoute = () => {
    setStops([]);
    setRouteName("");
    setStopName("");
    setDepartureTime("");
    setArrivalTime("");
    setBusPosition(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // 🚍 Simulate route animation
  const handleSimulateRoute = () => {
    if (stops.length < 2) {
      Alert.alert("Error", "Need at least 2 stops to simulate.");
      return;
    }

    let index = 0;
    setBusPosition({
      latitude: parseFloat(stops[0].Lat),
      longitude: parseFloat(stops[0].Lon),
    });

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (index < stops.length - 1) {
        const start = {
          latitude: parseFloat(stops[index].Lat),
          longitude: parseFloat(stops[index].Lon),
        };
        const end = {
          latitude: parseFloat(stops[index + 1].Lat),
          longitude: parseFloat(stops[index + 1].Lon),
        };

        // Move in 20 steps
        let step = 0;
        const totalSteps = 20;

        const move = setInterval(() => {
          step++;
          const lat =
            start.latitude + ((end.latitude - start.latitude) / totalSteps) * step;
          const lng =
            start.longitude + ((end.longitude - start.longitude) / totalSteps) * step;

          setBusPosition({ latitude: lat, longitude: lng });

          if (step >= totalSteps) {
            clearInterval(move);
            index++;
          }
        }, 300);
      } else {
        clearInterval(intervalRef.current!);
      }
    }, 7000); // pause between stops
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 9.917,
          longitude: 78.119,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        onPress={handleMapPress}
      >
        {stops.map((stop, idx) => (
          <Marker
            key={idx}
            coordinate={{
              latitude: parseFloat(stop.Lat),
              longitude: parseFloat(stop.Lon),
            }}
            title={`${idx + 1}. ${stop.LocationName}`}
            description={`Lat: ${stop.Lat}, Lng: ${stop.Lon}`}
          />
        ))}

        {stops.length > 1 && (
          <Polyline
            coordinates={stops.map((s) => ({
              latitude: parseFloat(s.Lat),
              longitude: parseFloat(s.Lon),
            }))}
            strokeColor={Colours.primary}
            strokeWidth={4}
          />
        )}

        {/* 🚍 Bus Marker */}
        {busPosition && (
          <Marker coordinate={busPosition} title="Bus" description="Simulating route">
            <Text style={{ fontSize: 24 }}>🚌</Text>
          </Marker>
        )}
      </MapView>

      {/* Bottom Panel */}
      <ScrollView style={styles.bottomPanel}>
        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colours.accent }]}
            onPress={handleLocateMe}
          >
            <Text style={styles.buttonText}>📍 Locate Me</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colours.primary }]}
            onPress={handleSaveRoute}
          >
            <Text style={styles.buttonText}>💾 Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colours.danger }]}
            onPress={handleClearRoute}
          >
            <Text style={styles.buttonText}>🗑 Clear</Text>
          </TouchableOpacity>
        </View>

        {/* 🚍 Simulate Button */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colours.warning, marginBottom: 12 }]}
          onPress={handleSimulateRoute}
        >
          <Text style={styles.buttonText}>🚍 Simulate Route</Text>
        </TouchableOpacity>

        {/* Create Route Form */}
        <View style={styles.formBox}>
          <Text style={styles.formTitle}>🛣 Create New Route</Text>
          <TextInput
            style={styles.input}
            placeholder="Route Name"
            placeholderTextColor={Colours.textSecondary}
            value={routeName}
            onChangeText={setRouteName}
          />
          <TextInput
            style={styles.input}
            placeholder="Stop Name"
            placeholderTextColor={Colours.textSecondary}
            value={stopName}
            onChangeText={setStopName}
          />
          <TextInput
            style={styles.input}
            placeholder="Departure Time (e.g. 08:30 AM)"
            placeholderTextColor={Colours.textSecondary}
            value={departureTime}
            onChangeText={setDepartureTime}
          />
          <TextInput
            style={styles.input}
            placeholder="Arrival Time (e.g. 10:00 AM)"
            placeholderTextColor={Colours.textSecondary}
            value={arrivalTime}
            onChangeText={setArrivalTime}
          />
          <Text style={styles.infoText}>👉 Tap on the map to add stops</Text>
        </View>

        {/* Route Stops List */}
        {stops.length > 0 && (
          <View style={styles.stopsBox}>
            <Text style={styles.formTitle}>📍 Route Stops</Text>
            {stops.map((stop, idx) => (
              <View key={idx} style={styles.stopItem}>
                <Text style={styles.stopIndex}>{idx + 1}</Text>
                <View>
                  <Text style={styles.stopName}>{stop.LocationName}</Text>
                  <Text style={styles.stopCoords}>
                    {stop.Lat}, {stop.Lon}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colours.background },
  map: { flex: 1 },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "55%",
    backgroundColor: Colours.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: Colours.textInverse,
    fontWeight: "bold",
  },
  formBox: { marginBottom: 16 },
  formTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
    color: Colours.textDark,
  },
  input: {
    backgroundColor: Colours.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: Colours.textDark,
  },
  infoText: { fontSize: 12, color: Colours.textSecondary },
  stopsBox: { marginBottom: 16 },
  stopItem: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  stopIndex: {
    backgroundColor: Colours.primary,
    color: "white",
    borderRadius: 50,
    width: 24,
    height: 24,
    textAlign: "center",
    marginRight: 8,
  },
  stopName: { fontWeight: "bold", color: Colours.textDark },
  stopCoords: { fontSize: 12, color: Colours.textSecondary },
});
