import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import JWT_SECRET from "../utils/jwtSecret.js";

const router = express.Router();

// Middleware to verify admin JWT token
const verifyAdminToken = (req, res, next) => {
    try {
        const token = req.cookies.adminToken;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== "admin" && decoded.role !== "superadmin") {
            return res.status(403).json({ success: false, message: "Forbidden - Admin access only" });
        }
        req.adminId = decoded.id;
        req.adminRole = decoded.role;
        next();
    } catch (err) {
        console.error("Admin token verification error:", err);
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

// Admin Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        // Find admin by email
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Check if admin is active
        if (!admin.isActive) {
            return res.status(403).json({ success: false, message: "Account is deactivated" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email,
                username: admin.username,
                role: admin.role
            },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        // Set cookie
        res.cookie("adminToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            success: true,
            message: "Login successful",
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (err) {
        console.error("Admin login error:", err);
        res.status(500).json({ success: false, message: "Server error during login" });
    }
});

// Admin Logout
router.post("/logout", (req, res) => {
    res.clearCookie("adminToken");
    res.json({ success: true, message: "Logged out successfully" });
});

// Check if admin is authenticated
router.get("/check", verifyAdminToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.adminId).select("-password");
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found" });
        }

        res.json({
            success: true,
            authenticated: true,
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (err) {
        console.error("Admin check error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Create Admin (Only for initial setup - should be protected in production)
router.post("/create", async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
        if (existingAdmin) {
            return res.status(400).json({ success: false, message: "Admin already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin
        const admin = new Admin({
            username,
            email,
            password: hashedPassword,
            role: role || "admin"
        });

        await admin.save();

        res.json({
            success: true,
            message: "Admin created successfully",
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (err) {
        console.error("Admin creation error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;
export { verifyAdminToken };