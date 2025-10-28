import type { User } from "./user.types";

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
//   agreeToTerms: boolean;
}

export interface SignUpResponse {
  success: boolean;
  message: string;
  user: User;
  expiresAt:string;

}
export interface GetAuthUserResponse {
  success: boolean;
  user: User;
}

export type OnboardingData = {
  fullName: string;
  bio: string;
  profilePic: string;
  nativeLanguage: string;
  learningLanguage: string;
  country: string;
};