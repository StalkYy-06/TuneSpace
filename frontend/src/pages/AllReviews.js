import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import "../styles/allReviews.css";

const API = "http://localhost:5000";

/* ─── Login Prompt Modal ─────────────────────────────────── */
const LoginPrompt = ({ message, onClose }) => (
    <div className="ar-login-overlay" onClick={onClose}>
        <div className="ar-login-modal" onClick={e => e.stopPropagation()}>
            <button className="ar-login-close" onClick={onClose}>×</button>
            <div className="ar-login-icon">🔒</div>
            <h3>Sign in required</h3>
            <p>{message}</p>
            <a href="/login" className="ar-login-btn">Go to Login</a>
            <button className="ar-login-cancel" onClick={onClose}>Maybe later</button>
        </div>
    </div>
);

/* ─── Star display (read-only, no hover) ─────────────────── */
const StarDisplay = ({ rating, size = "sm" }) => (
    <div className={`ar-stars ar-stars-${size}`} aria-label={`${rating} out of 5`}>
        {[1, 2, 3, 4, 5].map(i => (
            <span key={i} className={i <= rating ? "ar-star filled" : "ar-star"}>★</span>
        ))}
        <span className="ar-star-num">{rating}/5</span>
    </div>
);

/* ─── Horizontal Review Card (list view) ─────────────────── */
const ReviewCard = ({ review, onClick, onUsernameClick }) => {
    const [replyCount, setReplyCount] = useState(0);

    useEffect(() => {
        fetch(`${API}/api/replies/review/${review._id}/count`, { credentials: "include" })
            .then(r => r.json())
            .then(d => { if (d.success) setReplyCount(d.count); })
            .catch(() => { });
    }, [review._id]);

    return (
        <div className="ar-review-card" onClick={onClick}>
            <div className="ar-card-top">
                <div className="ar-card-user">
                    <div className="ar-avatar">{review.username?.charAt(0).toUpperCase()}</div>
                    <div>
                        <div
                            className="ar-username"
                            onClick={e => { e.stopPropagation(); onUsernameClick(review.username); }}
                        >
                            {review.username}
                        </div>
                        <StarDisplay rating={review.rating} size="sm" />
                    </div>
                </div>
                <div className="ar-card-date">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric"
                    })}
                </div>
            </div>

            {review.reviewText && (
                <p className="ar-card-text">{review.reviewText}</p>
            )}

            <div className="ar-card-footer">
                <div className="ar-card-stats">
                    <span className="ar-stat">❤️ {review.likes || 0}</span>
                    {replyCount > 0 && (
                        <span className="ar-stat">💬 {replyCount} {replyCount === 1 ? "reply" : "replies"}</span>
                    )}
                </div>
                <div className="ar-card-arrow">View thread →</div>
            </div>
        </div>
    );
};

/* ─── Reply Thread (recursive) ───────────────────────────── */
const ReplyThread = ({ reply, onReply, onLike, userId, likedReplies, depth = 0, onNeedLogin }) => {
    const handleLike = () => {
        if (!userId) { onNeedLogin("like a comment"); return; }
        onLike(reply._id);
    };
    const handleReply = () => {
        if (!userId) { onNeedLogin("reply to a comment"); return; }
        onReply(reply._id, reply.username);
    };

    return (
        <div className={`ar-reply-thread depth-${Math.min(depth, 3)}`}>
            <div className="ar-reply-card">
                <div className="ar-reply-avatar">{reply.username?.charAt(0).toUpperCase()}</div>
                <div className="ar-reply-body">
                    <div className="ar-reply-top">
                        <span className="ar-reply-username">{reply.username}</span>
                        {reply.isEdited && <span className="ar-edited">(edited)</span>}
                        <span className="ar-reply-date">
                            {new Date(reply.createdAt).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric"
                            })}
                        </span>
                    </div>
                    <p className="ar-reply-text">{reply.replyText}</p>
                    <div className="ar-reply-actions">
                        <button
                            className={`ar-reply-btn ${likedReplies.has(reply._id) ? "liked" : ""}`}
                            onClick={handleLike}
                        >
                            ❤️ {reply.likes || 0}
                        </button>
                        <button className="ar-reply-btn" onClick={handleReply}>
                            ↩ Reply
                        </button>
                    </div>
                </div>
            </div>
            {reply.replies?.length > 0 && (
                <div className="ar-nested-replies">
                    {reply.replies.map(child => (
                        <ReplyThread
                            key={child._id}
                            reply={child}
                            onReply={onReply}
                            onLike={onLike}
                            userId={userId}
                            likedReplies={likedReplies}
                            depth={depth + 1}
                            onNeedLogin={onNeedLogin}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ─── Review Detail View ─────────────────────────────────── */
const ReviewDetail = ({ review, onBack, userId, onNeedLogin, contentImage, contentName }) => {
    const navigate = useNavigate();
    const [replies, setReplies] = useState([]);
    const [replyText, setReplyText] = useState("");
    const [replyingTo, setReplyingTo] = useState(null); // { id, username }
    const [likedReplies, setLikedReplies] = useState(new Set());
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(review.likes || 0);
    const [submitting, setSubmitting] = useState(false);

    const fetchReplies = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/replies/review/${review._id}`, { credentials: "include" });
            const data = await res.json();
            if (data.success) setReplies(data.replies);
        } catch (err) { console.error(err); }
    }, [review._id]);

    useEffect(() => { fetchReplies(); }, [fetchReplies]);

    const handleLikeReview = async () => {
        if (!userId) { onNeedLogin("like a review"); return; }
        try {
            const res = await fetch(`${API}/api/reviews/${review._id}/like`, {
                method: "POST", credentials: "include"
            });
            const data = await res.json();
            if (data.success) { setIsLiked(data.isLiked); setLikesCount(data.likes); }
        } catch (err) { console.error(err); }
    };

    const handleLikeReply = async (replyId) => {
        if (!userId) { onNeedLogin("like a comment"); return; }
        try {
            const res = await fetch(`${API}/api/replies/${replyId}/like`, {
                method: "POST", credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setLikedReplies(prev => {
                    const next = new Set(prev);
                    data.isLiked ? next.add(replyId) : next.delete(replyId);
                    return next;
                });
                fetchReplies();
            }
        } catch (err) { console.error(err); }
    };

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        if (!userId) { onNeedLogin("post a comment"); return; }
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/api/replies/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    reviewId: review._id,
                    parentReplyId: replyingTo?.id || null,
                    replyText: replyText.trim()
                })
            });
            const data = await res.json();
            if (data.success) {
                setReplyText("");
                setReplyingTo(null);
                fetchReplies();
            } else if (res.status === 401) {
                onNeedLogin("post a comment");
            }
        } catch (err) { console.error(err); }
        finally { setSubmitting(false); }
    };

    const focusTextarea = () => {
        document.getElementById("ar-reply-textarea")?.focus();
    };

    return (
        <div className="ar-detail">
            <button className="ar-back-btn" onClick={onBack}>← Back to all reviews</button>

            {/* Content header: album/artist image + name */}
            {(contentImage || contentName) && (
                <div className="ar-detail-content-header">
                    {contentImage && <img src={contentImage} alt={contentName} className="ar-detail-content-img" />}
                    {contentName && <span className="ar-detail-content-name">{contentName}</span>}
                </div>
            )}

            {/* Main review card */}
            <div className="ar-main-review">
                <div className="ar-main-review-top">
                    <div className="ar-main-user">
                        <div className="ar-avatar ar-avatar-lg">{review.username?.charAt(0).toUpperCase()}</div>
                        <div>
                            <div
                                className="ar-username ar-username-lg"
                                onClick={() => navigate(`/profile/${review.username}`)}
                            >
                                {review.username}
                            </div>
                            <StarDisplay rating={review.rating} size="md" />
                        </div>
                    </div>
                    <div className="ar-main-date">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                            year: "numeric", month: "long", day: "numeric"
                        })}
                    </div>
                </div>

                {review.reviewText && (
                    <p className="ar-main-text">{review.reviewText}</p>
                )}

                <div className="ar-main-actions">
                    <button
                        className={`ar-action-btn ${isLiked ? "liked" : ""}`}
                        onClick={handleLikeReview}
                    >
                        ❤️ {likesCount}
                    </button>
                    <button
                        className="ar-action-btn"
                        onClick={() => {
                            if (!userId) { onNeedLogin("reply to a review"); return; }
                            focusTextarea();
                        }}
                    >
                        ↩ Reply
                    </button>
                </div>
            </div>

            {/* Reply form */}
            <div className="ar-reply-form-wrap">
                <h3 className="ar-section-title">
                    {replyingTo ? `Replying to @${replyingTo.username}` : "Add a comment"}
                </h3>
                {replyingTo && (
                    <div className="ar-replying-to-tag">
                        ↩ Replying to <strong>@{replyingTo.username}</strong>
                        <button className="ar-cancel-reply" onClick={() => setReplyingTo(null)}>✕ Cancel</button>
                    </div>
                )}
                <form onSubmit={handleSubmitReply} className="ar-reply-form">
                    <textarea
                        id="ar-reply-textarea"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder={userId ? "Write your comment…" : "Sign in to comment…"}
                        maxLength={500}
                        rows={3}
                        className="ar-reply-textarea"
                        onFocus={() => { if (!userId) onNeedLogin("post a comment"); }}
                    />
                    <div className="ar-reply-form-footer">
                        <span className="ar-char-count">{replyText.length}/500</span>
                        <button
                            type="submit"
                            className="ar-submit-btn"
                            disabled={!replyText.trim() || submitting}
                        >
                            {submitting ? "Posting…" : "Post Comment"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Replies */}
            <div className="ar-replies-section">
                <h3 className="ar-section-title">Comments ({replies.length})</h3>
                {replies.length === 0 ? (
                    <div className="ar-no-replies">No comments yet. Be the first!</div>
                ) : (
                    <div className="ar-replies-list">
                        {replies.map(reply => (
                            <ReplyThread
                                key={reply._id}
                                reply={reply}
                                onReply={(id, username) => setReplyingTo({ id, username })}
                                onLike={handleLikeReply}
                                userId={userId}
                                likedReplies={likedReplies}
                                onNeedLogin={onNeedLogin}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Main AllReviews Page ───────────────────────────────── */
const AllReviews = () => {
    const { contentType, contentId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [contentInfo, setContentInfo] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState("recent");
    const [userId, setUserId] = useState(null);
    const [loginPrompt, setLoginPrompt] = useState(null);

    useEffect(() => {
        fetch(`${API}/api/auth/me`, { credentials: "include" })
            .then(r => r.json())
            .then(d => { if (d.success && d.user) setUserId(d.user._id); })
            .catch(() => { });
    }, []);

    useEffect(() => { fetchReviews(); }, [contentType, contentId, sortBy]);

    // Auto-open review if navigated with reviewId state
    useEffect(() => {
        if (location.state?.reviewId && reviews.length > 0) {
            const target = reviews.find(r => r._id === location.state.reviewId);
            if (target) setSelectedReview(target);
        }
    }, [reviews, location.state]);

    const fetchReviews = async () => {
        try {
            setIsLoading(true);
            const endpoint = contentType === "album"
                ? `${API}/api/reviews/album/${contentId}`
                : `${API}/api/reviews/artist/${contentId}`;

            const res = await fetch(endpoint, { credentials: "include" });
            const data = await res.json();

            if (data.success) {
                let sorted = [...data.reviews];
                if (sortBy === "recent") sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                else if (sortBy === "rating-high") sorted.sort((a, b) => b.rating - a.rating);
                else if (sortBy === "rating-low") sorted.sort((a, b) => a.rating - b.rating);
                else if (sortBy === "likes") sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                setReviews(sorted);
                if (sorted.length > 0) {
                    setContentInfo({
                        name: sorted[0].contentName,
                        image: sorted[0].contentImage,
                        type: contentType
                    });
                }
            }
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    };

    const handleBack = () => {
        if (selectedReview) setSelectedReview(null);
        else navigate(-1);
    };

    const showLoginPrompt = (action) => {
        setLoginPrompt(`Sign in to ${action}.`);
    };

    if (isLoading) {
        return (
            <div className="ar-page">
                <Navbar />
                <div className="ar-loading"><div className="ar-spinner" /><span>Loading reviews…</span></div>
                <BottomBar />
            </div>
        );
    }

    return (
        <div className="ar-page">
            <Navbar />
            <main className="ar-main">
                {selectedReview ? (
                    <ReviewDetail
                        review={selectedReview}
                        onBack={handleBack}
                        userId={userId}
                        onNeedLogin={showLoginPrompt}
                        contentImage={contentInfo?.image}
                        contentName={contentInfo?.name}
                    />
                ) : (
                    <>
                        <div className="ar-header">
                            <button className="ar-back-btn" onClick={handleBack}>← Back</button>
                            <div className="ar-header-info">
                                {contentInfo?.image && (
                                    <img src={contentInfo.image} alt={contentInfo.name} className="ar-header-img" />
                                )}
                                <div>
                                    <h1 className="ar-title">Reviews</h1>
                                    {contentInfo?.name && <p className="ar-content-name">{contentInfo.name}</p>}
                                    <p className="ar-count">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="ar-sort-bar">
                            <span className="ar-sort-label">Sort by</span>
                            <div className="ar-sort-pills">
                                {[
                                    { v: "recent", l: "Recent" },
                                    { v: "rating-high", l: "Highest Rated" },
                                    { v: "rating-low", l: "Lowest Rated" },
                                    { v: "likes", l: "Most Liked" },
                                ].map(o => (
                                    <button
                                        key={o.v}
                                        className={`ar-sort-pill ${sortBy === o.v ? "active" : ""}`}
                                        onClick={() => setSortBy(o.v)}
                                    >
                                        {o.l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {reviews.length === 0 ? (
                            <div className="ar-empty">
                                <div className="ar-empty-icon">📝</div>
                                <h3>No Reviews Yet</h3>
                                <p>Be the first to review this {contentType}!</p>
                            </div>
                        ) : (
                            <div className="ar-reviews-list">
                                {reviews.map(review => (
                                    <ReviewCard
                                        key={review._id}
                                        review={review}
                                        onClick={() => setSelectedReview(review)}
                                        onUsernameClick={un => navigate(`/profile/${un}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {loginPrompt && (
                <LoginPrompt message={loginPrompt} onClose={() => setLoginPrompt(null)} />
            )}

            <BottomBar />
        </div>
    );
};

export default AllReviews;