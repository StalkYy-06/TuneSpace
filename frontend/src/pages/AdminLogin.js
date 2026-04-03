import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/adminLogin.css";

const AdminLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if admin is already logged in
        checkAdminAuth();
    }, []);

    const checkAdminAuth = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/auth/check", {
                credentials: "include"
            });
            const data = await response.json();
            if (data.success && data.authenticated) {
                navigate("/admin/dashboard");
            }
        } catch (err) {
            // User not logged in, stay on login page
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:5000/api/admin/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                navigate("/admin/dashboard");
            } else {
                setError(data.message || "Login failed");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-login-wrapper">
            <div className="admin-login-container">
                <div className="admin-login-header">
                    <h1>Admin Login</h1>
                </div>

                <form className="admin-login-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="admin-error-message">
                            {error}
                        </div>
                    )}

                    <div className="admin-form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="admin-login-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? "Authenticating..." : "Login"}
                    </button>
                </form>

                <div className="admin-login-footer">
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;