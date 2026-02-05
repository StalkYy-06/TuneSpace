// middleware/googleAuth.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

// Only configure Google OAuth if credentials are provided
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret && googleClientId.trim() !== "" && googleClientSecret.trim() !== "") {
    // Configure Google OAuth Strategy
    passport.use(
        new GoogleStrategy(
            {
                clientID: googleClientId,
                clientSecret: googleClientSecret,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Extract user data from Google profile
                    const email = profile.emails[0].value;
                    const username = profile.displayName || profile.emails[0].value.split("@")[0];

                    // Check if user already exists
                    let user = await User.findOne({ email: email.toLowerCase() });

                    if (user) {
                        // User exists - just log them in
                        return done(null, user);
                    }

                    // Check if username is taken
                    let finalUsername = username;
                    let usernameExists = await User.findOne({ username: finalUsername });
                    let counter = 1;

                    // If username exists, append numbers until we find an available one
                    while (usernameExists) {
                        finalUsername = `${username}${counter}`;
                        usernameExists = await User.findOne({ username: finalUsername });
                        counter++;
                    }

                    // Create new user (without profile picture)
                    user = await User.create({
                        username: finalUsername,
                        email: email.toLowerCase(),
                        password: Math.random().toString(36).slice(-8) + "A1@", // Random password (won't be used)
                        emailVerified: true, // Auto-verify Google users
                        bio: "",
                        twoFactorEnabled: false,
                    });

                    return done(null, user);
                } catch (error) {
                    console.error("Google OAuth Error:", error);
                    return done(error, null);
                }
            }
        )
    );

    // Serialize user for session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });

    console.log("Google OAuth configured successfully");
} else {
    console.warn("Google OAuth credentials not found. Google login will be disabled.");
    console.warn("Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env to enable Google OAuth");
}

export default passport;