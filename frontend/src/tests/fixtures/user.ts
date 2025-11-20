import type { User } from "../../types";

const isoNow = () => new Date().toISOString();

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  _id: "user_123",
  fullName: "Test User" as User["fullName"],
  email: "test-user@example.com",
  profilePic: "https://example.com/avatar.png",
  bio: "Polyglot adventurer",
  city: "Lisbon",
  country: "Portugal",
  nativeLanguage: "Portuguese",
  learningLanguage: "English",
  friends: [],
  isOnBoarded: true,
  isVerified: true,
  createdAt: isoNow(),
  updatedAt: isoNow(),
  ...overrides,
});
