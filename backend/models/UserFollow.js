import mongoose from "mongoose";

const userFollowSchema = new mongoose.Schema({
    followerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    followingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Compound index to prevent duplicate follows
userFollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Index for efficient queries
userFollowSchema.index({ followerId: 1 });
userFollowSchema.index({ followingId: 1 });

export default mongoose.model("UserFollow", userFollowSchema);