"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const LABELS: Record<string, string> = {
  light: "Light",
  dark: "Dark",
  "high-contrast": "High contrast",
  system: "System",
};

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Server can't know the resolved theme; render nothing until mount.
  if (!mounted) return null;

  return (
    <label className="hbd-theme-switcher">
      <span className="sr-only">Theme</span>
      <select aria-label="Theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
        {themes.map((t) => (
          <option key={t} value={t}>
            {LABELS[t] ?? t}
          </option>
        ))}
      </select>
    </label>
  );
}
