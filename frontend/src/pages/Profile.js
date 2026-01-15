import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import "../styles/profile.css";

const API_URL = "http://localhost:5000";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");

    const [formData, setFormData] = useState({
        username: "",
        bio: ""
    });
    const [errors, setErrors] = useState({});

    const navigate = useNavigate();

    // Placeholder stats data
    const stats = {
        followers: 1234,
        following: 567,
        albumsReviewed: 89,
        favoriteAlbums: 45,
        reviewRatings: {
            fiveStar: 30,
            fourStar: 25,
            threeStar: 20,
            twoStar: 10,
            oneStar: 4
        }
    };

    // Placeholder lists
    const favoriteLists = {
        albums: [
            { id: 1, title: "Album Name 1", artist: "Artist Name", cover: null },
            { id: 2, title: "Album Name 2", artist: "Artist Name", cover: null },
            { id: 3, title: "Album Name 3", artist: "Artist Name", cover: null },
            { id: 4, title: "Album Name 4", artist: "Artist Name", cover: null },
        ],
        reviewedAlbums: [
            { id: 1, title: "Reviewed Album 1", artist: "Artist", rating: 5 },
            { id: 2, title: "Reviewed Album 2", artist: "Artist", rating: 4 },
            { id: 3, title: "Reviewed Album 3", artist: "Artist", rating: 3 },
        ]
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/profile/me`, {
                withCredentials: true
            });
            if (res.data.success) {
                setUser(res.data.user);
                setFormData({
                    username: res.data.user.username,
                    bio: res.data.user.bio || ""
                });
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err);
            if (err.response?.status === 401) {
                navigate("/login");
            }
        } finally {
            setLoading(false);
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
            const res = await axios.put(
                `${API_URL}/api/profile/update`,
                formData,
                { withCredentials: true }
            );

            if (res.data.success) {
                setUser(res.data.user);
                setEditing(false);
                alert("Profile updated successfully!");
            }
        } catch (err) {
            const data = err.response?.data;
            if (data?.field) {
                setErrors({ [data.field]: data.message });
            } else {
                alert(data?.message || "Update failed");
            }
        }
    };

    const handlePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("File size must be less than 5MB");
            return;
        }

        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            alert("Only image files are allowed (JPEG, PNG, GIF, WebP)");
            return;
        }

        const formData = new FormData();
        formData.append("profilePicture", file);

        setUploading(true);
        try {
            const res = await axios.post(
                `${API_URL}/api/profile/upload-picture`,
                formData,
                {
                    withCredentials: true,
                    headers: { "Content-Type": "multipart/form-data" }
                }
            );

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
            const res = await axios.delete(`${API_URL}/api/profile/delete-picture`, {
                withCredentials: true
            });

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
            const res = await axios.post(
                `${API_URL}/api/profile/toggle-2fa`,
                {},
                { withCredentials: true }
            );

            if (res.data.success) {
                setUser({ ...user, twoFactorEnabled: res.data.twoFactorEnabled });
                alert(res.data.message);
            }
        } catch (err) {
            alert("Failed to toggle 2FA");
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== "DELETE") {
            alert("Please type DELETE to confirm");
            return;
        }

        try {
            // TODO: Add delete account endpoint
            await axios.delete(`${API_URL}/api/profile/delete-account`, {
                withCredentials: true
            });
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
                                    <img
                                        src={`${API_URL}${user.profilePicture}`}
                                        alt={user.username}
                                        className="profile-picture"
                                    />
                                ) : (
                                    <div className="profile-picture-placeholder">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                {uploading && <div className="upload-overlay">Uploading...</div>}
                            </div>

                            <div className="picture-actions">
                                <label className="upload-btn">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePictureUpload}
                                        disabled={uploading}
                                        style={{ display: "none" }}
                                    />
                                    {user.profilePicture ? "Change Picture" : "Upload Picture"}
                                </label>

                                {user.profilePicture && (
                                    <button
                                        className="delete-picture-btn"
                                        onClick={handleDeletePicture}
                                    >
                                        Delete Picture
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="profile-info">
                            <h1>{user.username}</h1>
                            <p className="email">{user.email}</p>
                            <p className="member-since">
                                Member since {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="stats-section">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-number">{stats.followers}</div>
                                <div className="stat-label">Followers</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">{stats.following}</div>
                                <div className="stat-label">Following</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">{stats.albumsReviewed}</div>
                                <div className="stat-label">Albums Reviewed</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">{stats.favoriteAlbums}</div>
                                <div className="stat-label">Favorites</div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="profile-details">
                        {!editing ? (
                            <>
                                <div className="detail-section">
                                    <h3>About</h3>
                                    <p className="bio">
                                        {user.bio || "No bio yet. Click edit to add one."}
                                    </p>
                                </div>

                                <button
                                    className="edit-btn"
                                    onClick={() => setEditing(true)}
                                >
                                    Edit Profile
                                </button>
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
                                            setFormData({
                                                username: user.username,
                                                bio: user.bio || ""
                                            });
                                            setErrors({});
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Review Rating Distribution */}
                    <div className="rating-distribution-section">
                        <h3>Review Rating Distribution</h3>
                        <div className="rating-bars">
                            {[5, 4, 3, 2, 1].map((star) => {
                                const key = `${['one', 'two', 'three', 'four', 'five'][star - 1]}Star`;
                                const count = stats.reviewRatings[key];
                                const percentage = (count / stats.albumsReviewed) * 100;

                                return (
                                    <div key={star} className="rating-bar-item">
                                        <div className="rating-star-label">
                                            {'★'.repeat(star)}
                                        </div>
                                        <div className="rating-bar">
                                            <div
                                                className="rating-bar-fill"
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="rating-count">{count}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Favorite Albums */}
                    <div className="list-section">
                        <h3>Favorite Albums</h3>
                        <div className="albums-grid">
                            {favoriteLists.albums.map((album) => (
                                <div key={album.id} className="album-item">
                                    <div className="album-cover-placeholder"></div>
                                    <div className="album-info">
                                        <div className="album-title">{album.title}</div>
                                        <div className="album-artist">{album.artist}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reviewed Albums */}
                    <div className="list-section">
                        <h3>Recently Reviewed</h3>
                        <div className="reviews-list-profile">
                            {favoriteLists.reviewedAlbums.map((album) => (
                                <div key={album.id} className="review-item">
                                    <div className="review-album-cover"></div>
                                    <div className="review-album-info">
                                        <div className="review-album-title">{album.title}</div>
                                        <div className="review-album-artist">{album.artist}</div>
                                    </div>
                                    <div className="review-rating">
                                        {'★'.repeat(album.rating)}
                                    </div>
                                </div>
                            ))}
                        </div>
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
                            <button
                                className="danger-btn"
                                onClick={() => setShowDeleteModal(true)}
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>

                    {/* Logout */}
                    <div className="logout-section">
                        <button onClick={handleLogout} className="logout-button">
                            Logout
                        </button>
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
                        <p className="modal-instruction">
                            Type <strong>DELETE</strong> to confirm:
                        </p>
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
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmation("");
                                }}
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