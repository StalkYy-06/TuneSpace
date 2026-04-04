/**
 * musicRoutes.js — 100% Last.fm, no Discogs
 *
 * URL IDs use lastfm_key = encodeURIComponent(artistName + "||" + albumName)
 * for albums, and encodeURIComponent(artistName) for artists.
 *
 * Endpoints:
 *   GET /api/music/search?q=&type=album|artist|all&page=1
 *   GET /api/music/album/:key          (key = encoded "artist||album")
 *   GET /api/music/artist/:key         (key = encoded artistName)
 *   GET /api/music/home                (trending albums + popular artists from cache)
 */

import express from "express";
import axios from "axios";
import AlbumCache from "../models/AlbumCache.js";
import ArtistCache from "../models/ArtistCache.js";
import Review from "../models/Review.js";

const router = express.Router();

const LASTFM = "https://ws.audioscrobbler.com/2.0";
const DEEZER = "https://api.deezer.com";
const KEY = () => process.env.LASTFM_API_KEY || "";

// ── Last.fm helpers ─────────────────────────────────────────────────

const lfm = async (params, timeout = 8000) => {
    const { data } = await axios.get(LASTFM, {
        params: { ...params, api_key: KEY(), format: "json" },
        timeout,
    });
    if (data.error) throw new Error(`Last.fm error ${data.error}: ${data.message}`);
    return data;
};

// Pick best image URL from Last.fm image array
const pickImage = (images, size = "extralarge") => {
    if (!Array.isArray(images)) return null;
    const found = images.find(i => i.size === size);
    const url = found?.["#text"] || images[images.length - 1]?.["#text"] || null;
    return url && url !== "" ? url : null;
};

// Known Last.fm placeholder image URLs (all artists share these when images are unavailable)
const LASTFM_PLACEHOLDER_FRAGMENTS = [
    "2a96cbd8b46e442fc41c2b86b821562f",
    "noimage",
    "no_image",
];

const isPlaceholderImage = (url) => {
    if (!url) return true;
    return LASTFM_PLACEHOLDER_FRAGMENTS.some(frag => url.includes(frag));
};

// Fetch artist image from Deezer as a fallback
const getDeezerArtistImage = async (artistName) => {
    try {
        const { data } = await axios.get(`${DEEZER}/search/artist`, {
            params: { q: artistName, limit: 1 },
            timeout: 6000,
        });
        const artist = data?.data?.[0];
        if (!artist) return { image_url: null, thumb_url: null };
        // Deezer provides: picture_xl, picture_big, picture_medium, picture_small
        return {
            image_url: artist.picture_xl || artist.picture_big || artist.picture_medium || null,
            thumb_url: artist.picture_medium || artist.picture_small || null,
        };
    } catch {
        return { image_url: null, thumb_url: null };
    }
};

// Build a stable cache key
const albumKey = (artist, album) =>
    `${artist.toLowerCase().trim()}||${album.toLowerCase().trim()}`;

const artistKey = (name) => name.toLowerCase().trim();

// ── Build album doc from Last.fm album.getInfo response ────────────
const buildAlbumDoc = (lfmAlbum) => {
    const images = lfmAlbum.image || [];
    const tags = Array.isArray(lfmAlbum.tags?.tag)
        ? lfmAlbum.tags.tag.map(t => t.name)
        : lfmAlbum.tags?.tag?.name ? [lfmAlbum.tags.tag.name] : [];

    const tracks = Array.isArray(lfmAlbum.tracks?.track)
        ? lfmAlbum.tracks.track
        : lfmAlbum.tracks?.track ? [lfmAlbum.tracks.track] : [];

    const tracklist = tracks.map((t, i) => ({
        rank: t["@attr"]?.rank || i + 1,
        title: t.name,
        duration_ms: t.duration ? parseInt(t.duration) * 1000 : 0,
        url: t.url || null,
    }));

    const artist = lfmAlbum.artist || "Unknown";
    const title = lfmAlbum.name || "Unknown";

    return {
        lastfm_key: albumKey(artist, title),
        mbid: lfmAlbum.mbid || "",
        title,
        artist,
        cover_url: pickImage(images, "extralarge"),
        thumb_url: pickImage(images, "medium"),
        lastfm_url: lfmAlbum.url || null,
        lastfm_playcount: parseInt(lfmAlbum.playcount || 0),
        lastfm_listeners: parseInt(lfmAlbum.listeners || 0),
        lastfm_tags: tags,
        lastfm_wiki: lfmAlbum.wiki?.summary || null,
        tracklist,
        total_tracks: tracklist.length,
        lastFetched: new Date(),
    };
};

// ── Build artist doc from Last.fm artist.getInfo response ──────────
const buildArtistDoc = (lfmArtist, topAlbumsData, deezerImages = null) => {
    const images = lfmArtist.image || [];
    const tags = Array.isArray(lfmArtist.tags?.tag)
        ? lfmArtist.tags.tag.map(t => t.name)
        : lfmArtist.tags?.tag?.name ? [lfmArtist.tags.tag.name] : [];

    const similar = Array.isArray(lfmArtist.similar?.artist)
        ? lfmArtist.similar.artist.map(a => ({
            name: a.name,
            lastfm_key: artistKey(a.name),
            image_url: pickImage(a.image, "medium"),
        }))
        : [];

    // Top albums
    const rawAlbums = Array.isArray(topAlbumsData?.topalbums?.album)
        ? topAlbumsData.topalbums.album
        : topAlbumsData?.topalbums?.album ? [topAlbumsData.topalbums.album] : [];

    const top_albums = rawAlbums.slice(0, 12).map(a => ({
        lastfm_key: albumKey(lfmArtist.name, a.name),
        title: a.name,
        playcount: parseInt(a.playcount || 0),
        cover_url: pickImage(a.image, "extralarge"),
        thumb_url: pickImage(a.image, "medium"),
        lastfm_url: a.url || null,
        mbid: a.mbid || "",
    }));

    const name = lfmArtist.name;

    // Use Last.fm image if it's not a placeholder, otherwise fall back to Deezer
    const lfmImageUrl = pickImage(images, "extralarge");
    const lfmThumbUrl = pickImage(images, "medium");
    const image_url = !isPlaceholderImage(lfmImageUrl) ? lfmImageUrl : (deezerImages?.image_url || null);
    const thumb_url = !isPlaceholderImage(lfmThumbUrl) ? lfmThumbUrl : (deezerImages?.thumb_url || null);

    return {
        lastfm_key: artistKey(name),
        mbid: lfmArtist.mbid || "",
        name,
        image_url,
        thumb_url,
        lastfm_url: lfmArtist.url || null,
        lastfm_playcount: parseInt(lfmArtist.stats?.playcount || 0),
        lastfm_listeners: parseInt(lfmArtist.stats?.listeners || 0),
        lastfm_tags: tags,
        lastfm_bio: lfmArtist.bio?.summary || null,
        similar_artists: similar,
        top_albums,
        lastFetched: new Date(),
    };
};

// ══════════════════════════════════════════════════════════════════
// SEARCH
// GET /api/music/search?q=blonde&type=album|artist|all&page=1
// ══════════════════════════════════════════════════════════════════
router.get("/search", async (req, res) => {
    const { q, type = "all", page = 1 } = req.query;
    if (!q?.trim()) {
        return res.status(400).json({ success: false, message: "Query required" });
    }

    try {
        const searches = [];

        if (type === "all" || type === "album") {
            searches.push(
                lfm({ method: "album.search", album: q.trim(), limit: 20, page })
                    .then(d => (d.results?.albummatches?.album || []).map(a => ({
                        type: "album",
                        key: encodeURIComponent(albumKey(a.artist, a.name)),
                        title: a.name,
                        artist: a.artist,
                        cover_url: pickImage(a.image, "extralarge"),
                        thumb_url: pickImage(a.image, "medium"),
                        mbid: a.mbid || "",
                    })))
                    .catch(() => [])
            );
        }

        if (type === "all" || type === "artist") {
            searches.push(
                lfm({ method: "artist.search", artist: q.trim(), limit: 20, page })
                    .then(async d => {
                        const artists = d.results?.artistmatches?.artist || [];
                        return Promise.all(artists.map(async a => {
                            const lfmImg = pickImage(a.image, "extralarge");
                            let image_url = isPlaceholderImage(lfmImg) ? null : lfmImg;
                            let thumb_url = isPlaceholderImage(pickImage(a.image, "medium")) ? null : pickImage(a.image, "medium");
                            if (!image_url) {
                                const dz = await getDeezerArtistImage(a.name);
                                image_url = dz.image_url;
                                thumb_url = dz.thumb_url;
                            }
                            return {
                                type: "artist",
                                key: encodeURIComponent(artistKey(a.name)),
                                name: a.name,
                                image_url,
                                thumb_url,
                                listeners: parseInt(a.listeners || 0),
                                mbid: a.mbid || "",
                            };
                        }));
                    })
                    .catch(() => [])
            );
        }

        const results = (await Promise.all(searches)).flat();

        // If only one type searched, pagination from Last.fm
        res.json({ success: true, results, query: q.trim(), type });
    } catch (err) {
        console.error("Search error:", err.message);
        res.status(500).json({ success: false, message: "Search failed" });
    }
});

// ══════════════════════════════════════════════════════════════════
// ALBUM DETAIL
// GET /api/music/album/:key   (key = encodeURIComponent("artist||album"))
// ══════════════════════════════════════════════════════════════════
router.get("/album/:key", async (req, res) => {
    const key = decodeURIComponent(req.params.key);

    if (!key.includes("||")) {
        return res.status(400).json({ success: false, message: "Invalid album key. Expected format: artist||album" });
    }

    const [artist, album] = key.split("||");

    try {
        // ── Cache hit ─────────────────────────────────────────────
        const cached = await AlbumCache.findOne({ lastfm_key: key });
        if (cached && !cached.isStale) {
            return res.json({ success: true, album: cached, source: "cache" });
        }

        // ── Fetch from Last.fm ────────────────────────────────────
        let lfmData;
        try {
            const data = await lfm({
                method: "album.getinfo",
                artist: artist.trim(),
                album: album.trim(),
                autocorrect: 1,
            });
            lfmData = data.album;
        } catch (err) {
            if (cached) return res.json({ success: true, album: cached, source: "stale_cache" });
            return res.status(404).json({ success: false, message: "Album not found on Last.fm" });
        }

        const doc = buildAlbumDoc(lfmData);

        const saved = await AlbumCache.findOneAndUpdate(
            { lastfm_key: doc.lastfm_key },
            { $set: doc },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, album: saved, source: "api" });
    } catch (err) {
        console.error("Album detail error:", err.message);
        res.status(500).json({ success: false, message: "Failed to load album" });
    }
});

// ══════════════════════════════════════════════════════════════════
// ARTIST DETAIL
// GET /api/music/artist/:key   (key = encodeURIComponent(artistName))
// ══════════════════════════════════════════════════════════════════
router.get("/artist/:key", async (req, res) => {
    const key = decodeURIComponent(req.params.key);

    try {
        // ── Cache hit ─────────────────────────────────────────────
        const cached = await ArtistCache.findOne({ lastfm_key: key });
        if (cached && !cached.isStale) {
            // If the cached artist has a placeholder/missing image, fix it on the fly
            if (isPlaceholderImage(cached.image_url)) {
                const deezerImages = await getDeezerArtistImage(cached.name);
                if (deezerImages.image_url) {
                    cached.image_url = deezerImages.image_url;
                    cached.thumb_url = deezerImages.thumb_url;
                    await ArtistCache.findOneAndUpdate(
                        { lastfm_key: key },
                        { $set: { image_url: deezerImages.image_url, thumb_url: deezerImages.thumb_url } }
                    );
                }
            }
            return res.json({ success: true, artist: cached, source: "cache" });
        }

        // ── Fetch artist.getInfo + artist.getTopAlbums + Deezer in parallel ─
        let artistData, topAlbumsData;
        try {
            [{ data: { artist: artistData } }, topAlbumsData] = await Promise.all([
                axios.get(LASTFM, {
                    params: { method: "artist.getinfo", artist: key, autocorrect: 1, api_key: KEY(), format: "json" },
                    timeout: 10000,
                }),
                lfm({ method: "artist.gettopalbums", artist: key, autocorrect: 1, limit: 12 })
                    .catch(() => null),
            ]);
        } catch (err) {
            if (cached) return res.json({ success: true, artist: cached, source: "stale_cache" });
            return res.status(404).json({ success: false, message: "Artist not found on Last.fm" });
        }

        // Fetch Deezer image in parallel (best-effort)
        const lfmImageUrl = pickImage(artistData.image || [], "extralarge");
        const deezerImages = isPlaceholderImage(lfmImageUrl)
            ? await getDeezerArtistImage(artistData.name)
            : { image_url: null, thumb_url: null };

        const doc = buildArtistDoc(artistData, topAlbumsData, deezerImages);

        const saved = await ArtistCache.findOneAndUpdate(
            { lastfm_key: doc.lastfm_key },
            { $set: doc },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, artist: saved, source: "api" });
    } catch (err) {
        console.error("Artist detail error:", err.message);
        res.status(500).json({ success: false, message: "Failed to load artist" });
    }
});

// ══════════════════════════════════════════════════════════════════
// HOME
// GET /api/music/home
// Returns top albums + top artists from cache, sorted by listeners
// ══════════════════════════════════════════════════════════════════
router.get("/home", async (req, res) => {
    try {
        // Get review counts to boost albums reviewed by users
        const reviewCounts = await Review.aggregate([
            { $match: { contentType: "album" } },
            { $group: { _id: "$contentId", count: { $sum: 1 }, avgRating: { $avg: "$rating" } } },
            { $sort: { count: -1 } },
            { $limit: 50 },
        ]);

        const reviewMap = {};
        reviewCounts.forEach(r => { reviewMap[r._id] = { count: r.count, avgRating: r.avgRating }; });
        const reviewedKeys = reviewCounts.map(r => r._id);

        // Albums: reviewed first, then fill with most-listened from cache
        let trendingAlbums = reviewedKeys.length > 0
            ? await AlbumCache.find({ lastfm_key: { $in: reviewedKeys } }).lean()
            : [];

        if (trendingAlbums.length < 16) {
            const existing = new Set(trendingAlbums.map(a => a.lastfm_key));
            const extras = await AlbumCache.find({ lastfm_key: { $nin: [...existing] } })
                .sort({ lastfm_listeners: -1 })
                .limit(16 - trendingAlbums.length)
                .lean();
            trendingAlbums = [...trendingAlbums, ...extras];
        }

        // Sort: reviewed albums first by count, then by listeners
        trendingAlbums.sort((a, b) => {
            const ra = reviewMap[a.lastfm_key]?.count || 0;
            const rb = reviewMap[b.lastfm_key]?.count || 0;
            if (rb !== ra) return rb - ra;
            return (b.lastfm_listeners || 0) - (a.lastfm_listeners || 0);
        });

        trendingAlbums = trendingAlbums.slice(0, 16).map(a => ({
            ...a,
            reviewCount: reviewMap[a.lastfm_key]?.count || 0,
            avgRating: reviewMap[a.lastfm_key]?.avgRating
                ? parseFloat(reviewMap[a.lastfm_key].avgRating.toFixed(1))
                : null,
        }));

        // Artists: simply top by listeners from cache
        const popularArtists = await ArtistCache.find({ lastfm_listeners: { $gt: 0 } })
            .sort({ lastfm_listeners: -1 })
            .limit(12)
            .lean();

        res.json({ success: true, trendingAlbums, popularArtists });
    } catch (err) {
        console.error("Home error:", err.message);
        res.status(500).json({ success: false, message: "Failed to load home data" });
    }
});

export default router;