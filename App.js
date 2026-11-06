


import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  ScrollView,
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
  collection,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "./src/firebase/config";

// ======================================
// CONFIGURATION
// ======================================

const ALLOWED_DOMAIN = "hbplus.fit";

// TEMPORARY TESTING ONLY
// Gmail access ko production se pehle remove karna.
const isAllowedEmail = (email) => {
  const normalizedEmail = email?.toLowerCase() || "";

  return (
    normalizedEmail.endsWith("@hbplus.fit") ||
    normalizedEmail === "praffulraj123@gmail.com"
  );
};

// ======================================
// FIRESTORE PROFILE
// ======================================

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

// ======================================
// MAIN APP
// ======================================

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("user");

  const [usersList, setUsersList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  const [error, setError] = useState("");

  // ======================================
  // FETCH USERS - ADMIN ONLY
  // ======================================

  const fetchAllUsers = async () => {
    try {
      setUsersLoading(true);
      setError("");

      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);

      const users = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setUsersList(users);
    } catch (err) {
      console.error("Fetch Users Error:", err);
      setError("Unable to load users. Check Firestore permissions.");
    } finally {
      setUsersLoading(false);
    }
  };

  // ======================================
  // AUTHENTICATION LISTENER
  // ======================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          setUser(null);
          setUserRole("user");
          setUsersList([]);
          setLoading(false);
          return;
        }

        try {
          const email =
            currentUser.email?.toLowerCase() || "";

          // Validate email
          if (!isAllowedEmail(email)) {
            await signOut(auth);

            setUser(null);
            setUserRole("user");
            setUsersList([]);

            setError(
              "Unauthorized account. Please use your official company account."
            );

            setLoading(false);
            return;
          }

          // Save profile and retrieve role
          const role = await saveUserProfile(currentUser);

          setUser(currentUser);
          setUserRole(role);
          setError("");

          // Admin users can fetch all profiles
          if (role === "admin") {
            await fetchAllUsers();
          } else {
            setUsersList([]);
          }
        } catch (err) {
          console.error("Authentication Error:", err);

          setUser(null);
          setError(
            err.message || "Unable to load your profile."
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  // ======================================
  // GOOGLE LOGIN
  // ======================================

  const handleGoogleLogin = async () => {
    try {
      setLoginLoading(true);
      setError("");

      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);

      // Auth listener handles validation and profile creation.
    } catch (err) {
      console.error("Google Login Error:", err);

      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled. Please try again.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup blocked. Please allow popups.");
      } else {
        setError(
          err.message || "Google authentication failed."
        );
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // ======================================
  // LOGOUT
  // ======================================

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setUser(null);
      setUserRole("user");
      setUsersList([]);
      setError("");
    } catch (err) {
      console.error("Logout Error:", err);
      setError("Unable to logout. Please try again.");
    }
  };

  // ======================================
  // LOADING SCREEN
  // ======================================

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color="#4F7CFF"
        />

        <Text style={styles.loadingText}>
          Loading HBPlus...
        </Text>
      </SafeAreaView>
    );
  }

  // ======================================
  // DASHBOARD
  // ======================================

  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            <Text style={styles.logo}>HBPLUS</Text>

            <Text style={styles.successTitle}>
              Welcome back!
            </Text>

            <View style={styles.infoSection}>
              <Text style={styles.label}>Name</Text>

              <Text style={styles.value}>
                {user.displayName || "Team Member"}
              </Text>

              <Text style={styles.label}>Email</Text>

              <Text style={styles.value}>
                {user.email}
              </Text>

              <Text style={styles.label}>Role</Text>

              <Text style={styles.role}>
                {userRole.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.successMessage}>
              Google authentication successful.
            </Text>

            {/* ADMIN DASHBOARD */}

            {userRole === "admin" && (
              <View style={styles.adminSection}>
                <Text style={styles.adminTitle}>
                  Admin Dashboard
                </Text>

                <Text style={styles.adminSubtitle}>
                  Registered Users: {usersList.length}
                </Text>

                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={fetchAllUsers}
                  disabled={usersLoading}
                >
                  <Text style={styles.refreshButtonText}>
                    {usersLoading
                      ? "Refreshing..."
                      : "Refresh Users"}
                  </Text>
                </TouchableOpacity>

                {usersLoading ? (
                  <ActivityIndicator
                    size="large"
                    color="#4F7CFF"
                  />
                ) : usersList.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No users found.
                  </Text>
                ) : (
                  usersList.map((item) => (
                    <View
                      key={item.id}
                      style={styles.userCard}
                    >
                      <Text style={styles.userName}>
                        {item.displayName || "Unknown User"}
                      </Text>

                      <Text style={styles.userEmail}>
                        {item.email || "No email"}
                      </Text>

                      <Text style={styles.userRole}>
                        Role: {(item.role || "user").toUpperCase()}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* USER DASHBOARD */}

            {userRole !== "admin" && (
              <View style={styles.userDashboard}>
                <Text style={styles.userDashboardTitle}>
                  User Dashboard
                </Text>

                <Text style={styles.userDashboardText}>
                  Welcome to your HBPlus workspace.
                </Text>

                <Text style={styles.userDashboardText}>
                  You are logged in as a standard user.
                </Text>
              </View>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ======================================
  // LOGIN SCREEN
  // ======================================

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>HBPLUS</Text>

        <Text style={styles.title}>
          Welcome Back
        </Text>

        <Text style={styles.subtitle}>
          Sign in with your Google account to continue.
        </Text>

        <Text style={styles.domainText}>
          Official company email: @{ALLOWED_DOMAIN}
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
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Secure sign-in powered by Firebase
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ======================================
// STYLES
// ======================================

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

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 20,
  },

  card: {
    width: "100%",
    maxWidth: 500,
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
    marginTop: 20,
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

  infoSection: {
    marginTop: 10,
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

  adminSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  adminTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#101828",
    marginBottom: 8,
  },

  adminSubtitle: {
    fontSize: 15,
    color: "#667085",
    marginBottom: 15,
  },

  refreshButton: {
    backgroundColor: "#E8EEFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },

  refreshButtonText: {
    color: "#315FEA",
    fontWeight: "700",
  },

  userCard: {
    backgroundColor: "#F4F7FC",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#101828",
  },

  userEmail: {
    fontSize: 14,
    color: "#667085",
    marginTop: 5,
  },

  userRole: {
    fontSize: 13,
    color: "#4F7CFF",
    marginTop: 5,
    fontWeight: "600",
  },

  emptyText: {
    color: "#667085",
    marginVertical: 15,
  },

  userDashboard: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "#F4F7FC",
    borderRadius: 12,
  },

  userDashboardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#101828",
    marginBottom: 10,
  },

  userDashboardText: {
    fontSize: 14,
    color: "#667085",
    marginTop: 5,
  },
});
