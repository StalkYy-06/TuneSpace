import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    username: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        enum: ["artist", "album"],
        required: true
    },
    contentId: {
        type: String,
        required: true
    },
    contentName: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    reviewText: {
        type: String,
        default: "",
        maxLength: 1000
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for efficient queries
reviewSchema.index({ contentType: 1, contentId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ likes: -1 });

export default mongoose.model("Review", reviewSchema);