// src/pages/Home.js  ← FINAL WORKING VERSION
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Home() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/auth/me", {
                    withCredentials: true,
                });

                if (res.data.success) {
                    setUser(res.data.user);
                }
            } catch (err) {
                setUser(null);
            }
        };

        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
            setUser(null);
            alert("Logged out successfully!");
            navigate("/");
        } catch (err) {
            alert("Logout failed");
        }
    };

    return (
        <div className="home-container">
            <div className="home-card">
                <h1>TuneSpace</h1>

                {user ? (
                    <>
                        <h2>
                            Welcome, <span style={{ color: "#6c5ce7" }}>{user.username}</span>!
                        </h2>
                        <button onClick={handleLogout} className="btn logout-btn">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <h2>Please log in to continue</h2>
                        <div className="button-group">
                            <Link to="/login">
                                <button className="btn login-btn">Login</button>
                            </Link>
                            <Link to="/register">
                                <button className="btn register-btn">Register</button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}