import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/login.css";
import InputField from "../components/InputField";
import GoogleIcon from "../icons/google.png";
import Logo from "../icons/logo.png";
import OtpVerification from "./OtpVerification";

export default function Login() {
    const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
    const [errors, setErrors] = useState({});
    const [otpPhase, setOtpPhase] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const navigate = useNavigate();

    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        try {
            // First validate credentials
            const res = await axios.post("http://localhost:5000/api/auth/login", form);

            const emailToUse = res.data.user.email;
            setUserEmail(emailToUse);

            //send otp
            await axios.post("http://localhost:5000/api/auth/send-otp",
                { email: emailToUse },
                { withCredentials: true }
            );
            setOtpPhase(true);
        } catch (err) {
            const data = err.response?.data;
            if (data?.field && data?.message) {
                setErrors({ [data.field]: data.message });
            } else {
                setErrors({ general: data?.message || "Login Failed" });
            }
        }
    };

    //successful otp
    const handleOtpVerified = () => {
        navigate("/");
    };

    if (otpPhase) {
        return <OtpVerification email={userEmail} onSuccess={handleOtpVerified} mode="login" />;
    }

    return (
        <div>
            <div className="logo-container">
                <Link to="/"><img src={Logo} alt="TuneSpace" className="app-logo" /></Link>
            </div>
            <div className="login">
                <div className="container-l">
                    <div className="l-branding">
                        <h1>TuneSpace</h1>
                        <p>Discover • Review • Connect</p>
                    </div>

                    <div className="l-form">
                        <div className="inner-form">
                            <form onSubmit={handleInitialSubmit}>
                                <h2>Login</h2>

                                <InputField
                                    label="Username or Email"
                                    type="text"
                                    value={form.usernameOrEmail}
                                    onChange={(e) => setForm({ ...form, usernameOrEmail: e.target.value })}
                                    error={errors.usernameOrEmail}
                                />

                                <InputField
                                    label="Password"
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    error={errors.password}
                                />
                                <p style={{ textAlign: "right", margin: "8px 0" }}>
                                    <Link to="/forgot-password" style={{ color: "white", fontSize: "14px" }}>
                                        Forgot Password?
                                    </Link>
                                </p>

                                <button type="submit">Login</button>

                                <div className="or-separator">
                                    <span>OR</span>
                                </div>

                                <div className="google-btn-container">
                                    <button type="button" className="google-btn">
                                        <img src={GoogleIcon} alt="Google" className="google-icon" />
                                        Continue with Google
                                    </button>
                                </div>

                                <p>
                                    Don't have an account? <Link to="/register">Register</Link>
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}