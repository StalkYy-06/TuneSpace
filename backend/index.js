import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "express-session";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import googleAuthRoutes from "./routes/googleAuthRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import reviewReplyRoutes from "./routes/reviewReplyRoutes.js";
import passport from "./middleware/googleAuth.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import userProfileRoutes from "./routes/userProfileRoutes.js";
import favouriteRoutes from "./routes/favouriteRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import musicRoutes from "./routes/musicRoutes.js";
import { seedCache } from "./utils/seedCache.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Connect DB, then start server + seed ────────────────────────────
const start = async () => {
    await connectDB();

    // Start server immediately so the app is responsive
    app.listen(PORT, () => {
        console.log(`[Server] Running on port ${PORT}`);
    });

    // Seed cache in the background — don't block startup
    seedCache().catch(err =>
        console.error("[Seed] Unexpected error:", err.message)
    );
};

// ── Middleware ───────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));

app.use(session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
    },
}));

app.use(passport.initialize());
app.use(passport.session());
app.use("/uploads", express.static("uploads"));

// ── Routes ───────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/profile", userProfileRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/replies", reviewReplyRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/favourites", favouriteRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/music", musicRoutes);

app.get("/", (req, res) => res.json({ message: "TuneSpace API is running" }));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});

start();