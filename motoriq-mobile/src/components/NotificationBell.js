import React, { useEffect, useState, useRef } from "react";
import { TouchableOpacity, Text, StyleSheet, View, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { socket } from "../socket";
import API from "../services/api";

export default function NotificationBell({ style }) {
  const router = useRouter();
  const { theme: t } = useTheme();
  
  const [unreadCount, setUnreadCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial fetch of unread count
    API.get("/notifications")
      .then((res) => {
        const notifs = Array.isArray(res.data) ? res.data : (res.data?.notifications || []);
        setUnreadCount(notifs.filter((n) => !n.read).length);
      })
      .catch(() => {});

    // Listen for real-time notifications
    const handleNew = () => {
      setUnreadCount((c) => c + 1);
      // Bell wiggle animation
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    };

    socket.on("newNotification", handleNew);
    return () => socket.off("newNotification", handleNew);
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.8, useNativeDriver: true, tension: 200, friction: 5 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 5 }),
    ]).start();
    router.push("/Notifications");
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.btn,
        {
          backgroundColor: t.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          borderColor: t.borderGlass,
        },
        style,
      ]}
    >
      <Animated.Text style={[styles.icon, { transform: [{ scale: scaleAnim }] }]}>
        🔔
      </Animated.Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  icon: { fontSize: 18 },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
});
