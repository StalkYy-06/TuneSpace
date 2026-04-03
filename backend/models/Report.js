import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
        required: true
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    reportedUsername: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        enum: ["harassment", "misinformation", "negativity", "other"],
        required: true
    },
    comment: {
        type: String,
        default: "",
        maxLength: 500
    },
    reviewContent: {
        username: String,
        rating: Number,
        reviewText: String,
        contentType: String,
        contentId: String,
        contentName: String
    },
    status: {
        type: String,
        enum: ["pending", "reviewed", "resolved", "dismissed", "invalid"],
        default: "pending"
    },
    // Admin action tracking
    actionTaken: {
        type: String,
        enum: ["none", "warning_issued", "review_deleted", "user_banned", "invalid_report"],
        default: "none"
    },
    handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null
    },
    handledByUsername: {
        type: String,
        default: null
    },
    handledAt: {
        type: Date,
        default: null
    },
    adminNotes: {
        type: String,
        default: "",
        maxLength: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for efficient queries
reportSchema.index({ reviewId: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ "reviewContent.username": 1 });

export default mongoose.model("Report", reportSchema);