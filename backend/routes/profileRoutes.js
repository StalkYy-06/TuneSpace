import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { uploadProfilePicture } from "../middleware/upload.js";
import fs from "fs";
import path from "path";

const router = express.Router();

// Get User Profile
router.get("/me", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.json({
            success: true,
            user: {
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio,
                twoFactorEnabled: user.twoFactorEnabled,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Update Profile (username, bio)
router.put("/update", protect, async (req, res) => {
    const { username, bio } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Validate username if changing
        if (username && username !== user.username) {
            if (!username.trim()) {
                return res.status(400).json({
                    success: false,
                    field: "username",
                    message: "Username cannot be empty"
                });
            }

            // Check if username already exists
            const existingUser = await User.findOne({ username, _id: { $ne: req.user.id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    field: "username",
                    message: "Username already taken"
                });
            }

            user.username = username.trim();
        }

        // Update bio
        if (bio !== undefined) {
            if (bio.length > 500) {
                return res.status(400).json({
                    success: false,
                    field: "bio",
                    message: "Bio must be under 500 characters"
                });
            }
            user.bio = bio;
        }

        await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio,
            }
        });
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                field: "username",
                message: "Username already taken"
            });
        }
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Upload Profile Picture
router.post("/upload-picture", protect, (req, res) => {
    uploadProfilePicture(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "Upload failed"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                // Delete uploaded file if user not found
                fs.unlinkSync(req.file.path);
                return res.status(404).json({ success: false, message: "User not found" });
            }

            // Delete old profile picture if exists
            if (user.profilePicture) {
                const oldPicturePath = path.join(".", user.profilePicture);
                if (fs.existsSync(oldPicturePath)) {
                    fs.unlinkSync(oldPicturePath);
                }
            }

            // Save new picture path
            user.profilePicture = `/uploads/profiles/${req.file.filename}`;
            await user.save();

            res.json({
                success: true,
                message: "Profile picture uploaded successfully",
                profilePicture: user.profilePicture
            });
        } catch (err) {
            // Delete uploaded file on error
            fs.unlinkSync(req.file.path);
            console.error(err);
            res.status(500).json({ success: false, message: "Server error" });
        }
    });
});

// Delete Profile Picture
router.delete("/delete-picture", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (!user.profilePicture) {
            return res.status(400).json({
                success: false,
                message: "No profile picture to delete"
            });
        }

        // Delete file from server
        const picturePath = path.join(".", user.profilePicture);
        if (fs.existsSync(picturePath)) {
            fs.unlinkSync(picturePath);
        }

        user.profilePicture = null;
        await user.save();

        res.json({
            success: true,
            message: "Profile picture deleted successfully"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Toggle 2FA
router.post("/toggle-2fa", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.twoFactorEnabled = !user.twoFactorEnabled;
        await user.save();

        res.json({
            success: true,
            message: `2FA ${user.twoFactorEnabled ? "enabled" : "disabled"}`,
            twoFactorEnabled: user.twoFactorEnabled,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;