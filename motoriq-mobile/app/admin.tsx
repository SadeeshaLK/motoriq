import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import API from "../src/services/api";

export default function AdminDashboard() {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [flaggedVehicles, setFlaggedVehicles] = useState([]);
  const [search, setSearch] = useState("");

  const [activeTab, setActiveTab] = useState("overview"); // overview, users, vehicles, flagged
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const t = await AsyncStorage.getItem("token");
    if (!t) {
      router.replace("/login");
      return;
    }
    setToken(t);
    await fetchAll(t);
    setLoading(false);
  };

  const fetchAll = async (t) => {
    await Promise.all([
      fetchStats(t),
      fetchUsers(t),
      fetchVehicles(t)
    ]);
  };

  const fetchStats = async (t) => {
    try {
      const res = await API.get("/admin/stats", { headers: { Authorization: t } });
      setStats(res.data);
    } catch (e) { console.log(e); }
  };

  const fetchUsers = async (t) => {
    try {
      const res = await API.get("/admin/users", { headers: { Authorization: t } });
      setUsers(res.data);
    } catch (e) { console.log(e); }
  };

  const fetchVehicles = async (t) => {
    try {
      const res = await API.get("/admin/vehicles", { headers: { Authorization: t } });
      setVehicles(res.data);
      detectFraud(res.data);
    } catch (e) { console.log(e); }
  };

  const detectFraud = (vehiclesList) => {
    const flagged = [];
    vehiclesList.forEach((vehicle, index) => {
      let reasons = [];
      if (vehicle.price < (vehicle.predictedPrice || 0) * 0.4) {
        reasons.push("Price too low");
      }
      const duplicate = vehiclesList.find(
        (v, i) => i !== index && v.user?._id && vehicle.user?._id && v.user?._id === vehicle.user?._id &&
          v.brand === vehicle.brand && v.model === vehicle.model &&
          v.manufacturedYear === vehicle.manufacturedYear &&
          Math.abs(v.price - vehicle.price) < 50000
      );
      if (duplicate) {
        reasons.push("Duplicate listing");
      }
      if (!vehicle.images || vehicle.images.length === 0) {
        reasons.push("No images");
      }
      if (reasons.length > 0) {
        flagged.push({ ...vehicle, reasons });
      }
    });
    setFlaggedVehicles(flagged);
  };

  const handleBanUser = (user) => {
    Alert.alert("Confirm Ban", `Ban ${user.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Ban", style: "destructive", onPress: async () => {
          try {
            await API.put(`/admin/users/ban/${user._id}`, {}, { headers: { Authorization: token } });
            Alert.alert("Success", "User banned/unbanned successfully");
            fetchUsers(token);
          } catch {
            Alert.alert("Error", "Failed to interact with user");
          }
      }}
    ]);
  };

  const handleDeleteUser = (id) => {
    Alert.alert("Confirm Delete", "Delete this user forever?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await API.delete(`/admin/users/${id}`, { headers: { Authorization: token } });
            setUsers(users.filter(u => u._id !== id));
            Alert.alert("Deleted");
          } catch {
            Alert.alert("Error", "Failed to delete user");
          }
      }}
    ]);
  };

  const handleDeleteVehicle = (id) => {
     Alert.alert("Confirm Delete", "Delete this vehicle forever?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await API.delete(`/admin/vehicles/${id}`, { headers: { Authorization: token } });
            setVehicles(vehicles.filter(v => v._id !== id));
            setFlaggedVehicles(flaggedVehicles.filter(v => v._id !== id));
            Alert.alert("Deleted");
          } catch {
             Alert.alert("Error", "Failed to delete vehicle");
          }
      }}
    ]);
  };

  const exportAlert = (type) => {
     Alert.alert("Export " + type, "CSV exporting relies heavily on the web browser. Please login via the desktop dashboard to export reports natively.");
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#ff6600" />
      </View>
    );
  }

  const filteredUsers = users.filter(u => 
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.container}>
      <View style={s.hero}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.heroTitle}>Admin Dashboard</Text>
        <Text style={s.heroSub}>Manage users, listings & platform integrity</Text>
      </View>

      <View style={s.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsInner}>
          {["overview", "users", "vehicles", "flagged"].map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[s.tabPill, activeTab === tab && s.tabPillActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab === "overview" && "📊 Overview"}
                {tab === "users" && "👥 Users"}
                {tab === "vehicles" && "🚗 Vehicles"}
                {tab === "flagged" && `🚨 Flagged (${flaggedVehicles.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={s.content}>

        {/* ================= OVERVIEW ================= */}
        {activeTab === "overview" && stats && (
          <View>
            <View style={s.statsGrid}>
              <View style={[s.statCard, { backgroundColor: "#3b82f6" }]}>
                <Text style={s.statLabel}>Total Users</Text>
                <Text style={s.statNumber}>{stats.totalUsers}</Text>
              </View>
              <View style={[s.statCard, { backgroundColor: "#10b981" }]}>
                <Text style={s.statLabel}>Total Vehicles</Text>
                <Text style={s.statNumber}>{stats.totalVehicles}</Text>
              </View>
              <View style={[s.statCard, { backgroundColor: "#ef4444" }]}>
                <Text style={s.statLabel}>Suspicious</Text>
                <Text style={s.statNumber}>{stats.suspiciousListings || flaggedVehicles.length}</Text>
              </View>
              <View style={[s.statCard, { backgroundColor: "#f59e0b" }]}>
                <Text style={s.statLabel}>Avg Price</Text>
                <Text style={s.statNumber}>LKR {Math.round(stats.averagePrice || 0).toLocaleString()}</Text>
              </View>
            </View>

            <Text style={s.sectionHeaderTitle}>Overview Controls</Text>
            <View style={s.actionGrid}>
              <TouchableOpacity style={s.actionBtn} onPress={() => fetchAll(token)}>
                <Text style={s.actionBtnText}>🔄 Refresh All Data</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: "#8b5cf6" }]} onPress={() => exportAlert("Users")}>
                <Text style={s.actionBtnText}>📥 Export Users</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: "#f97316" }]} onPress={() => exportAlert("Vehicles")}>
                <Text style={s.actionBtnText}>📥 Export Vehicles</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= USERS ================= */}
        {activeTab === "users" && (
          <View>
            <TextInput 
              style={s.searchInput}
              placeholder="Search users by name or email..."
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            
            {filteredUsers.map(u => (
              <View key={u._id} style={s.listItem}>
                <View style={s.listMeta}>
                  <Text style={s.listTitle}>{u.name || "Unknown"}</Text>
                  <Text style={s.listSubtitle}>{u.email}</Text>
                  <Text style={s.listDetails}>Join: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</Text>
                  <View style={s.badgeWrap}>
                     <View style={[s.badge, u.isBanned ? s.badgeRed : s.badgeGreen]}>
                        <Text style={[s.badgeText, u.isBanned ? s.badgeTextRed : s.badgeTextGreen]}>
                           {u.isBanned ? "Banned" : "Active"}
                        </Text>
                     </View>
                  </View>
                </View>
                <View style={s.listActionsCol}>
                  <TouchableOpacity style={[s.iconBtn, {marginBottom: 8}]} onPress={() => handleBanUser(u)}>
                    <Text style={s.iconBtnTextBan}>🚫 {u.isBanned ? "Unban" : "Ban"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.iconBtn} onPress={() => handleDeleteUser(u._id)}>
                    <Text style={s.iconBtnTextDelete}>🗑 Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= VEHICLES ================= */}
        {activeTab === "vehicles" && (
          <View>
            {vehicles.map(v => (
              <View key={v._id} style={s.listItem}>
                <View style={s.listMeta}>
                  <Text style={s.listTitle}>{v.brand} {v.model}</Text>
                  <Text style={s.listSubtitle}>LKR {v.price?.toLocaleString()} • {v.manufacturedYear}</Text>
                  <Text style={s.listDetails}>Seller: {v.user?.name || "Unknown"} ({v.user?.email || "N/A"})</Text>
                </View>
                <View style={s.listActionsCol}>
                  <TouchableOpacity style={[s.iconBtn, {marginBottom: 8}]} onPress={() => router.push(`/vehicle/${v._id}`)}>
                    <Text style={s.iconBtnTextView}>👁 View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.iconBtn} onPress={() => handleDeleteVehicle(v._id)}>
                    <Text style={s.iconBtnTextDelete}>🗑 Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= FLAGGED ================= */}
        {activeTab === "flagged" && (
          <View>
            {flaggedVehicles.length === 0 ? (
               <Text style={s.emptyFlagged}>No suspicious listings found ✅</Text>
            ) : flaggedVehicles.map(v => (
              <View key={v._id} style={[s.listItem, s.listItemFlagged]}>
                <View style={s.listMeta}>
                  <Text style={s.listTitle}>{v.brand} {v.model}</Text>
                  <Text style={s.listSubtitle}>LKR {v.price?.toLocaleString()}</Text>
                  <View style={s.reasonsWrap}>
                    {v.reasons.map((r, i) => (
                      <View key={i} style={[s.badge, s.badgeRed, { marginTop: 4, marginRight: 4 }]}>
                        <Text style={[s.badgeText, s.badgeTextRed]}>{r}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={s.listActionsCol}>
                  <TouchableOpacity style={[s.iconBtn, {marginBottom: 8}]} onPress={() => router.push(`/vehicle/${v._id}`)}>
                    <Text style={s.iconBtnTextView}>👁 View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.iconBtn} onPress={() => handleDeleteVehicle(v._id)}>
                    <Text style={s.iconBtnTextDelete}>🗑 Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  hero: {
    backgroundColor: "#111",
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 24, paddingHorizontal: 20,
  },
  backBtn: { alignSelf: "flex-start", marginBottom: 16 },
  backBtnText: { color: "#ff6600", fontSize: 14, fontWeight: "700" },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  heroSub: { color: "#9ca3af", marginTop: 6, fontSize: 13 },
  tabsWrap: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tabsInner: { paddingHorizontal: 16, paddingVertical: 12, alignItems: "center", gap: 8 },
  tabPill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#f3f4f6" },
  tabPillActive: { backgroundColor: "#2563eb" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#4b5563" },
  tabTextActive: { color: "#fff" },
  
  content: { padding: 16, paddingBottom: 100 },
  
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12, marginBottom: 20 },
  statCard: { width: "48%", padding: 16, borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  statLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  statNumber: { color: "#fff", fontSize: 22, fontWeight: "800" },
  
  sectionHeaderTitle: { fontSize: 16, fontWeight: "800", color: "#111", marginBottom: 12, marginTop: 10 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: { flexGrow: 1, backgroundColor: "#111", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  searchInput: { backgroundColor: "#fff", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 16, fontSize: 14 },

  listItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 12, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  listItemFlagged: { borderWidth: 1, borderColor: "#fca5a5", backgroundColor: "#fef2f2" },
  listMeta: { flex: 1, paddingRight: 10 },
  listTitle: { fontSize: 15, fontWeight: "800", color: "#111", marginBottom: 4 },
  listSubtitle: { fontSize: 13, color: "#4b5563", marginBottom: 4 },
  listDetails: { fontSize: 11, color: "#9ca3af", marginBottom: 6 },
  listActionsCol: { justifyContent: "center", alignItems: "flex-end" },

  iconBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#f3f4f6" },
  iconBtnTextView: { color: "#2563eb", fontWeight: "700", fontSize: 12 },
  iconBtnTextBan: { color: "#ca8a04", fontWeight: "700", fontSize: 12 },
  iconBtnTextDelete: { color: "#dc2626", fontWeight: "700", fontSize: 12 },

  badgeWrap: { flexDirection: "row" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeGreen: { backgroundColor: "#dcfce7" },
  badgeRed: { backgroundColor: "#fee2e2" },
  badgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  badgeTextGreen: { color: "#16a34a" },
  badgeTextRed: { color: "#dc2626" },

  reasonsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  emptyFlagged: { textAlign: "center", color: "#10b981", fontSize: 16, fontWeight: "700", marginTop: 40 }
});
