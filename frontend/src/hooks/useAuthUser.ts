import { getAuthUser, logout, verifyOtp } from "../lib/api";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signUP } from "../lib/api";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { useEffect } from "react";
import type { AxiosError } from "axios";

export const useAuthUser = () => {
  const { setUser, setIsAuthenticated } = useAuthStore();

  const { data, isLoading, isSuccess, isError } = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser,
    retry: false,
  });
  console.log(data, "auth user");
  useEffect(() => {
    if (isSuccess && data) {
      setUser(data.user);
      setIsAuthenticated(true);
    }
    if (isError) {
      setIsAuthenticated(false);
    }
  }, [isSuccess, isError, data]);

  return { authUser: data?.user, isLoading };
};

export const useSignUp = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setOtpExpiresAt = useAuthStore((s) => s.setOtpExpiresAt);

  const { mutate, isPending, error } = useMutation({
    mutationFn: signUP,
    onSuccess: (data) => {
      setUser(data.user);
      setOtpExpiresAt(data.expiresAt);
      console.log(data, "signup data success");
      navigate("/verify-otp");
    },
    onError: (error) => {
      console.log(error, "API SIGNUP ERROR");
    },
  });
  return { isPending, error, signupMutation: mutate };
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { mutate, isPending, error } = useMutation({
    mutationFn: logout,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      console.log(data, "LOGOUT SUCCESS");
      toast.success("Logged out successfully");
      navigate("/login");
    },
  });
  return { logoutMutation: mutate, isPending, error };
};
export const useVerifyOtp = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate, isPending, error } = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      console.log(data, "VERIFY OTP RESPONSE");
      toast.success(data?.message);
      navigate("/onboarding");
    },
    onError: (error) => {
      const err = error as AxiosError<{ message: string }>;
      console.log(err, "VERIFY OTP RESPONSE ERROR");
      const msg = err.response?.data?.message || "Something went wrong";
      toast.error(msg);
    },
  });
  return { mutate, isPending, error };
};
