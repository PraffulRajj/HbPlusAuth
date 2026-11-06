
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

// Temporary Gmail testing exception.
// Remove before final submission if strict company-domain
// restriction is required.
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

      const snapshot = await getDocs(collection(db, "users"));

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

          const role = await saveUserProfile(currentUser);

          setUser(currentUser);
          setUserRole(role);
          setError("");

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
      <SafeAreaView style={styles.loadingScreen}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>H</Text>
          </View>

          <Text style={styles.brandName}>HBPLUS</Text>
        </View>

        <ActivityIndicator
          size="large"
          color="#69E0D0"
        />

        <Text style={styles.loadingText}>
          Preparing your workspace...
        </Text>
      </SafeAreaView>
    );
  }

  // ======================================
  // DASHBOARD
  // ======================================

  if (user) {
    const isAdmin = userRole === "admin";

    return (
      <SafeAreaView style={styles.dashboard}>
        <ScrollView contentContainerStyle={styles.dashboardContent}>

          {/* HEADER */}

          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.brandIconSmall}>
                <Text style={styles.brandIconText}>H</Text>
              </View>

              <View>
                <Text style={styles.brandName}>HBPLUS</Text>
                <Text style={styles.brandSubtitle}>
                  TEAM WORKSPACE
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Sign out ↗</Text>
            </TouchableOpacity>
          </View>

          {/* HERO */}

          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>
              YOUR WORKSPACE
            </Text>

            <Text style={styles.heroTitle}>
              Good to see you,{"\n"}
              {user.displayName?.split(" ")[0] || "there"}.
            </Text>

            <Text style={styles.heroDescription}>
              Your secure HBPlus workspace is ready.
              Everything you need, in one place.
            </Text>

            <View style={styles.statusPill}>
              <View style={styles.statusDot} />

              <Text style={styles.statusText}>
                Authenticated with Google
              </Text>
            </View>
          </View>

          {/* OVERVIEW */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionLabel}>
                OVERVIEW
              </Text>

              <Text style={styles.sectionTitle}>
                Account overview
              </Text>
            </View>

            <View
              style={[
                styles.roleBadge,
                isAdmin && styles.adminBadge,
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  isAdmin && styles.adminBadgeText,
                ]}
              >
                {isAdmin ? "ADMIN" : "MEMBER"}
              </Text>
            </View>
          </View>

          {/* STATS */}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                ACCOUNT STATUS
              </Text>

              <Text style={styles.statValue}>
                Active
              </Text>

              <Text style={styles.statHint}>
                Google verified
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                ACCESS LEVEL
              </Text>

              <Text style={styles.statValue}>
                {isAdmin ? "Admin" : "Member"}
              </Text>

              <Text style={styles.statHint}>
                Workspace access
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                SECURITY
              </Text>

              <Text style={styles.statValue}>
                Protected
              </Text>

              <Text style={styles.statHint}>
                Firebase Authentication
              </Text>
            </View>
          </View>

          {/* PROFILE */}

          <View style={styles.card}>
            <Text style={styles.cardLabel}>
              PROFILE
            </Text>

            <Text style={styles.cardTitle}>
              Your details
            </Text>

            <View style={styles.divider} />

            <Text style={styles.fieldLabel}>
              FULL NAME
            </Text>

            <Text style={styles.fieldValue}>
              {user.displayName || "HBPlus Member"}
            </Text>

            <Text style={styles.fieldLabel}>
              EMAIL ADDRESS
            </Text>

            <Text style={styles.fieldValue}>
              {user.email}
            </Text>

            <Text style={styles.fieldLabel}>
              WORKSPACE ROLE
            </Text>

            <Text style={styles.fieldValue}>
              {isAdmin ? "Administrator" : "Standard user"}
            </Text>
          </View>

          {/* ADMIN DASHBOARD */}

          {isAdmin ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>
                ADMINISTRATION
              </Text>

              <Text style={styles.cardTitle}>
                Member directory
              </Text>

              <Text style={styles.cardDescription}>
                Workspace accounts registered in Firebase.
              </Text>

              <View style={styles.adminCountBox}>
                <Text style={styles.adminCount}>
                  {usersList.length}
                </Text>

                <Text style={styles.adminCountLabel}>
                  REGISTERED MEMBERS
                </Text>
              </View>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={fetchAllUsers}
                disabled={usersLoading}
              >
                {usersLoading ? (
                  <ActivityIndicator color="#0B1724" />
                ) : (
                  <Text style={styles.refreshButtonText}>
                    ↻ Refresh directory
                  </Text>
                )}
              </TouchableOpacity>

              {usersLoading ? (
                <ActivityIndicator color="#0E9D8C" />
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
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {(item.displayName || item.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.userInfo}>
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
                  </View>
                ))
              )}
            </View>
          ) : (
            <View style={styles.memberCard}>
              <Text style={styles.memberIcon}>✦</Text>

              <Text style={styles.cardTitle}>
                Welcome to HBPlus
              </Text>

              <Text style={styles.cardDescription}>
                You are signed in as a standard member.
                Your account access is managed by your
                workspace administrator.
              </Text>
            </View>
          )}

          {/* ERROR */}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          <Text style={styles.footer}>
            HBPLUS · Secure workspace · Powered by Firebase
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ======================================
  // LOGIN SCREEN
  // ======================================

  return (
    <SafeAreaView style={styles.loginScreen}>
      <ScrollView contentContainerStyle={styles.loginContent}>

        {/* BRAND */}

        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>H</Text>
          </View>

          <View>
            <Text style={styles.brandName}>HBPLUS</Text>

            <Text style={styles.brandSubtitle}>
              TEAM WORKSPACE
            </Text>
          </View>
        </View>

        {/* LOGIN LAYOUT */}

        <View style={styles.loginLayout}>

          {/* LEFT SIDE */}

          <View style={styles.loginIntro}>
            <Text style={styles.loginEyebrow}>
              A BETTER WAY TO WORK
            </Text>

            <Text style={styles.loginHeadline}>
              Your team’s{"\n"}
              space to{" "}
              <Text style={styles.headlineAccent}>
                connect.
              </Text>
            </Text>

            <Text style={styles.loginDescription}>
              A secure, streamlined workspace for the
              HBPlus team. Sign in to access your
              account and workspace.
            </Text>

            <View style={styles.features}>
              <Text style={styles.featureText}>
                ✓  Secure Google authentication
              </Text>

              <Text style={styles.featureText}>
                ✓  Company account access control
              </Text>

              <Text style={styles.featureText}>
                ✓  Role-based workspace permissions
              </Text>
            </View>
          </View>

          {/* LOGIN CARD */}

          <View style={styles.loginCard}>
            <Text style={styles.loginCardEyebrow}>
              WELCOME BACK
            </Text>

            <Text style={styles.loginCardTitle}>
              Sign in to HBPlus
            </Text>

            <Text style={styles.loginCardSubtitle}>
              Use your authorized Google account
              to continue.
            </Text>

            <View style={styles.companyEmailBox}>
              <Text style={styles.emailIcon}>@</Text>

              <View>
                <Text style={styles.companyEmailLabel}>
                  COMPANY EMAIL
                </Text>

                <Text style={styles.companyEmailValue}>
                  @{ALLOWED_DOMAIN}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.googleButton,
                loginLoading && styles.disabledButton,
              ]}
              onPress={handleGoogleLogin}
              disabled={loginLoading}
              activeOpacity={0.85}
            >
              {loginLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>

                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>

                  <Text style={styles.googleArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Text style={styles.secureNote}>
              🔒 Secure sign-in powered by Firebase Authentication.
            </Text>

            <Text style={styles.loginFinePrint}>
              Secure access for authorized HBPlus team members.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          HBPLUS · INTERNAL WORKSPACE
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ======================================
// MODERN PROFESSIONAL STYLES
// ======================================

const styles = StyleSheet.create({

  // Loading screen

  loadingScreen: {
    flex: 1,
    backgroundColor: "#0B1724",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#9AABBC",
    marginTop: 15,
    fontSize: 13,
  },

  // Brand

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#69E0D0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  brandIconSmall: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#69E0D0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  brandIconText: {
    color: "#0B1724",
    fontSize: 24,
    fontWeight: "900",
  },

  brandName: {
    color: "#F4F8FC",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 2,
  },

  brandSubtitle: {
    color: "#8194A8",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 3,
  },

  // Login screen

  loginScreen: {
    flex: 1,
    backgroundColor: "#0B1724",
  },

  loginContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 30,
    justifyContent: "center",
  },

  loginLayout: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  },

  loginIntro: {
    flex: 1,
    minWidth: 280,
    maxWidth: 540,
    paddingRight: 30,
    paddingVertical: 24,
  },

  loginEyebrow: {
    color: "#69E0D0",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.5,
    marginBottom: 20,
  },

  loginHeadline: {
    color: "#F4F8FC",
    fontSize: 52,
    lineHeight: 60,
    fontWeight: "800",
    letterSpacing: -1.8,
  },

  headlineAccent: {
    color: "#69E0D0",
  },

  loginDescription: {
    color: "#9AABBC",
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 440,
    marginTop: 22,
  },

  features: {
    marginTop: 30,
  },

  featureText: {
    color: "#C0CBD6",
    fontSize: 14,
    marginBottom: 13,
  },

  loginCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 30,
    marginVertical: 15,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },

  loginCardEyebrow: {
    color: "#0E9D8C",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.2,
    marginBottom: 10,
  },

  loginCardTitle: {
    color: "#122333",
    fontSize: 28,
    fontWeight: "800",
  },

  loginCardSubtitle: {
    color: "#6D7B88",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
    marginBottom: 26,
  },

  companyEmailBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F8F7",
    borderWidth: 1,
    borderColor: "#D8EFEB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },

  emailIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#D8F3EF",
    textAlign: "center",
    textAlignVertical: "center",
    color: "#087F72",
    fontSize: 20,
    fontWeight: "800",
    marginRight: 12,
    overflow: "hidden",
  },

  companyEmailLabel: {
    color: "#66827F",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  companyEmailValue: {
    color: "#163D3A",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },

  googleButton: {
    minHeight: 56,
    borderRadius: 13,
    backgroundColor: "#122333",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  googleIcon: {
    color: "#4285F4",
    backgroundColor: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 12,
  },

  googleButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },

  googleArrow: {
    color: "#69E0D0",
    fontSize: 22,
    fontWeight: "600",
  },

  secureNote: {
    color: "#71818D",
    fontSize: 11,
    marginTop: 22,
    lineHeight: 18,
  },

  loginFinePrint: {
    color: "#9AA5AF",
    fontSize: 11,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 17,
  },

  disabledButton: {
    opacity: 0.6,
  },

  // Dashboard

  dashboard: {
    flex: 1,
    backgroundColor: "#F3F6F8",
  },

  dashboardContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    maxWidth: 1180,
    width: "100%",
    alignSelf: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  logoutButton: {
    borderWidth: 1,
    borderColor: "#D6E0E6",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  logoutText: {
    color: "#324657",
    fontSize: 13,
    fontWeight: "700",
  },

  heroCard: {
    backgroundColor: "#0B1724",
    borderRadius: 24,
    padding: 32,
    minHeight: 245,
    justifyContent: "center",
  },

  heroLabel: {
    color: "#69E0D0",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.5,
    marginBottom: 15,
  },

  heroTitle: {
    color: "#F6FAFC",
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "800",
  },

  heroDescription: {
    color: "#A7B6C3",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 560,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#18313B",
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 18,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#69E0D0",
    marginRight: 8,
  },

  statusText: {
    color: "#BFEAE4",
    fontSize: 11,
    fontWeight: "700",
  },

  // Overview

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 16,
  },

  sectionLabel: {
    color: "#718391",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 5,
  },

  sectionTitle: {
    color: "#142737",
    fontSize: 23,
    fontWeight: "800",
  },

  roleBadge: {
    backgroundColor: "#E1F4F0",
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  roleBadgeText: {
    color: "#087F72",
    fontSize: 10,
    fontWeight: "900",
  },

  adminBadge: {
    backgroundColor: "#E9E8FF",
  },

  adminBadgeText: {
    color: "#5A4BC4",
  },

  // Stats

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },

  statCard: {
    flex: 1,
    minWidth: 190,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EDF1",
    borderRadius: 16,
    padding: 20,
    margin: 6,
  },

  statLabel: {
    color: "#82919D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  statValue: {
    color: "#172E40",
    fontSize: 23,
    fontWeight: "800",
    marginTop: 12,
  },

  statHint: {
    color: "#82919D",
    fontSize: 11,
    marginTop: 5,
  },

  // Cards

  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EDF1",
    borderRadius: 18,
    padding: 24,
    marginTop: 18,
  },

  cardLabel: {
    color: "#0E9D8C",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 6,
  },

  cardTitle: {
    color: "#172E40",
    fontSize: 20,
    fontWeight: "800",
  },

  cardDescription: {
    color: "#7C8B97",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },

  divider: {
    height: 1,
    backgroundColor: "#EAF0F3",
    marginVertical: 20,
  },

  fieldLabel: {
    color: "#8A98A3",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 14,
  },

  fieldValue: {
    color: "#243B4D",
    fontSize: 14,
    fontWeight: "600",
  },

  // Admin

  adminCountBox: {
    backgroundColor: "#E4F5F1",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignSelf: "flex-start",
    marginTop: 18,
  },

  adminCount: {
    color: "#087F72",
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
  },

  adminCountLabel: {
    color: "#508C83",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  refreshButton: {
    alignSelf: "flex-start",
    backgroundColor: "#69E0D0",
    borderRadius: 10,
    minHeight: 42,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 10,
  },

  refreshButtonText: {
    color: "#0B2B31",
    fontSize: 12,
    fontWeight: "900",
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F8FA",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E8EEF2",
  },

  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#DDF4F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  userAvatarText: {
    color: "#087F72",
    fontSize: 15,
    fontWeight: "900",
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1C3446",
  },

  userEmail: {
    fontSize: 11,
    color: "#718391",
    marginTop: 5,
  },

  userRole: {
    fontSize: 10,
    color: "#0E9D8C",
    marginTop: 7,
    fontWeight: "800",
  },

  emptyText: {
    color: "#718391",
    marginVertical: 15,
    textAlign: "center",
    fontSize: 13,
  },

  memberCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EDF1",
    borderRadius: 18,
    padding: 24,
    marginTop: 18,
  },

  memberIcon: {
    color: "#0E9D8C",
    fontSize: 24,
    marginBottom: 12,
  },

  // Errors and footer

  errorBox: {
    backgroundColor: "#FFF1F1",
    borderWidth: 1,
    borderColor: "#FFD9D9",
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },

  errorText: {
    color: "#B42318",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
  },

  footer: {
    fontSize: 11,
    color: "#95A2AE",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 12,
  },
});
