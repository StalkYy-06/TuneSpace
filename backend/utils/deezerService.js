import axios from "axios";

const DEEZER_API_BASE = "https://api.deezer.com";

// Cache configuration 
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

// Helper to check cache
const getCached = (key) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    cache.delete(key);
    return null;
};

// Helper to set cache
const setCache = (key, data) => {
    cache.set(key, { data, timestamp: Date.now() });
};

// Search for albums
export const searchAlbums = async (query, limit = 25) => {
    const cacheKey = `albums_${query}_${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${DEEZER_API_BASE}/search/album`, {
            params: { q: query, limit }
        });
        setCache(cacheKey, response.data);
        return response.data;
    } catch (error) {
        console.error("Error searching albums:", error);
        throw error;
    }
};

// Search for artists
export const searchArtists = async (query, limit = 25) => {
    const cacheKey = `artists_${query}_${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${DEEZER_API_BASE}/search/artist`, {
            params: { q: query, limit }
        });
        setCache(cacheKey, response.data);
        return response.data;
    } catch (error) {
        console.error("Error searching artists:", error);
        throw error;
    }
};

// Get album details by ID
export const getAlbumById = async (albumId) => {
    const cacheKey = `album_${albumId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${DEEZER_API_BASE}/album/${albumId}`);
        setCache(cacheKey, response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching album:", error);
        throw error;
    }
};

// Get artist details by ID
export const getArtistById = async (artistId) => {
    const cacheKey = `artist_${artistId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${DEEZER_API_BASE}/artist/${artistId}`);
        setCache(cacheKey, response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching artist:", error);
        throw error;
    }
};

// Get artist's top tracks
export const getArtistTopTracks = async (artistId, limit = 10) => {
    const cacheKey = `artist_top_${artistId}_${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${DEEZER_API_BASE}/artist/${artistId}/top`, {
            params: { limit }
        });
        setCache(cacheKey, response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching artist top tracks:", error);
        throw error;
    }
};

// Get artist's albums
export const getArtistAlbums = async (artistId, limit = 25) => {
    const cacheKey = `artist_albums_${artistId}_${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${DEEZER_API_BASE}/artist/${artistId}/albums`, {
            params: { limit }
        });
        setCache(cacheKey, response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching artist albums:", error);
        throw error;
    }
};

// Get chart data (top albums, artists, tracks)
export const getChartData = async () => {
    const cacheKey = "chart_data";
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${DEEZER_API_BASE}/chart`);
        setCache(cacheKey, response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching chart data:", error);
        throw error;
    }
};

// Get genre list
export const getGenres = async () => {
    const cacheKey = "genres";
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${DEEZER_API_BASE}/genre`);
        setCache(cacheKey, response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching genres:", error);
        throw error;
    }
};

// Get albums by genre
export const getAlbumsByGenre = async (genreId) => {
    const cacheKey = `genre_albums_${genreId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const response = await axios.get(`${DEEZER_API_BASE}/genre/${genreId}/artists`);
        setCache(cacheKey, response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching genre albums:", error);
        throw error;
    }
};