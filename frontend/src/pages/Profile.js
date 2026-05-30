import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import "../styles/profile.css";
import { API_URL } from "../config/api";

// ─── Activity helpers ────────────────────────────────────────────────
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ActivityAvatar({ username, picture, size = 36 }) {
    const [imgFailed, setImgFailed] = useState(false);

    if (picture && !imgFailed) {
        return (
            <img
                src={`${API_URL}${picture}`}
                alt={username}
                className="act-avatar-img"
                style={{ width: size, height: size }}
                onError={() => setImgFailed(true)}
            />
        );
    }
    return (
        <div className="act-avatar-letter" style={{ width: size, height: size, fontSize: size * 0.42 }}>
            {username?.charAt(0).toUpperCase()}
        </div>
    );
}

function ActivityItem({ activity, navigate }) {
    const { type, timestamp } = activity;
    const ago = timeAgo(timestamp);

    const starRow = (rating) => (
        <span className="act-stars">
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} style={{ color: i <= rating ? "#1db954" : "#333" }}>★</span>
            ))}
        </span>
    );

    if (type === "reviewed") {
        const icon = activity.contentType === "artist" ? "🎤" : "💿";
        return (
            <div
                className="act-item act-reviewed"
                onClick={() => navigate(`/reviews/${activity.contentType}/${activity.contentId}`)}
            >
                <div className="act-icon-wrap act-icon-review">{icon}</div>
                <div className="act-body">
                    <div className="act-main-line">
                        <span className="act-verb">You reviewed</span>
                        <span className="act-subject">{activity.contentName}</span>
                        {starRow(activity.rating)}
                    </div>
                    {activity.reviewText && (
                        <p className="act-excerpt">"{activity.reviewText.slice(0, 100)}{activity.reviewText.length > 100 ? "…" : ""}"</p>
                    )}
                    <span className="act-time">{ago}</span>
                </div>
                <div className="act-type-badge act-badge-review">Review</div>
            </div>
        );
    }

    if (type === "followed_user") {
        return (
            <div
                className="act-item act-followed"
                onClick={() => navigate(`/profile/${activity.targetUsername}`)}
            >
                <div className="act-icon-wrap act-icon-follow">
                    <ActivityAvatar
                        username={activity.targetUsername}
                        picture={activity.targetProfilePicture}
                        size={36}
                    />
                </div>
                <div className="act-body">
                    <div className="act-main-line">
                        <span className="act-verb">You followed</span>
                        <span className="act-subject act-user-link">@{activity.targetUsername}</span>
                    </div>
                    <span className="act-time">{ago}</span>
                </div>
                <div className="act-type-badge act-badge-follow">Following</div>
            </div>
        );
    }

    if (type === "new_follower") {
        return (
            <div
                className="act-item act-new-follower"
                onClick={() => navigate(`/profile/${activity.fromUsername}`)}
            >
                <div className="act-icon-wrap act-icon-follower">
                    <ActivityAvatar
                        username={activity.fromUsername}
                        picture={activity.fromProfilePicture}
                        size={36}
                    />
                </div>
                <div className="act-body">
                    <div className="act-main-line">
                        <span className="act-subject act-user-link">@{activity.fromUsername}</span>
                        <span className="act-verb">started following you</span>
                    </div>
                    <span className="act-time">{ago}</span>
                </div>
                <div className="act-type-badge act-badge-follower">New Follower</div>
            </div>
        );
    }

    if (type === "liked_review") {
        return (
            <div
                className="act-item act-liked"
                onClick={() => navigate(`/reviews/${activity.contentType}/${activity.contentId}`)}
            >
                <div className="act-icon-wrap act-icon-like">❤️</div>
                <div className="act-body">
                    <div className="act-main-line">
                        <span className="act-verb">You liked</span>
                        <span className="act-subject">@{activity.reviewAuthor}'s</span>
                        <span className="act-verb">review of</span>
                        <span className="act-subject">{activity.contentName}</span>
                    </div>
                    <span className="act-time">{ago}</span>
                </div>
                <div className="act-type-badge act-badge-like">Liked</div>
            </div>
        );
    }

    if (type === "favourited_album") {
        return (
            <div
                className="act-item act-favourited"
                onClick={() => navigate(`/album/${activity.albumId}`)}
            >
                <div className="act-icon-wrap act-icon-fav">
                    {activity.coverImage ? (
                        <img
                            src={activity.coverImage}
                            alt={activity.albumName}
                            className="act-album-thumb"
                        />
                    ) : (
                        "♥"
                    )}
                </div>
                <div className="act-body">
                    <div className="act-main-line">
                        <span className="act-verb">You favourited</span>
                        <span className="act-subject">{activity.albumName}</span>
                    </div>
                    <div className="act-sub-line">
                        <span className="act-verb">by</span>
                        <span className="act-subject-dim">{activity.artistName}</span>
                    </div>
                    <span className="act-time">{ago}</span>
                </div>
                <div className="act-type-badge act-badge-fav">Favourited</div>
            </div>
        );
    }

    if (type === "listened_album") {
        return (
            <div
                className="act-item act-listened"
                onClick={() => navigate(`/album/${activity.albumId}`)}
            >
                <div className="act-icon-wrap act-icon-listened">
                    {activity.coverImage ? (
                        <img
                            src={activity.coverImage}
                            alt={activity.albumName}
                            className="act-album-thumb"
                        />
                    ) : (
                        "👂"
                    )}
                </div>
                <div className="act-body">
                    <div className="act-main-line">
                        <span className="act-verb">You listened to</span>
                        <span className="act-subject">{activity.albumName}</span>
                    </div>
                    <div className="act-sub-line">
                        <span className="act-verb">by</span>
                        <span className="act-subject-dim">{activity.artistName}</span>
                    </div>
                    <span className="act-time">{ago}</span>
                </div>
                <div className="act-type-badge act-badge-listened">Listened</div>
            </div>
        );
    }

    return null;
}

// ─────────────────────────────────────────────────────────────────────
export default function Profile() {
    const [user, setUser] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [activeTab, setActiveTab] = useState("reviews");
    const [activities, setActivities] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [favouriteAlbums, setFavouriteAlbums] = useState([]);
    const [favouritesLoading, setFavouritesLoading] = useState(false);
    const [sharedPosts, setSharedPosts] = useState([]);
    const [shareLoadingMap, setShareLoadingMap] = useState({});

    const [formData, setFormData] = useState({ username: "", bio: "" });
    const [errors, setErrors] = useState({});

    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
        fetchFavouriteAlbums();
    }, []);

    const fetchFavouriteAlbums = async () => {
        setFavouritesLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/favourites/me`, { withCredentials: true });
            if (res.data.success) setFavouriteAlbums(res.data.favourites || []);
        } catch (err) {
            console.error("Failed to fetch favourite albums:", err);
        } finally {
            setFavouritesLoading(false);
        }
    };

    const handleRemoveFavourite = async (albumId) => {
        try {
            const album = favouriteAlbums.find(a => a.albumId === albumId);
            const res = await axios.post(`${API_URL}/api/favourites/toggle`, {
                albumId,
                albumName: album?.albumName || "Unknown",
                artistName: album?.artistName || "Unknown"
            }, { withCredentials: true });
            if (res.data.success && !res.data.isFavourited) {
                setFavouriteAlbums(prev => prev.filter(a => a.albumId !== albumId));
            }
        } catch (err) {
            console.error("Failed to remove favourite:", err);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/profile/me`, { withCredentials: true });
            if (res.data.success) {
                setUser(res.data.user);
                setFormData({ username: res.data.user.username, bio: res.data.user.bio || "" });

                const profileRes = await axios.get(
                    `${API_URL}/api/profile/user/${res.data.user.username}`,
                    { withCredentials: true }
                );
                if (profileRes.data.success) {
                    setReviews(profileRes.data.reviews || []);
                    setStats(profileRes.data.stats || null);
                }

                await fetchSharedReviews(res.data.user._id);
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
            if (err.response?.status === 401) navigate("/login");
        } finally {
            setLoading(false);
        }
    };

    const fetchSharedReviews = async (userId) => {
        try {
            const res = await axios.get(`${API_URL}/api/feed/user/${userId}`, { withCredentials: true });
            if (res.data.success) {
                setSharedPosts(res.data.posts || []);
            }
        } catch (err) {
            console.error("Failed to fetch shared reviews:", err);
        }
    };

    const isReviewShared = (reviewId) =>
        sharedPosts.some((post) => post.reviewId?.toString() === reviewId?.toString());

    const handleShareReview = async (review) => {
        setShareLoadingMap((prev) => ({ ...prev, [review._id]: true }));
        try {
            const res = await axios.post(`${API_URL}/api/feed/share`, {
                reviewId: review._id,
                contentType: review.contentType,
                contentId: review.contentId,
                contentName: review.contentName,
                artistName: review.artistName || "",
                coverUrl: review.contentImage || "",
                rating: review.rating,
                reviewText: review.reviewText || ""
            }, { withCredentials: true });
            if (res.data.success) {
                await fetchSharedReviews(user._id);
            } else {
                alert(res.data.message || "Failed to share review");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to share review");
        } finally {
            setShareLoadingMap((prev) => ({ ...prev, [review._id]: false }));
        }
    };

    const handleUnshareReview = async (reviewId) => {
        const post = sharedPosts.find((p) => p.reviewId?.toString() === reviewId?.toString());
        if (!post) return;
        setShareLoadingMap((prev) => ({ ...prev, [reviewId]: true }));
        try {
            const res = await axios.delete(`${API_URL}/api/feed/${post._id}`, { withCredentials: true });
            if (res.data.success) {
                await fetchSharedReviews(user._id);
            } else {
                alert(res.data.message || "Failed to unshare review");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to unshare review");
        } finally {
            setShareLoadingMap((prev) => ({ ...prev, [reviewId]: false }));
        }
    };

    const fetchActivity = async () => {
        if (activityLoading) return;
        setActivityLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/profile/activity/feed`, { withCredentials: true });
            if (res.data.success) setActivities(res.data.activities || []);
        } catch (err) {
            console.error("Failed to fetch activity:", err);
        } finally {
            setActivityLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
            navigate("/");
        } catch (err) {
            alert("Logout failed. Please try again.");
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setErrors({});
        try {
            const res = await axios.put(`${API_URL}/api/profile/update`, formData, { withCredentials: true });
            if (res.data.success) {
                setUser(res.data.user);
                setEditing(false);
                alert("Profile updated successfully!");
            }
        } catch (err) {
            const data = err.response?.data;
            if (data?.field) setErrors({ [data.field]: data.message });
            else alert(data?.message || "Update failed");
        }
    };

    const handlePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { alert("File size must be less than 5MB"); return; }
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(file.type)) { alert("Only image files are allowed (JPEG, PNG, GIF, WebP)"); return; }

        const uploadData = new FormData();
        uploadData.append("profilePicture", file);
        setUploading(true);
        try {
            const res = await axios.post(`${API_URL}/api/profile/upload-picture`, uploadData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (res.data.success) {
                setUser({ ...user, profilePicture: res.data.profilePicture });
                alert("Profile picture updated!");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePicture = async () => {
        if (!window.confirm("Are you sure you want to delete your profile picture?")) return;
        try {
            const res = await axios.delete(`${API_URL}/api/profile/delete-picture`, { withCredentials: true });
            if (res.data.success) {
                setUser({ ...user, profilePicture: null });
                alert("Profile picture deleted");
            }
        } catch (err) {
            alert(err.response?.data?.message || "Delete failed");
        }
    };

    const handleToggle2FA = async () => {
        try {
            const res = await axios.post(`${API_URL}/api/profile/toggle-2fa`, {}, { withCredentials: true });
            if (res.data.success) {
                setUser({ ...user, twoFactorEnabled: res.data.twoFactorEnabled });
                alert(res.data.message);
            }
        } catch (err) {
            alert("Failed to toggle 2FA");
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;
        try {
            const res = await axios.delete(`${API_URL}/api/reviews/${reviewId}`, { withCredentials: true });
            if (res.data.success) { fetchProfile(); alert("Review deleted successfully!"); }
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete review");
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== "DELETE") { alert("Please type DELETE to confirm"); return; }
        try {
            await axios.delete(`${API_URL}/api/profile/delete-account`, { withCredentials: true });
            alert("Account deleted successfully");
            navigate("/");
        } catch (err) {
            alert("Failed to delete account");
        }
    };

    if (loading) {
        return (
            <div className="profile-wrapper">
                <Navbar />
                <div className="profile-loading">Loading profile...</div>
                <BottomBar />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-wrapper">
                <Navbar />
                <div className="profile-error">Failed to load profile</div>
                <BottomBar />
            </div>
        );
    }

    return (
        <div className="profile-wrapper">
            <Navbar />

            <main className="profile-content">
                <div className="profile-container">
                    {/* Profile Header */}
                    <div className="profile-header">
                        <div className="profile-picture-section">
                            <div className="profile-picture-wrapper">
                                {user.profilePicture ? (
                                    <img src={`${API_URL}${user.profilePicture}`} alt={user.username} className="profile-picture" />
                                ) : (
                                    <div className="profile-picture-placeholder">{user.username.charAt(0).toUpperCase()}</div>
                                )}
                                {uploading && <div className="upload-overlay">Uploading...</div>}
                            </div>

                            <div className="picture-actions">
                                <label className="upload-btn">
                                    <input type="file" accept="image/*" onChange={handlePictureUpload} disabled={uploading} style={{ display: "none" }} />
                                    {user.profilePicture ? "Change Picture" : "Upload Picture"}
                                </label>
                                {user.profilePicture && (
                                    <button className="delete-picture-btn" onClick={handleDeletePicture}>Delete Picture</button>
                                )}
                            </div>
                        </div>

                        <div className="profile-info">
                            <h1>{user.username}</h1>
                            <p className="email">{user.email}</p>
                            <p className="member-since">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Stats Section */}
                    {stats && (
                        <div className="stats-section">
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-number">{stats.followersCount ?? 0}</div>
                                    <div className="stat-label">Followers</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-number">{stats.followingCount ?? 0}</div>
                                    <div className="stat-label">Following</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-number">{stats.totalReviews}</div>
                                    <div className="stat-label">Albums Reviewed</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-number">{stats.totalLikes}</div>
                                    <div className="stat-label">Likes Received</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-number">{stats.avgRating}</div>
                                    <div className="stat-label">Avg Rating</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-number">{favouriteAlbums.length}</div>
                                    <div className="stat-label">Favorites</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profile Details */}
                    <div className="profile-details">
                        {!editing ? (
                            <>
                                <div className="detail-section">
                                    <h3>About</h3>
                                    <p className="bio">{user.bio || "No bio yet. Click edit to add one."}</p>
                                </div>
                                <button className="edit-btn" onClick={() => setEditing(true)}>Edit Profile</button>
                            </>
                        ) : (
                            <form onSubmit={handleUpdateProfile} className="edit-form">
                                <div className="form-group">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                    {errors.username && <span className="error">{errors.username}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Bio</label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        maxLength="500"
                                        rows="4"
                                        placeholder="Tell us about yourself..."
                                    />
                                    <small>{formData.bio.length}/500 characters</small>
                                    {errors.bio && <span className="error">{errors.bio}</span>}
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="save-btn">Save Changes</button>
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={() => {
                                            setEditing(false);
                                            setFormData({ username: user.username, bio: user.bio || "" });
                                            setErrors({});
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Reviews & Activity Tabs */}
                    <div className="tabs-section">
                        <div className="profile-tabs">
                            <button
                                className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
                                onClick={() => setActiveTab("reviews")}
                            >
                                My Reviews ({reviews.length})
                            </button>
                            <button
                                className={`tab-btn ${activeTab === "activity" ? "active" : ""}`}
                                onClick={() => {
                                    setActiveTab("activity");
                                    if (activities.length === 0) fetchActivity();
                                }}
                            >
                                Activity
                            </button>
                            <button
                                className={`tab-btn ${activeTab === "shared" ? "active" : ""}`}
                                onClick={() => setActiveTab("shared")}
                            >
                                Shared Reviews ({sharedPosts.length})
                            </button>
                        </div>

                        <div className="tab-content">
                            {activeTab === "reviews" && (
                                <div className="reviews-tab">
                                    {reviews.length === 0 ? (
                                        <div className="no-content-state">
                                            <div className="no-content-icon">📝</div>
                                            <h3>No Reviews Yet</h3>
                                            <p>You haven't written any reviews yet. Start reviewing!</p>
                                        </div>
                                    ) : (
                                        <div className="reviews-list-profile">
                                            {reviews.map((review) => (
                                                <div key={review._id} className="review-item"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => navigate(`/reviews/${review.contentType || "album"}/${review.contentId}`, { state: { reviewId: review._id } })}
                                                >
                                                    <div className="review-item-header">
                                                        <div className="review-album-info" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                            {review.contentImage && (
                                                                <img src={review.contentImage} alt={review.contentName}
                                                                    style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                                                            )}
                                                            <div>
                                                                <div className="review-album-title">{review.contentName}</div>
                                                                <div style={{ fontSize: "0.78rem", color: "#888", textTransform: "capitalize" }}>{review.contentType || "album"}</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteReview(review._id); }}
                                                            className="delete-review-btn"
                                                        >
                                                            Delete
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (isReviewShared(review._id)) {
                                                                    handleUnshareReview(review._id);
                                                                } else {
                                                                    handleShareReview(review);
                                                                }
                                                            }}
                                                            className="share-review-btn"
                                                            style={{
                                                                marginLeft: 10,
                                                                background: isReviewShared(review._id) ? "#2c2c2c" : "#1db954",
                                                                border: "none",
                                                                borderRadius: 6,
                                                                padding: "6px 12px",
                                                                color: "#fff",
                                                                cursor: "pointer",
                                                                fontSize: "0.8rem"
                                                            }}
                                                            disabled={!!shareLoadingMap[review._id]}
                                                        >
                                                            {shareLoadingMap[review._id]
                                                                ? "..."
                                                                : isReviewShared(review._id)
                                                                    ? "Unshare"
                                                                    : "Share"}
                                                        </button>
                                                    </div>

                                                    <div className="review-rating">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span key={i} style={{ color: i < review.rating ? "#ffc107" : "#444" }}>★</span>
                                                        ))}
                                                        <span style={{ fontSize: "0.8rem", color: "#888", marginLeft: 8 }}>{review.rating}/5</span>
                                                    </div>

                                                    <p className="review-text">{review.reviewText || "(No review text)"}</p>

                                                    <div className="review-meta">
                                                        <span className="review-date">
                                                            {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                                        </span>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                            <span className="review-likes">❤️ {review.likes || 0}</span>
                                                            <span style={{ fontSize: "0.8rem", color: "#1db954", fontWeight: 600 }}>View replies →</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "activity" && (
                                <div className="activity-tab">
                                    {activityLoading ? (
                                        <div className="activity-loading">
                                            <div className="activity-spinner" />
                                            <span>Loading activity…</span>
                                        </div>
                                    ) : activities.length === 0 ? (
                                        <div className="no-content-state">
                                            <div className="no-content-icon">⚡</div>
                                            <h3>No Activity Yet</h3>
                                            <p>Your reviews, follows, likes, favourites and listens will show up here.</p>
                                        </div>
                                    ) : (
                                        <div className="activity-feed">
                                            {activities.map((act, idx) => (
                                                <ActivityItem
                                                    key={idx}
                                                    activity={act}
                                                    navigate={navigate}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "shared" && (
                                <div className="reviews-tab">
                                    {sharedPosts.length === 0 ? (
                                        <div className="no-content-state">
                                            <div className="no-content-icon">📣</div>
                                            <h3>No Shared Reviews Yet</h3>
                                            <p>Share one of your reviews from the My Reviews tab.</p>
                                        </div>
                                    ) : (
                                        <div className="reviews-list-profile">
                                            {sharedPosts.map((post) => (
                                                <div
                                                    key={post._id}
                                                    className="review-item"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => navigate(`/reviews/${post.contentType || "album"}/${post.contentId}`, { state: { reviewId: post.reviewId } })}
                                                >
                                                    <div className="review-item-header">
                                                        <div className="review-album-info" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                            {post.coverUrl && (
                                                                <img src={post.coverUrl} alt={post.contentName}
                                                                    style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
                                                            )}
                                                            <div>
                                                                <div className="review-album-title">{post.contentName}</div>
                                                                <div style={{ fontSize: "0.78rem", color: "#888", textTransform: "capitalize" }}>{post.contentType || "album"}</div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleUnshareReview(post.reviewId); }}
                                                            className="delete-review-btn"
                                                            disabled={!!shareLoadingMap[post.reviewId]}
                                                        >
                                                            {shareLoadingMap[post.reviewId] ? "..." : "Unshare"}
                                                        </button>
                                                    </div>

                                                    <div className="review-rating">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span key={i} style={{ color: i < post.rating ? "#ffc107" : "#444" }}>★</span>
                                                        ))}
                                                        <span style={{ fontSize: "0.8rem", color: "#888", marginLeft: 8 }}>{post.rating}/5</span>
                                                    </div>

                                                    <p className="review-text">{post.reviewText || "(No review text)"}</p>
                                                    <div className="review-meta">
                                                        <span className="review-date">
                                                            Shared {new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                                        </span>
                                                        <span className="review-likes">❤️ {post.likes || 0}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rating Distribution */}
                    {reviews.length > 0 && (() => {
                        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
                        reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[Math.round(r.rating)]++; });
                        const maxD = Math.max(...Object.values(dist), 1);
                        return (
                            <div className="rating-distribution-section">
                                <h3>Rating Distribution</h3>
                                <div className="profile-rating-inner">
                                    <div className="profile-avg-block">
                                        <div className="profile-avg-number">{stats?.avgRating || 0}</div>
                                        <div className="profile-avg-stars">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <span key={i} style={{ color: i <= Math.round(Number(stats?.avgRating || 0)) ? "#1db954" : "#333", fontSize: "1.2rem" }}>★</span>
                                            ))}
                                        </div>
                                        <div className="profile-avg-label">{reviews.length} ratings</div>
                                    </div>
                                    <div className="profile-dist-bars">
                                        {[5, 4, 3, 2, 1].map(star => (
                                            <div key={star} className="rating-bar-item">
                                                <span className="rating-star-label">{star} ★</span>
                                                <div className="rating-bar">
                                                    <div className="rating-bar-fill" style={{ width: `${(dist[star] / maxD) * 100}%` }} />
                                                </div>
                                                <span className="rating-count">{dist[star]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Favorite Albums */}
                    <div className="list-section">
                        <h3>Favorite Albums</h3>
                        {favouritesLoading ? (
                            <div className="no-content-state"><p>Loading favourites...</p></div>
                        ) : favouriteAlbums.length === 0 ? (
                            <div className="no-content-state">
                                <div className="no-content-icon">💿</div>
                                <h3>No Favourite Albums Yet</h3>
                                <p>Visit album pages and click the ♡ Fav button to add albums here.</p>
                            </div>
                        ) : (
                            <div className="albums-grid">
                                {favouriteAlbums.map((album) => (
                                    <div
                                        key={album._id}
                                        className="album-item fav-album-item"
                                        onClick={() => navigate(`/album/${album.albumId}`)}
                                    >
                                        <div className="album-cover-wrap">
                                            {album.coverImage ? (
                                                <img src={album.coverImage} alt={album.albumName} className="album-cover-img" />
                                            ) : (
                                                <div className="album-cover-placeholder">
                                                    <span className="album-cover-icon">💿</span>
                                                </div>
                                            )}
                                            <button
                                                className="album-remove-btn"
                                                onClick={(e) => { e.stopPropagation(); handleRemoveFavourite(album.albumId); }}
                                                title="Remove from favourites"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="album-info">
                                            <div className="album-title-fav">{album.albumName}</div>
                                            <div className="album-artist-fav">{album.artistName}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Security Settings */}
                    <div className="security-section">
                        <h3>Security Settings</h3>

                        <div className="security-item">
                            <div className="security-info">
                                <h4>Two-Factor Authentication</h4>
                                <p>Add an extra layer of security to your account</p>
                            </div>
                            <button
                                className={`toggle-btn ${user.twoFactorEnabled ? "active" : ""}`}
                                onClick={handleToggle2FA}
                            >
                                {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                            </button>
                        </div>

                        <div className="security-item">
                            <div className="security-info">
                                <h4>Email Verification</h4>
                                <p>Your email verification status</p>
                            </div>
                            <span className={`status-badge ${user.emailVerified ? "verified" : "unverified"}`}>
                                {user.emailVerified ? "✓ Verified" : "✗ Unverified"}
                            </span>
                        </div>

                        <div className="security-item danger-item">
                            <div className="security-info">
                                <h4>Delete Account</h4>
                                <p>Permanently delete your account and all data</p>
                            </div>
                            <button className="danger-btn" onClick={() => setShowDeleteModal(true)}>Delete Account</button>
                        </div>
                    </div>

                    {/* Logout */}
                    <div className="logout-section">
                        <button onClick={handleLogout} className="logout-button">Logout</button>
                    </div>
                </div>
            </main>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Delete Account</h2>
                        <p className="modal-warning">
                            This action cannot be undone. This will permanently delete your account,
                            all your reviews, favorites, and followers.
                        </p>
                        <p className="modal-instruction">Type <strong>DELETE</strong> to confirm:</p>
                        <input
                            type="text"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="Type DELETE"
                            className="delete-confirmation-input"
                        />
                        <div className="modal-actions">
                            <button
                                className="modal-delete-btn"
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmation !== "DELETE"}
                            >
                                Delete My Account
                            </button>
                            <button
                                className="modal-cancel-btn"
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(""); }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomBar />
        </div>
    );
}