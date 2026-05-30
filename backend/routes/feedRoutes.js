import express from "express";
import jwt from "jsonwebtoken";
import FeedPost from "../models/FeedPost.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import JWT_SECRET from "../utils/jwtSecret.js";

const router = express.Router();

const optionalAuth = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.userId = decoded.id;
        }
    } catch { /* guest */ }
    next();
};

const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch {
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

// ── GET /api/feed  — paginated global feed ────────────────────────────
router.get("/", optionalAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const posts = await FeedPost.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Attach isLiked for the requesting user
        const userId = req.userId;
        const enriched = posts.map(p => ({
            ...p,
            isLiked: userId ? p.likedBy.some(id => id.toString() === userId) : false
        }));

        const total = await FeedPost.countDocuments();

        res.json({ success: true, posts: enriched, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching feed" });
    }
});

// ── GET /api/feed/user/:userId — posts by a specific user ─────────────
router.get("/user/:userId", async (req, res) => {
    try {
        const posts = await FeedPost.find({ userId: req.params.userId })
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, posts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching user feed" });
    }
});

// ── POST /api/feed/share — share a review to the feed ─────────────────
router.post("/share", verifyToken, async (req, res) => {
    try {
        const {
            reviewId, contentType, contentId, contentName,
            artistName, coverUrl, rating, reviewText
        } = req.body;

        if (!reviewId) {
            return res.status(400).json({ success: false, message: "reviewId is required" });
        }

        // Verify the review belongs to this user
        const review = await Review.findById(reviewId);
        if (!review) return res.status(404).json({ success: false, message: "Review not found" });
        if (review.userId.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: "Not your review" });
        }

        // Check not already shared
        const existing = await FeedPost.findOne({ reviewId });
        if (existing) {
            return res.status(400).json({ success: false, message: "Already shared", post: existing });
        }

        const user = await User.findById(req.userId);

        const post = new FeedPost({
            userId: req.userId,
            reviewId,
            username: user.username,
            profilePicture: user.profilePicture || null,
            contentType: contentType || review.contentType,
            contentId: contentId || review.contentId,
            contentName: contentName || review.contentName,
            artistName: artistName || "",
            coverUrl: coverUrl || "",
            rating: rating || review.rating,
            reviewText: reviewText || review.reviewText
        });

        await post.save();
        res.json({ success: true, message: "Shared to feed", post });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error sharing review" });
    }
});

// ── DELETE /api/feed/:postId — unshare a post ─────────────────────────
router.delete("/:postId", verifyToken, async (req, res) => {
    try {
        const post = await FeedPost.findById(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });
        if (post.userId.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: "Not your post" });
        }
        await FeedPost.findByIdAndDelete(req.params.postId);
        res.json({ success: true, message: "Unshared from feed" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error unsharing" });
    }
});

// ── POST /api/feed/:postId/like — toggle like ─────────────────────────
router.post("/:postId/like", verifyToken, async (req, res) => {
    try {
        const post = await FeedPost.findById(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const idx = post.likedBy.findIndex(id => id.toString() === req.userId);
        if (idx === -1) {
            post.likedBy.push(req.userId);
        } else {
            post.likedBy.splice(idx, 1);
        }
        post.likes = post.likedBy.length;
        await post.save();

        res.json({ success: true, likes: post.likes, isLiked: idx === -1 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error toggling like" });
    }
});

// ── GET /api/feed/check/:reviewId — check if a review is already shared ─
router.get("/check/:reviewId", verifyToken, async (req, res) => {
    try {
        const post = await FeedPost.findOne({ reviewId: req.params.reviewId });
        res.json({ success: true, isShared: !!post, post: post || null });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error checking share status" });
    }
});

export default router;
