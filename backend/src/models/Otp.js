import mongoose from "mongoose";
const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL via expiresAt field
    attempts: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
