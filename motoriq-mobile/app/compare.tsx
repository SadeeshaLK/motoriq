import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const BASE_URL = "https://motoriq-lk.onrender.com";

const buildImageUrl = (img) => {
  if (!img) return "https://via.placeholder.com/300";
  if (img.startsWith("http")) return img;
  const clean = img.startsWith("/") ? img.slice(1) : img;
  if (clean.startsWith("uploads/")) return `${BASE_URL}/${clean}`;
  return `${BASE_URL}/uploads/${clean}`;
};

export default function Compare() {
  const router = useRouter();
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openSpec, setOpenSpec] = useState({
    basic: true,
    performance: true,
    ai: true,
  });

  useEffect(() => {
    loadCompareData();
  }, []);

  const loadCompareData = async () => {
    try {
      const dataStr = await AsyncStorage.getItem("compare_list");
      if (dataStr) {
        setVehicles(JSON.parse(dataStr));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCompare = async (id) => {
    try {
      const updated = vehicles.filter((v) => v._id !== id);
      setVehicles(updated);
      await AsyncStorage.setItem("compare_list", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <View style={[s.container, s.centerAll]}>
        <ActivityIndicator size="large" color="#ff6600" />
      </View>
    );
  }

  if (vehicles.length === 0) {
    return (
      <View style={s.container}>
        <View style={s.hero}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.heroTitle}>Compare</Text>
        </View>
        <View style={s.emptyState}>
          <Text style={s.emptyText}>No vehicles selected for comparison</Text>
          <TouchableOpacity style={s.goHomeBtn} onPress={() => router.push("/home")}>
            <Text style={s.goHomeBtnText}>Go Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const bestPrice = Math.min(...vehicles.map((v) => v.price));
  const bestMileage = Math.min(...vehicles.map((v) => v.mileage));
  const bestTrust = Math.max(...vehicles.map((v) => v.trustScore || 0));

  const labelColWidth = 85;
  const valCellWidth = (width - 32 - labelColWidth) / vehicles.length;

  const row = (label, key, bestValue = null, suffix = "") => (
    <View style={s.row}>
      <View style={[s.labelCol, { width: labelColWidth }]}>
        <Text style={s.labelText}>{label}</Text>
      </View>
      {vehicles.map((v) => {
        const value = v[key] !== undefined && v[key] !== null && v[key] !== "" ? v[key] : "N/A";
        const highlight = bestValue !== null && value === bestValue;

        let displayValue = value;
        if (typeof value === "number") {
          displayValue = value.toLocaleString();
        }

        return (
          <View key={v._id} style={[s.valCell, { width: valCellWidth }]}>
            <Text style={[s.valText, highlight && s.valHighlight]}>
              {displayValue}{suffix}
            </Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.hero}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.heroTitle}>Compare Vehicles</Text>
        <Text style={s.heroSub}>See how your selections stack up against each other.</Text>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* VEHICLE HEADER IMAGES & BASIC INFO */}
        <View style={[s.row, { marginBottom: 20 }]}>
          <View style={[s.labelCol, { width: labelColWidth }]} />
          {vehicles.map((v) => (
            <View key={v._id} style={[s.carCard, { width: valCellWidth }]}>
              <TouchableOpacity onPress={() => removeFromCompare(v._id)} style={s.removeBtn}>
                <Text style={s.removeBtnText}>✕</Text>
              </TouchableOpacity>
              <Image source={{ uri: buildImageUrl(v.images?.[0]) }} style={s.carImage} />
              <Text style={s.carTitle} numberOfLines={2}>
                {v.brand} {v.model}
              </Text>
              <Text style={s.carPrice} numberOfLines={1}>LKR {v.price >= 100000 ? `${(v.price/100000).toFixed(1)}M` : v.price?.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* BASIC SPECS */}
        <View style={s.sectionCard}>
          <TouchableOpacity
            style={s.sectionHeader}
            onPress={() => setOpenSpec({ ...openSpec, basic: !openSpec.basic })}
          >
            <Text style={s.sectionTitle}>Basic Specifications</Text>
            <Text style={s.sectionIcon}>{openSpec.basic ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {openSpec.basic && (
            <View style={s.sectionBody}>
              {row("Price (LKR)", "price", bestPrice)}
              {row("Year", "manufacturedYear")}
              {row("Mileage", "mileage", bestMileage, " km")}
              {row("Fuel", "fuelType")}
              {row("Trans.", "transmission")}
            </View>
          )}
        </View>

        {/* PERFORMANCE */}
        <View style={s.sectionCard}>
          <TouchableOpacity
            style={s.sectionHeader}
            onPress={() => setOpenSpec({ ...openSpec, performance: !openSpec.performance })}
          >
            <Text style={s.sectionTitle}>Performance</Text>
            <Text style={s.sectionIcon}>{openSpec.performance ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {openSpec.performance && (
            <View style={s.sectionBody}>
              {row("Engine", "engineCapacity", null, " cc")}
              {row("Type", "vehicleType")}
              {row("Condition", "condition")}
            </View>
          )}
        </View>

        {/* AI ANALYSIS */}
        <View style={s.sectionCard}>
          <TouchableOpacity
            style={s.sectionHeader}
            onPress={() => setOpenSpec({ ...openSpec, ai: !openSpec.ai })}
          >
            <Text style={s.sectionTitle}>AI Analysis</Text>
            <Text style={s.sectionIcon}>{openSpec.ai ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {openSpec.ai && (
            <View style={s.sectionBody}>
              {row("Trust Score", "trustScore", bestTrust)}
              {row("Deal Score", "dealScore")}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  centerAll: {
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    backgroundColor: "#111",
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backBtn: { alignSelf: "flex-start", marginBottom: 16 },
  backBtnText: { color: "#ff6600", fontSize: 14, fontWeight: "700" },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  heroSub: { color: "#9ca3af", marginTop: 6, fontSize: 13 },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  emptyText: { color: "#6b7280", fontSize: 16, marginBottom: 20 },
  goHomeBtn: { backgroundColor: "#ff6600", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  goHomeBtnText: { color: "#fff", fontWeight: "700" },
  
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  labelCol: {
    justifyContent: "center",
    paddingVertical: 12,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b5563",
  },
  valCell: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderLeftColor: "#e5e7eb",
  },
  valText: {
    fontSize: 12,
    color: "#374151",
    textAlign: "center",
  },
  valHighlight: {
    color: "#16a34a",
    fontWeight: "800",
    fontSize: 13,
  },
  
  carCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    position: "relative",
    marginLeft: 4,
  },
  carImage: {
    width: "90%",
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    marginBottom: 6,
  },
  carTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginBottom: 4,
    height: 30, // reserved space for 2 lines
  },
  carPrice: {
    fontSize: 11,
    color: "#ea580c",
    fontWeight: "800",
    textAlign: "center",
  },
  removeBtn: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  removeBtnText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
  },
  sectionIcon: {
    fontSize: 12,
    color: "#9ca3af",
  },
  sectionBody: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
