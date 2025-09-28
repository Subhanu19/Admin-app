import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "SAVED_ROUTES";

// Save new route
export async function saveRoute(upRouteName, downRouteName, src, dest, stops) {
  try {
    const newRoute = {
      Id: Date.now().toString(),
      up_route_name: upRouteName,
      down_route_name: downRouteName,
      src: src,
      dest: dest,
      stops: stops,
      createdAt: new Date().toISOString(),
    };

    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const routes = existing ? JSON.parse(existing) : [];

    routes.push(newRoute);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
    return newRoute;
  } catch (e) {
    console.error("Error saving route:", e);
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
  }
}

// Clear all routes
export async function clearAllRoutes() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Error clearing routes:", e);
  }
}