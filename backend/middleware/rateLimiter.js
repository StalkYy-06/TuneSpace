import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, //15 max login per 15 mins
    message: {
        success: false,
        message: "Too many attempts. Please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const otpRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Max 5 OTP requests per email
    message: {
        success: false,
        message: "Too many OTP requests. Try again later.",
    },
    // Fixed: Use standardized key generation that handles IPv6
    keyGenerator: (req) => {
        // Use email from request body if available, otherwise fall back to IP
        return req.body.email || req.ip;
    },
    // Add this to properly handle IPv6
    skip: (req) => {
        // Don't skip any requests, but this ensures proper IPv6 handling
        return false;
    },
});