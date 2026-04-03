import React, { useState } from "react";
import "../styles/reportModal.css";

const ReportModal = ({ isOpen, onClose, review, onReportSubmit }) => {
    const [selectedReason, setSelectedReason] = useState("");
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const reportReasons = [
        { value: "harassment", label: "Harassment", description: "Bullying or threatening behavior" },
        { value: "misinformation", label: "Spreading Misinformation", description: "False or misleading information" },
        { value: "negativity", label: "Negativity", description: "Excessive negativity or hate speech" },
        { value: "other", label: "Other", description: "Other reasons not listed above" }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedReason) {
            setError("Please select a reason for reporting");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const response = await fetch(`http://localhost:5000/api/reviews/${review._id}/report`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    reason: selectedReason,
                    comment: comment
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    if (onReportSubmit) {
                        onReportSubmit();
                    }
                    handleClose();
                }, 2000);
            } else {
                setError(data.message || "Failed to submit report");
            }
        } catch (err) {
            console.error(err);
            setError("Error submitting report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedReason("");
        setComment("");
        setError("");
        setSuccess(false);
        onClose();
    };

    if (!isOpen || !review) return null;

    return (
        <div className="report-modal-overlay" onClick={handleClose}>
            <div className="report-modal" onClick={(e) => e.stopPropagation()}>
                <div className="report-modal-header">
                    <h2>Report Review</h2>
                    <button
                        className="modal-close-btn"
                        onClick={handleClose}
                        type="button"
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                <div className="report-modal-content">
                    {success ? (
                        <div className="success-message">
                            <div className="success-icon">✓</div>
                            <h3>Report Submitted</h3>
                            <p>Thank you for helping us maintain a positive community.</p>
                        </div>
                    ) : (
                        <>
                            <div className="report-review-preview">
                                <div className="preview-header">
                                    <div className="reviewer-avatar">
                                        {review.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="reviewer-info">
                                        <div className="reviewer-name">{review.username}</div>
                                        <div className="review-rating-stars">
                                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                        </div>
                                    </div>
                                </div>
                                {review.reviewText && (
                                    <p className="preview-text">{review.reviewText}</p>
                                )}
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="report-reasons-section">
                                    <label>Select a reason for reporting:</label>
                                    <div className="reasons-list">
                                        {reportReasons.map(reason => (
                                            <div
                                                key={reason.value}
                                                className={`reason-option ${selectedReason === reason.value ? 'selected' : ''}`}
                                                onClick={() => setSelectedReason(reason.value)}
                                            >
                                                <div className="reason-radio">
                                                    <input
                                                        type="radio"
                                                        name="reason"
                                                        value={reason.value}
                                                        checked={selectedReason === reason.value}
                                                        onChange={(e) => setSelectedReason(e.target.value)}
                                                    />
                                                </div>
                                                <div className="reason-content">
                                                    <div className="reason-label">{reason.label}</div>
                                                    <div className="reason-description">{reason.description}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="report-comment-section">
                                    <label htmlFor="reportComment">
                                        Additional comments (Optional)
                                    </label>
                                    <textarea
                                        id="reportComment"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Provide more details about why you're reporting this review..."
                                        maxLength={500}
                                        rows="4"
                                    />
                                    <p className="char-count">{comment.length}/500</p>
                                </div>

                                {error && <p className="error-message">{error}</p>}

                                <div className="modal-buttons">
                                    <button
                                        type="button"
                                        className="btn-cancel-report"
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-submit-report"
                                        disabled={isSubmitting || !selectedReason}
                                    >
                                        {isSubmitting ? "Submitting..." : "Submit Report"}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportModal;