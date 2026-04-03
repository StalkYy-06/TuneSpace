import React, { useState } from "react";
import "../styles/moderationModal.css";

const ModerationModal = ({ isOpen, onClose, report, onAction }) => {
    const [selectedAction, setSelectedAction] = useState("");
    const [warningType, setWarningType] = useState("moderate");
    const [banDuration, setBanDuration] = useState("permanent");
    const [banDays, setBanDays] = useState(7);
    const [adminNotes, setAdminNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!selectedAction) {
            alert("Please select an action");
            return;
        }

        setIsSubmitting(true);

        const actionData = {
            action: selectedAction,
            adminNotes
        };

        if (selectedAction === "warn") {
            actionData.warningType = warningType;
        } else if (selectedAction === "ban_user") {
            actionData.banDuration = banDuration;
            if (banDuration === "temporary") {
                actionData.banDays = parseInt(banDays);
            }
        }

        await onAction(report._id, actionData);
        setIsSubmitting(false);
        handleClose();
    };

    const handleClose = () => {
        setSelectedAction("");
        setWarningType("moderate");
        setBanDuration("permanent");
        setBanDays(7);
        setAdminNotes("");
        onClose();
    };

    if (!isOpen || !report) return null;

    return (
        <div className="moderation-modal-overlay" onClick={handleClose}>
            <div className="moderation-modal" onClick={(e) => e.stopPropagation()}>
                <div className="moderation-modal-header">
                    <h2>Take Action on Report</h2>
                    <button className="close-btn" onClick={handleClose}>×</button>
                </div>

                <div className="moderation-modal-content">
                    {/* Report Summary */}
                    <div className="report-summary">
                        <h3>Report Details</h3>
                        <div className="summary-row">
                            <strong>Reported User:</strong> {report.reviewContent.username}
                        </div>
                        <div className="summary-row">
                            <strong>Reason:</strong> {report.reason}
                        </div>
                        <div className="summary-row">
                            <strong>Review:</strong> {report.reviewContent.reviewText || "(No text)"}
                        </div>
                        <div className="summary-row">
                            <strong>Content:</strong> {report.reviewContent.contentName}
                        </div>
                    </div>

                    {/* Action Selection */}
                    <div className="action-selection">
                        <h3>Select Action</h3>
                        <div className="action-options">
                            <div
                                className={`action-option ${selectedAction === "warn" ? "selected" : ""}`}
                                onClick={() => setSelectedAction("warn")}
                            >
                                <div className="action-icon">⚠️</div>
                                <div className="action-label">Warn User</div>
                                <div className="action-desc">Issue a warning without deleting content</div>
                            </div>

                            <div
                                className={`action-option ${selectedAction === "delete_review" ? "selected" : ""}`}
                                onClick={() => setSelectedAction("delete_review")}
                            >
                                <div className="action-icon">🗑️</div>
                                <div className="action-label">Delete Review</div>
                                <div className="action-desc">Remove the review from the platform</div>
                            </div>

                            <div
                                className={`action-option ${selectedAction === "ban_user" ? "selected" : ""}`}
                                onClick={() => setSelectedAction("ban_user")}
                            >
                                <div className="action-icon">🚫</div>
                                <div className="action-label">Ban User</div>
                                <div className="action-desc">Ban the user from the platform</div>
                            </div>

                            <div
                                className={`action-option ${selectedAction === "dismiss" ? "selected" : ""}`}
                                onClick={() => setSelectedAction("dismiss")}
                            >
                                <div className="action-icon">✓</div>
                                <div className="action-label">Dismiss</div>
                                <div className="action-desc">No violation found, keep review</div>
                            </div>

                            <div
                                className={`action-option ${selectedAction === "invalid" ? "selected" : ""}`}
                                onClick={() => setSelectedAction("invalid")}
                            >
                                <div className="action-icon">❌</div>
                                <div className="action-label">Invalid Report</div>
                                <div className="action-desc">Report is false or malicious</div>
                            </div>
                        </div>
                    </div>

                    {/* Action-specific options */}
                    {selectedAction === "warn" && (
                        <div className="action-details">
                            <h4>Warning Type</h4>
                            <select
                                value={warningType}
                                onChange={(e) => setWarningType(e.target.value)}
                                className="detail-select"
                            >
                                <option value="minor">Minor - First offense</option>
                                <option value="moderate">Moderate - Repeated behavior</option>
                                <option value="severe">Severe - Serious violation</option>
                            </select>
                            <p className="detail-note">
                                Note: 3 severe warnings or 5 total warnings will result in automatic ban
                            </p>
                        </div>
                    )}

                    {selectedAction === "ban_user" && (
                        <div className="action-details">
                            <h4>Ban Duration</h4>
                            <select
                                value={banDuration}
                                onChange={(e) => setBanDuration(e.target.value)}
                                className="detail-select"
                            >
                                <option value="permanent">Permanent</option>
                                <option value="temporary">Temporary</option>
                            </select>

                            {banDuration === "temporary" && (
                                <div className="ban-days-input">
                                    <label>Number of Days:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="365"
                                        value={banDays}
                                        onChange={(e) => setBanDays(e.target.value)}
                                        className="days-input"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Admin Notes */}
                    <div className="admin-notes-section">
                        <h4>Admin Notes {selectedAction === "ban_user" ? "(Required)" : "(Optional)"}</h4>
                        <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add notes about this decision..."
                            className="admin-notes-textarea"
                            rows="4"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="modal-actions">
                        <button
                            className="btn-cancel"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedAction}
                        >
                            {isSubmitting ? "Processing..." : "Confirm Action"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModerationModal;