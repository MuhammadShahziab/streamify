import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockUser } from "../tests/fixtures/user";
import { server } from "../tests/server";
import { http, HttpResponse, delay } from "msw";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../tests/test-utils";
import LoginPage from "./LoginPage";
import { screen, waitFor } from "@testing-library/react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>(
    "react-router"
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock toast functions
vi.mock("react-hot-toast", () => {
  return {
    __esModule: true,
    default: {
      success: vi.fn(),
      error: vi.fn(),
      dismiss: vi.fn(),
    },
  };
});

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

afterEach(() => {
  mockNavigate.mockClear();
});

describe("Login Page", () => {
  it("submits credentials, disables the form while pending, and hydrates auth state", async () => {
    const mockUser = createMockUser();
    const loginSpy = vi.fn();

    // MSW handler intercepts the full URL
    server.use(
      http.post(`${API_URL}/auth/login`, async ({ request }) => {
        const payload = await request.json();
        loginSpy(payload);
        await delay(50); // simulate network delay
        return HttpResponse.json({
          success: true,
          user: mockUser,
          message: "Login successful",
        });
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "OYm6O@example.com");
    await user.type(passwordInput, "securePassword123");
    await user.click(submitButton);

    // Check that the button shows loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
    const loadingButton = screen.getByRole("button", { name: /Signing in…/i });
    expect(loadingButton).toBeInTheDocument();

    // Ensure login API was called with correct payload
    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledTimes(1);
      expect(loginSpy).toHaveBeenCalledWith({
        email: "OYm6O@example.com",
        password: "securePassword123",
      });
    });

    // Ensure auth store updated
    await waitFor(() => {
      expect(useAuthStore.getState().user?._id).toBe(mockUser._id);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    // Button should be enabled again
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
    // Toast should be called
    expect(toast.success).toHaveBeenCalledWith("Login successful");

    // Navigation should happen
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
  it("submits invalid credentials and shows error toast", async () => {
    const loginSpy = vi.fn();
    server.use(
      http.post(`${API_URL}/auth/login`, async ({ request }) => {
        const payload = await request.json();
        loginSpy(payload);
        await delay(50);
        return HttpResponse.json(
          {
            success: false,
            message: "Invalid email or password",
          },
          { status: 401 }
        );
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.type(emailInput, "OYm6O@example.com");
    await user.type(passwordInput, "wrongPassword");
    await user.click(submitButton);

    // Check that the button shows loading state
    await waitFor(() => expect(submitButton).toBeDisabled());
    const loadingButton = screen.getByRole("button", { name: /Signing in…/i });
    expect(loadingButton).toBeInTheDocument();

    // Ensure login API was called with correct payload
    await waitFor(() => expect(loginSpy).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(loginSpy).toHaveBeenCalledWith({
        email: "OYm6O@example.com",
        password: "wrongPassword",
      })
    );

    // Ensure auth store not updated
    await waitFor(() => expect(useAuthStore.getState().user?._id).toBeUndefined());
    await waitFor(() =>
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    );

    // show error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid email or password");
    });

    // Button should be enabled again
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
