import AsyncStorage from '@react-native-async-storage/async-storage';

// Save route to local storage
export const saveRoute = async (routeData) => {
  try {
    const routes = await getSavedRoutes();
    const newRoute = {
      id: Date.now().toString(),
      ...routeData,
      created_at: new Date().toISOString()
    };
    
    const updatedRoutes = [...routes, newRoute];
    await AsyncStorage.setItem('@saved_routes', JSON.stringify(updatedRoutes));
    return newRoute;
  } catch (e) {
    console.error('Error saving route:', e);
    throw e;
  }
};

// Get all saved routes
export const getSavedRoutes = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('@saved_routes');
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error loading routes:', e);
    return [];
  }
};

// Delete a specific route by ID
export const deleteRoute = async (routeId) => {
  try {
    const routes = await getSavedRoutes();
    const updatedRoutes = routes.filter(route => route.id !== routeId);
    await AsyncStorage.setItem('@saved_routes', JSON.stringify(updatedRoutes));
  } catch (e) {
    console.error('Error deleting route:', e);
    throw e;
  }
};

// Clear all saved routes
export const clearAllRoutes = async () => {
  try {
    await AsyncStorage.removeItem('@saved_routes');
  } catch (e) {
    console.error('Error clearing all routes:', e);
    throw e;
  }
};