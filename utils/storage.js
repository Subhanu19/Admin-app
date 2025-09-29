import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "SAVED_ROUTES";

// Save new route - updated to match new format
export async function saveRoute(routeData) {
  try {
    const newRoute = {
      Id: Date.now().toString(),
      up_route_name: routeData.up_route_name,
      down_route_name: routeData.down_route_name,
      src: routeData.src,
      dest: routeData.dest,
      stops: routeData.stops,
      down_departure_time: routeData.down_departure_time || null,
      createdAt: new Date().toISOString(),
    };

    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const routes = existing ? JSON.parse(existing) : [];

    routes.push(newRoute);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
    return newRoute;
  } catch (e) {
    console.error("Error saving route:", e);
    throw e;
  }
}

// Get saved routes
export async function getSavedRoutes() {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    console.error("Error loading routes:", e);
    return [];
  }
}

// Delete route by ID
export async function deleteRoute(id) {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (!existing) return;
    let routes = JSON.parse(existing);

    routes = routes.filter((r) => r.Id !== id);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
  } catch (e) {
    console.error("Error deleting route:", e);
    throw e;
  }
}

// Clear all routes
export async function clearAllRoutes() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Error clearing routes:", e);
    throw e;
  }
}