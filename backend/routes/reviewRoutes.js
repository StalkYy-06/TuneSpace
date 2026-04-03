import express from "express";
import Review from "../models/Review.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        req.userId = decoded.id;
        next();
    } catch (err) {
        console.error("Token verification error:", err);
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

// Create or update review
router.post("/create", verifyToken, async (req, res) => {
    try {
        const { contentType, contentId, contentName, rating, reviewText } = req.body;

        // Validate input
        if (!contentType || !contentId || !contentName || !rating) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
        }

        // Get the user's actual username from the database
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if user already reviewed this content
        const existingReview = await Review.findOne({
            userId: req.userId,
            contentType,
            contentId
        });

        let review;
        if (existingReview) {
            // Update existing review
            existingReview.rating = rating;
            existingReview.reviewText = reviewText || "";
            existingReview.updatedAt = new Date();
            review = await existingReview.save();
        } else {
            // Create new review with the user's actual username
            review = new Review({
                userId: req.userId,
                username: user.username,
                contentType,
                contentId,
                contentName,
                rating,
                reviewText: reviewText || ""
            });
            review = await review.save();
        }

        res.json({ success: true, message: "Review saved successfully", review });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error saving review" });
    }
});

// Like/Unlike a review
router.post("/:reviewId/like", verifyToken, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        const userIndex = review.likedBy.indexOf(req.userId);

        if (userIndex === -1) {
            // User hasn't liked this review yet, so add the like
            review.likedBy.push(req.userId);
            review.likes = review.likedBy.length;
        } else {
            // User already liked this review, so remove the like
            review.likedBy.splice(userIndex, 1);
            review.likes = review.likedBy.length;
        }

        await review.save();

        res.json({
            success: true,
            likes: review.likes,
            isLiked: userIndex === -1
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error updating like" });
    }
});

// Report a review
router.post("/:reviewId/report", verifyToken, async (req, res) => {
    try {
        const { reason, comment } = req.body;

        if (!reason) {
            return res.status(400).json({ success: false, message: "Reason is required" });
        }

        const validReasons = ["harassment", "misinformation", "negativity", "other"];
        if (!validReasons.includes(reason)) {
            return res.status(400).json({ success: false, message: "Invalid reason" });
        }

        const review = await Review.findById(req.params.reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // Check if user already reported this review
        const existingReport = await Report.findOne({
            reviewId: req.params.reviewId,
            reportedBy: req.userId
        });

        if (existingReport) {
            return res.status(400).json({ success: false, message: "You have already reported this review" });
        }

        // Get reporter's username
        const user = await User.findById(req.userId);

        // Create the report
        const report = new Report({
            reviewId: req.params.reviewId,
            reportedBy: req.userId,
            reportedUsername: user.username,
            reason,
            comment: comment || "",
            reviewContent: {
                username: review.username,
                rating: review.rating,
                reviewText: review.reviewText,
                contentType: review.contentType,
                contentId: review.contentId,
                contentName: review.contentName
            }
        });

        await report.save();

        res.json({ success: true, message: "Review reported successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error reporting review" });
    }
});

// Get user's review for artist - specific route
router.get("/artist/:id/user", verifyToken, async (req, res) => {
    try {
        const review = await Review.findOne({
            userId: req.userId,
            contentType: "artist",
            contentId: req.params.id
        });

        res.json({ success: true, review: review || null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching review" });
    }
});

// Get user's review for album - specific route
router.get("/album/:id/user", verifyToken, async (req, res) => {
    try {
        const review = await Review.findOne({
            userId: req.userId,
            contentType: "album",
            contentId: req.params.id
        });

        res.json({ success: true, review: review || null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching review" });
    }
});

// Get reviews for artist - specific route
router.get("/artist/:id", async (req, res) => {
    try {
        const reviews = await Review.find({
            contentType: "artist",
            contentId: req.params.id
        })
            .sort({ likes: -1, createdAt: -1 })
            .limit(50);

        const averageRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        const ratingDistribution = {
            5: reviews.filter(r => r.rating === 5).length,
            4: reviews.filter(r => r.rating === 4).length,
            3: reviews.filter(r => r.rating === 3).length,
            2: reviews.filter(r => r.rating === 2).length,
            1: reviews.filter(r => r.rating === 1).length
        };

        res.json({
            success: true,
            reviews,
            averageRating,
            totalReviews: reviews.length,
            ratingDistribution
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching reviews" });
    }
});

// Get reviews for album - specific route
router.get("/album/:id", async (req, res) => {
    try {
        const reviews = await Review.find({
            contentType: "album",
            contentId: req.params.id
        })
            .sort({ likes: -1, createdAt: -1 })
            .limit(50);

        const averageRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        const ratingDistribution = {
            5: reviews.filter(r => r.rating === 5).length,
            4: reviews.filter(r => r.rating === 4).length,
            3: reviews.filter(r => r.rating === 3).length,
            2: reviews.filter(r => r.rating === 2).length,
            1: reviews.filter(r => r.rating === 1).length
        };

        res.json({
            success: true,
            reviews,
            averageRating,
            totalReviews: reviews.length,
            ratingDistribution
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching reviews" });
    }
});

// Delete review
router.delete("/:reviewId", verifyToken, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        if (review.userId.toString() !== req.userId) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this review" });
        }

        await Review.findByIdAndDelete(req.params.reviewId);
        res.json({ success: true, message: "Review deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error deleting review" });
    }
});

// Generic routes (fallback)
// Get reviews for any content
router.get("/:contentType/:contentId", async (req, res) => {
    try {
        const { contentType, contentId } = req.params;

        const reviews = await Review.find({
            contentType,
            contentId
        })
            .sort({ likes: -1, createdAt: -1 })
            .limit(50);

        const averageRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;

        const ratingDistribution = {
            5: reviews.filter(r => r.rating === 5).length,
            4: reviews.filter(r => r.rating === 4).length,
            3: reviews.filter(r => r.rating === 3).length,
            2: reviews.filter(r => r.rating === 4).length,
            1: reviews.filter(r => r.rating === 1).length
        };

        res.json({
            success: true,
            reviews,
            averageRating,
            totalReviews: reviews.length,
            ratingDistribution
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching reviews" });
    }
});

// Get user's review for any content
router.get("/:contentType/:contentId/user", verifyToken, async (req, res) => {
    try {
        const { contentType, contentId } = req.params;

        const review = await Review.findOne({
            userId: req.userId,
            contentType,
            contentId
        });

        res.json({ success: true, review: review || null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching review" });
    }
});

export default router;