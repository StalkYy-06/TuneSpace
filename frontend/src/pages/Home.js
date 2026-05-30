import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/home.css";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import { API_URL } from "../config/api";

const AVATAR_COLORS = ["#1db954", "#e74c3c", "#3498db", "#9b59b6", "#f39c12", "#e67e22", "#2980b9"];
const gradientForIndex = (i) => {
    const gradients = [
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)"
    ];
    return gradients[i % gradients.length];
};
const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ── Activity types ───────────────────────────────────────────────────
const TYPE_CONFIG = {
    review: { icon: "★", label: "reviewed", color: "#1db954" },
    favourite: { icon: "♥", label: "favourited", color: "#e74c3c" },
    listened: { icon: "👂", label: "listened to", color: "#f39c12" },
};

// ── Feed Post Card ───────────────────────────────────────────────────
function FeedPost({ post, onLikeToggle, navigate }) {
    const [liked, setLiked] = useState(post.isLiked);
    const [likeCount, setLikeCount] = useState(post.likes);

    const handleLike = async () => {
        try {
            const res = await axios.post(`${API_URL}/api/feed/${post.id}/like`, {}, { withCredentials: true });
            if (res.data.success) {
                setLiked(res.data.isLiked);
                setLikeCount(res.data.likes);
                if (onLikeToggle) onLikeToggle(post.id, res.data.isLiked, res.data.likes);
            }
        } catch (err) {
            console.error("Failed to like post:", err);
        }
    };

    const cfg = TYPE_CONFIG.review;

    return (
        <article className="feed-post">
            {/* Post Header */}
            <div className="feed-post-header">
                {post.profilePicture ? (
                    <img
                        src={`${API_URL}${post.profilePicture}`}
                        alt={post.username}
                        className="feed-avatar"
                        style={{ objectFit: "cover" }}
                    />
                ) : (
                    <div className="feed-avatar" style={{ background: post.avatarColor }}>
                        {post.avatarLetter}
                    </div>
                )}
                <div className="feed-post-meta">
                    <span className="feed-username" onClick={() => navigate(`/profile/${post.username}`)} style={{ cursor: "pointer" }}>
                        @{post.username}
                    </span>
                    <div className="feed-action-line">
                        <span className="feed-action-icon" style={{ color: cfg.color }}>{cfg.icon}</span>
                        <span className="feed-action-label">{cfg.label}</span>
                        <span className="feed-dot">·</span>
                        <span className="feed-time">{post.timeAgo}</span>
                    </div>
                </div>
            </div>

            {/* Album card */}
            <div className="feed-album-card">
                <div
                    className="feed-album-cover"
                    style={post.coverUrl
                        ? { backgroundImage: `url(${post.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                        : { background: post.coverGradient }
                    }
                >
                    <div className="feed-cover-overlay">
                        <div className="feed-cover-vinyl">
                            <div className="feed-vinyl-hole" />
                        </div>
                    </div>
                </div>
                <div className="feed-album-details">
                    <div className="feed-album-name">{post.albumName}</div>
                    <div className="feed-album-artist">{post.artistName}</div>
                    {(
                        <div className="feed-stars">
                            {[1, 2, 3, 4, 5].map(i => (
                                <span key={i} className={i <= post.rating ? "feed-star filled" : "feed-star"}>★</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            {post.reviewText && (
                <p className="feed-review-text">"{post.reviewText}"</p>
            )}
            {/* Actions */}
            <div className="feed-actions">
                <button
                    className={`feed-action-btn ${liked ? "active-like" : ""}`}
                    onClick={handleLike}
                >
                    {liked ? "❤️" : "🤍"} {likeCount}
                </button>
                <button className="feed-action-btn">
                    ⭐ {post.rating}/5
                </button>
            </div>
        </article>
    );
}

// ── Story-style avatar row (removed — loaded from leaderboard API) ───

export default function Home() {
    const [user, setUser] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [feedPosts, setFeedPosts] = useState([]);
    const [feedLoading, setFeedLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
                if (res.data.success) {
                    setUser(res.data.user);
                    const profileRes = await axios.get(
                        `${API_URL}/api/profile/user/${res.data.user.username}`,
                        { withCredentials: true }
                    );
                    if (profileRes.data.success) {
                        setUserStats(profileRes.data.stats);
                    }
                }
            } catch { setUser(null); }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const fetchSuggested = async () => {
            try {
                const res = await fetch(`${API_URL}/api/leaderboard?period=monthly`);
                const data = await res.json();
                if (data.success) {
                    const entries = data.leaderboards?.mostReviews || [];
                    setSuggestedUsers(entries.slice(0, 5));
                }
            } catch { /* ignore */ }
        };
        fetchSuggested();
    }, []);

    useEffect(() => {
        const fetchFeed = async () => {
            setFeedLoading(true);
            try {
                const res = await axios.get(`${API_URL}/api/feed`, { withCredentials: true });
                if (res.data.success) {
                    const normalized = (res.data.posts || []).map((post, idx) => ({
                        id: post._id,
                        reviewId: post.reviewId,
                        username: post.username,
                        profilePicture: post.profilePicture || null,
                        avatarLetter: (post.username || "?").charAt(0).toUpperCase(),
                        avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                        timeAgo: timeAgo(post.createdAt),
                        type: "review",
                        albumName: post.contentName,
                        artistName: post.artistName,
                        coverGradient: post.coverUrl ? null : gradientForIndex(idx),
                        coverUrl: post.coverUrl || "",
                        rating: post.rating,
                        reviewText: post.reviewText || "",
                        likes: post.likes || 0,
                        isLiked: !!post.isLiked
                    }));
                    setFeedPosts(normalized);
                }
            } catch (err) {
                console.error("Failed to fetch feed:", err);
                setFeedPosts([]);
            } finally {
                setFeedLoading(false);
            }
        };
        fetchFeed();
    }, []);

    return (
        <div className="home-wrapper">
            <Navbar />
            <div className="home-feed-layout">

                {/* ── Left sidebar (desktop only) ── */}
                <aside className="feed-sidebar feed-sidebar-left">
                    <div className="sidebar-widget">
                        <h3 className="sidebar-widget-title">Your Stats</h3>
                        {user ? (
                            <div className="sidebar-stats">
                                <div className="sidebar-stat-row">
                                    <span className="sidebar-stat-icon">📀</span>
                                    <span className="sidebar-stat-label">Albums reviewed</span>
                                    <span className="sidebar-stat-val">{userStats?.totalReviews ?? 0}</span>
                                </div>
                                <div className="sidebar-stat-row">
                                    <span className="sidebar-stat-icon">❤️</span>
                                    <span className="sidebar-stat-label">Likes received</span>
                                    <span className="sidebar-stat-val">{userStats?.totalLikes ?? 0}</span>
                                </div>
                                <div className="sidebar-stat-row">
                                    <span className="sidebar-stat-icon">👥</span>
                                    <span className="sidebar-stat-label">Following</span>
                                    <span className="sidebar-stat-val">{userStats?.followingCount ?? 0}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="sidebar-auth-cta">
                                <p>Track your music journey</p>
                                <Link to="/register" className="sidebar-cta-btn">Get Started</Link>
                            </div>
                        )}
                    </div>

                    <div className="sidebar-widget">
                        <h3 className="sidebar-widget-title">Discover</h3>
                        <div className="sidebar-links">
                            <button className="sidebar-link-btn" onClick={() => navigate("/search")}>
                                🔍 Browse Music
                            </button>
                            <button className="sidebar-link-btn" onClick={() => navigate("/leaderboard")}>
                                🏆 Leaderboard
                            </button>
                            <button className="sidebar-link-btn" onClick={() => navigate("/search")}>
                                🎤 Top Artists
                            </button>
                        </div>
                    </div>
                </aside>

                {/* ── Main feed ── */}
                <main className="feed-main">


                    {/* Coming soon banner */}
                    {/* <div className="feed-coming-soon">
                        <div className="feed-coming-icon">🚧</div>
                        <div>
                            <div className="feed-coming-title">Feed coming soon</div>
                            <div className="feed-coming-sub">
                                Follow people to see their reviews and activity here.
                                <Link to="/search" className="feed-coming-link"> Discover music →</Link>
                            </div>
                        </div>
                    </div> */}

                    <div className="feed-posts">
                        {feedLoading ? (
                            <div className="feed-coming-soon">
                                <div className="feed-coming-title">Loading feed...</div>
                            </div>
                        ) : feedPosts.length === 0 ? (
                            <div className="feed-coming-soon">
                                <div className="feed-coming-icon">📝</div>
                                <div>
                                    <div className="feed-coming-title">No shared reviews yet</div>
                                    <div className="feed-coming-sub">
                                        Share a review from your profile to see it here.
                                        <Link to="/profile" className="feed-coming-link"> Open profile →</Link>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            feedPosts.map(post => (
                                <FeedPost key={post.id} post={post} navigate={navigate} />
                            ))
                        )}
                    </div>
                </main>

                {/* ── Right sidebar (desktop only) ── */}
                <aside className="feed-sidebar feed-sidebar-right">
                    <div className="sidebar-widget">
                        <h3 className="sidebar-widget-title">Suggested Users</h3>
                        <div className="suggested-users">
                            {suggestedUsers.length === 0 ? (
                                <p style={{ color: "#888", fontSize: "0.85rem", padding: "8px 0" }}>No reviewers yet</p>
                            ) : (
                                suggestedUsers.map((s, i) => (
                                    <div key={s.username} className="suggested-user" onClick={() => navigate(`/profile/${s.username}`)} style={{ cursor: "pointer" }}>
                                        {s.profilePicture ? (
                                            <img src={`${API_URL}${s.profilePicture}`} alt={s.username} className="suggested-avatar" style={{ objectFit: "cover" }} />
                                        ) : (
                                            <div className="suggested-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                                                {s.username?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="suggested-info">
                                            <div className="suggested-name">@{s.username}</div>
                                            <div className="suggested-sub">{s.reviewCount || 0} reviews</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="sidebar-widget sidebar-trending-widget">
                        <h3 className="sidebar-widget-title">🔥 Trending Now</h3>
                        <button className="sidebar-trending-link" onClick={() => navigate("/search")}>
                            Explore trending albums →
                        </button>
                    </div>

                    <div className="sidebar-footer">
                        <Link to="/about">About</Link>
                        <Link to="/privacy">Privacy</Link>
                        <Link to="/terms">Terms</Link>
                        <Link to="/contact">Contact</Link>
                        <span>© 2025 TuneSpace</span>
                    </div>
                </aside>
            </div>
            <BottomBar />
        </div>
    );
}