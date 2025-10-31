import { create } from "zustand";

type ThemeName = string;

interface ThemeState {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  theme:
    (typeof window !== "undefined" &&
      localStorage.getItem("streamify-theme")) ||
    "dark",
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("streamify-theme", theme);
    }
    set({ theme });
  },
}));
