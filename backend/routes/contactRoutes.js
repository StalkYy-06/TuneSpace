import express from "express";
import ContactMessage from "../models/ContactMessage.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        if (!email.includes("@")) {
            return res.status(400).json({ success: false, message: "Invalid email format." });
        }

        await ContactMessage.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim()
        });

        res.json({ success: true, message: "Message received. We'll get back to you soon." });
    } catch (err) {
        console.error("Contact form error:", err);
        res.status(500).json({ success: false, message: "Failed to send message." });
    }
});

export default router;
