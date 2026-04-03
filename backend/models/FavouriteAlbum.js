import mongoose from "mongoose";

const favouriteAlbumSchema = new mongoose.Schema({
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

// Prevent duplicate favourites
favouriteAlbumSchema.index({ userId: 1, albumId: 1 }, { unique: true });
// Fast lookup of a user's favourites
favouriteAlbumSchema.index({ userId: 1, createdAt: -1 });
// Fast count of favourites per album
favouriteAlbumSchema.index({ albumId: 1 });

export default mongoose.model("FavouriteAlbum", favouriteAlbumSchema);
