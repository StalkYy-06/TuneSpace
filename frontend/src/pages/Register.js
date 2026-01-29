import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/register.css";
import InputField from "../components/InputField";
import GoogleIcon from "../icons/google.png";
import Logo from "../icons/logo.png";
import OtpVerification from "./OtpVerification";

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
                "http://localhost:5000/api/auth/register",
                form,
                { withCredentials: true }
            );
            setOtpPhase(true);
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to start registration";
            setErrors({ email: msg });
        }
    };

    const handleOtpVerified = async () => {
        navigate("/");
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

                                <InputField label="Username" type="text" value={form.username}
                                    onChange={e => setForm({ ...form, username: e.target.value })} error={errors.username} />

                                <InputField label="Email" type="email" value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })} error={errors.email} />

                                <InputField label="Password" type="password" value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })} error={errors.password} />

                                <InputField label="Confirm Password" type="password" value={form.confirmPassword}
                                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })} error={errors.confirmPassword} />

                                <button type="submit">Register</button>

                                <div className="or-separator">
                                    <span>OR</span>
                                </div>

                                <div className="google-btn-container-r">
                                    <button type="button" className="google-btn">
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