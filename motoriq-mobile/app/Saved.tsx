import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import API from "../src/services/api";
import VehicleCard from "../src/components/VehicleCard";
import BottomBar from "../src/components/BottomBar";

// ─── Animated skeleton card ───────────────────────────────────────────────────
function SkeletonCard() {
  const anim = new Animated.Value(0.4);

  Animated.loop(
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ])
  ).start();

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: anim }]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "60%", marginTop: 8 }]} />
        <View style={[styles.skeletonLine, { width: "40%", marginTop: 8 }]} />
      </View>
    </Animated.View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onBrowse }) {
  const scaleAnim = new Animated.Value(0.8);
  const fadeAnim = new Animated.Value(0);

  Animated.parallel([
    Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
  ]).start();

  return (
    <Animated.View style={[styles.emptyWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.emptyIconWrap}>
        <Text style={styles.emptyIcon}>❤️</Text>
        <View style={styles.emptyIconPulse} />
      </View>
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the ❤️ icon on any vehicle listing to save it here for later.
      </Text>
      <TouchableOpacity style={styles.browseBtn} onPress={onBrowse} activeOpacity={0.85}>
        <Text style={styles.browseBtnText}>🚗 Browse Vehicles</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function Saved() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState(null);

  // ── Re-fetch every time this screen comes into focus ──────────────────────
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    const t = await AsyncStorage.getItem("token");
    if (!t) {
      router.replace("/login");
      return;
    }
    setToken(t);
    fetchFavorites(t);
  };

  const fetchFavorites = async (t, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await API.get("/users/profile", {
        headers: { Authorization: t },
      });
      setVehicles(res.data.favorites || []);
    } catch (err) {
      console.error("Favorites fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (token) fetchFavorites(token, true);
  };

  // ── Remove a favorite ─────────────────────────────────────────────────────
  const removeFavorite = async (vehicleId) => {
    try {
      await API.post(
        `/users/favorite/${vehicleId}`,
        {},
        { headers: { Authorization: token } }
      );
      setVehicles((prev) => prev.filter((v) => v._id !== vehicleId));
    } catch {
      // silently fail — card stays
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>

      {/* ══ HERO HEADER ════════════════════════════════════════════════════ */}
      <View style={styles.hero}>
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        <View style={styles.heroInner}>
          <View>
            <Text style={styles.heroTitle}>❤️ Saved Vehicles</Text>
            <Text style={styles.heroSub}>Your personal shortlist</Text>
          </View>

          {/* Count badge */}
          {!loading && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ══ LOADING SKELETONS ══════════════════════════════════════════════ */}
      {loading && (
        <View style={{ padding: 14, gap: 14 }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      )}

      {/* ══ EMPTY STATE ════════════════════════════════════════════════════ */}
      {!loading && vehicles.length === 0 && (
        <EmptyState onBrowse={() => router.replace("/home")} />
      )}

      {/* ══ VEHICLE LIST ═══════════════════════════════════════════════════ */}
      {!loading && vehicles.length > 0 && (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ff6600"
              colors={["#ff6600"]}
            />
          }
          ListHeaderComponent={() => (
            <Text style={styles.listHint}>Pull down to refresh · Swipe to remove</Text>
          )}
          renderItem={({ item, index }) => (
            <FadeInCard delay={index * 60}>
              <View style={styles.cardWrap}>
                <VehicleCard
                  vehicle={item}
                  monthlyBudget={50000}
                  addToCompare={() => {}}
                />

                {/* Remove button */}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeFavorite(item._id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.removeBtnIcon}>💔</Text>
                  <Text style={styles.removeBtnText}>Remove from Saved</Text>
                </TouchableOpacity>
              </View>
            </FadeInCard>
          )}
          ListFooterComponent={() => (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {vehicles.length} saved vehicle{vehicles.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        />
      )}

      {/* ══ BOTTOM BAR ════════════════════════════════════════════════════ */}
      <BottomBar activeRoute="/saved" />

    </View>
  );
}

// ─── Fade-in wrapper for list items ──────────────────────────────────────────
function FadeInCard({ children, delay = 0 }) {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(20);

  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      delay,
      useNativeDriver: true,
    }),
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 80,
      friction: 10,
      delay,
      useNativeDriver: true,
    }),
  ]).start();

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // ── Hero ──
  hero: {
    backgroundColor: "#111",
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 22,
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
  heroInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTitle: {
    color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.5,
  },
  heroSub: {
    color: "#9ca3af", fontSize: 13, marginTop: 4,
  },
  countBadge: {
    backgroundColor: "#ff6600",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  countBadgeText: {
    color: "#fff", fontWeight: "800", fontSize: 13,
  },

  // ── List ──
  listContent: {
    padding: 14,
    paddingBottom: 130,
    gap: 14,
  },
  listHint: {
    textAlign: "center",
    fontSize: 11,
    color: "#d1d5db",
    marginBottom: 6,
    fontWeight: "500",
  },

  // ── Card wrap ──
  cardWrap: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  // ── Remove button ──
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "#fff1f2",
    borderTopWidth: 1,
    borderTopColor: "#fecaca",
  },
  removeBtnIcon: { fontSize: 14 },
  removeBtnText: {
    color: "#ef4444",
    fontWeight: "700",
    fontSize: 13,
  },

  // ── Footer ──
  footer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  footerText: {
    color: "#d1d5db", fontSize: 12, fontWeight: "600",
  },

  // ── Empty state ──
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconWrap: {
    position: "relative",
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: { fontSize: 64 },
  emptyIconPulse: {
    position: "absolute",
    width: 90, height: 90,
    borderRadius: 45,
    backgroundColor: "#ff6600",
    opacity: 0.08,
  },
  emptyTitle: {
    fontSize: 22, fontWeight: "800", color: "#111",
    letterSpacing: -0.4, marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14, color: "#9ca3af", textAlign: "center",
    lineHeight: 22, marginBottom: 32,
  },
  browseBtn: {
    backgroundColor: "#ff6600",
    paddingVertical: 15,
    paddingHorizontal: 36,
    borderRadius: 50,
    shadowColor: "#ff6600",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  browseBtnText: {
    color: "#fff", fontWeight: "800", fontSize: 15,
  },

  // ── Skeleton ──
  skeletonCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  skeletonImage: {
    width: "100%", height: 160,
    backgroundColor: "#e5e7eb",
  },
  skeletonBody: { padding: 14 },
  skeletonLine: {
    height: 14, borderRadius: 7,
    backgroundColor: "#e5e7eb", width: "80%",
  },
});