import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
  Keyboard,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import API from "../src/services/api";
import VehicleCard from "../src/components/VehicleCard";
import BottomBar from "../src/components/BottomBar";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Recent search chip ───────────────────────────────────────────────────────
function RecentChip({ label, onPress, onRemove }) {
  return (
    <View style={s.recentChip}>
      <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
        <Text style={s.recentChipText} numberOfLines={1}>🕐 {label}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={s.recentChipRemove}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Quick filter chip ────────────────────────────────────────────────────────
function FilterChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.filterChip, active && s.filterChipActive]}
      activeOpacity={0.7}
    >
      <Text style={[s.filterChipText, active && s.filterChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
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
  const slide = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 80, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Quick filter categories ──────────────────────────────────────────────────
const QUICK_FILTERS = [
  { label: "All",      value: "" },
  { label: "🚙 SUV",   value: "SUV" },
  { label: "🚗 Sedan", value: "Sedan" },
  { label: "🔋 EV",    value: "Electric" },
  { label: "🌿 Hybrid",value: "Hybrid" },
  { label: "🛻 Pickup",value: "Pickup" },
];

const SORT_OPTIONS = [
  { label: "Relevance",    value: "" },
  { label: "Price ↑",      value: "priceLow" },
  { label: "Price ↓",      value: "priceHigh" },
  { label: "Newest",       value: "yearNew" },
  { label: "Trust Score",  value: "trustScore" },
  { label: "Best Value",   value: "bestValue" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function Search() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [query, setQuery] = useState(params.q || "");
  const [inputValue, setInputValue] = useState(params.q || "");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [activeFilter, setActiveFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);

  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Auto-focus input when screen opens
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  // Fetch when query changes
  useEffect(() => {
    if (query.trim()) {
      fetchVehicles(query);
    } else {
      setVehicles([]);
      setHasSearched(false);
    }
  }, [query]);

  // ── Debounced input ─────────────────────────────────────────────────────
  const handleInputChange = (text) => {
    setInputValue(text);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setQuery(text.trim());
    }, 420);
  };

  // ── Fetch ───────────────────────────────────────────────────────────────
  const fetchVehicles = async (q, isRefresh = false) => {
    if (!q.trim()) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await API.get(`/search?q=${encodeURIComponent(q)}`);
      setVehicles(res.data || []);
      setHasSearched(true);

      // Save to recent searches
      if (q.trim()) {
        setRecentSearches((prev) => {
          const filtered = prev.filter((s) => s.toLowerCase() !== q.trim().toLowerCase());
          return [q.trim(), ...filtered].slice(0, 6);
        });
      }
    } catch (err) {
      console.log("Search error:", err);
      setVehicles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (q = inputValue) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    Keyboard.dismiss();
    setQuery(trimmed);
  };

  const clearSearch = () => {
    setInputValue("");
    setQuery("");
    setVehicles([]);
    setHasSearched(false);
    setActiveFilter("");
    setSortBy("");
    inputRef.current?.focus();
  };

  const removeRecent = (term) => {
    setRecentSearches((prev) => prev.filter((s) => s !== term));
  };

  // ── Filter + sort results client-side ───────────────────────────────────
  let displayed = [...vehicles];

  if (activeFilter) {
    displayed = displayed.filter((v) => {
      if (activeFilter === "Electric") return v.fuelType?.toLowerCase() === "electric";
      if (activeFilter === "Hybrid") return v.fuelType?.toLowerCase() === "hybrid";
      return v.vehicleType?.toLowerCase() === activeFilter.toLowerCase();
    });
  }

  switch (sortBy) {
    case "priceLow":   displayed.sort((a, b) => a.price - b.price); break;
    case "priceHigh":  displayed.sort((a, b) => b.price - a.price); break;
    case "yearNew":    displayed.sort((a, b) => b.manufacturedYear - a.manufacturedYear); break;
    case "trustScore": displayed.sort((a, b) => b.trustScore - a.trustScore); break;
    case "bestValue":  displayed.sort((a, b) => (b.trustScore / b.price) - (a.trustScore / a.price)); break;
    default: break;
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>

      {/* ══ STICKY SEARCH HEADER ══════════════════════════════════════════ */}
      <View style={s.header}>
        <View style={s.blob1} />

        <View style={s.headerTop}>
          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>

          {/* Search bar */}
          <View style={s.searchBarWrap}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              ref={inputRef}
              style={s.searchInput}
              value={inputValue}
              onChangeText={handleInputChange}
              onSubmitEditing={() => handleSearch()}
              placeholder="Search brand, model, type..."
              placeholderTextColor="#9ca3af"
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {inputValue.length > 0 && (
              <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={s.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick filter chips */}
        {hasSearched && (
          <FlatList
            horizontal
            data={QUICK_FILTERS}
            keyExtractor={(item) => item.value}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterRow}
            renderItem={({ item }) => (
              <FilterChip
                label={item.label}
                active={activeFilter === item.value}
                onPress={() => setActiveFilter(item.value)}
              />
            )}
          />
        )}
      </View>

      {/* ══ MAIN CONTENT ══════════════════════════════════════════════════ */}
      <FlatList
        data={displayed}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 130, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          query ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchVehicles(query, true)}
              tintColor="#ff6600"
              colors={["#ff6600"]}
            />
          ) : undefined
        }

        ListHeaderComponent={() => (
          <View>

            {/* ── Pre-search: recent searches ── */}
            {!hasSearched && !loading && (
              <View style={s.preSearchWrap}>

                {/* Hero prompt */}
                <View style={s.promptCard}>
                  <Text style={s.promptEmoji}>🔍</Text>
                  <Text style={s.promptTitle}>Find Your Car</Text>
                  <Text style={s.promptSubtitle}>
                    Search by brand, model, type or any keyword
                  </Text>
                </View>

                {/* Popular searches */}
                <View style={s.suggestionsCard}>
                  <Text style={s.suggestionsTitle}>🔥 Popular Searches</Text>
                  <View style={s.suggestionsGrid}>
                    {["Toyota Prius", "Honda Civic", "Suzuki Alto", "Nissan Leaf", "BMW 3 Series", "Land Rover"].map((term) => (
                      <TouchableOpacity
                        key={term}
                        style={s.suggestionChip}
                        onPress={() => { setInputValue(term); handleSearch(term); }}
                      >
                        <Text style={s.suggestionChipText}>{term}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <View style={s.recentCard}>
                    <View style={s.recentHeader}>
                      <Text style={s.recentTitle}>Recent Searches</Text>
                      <TouchableOpacity onPress={() => setRecentSearches([])}>
                        <Text style={s.recentClear}>Clear all</Text>
                      </TouchableOpacity>
                    </View>
                    {recentSearches.map((term) => (
                      <RecentChip
                        key={term}
                        label={term}
                        onPress={() => { setInputValue(term); handleSearch(term); }}
                        onRemove={() => removeRecent(term)}
                      />
                    ))}
                  </View>
                )}

              </View>
            )}

            {/* ── Loading ── */}
            {loading && (
              <View style={{ padding: 14, gap: 14 }}>
                {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
              </View>
            )}

            {/* ── Results header + sort ── */}
            {!loading && hasSearched && (
              <View style={s.resultsHeader}>
                <View>
                  <Text style={s.resultsTitle}>
                    {displayed.length > 0
                      ? `${displayed.length} result${displayed.length !== 1 ? "s" : ""}`
                      : "No results"}
                  </Text>
                  {query && (
                    <Text style={s.resultsQuery} numberOfLines={1}>
                      for "{query}"
                    </Text>
                  )}
                </View>

                {/* Sort picker */}
                <FlatList
                  horizontal
                  data={SORT_OPTIONS}
                  keyExtractor={(item) => item.value}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => setSortBy(item.value)}
                      style={[s.sortChip, sortBy === item.value && s.sortChipActive]}
                    >
                      <Text style={[s.sortChipText, sortBy === item.value && s.sortChipTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* ── Empty result ── */}
            {!loading && hasSearched && displayed.length === 0 && (
              <FadeIn>
                <View style={s.emptyWrap}>
                  <Text style={s.emptyEmoji}>🔍</Text>
                  <Text style={s.emptyTitle}>No Vehicles Found</Text>
                  <Text style={s.emptySubtitle}>
                    Try a different keyword, or remove filters to see more results.
                  </Text>
                  {activeFilter ? (
                    <TouchableOpacity style={s.emptyAction} onPress={() => setActiveFilter("")}>
                      <Text style={s.emptyActionText}>Clear Filter</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={s.emptyAction} onPress={clearSearch}>
                      <Text style={s.emptyActionText}>New Search</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </FadeIn>
            )}

          </View>
        )}

        renderItem={({ item, index }) => (
          <FadeIn delay={index * 45}>
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
          !loading && displayed.length > 0 ? (
            <View style={s.footer}>
              <Text style={s.footerText}>
                {displayed.length} vehicle{displayed.length !== 1 ? "s" : ""} found
              </Text>
            </View>
          ) : null
        }
      />

      {/* ══ BOTTOM BAR ════════════════════════════════════════════════════ */}
      <BottomBar activeRoute="/search" />

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // ── Header ──
  header: {
    backgroundColor: "#111",
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingBottom: 14,
    overflow: "hidden",
    position: "relative",
    zIndex: 10,
  },
  blob1: {
    position: "absolute", top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "#ff6600", opacity: 0.18,
  },
  headerTop: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, gap: 10, marginBottom: 12,
  },

  // Back button
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  backBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Search bar
  searchBarWrap: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16, paddingHorizontal: 12, height: 46,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1, fontSize: 15, color: "#111",
    paddingVertical: 0,
  },
  clearIcon: { color: "#9ca3af", fontSize: 14, fontWeight: "700", paddingLeft: 4 },

  // Filter chips row
  filterRow: { paddingHorizontal: 14, gap: 8, paddingBottom: 4 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)",
  },
  filterChipActive: { backgroundColor: "#ff6600" },
  filterChipText: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" },
  filterChipTextActive: { color: "#fff", fontWeight: "800" },

  // ── Pre-search ──
  preSearchWrap: { padding: 14, gap: 14 },

  promptCard: {
    backgroundColor: "#fff", borderRadius: 20,
    padding: 24, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  promptEmoji: { fontSize: 44, marginBottom: 10 },
  promptTitle: { fontSize: 20, fontWeight: "800", color: "#111", marginBottom: 6 },
  promptSubtitle: { fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 20 },

  suggestionsCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  suggestionsTitle: { fontSize: 13, fontWeight: "800", color: "#374151", marginBottom: 12 },
  suggestionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestionChip: {
    backgroundColor: "#fff3eb", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1.5, borderColor: "#fed7aa",
  },
  suggestionChipText: { color: "#c2410c", fontWeight: "700", fontSize: 13 },

  recentCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  recentTitle: { fontSize: 13, fontWeight: "800", color: "#374151" },
  recentClear: { fontSize: 12, color: "#ff6600", fontWeight: "700" },
  recentChip: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
    gap: 8,
  },
  recentChipText: { fontSize: 14, color: "#374151", flex: 1 },
  recentChipRemove: { color: "#d1d5db", fontSize: 13, fontWeight: "700" },

  // ── Results header ──
  resultsHeader: {
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, gap: 10,
  },
  resultsTitle: { fontSize: 18, fontWeight: "800", color: "#111", letterSpacing: -0.3 },
  resultsQuery: { fontSize: 13, color: "#9ca3af", marginTop: 2 },

  sortChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: "#f3f4f6",
    borderWidth: 1.5, borderColor: "transparent",
  },
  sortChipActive: { backgroundColor: "#fff3eb", borderColor: "#ff6600" },
  sortChipText: { fontSize: 12, color: "#6b7280", fontWeight: "600" },
  sortChipTextActive: { color: "#ff6600", fontWeight: "800" },

  // ── Card ──
  cardWrap: { paddingHorizontal: 14, marginBottom: 12 },

  // ── Empty ──
  emptyWrap: {
    alignItems: "center", paddingVertical: 50,
    marginHorizontal: 14,
    backgroundColor: "#fff", borderRadius: 20,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#111" },
  emptySubtitle: {
    color: "#9ca3af", fontSize: 13, marginTop: 8,
    textAlign: "center", paddingHorizontal: 24, lineHeight: 20,
  },
  emptyAction: {
    marginTop: 18, backgroundColor: "#ff6600",
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 50,
  },
  emptyActionText: { color: "#fff", fontWeight: "800", fontSize: 14 },

  // ── Footer ──
  footer: { alignItems: "center", paddingVertical: 20 },
  footerText: { color: "#d1d5db", fontSize: 12, fontWeight: "600" },

  // ── Skeleton ──
  skeletonCard: {
    backgroundColor: "#fff", borderRadius: 20, overflow: "hidden",
    marginHorizontal: 14, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  skeletonImage: { width: "100%", height: 150, backgroundColor: "#e5e7eb" },
  skeletonBody: { padding: 14 },
  skeletonLine: { height: 13, borderRadius: 7, backgroundColor: "#e5e7eb", width: "75%" },
});