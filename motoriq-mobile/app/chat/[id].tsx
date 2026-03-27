import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../src/services/api";
import useAuth from "../../src/hooks/useAuth";
import { socket } from "../../src/socket";

const { width: SCREEN_W } = Dimensions.get("window");

// ─── Emoji grid ───────────────────────────────────────────────────────────────
const EMOJI_ROWS = [
  ["😊","😂","❤️","👍","🔥","🎉","😍","🙏"],
  ["😎","🤔","😅","🥳","😭","😡","🤩","😴"],
  ["👋","🚗","💰","✅","❌","📞","📸","🎯"],
  ["💯","🏆","⭐","💪","🤝","👀","💬","🔔"],
];

// ─── Animated typing dots ─────────────────────────────────────────────────────
function TypingIndicator({ name }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: -5, duration: 300, delay: i * 140, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 300, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={s.typingRow}>
      <View style={s.typingBubble}>
        <Text style={s.typingName}>{name}</Text>
        <View style={s.dotsRow}>
          {dots.map((d, i) => (
            <Animated.View key={i} style={[s.dot, { transform: [{ translateY: d }] }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message, isOwn, userId }) {
  const seen = message.readBy?.some(id => String(id) !== String(userId));
  const time = new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
    hour: "2-digit", minute: "2-digit",
  });

  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 120, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      s.bubbleRow,
      isOwn ? s.bubbleRowOwn : s.bubbleRowOther,
      { opacity: fade, transform: [{ translateY: slide }] },
    ]}>
      <View style={[s.bubble, isOwn ? s.bubbleOwn : s.bubbleOther]}>
        <Text style={[s.bubbleText, isOwn && s.bubbleTextOwn]}>{message.text}</Text>
        <View style={s.bubbleMeta}>
          <Text style={[s.timeText, isOwn && s.timeTextOwn]}>{time}</Text>
          {isOwn && (
            <Text style={[s.receipt, seen && s.receiptSeen]}>
              {seen ? " ✔✔" : " ✔"}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Date separator ───────────────────────────────────────────────────────────
function DateSep({ label }) {
  return (
    <View style={s.dateSep}>
      <View style={s.dateLine} />
      <Text style={s.dateLabel}>{label}</Text>
      <View style={s.dateLine} />
    </View>
  );
}

// ─── Unread badge ─────────────────────────────────────────────────────────────
function UnreadBadge({ count }) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (count > 0) Animated.spring(scale, { toValue: 1, tension: 120, friction: 7, useNativeDriver: true }).start();
  }, [count]);
  if (!count) return null;
  return (
    <Animated.View style={[s.unreadBadge, { transform: [{ scale }] }]}>
      <Text style={s.unreadText}>{count > 99 ? "99+" : count}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function ChatConversation() {
  const router = useRouter();
  const { id: chatId } = useLocalSearchParams();
  const { user } = useAuth();

  const [chat,        setChat]        = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [text,        setText]        = useState("");
  const [typingUser,  setTypingUser]  = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [online,      setOnline]      = useState(false);
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(true);

  const scrollRef   = useRef(null);
  const typingTimer = useRef(null);

  // ── Fetch chat data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chatId || !user) return;

    const fetchChat = async () => {
      try {
        setLoading(true);
        const t = await AsyncStorage.getItem("token");
        if (!t) return;
        const res = await API.get("/chat", { headers: { Authorization: t } });
        const allChats = res.data || [];
        const found = allChats.find(c => c._id === chatId);
        if (found) {
          setChat(found);
          setMessages(Array.isArray(found.messages) ? found.messages : []);
          socket.emit("joinChat", found._id);
        }
      } catch (err) {
        console.error("Failed to fetch chat:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, [chatId, user]);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages]);

  // ── Mark all read ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chat || !user || messages.length === 0) return;
    const markRead = async () => {
      const t = await AsyncStorage.getItem("token");
      if (t) API.put(`/chat/read-all/${chat._id}`, {}, { headers: { Authorization: t } }).catch(() => {});
    };
    markRead();
  }, [chat]);

  // ── Unread count ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const n = messages.filter(m => {
      const sid = typeof m.sender === "object" ? m.sender._id : m.sender;
      const read = m.readBy?.some(id => String(id) === String(user.id));
      return String(sid) !== String(user.id) && !read;
    }).length;
    setUnreadCount(n);
  }, [messages, user]);

  // ── Socket listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    const onReceive = (msg) => { if (msg?.text) setMessages(p => [...p, msg]); };

    const onTyping = (data) => {
      if (!data || data.userId === user?.id) return;
      setTypingUser(data.name);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingUser(null), 2500);
    };

    const onRead = (data) => {
      setMessages(p => p.map(m => ({ ...m, readBy: [...(m.readBy || []), data.userId] })));
    };

    const onOnline = (status) => setOnline(status);

    socket.on("receiveMessage", onReceive);
    socket.on("typing",         onTyping);
    socket.on("messagesRead",   onRead);
    socket.on("onlineStatus",   onOnline);

    return () => {
      socket.off("receiveMessage", onReceive);
      socket.off("typing",         onTyping);
      socket.off("messagesRead",   onRead);
      socket.off("onlineStatus",   onOnline);
      clearTimeout(typingTimer.current);
    };
  }, [user]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!text.trim() || sending || !chat) return;
    const payload = text.trim();
    setText("");
    setShowEmoji(false);
    setSending(true);
    try {
      const t = await AsyncStorage.getItem("token");
      const res = await API.post(`/chat/${chat._id}`, { text: payload }, { headers: { Authorization: t } });
      const newMsg = res.data?.message;
      if (newMsg) socket.emit("sendMessage", { chatId: chat._id, message: newMsg });
    } catch {
      setText(payload);
    } finally {
      setSending(false);
    }
  };

  // ── Typing emit ────────────────────────────────────────────────────────────
  const handleTyping = (val) => {
    setText(val);
    if (chat) {
      socket.emit("typing", { chatId: chat._id, userId: user?.id, name: user?.name || user?.username });
    }
  };

  // ── Get other user's name ──────────────────────────────────────────────────
  const getOtherUserName = () => {
    if (!chat || !user) return "Chat";
    const other = chat.users?.find(u => {
      const uid = typeof u === "object" ? u._id : u;
      return String(uid) !== String(user.id);
    });
    if (typeof other === "object" && other?.name) return other.name;
    return chat.name || "Chat";
  };

  // ── Get vehicle info ──────────────────────────────────────────────────────
  const getVehicleInfo = () => {
    if (!chat?.vehicle) return null;
    const v = chat.vehicle;
    return typeof v === "object" ? `${v.brand || ""} ${v.model || ""}`.trim() : null;
  };

  const getVehicleImage = () => {
    if (!chat?.vehicle) return null;
    const v = chat.vehicle;
    if (typeof v === "object" && v.images?.length > 0) return v.images[0];
    return null;
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ff6600" />
        <Text style={{ marginTop: 12, color: "#9ca3af", fontSize: 14 }}>Loading conversation...</Text>
      </View>
    );
  }

  if (!chat || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 44 }}>😕</Text>
        <Text style={{ marginTop: 12, color: "#374151", fontSize: 16, fontWeight: "700" }}>Chat not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: "#ff6600", fontWeight: "700", fontSize: 15 }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const validMessages = messages.filter(m => m?.text);
  const otherName = getOtherUserName();
  const vehicleInfo = getVehicleInfo();
  const vehicleImg = getVehicleImage();

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >

        {/* ══ HEADER ════════════════════════════════════════════════════ */}
        <View style={s.header}>
          <View style={s.headerBlob} />

          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>

          <View style={s.headerCenter}>
            <View style={s.avatarWrap}>
              {vehicleImg ? (
                <Image source={{ uri: vehicleImg }} style={s.avatar} />
              ) : (
                <View style={s.avatar}>
                  <Text style={{ fontSize: 18 }}>💬</Text>
                </View>
              )}
              {online && <View style={s.onlineDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.headerName} numberOfLines={1}>{otherName}</Text>
              {vehicleInfo && (
                <Text style={s.headerVehicle} numberOfLines={1}>🚗 {vehicleInfo}</Text>
              )}
              <Text style={[s.headerStatus, online && { color: "#22c55e" }]}>
                {online ? "● Online" : "● Offline"}
              </Text>
            </View>
          </View>

          <UnreadBadge count={unreadCount} />
        </View>

        {/* ══ MESSAGES ══════════════════════════════════════════════════ */}
        <ScrollView
          ref={scrollRef}
          style={s.msgArea}
          contentContainerStyle={s.msgContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {validMessages.length === 0 && (
            <View style={s.emptyWrap}>
              <Text style={{ fontSize: 44 }}>💬</Text>
              <Text style={s.emptyTitle}>Start the conversation</Text>
              <Text style={s.emptySub}>Send a message below.</Text>
            </View>
          )}

          {validMessages.map((m, i) => {
            const sid   = typeof m.sender === "object" ? m.sender._id : m.sender;
            const isOwn = String(sid) === String(user.id);

            const currDate = new Date(m.createdAt).toDateString();
            const prevDate = i > 0 ? new Date(validMessages[i - 1].createdAt).toDateString() : null;

            return (
              <View key={i}>
                {currDate !== prevDate && <DateSep label={currDate} />}
                <MessageBubble message={m} isOwn={isOwn} userId={user.id} />
              </View>
            );
          })}

          {typingUser && <TypingIndicator name={typingUser} />}
        </ScrollView>

        {/* ══ EMOJI PICKER ══════════════════════════════════════════════ */}
        {showEmoji && (
          <View style={s.emojiPanel}>
            {EMOJI_ROWS.map((row, ri) => (
              <View key={ri} style={s.emojiRow}>
                {row.map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    style={s.emojiBtn}
                    onPress={() => setText(p => p + emoji)}
                  >
                    <Text style={s.emojiChar}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ══ INPUT BAR ═════════════════════════════════════════════════ */}
        <View style={s.inputBar}>
          <TouchableOpacity
            style={[s.iconBtn, showEmoji && s.iconBtnActive]}
            onPress={() => { setShowEmoji(v => !v); Keyboard.dismiss(); }}
          >
            <Text style={s.iconBtnEmoji}>😊</Text>
          </TouchableOpacity>

          <TextInput
            style={s.input}
            value={text}
            onChangeText={handleTyping}
            onSubmitEditing={sendMessage}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            returnKeyType="send"
            multiline
            maxLength={1000}
            onFocus={() => setShowEmoji(false)}
          />

          <TouchableOpacity
            style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnOff]}
            onPress={sendMessage}
            disabled={!text.trim() || sending}
            activeOpacity={0.85}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.sendArrow}>↑</Text>}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // Header
  header: {
    backgroundColor: "#111",
    paddingTop: Platform.OS === "ios" ? 56 : 34,
    paddingBottom: 14, paddingHorizontal: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
    overflow: "hidden", position: "relative",
  },
  headerBlob: {
    position: "absolute", top: -60, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: "#ff6600", opacity: 0.18,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  backBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#ff6600",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  onlineDot: {
    position: "absolute", bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: "#22c55e", borderWidth: 2, borderColor: "#111",
  },
  headerName: { color: "#fff", fontSize: 16, fontWeight: "800" },
  headerVehicle: { color: "#9ca3af", fontSize: 11, marginTop: 1 },
  headerStatus: { color: "#6b7280", fontSize: 11, marginTop: 1 },

  unreadBadge: {
    backgroundColor: "#ef4444", borderRadius: 10,
    minWidth: 20, height: 20,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 5,
  },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  // Messages
  msgArea: { flex: 1, backgroundColor: "#f3f4f6" },
  msgContent: { padding: 12, paddingBottom: 10 },

  emptyWrap: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#374151", marginTop: 12 },
  emptySub: { fontSize: 13, color: "#9ca3af", marginTop: 6 },

  // Date separator
  dateSep: { flexDirection: "row", alignItems: "center", marginVertical: 14, gap: 8 },
  dateLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dateLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600" },

  // Bubbles
  bubbleRow: { marginBottom: 5, flexDirection: "row" },
  bubbleRowOwn: { justifyContent: "flex-end" },
  bubbleRowOther: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: SCREEN_W * 0.72,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  bubbleOwn: { backgroundColor: "#ff6600", borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: "#fff", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: "#111", lineHeight: 21 },
  bubbleTextOwn: { color: "#fff" },
  bubbleMeta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 4, gap: 3 },
  timeText: { fontSize: 10, color: "#9ca3af" },
  timeTextOwn: { color: "rgba(255,255,255,0.6)" },
  receipt: { fontSize: 10, color: "rgba(255,255,255,0.6)" },
  receiptSeen: { color: "#a5f3fc" },

  // Typing
  typingRow: { flexDirection: "row", marginBottom: 8 },
  typingBubble: {
    backgroundColor: "#fff", borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", gap: 8,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  typingName: { fontSize: 12, color: "#9ca3af", fontWeight: "600" },
  dotsRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#d1d5db" },

  // Emoji
  emojiPanel: {
    backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#f3f4f6",
    padding: 10, paddingBottom: 6,
  },
  emojiRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 6 },
  emojiBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#f9fafb",
  },
  emojiChar: { fontSize: 22 },

  // Input bar
  inputBar: {
    flexDirection: "row", alignItems: "flex-end",
    backgroundColor: "#fff",
    paddingHorizontal: 10, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: "#f3f4f6",
    gap: 8,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  iconBtnActive: { backgroundColor: "#fff3eb" },
  iconBtnEmoji: { fontSize: 20 },
  input: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 22, borderWidth: 1.5, borderColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 15, color: "#111",
    maxHeight: 110, minHeight: 42,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#ff6600",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#ff6600", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
  },
  sendBtnOff: { backgroundColor: "#e5e7eb", shadowOpacity: 0 },
  sendArrow: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: -1 },
});
