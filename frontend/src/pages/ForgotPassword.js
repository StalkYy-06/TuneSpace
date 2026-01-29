import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/forgot.css";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
            setOtpSent(true);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await axios.post("http://localhost:5000/api/auth/reset-password", {
                email,
                otp,
                newPassword,
                confirmPassword,
            });
            alert("Password reset successful! Please login.");
            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-container">
            {/* Logo at top-left - same as Register & Login */}
            <div className="logo-container">
                <Link to="/" className="Logo">
                    <span>TuneSpace</span>
                </Link>
            </div>

            <div className="forgot-card">
                <h2>Forgot Password</h2>
                <p className="subtitle">
                    {otpSent
                        ? "Enter the code sent to your email"
                        : "We'll send a reset code to your email"}
                </p>

                {!otpSent ? (
                    <form onSubmit={handleSendOTP}>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            autoFocus
                        />
                        {error && <p className="error-msg">{error}</p>}
                        <button type="submit" disabled={loading}>
                            {loading ? "Sending..." : "Send Reset Code"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleReset}>
                        <p className="email-display">Code sent to <strong>{email}</strong></p>

                        <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            maxLength="6"
                            required
                            disabled={loading}
                        />

                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={loading}
                        />

                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                        />

                        {error && <p className="error-msg">{error}</p>}

                        <button type="submit" disabled={loading}>
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                )}

                <p className="back-link">
                    <Link to="/login">Back to Login</Link>
                </p>
            </div>
        </div>
    );
}