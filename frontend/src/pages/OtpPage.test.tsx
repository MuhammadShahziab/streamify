import { afterEach, describe, expect, it, vi } from "vitest";
import { delay, http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";

import { renderWithProviders } from "../tests/test-utils";
import { server } from "../tests/server";
import OtpPage from "./OtpPage";
import { useAuthStore } from "../store/useAuthStore";
import { createMockUser } from "../tests/fixtures/user";
import toast from "react-hot-toast";
import type { VerificationMeta } from "../types";

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

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

const defaultMeta = (): VerificationMeta => {
  const now = Date.now();
  return {
    expiresAt: new Date(now + 5 * 60 * 1000).toISOString(),
    expiresInMinutes: 5,
    maxAttempts: 5,
    attemptsRemaining: 3,
    resendIntervalSeconds: 30,
    resendAvailableAt: new Date(now + 30 * 1000).toISOString(),
  };
};

const setupAuthStore = ({
  email = "verify@example.com",
  metaOverrides = {},
  retryAt,
}: {
  email?: string;
  metaOverrides?: Partial<VerificationMeta>;
  retryAt?: string | null;
} = {}) => {
  const store = useAuthStore.getState();
  const meta = { ...defaultMeta(), ...metaOverrides };

  store.setVerificationFromEnvelope({
    meta: { verification: meta },
    ...(retryAt ? { retryAt } : {}),
  });
  store.setPendingVerificationEmail(email);
  store.setUser(null);
  store.setIsAuthenticated(false);
};

const renderOtpPage = () => {
  const user = userEvent.setup();
  renderWithProviders(<OtpPage />, { route: "/verify-otp" });
  return { user };
};

const typeOtp = async (user: ReturnType<typeof userEvent.setup>, code: string) => {
  const otpInputs = screen.getAllByLabelText(/OTP digit/i);
  await user.type(otpInputs[0], code);
};

describe("OtpPage", () => {
  afterEach(() => {
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  it("submits OTP and navigates on successful verification", async () => {
    setupAuthStore();
    const verifySpy = vi.fn();
    const mockUser = createMockUser();

    server.use(
      http.post(`${API_URL}/auth/verify-otp`, async ({ request }) => {
        const payload = await request.json();
        verifySpy(payload);
        await delay(50);
        return HttpResponse.json({
          success: true,
          message: "OTP verified successfully.",
          user: mockUser,
        });
      })
    );

    const { user } = renderOtpPage();
    const verifyButton = screen.getByRole("button", { name: /Verify/i });

    await typeOtp(user, "1234");

    await waitFor(() => expect(verifyButton).toBeDisabled());
    await waitFor(() =>
      expect(verifySpy).toHaveBeenCalledWith({
        email: "verify@example.com",
        otp: "1234",
      })
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("OTP verified successfully.")
    );

    await waitFor(() =>
      expect(useAuthStore.getState().user?._id).toBe(mockUser._id)
    );
    await waitFor(() =>
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    );
    expect(mockNavigate).toHaveBeenCalledWith("/");
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("shows toast error when backend rejects verification", async () => {
    setupAuthStore({
      metaOverrides: {
        attemptsRemaining: 2,
      },
    });
    const verifySpy = vi.fn();

    server.use(
      http.post(`${API_URL}/auth/verify-otp`, async ({ request }) => {
        const payload = await request.json();
        verifySpy(payload);
        return HttpResponse.json(
          {
            message: "Invalid verification code",
            meta: {
              verification: {
                ...defaultMeta(),
                attemptsRemaining: 1,
              },
            },
          },
          { status: 400 }
        );
      })
    );

    const { user } = renderOtpPage();

    await typeOtp(user, "9999");

    await waitFor(() => expect(verifySpy).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Invalid verification code")
    );
    await waitFor(() =>
      expect(
        screen.getByText(/1 of 5 attempts remaining/i)
      ).toBeInTheDocument()
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("resends OTP when cooldown has passed", async () => {
    const pastTimestamp = new Date(Date.now() - 30 * 1000).toISOString();
    setupAuthStore({
      metaOverrides: {
        resendAvailableAt: pastTimestamp,
      },
    });
    const resendSpy = vi.fn();

    server.use(
      http.post(`${API_URL}/auth/resend-otp`, async ({ request }) => {
        const payload = await request.json();
        resendSpy(payload);
        return HttpResponse.json({
          success: true,
          message: "Verification code resent.",
          meta: {
            verification: {
              ...defaultMeta(),
              resendAvailableAt: new Date(Date.now() + 45 * 1000).toISOString(),
            },
          },
        });
      })
    );

    const { user } = renderOtpPage();
    const resendButton = screen.getByRole("button", { name: /Resend/i });
    const firstOtpInput = screen.getByLabelText("OTP digit 1") as HTMLInputElement;

    await user.type(firstOtpInput, "1");
    expect(firstOtpInput).toHaveValue("1");

    await user.click(resendButton);

    await waitFor(() =>
      expect(resendSpy).toHaveBeenCalledWith({ email: "verify@example.com" })
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Verification code resent.")
    );

    expect(firstOtpInput).toHaveValue("");
    await waitFor(() =>
      expect(resendButton).toHaveTextContent(/Resend available in/i)
    );
    expect(resendButton).toBeDisabled();
  });
});
