import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import API from "../../src/services/api";
import VehicleCard from "../../src/components/VehicleCard";
import BottomBar from "../../src/components/BottomBar";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Skeleton placeholder ─────────────────────────────────────────────────────
function SkeletonCard() {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[s.skeletonCard, { opacity: anim }]}>
      <View style={s.skeletonImage} />
      <View style={s.skeletonBody}>
        <View style={s.skeletonLine} />
        <View style={[s.skeletonLine, { width: "55%", marginTop: 8 }]} />
        <View style={[s.skeletonLine, { width: "35%", marginTop: 8 }]} />
      </View>
    </Animated.View>
  );
}

// ─── Fade-in wrapper ──────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0 }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 80, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ icon, value, label }) {
  return (
    <View style={s.statPill}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Info tile ────────────────────────────────────────────────────────────────
function InfoTile({ label, value }) {
  if (!value) return null;
  return (
    <View style={s.infoTile}>
      <Text style={s.infoTileLabel}>{label}</Text>
      <Text style={s.infoTileValue}>{value}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function SellerProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [seller, setSeller] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Hero parallax
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroScale = scrollY.interpolate({ inputRange: [-80, 0], outputRange: [1.12, 1], extrapolate: "clamp" });
  const heroOpacity = scrollY.interpolate({ inputRange: [0, 160], outputRange: [1, 0.3], extrapolate: "clamp" });

  useEffect(() => { fetchSeller(); }, [id]);

  const fetchSeller = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [userRes, vehicleRes] = await Promise.all([
        API.get(`/users/${id}`),
        API.get(`/vehicles/user/${id}`),
      ]);
      setSeller(userRes.data);
      setVehicles(vehicleRes.data);
    } catch (err) {
      console.error("SellerProfile fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
        {/* Hero skeleton */}
        <View style={s.heroSkeleton}>
          <View style={s.blob1} />
          <ActivityIndicator color="#ff6600" size="large" style={{ marginTop: 40 }} />
          <Text style={{ color: "#9ca3af", marginTop: 12 }}>Loading seller profile...</Text>
        </View>
        <View style={{ padding: 14, gap: 14, marginTop: 60 }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
        <BottomBar activeRoute="/home" />
      </View>
    );
  }

  if (!seller) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f3f4f6" }}>
        <Text style={{ fontSize: 40 }}>😕</Text>
        <Text style={{ color: "#6b7280", marginTop: 10, fontSize: 15 }}>Seller not found</Text>
        <TouchableOpacity style={s.backBtnSolid} onPress={() => router.back()}>
          <Text style={s.backBtnSolidText}>Go Back</Text>
        </TouchableOpacity>
        <BottomBar activeRoute="/home" />
      </View>
    );
  }

  const joinedDate = seller.createdAt
    ? new Date(seller.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "N/A";
  const lastActive = seller.lastLogin
    ? new Date(seller.lastLogin).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "N/A";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>

      <Animated.FlatList
        data={vehicles}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchSeller(true)}
            tintColor="#ff6600"
            colors={["#ff6600"]}
          />
        }

        ListHeaderComponent={() => (
          <View>
            {/* ══ HERO ══════════════════════════════════════════════════ */}
            <Animated.View
              style={[s.hero, { transform: [{ scale: heroScale }], opacity: heroOpacity }]}
            >
              <View style={s.blob1} />
              <View style={s.blob2} />

              {/* Back button */}
              <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                <Text style={s.backBtnText}>←</Text>
              </TouchableOpacity>

              <FadeIn delay={0}>
                {/* Avatar */}
                <View style={s.avatarWrap}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>
                      {(seller.username || seller.name || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={s.avatarVerified}>
                    <Text style={s.avatarVerifiedText}>✓</Text>
                  </View>
                </View>

                <Text style={s.heroName}>{seller.username || seller.name}</Text>
                <Text style={s.heroTagline}>Trusted seller on AutoLK 🚗</Text>

                {/* Stat pills */}
                <View style={s.statRow}>
                  <StatPill icon="⭐" value={seller.sellerRating || 5} label="Rating" />
                  <View style={s.statDivider} />
                  <StatPill icon="🛡" value={`${seller.trustScore || 50}/100`} label="Trust" />
                  <View style={s.statDivider} />
                  <StatPill icon="📦" value={vehicles.length} label="Listings" />
                </View>
              </FadeIn>
            </Animated.View>

            {/* ══ INFO CARD (overlaps hero) ══════════════════════════════ */}
            <FadeIn delay={100}>
              <View style={s.infoCard}>
                <View style={s.infoGrid}>
                  <InfoTile label="Name" value={seller.name || seller.username} />
                  <InfoTile label="Joined" value={joinedDate} />
                  <InfoTile label="Last Active" value={lastActive} />
                  <InfoTile
                    label="Seller Rating"
                    value={`${"★".repeat(Math.round(seller.sellerRating || 5))} ${seller.sellerRating || 5}/5`}
                  />
                </View>
              </View>
            </FadeIn>

            {/* ══ LISTINGS HEADER ════════════════════════════════════════ */}
            <View style={s.listingsHeader}>
              <Text style={s.listingsTitle}>
                Listings
              </Text>
              <View style={s.listingsBadge}>
                <Text style={s.listingsBadgeText}>{vehicles.length}</Text>
              </View>
            </View>

            {/* ══ EMPTY STATE ════════════════════════════════════════════ */}
            {vehicles.length === 0 && (
              <View style={s.emptyWrap}>
                <Text style={s.emptyEmoji}>🚗</Text>
                <Text style={s.emptyTitle}>No Listings Yet</Text>
                <Text style={s.emptySubtitle}>This seller hasn't posted any vehicles yet.</Text>
              </View>
            )}
          </View>
        )}

        renderItem={({ item, index }) => (
          <FadeIn delay={index * 55}>
            <View style={s.cardWrap}>
              <VehicleCard
                vehicle={item}
                monthlyBudget={50000}
                addToCompare={() => {}}
              />
            </View>
          </FadeIn>
        )}

        ListFooterComponent={() =>
          vehicles.length > 0 ? (
            <View style={s.footer}>
              <Text style={s.footerText}>
                {vehicles.length} listing{vehicles.length !== 1 ? "s" : ""} by {seller.username || seller.name}
              </Text>
            </View>
          ) : null
        }
      />

      {/* ══ BOTTOM BAR ════════════════════════════════════════════════════ */}
      <BottomBar activeRoute="/home" />

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
    paddingBottom: 44,
    paddingHorizontal: 20,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    minHeight: 280,
  },
  heroSkeleton: {
    backgroundColor: "#111",
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 44,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    minHeight: 240,
  },
  blob1: {
    position: "absolute", top: -80, left: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: "#ff6600", opacity: 0.2,
  },
  blob2: {
    position: "absolute", bottom: -60, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "#ff6600", opacity: 0.1,
  },

  // Back button
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 18,
    left: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    zIndex: 10,
  },
  backBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  backBtnSolid: {
    marginTop: 16, backgroundColor: "#ff6600",
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  backBtnSolidText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  // Avatar
  avatarWrap: { position: "relative", marginBottom: 14, marginTop: 8 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#ff6600",
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: { color: "#fff", fontSize: 34, fontWeight: "800" },
  avatarVerified: {
    position: "absolute", bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "#22c55e", borderWidth: 2, borderColor: "#111",
    alignItems: "center", justifyContent: "center",
  },
  avatarVerifiedText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  heroName: {
    color: "#fff", fontSize: 26, fontWeight: "800",
    letterSpacing: -0.5, textAlign: "center",
  },
  heroTagline: {
    color: "#9ca3af", fontSize: 13, marginTop: 4,
    textAlign: "center", marginBottom: 20,
  },

  // Stat pills
  statRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18, paddingHorizontal: 8, paddingVertical: 10,
  },
  statPill: { alignItems: "center", paddingHorizontal: 16 },
  statIcon: { fontSize: 18, marginBottom: 2 },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "800" },
  statLabel: { color: "#9ca3af", fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.15)" },

  // ── Info card (overlaps hero) ──
  infoCard: {
    marginHorizontal: 16,
    marginTop: -24,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 10,
  },
  infoGrid: {
    flexDirection: "row", flexWrap: "wrap",
  },
  infoTile: {
    width: "50%",
    paddingHorizontal: 8, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
  },
  infoTileLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 },
  infoTileValue: { fontSize: 14, color: "#111", fontWeight: "700" },

  // ── Listings header ──
  listingsHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12,
    gap: 10,
  },
  listingsTitle: {
    fontSize: 20, fontWeight: "800", color: "#111", letterSpacing: -0.4,
  },
  listingsBadge: {
    backgroundColor: "#ff6600", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  listingsBadgeText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // ── Vehicle card wrap ──
  cardWrap: { paddingHorizontal: 14, marginBottom: 12 },

  // ── Empty ──
  emptyWrap: {
    alignItems: "center", paddingVertical: 50,
    marginHorizontal: 14,
    backgroundColor: "#fff", borderRadius: 20,
    shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 8, elevation: 2,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  emptySubtitle: { color: "#9ca3af", fontSize: 13, marginTop: 6, textAlign: "center", paddingHorizontal: 24 },

  // ── Footer ──
  footer: { alignItems: "center", paddingVertical: 20 },
  footerText: { color: "#d1d5db", fontSize: 12, fontWeight: "600" },

  // ── Skeleton ──
  skeletonCard: {
    backgroundColor: "#fff", borderRadius: 20,
    overflow: "hidden", marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  skeletonImage: { width: "100%", height: 150, backgroundColor: "#e5e7eb" },
  skeletonBody: { padding: 14 },
  skeletonLine: { height: 13, borderRadius: 7, backgroundColor: "#e5e7eb", width: "75%" },
});