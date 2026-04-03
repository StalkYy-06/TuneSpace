import express from "express";
import User from "../models/User.js";
import Review from "../models/Review.js";
import UserFollow from "../models/UserFollow.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to verify JWT token (optional for viewing profiles)
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

// Required auth middleware
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

// Get user profile by username
router.get("/user/:username", optionalAuth, async (req, res) => {
    try {
        const { username } = req.params;

        // Find user
        const user = await User.findOne({ username }).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Get user's reviews
        const reviews = await Review.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(20);

        // Get follower and following counts
        const [followersCount, followingCount] = await Promise.all([
            UserFollow.countDocuments({ followingId: user._id }),
            UserFollow.countDocuments({ followerId: user._id })
        ]);

        // Check if current user is following this user
        let isFollowing = false;
        if (req.userId) {
            const followRecord = await UserFollow.findOne({
                followerId: req.userId,
                followingId: user._id
            });
            isFollowing = !!followRecord;
        }

        // Calculate review stats
        const totalReviews = reviews.length;
        const avgRating = reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 0;
        const totalLikes = reviews.reduce((sum, r) => sum + (r.likes || 0), 0);

        res.json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt
            },
            stats: {
                totalReviews,
                avgRating,
                totalLikes,
                followersCount,
                followingCount
            },
            reviews,
            isFollowing,
            isOwnProfile: req.userId && req.userId === user._id.toString()
        });
    } catch (err) {
        console.error("Error fetching user profile:", err);
        res.status(500).json({ success: false, message: "Error fetching profile" });
    }
});

// Follow a user
router.post("/follow/:userId", requireAuth, async (req, res) => {
    try {
        const targetUserId = req.params.userId;

        // Can't follow yourself
        if (targetUserId === req.userId) {
            return res.status(400).json({
                success: false,
                message: "You cannot follow yourself"
            });
        }

        // Check if target user exists
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if already following
        const existingFollow = await UserFollow.findOne({
            followerId: req.userId,
            followingId: targetUserId
        });

        if (existingFollow) {
            return res.status(400).json({
                success: false,
                message: "Already following this user"
            });
        }

        // Create follow record
        const follow = new UserFollow({
            followerId: req.userId,
            followingId: targetUserId
        });

        await follow.save();

        // Get updated counts
        const followersCount = await UserFollow.countDocuments({ followingId: targetUserId });

        res.json({
            success: true,
            message: "User followed successfully",
            followersCount
        });
    } catch (err) {
        console.error("Error following user:", err);
        res.status(500).json({ success: false, message: "Error following user" });
    }
});

// Unfollow a user
router.post("/unfollow/:userId", requireAuth, async (req, res) => {
    try {
        const targetUserId = req.params.userId;

        const result = await UserFollow.findOneAndDelete({
            followerId: req.userId,
            followingId: targetUserId
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Not following this user"
            });
        }

        // Get updated counts
        const followersCount = await UserFollow.countDocuments({ followingId: targetUserId });

        res.json({
            success: true,
            message: "User unfollowed successfully",
            followersCount
        });
    } catch (err) {
        console.error("Error unfollowing user:", err);
        res.status(500).json({ success: false, message: "Error unfollowing user" });
    }
});

// Get user's followers
router.get("/user/:userId/followers", async (req, res) => {
    try {
        const follows = await UserFollow.find({ followingId: req.params.userId })
            .populate('followerId', 'username profilePicture bio')
            .sort({ createdAt: -1 })
            .limit(50);

        const followers = follows.map(f => f.followerId);

        res.json({
            success: true,
            followers,
            count: followers.length
        });
    } catch (err) {
        console.error("Error fetching followers:", err);
        res.status(500).json({ success: false, message: "Error fetching followers" });
    }
});

// Get user's following
router.get("/user/:userId/following", async (req, res) => {
    try {
        const follows = await UserFollow.find({ followerId: req.params.userId })
            .populate('followingId', 'username profilePicture bio')
            .sort({ createdAt: -1 })
            .limit(50);

        const following = follows.map(f => f.followingId);

        res.json({
            success: true,
            following,
            count: following.length
        });
    } catch (err) {
        console.error("Error fetching following:", err);
        res.status(500).json({ success: false, message: "Error fetching following" });
    }
});

// Get activity feed for the logged-in user
router.get("/activity/feed", requireAuth, async (req, res) => {
    try {
        const userId = req.userId;

        // Find the current user
        const currentUser = await User.findById(userId).select("username");
        if (!currentUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const activities = [];

        // 1. Reviews written by this user
        const userReviews = await Review.find({ userId })
            .sort({ createdAt: -1 })
            .limit(30);

        userReviews.forEach(r => {
            activities.push({
                type: "reviewed",
                contentType: r.contentType,
                contentId: r.contentId,
                contentName: r.contentName,
                rating: r.rating,
                reviewText: r.reviewText,
                reviewId: r._id,
                timestamp: r.createdAt
            });
        });

        // 2. Users this user started following
        const followingActions = await UserFollow.find({ followerId: userId })
            .sort({ createdAt: -1 })
            .limit(30)
            .populate("followingId", "username profilePicture");

        followingActions.forEach(f => {
            if (f.followingId) {
                activities.push({
                    type: "followed_user",
                    targetUsername: f.followingId.username,
                    targetProfilePicture: f.followingId.profilePicture,
                    targetUserId: f.followingId._id,
                    timestamp: f.createdAt
                });
            }
        });

        // 3. Users who started following this user
        const followerActions = await UserFollow.find({ followingId: userId })
            .sort({ createdAt: -1 })
            .limit(30)
            .populate("followerId", "username profilePicture");

        followerActions.forEach(f => {
            if (f.followerId) {
                activities.push({
                    type: "new_follower",
                    fromUsername: f.followerId.username,
                    fromProfilePicture: f.followerId.profilePicture,
                    fromUserId: f.followerId._id,
                    timestamp: f.createdAt
                });
            }
        });

        // 4. Reviews liked by this user (reviews where likedBy contains userId)
        const likedReviews = await Review.find({ likedBy: userId })
            .sort({ updatedAt: -1 })
            .limit(20)
            .select("contentName contentType contentId username updatedAt createdAt");

        likedReviews.forEach(r => {
            activities.push({
                type: "liked_review",
                contentName: r.contentName,
                contentType: r.contentType,
                contentId: r.contentId,
                reviewAuthor: r.username,
                timestamp: r.updatedAt || r.createdAt
            });
        });

        // Sort all activities by timestamp descending
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
            success: true,
            activities: activities.slice(0, 50)
        });
    } catch (err) {
        console.error("Error fetching activity feed:", err);
        res.status(500).json({ success: false, message: "Error fetching activity feed" });
    }
});

export default router;