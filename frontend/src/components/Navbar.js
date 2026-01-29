// src/components/Navbar.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/navbar.css";

export default function Navbar() {
    const [user, setUser] = useState(null);
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
        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
            setUser(null);
            navigate("/");
        } catch (err) {
            console.error("Logout failed");
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
                            <Link to="/profile" className="profile-btn">
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
                                <span className="profile-username">{user.username}</span>
                            </Link>
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