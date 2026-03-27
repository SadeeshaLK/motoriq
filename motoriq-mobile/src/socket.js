// src/socket.js
// ─────────────────────────────────────────────────────────────────────────────
// Socket.io client configured for React Native.
// autoConnect: false so we connect only after the user is authenticated.
//
// Usage:
//   import { socket, connectSocket, disconnectSocket } from "../src/socket"
//
//   // After login:
//   connectSocket(token)
//
//   // On logout:
//   disconnectSocket()
// ─────────────────────────────────────────────────────────────────────────────

import { io } from "socket.io-client";

const SOCKET_URL = "http://10.0.2.2:5000"; // Android emulator
// const SOCKET_URL = "http://localhost:5000"; // iOS simulator
// const SOCKET_URL = "http://192.168.1.x:5000"; // real device (your LAN IP)

export const socket = io(SOCKET_URL, {
  autoConnect: false,       // connect manually after auth
  transports: ["websocket"],// skip long-polling — better on mobile
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

// ── Connect with auth token ──────────────────────────────────────────────────
export const connectSocket = (token) => {
  if (socket.connected) return;

  socket.auth = {
    token: token?.startsWith("Bearer ") ? token.slice(7) : token,
  };

  socket.connect();

  socket.on("connect", () => {
    console.log("🔌 Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.warn("Socket connect error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });
};

// ── Disconnect ───────────────────────────────────────────────────────────────
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};