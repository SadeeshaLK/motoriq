import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../src/context/ThemeContext";
import ThemeToggle from "../src/components/ThemeToggle";
import BottomBar from "../src/components/BottomBar";

export default function Settings() {
  const router = useRouter();
  const { theme: t } = useTheme();

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: true
  });

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showPhone: false
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await API.get("/users/profile", { headers: { Authorization: token } });
      if (res.data.settings) {
        if (res.data.settings.notifications) setNotifications(res.data.settings.notifications);
        if (res.data.settings.privacy) setPrivacy(res.data.settings.privacy);
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (section: string, key: string, value: boolean) => {
    // 1. Update UI immediately
    if (section === "notifications") {
      setNotifications(prev => ({ ...prev, [key]: value }));
    } else {
      setPrivacy(prev => ({ ...prev, [key]: value }));
    }

    // 2. Sync to backend
    try {
      const token = await AsyncStorage.getItem("token");
      const payload = {
        settings: {
          notifications: section === "notifications" ? { ...notifications, [key]: value } : notifications,
          privacy: section === "privacy" ? { ...privacy, [key]: value } : privacy
        }
      };
      await API.put("/users/profile", payload, { headers: { Authorization: token } });
    } catch (err) {
      Alert.alert("Error", "Failed to save settings");
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

  const SettingRow = ({ icon, label, sublabel, children, onPress }: any) => (
    <TouchableOpacity 
      style={[s.row, { borderBottomColor: t.isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6" }]} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={s.rowLeft}>
        <View style={[s.iconCircle, { backgroundColor: t.isDark ? "rgba(255,255,255,0.1)" : "#f3f4f6" }]}>
          <Text style={s.iconText}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.rowLabel, { color: t.textPrimary }]}>{label}</Text>
          {sublabel && <Text style={[s.rowSub, { color: t.textMuted }]}>{sublabel}</Text>}
        </View>
      </View>
      {children}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bgBody }}>
      <View style={[s.header, { backgroundColor: t.isDark ? t.bgCard : "#fff", borderBottomColor: t.isDark ? t.borderGlass : "#f3f4f6" }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={[s.backText, { color: t.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: t.textPrimary }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Appearance */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: t.primary }]}>Appearance</Text>
          <View style={[s.card, { backgroundColor: t.isDark ? t.bgCard : "#fff" }]}>
            <SettingRow icon="🌓" label="Dark Mode" sublabel="Adjust the app's color theme">
              <ThemeToggle />
            </SettingRow>
          </View>
        </View>

        {/* Notifications */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: t.primary }]}>Notifications</Text>
          <View style={[s.card, { backgroundColor: t.isDark ? t.bgCard : "#fff" }]}>
            <SettingRow icon="📧" label="Email Notifications" sublabel="Get updates about favorites">
              <Switch 
                value={notifications.email} 
                onValueChange={(val) => handleToggle("notifications", "email", val)} 
                trackColor={{ false: "#d1d5db", true: t.primary }}
              />
            </SettingRow>
            <SettingRow icon="🔔" label="Push Notifications" sublabel="Real-time alerts for messages">
              <Switch 
                value={notifications.push} 
                onValueChange={(val) => handleToggle("notifications", "push", val)} 
                trackColor={{ false: "#d1d5db", true: t.primary }}
              />
            </SettingRow>
            <SettingRow icon="📢" label="Marketing" sublabel="Promo offers and newsletters">
              <Switch 
                value={notifications.marketing} 
                onValueChange={(val) => handleToggle("notifications", "marketing", val)} 
                trackColor={{ false: "#d1d5db", true: t.primary }}
              />
            </SettingRow>
          </View>
        </View>

        {/* Privacy */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: t.primary }]}>Privacy & Safety</Text>
          <View style={[s.card, { backgroundColor: t.isDark ? t.bgCard : "#fff" }]}>
            <SettingRow icon="👤" label="Public Profile" sublabel="Allow others to see your seller profile">
              <Switch 
                value={privacy.publicProfile} 
                onValueChange={(val) => handleToggle("privacy", "publicProfile", val)} 
                trackColor={{ false: "#d1d5db", true: t.primary }}
              />
            </SettingRow>
            <SettingRow icon="📞" label="Show Phone Number" sublabel="Display contact on your listings">
              <Switch 
                value={privacy.showPhone} 
                onValueChange={(val) => handleToggle("privacy", "showPhone", val)} 
                trackColor={{ false: "#d1d5db", true: t.primary }}
              />
            </SettingRow>
          </View>
        </View>

        {/* Support */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: t.primary }]}>Support</Text>
          <View style={[s.card, { backgroundColor: t.isDark ? t.bgCard : "#fff" }]}>
            <SettingRow icon="💬" label="Contact Us" onPress={() => Alert.alert("Contact Us", "Reach us at support@motoriq.lk")} />
            <SettingRow icon="⭐" label="Rate the App" onPress={() => Alert.alert("Coming Soon", "App Store rating will be available after release.")} />
          </View>
        </View>

        {/* Account Actions */}
        <View style={s.section}>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutBtnText}>Logout Account</Text>
          </TouchableOpacity>
          <Text style={s.version}>MotorIQ Version 1.1.0 (Sync v2)</Text>
        </View>
      </ScrollView>

      <BottomBar activeRoute="/settings" />
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, fontWeight: "700" },
  headerTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },

  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", marginBottom: 10, letterSpacing: 1, marginLeft: 4 },
  card: { borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  iconText: { fontSize: 18 },
  rowLabel: { fontSize: 15, fontWeight: "700" },
  rowSub: { fontSize: 12, marginTop: 2 },

  logoutBtn: { backgroundColor: "#fee2e2", paddingVertical: 16, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#fecaca" },
  logoutBtnText: { color: "#ef4444", fontWeight: "800", fontSize: 15 },
  version: { textAlign: "center", color: "#9ca3af", fontSize: 12, marginTop: 16, fontWeight: "500" },
});
