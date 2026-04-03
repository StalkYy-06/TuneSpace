import express from "express";
import FavouriteAlbum from "../models/FavouriteAlbum.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// ── Auth middleware ─────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

const optionalAuth = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
            req.userId = decoded.id;
        }
        next();
    } catch (err) {
        next();
    }
};

// ── Toggle favourite (add / remove) ────────────────────────────────
router.post("/toggle", requireAuth, async (req, res) => {
    try {
        const { albumId, albumName, artistName, coverImage } = req.body;

        if (!albumId || !albumName || !artistName) {
            return res.status(400).json({
                success: false,
                message: "albumId, albumName, and artistName are required"
            });
        }

        // Check if already favourited
        const existing = await FavouriteAlbum.findOne({
            userId: req.userId,
            albumId
        });

        if (existing) {
            // Remove
            await FavouriteAlbum.deleteOne({ _id: existing._id });
            const count = await FavouriteAlbum.countDocuments({ albumId });
            return res.json({
                success: true,
                isFavourited: false,
                message: "Album removed from favourites",
                favouriteCount: count
            });
        }

        // Add
        const fav = new FavouriteAlbum({
            userId: req.userId,
            albumId,
            albumName,
            artistName,
            coverImage: coverImage || null
        });
        await fav.save();

        const count = await FavouriteAlbum.countDocuments({ albumId });

        res.json({
            success: true,
            isFavourited: true,
            message: "Album added to favourites",
            favouriteCount: count
        });
    } catch (err) {
        console.error("Error toggling favourite:", err);
        if (err.code === 11000) {
            // Race condition – already exists, try removing
            await FavouriteAlbum.deleteOne({ userId: req.userId, albumId: req.body.albumId });
            const count = await FavouriteAlbum.countDocuments({ albumId: req.body.albumId });
            return res.json({
                success: true,
                isFavourited: false,
                message: "Album removed from favourites",
                favouriteCount: count
            });
        }
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ── Get current user's favourites ──────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
    try {
        const favourites = await FavouriteAlbum.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            favourites,
            count: favourites.length
        });
    } catch (err) {
        console.error("Error fetching favourites:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ── Get a specific user's favourites ───────────────────────────────
router.get("/user/:userId", async (req, res) => {
    try {
        const favourites = await FavouriteAlbum.find({ userId: req.params.userId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            favourites,
            count: favourites.length
        });
    } catch (err) {
        console.error("Error fetching user favourites:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ── Check if current user favourited a specific album ──────────────
router.get("/check/:albumId", requireAuth, async (req, res) => {
    try {
        const fav = await FavouriteAlbum.findOne({
            userId: req.userId,
            albumId: req.params.albumId
        });

        res.json({
            success: true,
            isFavourited: !!fav
        });
    } catch (err) {
        console.error("Error checking favourite:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ── Get total favourite count for an album ─────────────────────────
router.get("/count/:albumId", async (req, res) => {
    try {
        const count = await FavouriteAlbum.countDocuments({
            albumId: req.params.albumId
        });

        res.json({
            success: true,
            count
        });
    } catch (err) {
        console.error("Error counting favourites:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;
