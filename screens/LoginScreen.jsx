import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import Colours from "../constants/Colours";

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ setIsAuthenticated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  React.useEffect(() => {
    // Complex animations on component mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (username === "admin" && password === "admin123") {
        setIsAuthenticated(true);
      } else {
        Alert.alert("Authentication Failed", "Invalid username or password. Please try again.");
      }
      setIsLoading(false);
    }, 1500);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Animated Background Elements */}
      <View style={styles.background}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
        <Animated.View 
          style={[
            styles.circle, 
            styles.circle4,
            {
              transform: [
                { rotate: rotateInterpolate },
                { scale: scaleAnim }
              ]
            }
          ]} 
        />
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Floating Header Section */}
        <Animated.View 
          style={[
            styles.header,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <Animated.Text 
              style={[
                styles.logo,
                {
                  transform: [{ rotate: rotateInterpolate }]
                }
              ]}
            >
              🚌
            </Animated.Text>
          </View>
          <Text style={styles.title}>RouteMaster</Text>
          <Text style={styles.subtitle}>Navigate Your World</Text>
        </Animated.View>

        {/* Glass Morphism Form */}
        <Animated.View 
          style={[
            styles.formContainer,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Access Portal</Text>
            <View style={styles.formIndicator}>
              <View style={styles.indicatorDot} />
              <View style={[styles.indicatorDot, styles.indicatorDotActive]} />
              <View style={styles.indicatorDot} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Text style={styles.icon}>👤</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Text style={styles.icon}>🔒</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled
            ]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Animated.View 
              style={[
                styles.buttonContent,
                {
                  transform: [{ scale: isLoading ? 0.95 : 1 }]
                }
              ]}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? "Authenticating..." : "Unlock Dashboard"}
              </Text>
              {isLoading && (
                <View style={styles.loadingSpinner}>
                  <View style={styles.spinnerDot} />
                  <View style={styles.spinnerDot} />
                  <View style={styles.spinnerDot} />
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>

          {/* Security Badge */}
          <View style={styles.securityBadge}>
            <Text style={styles.securityIcon}>🛡️</Text>
            <Text style={styles.securityText}>Enterprise Secure Login</Text>
          </View>
        </Animated.View>

        {/* Animated Footer */}
        <Animated.View 
          style={[
            styles.footer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.footerText}>Route Management System v2.0</Text>
          <Text style={styles.footerSubtext}>Powered by Advanced GPS Technology</Text>
        </Animated.View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f2d',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: {
    position: 'absolute',
    borderRadius: 500,
    opacity: 0.1,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: '#6366f1',
    top: -100,
    left: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: '#10b981',
    bottom: -50,
    right: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    backgroundColor: '#f59e0b',
    top: '40%',
    left: '60%',
  },
  circle4: {
    width: 100,
    height: 100,
    backgroundColor: '#ef4444',
    bottom: '30%',
    left: '20%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    fontSize: 48,
    color: '#ffffff',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(99, 102, 241, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '300',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  formIndicator: {
    flexDirection: 'row',
    gap: 6,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  indicatorDotActive: {
    backgroundColor: '#6366f1',
  },
  inputGroup: {
    gap: 20,
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  inputIcon: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  icon: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 20,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    borderRadius: 15,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.5)',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: 'rgba(148, 163, 184, 0.6)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loadingSpinner: {
    flexDirection: 'row',
    marginLeft: 10,
    gap: 3,
  },
  spinnerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  securityIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  footerSubtext: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});