import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import ReviewModal from "../components/ReviewModal";
import ReportModal from "../components/ReportModal";
import "../styles/albumDetail.css";

const API = "http://localhost:5000";

export default function AlbumDetail() {
    // id = encoded lastfm_key e.g. "frank%20ocean||blonde"
    const { id } = useParams();
    const navigate = useNavigate();

    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [userReview, setUserReview] = useState(null);
    const [userId, setUserId] = useState(null);
    const [likedReviews, setLikedReviews] = useState({});
    const [replyCounts, setReplyCounts] = useState({});

    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedReviewForReport, setSelectedReviewForReport] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const [favouritedCount, setFavouritedCount] = useState(0);
    const [hasFavourited, setHasFavourited] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        checkAuth();
        fetchAlbum();
        fetchReviews();
        fetchFavouriteCount();
    }, [id]);

    const fetchAlbum = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API}/api/music/album/${id}`);
            const data = await res.json();
            if (data.success) setAlbum(data.album);
            else setError("Album not found.");
        } catch {
            setError("Failed to load album.");
        } finally {
            setLoading(false);
        }
    };

    const checkAuth = async () => {
        try {
            const res = await fetch(`${API}/api/auth/me`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.user) {
                    setUserId(data.user._id);
                    checkFavouriteStatus();
                }
            }
        } catch { /* not logged in */ }
    };

    const fetchFavouriteCount = async () => {
        try {
            const res = await fetch(`${API}/api/favourites/count/${id}`);
            const data = await res.json();
            if (data.success) setFavouritedCount(data.count);
        } catch { /* ignore */ }
    };

    const checkFavouriteStatus = async () => {
        try {
            const res = await fetch(`${API}/api/favourites/check/${id}`, { credentials: "include" });
            const data = await res.json();
            if (data.success) setHasFavourited(data.isFavourited);
        } catch { /* ignore */ }
    };

    const fetchReviews = async () => {
        try {
            const res = await fetch(`${API}/api/reviews/album/${id}`);
            const data = await res.json();
            if (data.success) {
                setReviews(data.reviews);
                setAverageRating(data.averageRating);
                const liked = {};
                data.reviews.forEach(r => {
                    if (userId && r.likedBy?.includes(userId)) liked[r._id] = true;
                });
                setLikedReviews(liked);
            }
            try {
                const ur = await fetch(`${API}/api/reviews/album/${id}/user`, { credentials: "include" });
                const ud = await ur.json();
                if (ud.success && ud.review) setUserReview(ud.review);
            } catch { /* not logged in */ }
        } catch { /* ignore */ }
    };

    useEffect(() => {
        if (reviews.length > 0) reviews.forEach(r => fetchReplyCount(r._id));
    }, [reviews]);

    const fetchReplyCount = async (reviewId) => {
        try {
            const res = await fetch(`${API}/api/replies/review/${reviewId}/count`, { credentials: "include" });
            const data = await res.json();
            if (data.success) setReplyCounts(prev => ({ ...prev, [reviewId]: data.count }));
        } catch { /* ignore */ }
    };

    const getRatingDistribution = () => {
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[Math.round(r.rating)]++; });
        return dist;
    };

    const handleReviewSubmit = async (newReview) => {
        setUserReview(newReview);
        await fetchReviews();
    };

    const handleLikeReview = async (reviewId) => {
        if (!userId) { setShowLoginModal(true); return; }
        try {
            const res = await fetch(`${API}/api/reviews/${reviewId}/like`, { method: "POST", credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, likes: data.likes } : r));
                setLikedReviews(prev => ({ ...prev, [reviewId]: data.isLiked }));
            } else if (res.status === 401) setShowLoginModal(true);
        } catch { /* ignore */ }
    };

    const handleReportReview = (review) => {
        setSelectedReviewForReport(review);
        setIsReportModalOpen(true);
    };

    const toggleFavourite = async () => {
        if (!userId) { setShowLoginModal(true); return; }
        try {
            const res = await fetch(`${API}/api/favourites/toggle`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    albumId: id,
                    albumName: album?.title || "Unknown",
                    artistName: album?.artist || "Unknown",
                    coverImage: album?.cover_url || null,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setHasFavourited(data.isFavourited);
                setFavouritedCount(data.favouriteCount);
            } else if (res.status === 401) setShowLoginModal(true);
        } catch { /* ignore */ }
    };

    const fmtNumber = (n) =>
        n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
            n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n || 0);

    const formatDuration = (ms) => {
        if (!ms) return "";
        const t = Math.floor(ms / 1000);
        return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
    };

    const stripHtml = (str) => str ? str.replace(/<a[^>]*>.*?<\/a>/gi, "").replace(/<[^>]+>/g, "").trim() : "";

    // ── States ────────────────────────────────────────────────────
    if (loading) return (
        <div className="album-detail-wrapper"><Navbar />
            <div className="album-detail">
                <div className="ad-skeleton-header">
                    <div className="ad-skeleton ad-skeleton-cover" />
                    <div className="ad-skeleton-info">
                        <div className="ad-skeleton ad-skeleton-title" />
                        <div className="ad-skeleton ad-skeleton-sub" />
                        <div className="ad-skeleton ad-skeleton-sub" style={{ width: "40%" }} />
                    </div>
                </div>
                <div className="ad-skeleton-tracks">
                    {[...Array(8)].map((_, i) => <div key={i} className="ad-skeleton ad-skeleton-track" />)}
                </div>
            </div>
            <BottomBar />
        </div>
    );

    if (error || !album) return (
        <div className="album-detail-wrapper"><Navbar />
            <div className="album-error">
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>😕</div>
                <h2>{error || "Album not found"}</h2>
                <button className="secondary-action-btn" onClick={() => navigate(-1)}>← Go Back</button>
            </div>
            <BottomBar />
        </div>
    );

    const ratingDist = getRatingDistribution();
    const maxDistCount = Math.max(reviews.length, 1);

    // artist link key
    const artistKey = encodeURIComponent(album.artist.toLowerCase().trim());

    return (
        <div className="album-detail-wrapper">
            <Navbar />
            <div className="album-detail">

                {/* ── Header ── */}
                <div className="album-header-section">
                    <div className="album-cover-container">
                        {album.cover_url
                            ? <img src={album.cover_url} alt={album.title} className="album-cover-image" />
                            : <div className="album-cover-placeholder-box"><span>💿</span></div>
                        }
                    </div>

                    <div className="album-info-container">
                        <div className="album-type-badge">Album</div>
                        <h1 className="album-title">{album.title}</h1>

                        <div className="album-meta">
                            <span className="artist-link" onClick={() => navigate(`/artist/${artistKey}`)}>
                                {album.artist}
                            </span>
                            {album.total_tracks > 0 && (
                                <><span className="separator">•</span><span>{album.total_tracks} tracks</span></>
                            )}
                        </div>

                        {album.lastfm_tags?.length > 0 && (
                            <div className="album-tags-row">
                                {album.lastfm_tags.slice(0, 5).map(tag => (
                                    <span key={tag} className="album-tag">{tag}</span>
                                ))}
                            </div>
                        )}

                        {(album.lastfm_listeners > 0 || album.lastfm_playcount > 0 || favouritedCount > 0) && (
                            <div className="album-stats-row">
                                {album.lastfm_listeners > 0 && (
                                    <div className="stat-item">
                                        <span className="stat-icon">👥</span>
                                        <span className="stat-text">{fmtNumber(album.lastfm_listeners)} listeners</span>
                                    </div>
                                )}
                                {album.lastfm_playcount > 0 && (
                                    <div className="stat-item">
                                        <span className="stat-icon">🔥</span>
                                        <span className="stat-text">{fmtNumber(album.lastfm_playcount)} plays</span>
                                    </div>
                                )}
                                <div className="stat-item">
                                    <span className="stat-icon">❤️</span>
                                    <span className="stat-text">{favouritedCount.toLocaleString()} favourites</span>
                                </div>
                            </div>
                        )}

                        {album.lastfm_wiki && (
                            <p className="album-wiki">{stripHtml(album.lastfm_wiki).slice(0, 280)}…</p>
                        )}
                    </div>
                </div>

                {/* ── Rating stats ── */}
                {reviews.length > 0 && (
                    <div className="rating-stats-section">
                        <div className="rating-block">
                            <div className="rating-big-number">{Number(averageRating).toFixed(1)}</div>
                            <div className="rating-stars-display">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <span key={i} className="rating-star" style={{
                                        color: i <= Math.round(averageRating) ? "#1db954" : "#333",
                                        opacity: i <= averageRating ? 1 : (i - averageRating < 1 ? (averageRating % 1) : 0.2)
                                    }}>★</span>
                                ))}
                            </div>
                            <div className="rating-total-count">
                                {reviews.length} {reviews.length === 1 ? "rating" : "ratings"}
                            </div>
                        </div>
                        <div className="rating-distribution">
                            {[5, 4, 3, 2, 1].map(star => (
                                <div key={star} className="dist-row">
                                    <span className="dist-label">{star}</span>
                                    <span className="dist-star">★</span>
                                    <div className="dist-bar-track">
                                        <div className="dist-bar-fill"
                                            style={{ width: `${(ratingDist[star] / maxDistCount) * 100}%` }} />
                                    </div>
                                    <span className="dist-count">{ratingDist[star]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Interaction box ── */}
                <div className="album-interaction-box">
                    <div className="interaction-row">
                        <div className="interaction-left">
                            <div className="star-rating-interactive">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span key={star} className="star-btn" onClick={() => setIsReviewModalOpen(true)}>★</span>
                                ))}
                            </div>
                            <button className="review-btn" onClick={() => setIsReviewModalOpen(true)}>
                                {userReview ? "Edit Review" : "Review"}
                            </button>
                        </div>
                        <div className="interaction-right">
                            <div className="action-list">
                                <div className={`action-list-item ${hasFavourited ? "active" : ""}`} onClick={toggleFavourite}>
                                    <span className="action-icon">{hasFavourited ? "♥" : "♡"}</span>
                                    {hasFavourited ? "Favourited" : "Favourite"}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="secondary-actions-container">
                        <button className="secondary-action-btn" onClick={() => setIsReviewModalOpen(true)}>
                            ✎ Write a Review
                        </button>
                        {album.lastfm_url && (
                            <a href={album.lastfm_url} target="_blank" rel="noopener noreferrer"
                                className="secondary-action-btn" style={{ textDecoration: "none" }}>
                                View on Last.fm →
                            </a>
                        )}
                    </div>
                </div>

                {/* ── Tracklist ── */}
                {album.tracklist?.length > 0 && (
                    <div className="tracklist-section">
                        <h2>Tracklist</h2>
                        <div className="tracklist">
                            {album.tracklist.map((track, idx) => (
                                <div key={idx} className="track-row">
                                    <span className="track-num">{track.rank || idx + 1}</span>
                                    <div className="track-main">
                                        <span className="track-name">{track.title}</span>
                                    </div>
                                    <span className="track-duration">{formatDuration(track.duration_ms)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Reviews ── */}
                <section className="reviews-section">
                    <div className="reviews-header">
                        <h2>Reviews ({reviews.length})</h2>
                        <div className="reviews-header-right">
                            {!userReview && userId && (
                                <button className="add-review-btn" onClick={() => setIsReviewModalOpen(true)}>+ Write Review</button>
                            )}
                            {reviews.length > 0 && (
                                <Link to={`/reviews/album/${id}`} className="view-all-btn">View All →</Link>
                            )}
                        </div>
                    </div>
                    <div className="reviews-container">
                        {reviews.length === 0 ? (
                            <div className="no-reviews"><p>No reviews yet. Be the first to review!</p></div>
                        ) : (
                            reviews.slice(0, 5).map(review => (
                                <div key={review._id} className="review-card"
                                    onClick={() => navigate(`/reviews/album/${id}`, { state: { reviewId: review._id } })}
                                    style={{ cursor: "pointer" }}>
                                    <div className="review-header-section">
                                        <div className="review-avatar">{review.username?.charAt(0).toUpperCase()}</div>
                                        <div className="review-user-details">
                                            <div className="review-username"
                                                onClick={e => { e.stopPropagation(); navigate(`/profile/${review.username}`); }}>
                                                {review.username}
                                            </div>
                                            <div className="review-rating">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className={i < review.rating ? "star filled" : "star"}>★</span>
                                                ))}
                                                <span className="rating-num">{review.rating}/5</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="review-content">{review.reviewText || "(No review text)"}</div>
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
                                            <button className={`review-action-btn ${likedReviews[review._id] ? "liked" : ""}`}
                                                onClick={() => handleLikeReview(review._id)}>
                                                <span className="action-icon">❤️</span>
                                                <span className="action-count">{review.likes || 0}</span>
                                            </button>
                                            <button className="review-action-btn" onClick={() => handleReportReview(review)}>
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
                            <Link to={`/reviews/album/${id}`} className="see-more-btn">See all {reviews.length} reviews →</Link>
                        </div>
                    )}
                </section>

                <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)}
                    contentType="album" contentId={id}
                    contentName={album?.title} contentImage={album?.cover_url}
                    onReviewSubmit={handleReviewSubmit} existingReview={userReview} />

                <ReportModal isOpen={isReportModalOpen}
                    onClose={() => { setIsReportModalOpen(false); setSelectedReviewForReport(null); }}
                    review={selectedReviewForReport}
                    onReportSubmit={async () => { await fetchReviews(); setIsReportModalOpen(false); setSelectedReviewForReport(null); }} />

                {showLoginModal && (
                    <div className="ar-login-overlay" onClick={() => setShowLoginModal(false)}>
                        <div className="ar-login-modal" onClick={e => e.stopPropagation()}>
                            <button className="ar-login-close" onClick={() => setShowLoginModal(false)}>×</button>
                            <div className="ar-login-icon">🔒</div>
                            <h3>Sign in required</h3>
                            <p>You need to be logged in to do that.</p>
                            <a href="/login" className="ar-login-btn">Go to Login</a>
                            <button className="ar-login-cancel" onClick={() => setShowLoginModal(false)}>Maybe later</button>
                        </div>
                    </div>
                )}
            </div>
            <BottomBar />
        </div>
    );
}