export type NonEmptyString = string & { __brand: "NonEmptyString" };

export interface User {
  _id: string;
  fullName: NonEmptyString;
  email: string;
  profilePic: string;
  bio: string;
  city?: string;
  country?: string;
  nativeLanguage?: string;
  learningLanguage?: string;
  friends?: string[];
  isOnBoarded: boolean;
  isVerified:boolean;
  createdAt: string;
  updatedAt: string;
}
