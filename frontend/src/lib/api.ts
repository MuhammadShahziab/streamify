import {
  type ApiErrorResponse,
  type GetAuthUserResponse,
  type LoginData,
  type LoginResponse,
  type OnboardingData,
  type RecomendedUsersResponse,
  type ResendOtpResponse,
  type SignUpData,
  type SignUpResponse,
  type VerifyOtpData,
  type VerifyOtpResponse,
} from "../types";
import { axiosInstance } from "./axios";

export const signUp = async (formData: SignUpData): Promise<SignUpResponse> => {
  const { data } = await axiosInstance.post<SignUpResponse>(
    "/auth/signup",
    formData
  );
  return data;
};

export const login = async (credentials: LoginData): Promise<LoginResponse> => {
  const { data } = await axiosInstance.post<LoginResponse>(
    "/auth/login",
    credentials
  );
  return data;
};

export const logout = async () => {
  const { data } = await axiosInstance.post("/auth/logout");
  return data;
};

export const getAuthUser = async () => {
  const { data } = await axiosInstance.get<GetAuthUserResponse>("/auth/me");
  return data;
};

export const verifyOtp = async (
  payload: VerifyOtpData
): Promise<VerifyOtpResponse> => {
  const { data } = await axiosInstance.post<VerifyOtpResponse>(
    "/auth/verify-otp",
    payload
  );
  return data;
};

export const resendOtp = async (
  payload: Pick<VerifyOtpData, "email">
): Promise<ResendOtpResponse> => {
  const { data } = await axiosInstance.post<ResendOtpResponse>(
    "/auth/resend-otp",
    payload
  );
  return data;
};

export const completeOnboarding = async (formData: OnboardingData) => {
  const { data } = await axiosInstance.post("/auth/onboarding", formData);
  return data;
};

export const getRecommendedUsers = async () => {
  const { data } = await axiosInstance.get<RecomendedUsersResponse>("/user/");
  return data.recommendedUsers;
};

export const getFriends = async () => {
  const { data } = await axiosInstance.get("/user/friends");
  return data;
};

export const getOutGoingFriendReqs = async () => {
  const { data } = await axiosInstance.get("/user/outgoing-friend-requests");
  return data;
};

export const sendFriendReq = async (id:string)=>{
  const{data} = await axiosInstance.post(`/user/friend-request/${id}`);
  return data;
}

export const getFriendRequests = async ()=>{
  const {data} = await axiosInstance.get("/user/friend-requests");
  return data
}
export const acceptFriendRequest = async (id:string)=>{
  const {data} = await axiosInstance.post(`/user/friend-request/${id}/accept`);
  return data;
}

export const getStreamToken = async ()=>{
  const {data} = await  axiosInstance.get("/chat/token");
  return data;
}

export type { ApiErrorResponse };
