import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/home.css";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";

const API = "http://localhost:5000";

export default function Home() {
    const [user, setUser] = useState(null);
    const [trendingAlbums, setTrendingAlbums] = useState([]);
    const [popularArtists, setPopularArtists] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUser();
        fetchHomeData();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await axios.get(`${API}/api/auth/me`, { withCredentials: true });
            if (res.data.success) setUser(res.data.user);
        } catch { setUser(null); }
    };

    const fetchHomeData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/music/home`);
            const data = await res.json();
            if (data.success) {
                setTrendingAlbums(data.trendingAlbums || []);
                setPopularArtists(data.popularArtists || []);
            }
        } catch (err) {
            console.error("Home data error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fmtNumber = (n) =>
        n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
            n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n || 0);

    const SkeletonCard = ({ circle }) => (
        <div className="album-card skeleton-card">
            {circle
                ? <div className="skeleton-circle" />
                : <div className="album-cover skeleton-cover" />
            }
            <div className="skeleton-text skeleton-title-line" />
            <div className="skeleton-text skeleton-sub-line" />
        </div>
    );

    return (
        <div className="home-wrapper">
            <Navbar />
            <div className="home">

                {/* ── Trending Albums ── */}
                <section className="section">
                    <h2>🔥 Trending Albums</h2>
                    <div className="grid">
                        {loading
                            ? [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
                            : trendingAlbums.length > 0
                                ? trendingAlbums.map(album => (
                                    <div key={album.lastfm_key} className="album-card"
                                        onClick={() => navigate(`/album/${encodeURIComponent(album.lastfm_key)}`)}>
                                        <div className="album-cover">
                                            {album.cover_url || album.thumb_url ? (
                                                <>
                                                    <img
                                                        src={album.cover_url || album.thumb_url}
                                                        alt={album.title}
                                                        className="album-cover-img"
                                                        onError={e => {
                                                            e.target.style.display = "none";
                                                            e.target.nextSibling.style.display = "flex";
                                                        }}
                                                    />
                                                    <div className="album-cover-fallback" style={{ display: "none" }}>💿</div>
                                                </>
                                            ) : (
                                                <div className="album-cover-fallback">💿</div>
                                            )}
                                        </div>
                                        <h3>{album.title}</h3>
                                        <p>{album.artist}</p>
                                        <div className="album-card-bottom">
                                            {album.avgRating && (
                                                <span className="album-card-rating">★ {album.avgRating}</span>
                                            )}
                                            {album.lastfm_listeners > 0 && (
                                                <span className="album-card-listeners">
                                                    👥 {fmtNumber(album.lastfm_listeners)}
                                                </span>
                                            )}
                                            {album.lastfm_playcount > 0 && (
                                                <span className="album-card-listeners">
                                                    🔥 {fmtNumber(album.lastfm_playcount)}
                                                </span>
                                            )}
                                        </div>
                                        {album.lastfm_tags?.length > 0 && (
                                            <div className="album-card-tags">
                                                {album.lastfm_tags.slice(0, 2).map(tag => (
                                                    <span key={tag} className="album-card-tag">{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                                : (
                                    <div className="home-empty-state">
                                        <p>Seeding music data… check back in a minute, or <Link to="/search">search for an album</Link>.</p>
                                    </div>
                                )
                        }
                    </div>
                </section>

                {/* ── Popular Artists ── */}
                <section className="section">
                    <h2>🎤 Popular Artists</h2>
                    <div className="grid">
                        {loading
                            ? [...Array(6)].map((_, i) => <SkeletonCard key={i} circle />)
                            : popularArtists.length > 0
                                ? popularArtists.map(artist => (
                                    <div key={artist.lastfm_key} className="artist-card"
                                        onClick={() => navigate(`/artist/${encodeURIComponent(artist.lastfm_key)}`)}>
                                        <div className="artist-image">
                                            {artist.image_url || artist.thumb_url ? (
                                                <>
                                                    <img
                                                        src={artist.image_url || artist.thumb_url}
                                                        alt={artist.name}
                                                        className="artist-image-img"
                                                        onError={e => {
                                                            e.target.style.display = "none";
                                                            e.target.nextSibling.style.display = "flex";
                                                        }}
                                                    />
                                                    <div className="artist-image-fallback" style={{ display: "none" }}>
                                                        {artist.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="artist-image-fallback">
                                                    {artist.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <p>{artist.name}</p>
                                        {artist.lastfm_listeners > 0 && (
                                            <span className="artist-fans">{fmtNumber(artist.lastfm_listeners)} listeners</span>
                                        )}
                                        {artist.lastfm_tags?.length > 0 && (
                                            <span className="artist-genre">{artist.lastfm_tags[0]}</span>
                                        )}
                                    </div>
                                ))
                                : (
                                    <div className="home-empty-state">
                                        <p>Seeding artist data… <Link to="/search">search for an artist</Link> to get started.</p>
                                    </div>
                                )
                        }
                    </div>
                </section>

                {/* ── CTA ── */}
                {!user && (
                    <section className="cta-section">
                        <h2>Join the community</h2>
                        <p>Sign up to review albums, follow artists, and share your taste.</p>
                        <div className="cta-buttons">
                            <Link to="/register"><button className="btn primary">Register</button></Link>
                            <Link to="/login"><button className="btn secondary">Login</button></Link>
                        </div>
                    </section>
                )}
            </div>
            <BottomBar />
        </div>
    );
}