// utils/otp.js
import Otp from "../models/Otp.js";
import { sendLoginOTP, sendRegisterOTP, send2FAOTP, sendForgotPasswordOTP } from "./mailer.js";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendAndStoreOTP = async (email, purpose = "register") => {
    const otp = generateOTP();

    // Delete any old OTPs for this email + purpose
    await Otp.deleteMany({ email: email.toLowerCase(), purpose });

    // Save new OTP
    await Otp.create({
        email: email.toLowerCase(),
        otp,
        purpose,
    });

    // Send appropriate email based on purpose
    switch (purpose) {
        case "register":
            await sendRegisterOTP(email, otp);
            break;
        case "2fa-login":
            await send2FAOTP(email, otp);
            break;
        case "forgot-password":
            await sendForgotPasswordOTP(email, otp);
            break;
        default:
            await sendLoginOTP(email, otp);
    }

    return true;
};

export const verifyOTP = async (email, otp, purpose = "login") => {
    const record = await Otp.findOne({
        email: email.toLowerCase(),
        otp,
        purpose,
    });

    if (!record) return false;

    // Check if expired
    if (new Date() > record.expiresAt) {
        await Otp.deleteOne({ _id: record._id });
        return false;
    }

    // Valid → delete it
    await Otp.deleteOne({ _id: record._id });
    return true;
};