import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { clearAuthCookie, getAuthCookieName } from "../utils/authTokens.js";

const JWT_COOKIE_NAME = getAuthCookieName();

const UNAUTHORIZED_RESPONSE = {
  missing: {
    status: 401,
    body: { code: "TOKEN_MISSING", message: "Authentication required. Please log in." },
  },
  expired: {
    status: 401,
    body: { code: "TOKEN_EXPIRED", message: "Session expired. Please log in again." },
  },
  invalid: {
    status: 401,
    body: { code: "TOKEN_INVALID", message: "Authentication token is invalid." },
  },
  userNotFound: {
    status: 401,
    body: { code: "USER_NOT_FOUND", message: "User associated with token no longer exists." },
  },
};

const extractToken = (req) => {
  const cookieToken = req?.cookies?.[JWT_COOKIE_NAME];
  const headerToken = req?.headers?.authorization;

  if (cookieToken) return cookieToken;

  if (headerToken && headerToken.startsWith("Bearer ")) {
    return headerToken.slice(7).trim();
  }

  return null;
};

export const protectRoute = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      clearAuthCookie(res);
      return res.status(UNAUTHORIZED_RESPONSE.missing.status).json(UNAUTHORIZED_RESPONSE.missing.body);
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        clearAuthCookie(res);
        return res.status(UNAUTHORIZED_RESPONSE.expired.status).json(UNAUTHORIZED_RESPONSE.expired.body);
      }

      if (error.name === "JsonWebTokenError") {
        clearAuthCookie(res);
        return res.status(UNAUTHORIZED_RESPONSE.invalid.status).json(UNAUTHORIZED_RESPONSE.invalid.body);
      }

      throw error;
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      clearAuthCookie(res);
      return res
        .status(UNAUTHORIZED_RESPONSE.userNotFound.status)
        .json(UNAUTHORIZED_RESPONSE.userNotFound.body);
    }

    req.user = user;
    return next();
  } catch (error) {
    console.log("Error in protectRoute middleware", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
