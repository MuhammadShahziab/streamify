import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./server";
import { useAuthStore } from "../store/useAuthStore";

vi.mock("react-hot-toast", () => {
  const toast = Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  });

  const Toaster = () => null;

  return {
    __esModule: true,
    default: toast,
    toast,
    Toaster,
  };
});

const resetAuthStore = () => {
  const store = useAuthStore.getState();
  store.clearUser();
  (useAuthStore as typeof useAuthStore & {
    persist?: { clearStorage?: () => void };
  }).persist?.clearStorage?.();
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  resetAuthStore();
});
afterAll(() => server.close());
