import express from "express";
import ListenedAlbum from "../models/ListenedAlbum.js";
import jwt from "jsonwebtoken";
import JWT_SECRET from "../utils/jwtSecret.js";

const router = express.Router();

// ── Auth middleware ─────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

// ── Toggle listened (mark / unmark) ────────────────────────────────
router.post("/toggle", requireAuth, async (req, res) => {
    try {
        const { albumId, albumName, artistName, coverImage } = req.body;

        if (!albumId || !albumName || !artistName) {
            return res.status(400).json({
                success: false,
                message: "albumId, albumName, and artistName are required"
            });
        }

        const existing = await ListenedAlbum.findOne({
            userId: req.userId,
            albumId
        });

        if (existing) {
            // Unmark as listened
            await ListenedAlbum.deleteOne({ _id: existing._id });
            const count = await ListenedAlbum.countDocuments({ albumId });
            return res.json({
                success: true,
                isListened: false,
                message: "Album removed from listened",
                listenedCount: count
            });
        }

        // Mark as listened
        const listened = new ListenedAlbum({
            userId: req.userId,
            albumId,
            albumName,
            artistName,
            coverImage: coverImage || null
        });
        await listened.save();

        const count = await ListenedAlbum.countDocuments({ albumId });

        res.json({
            success: true,
            isListened: true,
            message: "Album marked as listened",
            listenedCount: count
        });
    } catch (err) {
        console.error("Error toggling listened:", err);
        if (err.code === 11000) {
            // Race condition – already exists, remove it
            await ListenedAlbum.deleteOne({ userId: req.userId, albumId: req.body.albumId });
            const count = await ListenedAlbum.countDocuments({ albumId: req.body.albumId });
            return res.json({
                success: true,
                isListened: false,
                message: "Album removed from listened",
                listenedCount: count
            });
        }
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ── Check if current user has listened to a specific album ─────────
router.get("/check/:albumId", requireAuth, async (req, res) => {
    try {
        const record = await ListenedAlbum.findOne({
            userId: req.userId,
            albumId: req.params.albumId
        });
        res.json({ success: true, isListened: !!record });
    } catch (err) {
        console.error("Error checking listened:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ── Get total listener count for an album ──────────────────────────
router.get("/count/:albumId", async (req, res) => {
    try {
        const count = await ListenedAlbum.countDocuments({
            albumId: req.params.albumId
        });
        res.json({ success: true, count });
    } catch (err) {
        console.error("Error counting listeners:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ── Get current user's listened albums ────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
    try {
        const listened = await ListenedAlbum.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(100);
        res.json({ success: true, listened, count: listened.length });
    } catch (err) {
        console.error("Error fetching listened albums:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ── Get a specific user's listened albums (public) ─────────────────
router.get("/user/:userId", async (req, res) => {
    try {
        const listened = await ListenedAlbum.find({ userId: req.params.userId })
            .sort({ createdAt: -1 })
            .limit(100);
        res.json({ success: true, listened, count: listened.length });
    } catch (err) {
        console.error("Error fetching user listened albums:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;