import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import ReviewModal from "../components/ReviewModal";
import ReportModal from "../components/ReportModal";
import "../styles/albumDetail.css";


export default function AlbumDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [album, setAlbum] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [moreAlbums, setMoreAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedReviewForReport, setSelectedReviewForReport] = useState(null);
    const [averageRating, setAverageRating] = useState(0);
    const [userReview, setUserReview] = useState(null);
    const [userId, setUserId] = useState(null);
    const [likedReviews, setLikedReviews] = useState({});
    const [replyCounts, setReplyCounts] = useState({});
    const [showLoginModal, setShowLoginModal] = useState(false);

    const [albumStats, setAlbumStats] = useState({
        listenedCount: 1247,
        inListCount: 856,
        favouritedCount: 0,
    });

    const [userInteraction, setUserInteraction] = useState({
        hasListened: false,
        inListenList: false,
        hasFavourited: false,
    });

    const albumsData = {
        album1: {
            id: "album1",
            name: "Midnight Echoes",
            artists: [{ id: "artist1", name: "The Neon Waves" }],
            images: [{ url: "https://via.placeholder.com/300x300/1db954/ffffff?text=Midnight+Echoes" }],
            release_date: "2024-01-15",
            total_tracks: 12,
            album_type: "album",
            tracks: [
                { id: "t1", track_number: 1, name: "Starlight Boulevard", duration_ms: 245000, explicit: false },
                { id: "t2", track_number: 2, name: "Digital Dreams", duration_ms: 198000, explicit: false },
                { id: "t3", track_number: 3, name: "Neon Nights", duration_ms: 312000, explicit: true },
                { id: "t4", track_number: 4, name: "Electric Soul", duration_ms: 267000, explicit: false },
                { id: "t5", track_number: 5, name: "City Lights", duration_ms: 289000, explicit: false },
                { id: "t6", track_number: 6, name: "Wavelength", duration_ms: 234000, explicit: false },
                { id: "t7", track_number: 7, name: "Midnight Drive", duration_ms: 298000, explicit: false },
                { id: "t8", track_number: 8, name: "Echoes in the Dark", duration_ms: 276000, explicit: false },
                { id: "t9", track_number: 9, name: "Sunset Memories", duration_ms: 254000, explicit: false },
                { id: "t10", track_number: 10, name: "Aurora", duration_ms: 318000, explicit: false },
                { id: "t11", track_number: 11, name: "Cosmic Highway", duration_ms: 301000, explicit: false },
                { id: "t12", track_number: 12, name: "Dream Sequence", duration_ms: 345000, explicit: false }
            ],
            moreAlbums: [
                {
                    id: "album2",
                    name: "Dawn Breaks",
                    images: [{ url: "https://via.placeholder.com/300x300/e91e63/ffffff?text=Dawn+Breaks" }],
                    release_date: "2023-06-10",
                    averageRating: 4.2
                },
                {
                    id: "album3",
                    name: "Echoes of Tomorrow",
                    images: [{ url: "https://via.placeholder.com/300x300/9c27b0/ffffff?text=Echoes+Tomorrow" }],
                    release_date: "2022-11-20",
                    averageRating: 4.7
                },
                {
                    id: "album4",
                    name: "Neon Horizon",
                    images: [{ url: "https://via.placeholder.com/300x300/00bcd4/ffffff?text=Neon+Horizon" }],
                    release_date: "2023-03-15",
                    averageRating: 4.0
                },
                {
                    id: "album5",
                    name: "Synthetic Dreams",
                    images: [{ url: "https://via.placeholder.com/300x300/ff9800/ffffff?text=Synthetic+Dreams" }],
                    release_date: "2021-09-05",
                    averageRating: 4.6
                }
            ]
        }
    };

    useEffect(() => {
        checkAuth();
        fetchFavouriteCount();

        setTimeout(() => {
            const albumData = albumsData[id] || {
                id,
                name: "Unknown Album",
                artists: [{ name: "Unknown Artist" }],
                images: [{ url: "https://via.placeholder.com/300x300/607d8b/ffffff?text=?" }],
                release_date: "2024-01-01",
                total_tracks: 10,
                album_type: "album",
                tracks: [],
                moreAlbums: []
            };
            setAlbum(albumData);
            setTracks(albumData.tracks || []);
            setMoreAlbums(albumData.moreAlbums || []);
            setLoading(false);
        }, 300);

        fetchReviews();
    }, [id]);

    const checkAuth = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/auth/me", {
                credentials: "include"
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    setUserId(data.user._id);
                    checkFavouriteStatus(data.user._id);
                }
            }
        } catch (err) {
            console.error("Error checking auth:", err);
        }
    };

    const fetchFavouriteCount = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/favourites/count/${id}`);
            const data = await response.json();
            if (data.success) {
                setAlbumStats(prev => ({ ...prev, favouritedCount: data.count }));
            }
        } catch (err) {
            console.error("Error fetching favourite count:", err);
        }
    };

    const checkFavouriteStatus = async (uid) => {
        try {
            const response = await fetch(`http://localhost:5000/api/favourites/check/${id}`, {
                credentials: "include"
            });
            const data = await response.json();
            if (data.success) {
                setUserInteraction(prev => ({ ...prev, hasFavourited: data.isFavourited }));
            }
        } catch (err) {
            console.error("Error checking favourite status:", err);
        }
    };

    const fetchReviews = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/reviews/album/${id}`);
            const data = await response.json();
            if (data.success) {
                setReviews(data.reviews);
                setAverageRating(data.averageRating);

                const liked = {};
                data.reviews.forEach(review => {
                    if (userId && review.likedBy && review.likedBy.includes(userId)) {
                        liked[review._id] = true;
                    }
                });
                setLikedReviews(liked);
            }

            try {
                const userReviewResponse = await fetch(`http://localhost:5000/api/reviews/album/${id}/user`, {
                    credentials: "include"
                });
                const userData = await userReviewResponse.json();
                if (userData.success && userData.review) {
                    setUserReview(userData.review);
                }
            } catch (err) {
                // User not logged in, ignore
            }
        } catch (err) {
            console.error("Error fetching reviews:", err);
        }
    };

    const fetchReplyCount = async (reviewId) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/replies/review/${reviewId}/count`,
                { credentials: "include" }
            );
            const data = await response.json();
            if (data.success) {
                setReplyCounts(prev => ({ ...prev, [reviewId]: data.count }));
            }
        } catch (err) {
            console.error("Error fetching reply count:", err);
        }
    };

    useEffect(() => {
        if (reviews.length > 0) {
            reviews.forEach(review => {
                fetchReplyCount(review._id);
            });
        }
    }, [reviews]);

    // Compute rating distribution from real reviews
    const getRatingDistribution = () => {
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) dist[Math.round(r.rating)]++;
        });
        return dist;
    };

    const handleReviewSubmit = async (newReview) => {
        setUserReview(newReview);
        await fetchReviews();
    };

    const handleLikeReview = async (reviewId) => {
        if (!userId) {
            setShowLoginModal(true);
            return;
        }
        try {
            const response = await fetch(`http://localhost:5000/api/reviews/${reviewId}/like`, {
                method: "POST",
                credentials: "include"
            });

            const data = await response.json();

            if (data.success) {
                setReviews(prevReviews =>
                    prevReviews.map(review =>
                        review._id === reviewId
                            ? { ...review, likes: data.likes }
                            : review
                    )
                );
                setLikedReviews(prev => ({
                    ...prev,
                    [reviewId]: data.isLiked
                }));
            } else if (response.status === 401) {
                setShowLoginModal(true);
            }
        } catch (err) {
            console.error("Error liking review:", err);
        }
    };

    const handleReportReview = (review) => {
        setSelectedReviewForReport(review);
        setIsReportModalOpen(true);
    };

    const handleReportSubmit = async () => {
        await fetchReviews();
        setIsReportModalOpen(false);
        setSelectedReviewForReport(null);
    };

    const formatDuration = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    const handleArtistClick = (artistId) => {
        navigate(`/artist/${artistId}`);
    };

    const handleAlbumClick = (albumId) => {
        navigate(`/album/${albumId}`);
        window.scrollTo(0, 0);
    };

    const toggleListened = () => {
        setUserInteraction(prev => ({ ...prev, hasListened: !prev.hasListened }));
    };

    const toggleListenList = () => {
        setUserInteraction(prev => ({ ...prev, inListenList: !prev.inListenList }));
    };

    const toggleFavourite = async () => {
        if (!userId) {
            setShowLoginModal(true);
            return;
        }
        try {
            const response = await fetch("http://localhost:5000/api/favourites/toggle", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    albumId: id,
                    albumName: album?.name || "Unknown Album",
                    artistName: album?.artists?.map(a => a.name).join(", ") || "Unknown Artist",
                    coverImage: album?.images?.[0]?.url || null
                })
            });
            const data = await response.json();
            if (data.success) {
                setUserInteraction(prev => ({ ...prev, hasFavourited: data.isFavourited }));
                setAlbumStats(prev => ({ ...prev, favouritedCount: data.favouriteCount }));
            } else if (response.status === 401) {
                setShowLoginModal(true);
            }
        } catch (err) {
            console.error("Error toggling favourite:", err);
        }
    };

    const renderStars = (rating) => {
        return [1, 2, 3, 4, 5].map(i => (
            <span key={i} className={i <= rating ? "star filled" : "star"}>★</span>
        ));
    };

    if (!album) {
        return (
            <div className="album-detail-wrapper">
                <Navbar />
                <div className="album-error">Album not found</div>
                <BottomBar />
            </div>
        );
    }

    const ratingDist = getRatingDistribution();
    const maxDistCount = Math.max(...Object.values(ratingDist), 1);

    return (
        <div className="album-detail-wrapper">
            <Navbar />

            <div className="album-detail">
                <div className="album-header-section">
                    <div className="album-cover-container">
                        {album.images?.[0] && (
                            <img src={album.images[0].url} alt={album.name} className="album-cover-image" />
                        )}
                    </div>

                    <div className="album-info-container">
                        <div className="album-type-badge">{album.album_type || "Album"}</div>
                        <h1 className="album-title">{album.name}</h1>

                        <div className="album-meta">
                            {album.artists?.map((artist, index) => (
                                <React.Fragment key={artist.id || index}>
                                    <span
                                        className="artist-link"
                                        onClick={() => handleArtistClick(artist.id)}
                                    >
                                        {artist.name}
                                    </span>
                                    {index < album.artists.length - 1 && <span>, </span>}
                                </React.Fragment>
                            ))}
                            <span className="separator">•</span>
                            <span>{new Date(album.release_date).getFullYear()}</span>
                            <span className="separator">•</span>
                            <span>{album.total_tracks} tracks</span>
                        </div>

                        <div className="album-stats-row">
                            <div className="stat-item">
                                <span className="stat-icon">👂</span>
                                <span className="stat-text">{albumStats.listenedCount.toLocaleString()} listened</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-icon">📝</span>
                                <span className="stat-text">{albumStats.inListCount.toLocaleString()} lists</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-icon">❤️</span>
                                <span className="stat-text">{albumStats.favouritedCount.toLocaleString()} favourites</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Rating Stats Section */}
                {reviews.length > 0 && (
                    <div className="rating-stats-section">
                        <div className="rating-block">
                            <div className="rating-big-number">
                                {Number(averageRating).toFixed(1)}
                            </div>
                            <div className="rating-stars-display">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <span
                                        key={i}
                                        className="rating-star"
                                        style={{
                                            color: i <= Math.round(averageRating) ? "#1db954" : "#333",
                                            opacity: i <= averageRating ? 1 : (i - averageRating < 1 ? (averageRating % 1) : 0.2)
                                        }}
                                    >★</span>
                                ))}
                            </div>
                            <div className="rating-total-count">{reviews.length} {reviews.length === 1 ? "rating" : "ratings"}</div>
                        </div>

                        <div className="rating-distribution">
                            {[5, 4, 3, 2, 1].map(star => (
                                <div key={star} className="dist-row">
                                    <span className="dist-label">{star}</span>
                                    <span className="dist-star">★</span>
                                    <div className="dist-bar-track">
                                        <div
                                            className="dist-bar-fill"
                                            style={{ width: `${(ratingDist[star] / maxDistCount) * 100}%` }}
                                        />
                                    </div>
                                    <span className="dist-count">{ratingDist[star]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="album-interaction-box">
                    <div className="interaction-row">
                        <div className="interaction-left">
                            <div className="star-rating-interactive">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span key={star} className="star-btn">★</span>
                                ))}
                            </div>
                            <button className="review-btn" onClick={() => setIsReviewModalOpen(true)}>Review</button>
                        </div>
                        <div className="interaction-right">
                            <div className="action-list">
                                <div
                                    className={`action-list-item ${userInteraction.hasListened ? "active" : ""}`}
                                    onClick={toggleListened}
                                >
                                    <span className="action-icon">{userInteraction.hasListened ? "✓" : "○"}</span>
                                    {userInteraction.hasListened ? "Listened" : "Listen"}
                                </div>
                                <div
                                    className={`action-list-item ${userInteraction.inListenList ? "active" : ""}`}
                                    onClick={toggleListenList}
                                >
                                    <span className="action-icon">{userInteraction.inListenList ? "✓" : "+"}</span>
                                    Add to listen list
                                </div>
                                <div
                                    className={`action-list-item ${userInteraction.hasFavourited ? "active" : ""}`}
                                    onClick={toggleFavourite}
                                >
                                    <span className="action-icon">{userInteraction.hasFavourited ? "♥" : "♡"}</span>
                                    Fav
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="secondary-actions-container">
                        <button className="secondary-action-btn">Add to album lists</button>
                        <button className="secondary-action-btn">Listen on Spotify</button>
                        <button className="secondary-action-btn">Share</button>
                    </div>
                </div>

                {tracks.length > 0 && (
                    <div className="tracklist-section">
                        <h2>Tracklist</h2>
                        <div className="tracklist">
                            {tracks.map(track => (
                                <div key={track.id} className="track-row">
                                    <span className="track-num">{track.track_number}</span>
                                    <div className="track-main">
                                        <span className="track-name">
                                            {track.name}
                                            {track.explicit && <span className="explicit-tag">E</span>}
                                        </span>
                                    </div>
                                    <span className="track-duration">{formatDuration(track.duration_ms)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <section className="reviews-section">
                    <div className="reviews-header">
                        <h2>Reviews ({reviews.length})</h2>
                        <div className="reviews-header-right">
                            {!userReview && userId && (
                                <button className="add-review-btn" onClick={() => setIsReviewModalOpen(true)}>
                                    + Write Review
                                </button>
                            )}
                            {reviews.length > 0 && (
                                <Link
                                    to={`/reviews/album/${id}`}
                                    className="view-all-btn"
                                >
                                    View All →
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="reviews-container">
                        {reviews.length === 0 ? (
                            <div className="no-reviews">
                                <p>No reviews yet. Be the first to review!</p>
                            </div>
                        ) : (
                            reviews.slice(0, 5).map((review) => (
                                <div
                                    key={review._id}
                                    className="review-card"
                                    onClick={() => navigate(`/reviews/album/${id}`, { state: { reviewId: review._id } })}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="review-header-section">
                                        <div className="review-avatar">
                                            {review.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="review-user-details">
                                            <div
                                                className="review-username"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/profile/${review.username}`);
                                                }}
                                            >
                                                {review.username}
                                            </div>
                                            <div className="review-rating">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className={i < review.rating ? "star filled" : "star"}>
                                                        ★
                                                    </span>
                                                ))}
                                                <span className="rating-num">{review.rating}/5</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="review-content">
                                        {review.reviewText || "(No review text)"}
                                    </div>

                                    <div className="review-footer">
                                        <div className="review-meta-info">
                                            <span className="review-date">
                                                {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                            </span>
                                            {replyCounts[review._id] > 0 && (
                                                <span className="review-replies-link">
                                                    💬 {replyCounts[review._id]} {replyCounts[review._id] === 1 ? "reply" : "replies"}
                                                </span>
                                            )}
                                        </div>

                                        <div className="review-actions" onClick={e => e.stopPropagation()}>
                                            <button
                                                className={`review-action-btn ${likedReviews[review._id] ? "liked" : ""}`}
                                                onClick={() => handleLikeReview(review._id)}
                                            >
                                                <span className="action-icon">❤️</span>
                                                <span className="action-count">{review.likes || 0}</span>
                                            </button>
                                            <button
                                                className="review-action-btn"
                                                onClick={() => handleReportReview(review)}
                                            >
                                                <span className="action-icon">🚩</span>
                                                <span className="action-text">Report</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {reviews.length > 5 && (
                        <div className="more-reviews-notice">
                            <Link to={`/reviews/album/${id}`} className="see-more-btn">
                                See all {reviews.length} reviews →
                            </Link>
                        </div>
                    )}
                </section>

                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    contentType="album"
                    contentId={id}
                    contentName={album?.name}
                    contentImage={album?.images?.[0]?.url}
                    onReviewSubmit={handleReviewSubmit}
                    existingReview={userReview}
                />

                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => {
                        setIsReportModalOpen(false);
                        setSelectedReviewForReport(null);
                    }}
                    review={selectedReviewForReport}
                    onReportSubmit={handleReportSubmit}
                />

                {showLoginModal && (
                    <div
                        className="ar-login-overlay"
                        onClick={() => setShowLoginModal(false)}
                    >
                        <div
                            className="ar-login-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                className="ar-login-close"
                                onClick={() => setShowLoginModal(false)}
                            >
                                ×
                            </button>
                            <div className="ar-login-icon">🔒</div>
                            <h3>Sign in required</h3>
                            <p>You need to be logged in to favourite albums. Join the community!</p>
                            <a href="/login" className="ar-login-btn">Go to Login</a>
                            <button
                                className="ar-login-cancel"
                                onClick={() => setShowLoginModal(false)}
                            >
                                Maybe later
                            </button>
                        </div>
                    </div>
                )}


                {moreAlbums.length > 0 && (
                    <div className="more-albums-section">
                        <h2>More Albums by {album.artists?.[0]?.name}</h2>
                        <div className="more-albums-grid">
                            {moreAlbums.map(moreAlbum => (
                                <div
                                    key={moreAlbum.id}
                                    className="album-card-small"
                                    onClick={() => handleAlbumClick(moreAlbum.id)}
                                >
                                    <div className="album-card-cover">
                                        <img src={moreAlbum.images?.[0]?.url} alt={moreAlbum.name} />
                                    </div>
                                    <div className="album-card-info">
                                        <h3 className="album-card-title">{moreAlbum.name}</h3>
                                        <p className="album-card-year">
                                            {new Date(moreAlbum.release_date).getFullYear()}
                                        </p>
                                        {moreAlbum.averageRating > 0 && (
                                            <div className="album-card-rating">
                                                ★ {moreAlbum.averageRating.toFixed(1)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            <BottomBar />
        </div>
    );
}