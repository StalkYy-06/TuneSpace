import mongoose from "mongoose";

const trackSchema = new mongoose.Schema({
    rank: Number,
    title: String,
    duration_ms: Number,
    url: String,
}, { _id: false });

const albumCacheSchema = new mongoose.Schema({
    // "artist_lowercase||album_lowercase" — used as the URL-safe unique ID
    lastfm_key: { type: String, required: true, unique: true, index: true },
    mbid: { type: String, default: "" },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    cover_url: String,       // extralarge image from Last.fm
    thumb_url: String,       // medium image
    lastfm_url: String,
    lastfm_playcount: { type: Number, default: 0 },
    lastfm_listeners: { type: Number, default: 0 },
    lastfm_tags: [String],
    lastfm_wiki: String,
    tracklist: [trackSchema],
    total_tracks: { type: Number, default: 0 },
    lastFetched: { type: Date, default: Date.now },
}, { timestamps: true });

albumCacheSchema.virtual("isStale").get(function () {
    return Date.now() - this.lastFetched > 7 * 24 * 60 * 60 * 1000;
});

albumCacheSchema.index({ lastfm_listeners: -1 });
albumCacheSchema.index({ lastfm_playcount: -1 });
albumCacheSchema.index({ artist: 1 });

export default mongoose.model("AlbumCache", albumCacheSchema);