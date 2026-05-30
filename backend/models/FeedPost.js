import mongoose from "mongoose";

const feedPostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
        required: true,
        unique: true  // one feed post per review
    },
    username: { type: String, required: true },
    profilePicture: { type: String, default: null },
    contentType: { type: String, enum: ["album", "artist"], required: true },
    contentId: { type: String, required: true },
    contentName: { type: String, required: true },
    artistName: { type: String, default: "" },
    coverUrl: { type: String, default: "" },
    rating: { type: Number, min: 1, max: 5, required: true },
    reviewText: { type: String, default: "" },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

feedPostSchema.index({ userId: 1 });
feedPostSchema.index({ createdAt: -1 });

export default mongoose.model("FeedPost", feedPostSchema);
