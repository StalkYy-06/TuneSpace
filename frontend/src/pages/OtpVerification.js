import React, { useState } from "react";
import axios from "axios";
import "../styles/otp.css";

export default function OtpVerification({ email, onSuccess, mode = "register" }) {
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Determine which endpoint to use based on mode
    const getVerifyEndpoint = () => {
        if (mode === "register") {
            return "http://localhost:5000/api/auth/verify-registration";
        } else if (mode === "login") {
            return "http://localhost:5000/api/auth/verify-2fa";
        }
        return "http://localhost:5000/api/auth/verify-registration"; // default
    };

    const getResendEndpoint = () => {
        if (mode === "register") {
            return "http://localhost:5000/api/auth/send-register-otp";
        } else if (mode === "login") {
            return "http://localhost:5000/api/auth/send-login-otp";
        }
        return "http://localhost:5000/api/auth/send-register-otp"; // default
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const endpoint = getVerifyEndpoint();
            const res = await axios.post(endpoint, {
                email,
                otp,
            }, {
                withCredentials: true
            });

            if (res.data.success) {
                setSuccess(true);
                if (onSuccess) onSuccess();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        try {
            const endpoint = getResendEndpoint();
            await axios.post(endpoint, { email });
            alert("OTP resent successfully!");
        } catch (err) {
            setError("Failed to resend OTP");
        }
    };

    if (success) {
        return (
            <div className="otp-container">
                <div className="otp-card">
                    <h2>Verified!</h2>
                    <p>Your email has been verified successfully.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="otp-container">
            <div className="otp-card">
                <h2>Verify Your Email</h2>
                <p>We sent a 6-digit OTP to:</p>
                <p className="email-display">{email}</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        maxLength="6"
                        required
                        disabled={loading}
                    />

                    {error && <div className="error-msg">{error}</div>}

                    <button type="submit" disabled={loading || otp.length !== 6}>
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                </form>

                <div className="resend-section">
                    <p>
                        Didn't receive it?{" "}
                        <button type="button" onClick={handleResend} className="resend-link">
                            Resend OTP
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}