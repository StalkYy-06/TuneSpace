// utils/jwt.js
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "7d", // Token expires in 7 days
    });
};

const setAuthCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,         // Cannot be accessed by JavaScript (prevents XSS)
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "strict",     // Prevent CSRF
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

const clearAuthCookie = (res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
};

export { generateToken, setAuthCookie, clearAuthCookie };