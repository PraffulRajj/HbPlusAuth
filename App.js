
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "./src/firebase/config";

const ALLOWED_DOMAIN = "hbplus.fit";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const email = currentUser.email?.toLowerCase() || "";

        if (email.endsWith(`@${ALLOWED_DOMAIN}`)) {
          setUser(currentUser);
          setError("");
        } else {
          setUser(null);
          setError("Access denied. Please use your official domain account.");

          signOut(auth);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleGoogleLogin = async () => {
    setError("");

    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);

      const email = result.user.email?.toLowerCase() || "";

      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        await signOut(auth);

        setError(
          "Access denied. Please use your official @hbplus.fit account."
        );
      }
    } catch (err) {
      console.log(err);
      setError(err.message || "Google authentication failed.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setError("");
    } catch (err) {
      setError("Logout failed.");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.subtitle}>Checking authentication...</Text>
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.logo}>B+</Text>

          <Text style={styles.title}>Welcome to HBPlus!</Text>

          <Text style={styles.subtitle}>
            You are successfully authenticated.
          </Text>

          <Text style={styles.email}>{user.email}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>B+</Text>

        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.subtitle}>
          Sign in with your official Google account
          to access the HBPlus dashboard.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={handleGoogleLogin}
        >
          <Text style={styles.buttonText}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <Text style={styles.footer}>
          Authorized users only • © 2024 HBPlus
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F5F9",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    padding: 35,
    borderRadius: 20,
    alignItems: "center",
    elevation: 5,
  },

  logo: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#2563EB",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 25,
  },

  email: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 20,
  },

  button: {
    width: "100%",
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  error: {
    color: "#DC2626",
    marginTop: 20,
    textAlign: "center",
  },

  footer: {
    marginTop: 25,
    color: "#9CA3AF",
    fontSize: 12,
  },
});
