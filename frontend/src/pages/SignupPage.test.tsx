import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockUser } from "../tests/fixtures/user";
import { server } from "../tests/server";
import { delay, http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../tests/test-utils";
import SignupPage from "./SignupPage";
import { screen, waitFor } from "@testing-library/react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import type { SignUpData } from "../types";

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

afterEach(() => {
  mockNavigate.mockClear();
});

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

// const DEFAULT_FORM_VALUES: SignUpData = {
//   fullName: "Jane Doe",
//   email: "OYm6O@example.com",
//   password: "securePassword123",
// };

// const buildFormValues = (overrides: Partial<SignUpData> = {}) => ({
//   ...DEFAULT_FORM_VALUES,
//   ...overrides,
// });

const DEFAULT_FORM_VALUES: SignUpData = {
  fullName: "Jane Doe",
  email: "OYm6O@example.com",
  password: "securePassword123",
};

const renderSignupPage = () => {
  const user = userEvent.setup();
  renderWithProviders(<SignupPage />, {
    route: "/signup",
  });

  const fullNameInput = screen.getByPlaceholderText(/John Doe/i);
  const emailInput = screen.getByPlaceholderText(/JohnDoe@gmail.com/i);
  const passwordInput = screen.getByTestId("password-input");
  const termsCheckbox = screen.getByLabelText(/I agree to the/i);
  const submitButton = screen.getByRole("button", {
    name: /Create Account/i,
  });

  return {
    user,
    fullNameInput,
    emailInput,
    passwordInput,
    termsCheckbox,
    submitButton,
  };
};

const buildFormValues = (overrides: Partial<SignUpData> = {}) => {
  return {
    ...DEFAULT_FORM_VALUES,
    ...overrides,
  };
};

const fillSignupForm = async (
  userInstance: ReturnType<typeof userEvent.setup>,
  elements: Pick<
    ReturnType<typeof renderSignupPage>,
    "fullNameInput" | "emailInput" | "passwordInput"
  >,
  overrides: Partial<SignUpData> = {}
) => {
  const values = buildFormValues(overrides);

  await userInstance.type(elements.fullNameInput, values.fullName);
  await userInstance.type(elements.emailInput, values.email);
  await userInstance.type(elements.passwordInput, values.password);
};

// const renderSignupPage = () => {
//   const user = userEvent.setup();
//   renderWithProviders(<SignupPage />, {
//     route: "/signup",
//   });

//   const fullNameInput = screen.getByPlaceholderText(/John Doe/i);
//   const emailInput = screen.getByPlaceholderText(/JohnDoe@gmail.com/i);
//   const passwordInput = screen.getByTestId("password-input");
//   const termsCheckbox = screen.getByLabelText(/I agree to the/i);
//   const submitButton = screen.getByRole("button", {
//     name: /Create Account/i,
//   });

//   return {
//     user,
//     fullNameInput,
//     emailInput,
//     passwordInput,
//     termsCheckbox,
//     submitButton,
//   };
// };

// const fillSignupForm = async (
//   userInstance: ReturnType<typeof userEvent.setup>,
//   elements: Pick<ReturnType<typeof renderSignupPage>, "fullNameInput" | "emailInput" | "passwordInput">,
//   overrides: Partial<SignUpData> = {}
// ) => {
//   const values = buildFormValues(overrides);

//   await userInstance.type(elements.fullNameInput, values.fullName);
//   await userInstance.type(elements.emailInput, values.email);
//   await userInstance.type(elements.passwordInput, values.password);
// };
describe("Signup Page", () => {
  it("should show success message on valid credentials", async () => {
    const mockUser = createMockUser();
    const signupSpy = vi.fn();
    // MSW handler intercepts the full URL
    server.use(
      http.post(`${API_URL}/auth/signup`, async ({ request }) => {
        const payload = await request.json();
        signupSpy(payload);
        await delay(50); // simulate network delay
        return HttpResponse.json({
          success: true,
          user: mockUser,
          message: "User created successfully. Please verify your email.",
          meta: {},
        });
      })
    );

    const {
      user,
      fullNameInput,
      emailInput,
      passwordInput,
      termsCheckbox,
      submitButton,
    } = renderSignupPage();

    await fillSignupForm(user, { fullNameInput, emailInput, passwordInput });
    await user.click(termsCheckbox);
    await user.click(submitButton);
    // Check that the button shows loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
    const loadingButton = await screen.findByRole("button", {
      name: /Creating Account.../i,
    });
    expect(loadingButton).toBeInTheDocument();
    // Ensure signup API was called with correct payload
    await waitFor(() => expect(signupSpy).toHaveBeenCalledTimes(1));
    expect(signupSpy).toHaveBeenCalledWith({
      fullName: "Jane Doe",
      email: "OYm6O@example.com",
      password: "securePassword123",
    });

    // Enure Auth store is updated
    await waitFor(() =>
      expect(useAuthStore.getState().user?._id).toBe(mockUser._id)
    );
    await waitFor(() =>
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    );

    // Toast should be called
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "User created successfully. Please verify your email."
      )
    );
    // Button should be enabled again
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    // Navigation should happen
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/verify-otp")
    );
  });

  it("should block submission until terms checkbox is checked", async () => {
    const signupSpy = vi.fn();

    // MSW handler intercepts the full URL
    server.use(
      http.post(`${API_URL}/auth/signup`, async ({ request }) => {
        const payload = await request.json();
        signupSpy(payload);
        return HttpResponse.json({
          success: true,
          user: createMockUser(),
          message: "User created successfully. Please verify your email.",
          meta: {},
        });
      })
    );
    const {
      emailInput,
      passwordInput,
      submitButton,
      fullNameInput,
      termsCheckbox,
      user,
    } = renderSignupPage();

    await fillSignupForm(user, { fullNameInput, emailInput, passwordInput });

    // Do NOT check the terms checkbox
    // Attempt to submit the form
    await user.click(submitButton);

    // Ensure signup API was NOT called
    expect(signupSpy).not.toHaveBeenCalled();
    expect(termsCheckbox).toBeInvalid();

    // Toast should NOT be called
    expect(toast.error).not.toHaveBeenCalled();
    // Navigation should NOT happen
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  describe("Signup → backend validation errors", () => {
    const validationCases = [
      {
        label: "short full name",
        overrides: { fullName: "Jo" },
        responseMessage: "Full name must be at least 3 characters long",
      },
      {
        label: "invalid email",
        overrides: { email: "example@email" },
        responseMessage: "Invalid email format",
      },
      {
        label: "short password",
        overrides: { password: "12345" },
        responseMessage: "Password must be at least 6 characters long",
      },
    ];

    it.each(validationCases)(
      "shows toast error for %s",
      async ({ overrides, responseMessage }) => {
        const signupSpy = vi.fn();

        // 1️⃣ Mock backend response using MSW

        server.use(
          http.post(`${API_URL}/auth/signup`, async ({ request }) => {
            const payload = await request.json();
            signupSpy(payload);
            return HttpResponse.json(
              { message: responseMessage },
              { status: 400 }
            );
          })
        );

        const {
          user,
          fullNameInput,
          emailInput,
          passwordInput,
          termsCheckbox,
          submitButton,
        } = renderSignupPage();

        // 3️⃣ Fill the form with default values + overrides

        await fillSignupForm(
          user,
          { fullNameInput, emailInput, passwordInput },
          overrides
        );

        await user.click(termsCheckbox);
        await user.click(submitButton);

        // 4️⃣ Assert backend received correct payload

        await waitFor(() => expect(signupSpy).toHaveBeenCalledTimes(1));
        expect(signupSpy).toHaveBeenCalledWith(buildFormValues(overrides));

        // 5️⃣ Assert correct toast error was shown

        await waitFor(() =>
          expect(toast.error).toHaveBeenCalledWith(responseMessage)
        );

        // 6️⃣ Navigate should NOT be called on validation errors

        expect(mockNavigate).not.toHaveBeenCalled();
        // 7️⃣ Submit button should re-enable after response
        await waitFor(() => expect(submitButton).not.toBeDisabled());
      }
    );
  });

  // describe("Signup → backend validation errors", () => {
  //   const validationCases = [
  //     {
  //       label: "short full name",
  //       overrides: { fullName: "Jo" },
  //       responseMessage: "Full name must be at least 3 characters long",
  //     },
  //     {
  //       label: "invalid email",
  //       overrides: { email: "invalid-email" },
  //       responseMessage: "Invalid email format",
  //     },
  //     {
  //       label: "short password",
  //       overrides: { password: "12345" },
  //       responseMessage: "Password must be at least 6 characters long",
  //     },
  //   ];

  //   it.each(validationCases)(
  //     "shows toast error for %s",
  //     async ({ overrides, responseMessage }) => {
  //       const signupSpy = vi.fn();

  //       //
  //       // 1️⃣ Mock backend response using MSW
  //       //
  //       server.use(
  //         http.post(`${API_URL}/auth/signup`, async ({ request }) => {
  //           const body = await request.json();
  //           signupSpy(body);

  //           return HttpResponse.json(
  //             { message: responseMessage },
  //             { status: 400 }
  //           );
  //         })
  //       );

  //       //
  //       // 2️⃣ Render the Signup page
  //       //
  //       const {
  //         user,
  //         fullNameInput,
  //         emailInput,
  //         passwordInput,
  //         termsCheckbox,
  //         submitButton,
  //       } = renderSignupPage();

  //       //
  //       // 3️⃣ Fill the form with default values + overrides
  //       //
  //       await fillSignupForm(
  //         user,
  //         { fullNameInput, emailInput, passwordInput },
  //         overrides
  //       );

  //       await user.click(termsCheckbox);
  //       await user.click(submitButton);

  //       //
  //       // 4️⃣ Assert backend received correct payload
  //       //
  //       await waitFor(() => expect(signupSpy).toHaveBeenCalledTimes(1));
  //       expect(signupSpy).toHaveBeenCalledWith(buildFormValues(overrides));

  //       // 5️⃣ Assert correct toast error was shown

  //       await waitFor(() =>
  //         expect(toast.error).toHaveBeenCalledWith(responseMessage)
  //       );

  //       // 6️⃣ Navigate should NOT be called on validation errors

  //       expect(mockNavigate).not.toHaveBeenCalled();
  //       // 7️⃣ Submit button should re-enable after response
  //       await waitFor(() => expect(submitButton).not.toBeDisabled());
  //     }
  //   );
  // });
});
