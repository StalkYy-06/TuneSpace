// routes/googleAuthRoutes.js
import express from "express";
import passport from "../middleware/googleAuth.js";
import { generateToken, setAuthCookie } from "../utils/jwt.js";
import { getActiveBan } from "../middleware/checkBan.js";

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Initiate Google OAuth
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

// Google OAuth callback
router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`,
    }),
    (req, res) => {
        try {
            if (!req.user) {
                return res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
            }

            getActiveBan(req.user._id).then((ban) => {
                if (ban) {
                    return res.redirect(`${FRONTEND_URL}/login?error=account_banned`);
                }

                const token = generateToken(req.user._id);
                setAuthCookie(res, token);
                res.redirect(`${FRONTEND_URL}/home`);
            }).catch((error) => {
                console.error("OAuth callback error:", error);
                res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
            });
        } catch (error) {
            console.error("OAuth callback error:", error);
            res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
        }
    }
);

export default router;