import express from "express";
import Review from "../models/Review.js";
import ListenedAlbum from "../models/ListenedAlbum.js";
import User from "../models/User.js";

const router = express.Router();

// Helper: get date cutoff for period
const getDateCutoff = (period) => {
    const now = new Date();
    switch (period) {
        case "weekly":
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "monthly":
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case "yearly":
            return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        default:
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
};

// GET /api/leaderboard?period=weekly|monthly|yearly
router.get("/", async (req, res) => {
    try {
        const { period = "monthly" } = req.query;
        const cutoff = getDateCutoff(period);

        // ── 1. Most Liked: sum of likes on reviews created within period ──
        const mostLiked = await Review.aggregate([
            { $match: { createdAt: { $gte: cutoff } } },
            {
                $group: {
                    _id: "$username",
                    totalLikes: { $sum: "$likes" },
                    reviewCount: { $sum: 1 }
                }
            },
            { $match: { totalLikes: { $gt: 0 } } },
            { $sort: { totalLikes: -1 } },
            { $limit: 10 }
        ]);

        // ── 2. Most Reviews: count of reviews created within period ──
        const mostReviews = await Review.aggregate([
            { $match: { createdAt: { $gte: cutoff } } },
            {
                $group: {
                    _id: "$username",
                    reviewCount: { $sum: 1 },
                    totalLikes: { $sum: "$likes" }
                }
            },
            { $sort: { reviewCount: -1 } },
            { $limit: 10 }
        ]);

        // ── 3. Most Albums Listened: count of albums marked listened within period ──
        const mostListened = await ListenedAlbum.aggregate([
            { $match: { createdAt: { $gte: cutoff } } },
            {
                $group: {
                    _id: "$userId",
                    albumCount: { $sum: 1 }
                }
            },
            { $sort: { albumCount: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            { $unwind: { path: "$userInfo", preserveNullAndEmpty: false } },
            {
                $project: {
                    _id: 0,
                    username: "$userInfo.username",
                    profilePicture: "$userInfo.profilePicture",
                    albumCount: 1
                }
            }
        ]);

        // Enrich mostLiked and mostReviews with profile pictures
        const usernames = [
            ...new Set([
                ...mostLiked.map(u => u._id),
                ...mostReviews.map(u => u._id)
            ])
        ];

        const users = await User.find(
            { username: { $in: usernames } },
            { username: 1, profilePicture: 1 }
        );
        const picMap = {};
        users.forEach(u => { picMap[u.username] = u.profilePicture; });

        const enriched = (arr, key) =>
            arr.map((entry, idx) => ({
                rank: idx + 1,
                username: entry._id,
                profilePicture: picMap[entry._id] || null,
                [key]: entry[key],
                reviewCount: entry.reviewCount
            }));

        res.json({
            success: true,
            period,
            leaderboards: {
                mostLiked: enriched(mostLiked, "totalLikes"),
                mostReviews: enriched(mostReviews, "reviewCount"),
                mostListened: mostListened.map((entry, idx) => ({
                    rank: idx + 1,
                    username: entry.username,
                    profilePicture: entry.profilePicture || null,
                    albumCount: entry.albumCount
                }))
            }
        });
    } catch (err) {
        console.error("Leaderboard error:", err);
        res.status(500).json({ success: false, message: "Error fetching leaderboard" });
    }
});

export default router;