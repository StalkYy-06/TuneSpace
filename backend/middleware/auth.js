import jwt from "jsonwebtoken";
import JWT_SECRET from "../utils/jwtSecret.js";
import { rejectIfBanned } from "./checkBan.js";

export const protect = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { id: decoded.id };
        if (await rejectIfBanned(decoded.id, res)) return;
        next();
    } catch (err) {
        res.status(401).json({ message: "Not authorized, token failed" });
    }
};