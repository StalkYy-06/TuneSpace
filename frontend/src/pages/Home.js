// src/pages/Home.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/home.css";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";

export default function Home() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Placeholder data
    const newReleases = [
        {
            id: "album1",
            name: "Midnight Echoes",
            artists: [{ id: "artist1", name: "The Neon Waves" }],
            images: [{ url: "https://via.placeholder.com/300x300/1db954/ffffff?text=Midnight+Echoes" }],
            release_date: "2024-01-15"
        },
        {
            id: "album2",
            name: "Cosmic Journey",
            artists: [{ id: "artist2", name: "Luna Sky" }],
            images: [{ url: "https://via.placeholder.com/300x300/e91e63/ffffff?text=Cosmic+Journey" }],
            release_date: "2024-02-20"
        },
        {
            id: "album3",
            name: "Urban Symphony",
            artists: [{ id: "artist3", name: "Metro Pulse" }],
            images: [{ url: "https://via.placeholder.com/300x300/9c27b0/ffffff?text=Urban+Symphony" }],
            release_date: "2023-11-05"
        },
        {
            id: "album4",
            name: "Ocean Waves",
            artists: [{ id: "artist4", name: "Coastal Breeze" }],
            images: [{ url: "https://via.placeholder.com/300x300/00bcd4/ffffff?text=Ocean+Waves" }],
            release_date: "2024-03-10"
        },
        {
            id: "album5",
            name: "Golden Hour",
            artists: [{ id: "artist5", name: "Sunset Collective" }],
            images: [{ url: "https://via.placeholder.com/300x300/ff9800/ffffff?text=Golden+Hour" }],
            release_date: "2023-09-18"
        },
        {
            id: "album6",
            name: "Velvet Dreams",
            artists: [{ id: "artist6", name: "Silk Road" }],
            images: [{ url: "https://via.placeholder.com/300x300/673ab7/ffffff?text=Velvet+Dreams" }],
            release_date: "2024-01-22"
        },
        {
            id: "album7",
            name: "Thunder & Lightning",
            artists: [{ id: "artist7", name: "Storm Chasers" }],
            images: [{ url: "https://via.placeholder.com/300x300/f44336/ffffff?text=Thunder" }],
            release_date: "2023-12-01"
        },
        {
            id: "album8",
            name: "Serenity",
            artists: [{ id: "artist1", name: "The Neon Waves" }],
            images: [{ url: "https://via.placeholder.com/300x300/4caf50/ffffff?text=Serenity" }],
            release_date: "2024-02-14"
        }
    ];

    const featuredAlbums = [
        {
            id: "album9",
            name: "Crystal Nights",
            artists: [{ id: "artist9", name: "Starlight Band" }],
            images: [{ url: "https://via.placeholder.com/300x300/2196f3/ffffff?text=Crystal+Nights" }]
        },
        {
            id: "album10",
            name: "Electric Paradise",
            artists: [{ id: "artist10", name: "Voltage" }],
            images: [{ url: "https://via.placeholder.com/300x300/ff5722/ffffff?text=Electric+Paradise" }]
        },
        {
            id: "album11",
            name: "Whispers in the Wind",
            artists: [{ id: "artist11", name: "Echo Valley" }],
            images: [{ url: "https://via.placeholder.com/300x300/795548/ffffff?text=Whispers" }]
        },
        {
            id: "album12",
            name: "Neon Dreams",
            artists: [{ id: "artist12", name: "Cyber City" }],
            images: [{ url: "https://via.placeholder.com/300x300/ff4081/ffffff?text=Neon+Dreams" }]
        },
        {
            id: "album13",
            name: "Autumn Leaves",
            artists: [{ id: "artist13", name: "Maple Grove" }],
            images: [{ url: "https://via.placeholder.com/300x300/ff6f00/ffffff?text=Autumn+Leaves" }]
        },
        {
            id: "album14",
            name: "Midnight Jazz",
            artists: [{ id: "artist14", name: "Blue Note Trio" }],
            images: [{ url: "https://via.placeholder.com/300x300/3f51b5/ffffff?text=Midnight+Jazz" }]
        },
        {
            id: "album15",
            name: "Summer Vibes",
            artists: [{ id: "artist15", name: "Beach Boys Revival" }],
            images: [{ url: "https://via.placeholder.com/300x300/ffc107/ffffff?text=Summer+Vibes" }]
        },
        {
            id: "album16",
            name: "Deep Space",
            artists: [{ id: "artist16", name: "Cosmic Explorers" }],
            images: [{ url: "https://via.placeholder.com/300x300/7c4dff/ffffff?text=Deep+Space" }]
        }
    ];

    const trendingArtists = [
        {
            id: "artist1",
            name: "The Neon Waves",
            images: [{ url: "https://via.placeholder.com/300x300/1db954/ffffff?text=Neon+Waves" }],
            followers: { total: 1250000 },
            genres: ["Electronic", "Synthwave"]
        },
        {
            id: "artist2",
            name: "Luna Sky",
            images: [{ url: "https://via.placeholder.com/300x300/e91e63/ffffff?text=Luna+Sky" }],
            followers: { total: 890000 },
            genres: ["Dream Pop"]
        },
        {
            id: "artist3",
            name: "Metro Pulse",
            images: [{ url: "https://via.placeholder.com/300x300/9c27b0/ffffff?text=Metro+Pulse" }],
            followers: { total: 2100000 },
            genres: ["Hip Hop"]
        },
        {
            id: "artist4",
            name: "Coastal Breeze",
            images: [{ url: "https://via.placeholder.com/300x300/00bcd4/ffffff?text=Coastal+Breeze" }],
            followers: { total: 675000 },
            genres: ["Chill"]
        },
        {
            id: "artist5",
            name: "Sunset Collective",
            images: [{ url: "https://via.placeholder.com/300x300/ff9800/ffffff?text=Sunset" }],
            followers: { total: 1450000 },
            genres: ["Indie Rock"]
        },
        {
            id: "artist6",
            name: "Silk Road",
            images: [{ url: "https://via.placeholder.com/300x300/673ab7/ffffff?text=Silk+Road" }],
            followers: { total: 980000 },
            genres: ["R&B"]
        }
    ];

    useEffect(() => {
        fetchUser();
        // Simulate loading time
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }, []);

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

    const handleAlbumClick = (albumId) => {
        navigate(`/album/${albumId}`);
    };

    const handleArtistClick = (artistId) => {
        navigate(`/artist/${artistId}`);
    };

    if (loading) {
        return (
            <div className="home-wrapper">
                <Navbar />
                <div className="home-loading">Loading your music space...</div>
                <BottomBar />
            </div>
        );
    }

    return (
        <div className="home-wrapper">
            <Navbar />

            <div className="home">
                {/* New Releases */}
                <section className="section">
                    <h2>New Releases</h2>
                    <div className="grid">
                        {newReleases.map((album) => (
                            <div
                                key={album.id}
                                className="album-card"
                                onClick={() => handleAlbumClick(album.id)}
                            >
                                <div className="album-cover">
                                    <img
                                        src={album.images[0].url}
                                        alt={album.name}
                                        className="album-cover-img"
                                    />
                                </div>
                                <h3>{album.name}</h3>
                                <p>{album.artists[0].name}</p>
                                <span className="release-date">
                                    {new Date(album.release_date).getFullYear()}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Featured Albums */}
                <section className="section">
                    <h2>Featured Albums</h2>
                    <div className="grid">
                        {featuredAlbums.map((album) => (
                            <div
                                key={album.id}
                                className="album-card"
                                onClick={() => handleAlbumClick(album.id)}
                            >
                                <div className="album-cover">
                                    <img
                                        src={album.images[0].url}
                                        alt={album.name}
                                        className="album-cover-img"
                                    />
                                </div>
                                <h3>{album.name}</h3>
                                <p>{album.artists[0].name}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Trending Artists */}
                <section className="section">
                    <h2>Popular Artists</h2>
                    <div className="grid">
                        {trendingArtists.map((artist) => (
                            <div
                                key={artist.id}
                                className="artist-card"
                                onClick={() => handleArtistClick(artist.id)}
                            >
                                <div className="artist-image">
                                    <img
                                        src={artist.images[0].url}
                                        alt={artist.name}
                                        className="artist-image-img"
                                    />
                                </div>
                                <p>{artist.name}</p>
                                <span className="artist-fans">
                                    {artist.followers.total.toLocaleString()} followers
                                </span>
                                {artist.genres && artist.genres.length > 0 && (
                                    <span className="artist-genre">
                                        {artist.genres[0]}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Call to Action */}
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