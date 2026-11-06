

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from "react-native";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "./src/firebase/config";

// =====================================
// CONFIGURATION
// =====================================

const ALLOWED_DOMAIN = "hbplus.fit";

// TEMPORARY: Gmail allowed for testing.
// Remove Gmail permission before final production deployment.
const isAllowedEmail = (email) => {
  const normalizedEmail = email?.toLowerCase() || "";

  return (
    normalizedEmail.endsWith(`@${ALLOWED_DOMAIN}`) ||
    normalizedEmail.endsWith("@gmail.com")
  );
};

// =====================================
// FIRESTORE USER PROFILE
// =====================================

async function saveUserProfile(firebaseUser) {
  const userRef = doc(db, "users", firebaseUser.uid);
  const userSnapshot = await getDoc(userRef);

  const userData = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName || "Team Member",
    photoURL: firebaseUser.photoURL || "",
    lastLoginAt: serverTimestamp(),
  };

  if (!userSnapshot.exists()) {
    await setDoc(userRef, {
      ...userData,
      role: "user",
      createdAt: serverTimestamp(),
    });

    return "user";
  }

  await setDoc(userRef, userData, { merge: true });

  return userSnapshot.data().role || "user";
}

// =====================================
// MAIN APP
// =====================================

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("user");

  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================
  // AUTHENTICATION LISTENER
  // =====================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setUserRole("user");
        setLoading(false);
        return;
      }

      try {
        const email = currentUser.email?.toLowerCase() || "";

        // Check email authorization
        if (!isAllowedEmail(email)) {
          await signOut(auth);

          setUser(null);
          setUserRole("user");

          setError(
            "Unauthorized account. Please use an authorized company account."
          );

          setLoading(false);
          return;
        }

        // Save profile in Firestore
        const role = await saveUserProfile(currentUser);

        setUser(currentUser);
        setUserRole(role);
        setError("");
      } catch (err) {
        console.error("Authentication/Profile Error:", err);

        setError(
          err.message || "Unable to load your profile. Please try again."
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // =====================================
  // GOOGLE LOGIN
  // =====================================

  const handleGoogleLogin = async () => {
    try {
      setLoginLoading(true);
      setError("");

      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);

      // Auth listener handles email validation and profile creation.
    } catch (err) {
      console.error("Google Login Error:", err);

      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled. Please try again.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup blocked. Please allow popups and try again.");
      } else {
        setError(err.message || "Google authentication failed.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // =====================================
  // LOGOUT
  // =====================================

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setUser(null);
      setUserRole("user");
      setError("");
    } catch (err) {
      console.error("Logout Error:", err);
      setError("Unable to logout. Please try again.");
    }
  };

  // =====================================
  // LOADING SCREEN
  // =====================================

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F7CFF" />
        <Text style={styles.loadingText}>Loading HBPlus...</Text>
      </SafeAreaView>
    );
  }

  // =====================================
  // DASHBOARD
  // =====================================

  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.logo}>HBPLUS</Text>

          <Text style={styles.successTitle}>Welcome back!</Text>

          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>
            {user.displayName || "Team Member"}
          </Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>

          <Text style={styles.label}>Role</Text>
          <Text style={styles.role}>{userRole.toUpperCase()}</Text>

          <Text style={styles.successMessage}>
            Google authentication successful.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================
  // LOGIN SCREEN
  // =====================================

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>HBPLUS</Text>

        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.subtitle}>
          Sign in with your Google account to continue.
        </Text>

        <Text style={styles.domainText}>
          Company email: @{ALLOWED_DOMAIN}
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            loginLoading && styles.disabledButton,
          ]}
          onPress={handleGoogleLogin}
          disabled={loginLoading}
        >
          {loginLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              Continue with Google
            </Text>
          )}
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Secure sign-in powered by Firebase
        </Text>
      </View>
    </SafeAreaView>
  );
}

// =====================================
// STYLES
// =====================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FC",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
  },

  card: {
    width: "100%",
    maxWidth: 450,
    backgroundColor: "#FFFFFF",
    padding: 30,
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
  },

  logo: {
    fontSize: 28,
    fontWeight: "900",
    color: "#4F7CFF",
    marginBottom: 25,
    textAlign: "center",
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#101828",
    textAlign: "center",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    color: "#667085",
    textAlign: "center",
    marginBottom: 25,
  },

  domainText: {
    fontSize: 14,
    color: "#667085",
    textAlign: "center",
    marginBottom: 20,
  },

  button: {
    backgroundColor: "#101828",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  errorBox: {
    backgroundColor: "#FEF2F2",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },

  errorText: {
    color: "#DC2626",
    textAlign: "center",
  },

  footer: {
    fontSize: 13,
    color: "#98A2B3",
    textAlign: "center",
    marginTop: 25,
  },

  loadingText: {
    marginTop: 15,
    color: "#667085",
  },

  successTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#101828",
    textAlign: "center",
    marginBottom: 25,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#667085",
    marginTop: 15,
  },

  value: {
    fontSize: 16,
    color: "#101828",
    marginTop: 5,
  },

  role: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4F7CFF",
    marginTop: 5,
  },

  successMessage: {
    color: "#16A34A",
    marginTop: 20,
    textAlign: "center",
  },
});
