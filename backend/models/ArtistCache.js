import mongoose from "mongoose";

const topAlbumSchema = new mongoose.Schema({
    lastfm_key: String,  // so we can link to album detail
    title: String,
    playcount: Number,
    cover_url: String,
    thumb_url: String,
    lastfm_url: String,
    mbid: String,
}, { _id: false });

const artistCacheSchema = new mongoose.Schema({
    // artist name lowercase — used as the URL param
    lastfm_key: { type: String, required: true, unique: true, index: true },
    mbid: { type: String, default: "" },
    name: { type: String, required: true },
    image_url: String,       // extralarge image
    thumb_url: String,       // medium image
    lastfm_url: String,
    lastfm_playcount: { type: Number, default: 0 },
    lastfm_listeners: { type: Number, default: 0 },
    lastfm_tags: [String],
    lastfm_bio: String,
    similar_artists: [{ name: String, lastfm_key: String, image_url: String }],
    top_albums: [topAlbumSchema],
    lastFetched: { type: Date, default: Date.now },
}, { timestamps: true });

artistCacheSchema.virtual("isStale").get(function () {
    return Date.now() - this.lastFetched > 7 * 24 * 60 * 60 * 1000;
});

artistCacheSchema.index({ lastfm_listeners: -1 });
artistCacheSchema.index({ lastfm_playcount: -1 });

export default mongoose.model("ArtistCache", artistCacheSchema);