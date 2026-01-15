// src/pages/Home.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/home.css";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";

export default function Home() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return <div className="home-loading">Loading your music space...</div>;
    }

    return (
        <div className="home-wrapper">
            <Navbar />

            <div className="home">
                {/* Featured Albums */}
                <section className="section">
                    <h2>Featured Albums</h2>
                    <div className="grid">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="album-card placeholder">
                                <div className="album-cover"></div>
                                <h3>Album Title {i}</h3>
                                <p>Artist Name</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Recent Reviews */}
                <section className="section">
                    <h2>Recent Reviews</h2>
                    <div className="reviews-list">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="review-card placeholder">
                                <div className="review-header">
                                    <div className="avatar-placeholder"></div>
                                    <div>
                                        <strong>User{i}</strong> reviewed <em>Album Name</em>
                                    </div>
                                </div>
                                <p>"This album is a masterpiece... lorem ipsum dolor sit amet."</p>
                                <div className="rating">★★★★☆</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Trending Artists */}
                <section className="section">
                    <h2>Trending Artists</h2>
                    <div className="grid">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="artist-card placeholder">
                                <div className="artist-image"></div>
                                <p>Artist {i}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Login and register */}
                {!user && (
                    <section className="cta-section">
                        <h2>Join the community</h2>
                        <p>Sign up to review albums, follow artists, and share your taste.</p>
                        <div className="cta-buttons">
                            <Link to="/register">
                                <button className="btn primary">Register</button>
                            </Link>
                            <Link to="/login">
                                <button className="btn secondary">Login</button>
                            </Link>
                        </div>
                    </section>
                )}
            </div>
            <BottomBar />
        </div>
    );
}