import type { GetAuthUserResponse, OnboardingData, SignUpData, SignUpResponse } from "../types";
import { axiosInstance } from "./axios"

export const signUP = async (formData:SignUpData):Promise<SignUpResponse>=>{
const response = await axiosInstance.post("/auth/signup",formData);
console.log(response,"SIGNUP RESPONSE")
return response.data;
}

export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
}

export const getAuthUser = async () => {
  const response = await axiosInstance.get<GetAuthUserResponse>("/auth/me");
  console.log(response,"user")
  return response.data;
}

export const verifyOtp = async (data:any)=>{
  const response = await axiosInstance.post("/auth/verify-otp",data);
  console.log(response,"verify otp response")
  return response.data
}

export const completeOnboarding = async (formData:OnboardingData)=>{
  const response = await axiosInstance.post("/auth/onboarding", formData);
  return response.data;
}