import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  _id: string;
  fullName: string;
  email: string;
  profilePic?: string;
  bio?: string;
  nativeLanguage?: string;
  learningLanguage?: string;
  country?: string;
  city?: string;
  isOnBoarded?: boolean;
  friends?: string[]; // Or User[] if you need full friend objects
  isVerified: Boolean;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  updateUser: (data: Partial<AuthUser>) => void;
  isAuthenticated: Boolean;
  setIsAuthenticated: (authStatus: Boolean) => void;
  otpExpiresAt: string | null;
  setOtpExpiresAt: (timestamp: string) => void;

  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      otpExpiresAt: null,

      setUser: (user) => set({ user }),
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      setIsAuthenticated: (authStatus) => set({ isAuthenticated: authStatus }),
      setOtpExpiresAt: (timestamp) => set({ otpExpiresAt: timestamp }),
      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
          otpExpiresAt: null,
        }),
    }),
    {
      name: "auth-store",
      storage: {
        getItem: (key) => {
          const value = sessionStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        },
        setItem: (key, value) => {
          sessionStorage.setItem(key, JSON.stringify(value));
        },
        removeItem: (key) => {
          sessionStorage.removeItem(key);
        },
      },
    }
  )
);
