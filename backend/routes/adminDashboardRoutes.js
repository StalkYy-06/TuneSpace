import express from "express";
import Report from "../models/Report.js";
import User from "../models/User.js";
import BannedUser from "../models/BannedUser.js";
import Review from "../models/Review.js";
import Admin from "../models/Admin.js";
import { verifyAdminToken } from "./adminAuthRoutes.js";

const router = express.Router();

// ==================== DASHBOARD STATS ====================

// Get dashboard statistics
router.get("/stats", verifyAdminToken, async (req, res) => {
    try {
        const [
            totalUsers,
            totalReviews,
            totalReports,
            pendingReports,
            bannedUsers,
            totalReportedUsers
        ] = await Promise.all([
            User.countDocuments(),
            Review.countDocuments(),
            Report.countDocuments(),
            Report.countDocuments({ status: "pending" }),
            BannedUser.countDocuments({ isActive: true }),
            // Count unique users who have been reported
            Report.distinct("reviewContent.username").then(users => users.length)
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalReviews,
                totalReports,
                pendingReports,
                bannedUsers,
                totalReportedUsers
            }
        });
    } catch (err) {
        console.error("Error fetching stats:", err);
        res.status(500).json({ success: false, message: "Error fetching statistics" });
    }
});

// ==================== REPORTED REVIEWS ====================

// Get all reported reviews
router.get("/reports/reviews", verifyAdminToken, async (req, res) => {
    try {
        const { status } = req.query;

        let query = {};
        if (status && status !== "all") {
            query.status = status;
        }

        const reports = await Report.find(query)
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            reports,
            total: reports.length
        });
    } catch (err) {
        console.error("Error fetching reports:", err);
        res.status(500).json({ success: false, message: "Error fetching reports" });
    }
});

// Update report status
router.patch("/reports/:reportId/status", verifyAdminToken, async (req, res) => {
    try {
        const { status } = req.body;

        if (!["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const report = await Report.findByIdAndUpdate(
            req.params.reportId,
            { status },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        res.json({
            success: true,
            message: "Report status updated",
            report
        });
    } catch (err) {
        console.error("Error updating report:", err);
        res.status(500).json({ success: false, message: "Error updating report" });
    }
});

// Delete a review (admin action)
router.delete("/reviews/:reviewId", verifyAdminToken, async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        res.json({
            success: true,
            message: "Review deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting review:", err);
        res.status(500).json({ success: false, message: "Error deleting review" });
    }
});

// ==================== USER MANAGEMENT ====================

// Search users
router.get("/users/search", verifyAdminToken, async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({ success: false, message: "Search query must be at least 2 characters" });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } }
            ]
        })
            .select("-password")
            .limit(50);

        // Get additional info for each user
        const usersWithInfo = await Promise.all(users.map(async (user) => {
            const reviewsCount = await Review.countDocuments({ userId: user._id });
            const reportsCount = await Report.countDocuments({
                "reviewContent.username": user.username
            });
            const bannedRecord = await BannedUser.findOne({
                userId: user._id,
                isActive: true
            });

            return {
                ...user.toObject(),
                reviewsCount,
                reportsCount,
                isBanned: !!bannedRecord,
                bannedInfo: bannedRecord
            };
        }));

        res.json({
            success: true,
            users: usersWithInfo,
            total: usersWithInfo.length
        });
    } catch (err) {
        console.error("Error searching users:", err);
        res.status(500).json({ success: false, message: "Error searching users" });
    }
});

// Get user details
router.get("/users/:userId", verifyAdminToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Get user's reviews
        const reviews = await Review.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(10);

        // Get reports against this user's reviews
        const reportsAgainst = await Report.find({
            "reviewContent.username": user.username
        }).sort({ createdAt: -1 });

        // Check if user is banned
        const bannedRecord = await BannedUser.findOne({
            userId: user._id,
            isActive: true
        });

        res.json({
            success: true,
            user: {
                ...user.toObject(),
                reviewsCount: reviews.length,
                reviews: reviews,
                reportsCount: reportsAgainst.length,
                reports: reportsAgainst,
                isBanned: !!bannedRecord,
                bannedInfo: bannedRecord
            }
        });
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ success: false, message: "Error fetching user details" });
    }
});

// ==================== BAN MANAGEMENT ====================

// Ban user
router.post("/users/:userId/ban", verifyAdminToken, async (req, res) => {
    try {
        const { reason, duration, expiresIn } = req.body;

        if (!reason) {
            return res.status(400).json({ success: false, message: "Reason is required" });
        }

        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if user is already banned
        const existingBan = await BannedUser.findOne({
            userId: user._id,
            isActive: true
        });

        if (existingBan) {
            return res.status(400).json({ success: false, message: "User is already banned" });
        }

        // Get admin info
        const admin = await Admin.findById(req.adminId);

        // Calculate expiry date for temporary bans
        let expiresAt = null;
        if (duration === "temporary" && expiresIn) {
            const now = new Date();
            expiresAt = new Date(now.getTime() + (expiresIn * 24 * 60 * 60 * 1000)); // expiresIn is in days
        }

        // Create ban record
        const bannedUser = new BannedUser({
            userId: user._id,
            username: user.username,
            email: user.email,
            bannedBy: req.adminId,
            bannedByUsername: admin.username,
            reason,
            duration: duration || "permanent",
            expiresAt
        });

        await bannedUser.save();

        res.json({
            success: true,
            message: "User banned successfully",
            bannedUser
        });
    } catch (err) {
        console.error("Error banning user:", err);
        res.status(500).json({ success: false, message: "Error banning user" });
    }
});

// Unban user
router.post("/users/:userId/unban", verifyAdminToken, async (req, res) => {
    try {
        const result = await BannedUser.findOneAndUpdate(
            { userId: req.params.userId, isActive: true },
            { isActive: false },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ success: false, message: "No active ban found for this user" });
        }

        res.json({
            success: true,
            message: "User unbanned successfully"
        });
    } catch (err) {
        console.error("Error unbanning user:", err);
        res.status(500).json({ success: false, message: "Error unbanning user" });
    }
});

// Get all banned users
router.get("/users/banned/list", verifyAdminToken, async (req, res) => {
    try {
        const bannedUsers = await BannedUser.find({ isActive: true })
            .sort({ bannedAt: -1 })
            .limit(100);

        res.json({
            success: true,
            bannedUsers,
            total: bannedUsers.length
        });
    } catch (err) {
        console.error("Error fetching banned users:", err);
        res.status(500).json({ success: false, message: "Error fetching banned users" });
    }
});

// ==================== REPORTED USERS ====================

// Get users with reports against them
router.get("/users/reported/list", verifyAdminToken, async (req, res) => {
    try {
        // Get all unique usernames that have been reported
        const reportedUsernames = await Report.distinct("reviewContent.username");

        // Get report counts for each user
        const reportedUsers = await Promise.all(
            reportedUsernames.map(async (username) => {
                const reports = await Report.find({
                    "reviewContent.username": username
                }).sort({ createdAt: -1 });

                const pendingReports = reports.filter(r => r.status === "pending").length;

                // Try to find the actual user
                const user = await User.findOne({ username }).select("-password");

                return {
                    username,
                    userId: user?._id,
                    email: user?.email,
                    totalReports: reports.length,
                    pendingReports,
                    resolvedReports: reports.filter(r => r.status === "resolved").length,
                    dismissedReports: reports.filter(r => r.status === "dismissed").length,
                    reports: reports.slice(0, 5), // Last 5 reports
                    lastReportedAt: reports[0]?.createdAt,
                    userExists: !!user,
                    userJoinedAt: user?.createdAt
                };
            })
        );

        // Sort by total reports descending
        reportedUsers.sort((a, b) => b.totalReports - a.totalReports);

        res.json({
            success: true,
            reportedUsers,
            total: reportedUsers.length
        });
    } catch (err) {
        console.error("Error fetching reported users:", err);
        res.status(500).json({ success: false, message: "Error fetching reported users" });
    }
});

// Get detailed reports for a specific user
router.get("/users/reported/:username", verifyAdminToken, async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({ username }).select("-password");

        const reports = await Report.find({
            "reviewContent.username": username
        }).sort({ createdAt: -1 });

        const reviews = await Review.find({ username }).sort({ createdAt: -1 });

        const bannedRecord = await BannedUser.findOne({
            username,
            isActive: true
        });

        res.json({
            success: true,
            user: user ? {
                ...user.toObject(),
                isBanned: !!bannedRecord,
                bannedInfo: bannedRecord
            } : null,
            username,
            reports,
            reviews,
            stats: {
                totalReports: reports.length,
                pendingReports: reports.filter(r => r.status === "pending").length,
                resolvedReports: reports.filter(r => r.status === "resolved").length,
                dismissedReports: reports.filter(r => r.status === "dismissed").length,
                totalReviews: reviews.length
            }
        });
    } catch (err) {
        console.error("Error fetching user reports:", err);
        res.status(500).json({ success: false, message: "Error fetching user reports" });
    }
});

// ==================== BULK ACTIONS ====================

// Delete multiple reviews
router.post("/reviews/bulk-delete", verifyAdminToken, async (req, res) => {
    try {
        const { reviewIds } = req.body;

        if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
            return res.status(400).json({ success: false, message: "Review IDs array is required" });
        }

        const result = await Review.deleteMany({ _id: { $in: reviewIds } });

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} reviews`,
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error("Error bulk deleting reviews:", err);
        res.status(500).json({ success: false, message: "Error deleting reviews" });
    }
});

// Update multiple report statuses
router.post("/reports/bulk-update", verifyAdminToken, async (req, res) => {
    try {
        const { reportIds, status } = req.body;

        if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
            return res.status(400).json({ success: false, message: "Report IDs array is required" });
        }

        if (!["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const result = await Report.updateMany(
            { _id: { $in: reportIds } },
            { $set: { status } }
        );

        res.json({
            success: true,
            message: `Updated ${result.modifiedCount} reports`,
            modifiedCount: result.modifiedCount
        });
    } catch (err) {
        console.error("Error bulk updating reports:", err);
        res.status(500).json({ success: false, message: "Error updating reports" });
    }
});

// ==================== ANALYTICS ====================

// Get review analytics
router.get("/analytics/reviews", verifyAdminToken, async (req, res) => {
    try {
        const { period = "week" } = req.query;

        let dateFilter = new Date();
        switch (period) {
            case "day":
                dateFilter.setDate(dateFilter.getDate() - 1);
                break;
            case "week":
                dateFilter.setDate(dateFilter.getDate() - 7);
                break;
            case "month":
                dateFilter.setMonth(dateFilter.getMonth() - 1);
                break;
            case "year":
                dateFilter.setFullYear(dateFilter.getFullYear() - 1);
                break;
        }

        const [
            totalReviews,
            reviewsInPeriod,
            averageRating,
            ratingDistribution
        ] = await Promise.all([
            Review.countDocuments(),
            Review.countDocuments({ createdAt: { $gte: dateFilter } }),
            Review.aggregate([
                { $group: { _id: null, avgRating: { $avg: "$rating" } } }
            ]),
            Review.aggregate([
                { $group: { _id: "$rating", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ])
        ]);

        res.json({
            success: true,
            analytics: {
                totalReviews,
                reviewsInPeriod,
                averageRating: averageRating[0]?.avgRating?.toFixed(2) || 0,
                ratingDistribution: ratingDistribution.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
    } catch (err) {
        console.error("Error fetching analytics:", err);
        res.status(500).json({ success: false, message: "Error fetching analytics" });
    }
});

// Get report analytics
router.get("/analytics/reports", verifyAdminToken, async (req, res) => {
    try {
        const [
            reportsByReason,
            reportsByStatus,
            recentReports
        ] = await Promise.all([
            Report.aggregate([
                { $group: { _id: "$reason", count: { $sum: 1 } } }
            ]),
            Report.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            Report.find().sort({ createdAt: -1 }).limit(10)
        ]);

        res.json({
            success: true,
            analytics: {
                reportsByReason: reportsByReason.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                reportsByStatus: reportsByStatus.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                recentReports
            }
        });
    } catch (err) {
        console.error("Error fetching report analytics:", err);
        res.status(500).json({ success: false, message: "Error fetching report analytics" });
    }
});

export default router;