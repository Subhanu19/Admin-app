import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getSavedRoutes, clearAllRoutes, deleteRoute } from "../utils/storage";
import Colours from "../constants/Colours";
import RouteCard from "../components/RouteCard";

export default function SavedRoutesScreen() {
  const navigation = useNavigation();
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    const data = await getSavedRoutes();
    setRoutes(data);
  };

  const handleClearAll = async () => {
    Alert.alert("Confirm", "Delete all saved routes?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          await clearAllRoutes();
          setRoutes([]);
        },
      },
    ]);
  };

  const handleDeleteRoute = async (id) => {
    await deleteRoute(id);
    loadRoutes();
  };

  const renderRoute = ({ item }) => (
    <View style={styles.routeWrapper}>
      <RouteCard route={item} />
      {/* Delete single route button */}
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: Colours.danger }]}
        onPress={() => handleDeleteRoute(item.Id)}
      >
        <Text style={styles.buttonText}>🗑 Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={routes}
        keyExtractor={(item) => item.Id}
        renderItem={renderRoute}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No saved routes yet.</Text>
        }
        contentContainerStyle={{ padding: 12 }}
      />

      {routes.length > 0 && (
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: Colours.warning }]}
          onPress={handleClearAll}
        >
          <Text style={styles.buttonText}>❌ Clear All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colours.background },
  routeWrapper: {
    marginBottom: 16,
  },
  actionButton: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "bold" },
  clearButton: {
    margin: 12,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: Colours.textSecondary,
    marginTop: 20,
    fontSize: 16,
  },
});