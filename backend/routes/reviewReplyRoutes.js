import express from "express";
import ReviewReply from "../models/ReviewReply.js";
import Review from "../models/Review.js";
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

// Create a reply to a review or another reply
router.post("/create", verifyToken, async (req, res) => {
    try {
        const { reviewId, parentReplyId, replyText } = req.body;

        if (!reviewId || !replyText) {
            return res.status(400).json({
                success: false,
                message: "Review ID and reply text are required"
            });
        }

        if (replyText.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Reply text cannot exceed 500 characters"
            });
        }

        // Verify review exists
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // If replying to another reply, verify it exists
        if (parentReplyId) {
            const parentReply = await ReviewReply.findById(parentReplyId);
            if (!parentReply) {
                return res.status(404).json({ success: false, message: "Parent reply not found" });
            }
        }

        // Get user info
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Create reply
        const reply = new ReviewReply({
            reviewId,
            parentReplyId: parentReplyId || null,
            userId: req.userId,
            username: user.username,
            replyText
        });

        await reply.save();

        res.json({
            success: true,
            message: "Reply posted successfully",
            reply
        });
    } catch (err) {
        console.error("Error creating reply:", err);
        res.status(500).json({ success: false, message: "Error posting reply" });
    }
});

// Get all replies for a review (with nested structure)
router.get("/review/:reviewId", async (req, res) => {
    try {
        const { reviewId } = req.params;

        // Get all replies for this review
        const replies = await ReviewReply.find({ reviewId })
            .sort({ createdAt: 1 }); // Oldest first for threaded view

        // Build nested structure
        const replyMap = {};
        const rootReplies = [];

        // First pass: create map
        replies.forEach(reply => {
            replyMap[reply._id] = {
                ...reply.toObject(),
                replies: []
            };
        });

        // Second pass: build tree
        replies.forEach(reply => {
            if (reply.parentReplyId) {
                // This is a nested reply
                if (replyMap[reply.parentReplyId]) {
                    replyMap[reply.parentReplyId].replies.push(replyMap[reply._id]);
                }
            } else {
                // This is a direct reply to the review
                rootReplies.push(replyMap[reply._id]);
            }
        });

        res.json({
            success: true,
            replies: rootReplies,
            totalCount: replies.length
        });
    } catch (err) {
        console.error("Error fetching replies:", err);
        res.status(500).json({ success: false, message: "Error fetching replies" });
    }
});

// Get reply count for a review
router.get("/review/:reviewId/count", async (req, res) => {
    try {
        const count = await ReviewReply.countDocuments({ reviewId: req.params.reviewId });

        res.json({
            success: true,
            count
        });
    } catch (err) {
        console.error("Error counting replies:", err);
        res.status(500).json({ success: false, message: "Error counting replies" });
    }
});

// Like/Unlike a reply
router.post("/:replyId/like", verifyToken, async (req, res) => {
    try {
        const reply = await ReviewReply.findById(req.params.replyId);

        if (!reply) {
            return res.status(404).json({ success: false, message: "Reply not found" });
        }

        const userIndex = reply.likedBy.indexOf(req.userId);

        if (userIndex === -1) {
            // Add like
            reply.likedBy.push(req.userId);
            reply.likes = reply.likedBy.length;
        } else {
            // Remove like
            reply.likedBy.splice(userIndex, 1);
            reply.likes = reply.likedBy.length;
        }

        await reply.save();

        res.json({
            success: true,
            likes: reply.likes,
            isLiked: userIndex === -1
        });
    } catch (err) {
        console.error("Error liking reply:", err);
        res.status(500).json({ success: false, message: "Error updating like" });
    }
});

// Edit a reply
router.patch("/:replyId", verifyToken, async (req, res) => {
    try {
        const { replyText } = req.body;

        if (!replyText || replyText.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Reply text is required and must be under 500 characters"
            });
        }

        const reply = await ReviewReply.findById(req.params.replyId);

        if (!reply) {
            return res.status(404).json({ success: false, message: "Reply not found" });
        }

        // Check if user owns this reply
        if (reply.userId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "You can only edit your own replies"
            });
        }

        reply.replyText = replyText;
        reply.isEdited = true;
        reply.editedAt = new Date();

        await reply.save();

        res.json({
            success: true,
            message: "Reply updated successfully",
            reply
        });
    } catch (err) {
        console.error("Error editing reply:", err);
        res.status(500).json({ success: false, message: "Error editing reply" });
    }
});

// Delete a reply
router.delete("/:replyId", verifyToken, async (req, res) => {
    try {
        const reply = await ReviewReply.findById(req.params.replyId);

        if (!reply) {
            return res.status(404).json({ success: false, message: "Reply not found" });
        }

        // Check if user owns this reply
        if (reply.userId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own replies"
            });
        }

        // Delete all nested replies first
        await ReviewReply.deleteMany({ parentReplyId: reply._id });

        // Delete the reply
        await ReviewReply.findByIdAndDelete(req.params.replyId);

        res.json({
            success: true,
            message: "Reply deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting reply:", err);
        res.status(500).json({ success: false, message: "Error deleting reply" });
    }
});

export default router;