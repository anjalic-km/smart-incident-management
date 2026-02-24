import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ThemeContext } from "./ThemeContext";
import { useAuth } from "./useAuth";

const THEME_KEY_PREFIX = "app_theme";
const LEGACY_THEME_KEY = "app_theme";

function getSystemTheme() {
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  return prefersDark ? "dark" : "light";
}

function getSavedTheme(key) {
  const saved = localStorage.getItem(key);
  if (saved === "light" || saved === "dark") return saved;
  return null;
}

function getThemeStorageKey(user) {
  const userKey = user?.userId || user?.email || user?.sub || "guest";
  return `${THEME_KEY_PREFIX}:${String(userKey).toLowerCase()}`;
}

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const storageKey = getThemeStorageKey(user);
  const [themeOverrides, setThemeOverrides] = useState({});

  const isAuthLightRoute =
    location.pathname === "/login" ||
    location.pathname === "/" ||
    location.pathname === "/maintenance" ||
    location.pathname === "/unauthorized" ||
    location.pathname === "/authentication/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password";
  const isAppShellRoute = /^(\/superadmin|\/admin|\/manager|\/engineer|\/user|\/profile|\/force-change-password)(\/|$)/.test(
    location.pathname
  );

  const theme =
    themeOverrides[storageKey] ||
    getSavedTheme(storageKey) ||
    getSavedTheme(LEGACY_THEME_KEY) ||
    getSystemTheme();

  const setTheme = (nextTheme) => {
    setThemeOverrides((prev) => {
      const resolved = typeof nextTheme === "function" ? nextTheme(theme) : nextTheme;
      return { ...prev, [storageKey]: resolved };
    });
  };

  useEffect(() => {
    localStorage.setItem(storageKey, theme);
    localStorage.setItem(LEGACY_THEME_KEY, theme);
    const root = document.documentElement;
    const shouldUseDark = isAppShellRoute && !isAuthLightRoute && theme === "dark";
    root.classList.toggle("dark", shouldUseDark);
    root.setAttribute("data-theme", shouldUseDark ? "dark" : "light");
  }, [theme, isAuthLightRoute, isAppShellRoute, storageKey]);

  const value = {
    theme,
    isDark: theme === "dark",
    setTheme,
    toggleTheme: () => setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
