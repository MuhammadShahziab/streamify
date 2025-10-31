import jwt from "jsonwebtoken";

const JWT_COOKIE_NAME = process.env.JWT_COOKIE_NAME || "jwt";
const isProduction = process.env.NODE_ENV === "production";
const DEFAULT_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export const createAuthToken = (userId, options = {}) =>
  jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: options.expiresIn || "7d" }
  );

export const setAuthCookie = (res, token, options = {}) => {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: options.maxAge ?? DEFAULT_TOKEN_TTL,
  };

  res.cookie(JWT_COOKIE_NAME, token, cookieOptions);
  return cookieOptions;
};

export const clearAuthCookie = (res) => {
  res.clearCookie(JWT_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
  });
};

export const getAuthCookieName = () => JWT_COOKIE_NAME;
