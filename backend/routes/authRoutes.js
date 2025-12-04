import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";

const router = express.Router();

const sendError = (res, field, message) => {
    return res.status(400).json({ field, message });
};

// REGISTER
router.post("/register", async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Backend validation
    if (!username || username.trim() === "")
        return sendError(res, "username", "Username is required.");

    if (!email || email.trim() === "")
        return sendError(res, "email", "Email is required.");

    if (!email.includes("@"))
        return res.status(400).json({ field: "email", message: "Invalid email format." });

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!passwordRegex.test(password))
        return res.status(400).json({
            field: "password",
            message: "Password must include 1 uppercase, 1 number, 1 symbol and be 8+ characters."
        });

    if (password !== confirmPassword)
        return res.status(400).json({ field: "confirmPassword", message: "Passwords do not match." });

    try {
        const exists = await User.findOne({ email });
        if (exists)
            return res.status(400).json({ field: "email", message: "Email already registered." });

        //Hash passwords
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });
        await newUser.save();

        res.json({ message: "Registration successful!" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || usernameOrEmail.trim() === "")
        return sendError(res, "usernameOrEmail", "Username or email is required.");

    const user = await User.findOne({
        $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
    });

    if (!user)
        return res.status(400).json({
            field: "usernameOrEmail",
            message: "User not found."
        });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
        return res.status(400).json({
            field: "password",
            message: "Incorrect password."
        });

    res.json({ message: "Login successful!" });
});

export default router;
