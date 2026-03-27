// src/hooks/useAuth.js
// ─────────────────────────────────────────────────────────────────────────────
// Drop-in replacement for the web useAuth hook.
// Reads token + user from AsyncStorage and exposes a logout helper.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function useAuth() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const t = await AsyncStorage.getItem("token");
      const u = await AsyncStorage.getItem("user");
      setToken(t || null);
      setUser(u ? JSON.parse(u) : null);
    } catch (err) {
      console.warn("useAuth: failed to load credentials", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  const isAuthenticated = !!token;

  return { token, user, loading, isAuthenticated, logout };
}