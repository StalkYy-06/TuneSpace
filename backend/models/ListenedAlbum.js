import mongoose from "mongoose";

const listenedAlbumSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    albumId: {
        type: String,
        required: true
    },
    albumName: {
        type: String,
        required: true
    },
    artistName: {
        type: String,
        required: true
    },
    coverImage: {
        type: String,
        default: null
    }
}, { timestamps: true });

// Prevent duplicate entries — one mark per user per album
listenedAlbumSchema.index({ userId: 1, albumId: 1 }, { unique: true });
// Fast lookup of a user's listened albums
listenedAlbumSchema.index({ userId: 1, createdAt: -1 });
// Fast count of listeners per album
listenedAlbumSchema.index({ albumId: 1 });

export default mongoose.model("ListenedAlbum", listenedAlbumSchema);