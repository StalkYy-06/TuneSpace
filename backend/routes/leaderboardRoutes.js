import express from "express";
import Review from "../models/Review.js";
import ListenedAlbum from "../models/ListenedAlbum.js";
import User from "../models/User.js";

const router = express.Router();
const USER_COLLECTION = User.collection.name;

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

const buildDateMatch = (cutoff) => (cutoff ? { createdAt: { $gte: cutoff } } : {});

const enrichWithUser = [
    {
        $lookup: {
            from: USER_COLLECTION,
            localField: "_id",
            foreignField: "_id",
            as: "userInfo"
        }
    },
    {
        $addFields: {
            username: {
                $ifNull: [
                    { $arrayElemAt: ["$userInfo.username", 0] },
                    "$fallbackUsername"
                ]
            },
            profilePicture: { $arrayElemAt: ["$userInfo.profilePicture", 0] }
        }
    },
    { $match: { username: { $nin: [null, ""] } } }
];

const buildLeaderboards = async (cutoff) => {
    const dateMatch = buildDateMatch(cutoff);

    const mostLikedRaw = await Review.aggregate([
        { $match: { ...dateMatch, userId: { $ne: null } } },
        {
            $group: {
                _id: "$userId",
                fallbackUsername: { $first: "$username" },
                totalLikes: { $sum: { $ifNull: ["$likes", 0] } },
                reviewCount: { $sum: 1 }
            }
        },
        { $match: { totalLikes: { $gt: 0 } } },
        { $sort: { totalLikes: -1, reviewCount: -1 } },
        { $limit: 10 },
        ...enrichWithUser,
        {
            $project: {
                _id: 0,
                username: 1,
                profilePicture: 1,
                totalLikes: 1,
                reviewCount: 1
            }
        }
    ]);

    const mostReviewsRaw = await Review.aggregate([
        { $match: { ...dateMatch, userId: { $ne: null } } },
        {
            $group: {
                _id: "$userId",
                fallbackUsername: { $first: "$username" },
                reviewCount: { $sum: 1 },
                totalLikes: { $sum: { $ifNull: ["$likes", 0] } }
            }
        },
        { $match: { reviewCount: { $gt: 0 } } },
        { $sort: { reviewCount: -1, totalLikes: -1 } },
        { $limit: 10 },
        ...enrichWithUser,
        {
            $project: {
                _id: 0,
                username: 1,
                profilePicture: 1,
                reviewCount: 1,
                totalLikes: 1
            }
        }
    ]);

    const mostListenedRaw = await ListenedAlbum.aggregate([
        { $match: { ...dateMatch, userId: { $ne: null } } },
        {
            $group: {
                _id: "$userId",
                albumCount: { $sum: 1 }
            }
        },
        { $match: { albumCount: { $gt: 0 } } },
        { $sort: { albumCount: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: USER_COLLECTION,
                localField: "_id",
                foreignField: "_id",
                as: "userInfo"
            }
        },
        {
            $addFields: {
                username: { $arrayElemAt: ["$userInfo.username", 0] },
                profilePicture: { $arrayElemAt: ["$userInfo.profilePicture", 0] }
            }
        },
        { $match: { username: { $nin: [null, ""] } } },
        {
            $project: {
                _id: 0,
                username: 1,
                profilePicture: 1,
                albumCount: 1
            }
        }
    ]);

    const rankEntries = (arr, valueKey) =>
        arr.map((entry, idx) => ({
            rank: idx + 1,
            username: entry.username,
            profilePicture: entry.profilePicture || null,
            [valueKey]: entry[valueKey] || 0,
            ...(valueKey === "totalLikes" ? { reviewCount: entry.reviewCount || 0 } : {}),
            ...(valueKey === "reviewCount" ? { totalLikes: entry.totalLikes || 0 } : {})
        }));

    return {
        mostLiked: rankEntries(mostLikedRaw, "totalLikes"),
        mostReviews: rankEntries(mostReviewsRaw, "reviewCount"),
        mostListened: rankEntries(mostListenedRaw, "albumCount")
    };
};

router.get("/", async (req, res) => {
    try {
        const { period = "monthly" } = req.query;
        const cutoff = getDateCutoff(period);
        let leaderboards = await buildLeaderboards(cutoff);

        const hasAnyData =
            leaderboards.mostLiked.length > 0 ||
            leaderboards.mostReviews.length > 0 ||
            leaderboards.mostListened.length > 0;

        let periodUsed = period;
        if (!hasAnyData) {
            leaderboards = await buildLeaderboards(null);
            periodUsed = "all-time";
        }

        res.json({
            success: true,
            period,
            periodUsed,
            leaderboards
        });
    } catch (err) {
        console.error("Leaderboard error:", err);
        res.status(500).json({ success: false, message: "Error fetching leaderboard" });
    }
});

export default router;
