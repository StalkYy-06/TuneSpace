import React, { useState, useEffect } from "react";
import "../styles/reviewModal.css";

const ReviewModal = ({
    isOpen,
    onClose,
    contentType,
    contentId,
    contentName,
    contentImage,
    onReviewSubmit,
    existingReview = null
}) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [username, setUsername] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (existingReview) {
            setRating(existingReview.rating);
            setReviewText(existingReview.reviewText || "");
        } else {
            setRating(0);
            setReviewText("");
        }
        setError("");

        // Check authentication by trying to fetch user data
        const checkAuthentication = async () => {
            try {
                const response = await fetch(
                    `http://localhost:5000/api/reviews/${contentType}/${contentId}/user`,
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );

                if (response.status === 401) {
                    setIsAuthenticated(false);
                    setUsername("");
                } else {
                    setIsAuthenticated(true);
                    const storedUsername = localStorage.getItem("username");
                    if (storedUsername) {
                        setUsername(storedUsername);
                    }
                }
            } catch (err) {
                console.error("Error checking authentication:", err);
                setIsAuthenticated(true);
            }
        };

        if (isOpen) {
            checkAuthentication();
        }
    }, [isOpen, existingReview, contentType, contentId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            setError("Please select a rating");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("http://localhost:5000/api/reviews/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    contentType,
                    contentId,
                    contentName,
                    rating,
                    reviewText,
                    username: username || "Anonymous"
                })
            });

            const data = await response.json();

            if (data.success) {
                if (onReviewSubmit) {
                    onReviewSubmit(data.review);
                }
                onClose();
                setRating(0);
                setReviewText("");
            } else {
                setError(data.message || "Failed to submit review");
            }
        } catch (err) {
            console.error(err);
            setError("Error submitting review. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="review-modal-overlay" onClick={onClose}>
            <div className="review-modal" onClick={(e) => e.stopPropagation()}>
                {!isAuthenticated ? (
                    // Login Prompt Section
                    <>
                        <div className="review-modal-header">
                            <h2>Write a Review</h2>
                            <button
                                className="modal-close-btn"
                                onClick={onClose}
                                type="button"
                                aria-label="Close modal"
                            >
                                ×
                            </button>
                        </div>
                        <div className="login-prompt">
                            <div className="login-icon">🔒</div>
                            <h3>Sign in to Review</h3>
                            <p>Join our community and share your thoughts! You need to be logged in to submit a review.</p>
                            <button
                                className="btn-login"
                                onClick={() => window.location.href = '/login'}
                                type="button"
                            >
                                Go to Login
                            </button>
                        </div>
                    </>
                ) : (
                    // Review Form Section
                    <>
                        <div className="review-modal-header">
                            <h2>Write a Review</h2>
                            <button
                                className="modal-close-btn"
                                onClick={onClose}
                                type="button"
                                aria-label="Close modal"
                            >
                                ×
                            </button>
                        </div>

                        <div className="review-modal-content">
                            {/* Content Header with Image */}
                            <div className="content-header">
                                {contentImage && (
                                    <img
                                        src={contentImage}
                                        alt={contentName}
                                        className="content-image"
                                    />
                                )}
                                <div className="content-info">
                                    <h3 className="content-name">{contentName}</h3>
                                    <p className="content-type">
                                        {contentType === "artist" ? "Artist" : "Album"}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Star Rating */}
                                <div className="rating-section">
                                    <label>Your Rating</label>
                                    <div className="star-rating">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`star ${star <= (hoverRating || rating) ? "active" : ""
                                                    }`}
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                aria-label={`Rate ${star} out of 5 stars`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                    <p className="rating-value">
                                        {rating > 0 ? `${rating} out of 5 stars` : "Select a rating"}
                                    </p>
                                </div>

                                {/* Review Text */}
                                <div className="review-text-section">
                                    <label htmlFor="reviewText">Your Review (Optional)</label>
                                    <textarea
                                        id="reviewText"
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        placeholder="Share your thoughts about this music... What did you love? What stood out?"
                                        maxLength={1000}
                                        rows="5"
                                    />
                                    <p className="char-count">{reviewText.length}/1000</p>
                                </div>

                                {error && <p className="error-message">{error}</p>}

                                {/* Buttons */}
                                <div className="modal-buttons">
                                    <button
                                        type="button"
                                        className="btn-cancel-review"
                                        onClick={onClose}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-submit-review"
                                        disabled={isLoading || rating === 0}
                                    >
                                        {isLoading
                                            ? "Submitting..."
                                            : existingReview
                                                ? "Update Review"
                                                : "Submit Review"
                                        }
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReviewModal;