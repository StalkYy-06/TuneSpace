import BannedUser from "../models/BannedUser.js";

export async function getActiveBan(userId) {
    const ban = await BannedUser.findOne({ userId, isActive: true });
    if (!ban) return null;

    if (ban.duration === "temporary" && ban.expiresAt && ban.expiresAt <= new Date()) {
        ban.isActive = false;
        await ban.save();
        return null;
    }

    return ban;
}

export async function rejectIfBanned(userId, res) {
    const ban = await getActiveBan(userId);
    if (ban) {
        res.status(403).json({
            success: false,
            message: "Your account has been banned.",
            reason: ban.reason
        });
        return true;
    }
    return false;
}
