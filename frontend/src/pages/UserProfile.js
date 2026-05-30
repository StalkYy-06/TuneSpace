import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import "../styles/userProfile.css";
import { API_URL } from "../config/api";

/* Reusable login prompt modal - same style as AllReviews */
const LoginPromptModal = ({ isOpen, onClose, navigate }) => {
    if (!isOpen) return null;
    return (
        <div className="ar-modal-overlay" onClick={onClose} style={{ zIndex: 9999, position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#181818", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "40px 36px", maxWidth: 400, width: "90%", textAlign: "center", position: "relative", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
                <button onClick={onClose} style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", color: "#888", fontSize: "1.6rem", cursor: "pointer" }}>×</button>
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔒</div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>Sign in required</h3>
                <p style={{ color: "#999", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 28px" }}>You need to be logged in to follow users. Join our community!</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button onClick={() => navigate("/login")} style={{ padding: "12px 28px", background: "linear-gradient(135deg,#1db954,#1ed760)", border: "none", borderRadius: 50, color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>Log In</button>
                    <button onClick={() => navigate("/register")} style={{ padding: "12px 28px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 50, color: "#e0e0e0", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer" }}>Sign Up</button>
                </div>
            </div>
        </div>
    );
};

const UserProfile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [favouriteAlbums, setFavouriteAlbums] = useState([]);
    const [sharedPosts, setSharedPosts] = useState([]);

    useEffect(() => {
        checkAuth();
        fetchProfile();
    }, [username]);

    const checkAuth = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                credentials: "include"
            });
            const data = await response.json();
            if (data.success && data.user) {
                setCurrentUserId(data.user._id);
            }
        } catch (err) {
            console.error("Error checking auth:", err);
        }
    };

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(
                `${API_URL}/api/profile/user/${username}`,
                { credentials: "include" }
            );
            const data = await response.json();

            if (data.success) {
                setProfileData(data);
                setIsFollowing(data.isFollowing);
                setFollowersCount(data.stats.followersCount);

                // Fetch favourite albums for this user
                if (data.user?._id) {
                    fetchFavourites(data.user._id);
                    fetchSharedReviews(data.user._id);
                }
            } else {
                console.error("Profile not found");
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSharedReviews = async (userId) => {
        try {
            const response = await fetch(`${API_URL}/api/feed/user/${userId}`, {
                credentials: "include"
            });
            const data = await response.json();
            if (data.success) {
                setSharedPosts(data.posts || []);
            }
        } catch (err) {
            console.error("Error fetching shared reviews:", err);
        }
    };

    const fetchFavourites = async (userId) => {
        try {
            const response = await fetch(`${API_URL}/api/favourites/user/${userId}`);
            const data = await response.json();
            if (data.success) {
                setFavouriteAlbums(data.favourites || []);
            }
        } catch (err) {
            console.error("Error fetching favourites:", err);
        }
    };

    const handleFollow = async () => {
        if (!currentUserId) {
            setShowLoginModal(true);
            return;
        }

        try {
            const endpoint = isFollowing
                ? `${API_URL}/api/profile/unfollow/${profileData.user._id}`
                : `${API_URL}/api/profile/follow/${profileData.user._id}`;

            const response = await fetch(endpoint, {
                method: "POST",
                credentials: "include"
            });

            const data = await response.json();

            if (data.success) {
                setIsFollowing(!isFollowing);
                setFollowersCount(data.followersCount);
            } else {
                console.error(data.message);
            }
        } catch (err) {
            console.error("Error following/unfollowing:", err);
        }
    };

    // Compute rating distribution from real reviews
    const getRatingDistribution = (reviews) => {
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        (reviews || []).forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) dist[Math.round(r.rating)]++;
        });
        return dist;
    };

    if (isLoading) {
        return (
            <div className="up-wrapper">
                <Navbar />
                <div className="up-loading">
                    <div className="up-loading-spinner" />
                    <span>Loading profile...</span>
                </div>
                <BottomBar />
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="up-wrapper">
                <Navbar />
                <div className="up-error-state">
                    <div className="up-error-icon">😕</div>
                    <h2>User Not Found</h2>
                    <p>The user you're looking for doesn't exist.</p>
                    <button onClick={() => navigate(-1)} className="up-back-btn">← Go Back</button>
                </div>
                <BottomBar />
            </div>
        );
    }

    const { user, stats, reviews } = profileData;
    const ratingDist = getRatingDistribution(reviews);
    const totalRatings = Object.values(ratingDist).reduce((a, b) => a + b, 0);
    const maxDistCount = Math.max(totalRatings, 1);

    return (
        <div className="up-wrapper">
            <Navbar />
            <LoginPromptModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} navigate={navigate} />

            <main className="up-content">
                <div className="up-container">
                    {/* Back Button */}
                    <button className="up-back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>

                    {/* Profile Header - inspired by Profile.js gradient header */}
                    <div className="up-profile-header">
                        <div className="up-header-gradient" />

                        <div className="up-header-content">
                            <div className="up-avatar-wrap">
                                {user.profilePicture ? (
                                    <img
                                        src={`${API_URL}${user.profilePicture}`}
                                        alt={user.username}
                                        className="up-avatar-img"
                                    />
                                ) : (
                                    <div className="up-avatar-placeholder">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="up-header-info">
                                <h1 className="up-username">{user.username}</h1>

                                {user.bio && (
                                    <p className="up-bio">{user.bio}</p>
                                )}

                                <div className="up-meta">
                                    <span className="up-meta-item">
                                        📅 Joined {new Date(user.createdAt).toLocaleDateString("en-US", {
                                            month: "long",
                                            year: "numeric"
                                        })}
                                    </span>
                                </div>

                                {/* Stats Row */}
                                <div className="up-stats-row">
                                    <div className="up-stat-box">
                                        <div className="up-stat-value">{stats.totalReviews}</div>
                                        <div className="up-stat-label">Reviews</div>
                                    </div>
                                    <div className="up-stat-box">
                                        <div className="up-stat-value">{followersCount}</div>
                                        <div className="up-stat-label">Followers</div>
                                    </div>
                                    <div className="up-stat-box">
                                        <div className="up-stat-value">{stats.followingCount}</div>
                                        <div className="up-stat-label">Following</div>
                                    </div>
                                    <div className="up-stat-box">
                                        <div className="up-stat-value">{stats.totalLikes}</div>
                                        <div className="up-stat-label">Likes</div>
                                    </div>
                                    <div className="up-stat-box">
                                        <div className="up-stat-value">{stats.avgRating}</div>
                                        <div className="up-stat-label">Avg Rating</div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="up-action-row">
                                    {!profileData.isOwnProfile && (
                                        <button
                                            className={`up-follow-btn ${isFollowing ? "following" : ""}`}
                                            onClick={handleFollow}
                                        >
                                            {isFollowing ? "✓ Following" : "+ Follow"}
                                        </button>
                                    )}
                                    {profileData.isOwnProfile && (
                                        <Link to="/profile" className="up-edit-btn">
                                            Edit Profile
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rating Distribution */}
                    {totalRatings > 0 && (
                        <div className="up-rating-section">
                            <h3 className="up-section-title">Rating Distribution</h3>
                            <div className="up-rating-inner">
                                <div className="up-rating-avg-block">
                                    <div className="up-avg-number">{stats.avgRating}</div>
                                    <div className="up-avg-stars">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <span key={i} style={{ color: i <= Math.round(Number(stats.avgRating)) ? "#1db954" : "#333" }}>★</span>
                                        ))}
                                    </div>
                                    <div className="up-avg-label">{totalRatings} ratings</div>
                                </div>
                                <div className="up-dist-bars">
                                    {[5, 4, 3, 2, 1].map(star => (
                                        <div key={star} className="up-dist-row">
                                            <span className="up-dist-num">{star}</span>
                                            <span className="up-dist-star">★</span>
                                            <div className="up-dist-track">
                                                <div
                                                    className="up-dist-fill"
                                                    style={{ width: `${(ratingDist[star] / maxDistCount) * 100}%` }}
                                                />
                                            </div>
                                            <span className="up-dist-count">{ratingDist[star]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Favourite Albums */}
                    {favouriteAlbums.length > 0 && (
                        <div className="up-favourites-section">
                            <h3 className="up-section-title">Favourite Albums ({favouriteAlbums.length})</h3>
                            <div className="up-favourites-grid">
                                {favouriteAlbums.map((album) => (
                                    <div
                                        key={album._id}
                                        className="up-fav-card"
                                        onClick={() => navigate(`/album/${album.albumId}`)}
                                    >
                                        <div className="up-fav-cover">
                                            {album.coverImage ? (
                                                <img
                                                    src={album.coverImage}
                                                    alt={album.albumName}
                                                    className="up-fav-cover-img"
                                                />
                                            ) : (
                                                <div className="up-fav-cover-placeholder">💿</div>
                                            )}
                                        </div>
                                        <div className="up-fav-info">
                                            <div className="up-fav-name">{album.albumName}</div>
                                            <div className="up-fav-artist">{album.artistName}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reviews Section */}
                    <div className="up-reviews-section">
                        <h2 className="up-section-title">
                            Reviews ({stats.totalReviews})
                        </h2>

                        {reviews.length === 0 ? (
                            <div className="up-no-reviews">
                                <div className="up-no-reviews-icon">📝</div>
                                <h3>No Reviews Yet</h3>
                                <p>{user.username} hasn't written any reviews yet.</p>
                            </div>
                        ) : (
                            <div className="up-reviews-list">
                                {reviews.map((review) => (
                                    <div
                                        key={review._id}
                                        className="up-review-card"
                                        onClick={() => navigate(`/reviews/${review.contentType || "album"}/${review.contentId}`, { state: { reviewId: review._id } })}
                                    >
                                        {/* Album image + name header */}
                                        <div className="up-review-album-row">
                                            {review.contentImage && (
                                                <img
                                                    src={review.contentImage}
                                                    alt={review.contentName}
                                                    className="up-review-album-img"
                                                />
                                            )}
                                            <div className="up-review-album-info">
                                                <div className="up-review-album-name">{review.contentName}</div>
                                                <div className="up-review-type">{review.contentType || "album"}</div>
                                            </div>
                                            <div className="up-review-date-top">
                                                {new Date(review.createdAt).toLocaleDateString("en-US", {
                                                    year: "numeric", month: "short", day: "numeric"
                                                })}
                                            </div>
                                        </div>

                                        <div className="up-review-stars">
                                            {[...Array(5)].map((_, i) => (
                                                <span
                                                    key={i}
                                                    className={i < review.rating ? "rc-star filled" : "rc-star"}
                                                >★</span>
                                            ))}
                                            <span className="rc-star-num">{review.rating}/5</span>
                                        </div>

                                        <p className="up-review-text">
                                            {review.reviewText || "(No review text)"}
                                        </p>

                                        <div className="up-review-footer">
                                            <div className="up-review-actions">
                                                <span className="up-review-stat">❤️ {review.likes || 0}</span>
                                                <span className="up-review-stat">↩ Reply</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Shared Reviews Section */}
                    <div className="up-reviews-section">
                        <h2 className="up-section-title">
                            Shared Reviews ({sharedPosts.length})
                        </h2>
                        {sharedPosts.length === 0 ? (
                            <div className="up-no-reviews">
                                <div className="up-no-reviews-icon">📣</div>
                                <h3>No Shared Reviews Yet</h3>
                                <p>{user.username} hasn't shared any reviews to the feed yet.</p>
                            </div>
                        ) : (
                            <div className="up-reviews-list">
                                {sharedPosts.map((post) => (
                                    <div
                                        key={post._id}
                                        className="up-review-card"
                                        onClick={() => navigate(`/reviews/${post.contentType || "album"}/${post.contentId}`, { state: { reviewId: post.reviewId } })}
                                    >
                                        <div className="up-review-album-row">
                                            {post.coverUrl && (
                                                <img
                                                    src={post.coverUrl}
                                                    alt={post.contentName}
                                                    className="up-review-album-img"
                                                />
                                            )}
                                            <div className="up-review-album-info">
                                                <div className="up-review-album-name">{post.contentName}</div>
                                                <div className="up-review-type">{post.contentType || "album"}</div>
                                            </div>
                                            <div className="up-review-date-top">
                                                {new Date(post.createdAt).toLocaleDateString("en-US", {
                                                    year: "numeric", month: "short", day: "numeric"
                                                })}
                                            </div>
                                        </div>

                                        <div className="up-review-stars">
                                            {[...Array(5)].map((_, i) => (
                                                <span
                                                    key={i}
                                                    className={i < post.rating ? "rc-star filled" : "rc-star"}
                                                >★</span>
                                            ))}
                                            <span className="rc-star-num">{post.rating}/5</span>
                                        </div>

                                        <p className="up-review-text">
                                            {post.reviewText || "(No review text)"}
                                        </p>

                                        <div className="up-review-footer">
                                            <div className="up-review-actions">
                                                <span className="up-review-stat">❤️ {post.likes || 0}</span>
                                                <span className="up-review-stat">Shared to feed</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <BottomBar />
        </div>
    );
};

export default UserProfile;