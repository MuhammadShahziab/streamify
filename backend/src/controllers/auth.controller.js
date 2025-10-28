import { upsertStreamUser } from "../lib/stream.js";
import Otp from "../models/Otp.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/email.js";
import bcrypt from "bcryptjs";
import { generateOtp } from "../utils/generateOtp.js";

export const signUp = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
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

    const existingUser = await User.findOne({ email });

    const sendOtpToUser = async (user) => {
      const otp = generateOtp(); // 4-digit string
      const hashedOtp = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 mins ahead

      await Otp.deleteMany({ email });
      await Otp.create({ email, otpHash: hashedOtp, expiresAt });

      await sendEmail(
        email,
        "Your Streamify Verification Code",
        `<h3>Welcome to Streamify 🎉</h3><p>Your verification code is:</p><h2>${otp}</h2><p>This code is valid until ${expiresAt.toLocaleTimeString()}.</p>`
      );

      return { user, expiresAt };
    };

    if (existingUser) {
      if (existingUser.isVerified) {
        return res
          .status(400)
          .json({ message: "User already exists and is verified" });
      }

      const result = await sendOtpToUser(existingUser);
      return res.status(200).json({
        success: true,
        message: "User already registered but not verified. OTP resent.",
        user: result.user,
        expiresAt: result.expiresAt,
      });
    }

    // Create new user
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const newUser = await User.create({
      fullName,
      email,
      password,
      profilePic: randomAvatar,
    });

    await upsertStreamUser({
      id: newUser._id.toString(),
      name: newUser.fullName,
      image: newUser.profilePic || "",
    });

    const result = await sendOtpToUser(newUser);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: result.user,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error("Error in signup controller", error);
    res.status(500).json({ message: "Server error" });
  }
};

// verify otp controller
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP has expired or is invalid" });
    }

    // ⏰ Manual expiration check
    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteMany({ email }); // clean up
      return res.status(400).json({ message: "OTP has expired" });
    }

    const isValidOtp = await bcrypt.compare(otp.trim(), otpRecord.otpHash);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ Mark user as verified
    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await Otp.deleteMany({ email }); // delete used OTP

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const logIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid Email or Password" });
    }
    const isMatchPasword = await user.matchPassword(password);

    if (!isMatchPasword) {
      return res.status(400).json({ message: "Invalid Email or Password" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user,
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
        ...req.body,
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
      user: updateUser,
    });
  } catch (error) {
    console.log("Error in onBoarded controller", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const logout = async (req, res) => {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Loggout successfully" });
};
