import bcrypt from "bcryptjs";

import { upsertStreamUser } from "../lib/stream.js";
import Otp from "../models/Otp.js";
import User from "../models/User.js";
import { clearAuthCookie, createAuthToken, setAuthCookie } from "../utils/authTokens.js";
import { sendEmail } from "../utils/email.js";
import { generateOtp } from "../utils/generateOtp.js";

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_TTL_MINUTES || 2);
const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_RESEND_INTERVAL_SECONDS = Number(process.env.OTP_RESEND_INTERVAL_SECONDS || 60);

class OtpRateLimitError extends Error {
  constructor(message, { retryAt, meta }) {
    super(message);
    this.name = "OtpRateLimitError";
    this.retryAt = retryAt;
    this.meta = meta;
  }
}

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const sanitizeUser = (user) => {
  if (!user) return null;
  const plainUser = user.toObject ? user.toObject() : { ...user };
  delete plainUser.password;
  return plainUser;
};

const buildVerificationMeta = (expiresAt, attempts = 0, extra = {}) => ({
  expiresAt,
  maxAttempts: OTP_MAX_ATTEMPTS,
  attemptsRemaining: Math.max(OTP_MAX_ATTEMPTS - attempts, 0),
  expiresInMinutes: OTP_EXPIRY_MINUTES,
  resendIntervalSeconds: OTP_RESEND_INTERVAL_SECONDS,
  ...extra,
});

const calculateResendAvailableAt = (otpRecord) => {
  if (!otpRecord?.createdAt) return null;
  return new Date(
    otpRecord.createdAt.getTime() + OTP_RESEND_INTERVAL_SECONDS * 1000
  );
};

const sendVerificationEmail = async ({ email, otp }) => {
  await sendEmail(
    email,
    "Your Streamify Verification Code",
    `<h3>Welcome to Streamify 🎉</h3><p>Your verification code is:</p><h2>${otp}</h2><p>This code is valid for ${OTP_EXPIRY_MINUTES} minute${
      OTP_EXPIRY_MINUTES === 1 ? "" : "s"
    }.</p>`
  );
};

const issueOtpForUser = async (user, options = {}) => {
  const { allowRateBypass = false } = options;

  const existingOtp = await Otp.findOne({ email: user.email }).sort({
    createdAt: -1,
  });

  if (!allowRateBypass && existingOtp) {
    const resendAvailableAt = calculateResendAvailableAt(existingOtp);
    if (resendAvailableAt && resendAvailableAt > new Date()) {
      throw new OtpRateLimitError("Please wait before requesting another code.", {
        retryAt: resendAvailableAt,
        meta: {
          verification: buildVerificationMeta(
            existingOtp.expiresAt,
            existingOtp.attempts,
            { resendAvailableAt }
          ),
        },
      });
    }
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await Otp.deleteMany({ email: user.email });
  await Otp.create({
    email: user.email,
    otpHash: hashedOtp,
    expiresAt,
    attempts: 0,
  });

  await sendVerificationEmail({ email: user.email, otp });

  const resendAvailableAt = new Date(
    Date.now() + OTP_RESEND_INTERVAL_SECONDS * 1000
  );
  return buildVerificationMeta(expiresAt, 0, { resendAvailableAt });
};

const respondWithVerification = (res, statusCode, payload) => {
  const responseBody = {
    success: false,
    ...payload,
  };

  if (!responseBody.expiresAt && payload?.meta?.verification?.expiresAt) {
    responseBody.expiresAt = payload.meta.verification.expiresAt;
  }

  if (!responseBody.retryAt && payload?.retryAt) {
    responseBody.retryAt = payload.retryAt;
  }

  if (
    !responseBody.retryAt &&
    payload?.meta?.verification?.resendAvailableAt
  ) {
    responseBody.retryAt = payload.meta.verification.resendAvailableAt;
  }

  return res.status(statusCode).json(responseBody);
};

const handleOtpRateLimit = (res, error) =>
  respondWithVerification(res, 429, {
    code: "OTP_RATE_LIMITED",
    message: error.message,
    retryAt: error.retryAt,
    ...(error.meta || {}),
  });

export const signUp = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    if (fullName.length < 3) {
      return res
        .status(400)
        .json({ message: "Full name must be at least 3 characters long" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res
          .status(400)
          .json({ message: "User already exists and is verified" });
      }

      try {
        const verificationMeta = await issueOtpForUser(existingUser);
        return res.status(200).json({
          success: true,
          message:
            "User already registered but not verified. Verification code resent.",
          user: sanitizeUser(existingUser),
          expiresAt: verificationMeta.expiresAt,
          meta: { verification: verificationMeta },
        });
      } catch (error) {
        if (error instanceof OtpRateLimitError) {
          return handleOtpRateLimit(res, error);
        }
        throw error;
      }
    }

    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      profilePic: randomAvatar,
    });

    await upsertStreamUser({
      id: newUser._id.toString(),
      name: newUser.fullName,
      image: newUser.profilePic || "",
    });

    try {
      const verificationMeta = await issueOtpForUser(newUser, {
        allowRateBypass: true,
      });

      return res.status(201).json({
        success: true,
        message: "User created successfully. Please verify your email.",
        user: sanitizeUser(newUser),
        expiresAt: verificationMeta.expiresAt,
        meta: { verification: verificationMeta },
      });
    } catch (error) {
      if (error instanceof OtpRateLimitError) {
        return handleOtpRateLimit(res, error);
      }
      throw error;
    }
  } catch (error) {
    console.error("Error in signup controller", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedOtp = String(otp).trim();

    if (!normalizedOtp) {
      return res.status(400).json({ code: "OTP_INVALID", message: "Invalid OTP" });
    }

    const otpRecord = await Otp.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      return res.status(400).json({
        code: "OTP_NOT_FOUND",
        message: "OTP has expired or is invalid",
      });
    }

    const resendAvailableAt = calculateResendAvailableAt(otpRecord);

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteMany({ email: normalizedEmail });
      return res.status(400).json({
        code: "OTP_EXPIRED",
        message: "OTP has expired",
        meta: {
          verification: buildVerificationMeta(
            otpRecord.expiresAt,
            OTP_MAX_ATTEMPTS,
            { resendAvailableAt }
          ),
        },
      });
    }

    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      await Otp.deleteMany({ email: normalizedEmail });
      return res.status(429).json({
        code: "OTP_MAX_ATTEMPTS",
        message: "Too many invalid attempts. Please request a new OTP.",
        meta: {
          verification: buildVerificationMeta(
            otpRecord.expiresAt,
            OTP_MAX_ATTEMPTS,
            { resendAvailableAt }
          ),
        },
      });
    }

    const isValidOtp = await bcrypt.compare(normalizedOtp, otpRecord.otpHash);

    if (!isValidOtp) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
        await Otp.deleteMany({ email: normalizedEmail });
        return res.status(429).json({
          code: "OTP_MAX_ATTEMPTS",
          message: "Too many invalid attempts. Please request a new OTP.",
          meta: {
            verification: buildVerificationMeta(
              otpRecord.expiresAt,
              otpRecord.attempts,
              { resendAvailableAt }
            ),
          },
        });
      }

      return res.status(400).json({
        code: "OTP_INVALID",
        message: "Invalid OTP",
        meta: {
          verification: buildVerificationMeta(
            otpRecord.expiresAt,
            otpRecord.attempts,
            { resendAvailableAt }
          ),
        },
      });
    }

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      await Otp.deleteMany({ email: normalizedEmail });
      return res.status(404).json({ message: "User not found" });
    }

    await Otp.deleteMany({ email: normalizedEmail });

    const token = createAuthToken(user._id);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.isVerified) {
      return res.status(200).json({
        success: true,
        message:
          "If the account requires verification, we have sent a new code.",
        expiresAt: null,
        meta: { verification: null },
      });
    }

    try {
      const verificationMeta = await issueOtpForUser(user);
      return res.status(200).json({
        success: true,
        message: "Verification code resent.",
        expiresAt: verificationMeta.expiresAt,
        meta: { verification: verificationMeta },
      });
    } catch (error) {
      if (error instanceof OtpRateLimitError) {
        return handleOtpRateLimit(res, error);
      }
      throw error;
    }
  } catch (error) {
    console.error("Error in resendOtp:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const logIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid Email or Password" });
    }

    if (!user.isVerified) {
      try {
        const verificationMeta = await issueOtpForUser(user);
        return respondWithVerification(res, 403, {
          code: "ACCOUNT_NOT_VERIFIED",
          message:
            "Account not verified. We have sent a new verification code to your email.",
          meta: { verification: verificationMeta },
        });
      } catch (error) {
        if (error instanceof OtpRateLimitError) {
          return handleOtpRateLimit(res, error);
        }
        throw error;
      }
    }

    const isMatchPassword = await user.matchPassword(password);

    if (!isMatchPassword) {
      return res.status(400).json({ message: "Invalid Email or Password" });
    }

    const token = createAuthToken(user._id);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.log("Error in login controller", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const onBoarded = async (req, res) => {
  try {
    const {
      fullName,
      bio,
      nativeLanguage,
      learningLanguage,
      country,
      city,
      profilePic,
    } = req.body;
    const userId = req.user._id;
    if (!bio || !nativeLanguage || !learningLanguage || !country) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !country && "country",
          !city && "city",
        ].filter(Boolean),
      });
    }

    const updateUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName: fullName?.trim() ?? req.user.fullName,
        bio,
        nativeLanguage,
        learningLanguage,
        country,
        city,
        profilePic,
        isOnBoarded: true,
      },
      { new: true }
    );
    if (!updateUser) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      await upsertStreamUser({
        id: updateUser._id.toString(),
        name: updateUser.fullName,
        image: updateUser.profilePic || "",
      });
    } catch (error) {
      console.log("Error in updating stream user", error);
    }

    res.status(200).json({
      success: true,
      user: sanitizeUser(updateUser),
    });
  } catch (error) {
    console.log("Error in onBoarded controller", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  clearAuthCookie(res);
  res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};
