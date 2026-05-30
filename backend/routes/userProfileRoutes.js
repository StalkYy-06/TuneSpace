import express from "express";
import User from "../models/User.js";
import Review from "../models/Review.js";
import UserFollow from "../models/UserFollow.js";
import FavouriteAlbum from "../models/FavouriteAlbum.js";
import ListenedAlbum from "../models/ListenedAlbum.js";
import jwt from "jsonwebtoken";
import JWT_SECRET from "../utils/jwtSecret.js";

const router = express.Router();

// Middleware to verify JWT token (optional for viewing profiles)
const optionalAuth = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
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
        const decoded = jwt.verify(token, JWT_SECRET);
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

        const user = await User.findOne({ username }).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const reviews = await Review.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(20);

        const [followersCount, followingCount, totalReviews, reviewStats] = await Promise.all([
            UserFollow.countDocuments({ followingId: user._id }),
            UserFollow.countDocuments({ followerId: user._id }),
            Review.countDocuments({ userId: user._id }),
            Review.aggregate([
                { $match: { userId: user._id } },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: "$rating" },
                        totalLikes: { $sum: "$likes" }
                    }
                }
            ])
        ]);

        const statsAgg = reviewStats[0] || { avgRating: 0, totalLikes: 0 };
        const avgRating = totalReviews > 0 ? Number(statsAgg.avgRating || 0).toFixed(1) : 0;
        const totalLikes = statsAgg.totalLikes || 0;

        let isFollowing = false;
        if (req.userId) {
            const followRecord = await UserFollow.findOne({
                followerId: req.userId,
                followingId: user._id
            });
            isFollowing = !!followRecord;
        }

        const totalReviewsCount = totalReviews;

        res.json({
            success: true,
            user: {
                _id: user._id,
                username: user.username,
                bio: user.bio,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt
            },
            stats: {
                totalReviews: totalReviewsCount,
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

        if (targetUserId === req.userId) {
            return res.status(400).json({ success: false, message: "You cannot follow yourself" });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const existingFollow = await UserFollow.findOne({
            followerId: req.userId,
            followingId: targetUserId
        });

        if (existingFollow) {
            return res.status(400).json({ success: false, message: "Already following this user" });
        }

        const follow = new UserFollow({ followerId: req.userId, followingId: targetUserId });
        await follow.save();

        const followersCount = await UserFollow.countDocuments({ followingId: targetUserId });

        res.json({ success: true, message: "User followed successfully", followersCount });
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
            return res.status(404).json({ success: false, message: "Not following this user" });
        }

        const followersCount = await UserFollow.countDocuments({ followingId: targetUserId });

        res.json({ success: true, message: "User unfollowed successfully", followersCount });
    } catch (err) {
        console.error("Error unfollowing user:", err);
        res.status(500).json({ success: false, message: "Error unfollowing user" });
    }
});

// Get user's followers
router.get("/user/:userId/followers", async (req, res) => {
    try {
        const follows = await UserFollow.find({ followingId: req.params.userId })
            .populate("followerId", "username profilePicture bio")
            .sort({ createdAt: -1 })
            .limit(50);

        const followers = follows.map(f => f.followerId);
        res.json({ success: true, followers, count: followers.length });
    } catch (err) {
        console.error("Error fetching followers:", err);
        res.status(500).json({ success: false, message: "Error fetching followers" });
    }
});

// Get user's following
router.get("/user/:userId/following", async (req, res) => {
    try {
        const follows = await UserFollow.find({ followerId: req.params.userId })
            .populate("followingId", "username profilePicture bio")
            .sort({ createdAt: -1 })
            .limit(50);

        const following = follows.map(f => f.followingId);
        res.json({ success: true, following, count: following.length });
    } catch (err) {
        console.error("Error fetching following:", err);
        res.status(500).json({ success: false, message: "Error fetching following" });
    }
});

// Get activity feed for the logged-in user
router.get("/activity/feed", requireAuth, async (req, res) => {
    try {
        const userId = req.userId;

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

        // 4. Reviews liked by this user
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

        // 5. Albums favourited by this user
        const favouritedAlbums = await FavouriteAlbum.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .select("albumId albumName artistName coverImage createdAt");

        favouritedAlbums.forEach(a => {
            activities.push({
                type: "favourited_album",
                albumId: a.albumId,
                albumName: a.albumName,
                artistName: a.artistName,
                coverImage: a.coverImage,
                timestamp: a.createdAt
            });
        });

        // 6. Albums listened to by this user
        const listenedAlbums = await ListenedAlbum.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .select("albumId albumName artistName coverImage createdAt");

        listenedAlbums.forEach(a => {
            activities.push({
                type: "listened_album",
                albumId: a.albumId,
                albumName: a.albumName,
                artistName: a.artistName,
                coverImage: a.coverImage,
                timestamp: a.createdAt
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