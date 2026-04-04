import mongoose from "mongoose";
import axios from "axios";
import AlbumCache from "../models/AlbumCache.js";
import ArtistCache from "../models/ArtistCache.js";

const LASTFM = "https://ws.audioscrobbler.com/2.0";
const DEEZER = "https://api.deezer.com";
const KEY = () => process.env.LASTFM_API_KEY || "";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Known Last.fm placeholder image hash — all artists share this when images are unavailable
const LASTFM_PLACEHOLDER_FRAGMENTS = [
    "2a96cbd8b46e442fc41c2b86b821562f",
    "noimage",
    "no_image",
];

const isPlaceholderImage = (url) => {
    if (!url || url.trim() === "") return true;
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
        return {
            image_url: artist.picture_xl || artist.picture_big || artist.picture_medium || null,
            thumb_url: artist.picture_medium || artist.picture_small || null,
        };
    } catch {
        return { image_url: null, thumb_url: null };
    }
};

// ── Last.fm GET with retry + back-off ───────────────────────────────
const lfmGet = async (params, retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const { data } = await axios.get(LASTFM, {
                params: { ...params, api_key: KEY(), format: "json" },
                timeout: 15000,
            });
            if (data.error) throw new Error(`LFM err ${data.error}: ${data.message}`);
            return data;
        } catch (err) {
            if (attempt < retries - 1) {
                await sleep(1000 * (attempt + 1));
            } else {
                throw err;
            }
        }
    }
};

// ── Image picker ────────────────────────────────────────────────────
const pickImage = (images, size = "extralarge") => {
    if (!Array.isArray(images)) return null;
    const found = images.find(i => i.size === size);
    const url = found?.["#text"] || null;
    return url && url.trim() !== "" ? url : null;
};

// ── Key builders ────────────────────────────────────────────────────
const albumKey = (artist, album) =>
    `${String(artist).toLowerCase().trim()}||${String(album).toLowerCase().trim()}`;

const artistKey = (name) => String(name).toLowerCase().trim();

// 7 days
const STALE_MS = 7 * 24 * 60 * 60 * 1000;
const isFresh = (doc) =>
    doc && (Date.now() - new Date(doc.lastFetched).getTime()) < STALE_MS;

// ── Drop old Discogs indexes if they exist ──────────────────────────
const dropStaleIndexes = async () => {
    try {
        const albumIndexes = await AlbumCache.collection.indexes();
        for (const idx of albumIndexes) {
            if (idx.name && idx.name.includes("discogs_id")) {
                await AlbumCache.collection.dropIndex(idx.name);
                console.log(`[Seed] Dropped stale index: albumcaches.${idx.name}`);
            }
        }
    } catch (err) {
        // Index may not exist — ignore
    }

    try {
        const artistIndexes = await ArtistCache.collection.indexes();
        for (const idx of artistIndexes) {
            if (idx.name && idx.name.includes("discogs_id")) {
                await ArtistCache.collection.dropIndex(idx.name);
                console.log(`[Seed] Dropped stale index: artistcaches.${idx.name}`);
            }
        }
    } catch (err) {
        // Ignore
    }
};

// ── Process a single artist ─────────────────────────────────────────
const processArtist = async (artistName) => {
    const key = artistKey(artistName);

    // Skip if fresh
    const existing = await ArtistCache.findOne({ lastfm_key: key }).lean();
    if (isFresh(existing)) return { status: "skipped", albums: 0 };

    // Fetch in parallel
    let artistData = null;
    let topAlbumsData = null;

    try {
        [artistData, topAlbumsData] = await Promise.all([
            lfmGet({ method: "artist.getinfo", artist: artistName, autocorrect: 1 }),
            lfmGet({ method: "artist.gettopalbums", artist: artistName, autocorrect: 1, limit: 10 }),
        ]);
    } catch (err) {
        // If parallel fails, try sequentially with delay
        try {
            artistData = await lfmGet({ method: "artist.getinfo", artist: artistName, autocorrect: 1 });
            await sleep(300);
            topAlbumsData = await lfmGet({ method: "artist.gettopalbums", artist: artistName, autocorrect: 1, limit: 10 });
        } catch (err2) {
            throw new Error(`API fetch failed for "${artistName}": ${err2.message}`);
        }
    }

    if (!artistData?.artist) {
        throw new Error(`No artist data returned for "${artistName}"`);
    }

    const lfmArtist = artistData.artist;
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

    const rawAlbums = Array.isArray(topAlbumsData?.topalbums?.album)
        ? topAlbumsData.topalbums.album
        : topAlbumsData?.topalbums?.album
            ? [topAlbumsData.topalbums.album]
            : [];

    const top_albums = rawAlbums.slice(0, 10).map(a => ({
        lastfm_key: albumKey(lfmArtist.name, a.name),
        title: a.name,
        playcount: parseInt(a.playcount || 0),
        cover_url: pickImage(a.image, "extralarge"),
        thumb_url: pickImage(a.image, "medium"),
        lastfm_url: a.url || null,
        mbid: a.mbid || "",
    }));

    // ── Upsert artist ──────────────────────────────────────────────
    const lfmImageUrl = pickImage(images, "extralarge");
    const lfmThumbUrl = pickImage(images, "medium");

    let image_url = isPlaceholderImage(lfmImageUrl) ? null : lfmImageUrl;
    let thumb_url = isPlaceholderImage(lfmThumbUrl) ? null : lfmThumbUrl;

    // Fall back to Deezer if Last.fm gave us a placeholder
    if (!image_url) {
        const dz = await getDeezerArtistImage(lfmArtist.name);
        image_url = dz.image_url;
        thumb_url = dz.thumb_url;
        // Small delay to be polite to Deezer's API
        await sleep(150);
    }

    await ArtistCache.findOneAndUpdate(
        { lastfm_key: key },
        {
            $set: {
                lastfm_key: key,
                mbid: lfmArtist.mbid || "",
                name: lfmArtist.name,
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
            },
        },
        { upsert: true, new: true }
    );

    // ── Upsert each top album ──────────────────────────────────────
    let albumsCached = 0;
    for (const a of rawAlbums.slice(0, 10)) {
        const aKey = albumKey(lfmArtist.name, a.name);

        const existingAlbum = await AlbumCache.findOne({ lastfm_key: aKey }).lean();
        if (isFresh(existingAlbum)) continue;

        const albumImages = a.image || [];
        await AlbumCache.findOneAndUpdate(
            { lastfm_key: aKey },
            {
                $set: {
                    lastfm_key: aKey,
                    mbid: a.mbid || "",
                    title: a.name,
                    artist: lfmArtist.name,
                    cover_url: pickImage(albumImages, "extralarge"),
                    thumb_url: pickImage(albumImages, "medium"),
                    lastfm_url: a.url || null,
                    lastfm_playcount: parseInt(a.playcount || 0),
                    lastfm_listeners: 0,
                    lastfm_tags: tags,
                    lastFetched: new Date(),
                },
            },
            { upsert: true }
        );
        albumsCached++;
    }

    return { status: "cached", albums: albumsCached };
};

// ── Main export ─────────────────────────────────────────────────────
export const seedCache = async () => {
    if (!KEY()) {
        console.warn("[Seed] LASTFM_API_KEY not set — skipping.");
        return;
    }

    // ── Step 0: Drop stale indexes ─────────────────────────────────
    await dropStaleIndexes();

    const [existingArtists, existingAlbums] = await Promise.all([
        ArtistCache.countDocuments(),
        AlbumCache.countDocuments(),
    ]);
    console.log(`[Seed] Starting. DB: ${existingArtists} artists, ${existingAlbums} albums.`);

    // ── Step 1: Get 500 artist names ───────────────────────────────
    const PAGES = 10;
    const PER_PAGE = 50;
    let artistNames = [];

    console.log("[Seed] Fetching top 500 artists...");
    for (let page = 1; page <= PAGES; page++) {
        try {
            const data = await lfmGet({ method: "chart.gettopartists", limit: PER_PAGE, page });
            const artists = data?.artists?.artist || [];
            artistNames.push(...artists.map(a => a.name));
            console.log(`[Seed] Chart page ${page}/${PAGES} — ${artists.length} artists (total: ${artistNames.length})`);
        } catch (err) {
            console.error(`[Seed] Chart page ${page} failed:`, err.message);
        }
        await sleep(250);
    }

    if (artistNames.length === 0) {
        console.error("[Seed] No artists fetched — check LASTFM_API_KEY");
        return;
    }

    // ── Step 2: Fetch + cache each artist in batches of 3 ─────────
    // 3 concurrent × ~2 API calls each = ~6 calls/batch
    // 400ms sleep between batches → comfortably under rate limit
    const BATCH = 3;
    let cached = 0, skipped = 0, failed = 0, totalAlbums = 0;
    const firstFailures = [];

    for (let i = 0; i < artistNames.length; i += BATCH) {
        const batch = artistNames.slice(i, i + BATCH);

        const results = await Promise.allSettled(batch.map(name => processArtist(name)));

        for (let j = 0; j < results.length; j++) {
            const r = results[j];
            if (r.status === "fulfilled") {
                if (r.value.status === "skipped") skipped++;
                else { cached++; totalAlbums += r.value.albums; }
            } else {
                failed++;
                // Log first 5 unique failures to help debugging
                if (firstFailures.length < 5) {
                    firstFailures.push(`"${batch[j]}": ${r.reason?.message || r.reason}`);
                }
            }
        }

        const done = Math.min(i + BATCH, artistNames.length);

        // Print progress every 30 artists
        if (done % 30 === 0 || done === artistNames.length) {
            console.log(
                `[Seed] ${done}/${artistNames.length}` +
                ` | ✅ cached: ${cached}` +
                ` | ⏭ skipped: ${skipped}` +
                ` | ❌ failed: ${failed}` +
                ` | 💿 albums: ${totalAlbums}`
            );
        }

        await sleep(400);
    }

    // Print any failures for debugging
    if (firstFailures.length > 0) {
        console.warn("[Seed] Sample failures (first 5):");
        firstFailures.forEach(f => console.warn(`  → ${f}`));
    }

    // ── Step 3: Top tracks for extra album coverage ────────────────
    console.log("[Seed] Caching top tracks albums...");
    let trackAlbums = 0;
    try {
        for (let page = 1; page <= 5; page++) {
            const data = await lfmGet({ method: "chart.gettoptracks", limit: 50, page });
            const tracks = data?.tracks?.track || [];

            for (const track of tracks) {
                if (!track.artist?.name || !track.name) continue;
                const albumTitle = track.album?.title || track.name;
                const aKey = albumKey(track.artist.name, albumTitle);

                const existingAlbum = await AlbumCache.findOne({ lastfm_key: aKey }).lean();
                if (isFresh(existingAlbum)) continue;

                await AlbumCache.findOneAndUpdate(
                    { lastfm_key: aKey },
                    {
                        $set: {
                            lastfm_key: aKey,
                            mbid: track.mbid || "",
                            title: albumTitle,
                            artist: track.artist.name,
                            cover_url: pickImage(track.image, "extralarge"),
                            thumb_url: pickImage(track.image, "medium"),
                            lastfm_url: track.url || null,
                            lastfm_playcount: parseInt(track.playcount || 0),
                            lastfm_listeners: 0,
                            lastFetched: new Date(),
                        },
                    },
                    { upsert: true }
                );
                trackAlbums++;
            }

            await sleep(250);
        }
        console.log(`[Seed] Cached ${trackAlbums} albums from top tracks.`);
    } catch (err) {
        console.error("[Seed] Top tracks step failed:", err.message);
    }

    const [finalArtists, finalAlbums] = await Promise.all([
        ArtistCache.countDocuments(),
        AlbumCache.countDocuments(),
    ]);

    console.log(`[Seed] ✅ Complete! DB: ${finalArtists} artists, ${finalAlbums} albums.`);
};