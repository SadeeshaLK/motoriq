import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  StyleSheet,
  Platform,
} from "react-native";
import API from "../src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import VehicleCard from "../src/components/VehicleCard";
import { sriLanka } from "../src/data/sriLankaLocations";
import { brandAndModels } from "../src/data/brandAndModels";
import BottomBar from "../src/components/BottomBar"; // ← adjust path to match your project

const { width } = Dimensions.get("window");

// ─── Picker Modal ─────────────────────────────────────────────────────────────
function PickerModal({ visible, title, options, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView>
            <TouchableOpacity style={styles.modalOption} onPress={() => { onSelect(""); onClose(); }}>
              <Text style={styles.modalOptionText}>All / Any</Text>
            </TouchableOpacity>
            {options.map((opt) => (
              <TouchableOpacity key={opt} style={styles.modalOption} onPress={() => { onSelect(opt); onClose(); }}>
                <Text style={styles.modalOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── SelectButton ─────────────────────────────────────────────────────────────
function SelectButton({ value, placeholder, onPress }) {
  return (
    <TouchableOpacity style={styles.selectBtn} onPress={onPress}>
      <Text style={[styles.selectBtnText, !value && { color: "#9ca3af" }]}>{value || placeholder}</Text>
      <Text style={{ color: "#9ca3af", fontSize: 10 }}>▼</Text>
    </TouchableOpacity>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState([]);
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [error, setError] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [activePicker, setActivePicker] = useState(null);

  const [filters, setFilters] = useState({
    brand: "", model: "", vehicleType: "", fuelType: "",
    condition: "", transmission: "", province: "", district: "", city: "",
    maxPrice: "", minPrice: "", maxMileage: "", minMileage: "",
    minYear: 2000, maxYear: new Date().getFullYear(),
    maintenanceLevel: "", monthlyBudget: 50000, radius: 10,
  });

  const setFilter = (key, val) => setFilters((prev) => ({ ...prev, [key]: val }));

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/vehicles/search", { params: filters });
      if (res.data && res.data.length > 0) {
        setVehicles(res.data);
      } else {
        throw new Error("No data");
      }
    } catch {
      setError("Server error. Showing demo data.");
      setVehicles([
        { _id: "1", brand: "Toyota", model: "Prius", manufacturedYear: 2015, price: 8500000, mileage: 90000, fuelType: "hybrid", transmission: "auto", trustScore: 85, estimatedMonthly: 42000, images: [] },
        { _id: "2", brand: "Honda", model: "Civic", manufacturedYear: 2018, price: 12000000, mileage: 60000, fuelType: "petrol", transmission: "auto", trustScore: 90, estimatedMonthly: 58000, images: [] },
        { _id: "3", brand: "Suzuki", model: "Alto", manufacturedYear: 2020, price: 5200000, mileage: 30000, fuelType: "petrol", transmission: "auto", trustScore: 78, estimatedMonthly: 26000, images: [] },
        { _id: "4", brand: "Nissan", model: "Leaf", manufacturedYear: 2019, price: 9800000, mileage: 45000, fuelType: "electric", transmission: "auto", trustScore: 92, estimatedMonthly: 48000, images: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, [filters]);

  let filteredVehicles = vehicles.filter((v) => {
    if (category !== "All") {
      if (category === "Hybrid" && v.fuelType?.toLowerCase() !== "hybrid") return false;
      if (category === "Electric" && v.fuelType?.toLowerCase() !== "electric") return false;
      if (!["Hybrid", "Electric"].includes(category) && v.vehicleType?.toLowerCase() !== category.toLowerCase()) return false;
    }
    if (filters.minPrice && v.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && v.price > Number(filters.maxPrice)) return false;
    if (filters.minMileage && v.mileage < Number(filters.minMileage)) return false;
    if (filters.maxMileage && v.mileage > Number(filters.maxMileage)) return false;
    if (filters.minYear && v.manufacturedYear < Number(filters.minYear)) return false;
    if (filters.maxYear && v.manufacturedYear > Number(filters.maxYear)) return false;
    return true;
  });

  let sorted = [...filteredVehicles];
  switch (sortBy) {
    case "priceLow":      sorted.sort((a, b) => a.price - b.price); break;
    case "priceHigh":     sorted.sort((a, b) => b.price - a.price); break;
    case "yearNew":       sorted.sort((a, b) => b.manufacturedYear - a.manufacturedYear); break;
    case "mileageLow":    sorted.sort((a, b) => a.mileage - b.mileage); break;
    case "trustScore":    sorted.sort((a, b) => b.trustScore - a.trustScore); break;
    case "lowestMonthly": sorted.sort((a, b) => a.estimatedMonthly - b.estimatedMonthly); break;
    case "bestValue":     sorted.sort((a, b) => (b.trustScore / b.price) - (a.trustScore / a.price)); break;
    default: break;
  }

  const PAGE_SIZE = 10;
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const addToCompare = (v) => {
    if (compareList.length >= 3 || compareList.find((c) => c._id === v._id)) return;
    setCompareList((prev) => [...prev, v]);
  };
  const removeFromCompare = (id) => setCompareList((prev) => prev.filter((v) => v._id !== id));

  const pickerMap = {
    brand: Object.keys(brandAndModels),
    model: filters.brand ? brandAndModels[filters.brand] : [],
    vehicleType: ["SUV", "Sedan", "Hatchback", "Pickup", "Van", "Hybrid", "Electric"],
    fuelType: ["Petrol", "Diesel", "Hybrid", "Electric"],
    condition: ["Brand New", "Used", "Reconditioned"],
    transmission: ["Automatic", "Manual", "CVT"],
    province: Object.keys(sriLanka),
    district: filters.province ? Object.keys(sriLanka[filters.province] || {}) : [],
    city: filters.district && filters.province ? (sriLanka[filters.province]?.[filters.district] || []) : [],
    maintenanceLevel: ["Low", "Medium", "High"],
    sortBy: [
      { label: "Best Value", value: "bestValue" },
      { label: "Lowest Monthly", value: "lowestMonthly" },
      { label: "Highest Trust Score", value: "trustScore" },
      { label: "Price: Low → High", value: "priceLow" },
      { label: "Price: High → Low", value: "priceHigh" },
      { label: "Year: Newest", value: "yearNew" },
      { label: "Mileage: Low → High", value: "mileageLow" },
    ],
  };

  // Extra bottom padding: compare bar (when visible) + bottom bar height
  const listBottomPad = compareList.length > 0 ? 210 : 120;

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>

      {/* ── Pickers ── */}
      {activePicker && activePicker !== "sortBy" && (
        <PickerModal
          visible
          title={activePicker.charAt(0).toUpperCase() + activePicker.slice(1)}
          options={pickerMap[activePicker] || []}
          onSelect={(val) => {
            if (activePicker === "brand") setFilters((p) => ({ ...p, brand: val, model: "" }));
            else if (activePicker === "province") setFilters((p) => ({ ...p, province: val, district: "", city: "" }));
            else if (activePicker === "district") setFilters((p) => ({ ...p, district: val, city: "" }));
            else setFilter(activePicker, val);
          }}
          onClose={() => setActivePicker(null)}
        />
      )}
      {activePicker === "sortBy" && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Sort By</Text>
              <ScrollView>
                <TouchableOpacity style={styles.modalOption} onPress={() => { setSortBy(""); setActivePicker(null); }}>
                  <Text style={styles.modalOptionText}>Default</Text>
                </TouchableOpacity>
                {pickerMap.sortBy.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.modalOption, sortBy === item.value && { backgroundColor: "#fff3eb" }]}
                    onPress={() => { setSortBy(item.value); setActivePicker(null); }}
                  >
                    <Text style={[styles.modalOptionText, sortBy === item.value && { color: "#ff6600", fontWeight: "700" }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalClose} onPress={() => setActivePicker(null)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ── FlatList ── */}
      <FlatList
        data={paginated}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: listBottomPad }}
        ListHeaderComponent={() => (
          <View>
            {/* Hero */}
            <View style={styles.hero}>
              <View style={styles.heroBlobTop} />
              <View style={styles.heroBlobBottom} />
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Find Your{"\n"}Perfect Car 🚗</Text>
                <Text style={styles.heroSub}>AI-powered recommendations based on{"\n"}price, fuel, maintenance & trust.</Text>
              </View>

              {/* Filter card */}
              <View style={styles.filterCard}>
                <Text style={styles.filterSectionTitle}>Basic Filters</Text>
                <View style={styles.row}>
                  <SelectButton value={filters.brand} placeholder="Brand" onPress={() => setActivePicker("brand")} />
                  <SelectButton value={filters.model} placeholder="Model" onPress={() => filters.brand && setActivePicker("model")} />
                </View>
                <SelectButton value={filters.vehicleType} placeholder="Vehicle Type" onPress={() => setActivePicker("vehicleType")} />

                <TouchableOpacity onPress={() => setShowAdvanced(!showAdvanced)} style={styles.advancedToggle}>
                  <Text style={styles.advancedToggleText}>{showAdvanced ? "▲ Hide Advanced Filters" : "▼ Show Advanced Filters"}</Text>
                </TouchableOpacity>

                {showAdvanced && (
                  <View style={styles.advancedBlock}>
                    <Text style={styles.filterGroupTitle}>📍 Location</Text>
                    <View style={styles.row}>
                      <SelectButton value={filters.province} placeholder="Province" onPress={() => setActivePicker("province")} />
                      <SelectButton value={filters.district} placeholder="District" onPress={() => filters.province && setActivePicker("district")} />
                    </View>
                    <SelectButton value={filters.city} placeholder="City" onPress={() => filters.district && setActivePicker("city")} />

                    <Text style={[styles.filterGroupTitle, { marginTop: 16 }]}>🚙 Vehicle Details</Text>
                    <View style={styles.row}>
                      <SelectButton value={filters.condition} placeholder="Condition" onPress={() => setActivePicker("condition")} />
                      <SelectButton value={filters.transmission} placeholder="Transmission" onPress={() => setActivePicker("transmission")} />
                    </View>
                    <SelectButton value={filters.fuelType} placeholder="Fuel Type" onPress={() => setActivePicker("fuelType")} />

                    <Text style={[styles.filterGroupTitle, { marginTop: 16 }]}>📅 Model Year</Text>
                    <View style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rangeLabel}>From: {filters.minYear}</Text>
                        <TextInput style={styles.numInput} keyboardType="numeric" placeholder="Min Year" value={String(filters.minYear)} onChangeText={(v) => setFilter("minYear", v)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rangeLabel}>To: {filters.maxYear}</Text>
                        <TextInput style={styles.numInput} keyboardType="numeric" placeholder="Max Year" value={String(filters.maxYear)} onChangeText={(v) => setFilter("maxYear", v)} />
                      </View>
                    </View>

                    <Text style={[styles.filterGroupTitle, { marginTop: 16 }]}>💰 Price (LKR)</Text>
                    <View style={styles.row}>
                      <TextInput style={[styles.numInput, { flex: 1 }]} keyboardType="numeric" placeholder="Min Price" onChangeText={(v) => setFilter("minPrice", v)} />
                      <TextInput style={[styles.numInput, { flex: 1 }]} keyboardType="numeric" placeholder="Max Price" onChangeText={(v) => setFilter("maxPrice", v)} />
                    </View>

                    <Text style={[styles.filterGroupTitle, { marginTop: 16 }]}>🛣️ Mileage (km)</Text>
                    <View style={styles.row}>
                      <TextInput style={[styles.numInput, { flex: 1 }]} keyboardType="numeric" placeholder="Min Mileage" onChangeText={(v) => setFilter("minMileage", v)} />
                      <TextInput style={[styles.numInput, { flex: 1 }]} keyboardType="numeric" placeholder="Max Mileage" onChangeText={(v) => setFilter("maxMileage", v)} />
                    </View>

                    <Text style={[styles.filterGroupTitle, { marginTop: 16 }]}>
                      📆 Monthly Budget: LKR {Number(filters.monthlyBudget).toLocaleString()}
                    </Text>
                    <View style={styles.sliderTrack}>
                      {[20000, 50000, 80000, 120000, 160000, 200000].map((val) => (
                        <TouchableOpacity key={val} onPress={() => setFilter("monthlyBudget", val)}
                          style={[styles.sliderPip, filters.monthlyBudget >= val && styles.sliderPipActive]}>
                          <Text style={[styles.sliderPipText, filters.monthlyBudget >= val && { color: "#fff" }]}>
                            {val >= 1000 ? `${val / 1000}k` : val}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.filterGroupTitle, { marginTop: 16 }]}>📡 Search Radius: {filters.radius} km</Text>
                    <View style={styles.sliderTrack}>
                      {[5, 10, 25, 50, 75, 100].map((val) => (
                        <TouchableOpacity key={val} onPress={() => setFilter("radius", val)}
                          style={[styles.sliderPip, filters.radius >= val && styles.sliderPipActive]}>
                          <Text style={[styles.sliderPipText, filters.radius >= val && { color: "#fff" }]}>{val}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.filterGroupTitle, { marginTop: 16 }]}>🔧 Maintenance Level</Text>
                    <SelectButton value={filters.maintenanceLevel} placeholder="Any Maintenance Level" onPress={() => setActivePicker("maintenanceLevel")} />
                  </View>
                )}
              </View>
            </View>

            {/* Category chips + sort */}
            <View style={styles.chipsSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                {["All", "SUV", "Sedan", "Hatchback", "Hybrid", "Electric"].map((cat) => (
                  <TouchableOpacity key={cat} onPress={() => { setCategory(cat); setPage(1); }}
                    style={[styles.chip, category === cat && styles.chipActive]}>
                    <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity onPress={() => setActivePicker("sortBy")} style={styles.sortBtn}>
                <Text style={styles.sortBtnText}>
                  {sortBy ? pickerMap.sortBy.find((s) => s.value === sortBy)?.label : "Sort ↕"}
                </Text>
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}
            <Text style={styles.resultCount}>{sorted.length} vehicle{sorted.length !== 1 ? "s" : ""} found</Text>
          </View>
        )}

        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <VehicleCard vehicle={item} monthlyBudget={filters.monthlyBudget} addToCompare={addToCompare} />
          </View>
        )}

        ListEmptyComponent={() => !loading ? <Text style={styles.emptyText}>No vehicles found 🚗</Text> : null}

        ListFooterComponent={() =>
          loading ? (
            <ActivityIndicator size="large" color="#ff6600" style={{ marginVertical: 40 }} />
          ) : totalPages > 1 ? (
            <View style={styles.pagination}>
              <TouchableOpacity onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}>
                <Text style={styles.pageBtnText}>← Prev</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
              <TouchableOpacity onPress={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}>
                <Text style={styles.pageBtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* ── Compare bar — floats just above BottomBar ── */}
      {compareList.length > 0 && (
        <View style={styles.compareBar}>
          <Text style={styles.compareTitle}>Compare ({compareList.length}/3)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, marginHorizontal: 8 }}>
            {compareList.map((v) => (
              <View key={v._id} style={styles.compareChip}>
                <Text style={styles.compareChipText} numberOfLines={1}>{v.brand} {v.model}</Text>
                <TouchableOpacity onPress={() => removeFromCompare(v._id)}>
                  <Text style={styles.compareChipRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity 
            style={styles.compareBtn} 
            onPress={async () => {
              await AsyncStorage.setItem("compare_list", JSON.stringify(compareList));
              router.push("/compare");
            }}
          >
            <Text style={styles.compareBtnText}>Compare →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ══ BOTTOM BAR — replaces old FAB ════════════════════════════════════ */}
      <BottomBar activeRoute="/home" />

    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "#111",
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 24, overflow: "hidden",
  },
  heroBlobTop: {
    position: "absolute", top: -80, left: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: "#ff6600", opacity: 0.18,
  },
  heroBlobBottom: {
    position: "absolute", bottom: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "#ff6600", opacity: 0.10,
  },
  heroContent: { paddingHorizontal: 20, marginBottom: 20 },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "800", lineHeight: 34, letterSpacing: -0.5 },
  heroSub: { color: "#9ca3af", marginTop: 6, fontSize: 13, lineHeight: 19 },

  filterCard: {
    marginHorizontal: 16, backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 8,
  },
  filterSectionTitle: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 12 },
  filterGroupTitle: { fontSize: 12, fontWeight: "700", color: "#6b7280", marginBottom: 8 },
  row: { flexDirection: "row", gap: 8, marginBottom: 8 },
  selectBtn: {
    flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, backgroundColor: "#f9fafb",
  },
  selectBtnText: { fontSize: 13, color: "#111", flex: 1 },
  numInput: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#f9fafb", fontSize: 13, color: "#111",
  },
  rangeLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 4 },
  advancedToggle: {
    marginTop: 12, alignItems: "center", paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: "#f3f4f6",
  },
  advancedToggleText: { color: "#ff6600", fontWeight: "600", fontSize: 13 },
  advancedBlock: { marginTop: 8 },
  sliderTrack: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  sliderPip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: "#e5e7eb", backgroundColor: "#f9fafb",
  },
  sliderPipActive: { backgroundColor: "#ff6600", borderColor: "#ff6600" },
  sliderPipText: { fontSize: 11, color: "#374151", fontWeight: "600" },

  chipsSection: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
  },
  chip: { paddingVertical: 7, paddingHorizontal: 14, backgroundColor: "#f3f4f6", borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: "#ff6600" },
  chipText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  sortBtn: { paddingVertical: 7, paddingHorizontal: 12, backgroundColor: "#111", borderRadius: 10, marginLeft: 4 },
  sortBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  errorBanner: {
    backgroundColor: "#fff3eb", marginHorizontal: 16, marginTop: 10,
    padding: 10, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: "#ff6600",
  },
  errorText: { color: "#b45309", fontSize: 12 },
  emptyText: { textAlign: "center", marginTop: 60, color: "#9ca3af", fontSize: 16 },
  resultCount: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, color: "#6b7280", fontSize: 12, fontWeight: "600" },
  cardWrapper: { paddingHorizontal: 12, paddingVertical: 6 },

  pagination: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 20, paddingVertical: 24,
  },
  pageBtn: { backgroundColor: "#111", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  pageBtnDisabled: { backgroundColor: "#e5e7eb" },
  pageBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  pageInfo: { color: "#374151", fontWeight: "600", fontSize: 14 },

  // Sits above the bottom bar
  compareBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 108 : 96,
    left: 12, right: 12,
    backgroundColor: "#fff",
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: "row", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 10,
  },
  compareTitle: { fontSize: 12, fontWeight: "700", color: "#111" },
  compareChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff3eb", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, marginRight: 6,
  },
  compareChipText: { fontSize: 11, color: "#b45309", maxWidth: 80 },
  compareChipRemove: { color: "#ef4444", fontWeight: "700", marginLeft: 4, fontSize: 11 },
  compareBtn: { backgroundColor: "#ff6600", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  compareBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingBottom: 36, maxHeight: "75%",
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#e5e7eb", alignSelf: "center", marginTop: 12, marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#111", marginBottom: 12, textAlign: "center" },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  modalOptionText: { fontSize: 15, color: "#374151" },
  modalClose: { marginTop: 12, alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: 12, paddingVertical: 14 },
  modalCloseText: { color: "#374151", fontWeight: "700", fontSize: 14 },
});