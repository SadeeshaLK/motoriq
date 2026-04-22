// src/screens/InboxScreen.js
// Full chat list + chat window — mirrors web ChatWindow & Inbox upgrades.
// Features: search, unread badge, last message preview, timestamps,
//           delete conversation (long press), empty state.

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../services/api";
import useAuth from "../hooks/useAuth";
import { socket } from "../socket";
import { useTheme } from "../context/ThemeContext";

/* ── helper ──────────────────────────────────────────────────────────────── */

function relativeTime(date) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getUnread(chat, userId) {
  if (!chat.messages || !userId) return 0;
  return chat.messages.filter((m) => {
    const sid = typeof m.sender === "object" ? m.sender._id : m.sender;
    return String(sid) !== String(userId) && !m.readBy?.some((id) => String(id) === String(userId));
  }).length;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* INBOX SCREEN                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function InboxScreen({ navigation }) {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const t = theme;

  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeChat, setActiveChat] = useState(null);

  /* ── fetch ── */
  const fetchChats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await API.get("/chat");
      setChats(res.data);
    } catch (e) {
      console.error("fetchChats error:", e);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchChats(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChats(true);
  }, []);

  /* ── delete chat ── */
  const handleDeleteChat = (chatId) => {
    Alert.alert("Delete Conversation", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await API.delete(`/chat/${chatId}`);
            setChats((prev) => prev.filter((c) => c._id !== chatId));
            if (activeChat?._id === chatId) setActiveChat(null);
          } catch {
            Alert.alert("Error", "Failed to delete chat");
          }
        },
      },
    ]);
  };

  const filtered = chats.filter((c) => {
    if (!search.trim()) return true;
    const other = c.users?.find((u) => u._id !== user?.id);
    const veh = `${c.vehicle?.brand || ""} ${c.vehicle?.model || ""}`;
    return (
      other?.name?.toLowerCase().includes(search.toLowerCase()) ||
      veh.toLowerCase().includes(search.toLowerCase())
    );
  });

  /* ── if a chat is open, show ChatWindow ── */
  if (activeChat) {
    return (
      <ChatWindow
        chat={activeChat}
        user={user}
        token={token}
        theme={theme}
        onBack={() => setActiveChat(null)}
        onDeleteChat={() => { handleDeleteChat(activeChat._id); }}
        navigation={navigation}
      />
    );
  }

  /* ── CHAT LIST ── */
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: t.bgBody }]}>
        <ActivityIndicator color={t.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: t.bgBody }]}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: t.navBg, borderBottomColor: t.borderSubtle }]}>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>💬 Messages</Text>
        <View style={[styles.unreadPill, { backgroundColor: t.primaryGlow }]}>
          <Text style={[styles.unreadPillText, { color: t.primary }]}>{chats.length}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: t.bgCard, borderBottomColor: t.borderSubtle }]}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search conversations..."
          placeholderTextColor={t.textMuted}
          style={[styles.searchInput, { backgroundColor: t.bgInput, color: t.textPrimary, borderColor: t.borderInput }]}
        />
      </View>

      {/* Empty state */}
      {filtered.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No conversations yet</Text>
          <Text style={[styles.emptyText, { color: t.textMuted }]}>Browse vehicles and message sellers to get started.</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} />}
        renderItem={({ item }) => {
          const other = item.users?.find((u) => u._id !== user?.id);
          const unread = getUnread(item, user?.id);
          const lastMsg = item.messages?.slice(-1)[0];
          const lastText = lastMsg?.text ? (lastMsg.text.length > 38 ? lastMsg.text.slice(0, 38) + "…" : lastMsg.text) : "No messages yet";
          const lastTime = relativeTime(lastMsg?.createdAt || item.updatedAt);

          return (
            <Pressable
              onPress={() => setActiveChat(item)}
              onLongPress={() =>
                Alert.alert("Options", "", [
                  { text: "Delete Conversation", style: "destructive", onPress: () => handleDeleteChat(item._id) },
                  { text: "Cancel", style: "cancel" },
                ])
              }
              style={({ pressed }) => [
                styles.chatItem,
                { backgroundColor: pressed ? t.bgGlassHover : t.bgCard, borderBottomColor: t.borderSubtle },
              ]}
            >
              {/* Avatar */}
              <View style={[styles.avatar, { backgroundColor: t.primary }]}>
                <Text style={styles.avatarText}>{other?.name?.[0]?.toUpperCase() || "?"}</Text>
              </View>

              <View style={styles.chatMeta}>
                <View style={styles.chatMetaRow}>
                  <Text style={[styles.chatName, { color: t.textPrimary }]} numberOfLines={1}>
                    {other?.name || "Unknown"}
                  </Text>
                  <Text style={[styles.chatTime, { color: t.textMuted }]}>{lastTime}</Text>
                </View>
                <Text style={[styles.chatSub, { color: t.textMuted }]} numberOfLines={1}>
                  {item.vehicle?.brand} {item.vehicle?.model}
                </Text>
                <Text
                  style={[styles.chatPreview, { color: unread > 0 ? t.textPrimary : t.textMuted, fontWeight: unread > 0 ? "700" : "400" }]}
                  numberOfLines={1}
                >
                  {lastText}
                </Text>
              </View>

              {unread > 0 && (
                <View style={[styles.badge, { backgroundColor: t.primary }]}>
                  <Text style={styles.badgeText}>{unread}</Text>
                </View>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* CHAT WINDOW                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function ChatWindow({ chat, user, token, theme: t, onBack, onDeleteChat, navigation }) {
  const [messages, setMessages] = useState(Array.isArray(chat?.messages) ? chat.messages : []);
  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [online, setOnline] = useState(false);
  const [sending, setSending] = useState(false);

  const flatRef = useRef();
  const otherUser = chat?.users?.find((u) => u._id !== user?.id);

  /* ── join chat room ── */
  useEffect(() => {
    socket.emit("joinChat", chat._id);
    // mark all read
    API.put(`/chat/read-all/${chat._id}`).catch(() => {});
  }, []);

  /* ── socket listeners ── */
  useEffect(() => {
    const onReceive = (msg) => { if (msg?.text) setMessages((p) => [...p, msg]); };
    const onTyping = (d) => {
      if (d?.userId === user?.id) return;
      setTypingUser(d?.name);
      setTimeout(() => setTypingUser(null), 2000);
    };
    const onRead = (d) => setMessages((p) => p.map((m) => ({ ...m, readBy: [...(m.readBy || []), d.userId] })));
    const onOnline = (s) => setOnline(s);
    const onDeleted = ({ messageId }) => setMessages((p) => p.filter((m) => m._id !== messageId));

    socket.on("receiveMessage", onReceive);
    socket.on("typing", onTyping);
    socket.on("messagesRead", onRead);
    socket.on("onlineStatus", onOnline);
    socket.on("messageDeleted", onDeleted);

    return () => {
      socket.off("receiveMessage", onReceive);
      socket.off("typing", onTyping);
      socket.off("messagesRead", onRead);
      socket.off("onlineStatus", onOnline);
      socket.off("messageDeleted", onDeleted);
    };
  }, [user]);

  /* ── auto-scroll ── */
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  /* ── send message ── */
  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await API.post(`/chat/${chat._id}`, { text });
      const newMsg = res.data?.message;
      if (newMsg) {
        socket.emit("sendMessage", { chatId: chat._id, message: newMsg });
      }
      setText("");
    } catch (e) {
      Alert.alert("Error", "Failed to send message");
    }
    setSending(false);
  };

  /* ── delete message ── */
  const deleteMessage = (msgId) => {
    Alert.alert("Delete Message", "Delete this message?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await API.delete(`/chat/${chat._id}/message/${msgId}`);
            setMessages((p) => p.filter((m) => m._id !== msgId));
          } catch {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  /* ── typing event ── */
  const handleTyping = (val) => {
    setText(val);
    socket.emit("typing", { chatId: chat._id, userId: user?.id, name: user?.name });
  };

  /* ── header menu ── */
  const showMenu = () => {
    const options = ["View Vehicle Listing", "View Seller Profile", "Delete Conversation", "Cancel"];
    Alert.alert("Options", "", [
      { text: "🚗 View Vehicle Listing", onPress: () => navigation?.navigate("VehicleDetails", { id: chat.vehicle?._id }) },
      { text: "👤 View Seller Profile", onPress: () => navigation?.navigate("SellerProfile", { id: otherUser?._id }) },
      { text: "🗑 Delete Conversation", style: "destructive", onPress: onDeleteChat },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderMessage = ({ item: m }) => {
    const senderId = typeof m.sender === "object" ? m.sender._id : m.sender;
    const mine = String(senderId) === String(user?.id);
    const seen = m.readBy?.some((id) => String(id) !== String(user?.id));
    const time = new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
      <Pressable
        onLongPress={() => {
          if (mine) {
            Alert.alert("Message", "", [
              { text: "📋 Copy", onPress: () => {} },
              { text: "🗑 Delete", style: "destructive", onPress: () => m._id && deleteMessage(m._id) },
              { text: "Cancel", style: "cancel" },
            ]);
          }
        }}
        style={[styles.msgRow, mine ? styles.msgRowMine : styles.msgRowTheirs]}
      >
        <View
          style={[
            styles.bubble,
            mine
              ? { backgroundColor: t.primary, borderBottomRightRadius: 4 }
              : { backgroundColor: t.bgCard, borderColor: t.borderGlass, borderWidth: 1, borderBottomLeftRadius: 4 },
          ]}
        >
          <Text style={[styles.bubbleText, { color: mine ? "#fff" : t.textPrimary }]}>{m.text}</Text>
          <View style={styles.bubbleMeta}>
            <Text style={[styles.bubbleTime, { color: mine ? "rgba(255,255,255,0.7)" : t.textMuted }]}>{time}</Text>
            {mine && <Text style={[styles.bubbleSeen, { color: "rgba(255,255,255,0.7)" }]}>{seen ? " ✔✔" : " ✔"}</Text>}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: t.bgBody }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.cwHeader, { backgroundColor: t.navBg, borderBottomColor: t.borderSubtle }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: t.primary }]}>←</Text>
        </TouchableOpacity>

        <View style={[styles.cwAvatar, { backgroundColor: t.primary }]}>
          <Text style={styles.cwAvatarText}>{otherUser?.name?.[0]?.toUpperCase() || "?"}</Text>
        </View>

        <View style={styles.cwHeaderInfo}>
          <Text style={[styles.cwHeaderName, { color: t.textPrimary }]}>{otherUser?.name || "Chat"}</Text>
          <Text style={[styles.cwHeaderSub, { color: online ? t.green : t.textMuted }]}>
            {online ? "● Online" : `${chat.vehicle?.brand} ${chat.vehicle?.model}`}
          </Text>
        </View>

        <TouchableOpacity onPress={showMenu} style={styles.menuBtn}>
          <Text style={[styles.menuDots, { color: t.textSecondary }]}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages.filter((m) => m && m.text)}
        keyExtractor={(m, i) => m._id || String(i)}
        renderItem={renderMessage}
        contentContainerStyle={[styles.msgList, { backgroundColor: t.bgBody }]}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatIcon}>👋</Text>
            <Text style={[styles.emptyChatText, { color: t.textMuted }]}>Start the conversation!</Text>
          </View>
        }
        ListFooterComponent={
          typingUser ? (
            <View style={styles.typingWrap}>
              <Text style={[styles.typingText, { color: t.textMuted }]}>••• {typingUser} is typing...</Text>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={[styles.inputBar, { backgroundColor: t.bgCard, borderTopColor: t.borderSubtle }]}>
        <TextInput
          value={text}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          placeholderTextColor={t.textMuted}
          style={[styles.msgInput, { backgroundColor: t.bgInput, color: t.textPrimary, borderColor: t.borderInput }]}
          multiline
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!text.trim() || sending}
          style={[styles.sendBtn, { backgroundColor: text.trim() && !sending ? t.primary : t.chipBg, opacity: !text.trim() ? 0.5 : 1 }]}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={[styles.sendBtnText, { color: text.trim() ? "#fff" : t.textMuted }]}>Send</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    paddingTop: 54,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "800" },
  unreadPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  unreadPillText: { fontSize: 13, fontWeight: "700" },

  // Search
  searchWrap: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    borderWidth: 1,
  },

  // Chat item (list)
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 17 },
  chatMeta: { flex: 1 },
  chatMetaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  chatName: { fontSize: 15, fontWeight: "700", flex: 1, marginRight: 8 },
  chatTime: { fontSize: 11 },
  chatSub: { fontSize: 11, marginBottom: 2 },
  chatPreview: { fontSize: 13 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    marginLeft: 8,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  // Empty
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 19, fontWeight: "800", marginBottom: 8 },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 20 },

  // Chat window header
  cwHeader: {
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, marginRight: 4 },
  backArrow: { fontSize: 24, fontWeight: "600" },
  cwAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cwAvatarText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  cwHeaderInfo: { flex: 1 },
  cwHeaderName: { fontSize: 15, fontWeight: "700" },
  cwHeaderSub: { fontSize: 11, marginTop: 1 },
  menuBtn: { padding: 8 },
  menuDots: { fontSize: 22, fontWeight: "700" },

  // Messages
  msgList: { padding: 14, paddingBottom: 24 },
  msgRow: { marginBottom: 10 },
  msgRowMine: { alignItems: "flex-end" },
  msgRowTheirs: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleMeta: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4 },
  bubbleTime: { fontSize: 10 },
  bubbleSeen: { fontSize: 10 },

  // Typing
  typingWrap: { paddingLeft: 16, paddingBottom: 4 },
  typingText: { fontSize: 12, fontStyle: "italic" },

  // Empty chat
  emptyChat: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  emptyChatIcon: { fontSize: 44, marginBottom: 12 },
  emptyChatText: { fontSize: 14 },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
    gap: 8,
  },
  msgInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 64,
  },
  sendBtnText: { fontWeight: "700", fontSize: 14 },
});
