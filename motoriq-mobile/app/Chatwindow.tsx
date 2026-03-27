import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Image,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../src/services/api";
import useAuth from "../src/hooks/useAuth";
import { socket } from "../src/socket";
import BottomBar from "../src/components/BottomBar";

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function SkeletonItem() {
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
    <Animated.View style={[styles.skeletonItem, { opacity: anim }]}>
      <View style={styles.skeletonAvatar} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "60%" }]} />
      </View>
    </Animated.View>
  );
}

// ─── Fade-in wrapper ──────────────────────────────────────────────────────────
function FadeInItem({ children, delay = 0 }: any) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 80, friction: 10, delay, useNativeDriver: true }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Chat list item ──────────────────────────────────────────────────────────
function ChatItem({ chat, userId, onPress, index }: any) {
  // Get other user
  const otherUser = chat.users?.find((u: any) => {
    const uid = typeof u === "object" ? u._id : u;
    return String(uid) !== String(userId);
  });
  const otherName = typeof otherUser === "object" ? otherUser.name : "User";

  // Vehicle info
  const vehicle = chat.vehicle;
  const vehicleName = vehicle && typeof vehicle === "object"
    ? `${vehicle.brand || ""} ${vehicle.model || ""}`.trim()
    : null;
  const vehicleImg = vehicle && typeof vehicle === "object" && vehicle.images?.length > 0
    ? vehicle.images[0]
    : null;

  // Last message processing
  const lastMsg = chat.messages?.length > 0 ? chat.messages[chat.messages.length - 1] : null;

  let lastText = "No messages yet";
  if (lastMsg) {
    if (lastMsg.text) lastText = lastMsg.text;
    else if (lastMsg.image) lastText = "📷 Image attachment";
  }

  const lastTime = lastMsg?.createdAt
    ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const lastDate = lastMsg?.createdAt ? formatRelativeDate(new Date(lastMsg.createdAt)) : "";

  // Unread count
  const unreadCount = chat.messages?.filter((m: any) => {
    const sid = typeof m.sender === "object" ? m.sender._id : m.sender;
    const read = m.readBy?.some((id: any) => String(id) === String(userId));
    return String(sid) !== String(userId) && !read;
  }).length || 0;

  // Is last message from me?
  const lastSenderId = lastMsg && lastMsg.sender ? (typeof lastMsg.sender === "object" ? lastMsg.sender._id : lastMsg.sender) : null;
  const isLastMine = lastSenderId ? String(lastSenderId) === String(userId) : false;

  return (
    <FadeInItem delay={index * 40}>
      <TouchableOpacity
        style={[styles.chatItem, unreadCount > 0 && styles.chatItemUnread]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.chatAvatarWrap}>
          {vehicleImg ? (
            <Image source={{ uri: vehicleImg }} style={styles.chatAvatar} />
          ) : (
            <View style={[styles.chatAvatar, styles.chatAvatarFallback]}>
              <Text style={{ fontSize: 20 }}>💬</Text>
            </View>
          )}
          {unreadCount > 0 && (
            <View style={styles.chatUnreadDot}>
              <Text style={styles.chatUnreadDotText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatTopRow}>
            <Text style={[styles.chatName, unreadCount > 0 && styles.chatNameUnread]} numberOfLines={1}>
              {otherName}
            </Text>
            <Text style={[styles.chatTime, unreadCount > 0 && styles.chatTimeUnread]}>
              {lastDate || lastTime}
            </Text>
          </View>
          {vehicleName && (
            <Text style={styles.chatVehicle} numberOfLines={1}>
              🚗 {vehicleName}
            </Text>
          )}
          <Text
            style={[styles.chatLastMsg, unreadCount > 0 && styles.chatLastMsgUnread]}
            numberOfLines={1}
          >
            {isLastMine ? "You: " : ""}{lastText}
          </Text>
        </View>
        <Text style={styles.chatArrow}>›</Text>
      </TouchableOpacity>
    </FadeInItem>
  );
}

// ─── Helper: relative date ───────────────────────────────────────────────────
function formatRelativeDate(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.emptyWrap, { opacity: fade, transform: [{ scale }] }]}>
      <View style={styles.emptyIconWrap}>
        <Text style={styles.emptyIcon}>💬</Text>
        <View style={styles.emptyIconPulse} />
      </View>
      <Text style={styles.emptyTitle}>No Conversations Yet</Text>
      <Text style={styles.emptySubtitle}>
        Browse vehicles and chat with sellers to start a conversation.
      </Text>
      <TouchableOpacity style={styles.browseBtn} onPress={onBrowse} activeOpacity={0.85}>
        <Text style={styles.browseBtnText}>🚗 Browse Vehicles</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CHAT LIST SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatList() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [])
  );

  const fetchChats = async (isRefresh = false) => {
    const t = await AsyncStorage.getItem("token");
    if (!t) return router.replace("/login");

    if (isRefresh) setRefreshing(true);
    else if (!chats.length) setLoading(true); // only show global loading if initially empty

    try {
      const res = await API.get("/chat", { headers: { Authorization: t } });
      setChats(res.data || []);
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Listen to real-time incoming messages to instantly bump the list and unread count
    const onReceive = (msg: any) => fetchChats(false);
    const onRead = () => fetchChats(false);
    
    socket.on("receiveMessage", onReceive);
    socket.on("messagesRead", onRead);
    socket.on("messageRead", onRead);
    
    return () => { 
      socket.off("receiveMessage", onReceive);
      socket.off("messagesRead", onRead);
      socket.off("messageRead", onRead);
    };
  }, []);

  const onRefresh = () => fetchChats(true);
  const openChat = (chat: any) => router.push(`/chat/${chat._id}`);

  const totalUnread = user ? chats.reduce((sum, chat) => {
    const count = chat.messages?.filter((m: any) => {
      const sid = typeof m.sender === "object" ? m.sender._id : m.sender;
      const read = m.readBy?.some((id: any) => String(id) === String(user.id));
      return String(sid) !== String(user.id) && !read;
    }).length || 0;
    return sum + count;
  }, 0) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      {/* ══ HERO HEADER ════════════════════════════════════════════════════ */}
      <View style={styles.hero}>
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.heroInner}>
          <View>
            <Text style={styles.heroTitle}>💬 Messages</Text>
            <Text style={styles.heroSub}>Your conversations</Text>
          </View>
          {!loading && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {chats.length} {chats.length === 1 ? "chat" : "chats"}
                {totalUnread > 0 ? ` · ${totalUnread} new` : ""}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ══ LOADING SKELETONS ══════════════════════════════════════════════ */}
      {loading ? (
        <View style={{ padding: 14, gap: 12 }}>
          {[1, 2, 3, 4, 5].map(i => <SkeletonItem key={i} />)}
        </View>
      ) : chats.length === 0 ? (
        <EmptyState onBrowse={() => router.replace("/home")} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff6600" colors={["#ff6600"]} />}
          renderItem={({ item, index }) => (
            <ChatItem chat={item} userId={user?.id} onPress={() => openChat(item)} index={index} />
          )}
          ListFooterComponent={() => (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {chats.length} conversation{chats.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        />
      )}
      <BottomBar activeRoute="/Chatwindow" />
    </View>
  );
}

const styles = StyleSheet.create({
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
  heroInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  heroSub: { color: "#9ca3af", fontSize: 13, marginTop: 4 },
  countBadge: { backgroundColor: "#ff6600", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  countBadgeText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  listContent: { padding: 14, paddingBottom: 130, gap: 8 },
  chatItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 18,
    padding: 14, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  chatItemUnread: { backgroundColor: "#fffbf7", borderWidth: 1, borderColor: "rgba(255,102,0,0.12)" },
  chatAvatarWrap: { position: "relative" },
  chatAvatar: { width: 52, height: 52, borderRadius: 16, overflow: "hidden" },
  chatAvatarFallback: { backgroundColor: "#fff3eb", alignItems: "center", justifyContent: "center" },
  chatUnreadDot: {
    position: "absolute", top: -4, right: -4, backgroundColor: "#ef4444", borderRadius: 10,
    minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
    borderWidth: 2, borderColor: "#fff",
  },
  chatUnreadDotText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  chatContent: { flex: 1, gap: 2 },
  chatTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  chatName: { fontSize: 15, fontWeight: "700", color: "#111", flex: 1 },
  chatNameUnread: { fontWeight: "800" },
  chatTime: { fontSize: 11, color: "#9ca3af", fontWeight: "500" },
  chatTimeUnread: { color: "#ff6600", fontWeight: "700" },
  chatVehicle: { fontSize: 11, color: "#9ca3af", fontWeight: "500" },
  chatLastMsg: { fontSize: 13, color: "#9ca3af", marginTop: 2 },
  chatLastMsgUnread: { color: "#374151", fontWeight: "600" },
  chatArrow: { fontSize: 22, color: "#d1d5db", fontWeight: "300" },
  footer: { alignItems: "center", paddingVertical: 16 },
  footerText: { color: "#d1d5db", fontSize: 12, fontWeight: "600" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, paddingTop: 60 },
  emptyIconWrap: { position: "relative", marginBottom: 24, alignItems: "center", justifyContent: "center" },
  emptyIcon: { fontSize: 64 },
  emptyIconPulse: { position: "absolute", width: 90, height: 90, borderRadius: 45, backgroundColor: "#ff6600", opacity: 0.08 },
  emptyTitle: { fontSize: 22, fontWeight: "800", color: "#111", letterSpacing: -0.4, marginBottom: 10 },
  emptySubtitle: { fontSize: 14, color: "#9ca3af", textAlign: "center", lineHeight: 22, marginBottom: 32 },
  browseBtn: { backgroundColor: "#ff6600", paddingVertical: 15, paddingHorizontal: 36, borderRadius: 50, shadowColor: "#ff6600", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  browseBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  skeletonItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 18, padding: 14, gap: 12 },
  skeletonAvatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#e5e7eb" },
  skeletonLine: { height: 14, borderRadius: 7, backgroundColor: "#e5e7eb", width: "80%" },
});