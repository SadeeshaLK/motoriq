import { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useTheme } from "../context/ThemeContext";

const TAB_ITEMS = [
  { key: "home",          route: "/home",          label: "Browse",   icon: "🚗" },
  { key: "search",        route: "/search",         label: "Search",   icon: "🔍" },
  { key: "post",          route: "/Addvehicle",     label: "Post Ad",  icon: null,  isCta: true },
  { key: "notifications", route: "/Notifications",  label: "Alerts",   icon: "🔔" },
  { key: "account",       route: "/Account",        label: "Account",  icon: "👤" },
];

/* ── Tab item ──────────────────────────────────────────────────────────────── */
function TabItem({ item, isActive, onPress, theme: t }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dotAnim   = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const labelAnim = useRef(new Animated.Value(isActive ? 1 : 0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(dotAnim,   { toValue: isActive ? 1 : 0,   useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.spring(labelAnim, { toValue: isActive ? 1 : 0.8, useNativeDriver: true, tension: 120, friction: 8 }),
    ]).start();
  }, [isActive]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.82, useNativeDriver: true, tension: 200, friction: 5 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 5 }),
    ]).start();
    onPress();
  };

  const pillBg = t.isDark ? "rgba(249,115,22,0.15)" : "#fff3eb";

  return (
    <TouchableOpacity style={styles.tabItem} onPress={handlePress} activeOpacity={0.7}>
      <Animated.View style={[styles.tabIconWrap, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View
          style={[styles.activePill, { backgroundColor: pillBg, opacity: dotAnim, transform: [{ scaleX: dotAnim }, { scaleY: dotAnim }] }]}
        />
        <Text style={[styles.tabIcon, { opacity: isActive ? 1 : 0.45 }]}>{item.icon}</Text>
      </Animated.View>

      <Animated.Text
        style={[
          styles.tabLabel,
          { color: isActive ? t.primary : t.textMuted },
          { fontWeight: isActive ? "800" : "600" },
          { transform: [{ scale: labelAnim }] },
        ]}
      >
        {item.label}
      </Animated.Text>

      <Animated.View
        style={[styles.activeDot, { backgroundColor: t.primary, opacity: dotAnim, transform: [{ scale: dotAnim }] }]}
      />
    </TouchableOpacity>
  );
}

/* ── CTA button ───────────────────────────────────────────────────────────── */
function CtaButton({ onPress, theme: t }) {
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Animated.parallel([
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, tension: 200, friction: 5 }),
        Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 5 }),
      ]),
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
    onPress();
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] });

  return (
    <View style={styles.ctaWrap}>
      <View style={[styles.ctaGlow, { backgroundColor: t.primary }]} />
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={styles.ctaTouchable}>
        <Animated.View style={[styles.ctaBtn, { backgroundColor: t.primary, transform: [{ scale: scaleAnim }] }]}>
          <Animated.Text style={[styles.ctaIcon, { transform: [{ rotate }] }]}>+</Animated.Text>
        </Animated.View>
      </TouchableOpacity>
      <Text style={[styles.ctaLabel, { color: t.primary }]}>Post Ad</Text>
    </View>
  );
}

/* ── BottomBar ────────────────────────────────────────────────────────────── */
export default function BottomBar({ activeRoute }) {
  const router   = useRouter();
  const pathname = usePathname?.() ?? activeRoute ?? "/home";
  const { theme: t } = useTheme();

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

  const barBg  = t.isDark ? t.bgCard    : "#ffffff";
  const border = t.isDark ? t.borderGlass : "rgba(0,0,0,0.06)";

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { backgroundColor: barBg, borderColor: border }]}>
        {TAB_ITEMS.map((item) => {
          if (item.isCta) {
            return <CtaButton key={item.key} theme={t} onPress={() => handleNav(item)} />;
          }
          const isActive = pathname === item.route || (item.route === "/home" && pathname === "/");
          return (
            <TabItem
              key={item.key}
              item={item}
              isActive={isActive}
              theme={t}
              onPress={() => handleNav(item)}
            />
          );
        })}
      </View>
      {Platform.OS === "ios" && (
        <View style={[styles.safeAreaSpacer, { backgroundColor: barBg }]} />
      )}
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "transparent" },

  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
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
  },

  safeAreaSpacer: {
    height: 20,
    marginHorizontal: 12,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

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
  },
  tabIcon:  { fontSize: 20, zIndex: 1 },
  tabLabel: { fontSize: 10, marginTop: 3, letterSpacing: 0.2 },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },

  ctaWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 2,
    marginTop: -22,
  },
  ctaGlow: {
    position: "absolute",
    top: -4,
    width: 64,
    height: 64,
    borderRadius: 32,
    opacity: 0.18,
    transform: [{ scale: 1.3 }],
  },
  ctaTouchable: {
    borderRadius: 28,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  ctaBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  ctaIcon:  { fontSize: 28, color: "#fff", fontWeight: "300", lineHeight: 32, marginTop: -2 },
  ctaLabel: { fontSize: 10, fontWeight: "800", marginTop: 4, letterSpacing: 0.2 },
});