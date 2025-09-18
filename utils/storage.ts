import AsyncStorage from "@react-native-async-storage/async-storage";

export type RouteStop = {
  Lat: string;
  Lon: string;
  LocationName: string;
};

export type Route = {
  Id: string;
  Name: string;
  Stops: RouteStop[];
  DepartureTime: string;
  ArrivalTime: string;
  createdAt: string;
};

const STORAGE_KEY = "SAVED_ROUTES";

// Save new route
export async function saveRoute(
  name: string,
  stops: RouteStop[],
  departureTime: string,
  arrivalTime: string
) {
  try {
    const newRoute: Route = {
      Id: Date.now().toString(),
      Name: name,
      Stops: stops,
      DepartureTime: departureTime,
      ArrivalTime: arrivalTime,
      createdAt: new Date().toISOString(),
    };

    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    const routes: Route[] = existing ? JSON.parse(existing) : [];

    routes.push(newRoute);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
    return newRoute;
  } catch (e) {
    console.error("Error saving route:", e);
  }
}

// ✅ getSavedRoutes (alias of getRoutes)
export async function getSavedRoutes(): Promise<Route[]> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    console.error("Error loading routes:", e);
    return [];
  }
}

// ✅ deleteRoute by ID
export async function deleteRoute(id: string) {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (!existing) return;
    let routes: Route[] = JSON.parse(existing);

    routes = routes.filter((r) => r.Id !== id);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
  } catch (e) {
    console.error("Error deleting route:", e);
  }
}

// ✅ clearAllRoutes (alias of clearRoutes)
export async function clearAllRoutes() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Error clearing routes:", e);
  }
}
