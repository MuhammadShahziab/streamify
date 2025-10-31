import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, VerificationEnvelope, VerificationMeta } from "../types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  verificationMeta: VerificationMeta | null;
  verificationRetryAt: string | null;
  pendingVerificationEmail: string | null;
  setUser: (user: User | null) => void;
  updateUser: (data: Partial<User>) => void;
  setIsAuthenticated: (authStatus: boolean) => void;
  setVerificationFromEnvelope: (payload?: VerificationEnvelope | null) => void;
  setPendingVerificationEmail: (email: string | null) => void;
  clearVerification: () => void;
  clearUser: () => void;
}

const extractVerificationMeta = (payload?: VerificationEnvelope | null) => {
  const meta = payload?.meta?.verification ?? null;
  const retryAt =
    payload?.retryAt ?? meta?.resendAvailableAt ?? null;

  return { meta, retryAt };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      verificationMeta: null,
      verificationRetryAt: null,
      pendingVerificationEmail: null,

      setUser: (user) => set({ user }),
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      setIsAuthenticated: (authStatus) => set({ isAuthenticated: authStatus }),
      setVerificationFromEnvelope: (payload) =>
        set(() => {
          const { meta, retryAt } = extractVerificationMeta(payload ?? undefined);
          return {
            verificationMeta: meta,
            verificationRetryAt: retryAt,
          };
        }),
      setPendingVerificationEmail: (email) =>
        set({
          pendingVerificationEmail: email,
        }),
      clearVerification: () =>
        set({
          verificationMeta: null,
          verificationRetryAt: null,
          pendingVerificationEmail: null,
        }),
      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
          verificationMeta: null,
          verificationRetryAt: null,
          pendingVerificationEmail: null,
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
