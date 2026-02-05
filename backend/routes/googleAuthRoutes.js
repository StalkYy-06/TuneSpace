// routes/googleAuthRoutes.js
import express from "express";
import passport from "../middleware/googleAuth.js";
import { generateToken, setAuthCookie } from "../utils/jwt.js";

const router = express.Router();

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
        failureRedirect: "/login?error=google_auth_failed",
    }),
    (req, res) => {
        try {
            // Generate JWT token
            const token = generateToken(req.user._id);

            // Set auth cookie
            setAuthCookie(res, token);

            // Redirect to frontend home page
            res.redirect(process.env.FRONTEND_URL || "http://localhost:3000");
        } catch (error) {
            console.error("OAuth callback error:", error);
            res.redirect("/login?error=auth_failed");
        }
    }
);

export default router;