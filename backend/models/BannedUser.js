import mongoose from "mongoose";

const bannedUserSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    bannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true
    },
    bannedByUsername: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true,
        maxLength: 500
    },
    bannedAt: {
        type: Date,
        default: Date.now
    },
    duration: {
        type: String,
        enum: ["temporary", "permanent"],
        default: "permanent"
    },
    expiresAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index for efficient queries
bannedUserSchema.index({ userId: 1 });
bannedUserSchema.index({ isActive: 1 });

export default mongoose.model("BannedUser", bannedUserSchema);