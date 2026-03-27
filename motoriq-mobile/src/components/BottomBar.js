import { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter, usePathname } from "expo-router";

const { width } = Dimensions.get("window");

// ─── SVG-style icons as Unicode / text glyphs ────────────────────────────────
// Using emoji + text combos that render crisply on both platforms.
// Swap these out for react-native-vector-icons or expo/vector-icons if available.

const TAB_ITEMS = [
  {
    key: "home",
    route: "/home",
    label: "Browse",
    icon: "🚗",
    activeIcon: "🚗",
  },
  {
    key: "search",
    route: "/search",
    label: "Search",
    icon: "🔍",
    activeIcon: "🔍",
  },
  {
    key: "post",
    route: "/Addvehicle",
    label: "Post Ad",
    icon: null, // special center CTA button
    activeIcon: null,
    isCta: true,
  },
  {
    key: "chat",
    route: "/Chatwindow",
    label: "Chat",
    icon: "💬",
    activeIcon: "💬",
  },
  {
    key: "account",
    route: "/Account",
    label: "Account",
    icon: "👤",
    activeIcon: "👤",
  },
];

// ─── Individual tab item ──────────────────────────────────────────────────────
function TabItem({ item, isActive, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dotAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const labelAnim = useRef(new Animated.Value(isActive ? 1 : 0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(dotAnim, {
        toValue: isActive ? 1 : 0,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.spring(labelAnim, {
        toValue: isActive ? 1 : 0.8,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
    ]).start();
  }, [isActive]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.82,
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 5,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[styles.tabIconWrap, { transform: [{ scale: scaleAnim }] }]}
      >
        {/* Active pill background */}
        <Animated.View
          style={[
            styles.activePill,
            {
              opacity: dotAnim,
              transform: [{ scaleX: dotAnim }, { scaleY: dotAnim }],
            },
          ]}
        />

        {/* Icon */}
        <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
          {isActive ? item.activeIcon : item.icon}
        </Text>
      </Animated.View>

      {/* Label */}
      <Animated.Text
        style={[
          styles.tabLabel,
          isActive && styles.tabLabelActive,
          { transform: [{ scale: labelAnim }] },
        ]}
      >
        {item.label}
      </Animated.Text>

      {/* Active dot */}
      <Animated.View
        style={[
          styles.activeDot,
          {
            opacity: dotAnim,
            transform: [{ scale: dotAnim }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

// ─── CTA Post Button (center) ─────────────────────────────────────────────────
function CtaButton({ onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Animated.parallel([
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.88,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    onPress();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  return (
    <View style={styles.ctaWrap}>
      {/* Glow ring */}
      <View style={styles.ctaGlow} />

      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={styles.ctaTouchable}
      >
        <Animated.View
          style={[
            styles.ctaBtn,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Animated.Text
            style={[styles.ctaIcon, { transform: [{ rotate }] }]}
          >
            +
          </Animated.Text>
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.ctaLabel}>Post Ad</Text>
    </View>
  );
}

// ─── Main BottomBar component ─────────────────────────────────────────────────
export default function BottomBar({ activeRoute }) {
  const router = useRouter();
  const pathname = usePathname?.() ?? activeRoute ?? "/home";

  const handleNav = async (item) => {
    if (item.isCta) {
      const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
      const token = await AsyncStorage.getItem("token");
      if (!token) router.push("/login");
      else router.push(item.route);
      return;
    }
    router.push(item.route);
  };

  return (
    <View style={styles.container}>
      {/* Frosted glass background */}
      <View style={styles.bar}>
        {TAB_ITEMS.map((item) => {
          if (item.isCta) {
            return (
              <CtaButton
                key={item.key}
                onPress={() => handleNav(item)}
              />
            );
          }

          const isActive =
            pathname === item.route ||
            (item.route === "/home" && pathname === "/");

          return (
            <TabItem
              key={item.key}
              item={item}
              isActive={isActive}
              onPress={() => handleNav(item)}
            />
          );
        })}
      </View>

      {/* Safe area spacer for iPhone home indicator */}
      {Platform.OS === "ios" && <View style={styles.safeAreaSpacer} />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
  },

  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#ffffff",
    marginHorizontal: 12,
    marginBottom: Platform.OS === "ios" ? 8 : 10,
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

  safeAreaSpacer: {
    height: 20,
    backgroundColor: "#fff",
    marginHorizontal: 12,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  // ── Regular tab ──
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
    minHeight: 52,
  },

  tabIconWrap: {
    width: 44,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  activePill: {
    position: "absolute",
    width: 44,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff3eb",
  },

  tabIcon: {
    fontSize: 20,
    zIndex: 1,
    opacity: 0.45,
  },

  tabIconActive: {
    opacity: 1,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9ca3af",
    marginTop: 3,
    letterSpacing: 0.2,
  },

  tabLabelActive: {
    color: "#ff6600",
    fontWeight: "800",
  },

  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ff6600",
    marginTop: 3,
  },

  // ── CTA button ──
  ctaWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
    marginTop: -22, // lifts above the bar
  },

  ctaGlow: {
    position: "absolute",
    top: -4,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ff6600",
    opacity: 0.18,
    transform: [{ scale: 1.3 }],
  },

  ctaTouchable: {
    borderRadius: 28,
    shadowColor: "#ff6600",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },

  ctaBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ff6600",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },

  ctaIcon: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "300",
    lineHeight: 32,
    marginTop: -2,
  },

  ctaLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ff6600",
    marginTop: 4,
    letterSpacing: 0.2,
  },
});