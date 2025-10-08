import * as SecureStore from 'expo-secure-store';
import { VirtualizedList } from 'react-native';

// Helper function to convert object to URL-encoded form data
const formUrlEncode = (data) => {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
};

// API function to send route to server
const send_route_to_server = async (new_route) => {
  try {
    // Get the session_id from SecureStore
    const sessionId = await SecureStore.getItemAsync('session_id');
    
    const headers = {
      "Content-Type": "application/json",
    };
    
    // Add Authorization header if session_id exists
    if (sessionId) {
      headers["Authorization"] = sessionId;
    }

    console.log('Sending route to server with session_id:', sessionId ? 'Yes' : 'No');

    const response = await fetch("https://yus.kwscloud.in/yus/save-new-route", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(new_route),
    });



    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid session
        await SecureStore.deleteItemAsync('session_id');
        throw new Error('Authentication failed. Please login again.');
      }
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Route saved successfully:', result);
    return result;
  } catch (error) {
    console.error("Error sending route to server:", error);
    throw error;
  }
};

// Login function to get and store session_id
const loginUser = async (credentials) => {
  try {
    // Prepare form data
    const formData = formUrlEncode({
      email: credentials.email,
      password: credentials.password
    });

    console.log('Attempting login with:', credentials.email);

    const response = await fetch("https://yus.kwscloud.in/yus/admin-login", {
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const data = await response.json();
    console.log('Login response:', data);

    if (!response.ok) {
      throw new Error(data.message || `Login failed: ${response.status}`);
    }

    if (data.login_status === "valid") {
      // Save the session_id to SecureStore
      if (data.session_id) {
        await SecureStore.setItemAsync('session_id', data.session_id);
        console.log('Session ID saved to SecureStore');
      } else {
        throw new Error("No session_id received from server");
      }
      
      return data;
    } else {
      throw new Error("Invalid email or password");
    }
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

// Function to clear session on logout
const clearSession = async () => {
  try {
    await SecureStore.deleteItemAsync('session_id');
    console.log('Session cleared from SecureStore');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

// Function to check if user is authenticated
const isAuthenticated = async () => {
  try {
    const sessionId = await SecureStore.getItemAsync('session_id');
    return sessionId !== null;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Function to get current session (for debugging)
const getCurrentSession = async () => {
  try {
    const sessionId = await SecureStore.getItemAsync('session_id');
    return sessionId;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

// Export all functions at the end to avoid circular dependencies
export {
  send_route_to_server,
  loginUser,
  clearSession,
  isAuthenticated,
  getCurrentSession
};