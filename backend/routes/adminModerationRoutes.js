import express from "express";
import Report from "../models/Report.js";
import User from "../models/User.js";
import BannedUser from "../models/BannedUser.js";
import UserWarning from "../models/UserWarning.js";
import Review from "../models/Review.js";
import Admin from "../models/Admin.js";
import { verifyAdminToken } from "./adminAuthRoutes.js";

const router = express.Router();

// ==================== MODERATION ACTIONS FOR REPORTS ====================

/**
 * Handle a report with specific action
 * Actions: warn, delete_review, ban_user, dismiss, invalid
 */
router.post("/reports/:reportId/action", verifyAdminToken, async (req, res) => {
    try {
        const { action, warningType, banDuration, banDays, adminNotes } = req.body;
        const reportId = req.params.reportId;

        // Validate action
        const validActions = ["warn", "delete_review", "ban_user", "dismiss", "invalid"];
        if (!validActions.includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Invalid action. Must be: warn, delete_review, ban_user, dismiss, or invalid"
            });
        }

        // Get the report
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        // Get admin info
        const admin = await Admin.findById(req.adminId);

        // Find the user who wrote the review
        const reviewAuthor = await User.findOne({ username: report.reviewContent.username });
        if (!reviewAuthor && action !== "invalid" && action !== "dismiss") {
            return res.status(404).json({ success: false, message: "Review author not found" });
        }

        let result = {};

        switch (action) {
            case "warn":
                // Issue a warning to the user
                if (!warningType || !["minor", "moderate", "severe"].includes(warningType)) {
                    return res.status(400).json({
                        success: false,
                        message: "Warning type required: minor, moderate, or severe"
                    });
                }

                const warning = new UserWarning({
                    userId: reviewAuthor._id,
                    username: reviewAuthor.username,
                    warningType,
                    reason: adminNotes || `Reported for: ${report.reason}`,
                    relatedReportId: report._id,
                    relatedReviewId: report.reviewId,
                    issuedBy: req.adminId,
                    issuedByUsername: admin.username
                });

                await warning.save();

                // Update report
                report.status = "resolved";
                report.actionTaken = "warning_issued";
                report.handledBy = req.adminId;
                report.handledByUsername = admin.username;
                report.handledAt = new Date();
                report.adminNotes = adminNotes || "";
                await report.save();

                // Check if user has too many warnings (auto-ban threshold)
                const activeWarnings = await UserWarning.countDocuments({
                    userId: reviewAuthor._id,
                    isActive: true
                });

                result = {
                    action: "warning_issued",
                    warning,
                    activeWarnings,
                    message: `Warning issued to ${reviewAuthor.username}`
                };

                // Auto-ban if 3+ severe warnings or 5+ total warnings
                const severeWarnings = await UserWarning.countDocuments({
                    userId: reviewAuthor._id,
                    isActive: true,
                    warningType: "severe"
                });

                if (severeWarnings >= 3 || activeWarnings >= 5) {
                    const autoBan = new BannedUser({
                        userId: reviewAuthor._id,
                        username: reviewAuthor.username,
                        email: reviewAuthor.email,
                        bannedBy: req.adminId,
                        bannedByUsername: admin.username,
                        reason: `Automatic ban: ${severeWarnings} severe warnings, ${activeWarnings} total warnings`,
                        duration: "permanent"
                    });
                    await autoBan.save();
                    result.autoBanned = true;
                    result.message += ` - User auto-banned due to ${activeWarnings} warnings`;
                }

                break;

            case "delete_review":
                // Delete the review
                const deletedReview = await Review.findByIdAndDelete(report.reviewId);

                if (deletedReview) {
                    // Update report
                    report.status = "resolved";
                    report.actionTaken = "review_deleted";
                    report.handledBy = req.adminId;
                    report.handledByUsername = admin.username;
                    report.handledAt = new Date();
                    report.adminNotes = adminNotes || "";
                    await report.save();

                    result = {
                        action: "review_deleted",
                        deletedReview,
                        message: `Review deleted successfully`
                    };
                } else {
                    return res.status(404).json({
                        success: false,
                        message: "Review not found or already deleted"
                    });
                }
                break;

            case "ban_user":
                // Ban the user
                if (!banDuration || !["temporary", "permanent"].includes(banDuration)) {
                    return res.status(400).json({
                        success: false,
                        message: "Ban duration required: temporary or permanent"
                    });
                }

                // Check if already banned
                const existingBan = await BannedUser.findOne({
                    userId: reviewAuthor._id,
                    isActive: true
                });

                if (existingBan) {
                    return res.status(400).json({
                        success: false,
                        message: "User is already banned"
                    });
                }

                let expiresAt = null;
                if (banDuration === "temporary") {
                    if (!banDays || banDays < 1) {
                        return res.status(400).json({
                            success: false,
                            message: "Ban days required for temporary ban"
                        });
                    }
                    const now = new Date();
                    expiresAt = new Date(now.getTime() + (banDays * 24 * 60 * 60 * 1000));
                }

                const ban = new BannedUser({
                    userId: reviewAuthor._id,
                    username: reviewAuthor.username,
                    email: reviewAuthor.email,
                    bannedBy: req.adminId,
                    bannedByUsername: admin.username,
                    reason: adminNotes || `Banned for: ${report.reason}`,
                    duration: banDuration,
                    expiresAt
                });

                await ban.save();

                // Update report
                report.status = "resolved";
                report.actionTaken = "user_banned";
                report.handledBy = req.adminId;
                report.handledByUsername = admin.username;
                report.handledAt = new Date();
                report.adminNotes = adminNotes || "";
                await report.save();

                result = {
                    action: "user_banned",
                    ban,
                    message: `User ${reviewAuthor.username} banned (${banDuration})`
                };
                break;

            case "dismiss":
                // Dismiss the report (no action needed)
                report.status = "dismissed";
                report.actionTaken = "none";
                report.handledBy = req.adminId;
                report.handledByUsername = admin.username;
                report.handledAt = new Date();
                report.adminNotes = adminNotes || "";
                await report.save();

                result = {
                    action: "dismissed",
                    message: "Report dismissed - no violation found"
                };
                break;

            case "invalid":
                // Mark as invalid report
                report.status = "invalid";
                report.actionTaken = "invalid_report";
                report.handledBy = req.adminId;
                report.handledByUsername = admin.username;
                report.handledAt = new Date();
                report.adminNotes = adminNotes || "";
                await report.save();

                result = {
                    action: "invalid_report",
                    message: "Report marked as invalid"
                };
                break;
        }

        res.json({
            success: true,
            report,
            result
        });

    } catch (err) {
        console.error("Error handling report action:", err);
        res.status(500).json({ success: false, message: "Error processing action" });
    }
});

// ==================== USER WARNING MANAGEMENT ====================

// Get all warnings for a user
router.get("/users/:userId/warnings", verifyAdminToken, async (req, res) => {
    try {
        const warnings = await UserWarning.find({ userId: req.params.userId })
            .sort({ createdAt: -1 });

        const activeWarnings = warnings.filter(w => w.isActive);
        const warningCounts = {
            minor: activeWarnings.filter(w => w.warningType === "minor").length,
            moderate: activeWarnings.filter(w => w.warningType === "moderate").length,
            severe: activeWarnings.filter(w => w.warningType === "severe").length,
            total: activeWarnings.length
        };

        res.json({
            success: true,
            warnings,
            activeWarnings,
            warningCounts
        });
    } catch (err) {
        console.error("Error fetching warnings:", err);
        res.status(500).json({ success: false, message: "Error fetching warnings" });
    }
});

// Issue a standalone warning (not from report)
router.post("/users/:userId/warn", verifyAdminToken, async (req, res) => {
    try {
        const { warningType, reason } = req.body;

        if (!warningType || !["minor", "moderate", "severe"].includes(warningType)) {
            return res.status(400).json({
                success: false,
                message: "Warning type required: minor, moderate, or severe"
            });
        }

        if (!reason) {
            return res.status(400).json({ success: false, message: "Reason is required" });
        }

        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const admin = await Admin.findById(req.adminId);

        const warning = new UserWarning({
            userId: user._id,
            username: user.username,
            warningType,
            reason,
            issuedBy: req.adminId,
            issuedByUsername: admin.username
        });

        await warning.save();

        res.json({
            success: true,
            message: "Warning issued successfully",
            warning
        });
    } catch (err) {
        console.error("Error issuing warning:", err);
        res.status(500).json({ success: false, message: "Error issuing warning" });
    }
});

// Remove/deactivate a warning
router.delete("/warnings/:warningId", verifyAdminToken, async (req, res) => {
    try {
        const warning = await UserWarning.findByIdAndUpdate(
            req.params.warningId,
            { isActive: false },
            { new: true }
        );

        if (!warning) {
            return res.status(404).json({ success: false, message: "Warning not found" });
        }

        res.json({
            success: true,
            message: "Warning removed",
            warning
        });
    } catch (err) {
        console.error("Error removing warning:", err);
        res.status(500).json({ success: false, message: "Error removing warning" });
    }
});

// ==================== REPORTED USER MODERATION ====================

// Get moderation overview for a reported user
router.get("/users/reported/:username/moderation", verifyAdminToken, async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({ username }).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Get all reports
        const reports = await Report.find({
            "reviewContent.username": username
        }).sort({ createdAt: -1 });

        // Get warnings
        const warnings = await UserWarning.find({
            userId: user._id
        }).sort({ createdAt: -1 });

        // Get ban status
        const activeBan = await BannedUser.findOne({
            userId: user._id,
            isActive: true
        });

        // Get reviews
        const reviews = await Review.find({
            userId: user._id
        }).sort({ createdAt: -1 }).limit(10);

        // Calculate risk score
        const pendingReports = reports.filter(r => r.status === "pending").length;
        const activeWarnings = warnings.filter(w => w.isActive).length;
        const severeWarnings = warnings.filter(w => w.isActive && w.warningType === "severe").length;

        let riskScore = 0;
        riskScore += pendingReports * 10;
        riskScore += activeWarnings * 15;
        riskScore += severeWarnings * 25;

        let riskLevel = "low";
        if (riskScore > 75) riskLevel = "critical";
        else if (riskScore > 50) riskLevel = "high";
        else if (riskScore > 25) riskLevel = "moderate";

        res.json({
            success: true,
            user: {
                ...user.toObject(),
                isBanned: !!activeBan,
                banInfo: activeBan
            },
            reports: {
                total: reports.length,
                pending: pendingReports,
                resolved: reports.filter(r => r.status === "resolved").length,
                dismissed: reports.filter(r => r.status === "dismissed").length,
                invalid: reports.filter(r => r.status === "invalid").length,
                list: reports
            },
            warnings: {
                total: warnings.length,
                active: activeWarnings,
                minor: warnings.filter(w => w.isActive && w.warningType === "minor").length,
                moderate: warnings.filter(w => w.isActive && w.warningType === "moderate").length,
                severe: severeWarnings,
                list: warnings
            },
            reviews: {
                total: reviews.length,
                list: reviews
            },
            riskAssessment: {
                score: riskScore,
                level: riskLevel,
                factors: {
                    pendingReports,
                    activeWarnings,
                    severeWarnings
                }
            },
            recommendedAction: getRecommendedAction(riskLevel, activeWarnings, severeWarnings, activeBan)
        });
    } catch (err) {
        console.error("Error fetching moderation overview:", err);
        res.status(500).json({ success: false, message: "Error fetching moderation overview" });
    }
});

// Helper function to recommend action
function getRecommendedAction(riskLevel, warnings, severeWarnings, isBanned) {
    if (isBanned) return "User is already banned";
    if (riskLevel === "critical") return "Immediate ban recommended";
    if (riskLevel === "high" && severeWarnings >= 2) return "Consider temporary ban";
    if (riskLevel === "high") return "Issue severe warning";
    if (riskLevel === "moderate") return "Issue moderate warning and monitor";
    if (riskLevel === "low" && warnings > 0) return "Issue minor warning";
    return "Monitor reports - no immediate action needed";
}

// Take bulk action on a user (for reported users page)
router.post("/users/:userId/moderate", verifyAdminToken, async (req, res) => {
    try {
        const { action, reason, banDuration, banDays, warningType } = req.body;
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const admin = await Admin.findById(req.adminId);
        let result = {};

        switch (action) {
            case "warn":
                if (!warningType || !["minor", "moderate", "severe"].includes(warningType)) {
                    return res.status(400).json({
                        success: false,
                        message: "Warning type required"
                    });
                }

                const warning = new UserWarning({
                    userId: user._id,
                    username: user.username,
                    warningType,
                    reason: reason || "Multiple violations",
                    issuedBy: req.adminId,
                    issuedByUsername: admin.username
                });

                await warning.save();
                result = { action: "warned", warning };
                break;

            case "ban":
                if (!banDuration || !["temporary", "permanent"].includes(banDuration)) {
                    return res.status(400).json({
                        success: false,
                        message: "Ban duration required"
                    });
                }

                let expiresAt = null;
                if (banDuration === "temporary" && banDays) {
                    const now = new Date();
                    expiresAt = new Date(now.getTime() + (banDays * 24 * 60 * 60 * 1000));
                }

                const ban = new BannedUser({
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    bannedBy: req.adminId,
                    bannedByUsername: admin.username,
                    reason: reason || "Multiple violations",
                    duration: banDuration,
                    expiresAt
                });

                await ban.save();
                result = { action: "banned", ban };
                break;

            case "clear_warnings":
                await UserWarning.updateMany(
                    { userId: user._id, isActive: true },
                    { isActive: false }
                );
                result = { action: "warnings_cleared" };
                break;

            case "delete_all_reviews":
                const deleted = await Review.deleteMany({ userId: user._id });
                result = { action: "reviews_deleted", count: deleted.deletedCount };
                break;

            default:
                return res.status(400).json({ success: false, message: "Invalid action" });
        }

        res.json({
            success: true,
            message: "Action completed successfully",
            result
        });
    } catch (err) {
        console.error("Error moderating user:", err);
        res.status(500).json({ success: false, message: "Error moderating user" });
    }
});

// ==================== BANNED USER MANAGEMENT ====================

// Get banned user details with appeal info
router.get("/banned/:userId/details", verifyAdminToken, async (req, res) => {
    try {
        const banRecord = await BannedUser.findOne({
            userId: req.params.userId,
            isActive: true
        });

        if (!banRecord) {
            return res.status(404).json({ success: false, message: "No active ban found" });
        }

        const user = await User.findById(req.params.userId).select("-password");
        const warnings = await UserWarning.find({ userId: req.params.userId });
        const reports = await Report.find({ "reviewContent.username": user.username });

        // Check if ban should be auto-expired
        if (banRecord.duration === "temporary" && banRecord.expiresAt) {
            if (new Date() > banRecord.expiresAt) {
                banRecord.isActive = false;
                await banRecord.save();
                return res.json({
                    success: true,
                    expired: true,
                    message: "Ban has expired and been automatically removed"
                });
            }
        }

        res.json({
            success: true,
            ban: banRecord,
            user,
            warnings,
            reports,
            timeRemaining: banRecord.expiresAt ?
                Math.ceil((banRecord.expiresAt - new Date()) / (1000 * 60 * 60 * 24)) : null
        });
    } catch (err) {
        console.error("Error fetching ban details:", err);
        res.status(500).json({ success: false, message: "Error fetching ban details" });
    }
});

// Update ban (extend, shorten, or modify)
router.patch("/banned/:banId/update", verifyAdminToken, async (req, res) => {
    try {
        const { action, days, newReason } = req.body;
        const ban = await BannedUser.findById(req.params.banId);

        if (!ban) {
            return res.status(404).json({ success: false, message: "Ban not found" });
        }

        switch (action) {
            case "extend":
                if (ban.duration === "permanent") {
                    return res.status(400).json({
                        success: false,
                        message: "Cannot extend permanent ban"
                    });
                }
                if (!days) {
                    return res.status(400).json({
                        success: false,
                        message: "Days required for extension"
                    });
                }
                const currentExpiry = ban.expiresAt || new Date();
                ban.expiresAt = new Date(currentExpiry.getTime() + (days * 24 * 60 * 60 * 1000));
                break;

            case "convert_permanent":
                ban.duration = "permanent";
                ban.expiresAt = null;
                break;

            case "convert_temporary":
                if (!days) {
                    return res.status(400).json({
                        success: false,
                        message: "Days required for temporary ban"
                    });
                }
                ban.duration = "temporary";
                ban.expiresAt = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
                break;

            case "update_reason":
                if (newReason) {
                    ban.reason = newReason;
                }
                break;

            default:
                return res.status(400).json({ success: false, message: "Invalid action" });
        }

        await ban.save();

        res.json({
            success: true,
            message: "Ban updated successfully",
            ban
        });
    } catch (err) {
        console.error("Error updating ban:", err);
        res.status(500).json({ success: false, message: "Error updating ban" });
    }
});


router.get("/stats", verifyAdminToken, async (req, res) => {
    try {
        const [
            totalUsers,
            totalReviews,
            totalReports,
            pendingReports,
            bannedUsers,
            totalReportedUsers,
            totalWarnings,
            activeWarnings
        ] = await Promise.all([
            User.countDocuments(),
            Review.countDocuments(),
            Report.countDocuments(),
            Report.countDocuments({ status: "pending" }),
            BannedUser.countDocuments({ isActive: true }),
            Report.distinct("reviewContent.username").then(users => users.length),
            UserWarning.countDocuments(),
            UserWarning.countDocuments({ isActive: true })
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalReviews,
                totalReports,
                pendingReports,
                bannedUsers,
                totalReportedUsers,
                totalWarnings,
                activeWarnings
            }
        });
    } catch (err) {
        console.error("Error fetching stats:", err);
        res.status(500).json({ success: false, message: "Error fetching statistics" });
    }
});

export default router;