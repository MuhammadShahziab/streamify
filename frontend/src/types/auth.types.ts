import type { User } from "./user.types";

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
}

export interface VerificationMeta {
  expiresAt: string;
  expiresInMinutes: number;
  maxAttempts: number;
  attemptsRemaining: number;
  resendIntervalSeconds: number;
  resendAvailableAt?: string;
}

export interface VerificationEnvelope {
  meta?: {
    verification: VerificationMeta | null;
  } | null;
  expiresAt?: string | null;
  retryAt?: string | null;
}

export interface BaseResponse {
  success: boolean;
  message?: string;
}

export interface SignUpResponse extends BaseResponse, VerificationEnvelope {
  user: User;
}

export interface ResendOtpResponse extends BaseResponse, VerificationEnvelope {}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse extends BaseResponse {
  user: User;
}

export interface VerifyOtpData {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse extends BaseResponse {
  user: User;
}

export interface RecomendedUsersResponse {
  recommendedUsers:[User];
} 

export interface GetAuthUserResponse {
  success: boolean;
  user: User;
}

export interface ApiErrorResponse {
  message?: string;
  code?: string;
  meta?: VerificationEnvelope["meta"];
  retryAt?: string;
}

export type OnboardingData = {
  fullName: string;
  bio: string;
  profilePic: string;
  nativeLanguage: string;
  learningLanguage: string;
  country: string;
};
