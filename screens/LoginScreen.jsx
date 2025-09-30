import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Custom color theme with black background (same as MapScreen)
const CustomColours = {
  primary: "#e8c513e7",
  secondary: "rgba(11, 8, 8, 1)",
  accent: "#ff6b35",
  danger: "#dc2626",
  warning: "#f59e0b",
  success: "#10b981",
  textDark: "#ffffff",
  textSecondary: "#a0a0a0",
  background: "#000000",
  card: "#1a1a1a",
  border: "#333333"
};

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Helper function to convert object to URL-encoded form data
const formUrlEncode = (data) => {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
};

export default function LoginScreen({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Changed to false by default
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  // Animation for password shake effect
  const shakeAnimation = useState(new Animated.Value(0))[0];

  const validateEmail = (email) => {
    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }
    
    if (!EMAIL_REGEX.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    
    setEmailError("");
    return true;
  };

  // Shake animation function for wrong password
  const shakePasswordField = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    // Validate email format
    if (!validateEmail(email)) {
      return;
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      return;
    }

    setIsLoading(true);
    setPasswordError(""); // Clear previous password error

    try {
      // Prepare form data
      const formData = formUrlEncode({
        email: email.trim(),
        password: password
      });

      // API call to backend with www-form-urlencoded
      const response = await fetch('https://yus.kwscloud.in/yus/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        if (data.login_status === "valid") {
          // Success - automatically navigate without alert
          setIsAuthenticated(true);
        } else {
          // Wrong password - shake animation and show error
          shakePasswordField();
          setPasswordError("Invalid email or password");
        }
      } else {
        shakePasswordField();
        setPasswordError("Login failed. Please try again.");
      }
    } catch (error) {
      console.error('Login error:', error);
      shakePasswordField();
      setPasswordError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    // Clear error when user starts typing
    if (emailError) {
      setEmailError("");
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    // Clear error when user starts typing
    if (passwordError) {
      setPasswordError("");
    }
  };

  const handleEmailBlur = () => {
    validateEmail(email);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoIcon}>🚌</Text>
            </View>
          </View>
          <Text style={styles.title}>Bus Route Manager</Text>
          <Text style={styles.subtitle}>Admin Dashboard</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Admin Login</Text>
          
          {/* Email Input */}
          <View style={styles.inputSection}>
            <View style={[
              styles.inputContainer,
              emailError && styles.inputContainerError
            ]}>
              <Ionicons name="mail-outline" size={20} color={CustomColours.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={CustomColours.textSecondary}
                value={email}
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View>

          {/* Password Input with Shake Animation */}
          <View style={styles.inputSection}>
            <Animated.View 
              style={[
                styles.inputContainer,
                passwordError && styles.inputContainerError,
                { transform: [{ translateX: shakeAnimation }] }
              ]}
            >
              <Ionicons name="lock-closed-outline" size={20} color={CustomColours.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={CustomColours.textSecondary}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword} // This will be true by default (password hidden)
                autoCapitalize="none"
                autoComplete="password"
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={togglePasswordVisibility}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} // Swapped the icons
                  size={20} 
                  color={CustomColours.textSecondary} 
                />
              </TouchableOpacity>
            </Animated.View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <View style={styles.buttonContent}>
              {isLoading ? (
                <Ionicons name="refresh" size={20} color="#000000" style={styles.loadingIcon} />
              ) : (
                <Ionicons name="log-in-outline" size={20} color="#000000" style={styles.buttonIcon} />
              )}
              <Text style={styles.loginButtonText}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Bus Management System v1.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CustomColours.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: CustomColours.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: CustomColours.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: CustomColours.textDark,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: CustomColours.textSecondary,
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: CustomColours.card,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CustomColours.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: CustomColours.textDark,
    textAlign: "center",
    marginBottom: 30,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: CustomColours.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputContainerError: {
    borderColor: CustomColours.danger,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    color: CustomColours.textDark,
    fontSize: 16,
    fontWeight: "500",
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: CustomColours.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
  loginButton: {
    backgroundColor: CustomColours.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: CustomColours.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  loadingIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    color: CustomColours.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
});