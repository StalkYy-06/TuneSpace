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

// Register - Create unverified user + send OTP
router.post("/register", authRateLimiter, async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username?.trim()) return sendError(res, "username", "Username is required.");
    if (!email?.trim()) return sendError(res, "email", "Email is required.");
    if (!email.includes("@")) return sendError(res, "email", "Invalid email format.");
    if (!password?.trim()) return sendError(res, "password", "Password is required.");

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
        if (existingUser) {
            if (existingUser.email === email.toLowerCase())
                return sendError(res, "email", "Email already in use.");
            if (existingUser.username === username)
                return sendError(res, "username", "Username already taken.");
        }

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email: email.toLowerCase(),
            password: hashed,
            emailVerified: false,
        });

        // Send OTP
        await sendAndStoreOTP(email.toLowerCase(), "register");

        res.json({ success: true, message: "Verification code sent. Please check your email." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Verify Registration - Verify OTP + mark verified + login
router.post("/verify-registration", otpRateLimiter, async (req, res) => {

    const { email, otp } = req.body;

    if (!email?.trim()) return sendError(res, "email", "Email is required.");
    if (!otp || otp.length !== 6) return sendError(res, "otp", "Valid 6-digit OTP is required.");

    try {
        const isValid = await verifyOTP(email.toLowerCase(), otp, "register");
        if (!isValid) {
            return res.status(400).json({
                success: false,
                field: "otp",
                message: "Invalid or expired verification code"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return sendError(res, "email", "User not found.");

        if (user.emailVerified) return sendError(res, "email", "Email already verified.");

        user.emailVerified = true;
        await user.save();

        const token = generateToken(user._id);
        setAuthCookie(res, token);

        res.json({ success: true, message: "Email verified successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Login
router.post("/login", authRateLimiter, async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail?.trim()) return sendError(res, "usernameOrEmail", "Username or email is required.");
    if (!password?.trim()) return sendError(res, "password", "Password is required.");

    try {
        const user = await User.findOne({
            $or: [{ email: usernameOrEmail.toLowerCase() }, { username: usernameOrEmail }],
        });
        if (!user) return sendError(res, "usernameOrEmail", "Invalid credentials.");

        const match = await bcrypt.compare(password, user.password);
        if (!match) return sendError(res, "password", "Invalid credentials.");

        const token = generateToken(user._id);
        setAuthCookie(res, token);

        res.json({
            success: true,
            user: { username: user.username, email: user.email, requires2FA: user.twoFactorEnabled },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Send OTP for registration
router.post("/send-register-otp", otpRateLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email?.trim()) return sendError(res, "email", "Email is required.");

    try {
        await sendAndStoreOTP(email.toLowerCase(), "register");
        res.json({ success: true, message: "Verification code sent." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to send code" });
    }
});

// Send OTP for 2FA login
router.post("/send-login-otp", otpRateLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email?.trim()) return sendError(res, "email", "Email is required.");

    try {
        await sendAndStoreOTP(email.toLowerCase(), "2fa-login");
        res.json({ success: true, message: "Login code sent." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to send code" });
    }
});

// Verify 2FA for login
router.post("/verify-2fa", otpRateLimiter, async (req, res) => {
    const { email, otp } = req.body;

    if (!email?.trim()) return sendError(res, "email", "Email is required.");
    if (!otp || otp.length !== 6) return sendError(res, "otp", "Valid 6-digit code required.");

    try {
        const isValid = await verifyOTP(email.toLowerCase(), otp, "2fa-login");
        if (!isValid) return sendError(res, "otp", "Invalid or expired code.");

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return sendError(res, "email", "User not found.");

        const token = generateToken(user._id);
        setAuthCookie(res, token);

        res.json({ success: true, message: "2FA verified. Logged in." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Forgot Password - Send OTP
router.post("/forgot-password", otpRateLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email?.trim()) return sendError(res, "email", "Email is required.");

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return sendError(res, "email", "No account found with this email.");

        await sendAndStoreOTP(email.toLowerCase(), "forgot-password");

        res.json({ success: true, message: "Reset code sent to your email." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Reset Password
router.post("/reset-password", otpRateLimiter, async (req, res) => {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) return sendError(res, "confirmPassword", "Passwords do not match.");

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword))
        return sendError(res, "newPassword", "Password too weak. Use 8+ chars, uppercase, number, symbol.");

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

// Get Current User
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