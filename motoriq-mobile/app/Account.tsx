import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import API from "../src/services/api";
import VehicleCard from "../src/components/VehicleCard";
import BottomBar from "../src/components/BottomBar";
import ThemeToggle from "../src/components/ThemeToggle";
import NotificationBell from "../src/components/NotificationBell";
import { useTheme } from "../src/context/ThemeContext";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Floating label input ─────────────────────────────────────────────────────
function FloatingInput({ label, value, onChangeText, secureTextEntry, keyboardType = "default" }) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    if (value && !focused) {
      Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: false }).start();
    }
  }, [value, focused]);

  const onFocus = () => {
    setFocused(true);
    Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    if (!value) Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  };

  const labelTop = anim.interpolate({ inputRange: [0, 1], outputRange: [14, -8] });
  const labelSize = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 11] });
  const labelColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#9ca3af", focused ? "#ff6600" : "#6b7280"],
  });

  return (
    <View style={[s.floatWrap, focused && s.floatWrapFocused]}>
      <Animated.Text style={[s.floatLabel, { top: labelTop, fontSize: labelSize, color: labelColor }]}>
        {label}
      </Animated.Text>
      <TextInput
        style={s.floatInput}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

// ─── Tab pill ─────────────────────────────────────────────────────────────────
function TabPill({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.tabPill, active && s.tabPillActive]}
    >
      <Text style={s.tabPillIcon}>{icon}</Text>
      <Text style={[s.tabPillText, active && s.tabPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ emoji, title }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionEmoji}>{emoji}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ emoji, message }) {
  return (
    <View style={s.emptyState}>
      <Text style={s.emptyEmoji}>{emoji}</Text>
      <Text style={s.emptyText}>{message}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function Account() {
  const router = useRouter();
  const { theme: t } = useTheme();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState("ads");

  const [myAds, setMyAds] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const [profileData, setProfileData] = useState({
    name: "", email: "", phone: "", city: "",
  });
  const setProfileField = (k, v) => setProfileData((p) => ({ ...p, [k]: v }));

  const [passwordData, setPasswordData] = useState({
    currentPassword: "", newPassword: "",
  });
  const setPassField = (k, v) => setPasswordData((p) => ({ ...p, [k]: v }));

  const [profileLoading, setProfileLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // ── Boost Ad ──
  const [showBoostModal, setShowBoostModal] = useState(null);
  const [boostImage, setBoostImage] = useState(null);
  const [isBoosting, setIsBoosting] = useState(false);

  const pickBoostImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled) {
      setBoostImage(result.assets[0]);
    }
  };

  const handleBoostSubmit = async () => {
    if (!boostImage) return Alert.alert("Required", "Please select a bank slip image");
    setIsBoosting(true);
    const data = new FormData();
    data.append("slipImage", {
      uri: boostImage.uri,
      name: boostImage.fileName || `slip_${Date.now()}.jpg`,
      type: "image/jpeg",
    });

    try {
      await API.post(`/vehicles/${showBoostModal}/boost`, data, {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      });
      Alert.alert("Success", "Boost request submitted! Awaiting admin approval.");
      setShowBoostModal(null);
      setBoostImage(null);
      fetchData(token); // Refresh ads
    } catch (err) {
      Alert.alert("Error", "Failed to submit boost");
    } finally {
      setIsBoosting(false);
    }
  };

  // ── Load auth + data on mount ─────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const t = await AsyncStorage.getItem("token");
      const u = JSON.parse((await AsyncStorage.getItem("user")) || "null");
      if (!t || !u) {
        router.replace("/login");
        return;
      }
      setToken(t);
      setUser(u);
      setProfileData({
        name: u.name || "",
        email: u.email || "",
        phone: u.phone || "",
        city: u.city || "",
      });
      fetchData(t);
    };
    init();
  }, []);

  const fetchData = async (t) => {
    setDataLoading(true);
    try {
      const [profRes, adsRes, favRes] = await Promise.allSettled([
        API.get("/users/profile", { headers: { Authorization: t } }),
        API.get("/vehicles/my", { headers: { Authorization: t } }),
        API.get("/users/favorites", { headers: { Authorization: t } }),
      ]);
      if (profRes.status === "fulfilled") {
        const u = profRes.value.data;
        setUser(u);
        setProfileData({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          city: u.city || "",
        });
        await AsyncStorage.setItem("user", JSON.stringify(u));
      }
      if (adsRes.status === "fulfilled") setMyAds(adsRes.value.data);
      if (favRes.status === "fulfilled") setFavorites(favRes.value.data);
    } catch (err) {
      console.log(err);
    } finally {
      setDataLoading(false);
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const deleteAd = (id) => {
    Alert.alert("Delete Ad", "Are you sure you want to delete this ad?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await API.delete(`/vehicles/${id}`, { headers: { Authorization: token } });
            setMyAds((prev) => prev.filter((ad) => ad._id !== id));
          } catch {
            Alert.alert("Failed to delete ad");
          }
        },
      },
    ]);
  };

  const removeFavorite = async (id) => {
    try {
      await API.post(`/users/favorite/${id}`, {}, { headers: { Authorization: token } });
      setFavorites((prev) => prev.filter((v) => v._id !== id));
    } catch {
      Alert.alert("Failed to remove favorite");
    }
  };

  const updateProfile = async () => {
    setProfileLoading(true);
    try {
      await API.put("/users/profile", profileData, { headers: { Authorization: token } });
      // Update local storage
      const updated = { ...user, ...profileData };
      await AsyncStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      Alert.alert("✅ Profile updated successfully");
    } catch {
      Alert.alert("Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      return Alert.alert("Please fill in both fields");
    }
    setPassLoading(true);
    try {
      await API.put("/users/change-password", passwordData, { headers: { Authorization: token } });
      setPasswordData({ currentPassword: "", newPassword: "" });
      Alert.alert("✅ Password changed successfully");
    } catch {
      Alert.alert("Failed to change password. Check your current password.");
    } finally {
      setPassLoading(false);
    }
  };

  const logout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          router.replace("/login");
        },
      },
    ]);
  };

  // ── Tab definitions ───────────────────────────────────────────────────────
  const tabs = [
    { key: "ads",      icon: "🚗", label: "My Ads" },
    { key: "favorites",icon: "❤️", label: "Saved" },
    { key: "edit",     icon: "✏️", label: "Profile" },
    { key: "password", icon: "🔒", label: "Password" },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: t.bgBody }}>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ══ HERO / PROFILE HEADER ══════════════════════════════════════ */}
        <View style={[s.hero, { backgroundColor: t.isDark ? t.bgCard : "#111" }]}>
          <View style={{ position: "absolute", top: Platform.OS === "ios" ? 60 : 44, right: 16, zIndex: 10, flexDirection: "row", gap: 10 }}>
            <NotificationBell />
            <TouchableOpacity 
              style={[s.settingsBtn, { backgroundColor: t.isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.2)" }]} 
              onPress={() => router.push("/settings")}
            >
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>
            <ThemeToggle />
          </View>
          <View style={s.blob1} />
          <View style={s.blob2} />

          {/* Avatar */}
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
            <View style={s.avatarBadge}>
              <Text style={s.avatarBadgeText}>✓</Text>
            </View>
          </View>

          <Text style={s.heroName}>{user?.name || "My Account"}</Text>
          <Text style={s.heroEmail}>{user?.email || ""}</Text>

          {/* Quick stats */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{myAds.length}</Text>
              <Text style={s.statLabel}>Listings</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{favorites.length}</Text>
              <Text style={s.statLabel}>Saved</Text>
            </View>
            {user?.city && (
              <>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={s.statValue}>📍</Text>
                  <Text style={s.statLabel}>{user.city}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ══ TAB PILLS ══════════════════════════════════════════════════ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsScroll}
          style={s.tabsRow}
        >
          {tabs.map((tab) => (
            <TabPill
              key={tab.key}
              icon={tab.icon}
              label={tab.label}
              active={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
            />
          ))}
          {user?.email === "admin@motoriq.lk" && (
            <TouchableOpacity 
              style={[s.logoutPill, { backgroundColor: "#8b5cf6", borderColor: "#8b5cf6", marginRight: 8 }]} 
              onPress={() => router.push("/admin")}
            >
              <Text style={[s.logoutPillText, { color: "#fff" }]}>⚡ Admin</Text>
            </TouchableOpacity>
          )}

          {/* Logout as last tab */}
          <TouchableOpacity style={s.logoutPill} onPress={logout}>
            <Text style={s.logoutPillText}>🚪 Logout</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ══ CONTENT ════════════════════════════════════════════════════ */}
        <View style={s.content}>

          {/* ── MY ADS ── */}
          {activeTab === "ads" && (
            <View>
              <SectionHeader emoji="🚗" title="My Listings" />

              {dataLoading ? (
                <ActivityIndicator color="#ff6600" style={{ marginTop: 40 }} />
              ) : myAds.length === 0 ? (
                <EmptyState emoji="🚗" message="You haven't posted any vehicles yet." />
              ) : (
                myAds.map((vehicle) => (
                  <View key={vehicle._id} style={s.adCard}>
                    <VehicleCard
                      vehicle={vehicle}
                      monthlyBudget={50000}
                      addToCompare={() => {}}
                    />
                    <View style={s.adActions}>
                      <TouchableOpacity
                        style={s.editBtn}
                        onPress={() => router.push(`/edit-vehicle/${vehicle._id}`)}
                      >
                        <Text style={s.editBtnText}>✏️ Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.deleteBtn}
                        onPress={() => deleteAd(vehicle._id)}
                      >
                        <Text style={s.deleteBtnText}>🗑 Delete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.boostBtn}
                        onPress={() => setShowBoostModal(vehicle._id)}
                      >
                        <Text style={s.boostBtnText}>🚀 Boost</Text>
                      </TouchableOpacity>
                    </View>
                    {/* BOOST STATUS BADGE */}
                    {vehicle.boostStatus && vehicle.boostStatus !== "none" && !vehicle.isPremium && (
                      <View style={[s.boostStatusBadge, { backgroundColor: vehicle.boostStatus === "rejected" ? "#ef4444" : "#3b82f6" }]}>
                        <Text style={s.boostStatusText}>Boost: {vehicle.boostStatus.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {/* ── FAVORITES ── */}
          {activeTab === "favorites" && (
            <View>
              <SectionHeader emoji="❤️" title="Saved Vehicles" />

              {dataLoading ? (
                <ActivityIndicator color="#ff6600" style={{ marginTop: 40 }} />
              ) : favorites.length === 0 ? (
                <EmptyState emoji="❤️" message="No saved vehicles yet. Tap ❤️ on any listing to save it." />
              ) : (
                favorites.map((vehicle) => (
                  <View key={vehicle._id} style={s.adCard}>
                    <VehicleCard
                      vehicle={vehicle}
                      monthlyBudget={50000}
                      addToCompare={() => {}}
                    />
                    <TouchableOpacity
                      style={s.removeFavBtn}
                      onPress={() => removeFavorite(vehicle._id)}
                    >
                      <Text style={s.removeFavBtnText}>💔 Remove from Favorites</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ── EDIT PROFILE ── */}
          {activeTab === "edit" && (
            <View style={s.card}>
              <SectionHeader emoji="✏️" title="Edit Profile" />

              <View style={s.formGroup}>
                <FloatingInput
                  label="Name"
                  value={profileData.name}
                  onChangeText={(v) => setProfileField("name", v)}
                />
                <FloatingInput
                  label="Email Address"
                  value={profileData.email}
                  onChangeText={(v) => setProfileField("email", v)}
                  keyboardType="email-address"
                />
                <FloatingInput
                  label="Phone Number"
                  value={profileData.phone}
                  onChangeText={(v) => setProfileField("phone", v)}
                  keyboardType="phone-pad"
                />
                <FloatingInput
                  label="City"
                  value={profileData.city}
                  onChangeText={(v) => setProfileField("city", v)}
                />
              </View>

              <TouchableOpacity
                style={[s.submitBtn, profileLoading && { opacity: 0.7 }]}
                onPress={updateProfile}
                disabled={profileLoading}
              >
                {profileLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.submitBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ── CHANGE PASSWORD ── */}
          {activeTab === "password" && (
            <View style={s.card}>
              <SectionHeader emoji="🔒" title="Change Password" />

              <View style={s.formGroup}>
                <FloatingInput
                  label="Current Password"
                  value={passwordData.currentPassword}
                  onChangeText={(v) => setPassField("currentPassword", v)}
                  secureTextEntry
                />
                <FloatingInput
                  label="New Password"
                  value={passwordData.newPassword}
                  onChangeText={(v) => setPassField("newPassword", v)}
                  secureTextEntry
                />
              </View>

              {/* Password strength hint */}
              {passwordData.newPassword.length > 0 && (
                <View style={[
                  s.strengthBar,
                  passwordData.newPassword.length < 6
                    ? { backgroundColor: "#fee2e2", borderColor: "#fca5a5" }
                    : passwordData.newPassword.length < 10
                    ? { backgroundColor: "#fef9c3", borderColor: "#fde68a" }
                    : { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
                ]}>
                  <Text style={s.strengthText}>
                    {passwordData.newPassword.length < 6
                      ? "⚠️ Too short (min 6 characters)"
                      : passwordData.newPassword.length < 10
                      ? "🟡 Medium strength"
                      : "✅ Strong password"}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[s.submitBtn, passLoading && { opacity: 0.7 }]}
                onPress={changePassword}
                disabled={passLoading}
              >
                {passLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.submitBtnText}>Update Password</Text>}
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>

      {/* ── BOOST MODAL ── */}
      <Modal visible={!!showBoostModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: t.isDark ? t.bgCard : "#fff" }]}>
            <TouchableOpacity style={s.modalCloseIcon} onPress={() => setShowBoostModal(null)}>
              <Text style={{ fontSize: 16, color: "#9ca3af" }}>✕</Text>
            </TouchableOpacity>

            <Text style={[s.modalTitle, { color: t.textPrimary }]}>🌟 Premium Boost</Text>
            <Text style={[s.modalDesc, { color: t.textMuted }]}>
              Rank your ad at the top of the homepage and search results! A one-time administrative fee applies.
            </Text>

            <View style={[s.bankInfo, { backgroundColor: t.isDark ? "rgba(255,255,255,0.05)" : "#f9fafb" }]}>
              <Text style={s.bankInfoTitle}>Payment Details</Text>
              <Text style={[s.bankInfoText, { color: t.textSecondary }]}>Amount: LKR 1000 /=</Text>
              <Text style={[s.bankInfoText, { color: t.textSecondary }]}>Bank: Commercial Bank</Text>
              <Text style={[s.bankInfoText, { color: t.textSecondary }]}>Account Name: MotorIQ PVT LTD</Text>
              <Text style={[s.bankInfoText, { color: t.textSecondary }]}>Account No: 1234567890</Text>
            </View>

            <Text style={[s.modalLabel, { color: t.textPrimary }]}>Upload Bank Transfer Slip</Text>
            <TouchableOpacity style={s.imagePickerBtn} onPress={pickBoostImage}>
              {boostImage ? (
                <Image source={{ uri: boostImage.uri }} style={{ width: "100%", height: 120, borderRadius: 10 }} resizeMode="cover" />
              ) : (
                <Text style={s.imagePickerText}>Tap to select image</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.boostSubmitBtn, isBoosting && { opacity: 0.7 }]}
              onPress={handleBoostSubmit}
              disabled={isBoosting}
            >
              {isBoosting ? <ActivityIndicator color="#fff" /> : <Text style={s.boostSubmitText}>Submit for Approval</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ BOTTOM BAR ════════════════════════════════════════════════════ */}
      <BottomBar activeRoute="/account" />

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // ── Hero ──
  hero: {
    backgroundColor: "#111",
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 30,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  blob1: {
    position: "absolute", top: -60, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "#ff6600", opacity: 0.2,
  },
  blob2: {
    position: "absolute", bottom: -50, right: -30,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: "#ff6600", opacity: 0.1,
  },

  // Avatar
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: "#ff6600",
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "#fff",
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "800" },
  avatarBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#22c55e", borderWidth: 2, borderColor: "#111",
    alignItems: "center", justifyContent: "center",
  },
  avatarBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  heroName: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  heroEmail: { color: "#9ca3af", fontSize: 13, marginTop: 3 },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(10px)",
  },

  // Stats
  statsRow: {
    flexDirection: "row", alignItems: "center",
    marginTop: 18, backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12,
  },
  statItem: { alignItems: "center", paddingHorizontal: 16 },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "800" },
  statLabel: { color: "#9ca3af", fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.15)" },

  // ── Tabs ──
  tabsRow: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    maxHeight: 64,
  },
  tabsScroll: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  tabPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, backgroundColor: "#f3f4f6",
    borderWidth: 1.5, borderColor: "transparent",
  },
  tabPillActive: {
    backgroundColor: "#fff3eb",
    borderColor: "#ff6600",
  },
  tabPillIcon: { fontSize: 14 },
  tabPillText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  tabPillTextActive: { color: "#ff6600", fontWeight: "800" },
  logoutPill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, backgroundColor: "#fff1f2",
    borderWidth: 1.5, borderColor: "#fecaca",
  },
  logoutPillText: { fontSize: 13, fontWeight: "700", color: "#ef4444" },

  // ── Content ──
  content: { padding: 14 },

  // ── Card ──
  card: {
    backgroundColor: "#fff",
    borderRadius: 20, padding: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },

  // ── Section header ──
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  sectionEmoji: { fontSize: 18, marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111", letterSpacing: -0.3 },

  // ── Empty state ──
  emptyState: {
    alignItems: "center", paddingVertical: 50,
    backgroundColor: "#fff", borderRadius: 20,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  emptyEmoji: { fontSize: 44 },
  emptyText: { color: "#9ca3af", fontSize: 14, marginTop: 12, textAlign: "center", paddingHorizontal: 30 },

  // ── Ad card ──
  adCard: {
    marginBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 20, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  adActions: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: "#f3f4f6",
  },
  editBtn: {
    flex: 1, backgroundColor: "#eff6ff",
    borderRadius: 10, paddingVertical: 10, alignItems: "center",
    borderWidth: 1.5, borderColor: "#bfdbfe",
  },
  editBtnText: { color: "#1d4ed8", fontWeight: "700", fontSize: 13 },
  deleteBtn: {
    flex: 1, backgroundColor: "#fff1f2",
    borderRadius: 10, paddingVertical: 10, alignItems: "center",
    borderWidth: 1.5, borderColor: "#fecaca",
  },
  deleteBtnText: { color: "#ef4444", fontWeight: "700", fontSize: 13 },
  boostBtn: {
    flex: 1, backgroundColor: "#fef9c3",
    borderRadius: 10, paddingVertical: 10, alignItems: "center",
    borderWidth: 1.5, borderColor: "#fde047",
  },
  boostBtnText: { color: "#ca8a04", fontWeight: "700", fontSize: 13 },
  boostStatusBadge: {
    position: "absolute", top: 12, left: 12,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  boostStatusText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  removeFavBtn: {
    marginHorizontal: 12, marginBottom: 12,
    backgroundColor: "#fff1f2", borderRadius: 10, paddingVertical: 10,
    alignItems: "center", borderWidth: 1.5, borderColor: "#fecaca",
  },
  removeFavBtnText: { color: "#ef4444", fontWeight: "700", fontSize: 13 },

  // ── Form ──
  formGroup: { gap: 14, marginBottom: 18 },
  floatWrap: {
    borderWidth: 1.5, borderColor: "#e5e7eb",
    borderRadius: 12, paddingHorizontal: 12,
    paddingTop: 18, paddingBottom: 8,
    backgroundColor: "#f9fafb", position: "relative",
  },
  floatWrapFocused: { borderColor: "#ff6600", backgroundColor: "#fff" },
  floatLabel: { position: "absolute", left: 13, backgroundColor: "transparent", zIndex: 1 },
  floatInput: { fontSize: 15, color: "#111", paddingVertical: 2 },

  // Password strength
  strengthBar: {
    borderRadius: 10, borderWidth: 1.5,
    padding: 10, marginBottom: 14,
  },
  strengthText: { fontSize: 13, fontWeight: "600", color: "#374151" },

  // Submit
  submitBtn: {
    backgroundColor: "#ff6600",
    borderRadius: 14, paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#ff6600", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  // Boost Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  modalCloseIcon: { position: "absolute", top: 16, right: 16, padding: 8 },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  modalDesc: { fontSize: 13, marginBottom: 20, lineHeight: 18 },
  bankInfo: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 20 },
  bankInfoTitle: { fontSize: 14, fontWeight: "700", color: "#ea580c", marginBottom: 8 },
  bankInfoText: { fontSize: 13, marginBottom: 4 },
  modalLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  imagePickerBtn: { height: 120, borderWidth: 2, borderStyle: "dashed", borderColor: "#cbd5e1", borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 20, overflow: "hidden" },
  imagePickerText: { color: "#94a3b8", fontWeight: "600" },
  boostSubmitBtn: { backgroundColor: "#ea580c", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  boostSubmitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});