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
        }
        setLoading(false);
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
            alert("Password reset successful!");
            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.message || "Reset failed");
        }
        setLoading(false);
    };

    return (
        <div className="forgot-container">
            <div className="forgot-card">
                <h2>Forgot Password</h2>

                {!otpSent ? (
                    <form onSubmit={handleSendOTP}>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {error && <p className="error-msg">{error}</p>}
                        <button type="submit" disabled={loading}>
                            {loading ? "Sending..." : "Send OTP"}
                        </button>
                        <p>
                            <Link to="/login">Back to Login</Link>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleReset}>
                        <p>OTP sent to {email}</p>
                        <input
                            type="text"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength="6"
                            required
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        {error && <p className="error-msg">{error}</p>}
                        <button type="submit" disabled={loading}>
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}