// src/components/Navbar.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/navbar.css";

export default function Navbar() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
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
            } finally {
                setLoading(false);
            }
        };

        const checkAdminAuth = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/admin/auth/check", {
                    credentials: "include"
                });
                const data = await response.json();
                if (data.success && data.authenticated) {
                    setIsAdmin(true);
                }
            } catch (err) {
                // Not admin, ignore error
                setIsAdmin(false);
            }
        };

        fetchUser();
        checkAdminAuth();
    }, []);

    const handleLogout = async () => {
        try {
            // Logout from admin if logged in as admin
            if (isAdmin) {
                await fetch("http://localhost:5000/api/admin/auth/logout", {
                    method: "POST",
                    credentials: "include"
                });
                setIsAdmin(false);
            }

            // Logout from regular user account
            await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
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
        return null; // or a skeleton loader
    }

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/" className="nav-logo">
                    <span>TuneSpace</span>
                </Link>

                <div className="right-group">
                    <ul className="nav-menu">
                        <li className="nav-item">
                            <Link to="/" className="nav-link">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/browse" className="nav-link">Browse</Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/reviews" className="nav-link">Reviews</Link>
                        </li>
                    </ul>

                    <div className="auth-section">
                        {user ? (
                            <a href="/profile" className="profile-btn" onClick={handleProfileClick}>
                                {/* Profile Picture Circle */}
                                <div className="profile-pic-container">
                                    {user.profilePicture ? (
                                        <img
                                            src={`http://localhost:5000${user.profilePicture}`}
                                            alt={user.username}
                                            className="profile-pic"
                                            onError={(e) => {
                                                e.target.src = "/default-avatar.png";
                                                e.target.onerror = null;
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