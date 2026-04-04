import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import ReviewModal from "../components/ReviewModal";
import "../styles/artistDetail.css";

const API = "http://localhost:5000";

export default function ArtistDetail() {
    // id = encoded artist name e.g. "radiohead"
    const { id } = useParams();
    const navigate = useNavigate();

    const [artist, setArtist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [userReview, setUserReview] = useState(null);
    const [userId, setUserId] = useState(null);
    const [likedReviews, setLikedReviews] = useState({});
    const [replyCounts, setReplyCounts] = useState({});
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        checkAuth();
        fetchArtist();
        fetchReviews();
    }, [id]);

    const fetchArtist = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API}/api/music/artist/${id}`);
            const data = await res.json();
            if (data.success) setArtist(data.artist);
            else setError("Artist not found.");
        } catch { setError("Failed to load artist."); }
        finally { setLoading(false); }
    };

    const checkAuth = async () => {
        try {
            const res = await fetch(`${API}/api/auth/me`, { credentials: "include" });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.user) setUserId(data.user._id);
            }
        } catch { /* not logged in */ }
    };

    const fetchReviews = async () => {
        try {
            const res = await fetch(`${API}/api/reviews/artist/${id}`);
            const data = await res.json();
            if (data.success) { setReviews(data.reviews); setAverageRating(data.averageRating); }
            try {
                const ur = await fetch(`${API}/api/reviews/artist/${id}/user`, { credentials: "include" });
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

    const handleReviewSubmit = async (newReview) => {
        setUserReview(newReview);
        await fetchReviews();
    };

    const handleLikeReview = async (reviewId) => {
        try {
            const res = await fetch(`${API}/api/reviews/${reviewId}/like`, { method: "POST", credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, likes: data.likes } : r));
                setLikedReviews(prev => ({ ...prev, [reviewId]: data.isLiked }));
            }
        } catch { /* ignore */ }
    };

    const fmtNumber = (n) =>
        n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
            n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n || 0);

    const stripHtml = (str) =>
        str ? str.replace(/<a[^>]*>.*?<\/a>/gi, "").replace(/<[^>]+>/g, "").split(".").slice(0, 4).join(".") + "." : "";

    if (loading) return (
        <div className="artist-detail-wrapper"><Navbar />
            <div className="artist-detail">
                <div className="artist-header">
                    <div className="ad-skeleton ad-skeleton-cover" style={{ borderRadius: "50%", width: 280, height: 280, flexShrink: 0 }} />
                    <div className="ad-skeleton-info" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                        <div className="ad-skeleton ad-skeleton-title" />
                        <div className="ad-skeleton ad-skeleton-sub" />
                        <div className="ad-skeleton ad-skeleton-sub" style={{ width: "40%" }} />
                    </div>
                </div>
            </div>
            <BottomBar />
        </div>
    );

    if (error || !artist) return (
        <div className="artist-detail-wrapper"><Navbar />
            <div className="artist-error">
                <div style={{ fontSize: "3rem", marginBottom: 16 }}>😕</div>
                <h2>{error || "Artist not found"}</h2>
                <button className="btn-write-review" onClick={() => navigate(-1)}>← Go Back</button>
            </div>
            <BottomBar />
        </div>
    );

    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) dist[Math.round(r.rating)]++; });
    const maxD = reviews.length;

    return (
        <div className="artist-detail-wrapper">
            <Navbar />
            <div className="artist-detail">

                {/* ── Header ── */}
                <div className="artist-header">
                    <div className="artist-image-large">
                        {artist.image_url
                            ? <img src={artist.image_url} alt={artist.name} />
                            : <div className="artist-image-placeholder">{artist.name?.charAt(0).toUpperCase()}</div>
                        }
                    </div>
                    <div className="artist-info">
                        <div className="artist-type">Artist</div>
                        <h1>{artist.name}</h1>

                        <div className="artist-stats">
                            {artist.lastfm_listeners > 0 && (
                                <div className="stat">
                                    <div className="stat-value">{fmtNumber(artist.lastfm_listeners)}</div>
                                    <div className="stat-label">Listeners</div>
                                </div>
                            )}
                            {artist.lastfm_playcount > 0 && (
                                <div className="stat">
                                    <div className="stat-value">{fmtNumber(artist.lastfm_playcount)}</div>
                                    <div className="stat-label">Plays</div>
                                </div>
                            )}
                        </div>

                        {artist.lastfm_tags?.length > 0 && (
                            <div className="artist-genres">
                                {artist.lastfm_tags.slice(0, 5).map(tag => (
                                    <span key={tag} className="genre-tag">{tag}</span>
                                ))}
                            </div>
                        )}

                        {artist.lastfm_bio && (
                            <p className="artist-bio">{stripHtml(artist.lastfm_bio)}</p>
                        )}

                        {artist.lastfm_url && (
                            <a href={artist.lastfm_url} target="_blank" rel="noopener noreferrer"
                                className="btn-write-review"
                                style={{ fontSize: "0.85rem", padding: "8px 18px", textDecoration: "none", display: "inline-block", marginTop: 12 }}>
                                View on Last.fm →
                            </a>
                        )}
                    </div>
                </div>

                {/* ── Reviews ── */}
                <div className="artist-section">
                    {reviews.length > 0 && (
                        <div className="artist-rating-stats">
                            <div className="artist-rating-block">
                                <div className="artist-rating-number">{Number(averageRating).toFixed(1)}</div>
                                <div className="artist-rating-stars-row">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <span key={i} style={{ color: i <= Math.round(averageRating) ? "#1db954" : "#333", fontSize: "1.3rem" }}>★</span>
                                    ))}
                                </div>
                                <div className="artist-rating-count">{reviews.length} reviews</div>
                            </div>
                            <div className="artist-dist-bars">
                                {[5, 4, 3, 2, 1].map(star => (
                                    <div key={star} className="dist-row">
                                        <span className="dist-label">{star}</span>
                                        <span className="dist-star">★</span>
                                        <div className="dist-bar-track">
                                            <div className="dist-bar-fill" style={{ width: `${maxD ? (dist[star] / maxD) * 100 : 0}%` }} />
                                        </div>
                                        <span className="dist-count">{dist[star]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="artist-reviews-header">
                        <h2>Reviews & Ratings</h2>
                        <div className="artist-reviews-header-actions">
                            <button className="btn-write-review" onClick={() => setIsReviewModalOpen(true)}>✎ Write a Review</button>
                            {reviews.length > 0 && (
                                <Link to={`/reviews/artist/${id}`} className="view-all-btn-artist">View All →</Link>
                            )}
                        </div>
                    </div>

                    <div className="reviews-container">
                        {reviews.length === 0 ? (
                            <p className="no-reviews">No reviews yet. Be the first to review this artist!</p>
                        ) : (
                            reviews.slice(0, 5).map(review => (
                                <div key={review._id} className="review-card"
                                    onClick={() => navigate(`/reviews/artist/${id}`, { state: { reviewId: review._id } })}
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
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {reviews.length > 5 && (
                        <div className="more-reviews-notice">
                            <Link to={`/reviews/artist/${id}`} className="see-more-btn">See all {reviews.length} reviews →</Link>
                        </div>
                    )}
                </div>

                <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)}
                    contentType="artist" contentId={id}
                    contentName={artist?.name} contentImage={artist?.image_url}
                    onReviewSubmit={handleReviewSubmit} existingReview={userReview} />

                {/* ── Top Albums ── */}
                {artist.top_albums?.length > 0 && (
                    <div className="artist-section">
                        <h2>Albums</h2>
                        <div className="albums-grid">
                            {artist.top_albums.map((album, i) => (
                                <div key={i} className="album-card"
                                    onClick={() => navigate(`/album/${encodeURIComponent(album.lastfm_key)}`)}>
                                    <div className="album-cover">
                                        {album.cover_url
                                            ? <img src={album.cover_url} alt={album.title} />
                                            : <div style={{ position: "absolute", inset: 0, background: "#282828", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>💿</div>
                                        }
                                    </div>
                                    <div className="album-info-card">
                                        <h3>{album.title}</h3>
                                        {album.playcount > 0 && (
                                            <p style={{ color: "#1db954", fontSize: "0.8rem" }}>
                                                🔥 {fmtNumber(album.playcount)} plays
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Similar Artists ── */}
                {artist.similar_artists?.length > 0 && (
                    <div className="artist-section">
                        <h2>Fans Also Like</h2>
                        <div className="related-artists-grid">
                            {artist.similar_artists.map((sim, i) => (
                                <div key={i} className="related-artist-card"
                                    onClick={() => { navigate(`/artist/${encodeURIComponent(sim.lastfm_key)}`); window.scrollTo(0, 0); }}>
                                    <div className="related-artist-image">
                                        {sim.image_url
                                            ? <img src={sim.image_url} alt={sim.name} />
                                            : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#1db954,#1ed760)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", color: "#fff", fontWeight: 900 }}>
                                                {sim.name?.charAt(0).toUpperCase()}
                                            </div>
                                        }
                                    </div>
                                    <div className="related-artist-info">
                                        <h3>{sim.name}</h3>
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