// routes/authRoutes.js
import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateToken, setAuthCookie, clearAuthCookie } from "../utils/jwt.js";
import { authRateLimiter, otpRateLimiter } from "../middleware/rateLimiter.js";
import { sendAndStoreOTP, verifyOTP } from "../utils/otp.js";

const router = express.Router();

// Helper: standardized error response
const sendError = (res, field, message) => {
    return res.status(400).json({ success: false, field, message });
};

//  Register
router.post("/register", authRateLimiter, async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username?.trim()) return sendError(res, "username", "Username is required.");
    if (!email?.trim()) return sendError(res, "email", "Email is required.");
    if (!email.includes("@")) return sendError(res, "email", "Invalid email format.");

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password))
        return res.status(400).json({
            success: false,
            field: "password",
            message: "Password must be 8+ chars with 1 uppercase, 1 number, 1 symbol.",
        });

    if (password !== confirmPassword)
        return sendError(res, "confirmPassword", "Passwords do not match.");

    try {
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }],
        });

        if (existing) {
            if (existing.email === email.toLowerCase())
                return sendError(res, "email", "Email already registered.");
            if (existing.username === username)
                return sendError(res, "username", "Username already taken.");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
        });

        const token = generateToken(newUser._id);
        setAuthCookie(res, token);

        res.json({
            success: true,
            message: "Registration successful!",
            user: { username: newUser.username, email: newUser.email },
        });
    } catch (err) {
        console.error("Register error:", err);
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return sendError(res, field, `${field} already exists.`);
        }
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Login 
router.post("/login", authRateLimiter, async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail?.trim())
        return sendError(res, "usernameOrEmail", "Username or email is required.");

    try {
        const user = await User.findOne({
            $or: [
                { username: usernameOrEmail },
                { email: usernameOrEmail.toLowerCase() },
            ],
        });

        if (!user) return sendError(res, "usernameOrEmail", "Invalid credentials.");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return sendError(res, "password", "Invalid credentials.");

        const token = generateToken(user._id);
        setAuthCookie(res, token);

        res.json({
            success: true,
            message: "Login successful!",
            user: { username: user.username, email: user.email },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

//  Send login OTP
router.post("/send-otp", otpRateLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return res.status(400).json({ success: false, message: "No account with that email" });
    }

    try {
        await sendAndStoreOTP(email, "login");
        res.json({ success: true, message: "Login OTP sent to your email" });
    } catch (err) {
        console.error("Send OTP Error:", err);
        res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
});

//  Verify OTP & Login
router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp)
        return res.status(400).json({ success: false, message: "Email and OTP required" });

    const isValid = await verifyOTP(email, otp, "login");
    if (!isValid)
        return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.json({
        success: true,
        message: "Logged in successfully with OTP",
        user: { username: user.username, email: user.email },
    });
});

//  Forgot Password
router.post("/forgot-password", otpRateLimiter, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return res.status(400).json({ success: false, message: "No account with that email" });
    }

    try {
        await sendAndStoreOTP(email, "forgot-password");
        res.json({ success: true, message: "Password reset code sent to your email" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to send reset code" });
    }
});

//  Reset Password 
router.post("/reset-password", async (req, res) => {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword)
        return res.status(400).json({ success: false, message: "All fields are required" });

    if (newPassword !== confirmPassword)
        return sendError(res, "confirmPassword", "Passwords do not match");

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword))
        return res.status(400).json({
            success: false,
            field: "newPassword",
            message: "Password too weak. Use 8+ chars, uppercase, number, symbol.",
        });

    const isValid = await verifyOTP(email, otp, "forgot-password");
    if (!isValid)
        return res.status(400).json({ success: false, message: "Invalid or expired code" });

    try {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);

        await User.updateOne(
            { email: email.toLowerCase() },
            { password: hashed }
        );

        res.json({ success: true, message: "Password reset successful!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

//  Get Current User
router.get("/me", async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.json({ success: true, user });
    } catch (err) {
        res.status(401).json({ success: false, message: "Invalid token" });
    }
});

// Logout 
router.post("/logout", (req, res) => {
    clearAuthCookie(res);
    res.json({ success: true, message: "Logged out successfully" });
});

export default router;