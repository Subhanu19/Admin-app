import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import Colours from "../constants/Colours";

export default function RouteCard({ route }) {
  if (!route.Stops || route.Stops.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{route.Name}</Text>
        <Text style={styles.cardSubtitle}>No stops available</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <MapView
        style={styles.miniMap}
        initialRegion={{
          latitude: parseFloat(route.Stops[0].Lat),
          longitude: parseFloat(route.Stops[0].Lon),
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        {route.Stops.map((s, idx) => (
          <Marker
            key={idx}
            coordinate={{
              latitude: parseFloat(s.Lat),
              longitude: parseFloat(s.Lon),
            }}
            title={s.LocationName}
          />
        ))}

        <Polyline
          coordinates={route.Stops.map((s) => ({
            latitude: parseFloat(s.Lat),
            longitude: parseFloat(s.Lon),
          }))}
          strokeColor={Colours.primary}
          strokeWidth={3}
        />
      </MapView>

      <Text style={styles.cardTitle}>{route.Name}</Text>
      <Text style={styles.cardSubtitle}>
        ⏱ Departure: {route.DepartureTime} | Arrival: {route.ArrivalTime}
      </Text>
      <Text style={styles.cardSubtitle}>{route.Stops.length} stops</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colours.card,
    marginBottom: 20,
    borderRadius: 10,
    padding: 10,
  },
  miniMap: { height: 150, borderRadius: 8 },
  cardTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: Colours.textDark,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colours.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
});