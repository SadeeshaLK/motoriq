// src/context/ThemeContext.js
// ─────────────────────────────────────────────────────────────────────────────
// Provides theme (light/dark) with AsyncStorage persistence.
// Light theme values are kept exactly as designed (warm cream palette).
// Dark theme adds deep navy-indigo tones.
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

const ThemeContext = createContext();

/* ── Colour tokens ─────────────────────────────────────────────────────────── */

export const lightTheme = {
  isDark: false,

  // Backgrounds
  bgBody:      "#faf8f5",
  bgCard:      "#ffffff",
  bgGlass:     "rgba(255,255,255,0.6)",
  bgInput:     "rgba(0,0,0,0.03)",
  bgGlassHover:"rgba(255,255,255,0.8)",

  // Text
  textPrimary:   "#0f172a",
  textSecondary: "#475569",
  textMuted:     "#94a3b8",

  // Borders
  borderSubtle: "rgba(0,0,0,0.06)",
  borderGlass:  "rgba(0,0,0,0.08)",
  borderInput:  "#e2e8f0",

  // Brand
  primary:      "#f97316",
  primaryDark:  "#ea580c",
  primaryGlow:  "rgba(249,115,22,0.20)",

  // Status
  green:        "#16a34a",
  greenGlow:    "rgba(22,163,74,0.12)",
  red:          "#dc2626",
  redGlow:      "rgba(220,38,38,0.10)",
  blue:         "#2563eb",
  blueGlow:     "rgba(37,99,235,0.10)",
  yellow:       "#ca8a04",

  // Shadows
  shadowSm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  shadowMd: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  shadowLg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },

  // Nav
  navBg:    "rgba(255,255,255,0.92)",
  chipBg:   "rgba(0,0,0,0.04)",
  chipText: "#64748b",
};

export const darkTheme = {
  isDark: true,

  // Backgrounds
  bgBody:       "#0a0e17",
  bgCard:       "#111827",
  bgGlass:      "rgba(255,255,255,0.04)",
  bgInput:      "rgba(255,255,255,0.06)",
  bgGlassHover: "rgba(255,255,255,0.08)",

  // Text
  textPrimary:   "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted:     "#64748b",

  // Borders
  borderSubtle: "rgba(255,255,255,0.06)",
  borderGlass:  "rgba(255,255,255,0.10)",
  borderInput:  "rgba(255,255,255,0.10)",

  // Brand
  primary:      "#f97316",
  primaryDark:  "#ea580c",
  primaryGlow:  "rgba(249,115,22,0.35)",

  // Status
  green:        "#22c55e",
  greenGlow:    "rgba(34,197,94,0.20)",
  red:          "#ef4444",
  redGlow:      "rgba(239,68,68,0.20)",
  blue:         "#3b82f6",
  blueGlow:     "rgba(59,130,246,0.20)",
  yellow:       "#eab308",

  // Shadows
  shadowSm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 4,
  },
  shadowMd: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 16,
    elevation: 8,
  },
  shadowLg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.50,
    shadowRadius: 32,
    elevation: 16,
  },

  // Nav
  navBg:    "rgba(10,14,23,0.92)",
  chipBg:   "rgba(255,255,255,0.08)",
  chipText: "#94a3b8",
};

/* ── Provider ──────────────────────────────────────────────────────────────── */

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // "light" | "dark"
  const [mode, setMode] = useState("light"); // default = light (as requested)

  useEffect(() => {
    AsyncStorage.getItem("theme").then((saved) => {
      if (saved) setMode(saved);
      // If no saved preference, stay "light" — do NOT follow system scheme
    });
  }, []);

  const toggleTheme = async () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    await AsyncStorage.setItem("theme", next);
  };

  const theme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ── Hook ──────────────────────────────────────────────────────────────────── */

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
