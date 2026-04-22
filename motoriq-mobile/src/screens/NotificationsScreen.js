import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Pressable,
} from "react-native";
import API from "../services/api";
import { socket } from "../socket";
import { useTheme } from "../context/ThemeContext";

const NOTIF_ICONS = {
  message:          "💬",
  alert:            "⚠️",
  banned:           "🚫",
  price:            "💰",
  favorite:         "❤️",
  system:           "🔔",
  vehicle_approved: "✅",
};

export default function NotificationsScreen({ navigation }) {
  const { theme: t } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);

  /* ── fetch ── */
  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res  = await API.get("/notifications");
      const data = res.data;
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      } else {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotifications();
    const handleNew = (notif) => {
      setNotifications((p) => [notif, ...p]);
      setUnreadCount((c) => c + 1);
    };
    socket.on("newNotification", handleNew);
    return () => socket.off("newNotification", handleNew);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(true);
  }, []);

  /* ── actions ── */
  const markRead = async (id) => {
    try {
      await API.put(`/notifications/read/${id}`);
      setNotifications((p) => p.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications((p) => p.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      Alert.alert("Error", "Failed to mark all as read");
    }
  };

  const deleteNotif = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications((p) => p.filter((n) => n._id !== id));
    } catch {
      Alert.alert("Error", "Failed to delete");
    }
  };

  const clearAll = () =>
    Alert.alert("Clear All", "Delete all notifications?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            await API.delete("/notifications");
            setNotifications([]);
            setUnreadCount(0);
          } catch {
            Alert.alert("Error", "Failed to clear");
          }
        },
      },
    ]);

  const handlePress = async (notif) => {
    if (!notif.read) await markRead(notif._id);
    const link = notif.link || "/";
    if (link.includes("inbox"))   navigation?.navigate("Inbox");
    else if (link.includes("account")) navigation?.navigate("Account");
  };

  /* ── render item ── */
  const renderItem = ({ item }) => (
    <Pressable
      onPress={() => handlePress(item)}
      onLongPress={() =>
        Alert.alert("Notification", "", [
          { text: "Mark as Read", onPress: () => markRead(item._id) },
          { text: "Delete", style: "destructive", onPress: () => deleteNotif(item._id) },
          { text: "Cancel", style: "cancel" },
        ])
      }
      style={({ pressed }) => [
        styles.item,
        {
          backgroundColor: pressed
            ? t.bgGlassHover
            : item.read
            ? t.bgCard
            : t.isDark
            ? "rgba(249,115,22,0.08)"
            : "rgba(249,115,22,0.05)",
          borderLeftColor: item.read ? "transparent" : t.primary,
          borderLeftWidth: 3,
        },
      ]}
    >
      <Text style={styles.icon}>{NOTIF_ICONS[item.type] || NOTIF_ICONS.system}</Text>

      <View style={styles.content}>
        {item.title ? (
          <Text style={[styles.title, { color: t.textPrimary }]}>{item.title}</Text>
        ) : null}
        <Text style={[styles.text, { color: item.read ? t.textMuted : t.textPrimary }]}>
          {item.text}
        </Text>
        {item.createdAt ? (
          <Text style={[styles.time, { color: t.textMuted }]}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        ) : null}
      </View>

      {!item.read && <View style={[styles.dot, { backgroundColor: t.primary }]} />}
    </Pressable>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.bgBody }]}>
        <ActivityIndicator size="large" color={t.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.bgBody }]}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: t.navBg, borderBottomColor: t.borderSubtle }]}>
        <View>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>
            🔔 Notifications
          </Text>
          {unreadCount > 0 && (
            <Text style={[styles.unreadLabel, { color: t.primary }]}>
              {unreadCount} unread
            </Text>
          )}
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead}
              style={[styles.headerBtn, { backgroundColor: t.primaryGlow }]}>
              <Text style={[styles.headerBtnText, { color: t.primary }]}>Mark all read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAll}
              style={[styles.headerBtn, { backgroundColor: t.chipBg }]}>
              <Text style={[styles.headerBtnText, { color: t.textMuted }]}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No Notifications</Text>
          <Text style={[styles.emptyText, { color: t.textMuted }]}>
            You're all caught up! Check back later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} />
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: t.borderSubtle }]} />
          )}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered:  { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  headerTitle:   { fontSize: 20, fontWeight: "800" },
  unreadLabel:   { fontSize: 12, marginTop: 2, fontWeight: "600" },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  headerBtnText: { fontSize: 12, fontWeight: "700" },

  separator: { height: 1, marginHorizontal: 16 },

  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  icon:    { fontSize: 22, marginRight: 12, marginTop: 2 },
  content: { flex: 1 },
  title:   { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  text:    { fontSize: 13, lineHeight: 18 },
  time:    { fontSize: 11, marginTop: 4 },
  dot: {
    width: 8, height: 8,
    borderRadius: 4,
    marginTop: 6, marginLeft: 8,
  },

  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  emptyText:  { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
