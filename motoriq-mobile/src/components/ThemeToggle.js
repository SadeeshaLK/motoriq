// src/components/ThemeToggle.js
// Drop-in theme toggle button for any screen header.
// Usage: <ThemeToggle />

import { TouchableOpacity, Text, StyleSheet, Animated, useRef } from "react-native";
import { useRef as useReactRef } from "react";
import { Animated as RNAnimated } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ style }) {
  const { theme: t, mode, toggleTheme } = useTheme();
  const scaleAnim = useReactRef(new RNAnimated.Value(1)).current;

  const handlePress = () => {
    RNAnimated.sequence([
      RNAnimated.spring(scaleAnim, { toValue: 0.8, useNativeDriver: true, tension: 200, friction: 5 }),
      RNAnimated.spring(scaleAnim, { toValue: 1,   useNativeDriver: true, tension: 200, friction: 5 }),
    ]).start();
    toggleTheme();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.btn,
        {
          backgroundColor: t.isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          borderColor: t.borderGlass,
        },
        style,
      ]}
    >
      <RNAnimated.Text style={[styles.icon, { transform: [{ scale: scaleAnim }] }]}>
        {mode === "dark" ? "🌙" : "☀️"}
      </RNAnimated.Text>
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
  },
  icon: { fontSize: 18 },
});
