import { useEffect } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import {
  getAuthUser,
  login,
  logout,
  resendOtp,
  signUp,
  verifyOtp,
  type ApiErrorResponse,
} from "../lib/api";
import { useAuthStore } from "../store/useAuthStore";
import type {
  LoginData,
  LoginResponse,
  ResendOtpResponse,
  SignUpData,
  SignUpResponse,
  VerificationEnvelope,
  VerifyOtpData,
  VerifyOtpResponse,
} from "../types";

const AUTH_QUERY_KEY = ["authUser"];

export const useAuthUser = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const clearVerification = useAuthStore((state) => state.clearVerification);

  const {
    data,
    isLoading,
    isSuccess,
    isError,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getAuthUser,
    retry: false,
  });

  useEffect(() => {
    if (isSuccess && data?.user) {
      setUser(data.user);
      setIsAuthenticated(true);
      clearVerification();
    } else if (isError) {
      setIsAuthenticated(false);
    }
  }, [
    isSuccess,
    isError,
    data,
    setUser,
    setIsAuthenticated,
    clearVerification,
  ]);

  return { authUser: data?.user ?? null, isLoading };
};

const handleVerificationEnvelope = (
  payload:
    | Partial<ApiErrorResponse>
    | VerificationEnvelope
    | SignUpResponse
    | ResendOtpResponse
    | null
    | undefined,
  opts: {
    setVerificationFromEnvelope: (
      payload?: VerificationEnvelope | null
    ) => void;
    setPendingVerificationEmail: (email: string | null) => void;
    email?: string | null;
  }
) => {
  const { setVerificationFromEnvelope, setPendingVerificationEmail, email } =
    opts;

  if (payload !== undefined) {
    setVerificationFromEnvelope(
      (payload as VerificationEnvelope | null) ?? null
    );
  }

  if (email) {
    setPendingVerificationEmail(email);
  }
};

export const useSignUp = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const setVerificationFromEnvelope = useAuthStore(
    (state) => state.setVerificationFromEnvelope
  );
  const setPendingVerificationEmail = useAuthStore(
    (state) => state.setPendingVerificationEmail
  );

  const mutation = useMutation<
    SignUpResponse,
    AxiosError<ApiErrorResponse>,
    SignUpData,
    { email: string }
  >({
    mutationFn: signUp,
    onMutate: async (variables) => ({ email: variables.email }),
    onSuccess: (data) => {
      setUser(data.user);
      setIsAuthenticated(false);
      handleVerificationEnvelope(data, {
        setVerificationFromEnvelope,
        setPendingVerificationEmail,
        email: data.user.email,
      });
      toast.success(data.message ?? "Verification code sent.");
      navigate("/verify-otp");
    },
    onError: (error, variables, context) => {
      const payload = error.response?.data;
      handleVerificationEnvelope(payload ?? null, {
        setVerificationFromEnvelope,
        setPendingVerificationEmail,
        email: context?.email ?? variables.email,
      });
      toast.error(payload?.message ?? "Unable to create account.");
    },
  });

  return {
    signupMutation: mutation.mutate,
    signupAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const setUser = useAuthStore((state) => state.setUser);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const setVerificationFromEnvelope = useAuthStore(
    (state) => state.setVerificationFromEnvelope
  );
  const setPendingVerificationEmail = useAuthStore(
    (state) => state.setPendingVerificationEmail
  );
  const clearVerification = useAuthStore((state) => state.clearVerification);

  const mutation = useMutation<
    LoginResponse,
    AxiosError<ApiErrorResponse>,
    LoginData,
    { email: string }
  >({
    mutationFn: login,
    onMutate: async (variables) => ({ email: variables.email }),
    onSuccess: (data) => {
      setUser(data.user);
      setIsAuthenticated(true);
      clearVerification();
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      toast.success(data.message ?? "Welcome back!");
      navigate(data.user.isOnBoarded ? "/" : "/onboarding");
    },
    onError: (error, variables, context) => {
      const payload = error.response?.data;

      if (payload?.code === "ACCOUNT_NOT_VERIFIED") {
        handleVerificationEnvelope(payload, {
          setVerificationFromEnvelope,
          setPendingVerificationEmail,
          email: context?.email ?? variables.email,
        });
        toast.error(
          payload.message ?? "Please verify your email address to continue."
        );
        navigate("/verify-otp");
        return;
      }

      toast.error(payload?.message ?? "Invalid email or password.");
    },
  });

  return {
    loginMutation: mutation.mutate,
    loginAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const clearUser = useAuthStore((state) => state.clearUser);
  const setIsAuthenticated = useAuthStore(
    (state) => state.setIsAuthenticated
  );
  const setUser = useAuthStore((state) => state.setUser);

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: (data) => {
      setUser(null);
      setIsAuthenticated(false);
      clearUser();
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
      toast.success(data?.message ?? "Logged out successfully");
      navigate("/login", { replace: true });
    },
  });

  return {
    logoutMutation: mutation.mutate,
    logoutAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

export const useVerifyOtp = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const setVerificationFromEnvelope = useAuthStore(
    (state) => state.setVerificationFromEnvelope
  );
  const clearVerification = useAuthStore((state) => state.clearVerification);
  const setPendingVerificationEmail = useAuthStore(
    (state) => state.setPendingVerificationEmail
  );

  const mutation = useMutation<
    VerifyOtpResponse,
    AxiosError<ApiErrorResponse>,
    VerifyOtpData
  >({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      setUser(data.user);
      setIsAuthenticated(true);
      clearVerification();
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      toast.success(data.message ?? "OTP verified successfully.");
      navigate(data.user.isOnBoarded ? "/" : "/onboarding");
    },
    onError: (error, variables) => {
      const payload = error.response?.data;
      handleVerificationEnvelope(payload ?? null, {
        setVerificationFromEnvelope,
        setPendingVerificationEmail,
        email: variables.email,
      });
      toast.error(payload?.message ?? "Verification failed.");
    },
  });

  return {
    verifyOtpMutation: mutation.mutate,
    verifyOtpAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

export const useResendOtp = () => {
  const setVerificationFromEnvelope = useAuthStore(
    (state) => state.setVerificationFromEnvelope
  );
  const setPendingVerificationEmail = useAuthStore(
    (state) => state.setPendingVerificationEmail
  );

  const mutation = useMutation<
    ResendOtpResponse,
    AxiosError<ApiErrorResponse>,
    Pick<VerifyOtpData, "email">
  >({
    mutationFn: resendOtp,
    onSuccess: (data, variables) => {
      handleVerificationEnvelope(data, {
        setVerificationFromEnvelope,
        setPendingVerificationEmail,
        email: variables.email,
      });
      toast.success(data.message ?? "Verification code resent.");
    },
    onError: (error, variables) => {
      const payload = error.response?.data;
      handleVerificationEnvelope(payload ?? null, {
        setVerificationFromEnvelope,
        setPendingVerificationEmail,
        email: variables.email,
      });
      toast.error(payload?.message ?? "Unable to resend verification code.");
    },
  });

  return {
    resendOtpMutation: mutation.mutate,
    resendOtpAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};
