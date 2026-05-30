// src/components/Navbar.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/api";
import "../styles/navbar.css";

export default function Navbar() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/auth/me`, {
                    withCredentials: true,
                });
                if (res.data.success) {
                    setUser(res.data.user);
                }
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        const checkAdminAuth = async () => {
            try {
                const response = await fetch(`${API_URL}/api/admin/auth/check`, {
                    credentials: "include"
                });
                const data = await response.json();
                if (data.success && data.authenticated) {
                    setIsAdmin(true);
                }
            } catch (err) {
                setIsAdmin(false);
            }
        };

        fetchUser();
        checkAdminAuth();
    }, []);

    const handleLogout = async () => {
        try {
            if (isAdmin) {
                await fetch(`${API_URL}/api/admin/auth/logout`, {
                    method: "POST",
                    credentials: "include"
                });
                setIsAdmin(false);
            }

            await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
            setUser(null);
            navigate("/");
        } catch (err) {
            console.error("Logout failed");
        }
    };

    const handleProfileClick = (e) => {
        e.preventDefault();
        if (isAdmin) {
            navigate("/admin/dashboard");
        } else {
            navigate("/profile");
        }
    };

    if (loading) {
        return null;
    }

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/home" className="nav-logo">
                    <span>TuneSpace</span>
                </Link>

                <div className="right-group">
                    <ul className="nav-menu">
                        <li className="nav-item">
                            <Link to="/home" className="nav-link">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/search" className="nav-link">Search</Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
                        </li>
                    </ul>

                    <div className="auth-section">
                        {user ? (
                            <a href="/profile" className="profile-btn" onClick={handleProfileClick}>
                                <div className="profile-pic-container">
                                    {user.profilePicture ? (
                                        <img
                                            src={`${API_URL}${user.profilePicture}`}
                                            alt={user.username}
                                            className="profile-pic"
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                            }}
                                        />
                                    ) : (
                                        <div className="profile-pic-default">
                                            {user.username?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                    )}
                                </div>
                                <span className="profile-username-nav">{user.username}</span>
                            </a>
                        ) : (
                            <Link to="/login" className="auth-btn">
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
