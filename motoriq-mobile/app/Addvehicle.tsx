import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import API from "../src/services/api";
import { sriLanka } from "../src/data/sriLankaLocations";
import { brandAndModels } from "../src/data/brandAndModels";
import BottomBar from "../src/components/BottomBar";

// ─── Bottom-sheet picker ──────────────────────────────────────────────────────
function PickerModal({ visible, title, options, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.modalOverlay}>
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={s.modalOption} onPress={() => { onSelect(""); onClose(); }}>
              <Text style={[s.modalOptionText, { color: "#9ca3af" }]}>— None —</Text>
            </TouchableOpacity>
            {options.map((opt) => (
              <TouchableOpacity key={opt} style={s.modalOption} onPress={() => { onSelect(opt); onClose(); }}>
                <Text style={s.modalOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={s.modalClose} onPress={onClose}>
            <Text style={s.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Select button (replaces <select>) ───────────────────────────────────────
function SelectBtn({ value, placeholder, onPress, required }) {
  const isEmpty = !value;
  return (
    <TouchableOpacity style={[s.selectBtn, isEmpty && required && s.selectBtnRequired]} onPress={onPress}>
      <Text style={[s.selectBtnText, isEmpty && { color: "#9ca3af" }]} numberOfLines={1}>
        {value || placeholder}
      </Text>
      <Text style={s.selectArrow}>▼</Text>
    </TouchableOpacity>
  );
}

// ─── Labelled text input ──────────────────────────────────────────────────────
function Field({ label, value, onChangeText, keyboardType = "default", multiline, numberOfLines, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.fieldWrap, focused && s.fieldWrapFocused]}>
      <Text style={s.fieldLabel}>{label}{required && <Text style={{ color: "#ff6600" }}> *</Text>}</Text>
      <TextInput
        style={[s.fieldInput, multiline && { height: numberOfLines ? numberOfLines * 22 : 80, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
      />
    </View>
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

// ─── Checkbox chip ────────────────────────────────────────────────────────────
function OptionChip({ label, checked, onToggle }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[s.chip, checked && s.chipActive]}
    >
      <Text style={[s.chipText, checked && s.chipTextActive]}>
        {checked ? "✓ " : ""}{label}
      </Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function AddVehicle() {
  const router = useRouter();

  // ── Location ──
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState(10);

  // ── Form ──
  const [form, setForm] = useState({
    vehicleType: "",
    condition: "",
    brand: "",
    model: "",
    manufacturedYear: "",
    registeredYear: "",
    maintenanceLevel: "",
    maintenancePeriod: "",
    price: "",
    transmission: "",
    fuelType: "",
    engineCapacity: "",
    mileage: "",
    additionalInfo: "",
  });
  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // ── Options ──
  const [generalOptions, setGeneralOptions] = useState([]);
  const [safetyOptions, setSafetyOptions] = useState([]);
  const [techOptions, setTechOptions] = useState([]);

  const generalList = ["Air Conditioning", "Power Steering", "Power Windows", "Leather Seats", "Alloy Wheels", "Sunroof", "Rear Camera", "Parking Sensors"];
  const safetyList = ["ABS", "Airbags", "Traction Control", "Lane Assist", "Blind Spot Monitor", "Stability Control", "Collision Warning"];
  const techList = ["Bluetooth", "Apple CarPlay", "Android Auto", "Touch Screen", "Navigation System", "Keyless Start", "Digital Dashboard"];

  const toggleOption = (list, setter, value) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  // ── Images ──
  const [images, setImages] = useState([]); // { uri, fileName }
  const MAX_IMAGES = 5;

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Limit reached", "Maximum 5 images allowed.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - images.length,
    });
    if (!result.canceled) {
      const newImgs = result.assets.map((a) => ({ uri: a.uri, fileName: a.fileName || `photo_${Date.now()}.jpg` }));
      setImages((prev) => [...prev, ...newImgs].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index, dir) => {
    const updated = [...images];
    const target = index + dir;
    if (target < 0 || target >= updated.length) return;
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setImages(updated);
  };

  // ── Loading / picker ──
  const [loading, setLoading] = useState(false);
  const [activePicker, setActivePicker] = useState(null);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return router.push("/login");

    if (!province || !district || !city) {
      return Alert.alert("Location required", "Please select Province, District and City.");
    }
    if (!form.vehicleType || !form.condition || !form.brand || !form.model || !form.price || !form.manufacturedYear) {
      return Alert.alert("Required fields", "Please fill in all required fields.");
    }

    setLoading(true);

    try {
      const data = new FormData();

      data.append("province", province);
      data.append("district", district);
      data.append("city", city);
      data.append("address", address);
      data.append("radius", String(radius));

      Object.keys(form).forEach((key) => data.append(key, form[key]));

      data.append("options", generalOptions.join(", "));
      data.append("safetyOptions", safetyOptions.join(", "));
      data.append("techOptions", techOptions.join(", "));

      images.forEach((img) => {
        data.append("images", {
          uri: img.uri,
          name: img.fileName,
          type: "image/jpeg",
        });
      });

      await API.post("/vehicles", data, {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      });

      Alert.alert("Success 🎉", "Vehicle posted successfully!", [
        { text: "OK", onPress: () => router.replace("/home") },
      ]);
    } catch {
      Alert.alert("Error", "Failed to post vehicle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Picker data ───────────────────────────────────────────────────────────
  const pickerData = {
    province: Object.keys(sriLanka),
    district: province ? Object.keys(sriLanka[province] || {}) : [],
    city: province && district ? (sriLanka[province]?.[district] || []) : [],
    vehicleType: ["SUV", "Sedan", "Hatchback", "Pickup", "Van", "Hybrid", "Electric"],
    condition: ["Brand New", "Used", "Reconditioned"],
    brand: Object.keys(brandAndModels),
    model: form.brand ? brandAndModels[form.brand] : [],
    maintenanceLevel: [
      "low — Service Cost ~Rs. 25,000–30,000",
      "medium — Service Cost ~Rs. 30,000–50,000",
      "high — Service Cost ~Rs. 50,000–100,000",
    ],
    maintenancePeriod: ["3 months", "6 months", "1 year"],
    transmission: ["Automatic", "Manual", "CVT"],
    fuelType: ["Petrol", "Diesel", "Hybrid", "Electric"],
  };

  // Map display label → stored value for maintenanceLevel
  const maintenanceLevelValue = (label) => label?.split(" —")[0] ?? label;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>

      {/* ── Active picker modal ── */}
      {activePicker && (
        <PickerModal
          visible
          title={activePicker.charAt(0).toUpperCase() + activePicker.slice(1)}
          options={pickerData[activePicker] || []}
          onSelect={(val) => {
            if (activePicker === "province") { setProvince(val); setDistrict(""); setCity(""); }
            else if (activePicker === "district") { setDistrict(val); setCity(""); }
            else if (activePicker === "city") setCity(val);
            else if (activePicker === "brand") setForm((p) => ({ ...p, brand: val, model: "" }));
            else if (activePicker === "maintenanceLevel") setField("maintenanceLevel", maintenanceLevelValue(val));
            else setField(activePicker, val);
          }}
          onClose={() => setActivePicker(null)}
        />
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ══ HERO HEADER ════════════════════════════════════════════════ */}
          <View style={s.hero}>
            <View style={s.blob1} />
            <View style={s.blob2} />
            <Text style={s.heroTitle}>Post New Vehicle 🚗</Text>
            <Text style={s.heroSub}>Fill in the details to list your vehicle</Text>
          </View>

          <View style={s.formBody}>

            {/* ══ LOCATION ═══════════════════════════════════════════════ */}
            <View style={s.card}>
              <SectionHeader emoji="📍" title="Location" />

              <View style={s.row}>
                <SelectBtn value={province} placeholder="Province *" required onPress={() => setActivePicker("province")} />
                <SelectBtn value={district} placeholder="District *" required onPress={() => province && setActivePicker("district")} />
              </View>
              <SelectBtn value={city} placeholder="City *" required onPress={() => district && setActivePicker("city")} />

              <View style={{ marginTop: 10 }}>
                <Field label="Street Address" value={address} onChangeText={setAddress} />
              </View>

              {/* Radius pips */}
              <Text style={s.pipLabel}>Search Radius: {radius} km</Text>
              <View style={s.pipRow}>
                {[5, 10, 25, 50, 75, 100].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setRadius(val)}
                    style={[s.pip, radius === val && s.pipActive]}
                  >
                    <Text style={[s.pipText, radius === val && s.pipTextActive]}>{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ══ VEHICLE DETAILS ════════════════════════════════════════ */}
            <View style={s.card}>
              <SectionHeader emoji="🚙" title="Vehicle Details" />

              <View style={s.row}>
                <SelectBtn value={form.vehicleType} placeholder="Vehicle Type *" required onPress={() => setActivePicker("vehicleType")} />
                <SelectBtn value={form.condition} placeholder="Condition *" required onPress={() => setActivePicker("condition")} />
              </View>

              <View style={s.row}>
                <SelectBtn value={form.brand} placeholder="Brand *" required onPress={() => setActivePicker("brand")} />
                <SelectBtn value={form.model} placeholder="Model *" required onPress={() => form.brand && setActivePicker("model")} />
              </View>

              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Field label="Manufactured Year *" value={form.manufacturedYear} onChangeText={(v) => setField("manufacturedYear", v)} keyboardType="numeric" required />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Registered Year" value={form.registeredYear} onChangeText={(v) => setField("registeredYear", v)} keyboardType="numeric" />
                </View>
              </View>

              <View style={s.row}>
                <SelectBtn
                  value={form.maintenanceLevel ? `${form.maintenanceLevel.charAt(0).toUpperCase() + form.maintenanceLevel.slice(1)} maintenance` : ""}
                  placeholder="Maintenance Level *"
                  required
                  onPress={() => setActivePicker("maintenanceLevel")}
                />
                <SelectBtn value={form.maintenancePeriod} placeholder="Maintenance Period *" required onPress={() => setActivePicker("maintenancePeriod")} />
              </View>

              <Field label="Price (Rs.) *" value={form.price} onChangeText={(v) => setField("price", v)} keyboardType="numeric" required />

              <View style={s.row}>
                <SelectBtn value={form.transmission} placeholder="Transmission" onPress={() => setActivePicker("transmission")} />
                <SelectBtn value={form.fuelType} placeholder="Fuel Type" onPress={() => setActivePicker("fuelType")} />
              </View>

              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Field label="Engine Capacity (cc)" value={form.engineCapacity} onChangeText={(v) => setField("engineCapacity", v)} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Mileage (km)" value={form.mileage} onChangeText={(v) => setField("mileage", v)} keyboardType="numeric" />
                </View>
              </View>
            </View>

            {/* ══ GENERAL OPTIONS ════════════════════════════════════════ */}
            <View style={s.card}>
              <SectionHeader emoji="⚙️" title="General Options" />
              <View style={s.chipGrid}>
                {generalList.map((opt) => (
                  <OptionChip
                    key={opt} label={opt}
                    checked={generalOptions.includes(opt)}
                    onToggle={() => toggleOption(generalOptions, setGeneralOptions, opt)}
                  />
                ))}
              </View>
            </View>

            {/* ══ SAFETY OPTIONS ═════════════════════════════════════════ */}
            <View style={s.card}>
              <SectionHeader emoji="🛡️" title="Safety Options" />
              <View style={s.chipGrid}>
                {safetyList.map((opt) => (
                  <OptionChip
                    key={opt} label={opt}
                    checked={safetyOptions.includes(opt)}
                    onToggle={() => toggleOption(safetyOptions, setSafetyOptions, opt)}
                  />
                ))}
              </View>
            </View>

            {/* ══ TECH OPTIONS ═══════════════════════════════════════════ */}
            <View style={s.card}>
              <SectionHeader emoji="📱" title="Tech Options" />
              <View style={s.chipGrid}>
                {techList.map((opt) => (
                  <OptionChip
                    key={opt} label={opt}
                    checked={techOptions.includes(opt)}
                    onToggle={() => toggleOption(techOptions, setTechOptions, opt)}
                  />
                ))}
              </View>
            </View>

            {/* ══ ADDITIONAL INFO ════════════════════════════════════════ */}
            <View style={s.card}>
              <SectionHeader emoji="📝" title="Additional Information" />
              <Field
                label="Describe your vehicle..."
                value={form.additionalInfo}
                onChangeText={(v) => setField("additionalInfo", v)}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* ══ IMAGE UPLOAD ═══════════════════════════════════════════ */}
            <View style={s.card}>
              <SectionHeader emoji="📸" title="Vehicle Photos" />
              <Text style={s.imageSubtitle}>
                Add up to 5 photos. The first image will be the primary listing photo.
              </Text>

              {/* Image grid */}
              {images.length > 0 && (
                <View style={s.imageGrid}>
                  {images.map((img, index) => (
                    <View key={index} style={s.imageItem}>
                      <Image source={{ uri: img.uri }} style={s.imageThumbnail} />

                      {/* Primary badge */}
                      {index === 0 && (
                        <View style={s.primaryBadge}>
                          <Text style={s.primaryBadgeText}>Primary</Text>
                        </View>
                      )}

                      {/* Delete */}
                      <TouchableOpacity style={s.deleteBtn} onPress={() => removeImage(index)}>
                        <Text style={s.deleteBtnText}>✕</Text>
                      </TouchableOpacity>

                      {/* Move arrows */}
                      <View style={s.moveRow}>
                        <TouchableOpacity
                          onPress={() => moveImage(index, -1)}
                          disabled={index === 0}
                          style={[s.moveBtn, index === 0 && s.moveBtnDisabled]}
                        >
                          <Text style={s.moveBtnText}>←</Text>
                        </TouchableOpacity>
                        <Text style={s.imageIndexText}>{index + 1}</Text>
                        <TouchableOpacity
                          onPress={() => moveImage(index, 1)}
                          disabled={index === images.length - 1}
                          style={[s.moveBtn, index === images.length - 1 && s.moveBtnDisabled]}
                        >
                          <Text style={s.moveBtnText}>→</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Pick button */}
              <TouchableOpacity
                style={[s.pickImageBtn, images.length >= MAX_IMAGES && s.pickImageBtnDisabled]}
                onPress={pickImages}
                disabled={images.length >= MAX_IMAGES}
              >
                <Text style={s.pickImageIcon}>📁</Text>
                <Text style={s.pickImageText}>
                  {images.length >= MAX_IMAGES
                    ? "Maximum images reached"
                    : `Choose Photos (${images.length}/${MAX_IMAGES})`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ══ SUBMIT ═════════════════════════════════════════════════ */}
            <TouchableOpacity
              style={[s.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <ActivityIndicator color="#fff" />
                  <Text style={s.submitBtnText}>Posting...</Text>
                </View>
              ) : (
                <Text style={s.submitBtnText}>Submit Vehicle 🚀</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ══ BOTTOM BAR ══════════════════════════════════════════════════════ */}
      <BottomBar activeRoute="/add-vehicle" />

    </View>
  );
}

const MAX_IMAGES = 5;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // Hero
  hero: {
    backgroundColor: "#111",
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 32,
    paddingHorizontal: 20,
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
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: "#ff6600", opacity: 0.1,
  },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  heroSub: { color: "#9ca3af", marginTop: 6, fontSize: 13 },

  // Form body
  formBody: { padding: 16, gap: 14 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 2,
  },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  sectionEmoji: { fontSize: 18, marginRight: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#111", letterSpacing: -0.3 },

  // Row
  row: { flexDirection: "row", gap: 8, marginBottom: 10 },

  // Select button
  selectBtn: {
    flex: 1,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1.5, borderColor: "#e5e7eb",
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13,
    backgroundColor: "#f9fafb",
  },
  selectBtnRequired: { borderColor: "#fcd34d" },
  selectBtnText: { fontSize: 13, color: "#111", flex: 1 },
  selectArrow: { color: "#9ca3af", fontSize: 10, marginLeft: 4 },

  // Field
  fieldWrap: {
    borderWidth: 1.5, borderColor: "#e5e7eb",
    borderRadius: 12, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6,
    backgroundColor: "#f9fafb", marginBottom: 10,
  },
  fieldWrapFocused: { borderColor: "#ff6600", backgroundColor: "#fff" },
  fieldLabel: { fontSize: 10, fontWeight: "700", color: "#9ca3af", marginBottom: 2, letterSpacing: 0.3, textTransform: "uppercase" },
  fieldInput: { fontSize: 14, color: "#111", paddingVertical: 2 },

  // Radius pips
  pipLabel: { fontSize: 12, fontWeight: "700", color: "#6b7280", marginTop: 10, marginBottom: 8 },
  pipRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  pip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: "#e5e7eb", backgroundColor: "#f9fafb",
  },
  pipActive: { backgroundColor: "#ff6600", borderColor: "#ff6600" },
  pipText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  pipTextActive: { color: "#fff" },

  // Option chips
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  chipActive: { backgroundColor: "#fff3eb", borderColor: "#ff6600" },
  chipText: { fontSize: 12, color: "#374151", fontWeight: "500" },
  chipTextActive: { color: "#ff6600", fontWeight: "700" },

  // Image subtitle
  imageSubtitle: { fontSize: 12, color: "#9ca3af", marginBottom: 14, lineHeight: 18 },

  // Image grid
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  imageItem: {
    width: "30%",
    borderRadius: 12, overflow: "hidden",
    borderWidth: 2, borderColor: "#e5e7eb",
    position: "relative",
  },
  imageThumbnail: { width: "100%", height: 90 },
  primaryBadge: {
    position: "absolute", top: 5, left: 5,
    backgroundColor: "#16a34a", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  primaryBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  deleteBtn: {
    position: "absolute", top: 5, right: 5,
    backgroundColor: "#ef4444", borderRadius: 10,
    width: 20, height: 20, alignItems: "center", justifyContent: "center",
  },
  deleteBtnText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  moveRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 6, paddingVertical: 4,
  },
  moveBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  moveBtnDisabled: { backgroundColor: "rgba(255,255,255,0.3)" },
  moveBtnText: { fontSize: 11, fontWeight: "800", color: "#111" },
  imageIndexText: { fontSize: 10, color: "#fff", fontWeight: "700" },

  // Pick image button
  pickImageBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderWidth: 2, borderStyle: "dashed", borderColor: "#d1d5db",
    borderRadius: 14, paddingVertical: 16,
    backgroundColor: "#f9fafb",
  },
  pickImageBtnDisabled: { opacity: 0.5 },
  pickImageIcon: { fontSize: 20 },
  pickImageText: { fontSize: 13, fontWeight: "600", color: "#374151" },

  // Submit
  submitBtn: {
    backgroundColor: "#ff6600",
    borderRadius: 16, paddingVertical: 18,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#ff6600", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    marginTop: 6,
  },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },

  // Modal
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