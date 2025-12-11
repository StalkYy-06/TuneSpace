import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    otp: {
        type: String,
        required: true,
    },
    purpose: {
        type: String,
        enum: ["login", "forgot-password"],
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => Date.now() + 10 * 60 * 1000, // 10 minutes
        index: { expires: "10m" }, // Auto-delete after expiry
    },
}, { timestamps: true });

export default mongoose.model("Otp", otpSchema);