import mongoose from "mongoose";

const userWarningSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    username: {
        type: String,
        required: true
    },
    warningType: {
        type: String,
        enum: ["minor", "moderate", "severe"],
        required: true
    },
    reason: {
        type: String,
        required: true,
        maxLength: 500
    },
    relatedReportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report"
    },
    relatedReviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    },
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true
    },
    issuedByUsername: {
        type: String,
        required: true
    },
    acknowledged: {
        type: Boolean,
        default: false
    },
    acknowledgedAt: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for efficient queries
userWarningSchema.index({ userId: 1, isActive: 1 });
userWarningSchema.index({ createdAt: -1 });

export default mongoose.model("UserWarning", userWarningSchema);