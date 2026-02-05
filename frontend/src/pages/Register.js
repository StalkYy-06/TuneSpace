import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/register.css";
import InputField from "../components/InputField";
import GoogleIcon from "../icons/google.png";
import OtpVerification from "./OtpVerification";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Register() {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState({});
    const [otpPhase, setOtpPhase] = useState(false);
    const navigate = useNavigate();

    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        try {
            // Send full registration data
            await axios.post(
                `${API_URL}/api/auth/register`,
                form,
                { withCredentials: true }
            );
            setOtpPhase(true);
        } catch (err) {
            const data = err.response?.data;
            if (data?.field && data?.message) {
                setErrors({ [data.field]: data.message });
            } else {
                setErrors({ general: data?.message || "Registration failed" });
            }
        }
    };

    const handleOtpVerified = async () => {
        navigate("/");
    };

    // Handle Google OAuth registration
    const handleGoogleRegister = () => {
        // Redirect to backend Google OAuth endpoint
        window.location.href = `${API_URL}/api/auth/google`;
    };

    if (otpPhase) {
        return <OtpVerification email={form.email} onSuccess={handleOtpVerified} mode="register" />;
    }

    return (
        <div>
            <div className="logo-container">
                <Link to="/" className="Logo">
                    <span>TuneSpace</span>
                </Link>
            </div>
            <div className="register">
                <div className="container-r">

                    {/* Branding Left */}
                    <div className="r-branding">
                        <h1>TuneSpace</h1>
                        <p>Discover • Review • Connect</p>
                    </div>

                    {/* Form Right with Inner Panel */}
                    <div className="r-form">
                        <div className="inner-form">
                            <form onSubmit={handleInitialSubmit}>
                                <h2>Register</h2>

                                <InputField
                                    label="Username"
                                    type="text"
                                    value={form.username}
                                    onChange={e => setForm({ ...form, username: e.target.value })}
                                    error={errors.username}
                                />

                                <InputField
                                    label="Email"
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    error={errors.email}
                                />

                                <InputField
                                    label="Password"
                                    type="password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    error={errors.password}
                                />

                                <InputField
                                    label="Confirm Password"
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                                    error={errors.confirmPassword}
                                />

                                {errors.general && <p className="error-msg">{errors.general}</p>}

                                <button type="submit">Register</button>

                                <div className="or-separator">
                                    <span>OR</span>
                                </div>

                                <div className="google-btn-container-r">
                                    <button
                                        type="button"
                                        className="google-btn"
                                        onClick={handleGoogleRegister}
                                    >
                                        <img src={GoogleIcon} alt="Google" className="google-icon" />
                                        Continue with Google
                                    </button>
                                </div>

                                <p>
                                    Already have an account? <Link to="/login">Login</Link>
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}