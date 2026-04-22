import { memo } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import API from "../services/api";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { calculateMonthlyCost } from "../utils/calculateMonthlyCost";
import { useTheme } from "../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { formatRelativeDate } from "../utils/formatDate";

function VehicleCard({
  vehicle,
  compareList,
  setCompareList,
  monthlyBudget,
  addToCompare
}) {
  const router = useRouter();
  const { theme: t } = useTheme();

  const estimatedMonthly = calculateMonthlyCost(vehicle);

  const isCityFriendly =
    vehicle.fuelEfficiency > 18 &&
    vehicle.mileage < 80000 &&
    vehicle.maintenanceLevel === "low";

  let sellerRating = null;
  if (vehicle.user) {
    sellerRating = vehicle.user.rating
      || (vehicle.trustScore ? Math.min(5, vehicle.trustScore / 20).toFixed(1) : 3.5);
  }

  // IMAGE LOGIC
  let imageUrl = "https://via.placeholder.com/600x400?text=No+Image";
  if (vehicle.images && vehicle.images.length > 0 && vehicle.images[0]) {
    let firstImage = vehicle.images[0];
    if (firstImage.startsWith("/")) firstImage = firstImage.slice(1);
    
    const baseUrl = "https://motoriq-lk.onrender.com";
    let finalPath = "";
    if (firstImage.startsWith("http")) {
      imageUrl = firstImage;
    } else {
      if (firstImage.startsWith("/")) firstImage = firstImage.slice(1);
      
      if (firstImage.startsWith("uploads/")) {
        finalPath = firstImage;
      } else {
        finalPath = `uploads/${firstImage}`;
      }
      imageUrl = `${baseUrl}/${encodeURI(finalPath)}`;
    }
  }

  const cardContent = (
    <>
      {/* IMAGE */}
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />

      {/* Premium or Best Deal badge */}
      {vehicle.isPremium ? (
        <LinearGradient
          colors={["#f59e0b", "#ea580c"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumBadge}
        >
          <Text style={styles.premiumBadgeText}>🌟 PREMIUM</Text>
        </LinearGradient>
      ) : vehicle.dealScore > 20 ? (
        <View style={[styles.dealBadge, { backgroundColor: t.green }]}>
          <Text style={styles.dealBadgeText}>🔥 Best Deal</Text>
        </View>
      ) : null}

      <View style={styles.body}>
        {/* Title */}
        <Text style={[styles.title, { color: t.textPrimary }]}>
          {vehicle.brand} {vehicle.model} {vehicle.manufacturedYear}
        </Text>

        {/* Location & Date */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={[styles.location, { color: t.textMuted, marginBottom: 0 }]}>
            📍 {vehicle.city || vehicle.district || "Location not specified"}
          </Text>
          <Text style={[styles.location, { color: t.textMuted, fontSize: 11, marginBottom: 0 }]}>
            🕒 {formatRelativeDate(vehicle.createdAt)}
          </Text>
        </View>

        {/* Seller rating */}
        {sellerRating && (
          <View style={[styles.ratingPill, { backgroundColor: t.isDark ? "rgba(234,179,8,0.15)" : "#fef9c3" }]}>
            <Text style={{ color: t.yellow, fontSize: 12, fontWeight: "700" }}>⭐ {sellerRating}</Text>
          </View>
        )}

        {/* Price */}
        <Text style={[styles.price, { color: t.primary }]}>
          LKR {vehicle.price?.toLocaleString()}
        </Text>

        {/* Badges row */}
        <View style={styles.badgeRow}>
          <Chip label={`🛣 ${(vehicle.mileage || 0).toLocaleString()} km`} t={t} />
          {vehicle.transmission && <Chip label={`⚙ ${vehicle.transmission}`} t={t} />}
          {vehicle.fuelType && <Chip label={`⛽ ${vehicle.fuelType}`} t={t} />}
          {vehicle.engineCapacity && <Chip label={`🔧 ${vehicle.engineCapacity}cc`} t={t} />}
        </View>

        {/* Info chips */}
        <View style={styles.badgeRow}>
          <Chip label={`Trust: ${vehicle.trustScore ?? 0}/100`} t={t} />
          <Chip label={`Monthly: LKR ${estimatedMonthly?.toLocaleString()}`} t={t} color={t.blueGlow} textColor={t.blue} />
          {estimatedMonthly <= monthlyBudget && (
            <Chip label="✓ Within Budget" t={t} color={t.greenGlow} textColor={t.green} />
          )}
          {isCityFriendly && (
            <Chip label="🏙 City Friendly" t={t} color={t.greenGlow} textColor={t.green} />
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={async () => {
              try {
                const token = await AsyncStorage.getItem("token");
                await API.post(`/users/favorite/${vehicle._id}`, {}, { headers: { Authorization: token } });
              } catch (err) {
                console.log(err);
              }
            }}
            style={[styles.actionBtn, { backgroundColor: t.redGlow, borderColor: t.red }]}
          >
            <Text style={[styles.actionBtnText, { color: t.red }]}>❤️ Favorite</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => addToCompare(vehicle)}
            style={[styles.actionBtn, { backgroundColor: t.chipBg, borderColor: t.borderGlass }]}
          >
            <Text style={[styles.actionBtnText, { color: t.textSecondary }]}>⚖ Compare</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  if (vehicle.isPremium) {
    return (
      <TouchableOpacity
        onPress={() => router.push(`/vehicle/${vehicle._id}`)}
        style={[styles.cardWrapper, { ...t.shadowMd }]}
      >
        <LinearGradient
          colors={["#f59e0b", "#ea580c"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View style={[styles.cardInner, { backgroundColor: t.bgCard }]}>
            {cardContent}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => router.push(`/vehicle/${vehicle._id}`)}
      style={[styles.card, { backgroundColor: t.bgCard, ...t.shadowSm }]}
    >
      {cardContent}
    </TouchableOpacity>
  );
}

export default memo(VehicleCard);

/* ── Chip helper ─────────────────────────────────────────────────────────── */
const Chip = memo(({ label, t, color, textColor }) => {
  return (
    <View style={[styles.chip, { backgroundColor: color || t.chipBg }]}>
      <Text style={[styles.chipText, { color: textColor || t.chipText }]}>{label}</Text>
    </View>
  );
});

/* ── Styles ─────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardWrapper: {
    borderRadius: 16,
    marginBottom: 16,
  },
  gradientBorder: {
    borderRadius: 16,
    padding: 2, // Border width
  },
  cardInner: {
    borderRadius: 14, // Slightly smaller to fit inside border
    overflow: "hidden",
  },
  image: { width: "100%", height: 190 },
  dealBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dealBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  premiumBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#ea580c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  premiumBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  body: { padding: 14 },
  title: { fontWeight: "800", fontSize: 16, marginBottom: 4 },
  location: { fontSize: 12, marginBottom: 6 },
  ratingPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 6,
  },
  price: { fontWeight: "800", fontSize: 20, marginBottom: 10 },

  badgeRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 5,
  },
  chipText: { fontSize: 11, fontWeight: "600" },

  actions: { flexDirection: "row", gap: 8, marginTop: 8 },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontWeight: "700" },
});