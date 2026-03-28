import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Linking,
  Share,
  ActivityIndicator,
  TextInput,
  FlatList,
  Dimensions,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../src/services/api";
import VehicleCard from "../../src/components/VehicleCard";
import BottomBar from "../../src/components/BottomBar";
import { calculateMonthlyCost } from "../../src/utils/calculateMonthlyCost";
import { LineChart } from "react-native-chart-kit";


const { width: SCREEN_W } = Dimensions.get("window");
const BASE_URL = "https://motoriq-lk.onrender.com";

// ─── helpers ──────────────────────────────────────────────────────────────────
const buildImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  const clean = img.startsWith("/") ? img.slice(1) : img;
  if (clean.startsWith("uploads/")) return `${BASE_URL}/${clean}`;
  return `${BASE_URL}/uploads/${clean}`;
};

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ emoji, title }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionEmoji}>{emoji}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Feature chip ─────────────────────────────────────────────────────────────
function FeatureChip({ label, has }) {
  return (
    <View style={[s.featureChip, has && s.featureChipActive]}>
      <Text style={[s.featureChipIcon, has && s.featureChipIconActive]}>
        {has ? "✔" : "✖"}
      </Text>
      <Text style={[s.featureChipText, has && s.featureChipTextActive]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Image gallery ────────────────────────────────────────────────────────────
function Gallery({ images }) {
  const [active, setActive] = useState(0);
  const flatRef = useRef(null);

  if (!images || images.length === 0) {
    return (
      <View style={s.galleryPlaceholder}>
        <Text style={{ color: "#9ca3af", fontSize: 40 }}>🚗</Text>
        <Text style={{ color: "#9ca3af", marginTop: 8 }}>No images available</Text>
      </View>
    );
  }

  return (
    <View>
      <FlatList
        ref={flatRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e) => {
          setActive(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
        }}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={s.galleryImage} resizeMode="cover" />
        )}
      />
      {/* Dots */}
      {images.length > 1 && (
        <View style={s.galleryDots}>
          {images.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                setActive(i);
                flatRef.current?.scrollToIndex({ index: i, animated: true });
              }}
              style={[s.galleryDot, i === active && s.galleryDotActive]}
            />
          ))}
        </View>
      )}
      {/* Counter badge */}
      <View style={s.galleryCounter}>
        <Text style={s.galleryCounterText}>{active + 1} / {images.length}</Text>
      </View>
    </View>
  );
}

// ─── Star rating picker ───────────────────────────────────────────────────────
function StarPicker({ rating, setRating }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <Text style={{ fontSize: 26, color: star <= rating ? "#f59e0b" : "#d1d5db" }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Simple loan calculator ───────────────────────────────────────────────────
function LoanCalculator({ price }) {
  const [deposit, setDeposit] = useState(String(Math.round(price * 0.2)));
  const [months, setMonths] = useState("60");
  const [rate, setRate] = useState("12");

  const principal = Number(price) - Number(deposit || 0);
  const monthlyRate = Number(rate) / 100 / 12;
  const n = Number(months);
  const monthly =
    principal > 0 && monthlyRate > 0 && n > 0
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
        (Math.pow(1 + monthlyRate, n) - 1)
      : 0;

  return (
    <View style={s.card}>
      <SectionHeader emoji="🧮" title="Loan Calculator" />
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.loanLabel}>Deposit (Rs.)</Text>
          <TextInput style={s.loanInput} value={deposit} onChangeText={setDeposit} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.loanLabel}>Term (months)</Text>
          <TextInput style={s.loanInput} value={months} onChangeText={setMonths} keyboardType="numeric" />
        </View>
      </View>
      <Text style={s.loanLabel}>Annual Interest Rate (%)</Text>
      <TextInput style={s.loanInput} value={rate} onChangeText={setRate} keyboardType="numeric" />
      <View style={s.loanResult}>
        <Text style={s.loanResultLabel}>Estimated Monthly Payment</Text>
        <Text style={s.loanResultValue}>
          LKR {monthly > 0 ? Math.round(monthly).toLocaleString() : "—"}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function VehicleDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [vehicle, setVehicle] = useState(null);
  const [similarVehicles, setSimilarVehicles] = useState([]);
  const [recommendedVehicles, setRecommendedVehicles] = useState([]);
  const [views, setViews] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [favLoading, setFavLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // ── Feature lists ──
  const generalOptionsList = ["Leather Seats", "Air Conditioning", "Rear Camera", "Parking Sensors", "Alloy Wheels", "Power Steering", "Power Windows", "Sunroof"];
  const safetyOptionsList = ["ABS", "Lane Assist", "Collision Warning", "Blind Spot Monitor", "Traction Control", "Stability Control", "Airbags"];
  const techOptionsList = ["Bluetooth", "Touch Screen", "Digital Dashboard", "Apple CarPlay", "Navigation System", "Android Auto", "Keyless Start"];

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/vehicles/${id}`);
      setVehicle(res.data);
      setViews(res.data.views || 0);

      const [similar, rec, reviewRes] = await Promise.allSettled([
        API.get("/vehicles/search", { params: { brand: res.data.brand, vehicleType: res.data.vehicleType } }),
        API.get(`/vehicles/recommend/${id}`),
        API.get(`/reviews/${id}`),
      ]);

      if (similar.status === "fulfilled")
        setSimilarVehicles(similar.value.data.filter((v) => v._id !== id).slice(0, 4));
      if (rec.status === "fulfilled")
        setRecommendedVehicles(rec.value.data);
      if (reviewRes.status === "fulfilled")
        setReviews(reviewRes.value.data);
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const addToFavorites = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return router.push("/login");
    setFavLoading(true);
    try {
      await API.post(`/users/favorite/${vehicle._id}`, {}, { headers: { Authorization: token } });
      Alert.alert("Added to favorites ❤️");
    } catch {
      Alert.alert("Failed to add favorite");
    } finally {
      setFavLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this ${vehicle.brand} ${vehicle.model} on AutoLK! LKR ${vehicle.price?.toLocaleString()}`,
        title: `${vehicle.brand} ${vehicle.model}`,
      });
    } catch { }
  };

  const callSeller = () => {
    const phone = vehicle.user?.phone || "94770000000";
    Linking.openURL(`tel:${phone}`);
  };

  const whatsapp = () => {
    const phone = vehicle.user?.phone || "94770000000";
    const msg = encodeURIComponent(`I'm interested in your ${vehicle.brand} ${vehicle.model}`);
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
  };

  const startChat = async (sendGreeting = false) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return router.push("/login");
    const sellerId = vehicle.user?._id;
    if (!sellerId) return Alert.alert("Seller info not available");
    setChatLoading(true);
    try {
      // Create or get existing chat
      const res = await API.get(`/chat/${vehicle._id}/${sellerId}`, { headers: { Authorization: token } });
      const chat = res.data;
      const chatId = chat._id;

      if (sendGreeting && (!chat.messages || chat.messages.length === 0)) {
        await API.post(`/chat/${chatId}`, { text: "Hi! Is this still available?" }, { headers: { Authorization: token } });
      }

      router.push(`/chat/${chatId}`);
    } catch (err) {
      console.error("Chat error:", err?.response?.data || err);
      Alert.alert("Failed to start chat", err?.response?.data?.message || err?.message || "Unknown error");
    } finally {
      setChatLoading(false);
    }
  };

  const submitReview = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return router.push("/login");
    if (!reviewText.trim()) return;
    setReviewLoading(true);
    try {
      const res = await API.post(
        `/reviews/${vehicle._id}`,
        { rating, comment: reviewText },
        { headers: { Authorization: token } }
      );
      setReviews((prev) => [...prev, res.data]);
      setReviewText("");
      setRating(5);
    } catch {
      Alert.alert("Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f3f4f6" }}>
        <ActivityIndicator size="large" color="#ff6600" />
        <Text style={{ color: "#9ca3af", marginTop: 12 }}>Loading vehicle details...</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 40 }}>😕</Text>
        <Text style={{ color: "#6b7280", marginTop: 8 }}>Vehicle not found</Text>
      </View>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const processedImages = (vehicle.images?.length ? vehicle.images : [])
    .map(buildImageUrl)
    .filter(Boolean);

  const estimatedMonthly = calculateMonthlyCost(vehicle);
  const phone = vehicle.user?.phone || "94770000000";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ══ GALLERY ═════════════════════════════════════════════════════ */}
        <View style={s.galleryWrap}>
          <Gallery images={processedImages} />

          {/* Back button */}
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>

          {/* Deal badge */}
          {vehicle.dealScore > 20 && (
            <View style={s.dealBadge}>
              <Text style={s.dealBadgeText}>🔥 Best Deal</Text>
            </View>
          )}
        </View>

        <View style={s.body}>

          {/* ══ TITLE + PRICE ════════════════════════════════════════════ */}
          <View style={s.card}>
            <Text style={s.vehicleTitle}>
              {vehicle.brand} {vehicle.model} {vehicle.manufacturedYear}
            </Text>

            <Text style={s.vehiclePrice}>LKR {vehicle.price?.toLocaleString()}</Text>

            <View style={s.metaRow}>
              <View style={s.metaBadge}>
                <Text style={s.metaBadgeText}>👁 {views} views</Text>
              </View>
              {vehicle.trustScore && (
                <View style={[s.metaBadge, { backgroundColor: "#f0fdf4" }]}>
                  <Text style={[s.metaBadgeText, { color: "#16a34a" }]}>
                    ✓ Trust Score {vehicle.trustScore}
                  </Text>
                </View>
              )}
            </View>

            {/* AI price + monthly cost */}
            {vehicle.predictedPrice && (
              <View style={s.aiBanner}>
                <Text style={s.aiBannerIcon}>🤖</Text>
                <View>
                  <Text style={s.aiBannerLabel}>AI Predicted Market Price</Text>
                  <Text style={s.aiBannerValue}>LKR {vehicle.predictedPrice?.toLocaleString()}</Text>
                </View>
              </View>
            )}

            <View style={s.monthlyBanner}>
              <Text style={s.monthlyIcon}>📆</Text>
              <View>
                <Text style={s.monthlyLabel}>Estimated Monthly Cost</Text>
                <Text style={s.monthlyValue}>LKR {estimatedMonthly?.toLocaleString()}</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={s.actionRow}>
              <TouchableOpacity style={s.actionBtn} onPress={addToFavorites} disabled={favLoading}>
                <Text style={s.actionBtnText}>{favLoading ? "..." : "❤️ Save"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: "#f3f4f6" }]} onPress={handleShare}>
                <Text style={s.actionBtnText}>🔗 Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ══ SELLER CARD ══════════════════════════════════════════════ */}
          <View style={s.card}>
            <SectionHeader emoji="👤" title="Seller" />

            <TouchableOpacity onPress={() => router.push(`/seller/${vehicle.user?._id}`)}>
              <Text style={s.sellerName}>{vehicle.user?.name || "Unknown Seller"}</Text>
            </TouchableOpacity>
            <Text style={s.sellerRating}>
              {"★".repeat(Math.round(vehicle.user?.rating || 0))}{"☆".repeat(5 - Math.round(vehicle.user?.rating || 0))}
              {"  "}{vehicle.user?.rating || 0} / 5
            </Text>

            <View style={s.contactRow}>
              <TouchableOpacity style={s.callBtn} onPress={callSeller}>
                <Text style={s.callBtnText}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.waBtn} onPress={whatsapp}>
                <Text style={s.waBtnText}>💬 WhatsApp</Text>
              </TouchableOpacity>
            </View>

            {/* Chat buttons */}
            <View style={s.chatBtnRow}>
              <TouchableOpacity
                style={s.chatBtn}
                onPress={() => startChat(false)}
                disabled={chatLoading}
                activeOpacity={0.85}
              >
                {chatLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.chatBtnText}>💬 Chat with Seller</Text>}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={s.greetingBtn}
              onPress={() => startChat(true)}
              disabled={chatLoading}
              activeOpacity={0.85}
            >
              <Text style={s.greetingBtnText}>👋 "Hi! Is this still available?"</Text>
            </TouchableOpacity>
          </View>

          {/* ══ VEHICLE INFORMATION ══════════════════════════════════════ */}
          <View style={s.card}>
            <SectionHeader emoji="ℹ️" title="Vehicle Information" />
            <View style={s.infoGrid}>
              <InfoRow label="Brand" value={vehicle.brand} />
              <InfoRow label="Model" value={vehicle.model} />
              <InfoRow label="Type" value={vehicle.vehicleType} />
              <InfoRow label="Condition" value={vehicle.condition} />
              <InfoRow label="Mfr. Year" value={vehicle.manufacturedYear} />
              <InfoRow label="Reg. Year" value={vehicle.registeredYear} />
              <InfoRow label="Maintenance" value={vehicle.maintenanceLevel} />
              <InfoRow label="Service Period" value={vehicle.maintenancePeriod} />
              <InfoRow label="Transmission" value={vehicle.transmission} />
              <InfoRow label="Fuel Type" value={vehicle.fuelType} />
              <InfoRow label="Engine" value={vehicle.engineCapacity ? `${vehicle.engineCapacity} cc` : null} />
              <InfoRow label="Mileage" value={vehicle.mileage ? `${vehicle.mileage?.toLocaleString()} km` : null} />
            </View>

            {/* Location */}
            {(vehicle.city || vehicle.province) && (
              <View style={s.locationRow}>
                <Text style={s.locationIcon}>📍</Text>
                <Text style={s.locationText}>
                  {[vehicle.address, vehicle.city, vehicle.district, vehicle.province].filter(Boolean).join(", ")}
                </Text>
              </View>
            )}

            {/* Additional info */}
            {vehicle.additionalInfo && (
              <View style={s.additionalInfo}>
                <Text style={s.additionalInfoTitle}>Additional Information</Text>
                <Text style={s.additionalInfoText}>{vehicle.additionalInfo}</Text>
              </View>
            )}
          </View>

          {/* ══ GENERAL OPTIONS ══════════════════════════════════════════ */}
          <View style={s.card}>
            <SectionHeader emoji="⚙️" title="General Options" />
            <View style={s.featureGrid}>
              {generalOptionsList.map((opt) => (
                <FeatureChip key={opt} label={opt} has={vehicle.options?.includes(opt)} />
              ))}
            </View>
          </View>

          {/* ══ SAFETY FEATURES ══════════════════════════════════════════ */}
          <View style={s.card}>
            <SectionHeader emoji="🛡️" title="Safety Features" />
            <View style={s.featureGrid}>
              {safetyOptionsList.map((opt) => (
                <FeatureChip key={opt} label={opt} has={vehicle.safetyOptions?.includes(opt)} />
              ))}
            </View>
          </View>

          {/* ══ TECH FEATURES ════════════════════════════════════════════ */}
          <View style={s.card}>
            <SectionHeader emoji="📱" title="Technology Features" />
            <View style={s.featureGrid}>
              {techOptionsList.map((opt) => (
                <FeatureChip key={opt} label={opt} has={vehicle.techOptions?.includes(opt)} />
              ))}
            </View>
          </View>

          {/* ══ AI COST PREDICTION ═══════════════════════════════════════ */}
          <View style={s.card}>
            <SectionHeader emoji="📈" title="AI Cost Prediction" />
            <Text style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>
              Predicted 5-year depreciation value
            </Text>
            <LineChart
              data={{
                labels: ["Yr 1", "Yr 2", "Yr 3", "Yr 4", "Yr 5"],
                datasets: [
                  {
                    data: [0, 1, 2, 3, 4].map(
                      (i) => Math.round((vehicle.price || 0) * (1 - 0.1 * i))
                    ),
                  },
                ],
              }}
              width={SCREEN_W - 56} // Screen width minus horizontal padding
              height={220}
              yAxisLabel="Rs."
              yAxisSuffix=""
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#ea580c",
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
                marginLeft: -10,
              }}
            />
          </View>

          {/* ══ LOAN CALCULATOR ══════════════════════════════════════════ */}
          <LoanCalculator price={vehicle.price || 0} />

          {/* ══ REVIEWS ══════════════════════════════════════════════════ */}
          <View style={s.card}>
            <SectionHeader emoji="⭐" title="Reviews" />

            {reviews.length === 0 && (
              <Text style={s.emptyReviews}>No reviews yet. Be the first!</Text>
            )}

            {reviews.map((r, i) => (
              <View key={r._id || i} style={s.reviewItem}>
                <View style={s.reviewHeader}>
                  <Text style={s.reviewStars}>
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </Text>
                  <Text style={s.reviewRating}>{r.rating}/5</Text>
                </View>
                <Text style={s.reviewComment}>{r.comment}</Text>
              </View>
            ))}

            {/* Write review */}
            <View style={s.reviewForm}>
              <Text style={s.reviewFormTitle}>Write a Review</Text>
              <StarPicker rating={rating} setRating={setRating} />
              <TextInput
                style={s.reviewInput}
                placeholder="Share your experience..."
                placeholderTextColor="#9ca3af"
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[s.reviewSubmitBtn, reviewLoading && { opacity: 0.7 }]}
                onPress={submitReview}
                disabled={reviewLoading}
              >
                {reviewLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.reviewSubmitText}>Submit Review</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {/* ══ AI RECOMMENDED VEHICLES ══════════════════════════════════ */}
          {recommendedVehicles.length > 0 && (
            <View>
              <View style={s.sectionHeaderStandalone}>
                <Text style={s.sectionTitleStandalone}>🤖 AI Recommended</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                {recommendedVehicles.map((v) => (
                  <View key={v._id} style={{ width: SCREEN_W * 0.72 }}>
                    <VehicleCard vehicle={v} monthlyBudget={50000} addToCompare={() => {}} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ══ SIMILAR VEHICLES ═════════════════════════════════════════ */}
          {similarVehicles.length > 0 && (
            <View>
              <View style={s.sectionHeaderStandalone}>
                <Text style={s.sectionTitleStandalone}>🚗 Similar Vehicles</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                {similarVehicles.map((v) => (
                  <View key={v._id} style={{ width: SCREEN_W * 0.72 }}>
                    <VehicleCard vehicle={v} monthlyBudget={50000} addToCompare={() => {}} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

        </View>
      </ScrollView>

      {/* ══ BOTTOM BAR ════════════════════════════════════════════════════ */}
      <BottomBar activeRoute="/home" />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  body: { padding: 14, gap: 14 },

  // ── Card ──
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  // ── Gallery ──
  galleryWrap: { position: "relative" },
  galleryImage: { width: SCREEN_W, height: SCREEN_W * 0.65 },
  galleryPlaceholder: {
    width: SCREEN_W, height: SCREEN_W * 0.55,
    backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center",
  },
  galleryDots: {
    position: "absolute", bottom: 14,
    flexDirection: "row", alignSelf: "center", gap: 6,
  },
  galleryDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  galleryDotActive: { backgroundColor: "#ff6600", width: 18 },
  galleryCounter: {
    position: "absolute", bottom: 14, right: 14,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  galleryCounterText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 18,
    left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center",
  },
  backBtnText: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: -2 },

  dealBadge: {
    position: "absolute", top: Platform.OS === "ios" ? 54 : 18, right: 16,
    backgroundColor: "#16a34a", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  dealBadgeText: { color: "#fff", fontWeight: "800", fontSize: 12 },

  // ── Title / price ──
  vehicleTitle: { fontSize: 22, fontWeight: "800", color: "#111", letterSpacing: -0.5 },
  vehiclePrice: { fontSize: 22, fontWeight: "800", color: "#ff6600", marginTop: 6 },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  metaBadge: {
    backgroundColor: "#f3f4f6", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  metaBadgeText: { fontSize: 12, color: "#374151", fontWeight: "600" },

  aiBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fefce8", borderRadius: 12,
    padding: 12, marginTop: 12,
    borderLeftWidth: 3, borderLeftColor: "#f59e0b",
  },
  aiBannerIcon: { fontSize: 20 },
  aiBannerLabel: { fontSize: 11, color: "#92400e", fontWeight: "600" },
  aiBannerValue: { fontSize: 15, fontWeight: "800", color: "#92400e" },

  monthlyBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#eff6ff", borderRadius: 12,
    padding: 12, marginTop: 8,
    borderLeftWidth: 3, borderLeftColor: "#3b82f6",
  },
  monthlyIcon: { fontSize: 20 },
  monthlyLabel: { fontSize: 11, color: "#1d4ed8", fontWeight: "600" },
  monthlyValue: { fontSize: 15, fontWeight: "800", color: "#1d4ed8" },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionBtn: {
    flex: 1, backgroundColor: "#fff0ed",
    borderRadius: 12, paddingVertical: 12,
    alignItems: "center", borderWidth: 1.5, borderColor: "#fed7aa",
  },
  actionBtnText: { fontWeight: "700", color: "#c2410c", fontSize: 14 },

  // ── Seller ──
  sellerName: { fontSize: 16, fontWeight: "700", color: "#1d4ed8", marginBottom: 4 },
  sellerRating: { fontSize: 14, color: "#f59e0b", marginBottom: 12 },
  contactRow: { flexDirection: "row", gap: 10 },
  callBtn: {
    flex: 1, backgroundColor: "#22c55e",
    borderRadius: 12, paddingVertical: 13, alignItems: "center",
  },
  callBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  waBtn: {
    flex: 1, backgroundColor: "#16a34a",
    borderRadius: 12, paddingVertical: 13, alignItems: "center",
  },
  waBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  chatBtnRow: { marginTop: 10 },
  chatBtn: {
    backgroundColor: "#ff6600",
    borderRadius: 14, paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#ff6600",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  chatBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  greetingBtn: {
    backgroundColor: "#fff3eb",
    borderRadius: 12, paddingVertical: 13,
    alignItems: "center", marginTop: 8,
    borderWidth: 1.5, borderColor: "#fed7aa",
  },
  greetingBtnText: { color: "#c2410c", fontWeight: "700", fontSize: 13 },

  // ── Section header ──
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  sectionEmoji: { fontSize: 18, marginRight: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#111", letterSpacing: -0.3 },

  sectionHeaderStandalone: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 },
  sectionTitleStandalone: { fontSize: 17, fontWeight: "800", color: "#111", letterSpacing: -0.4 },

  // ── Info grid ──
  infoGrid: { gap: 0 },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
  },
  infoLabel: { fontSize: 13, color: "#9ca3af", fontWeight: "600" },
  infoValue: { fontSize: 13, color: "#111", fontWeight: "700", flex: 1, textAlign: "right" },

  locationRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    marginTop: 12, backgroundColor: "#f9fafb", borderRadius: 10, padding: 10,
  },
  locationIcon: { fontSize: 14 },
  locationText: { fontSize: 13, color: "#374151", flex: 1, lineHeight: 19 },

  additionalInfo: { marginTop: 12, backgroundColor: "#f9fafb", borderRadius: 10, padding: 12 },
  additionalInfoTitle: { fontSize: 12, fontWeight: "700", color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  additionalInfoText: { fontSize: 13, color: "#374151", lineHeight: 20 },

  // ── Feature chips ──
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  featureChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: "#fee2e2",
    backgroundColor: "#fff1f2",
  },
  featureChipActive: { borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" },
  featureChipIcon: { fontSize: 11, color: "#ef4444", fontWeight: "800" },
  featureChipIconActive: { color: "#16a34a" },
  featureChipText: { fontSize: 12, color: "#9ca3af", fontWeight: "500" },
  featureChipTextActive: { color: "#15803d", fontWeight: "600" },

  // ── Row ──
  row: { flexDirection: "row", gap: 10, marginBottom: 10 },

  // ── Loan calculator ──
  loanLabel: { fontSize: 11, fontWeight: "700", color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  loanInput: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#111",
    backgroundColor: "#f9fafb", marginBottom: 10,
  },
  loanResult: {
    backgroundColor: "#fff3eb", borderRadius: 12,
    padding: 14, alignItems: "center", marginTop: 4,
    borderWidth: 2, borderColor: "#fed7aa",
  },
  loanResultLabel: { fontSize: 12, color: "#92400e", fontWeight: "600" },
  loanResultValue: { fontSize: 22, fontWeight: "800", color: "#ff6600", marginTop: 4 },

  // ── Reviews ──
  emptyReviews: { color: "#9ca3af", fontSize: 13, textAlign: "center", marginBottom: 12 },
  reviewItem: {
    backgroundColor: "#f9fafb", borderRadius: 12,
    padding: 12, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: "#f59e0b",
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  reviewStars: { color: "#f59e0b", fontSize: 14 },
  reviewRating: { fontSize: 12, color: "#92400e", fontWeight: "700" },
  reviewComment: { fontSize: 13, color: "#374151", lineHeight: 19 },

  reviewForm: { marginTop: 16, borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 16 },
  reviewFormTitle: { fontSize: 14, fontWeight: "800", color: "#111", marginBottom: 10 },
  reviewInput: {
    borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12,
    padding: 12, fontSize: 14, color: "#111", textAlignVertical: "top",
    backgroundColor: "#f9fafb", marginTop: 10, height: 90,
  },
  reviewSubmitBtn: {
    backgroundColor: "#ff6600", borderRadius: 12,
    paddingVertical: 13, alignItems: "center", marginTop: 10,
  },
  reviewSubmitText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});