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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../services/api";
import { socket } from "../socket";

const NOTIF_ICONS = {
  message: "💬",
  alert: "⚠️",
  banned: "🚫",
  price: "💰",
  favorite: "❤️",
  system: "🔔",
  vehicle_approved: "✅",
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  /* ===== FETCH ===== */
  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await API.get("/notifications");
      const data = res.data;
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.read).length);
      } else {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotifications();

    /* Socket: receive new notif in real time */
    const handleNew = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("newNotification", handleNew);
    return () => socket.off("newNotification", handleNew);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(true);
  }, []);

  /* ===== MARK READ ===== */
  const markRead = async (id) => {
    try {
      await API.put(`/notifications/read/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  /* ===== MARK ALL READ ===== */
  const markAllRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      Alert.alert("Error", "Failed to mark all as read");
    }
  };

  /* ===== DELETE ===== */
  const deleteNotif = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
      Alert.alert("Error", "Failed to delete notification");
    }
  };

  /* ===== CLEAR ALL ===== */
  const clearAll = () => {
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
            Alert.alert("Error", "Failed to clear notifications");
          }
        },
      },
    ]);
  };

  /* ===== NAVIGATE ON PRESS ===== */
  const handlePress = async (notif) => {
    if (!notif.read) await markRead(notif._id);
    const link = notif.link || "/";
    if (link.includes("inbox")) navigation?.navigate("Inbox");
    else if (link.includes("account")) navigation?.navigate("Account");
    else if (link.includes("vehicle")) navigation?.navigate("Home");
  };

  /* ===== RENDER ITEM ===== */
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, !item.read && styles.itemUnread]}
      onPress={() => handlePress(item)}
      onLongPress={() =>
        Alert.alert("Notification", "What would you like to do?", [
          { text: "Mark as Read", onPress: () => markRead(item._id) },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteNotif(item._id),
          },
          { text: "Cancel", style: "cancel" },
        ])
      }
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>
        {NOTIF_ICONS[item.type] || NOTIF_ICONS.system}
      </Text>

      <View style={styles.content}>
        {item.title ? (
          <Text style={styles.title}>{item.title}</Text>
        ) : null}
        <Text style={[styles.text, item.read && styles.textRead]}>
          {item.text}
        </Text>
        {item.createdAt ? (
          <Text style={styles.time}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        ) : null}
      </View>

      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          🔔 Notifications{" "}
          {unreadCount > 0 && (
            <Text style={styles.badge}>{unreadCount}</Text>
          )}
        </Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAll} style={[styles.headerBtn, styles.clearBtn]}>
              <Text style={styles.clearBtnText}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>
            You're all caught up! Check back later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#f97316"
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf8f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#faf8f5",
  },

  /* Header */
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  badge: {
    fontSize: 14,
    fontWeight: "800",
    color: "#f97316",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(249,115,22,0.1)",
  },
  headerBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f97316",
  },
  clearBtn: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },

  /* List */
  list: {
    paddingBottom: 100,
    paddingTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.04)",
    marginHorizontal: 16,
  },

  /* Item */
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  itemUnread: {
    backgroundColor: "rgba(249,115,22,0.05)",
    borderLeftWidth: 3,
    borderLeftColor: "#f97316",
  },
  icon: {
    fontSize: 22,
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  text: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
  },
  textRead: {
    color: "#94a3b8",
  },
  time: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f97316",
    marginTop: 6,
    marginLeft: 8,
  },

  /* Empty state */
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
});
