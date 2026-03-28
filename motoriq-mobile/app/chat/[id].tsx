import React, { useState, useEffect, useRef, useCallback } from "react";
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
import * as ImagePicker from "expo-image-picker";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";

const { width: SCREEN_W } = Dimensions.get("window");

const EMOJI_ROWS = [
  ["😊", "😂", "❤️", "👍", "🔥", "🎉", "😍", "🙏"],
  ["😎", "🤔", "😅", "🥳", "😭", "😡", "🤩", "😴"],
  ["👋", "🚗", "💰", "✅", "❌", "📞", "📸", "🎯"],
  ["💯", "🏆", "⭐", "💪", "🤝", "👀", "💬", "🔔"],
];

// ─── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator({ name }: { name: string }) {
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
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
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

// ─── Swipeable Message Bubble ──────────────────────────────────────────────
function MessageBubble({ message, isOwn, userId, onReply }: any) {
  const seen = message.readBy?.some((id: any) => String(id) !== String(userId));
  const time = new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, tension: 120, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const renderRightActions = (progress: any, dragX: any) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: "clamp",
    });
    return (
      <Animated.View style={[s.replyAction, { transform: [{ translateX: trans }] }]}>
        <View style={s.replyIconWrap}>
          <Text style={s.replyIcon}>↩️</Text>
        </View>
      </Animated.View>
    );
  };

  const handleSwipeOpen = () => {
    onReply(message);
  };

  const renderBubbleContent = () => (
    <View style={[s.bubble, isOwn ? s.bubbleOwn : s.bubbleOther]}>
      {/* Reply Reference Section */}
      {message.replyTo && (
        <View style={[s.replyRef, isOwn ? s.replyRefOwn : s.replyRefOther]}>
          <Text style={s.replyRefName} numberOfLines={1}>{message.replyTo.senderName}</Text>
          <Text style={s.replyRefText} numberOfLines={2}>{message.replyTo.text}</Text>
        </View>
      )}

      {/* Attachment */}
      {message.image && (
        <Image source={{ uri: message.image }} style={s.bubbleImage} />
      )}

      {/* Text content */}
      {!!message.text && (
        <Text style={[s.bubbleText, isOwn && s.bubbleTextOwn]}>{message.text}</Text>
      )}

      <View style={s.bubbleMeta}>
        <Text style={[s.timeText, isOwn && s.timeTextOwn]}>{time}</Text>
        {isOwn && (
          <Text style={[s.receipt, seen && s.receiptSeen]}>
            {seen ? " ✔✔" : " ✔"}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <Animated.View style={[{ opacity: fade, transform: [{ translateY: slide }] }, s.bubbleRow, isOwn ? s.bubbleRowOwn : s.bubbleRowOther]}>
      {isOwn ? (
        renderBubbleContent()
      ) : (
        <Swipeable
          renderRightActions={renderRightActions}
          onSwipeableRightOpen={handleSwipeOpen}
          friction={2}
        >
          {renderBubbleContent()}
        </Swipeable>
      )}
    </Animated.View>
  );
}

// ─── Main Chat Component ──────────────────────────────────────────────────────
export default function ChatConversation() {
  const router = useRouter();
  const { id: chatId } = useLocalSearchParams();
  const { user } = useAuth();

  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [online, setOnline] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // New features state
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [attachment, setAttachment] = useState<any>(null);

  const scrollRef = useRef<ScrollView>(null);
  const typingTimer = useRef<any>(null);

  // ── Fetch Chat Initial Load ──
  useEffect(() => {
    if (!chatId || !user) return;
    const fetchChat = async () => {
      try {
        setLoading(true);
        const t = await AsyncStorage.getItem("token");
        if (!t) return;
        const res = await API.get("/chat", { headers: { Authorization: t } });
        const allChats = res.data || [];
        const found = allChats.find((c: any) => String(c._id) === String(chatId));
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

  // ── Auto Scroll ──
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, typingUser, showEmoji]);

  // ── Socket Event Listeners ──
  useEffect(() => {
    if (!user) return;

    const onReceive = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
      // If we are currently in the chat, emit that we read the new message
      if (chat) {
        socket.emit("messageRead", { chatId: chat._id, messageId: msg._id, userId: user.id });
      }
    };

    const onTyping = (data: any) => {
      if (!data || String(data.userId) === String(user.id)) return;
      setTypingUser(data.name);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingUser(null), 2500);
    };

    const onRead = (data: any) => {
      setMessages((prev) =>
        prev.map((m) => {
          // If message is already read, do nothing
          if (m.readBy?.includes(data.userId)) return m;
          return { ...m, readBy: [...(m.readBy || []), data.userId] };
        })
      );
    };

    const onOnline = (status: boolean) => setOnline(status);

    socket.on("receiveMessage", onReceive);
    socket.on("typing", onTyping);
    socket.on("messageRead", onRead);
    socket.on("messagesRead", onRead); // for catch-all (markAllRead)
    socket.on("onlineStatus", onOnline);

    return () => {
      socket.off("receiveMessage", onReceive);
      socket.off("typing", onTyping);
      socket.off("messageRead", onRead);
      socket.off("messagesRead", onRead);
      socket.off("onlineStatus", onOnline);
      clearTimeout(typingTimer.current);
    };
  }, [user, chat]);

  // ── Mark All Read on Entry ──
  useEffect(() => {
    if (!chat || !user || messages.length === 0) return;
    const markAllRead = async () => {
      const t = await AsyncStorage.getItem("token");
      if (t) {
        try {
          await API.put(`/chat/read-all/${chat._id}`, {}, { headers: { Authorization: t } });
        } catch (e) {}
      }
    };
    markAllRead();
  }, [chat]);

  // ── Image Picker ──
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAttachment(result.assets[0]);
    }
  };

  // ── Send Message ──
  const sendMessage = async () => {
    if ((!text.trim() && !attachment) || sending || !chat) return;

    setSending(true);
    const bodyText = text.trim();
    setText("");
    setShowEmoji(false);
    
    // Create FormData for multipart upload
    const formData = new FormData();
    if (bodyText) formData.append("text", bodyText);
    if (replyingTo) {
      formData.append(
        "replyTo",
        JSON.stringify({
          _id: replyingTo._id,
          text: replyingTo.text || "Image",
          senderName:
            typeof replyingTo.sender === "object"
              ? replyingTo.sender.name || "User"
              : "User",
        })
      );
    }
    if (attachment) {
      // @ts-ignore
      formData.append("image", {
        uri: Platform.OS === "android" ? attachment.uri : attachment.uri.replace("file://", ""),
        name: attachment.fileName || "chat_image.jpg",
        type: attachment.mimeType || "image/jpeg",
      });
    }

    // Unset local state so UI feels bouncy
    setAttachment(null);
    setReplyingTo(null);

    try {
      const t = await AsyncStorage.getItem("token");
      const res = await API.post(`/chat/${chat._id}`, formData, {
        headers: {
          Authorization: t,
        },
      });
      const newMsg = res.data?.message;
      if (newMsg) {
        setMessages((prev) => {
          // Check if not already in array (socket might have pushed it)
          if (prev.some(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        socket.emit("sendMessage", { chatId: chat._id, message: newMsg });
      }
    } catch (err) {
      console.error("Failed to send message", err);
      // fallback handling if needed
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (val: string) => {
    setText(val);
    if (chat) {
      socket.emit("typing", {
        chatId: chat._id,
        userId: user?.id,
        name: user?.name || user?.username || "Someone",
      });
    }
  };

  const getOtherUserName = () => {
    if (!chat || !user) return "Chat";
    const other = chat.users?.find((u: any) => {
      const uid = typeof u === "object" ? u._id : u;
      return String(uid) !== String(user.id);
    });
    return typeof other === "object" && other?.name ? other.name : "Chat";
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ff6600" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Text style={s.backBtnText}>←</Text>
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <View style={s.avatar}>
                <Text style={{ fontSize: 18 }}>💬</Text>
                {online && <View style={s.onlineDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.headerName} numberOfLines={1}>{getOtherUserName()}</Text>
                {online && <Text style={{ color: "#22c55e", fontSize: 11 }}>● Online</Text>}
              </View>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={s.msgArea}
            contentContainerStyle={s.msgContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((m, i) => {
              const sid = typeof m.sender === "object" ? m.sender._id : m.sender;
              const isOwn = String(sid) === String(user?.id);
              return (
                <MessageBubble
                  key={m._id || i}
                  message={m}
                  isOwn={isOwn}
                  userId={user?.id}
                  onReply={(msg: any) => setReplyingTo(msg)}
                />
              );
            })}
            {typingUser && <TypingIndicator name={typingUser} />}
          </ScrollView>

          {/* Reply Context Bar */}
          {replyingTo && (
            <View style={s.replyingBar}>
              <View style={s.replyingContext}>
                <Text style={s.replyingName}>Replying to {typeof replyingTo.sender === "object" ? replyingTo.sender.name : "Message"}</Text>
                <Text style={s.replyingText} numberOfLines={1}>{replyingTo.text || "Image"}</Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Text style={s.replyingDismiss}>❌</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Attachment Context Bar */}
          {attachment && (
            <View style={s.attachmentBar}>
              <Image source={{ uri: attachment.uri }} style={s.attachmentThumb} />
              <TouchableOpacity style={s.attachmentDismiss} onPress={() => setAttachment(null)}>
                <Text style={{ color: "#fff", fontSize: 10 }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Emoji Picker */}
          {showEmoji && (
            <View style={s.emojiPanel}>
              {EMOJI_ROWS.map((row, ri) => (
                <View key={ri} style={s.emojiRow}>
                  {row.map((emoji) => (
                    <TouchableOpacity key={emoji} style={s.emojiBtn} onPress={() => setText((p) => p + emoji)}>
                      <Text style={s.emojiChar}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* Input Area */}
          <View style={s.inputBar}>
            <TouchableOpacity style={s.iconBtn} onPress={pickImage}>
              <Text style={s.iconBtnEmoji}>📎</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.iconBtn, showEmoji && s.iconBtnActive]} onPress={() => { setShowEmoji((v) => !v); Keyboard.dismiss(); }}>
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
              style={[s.sendBtn, (!text.trim() && !attachment && s.sendBtnOff) || {}]}
              onPress={sendMessage}
              disabled={(!text.trim() && !attachment) || sending}
            >
              {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.sendArrow}>↑</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: "#111",
    paddingTop: Platform.OS === "ios" ? 56 : 34,
    paddingBottom: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ff6600",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#111",
  },
  headerName: { color: "#fff", fontSize: 16, fontWeight: "800" },
  
  msgArea: { flex: 1, backgroundColor: "#f3f4f6" },
  msgContent: { padding: 12, paddingBottom: 10 },
  bubbleRow: { marginBottom: 10, flexDirection: "row" },
  bubbleRowOwn: { justifyContent: "flex-end" },
  bubbleRowOther: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: SCREEN_W * 0.72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 2,
  },
  bubbleOwn: { backgroundColor: "#ff6600", borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: "#fff", borderBottomLeftRadius: 4 },
  bubbleImage: { width: "100%", aspectRatio: 4/3, borderRadius: 12, marginBottom: 6, backgroundColor: '#e5e7eb' },
  bubbleText: { fontSize: 15, color: "#111", lineHeight: 21 },
  bubbleTextOwn: { color: "#fff" },
  bubbleMeta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 4, gap: 3 },
  timeText: { fontSize: 10, color: "#9ca3af" },
  timeTextOwn: { color: "rgba(255,255,255,0.6)" },
  receipt: { fontSize: 10, color: "rgba(255,255,255,0.6)" },
  receiptSeen: { color: "#a5f3fc" },

  replyAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 60,
  },
  replyIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center", justifyContent: "center"
  },
  replyIcon: { fontSize: 16 },

  replyRef: {
    paddingLeft: 8,
    borderLeftWidth: 3,
    marginBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
    padding: 6,
    borderRadius: 4
  },
  replyRefOwn: { borderLeftColor: "#ff9955" },
  replyRefOther: { borderLeftColor: "#ff6600" },
  replyRefName: { fontSize: 11, fontWeight: "800", color: "#ececec" },
  replyRefText: { fontSize: 12, color: "#e0e0e0" },

  typingRow: { flexDirection: "row", marginBottom: 8 },
  typingBubble: {
    backgroundColor: "#fff", borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  typingName: { fontSize: 12, color: "#9ca3af", fontWeight: "600" },
  dotsRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#d1d5db" },

  replyingBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3eb",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#fdba74"
  },
  replyingContext: { flex: 1, paddingLeft: 8, borderLeftWidth: 3, borderLeftColor: "#ff6600" },
  replyingName: { fontSize: 12, fontWeight: "700", color: "#ff6600" },
  replyingText: { fontSize: 13, color: "#374151", marginTop: 2 },
  replyingDismiss: { padding: 8 },

  attachmentBar: {
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexDirection: "row"
  },
  attachmentThumb: {
    width: 60, height: 60, borderRadius: 8,
    backgroundColor: '#e5e7eb'
  },
  attachmentDismiss: {
    position: 'absolute', top: 4, left: 60,
    backgroundColor: '#000',
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center'
  },

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
  },
  sendBtnOff: { backgroundColor: "#e5e7eb" },
  sendArrow: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: -1 },
});
