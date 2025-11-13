import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { loginUser } from "../utils/Api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Light theme colors
const CustomColours = {
  primary: "#FFD700",           // Gold
  secondary: "rgba(11, 8, 8, 1)", // Dark for contrast
  accent: "#ff6b35",
  danger: "#dc2626",
  warning: "#f59e0b",
  success: "#10b981",
  textDark: "#000000",          // Black text
  textSecondary: "#666666",     // Gray text
  background: "#ffffff",        // White background
  card: "#f8f9fa",             // Light gray card
  border: "#e0e0e0",           // Light border
  goldLight: "#f8e68c",        // Lighter gold
  goldDark: "#b8950a"          // Darker gold
};

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function LoginScreen({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
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
    setPasswordError("");

    try {
      // Use the API function
      await loginUser({
        email: email.trim(),
        password: password
      });
      
      // If login successful, navigate to main app
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('Login error:', error);
      shakePasswordField();
      setPasswordError(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (emailError) setEmailError("");
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (passwordError) setPasswordError("");
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
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/YUS_LOGO.png')}
              style={styles.busImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>YUS Route Manager</Text>
          <Text style={styles.subtitle}>Administrative Portal</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <View style={styles.formIcon}>
              <Ionicons name="shield-checkmark" size={24} color={CustomColours.primary} />
            </View>
            <Text style={styles.formTitle}>Admin Authentication</Text>
          </View>
          
          {/* Email Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={[
              styles.inputContainer,
              emailError && styles.inputContainerError
            ]}>
              <Ionicons name="mail-outline" size={20} color={CustomColours.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={CustomColours.textSecondary}
                value={email}
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                editable={!isLoading}
              />
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View>

          {/* Password Input with Shake Animation */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
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
                placeholder="Enter your password"
                placeholderTextColor={CustomColours.textSecondary}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={togglePasswordVisibility}
                disabled={isLoading}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
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
                {isLoading ? "Authenticating..." : "Access Dashboard"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 YUS Bus Management System</Text>
          <Text style={styles.footerSubtext}>Secure Admin Portal v1.0</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CustomColours.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoContainer: {
    marginBottom: 8, // Reduced from 20 to 8 (very small space)
    alignItems: "center",
    justifyContent: "center",
  },
  busImage: {
    width: 180,
    height: 180,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: CustomColours.textDark,
    textAlign: "center",
    marginBottom: 4, // Reduced from 8 to 4
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: CustomColours.primary,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: CustomColours.card,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CustomColours.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  formIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: CustomColours.primary,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: CustomColours.textDark,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: CustomColours.textSecondary,
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: CustomColours.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputContainerError: {
    borderColor: CustomColours.danger,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: CustomColours.textDark,
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: CustomColours.danger,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 8,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: CustomColours.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: CustomColours.goldDark,
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
    marginRight: 10,
  },
  loadingIcon: {
    marginRight: 10,
  },
  loginButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    color: CustomColours.textSecondary,
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 4,
  },
  footerSubtext: {
    color: CustomColours.textSecondary,
    fontSize: 10,
    textAlign: "center",
    opacity: 0.7,
  },
});