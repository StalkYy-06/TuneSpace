import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/adminDashboard.css";

const AdminDashboard = () => {
    const [activeSection, setActiveSection] = useState("overview");
    const [adminInfo, setAdminInfo] = useState(null);
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [reportedUsers, setReportedUsers] = useState([]);
    const [selectedReportedUser, setSelectedReportedUser] = useState(null);
    const [bannedUsers, setBannedUsers] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkAdminAuth();
        fetchDashboardStats();
    }, []);

    useEffect(() => {
        if (activeSection === "reported-reviews") {
            fetchReportedReviews();
        } else if (activeSection === "reported-users") {
            fetchReportedUsers();
        } else if (activeSection === "banned-users") {
            fetchBannedUsers();
        }
    }, [activeSection]);

    const checkAdminAuth = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/auth/check", {
                credentials: "include"
            });
            const data = await response.json();

            if (!data.success || !data.authenticated) {
                navigate("/admin/login");
            } else {
                setAdminInfo(data.admin);
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Auth check error:", err);
            navigate("/admin/login");
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/dashboard/stats", {
                credentials: "include"
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    const fetchReportedReviews = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/dashboard/reports/reviews", {
                credentials: "include"
            });
            const data = await response.json();
            if (data.success) {
                setReports(data.reports);
            }
        } catch (err) {
            console.error("Error fetching reports:", err);
        }
    };

    const fetchReportedUsers = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/dashboard/users/reported/list", {
                credentials: "include"
            });
            const data = await response.json();
            if (data.success) {
                setReportedUsers(data.reportedUsers);
            }
        } catch (err) {
            console.error("Error fetching reported users:", err);
        }
    };

    const fetchBannedUsers = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/dashboard/users/banned/list", {
                credentials: "include"
            });
            const data = await response.json();
            if (data.success) {
                setBannedUsers(data.bannedUsers);
            }
        } catch (err) {
            console.error("Error fetching banned users:", err);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            const response = await fetch(
                `http://localhost:5000/api/admin/dashboard/users/search?query=${encodeURIComponent(searchQuery)}`,
                { credentials: "include" }
            );
            const data = await response.json();
            if (data.success) {
                setSearchResults(data.users);
            }
        } catch (err) {
            console.error("Error searching users:", err);
        }
    };

    const handleUpdateReportStatus = async (reportId, newStatus) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/admin/dashboard/reports/${reportId}/status`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ status: newStatus })
                }
            );
            const data = await response.json();
            if (data.success) {
                fetchReportedReviews();
                fetchReportedUsers();
                fetchDashboardStats();
            }
        } catch (err) {
            console.error("Error updating report status:", err);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return;

        try {
            const response = await fetch(
                `http://localhost:5000/api/admin/dashboard/reviews/${reviewId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );
            const data = await response.json();
            if (data.success) {
                alert("Review deleted successfully");
                fetchReportedReviews();
                fetchDashboardStats();
            } else {
                alert(data.message || "Failed to delete review");
            }
        } catch (err) {
            console.error("Error deleting review:", err);
            alert("Error deleting review");
        }
    };

    const handleBanUser = async (userId) => {
        const reason = prompt("Enter ban reason:");
        if (!reason) return;

        const duration = prompt("Duration: 'temporary' or 'permanent'");
        if (!duration || (duration !== "temporary" && duration !== "permanent")) {
            alert("Invalid duration");
            return;
        }

        let days = null;
        if (duration === "temporary") {
            days = parseInt(prompt("Enter number of days:"));
            if (!days || days <= 0) {
                alert("Invalid number of days");
                return;
            }
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/admin/dashboard/users/${userId}/ban`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ reason, duration, days })
                }
            );
            const data = await response.json();
            if (data.success) {
                alert("User banned successfully");
                fetchDashboardStats();
                fetchBannedUsers();
                setSelectedUser(null);
                setSelectedReportedUser(null);
                if (activeSection === "search-users") {
                    handleSearch({ preventDefault: () => { } });
                }
            } else {
                alert(data.message || "Failed to ban user");
            }
        } catch (err) {
            console.error("Error banning user:", err);
            alert("Error banning user");
        }
    };

    const handleUnbanUser = async (userId) => {
        if (!window.confirm("Are you sure you want to unban this user?")) return;

        try {
            const response = await fetch(
                `http://localhost:5000/api/admin/dashboard/users/${userId}/unban`,
                {
                    method: "POST",
                    credentials: "include"
                }
            );
            const data = await response.json();
            if (data.success) {
                alert("User unbanned successfully");
                fetchDashboardStats();
                fetchBannedUsers();
            } else {
                alert(data.message || "Failed to unban user");
            }
        } catch (err) {
            console.error("Error unbanning user:", err);
        }
    };

    const handleViewReportedUserDetails = async (username) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/admin/dashboard/users/reported/${encodeURIComponent(username)}`,
                { credentials: "include" }
            );
            const data = await response.json();
            if (data.success) {
                setSelectedReportedUser(data);
            }
        } catch (err) {
            console.error("Error fetching user details:", err);
        }
    };

    const handleViewUserDetails = async (userId) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/admin/dashboard/users/${userId}`,
                { credentials: "include" }
            );
            const data = await response.json();
            if (data.success) {
                setSelectedUser(data.user);
            }
        } catch (err) {
            console.error("Error fetching user details:", err);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch("http://localhost:5000/api/admin/auth/logout", {
                method: "POST",
                credentials: "include"
            });
            navigate("/admin/login");
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    if (isLoading) {
        return <div className="admin-loading">Loading admin dashboard...</div>;
    }

    return (
        <div className="admin-dashboard-wrapper">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <div className="admin-logo">
                        <span className="admin-logo-icon">🛡️</span>
                        <span className="admin-logo-text">Admin Panel</span>
                    </div>
                    <div className="admin-user-info">
                        <div className="admin-avatar">{adminInfo?.username?.charAt(0).toUpperCase()}</div>
                        <div className="admin-details">
                            <div className="admin-name">{adminInfo?.username}</div>
                            <div className="admin-role">{adminInfo?.role}</div>
                        </div>
                    </div>
                </div>

                <nav className="admin-nav">
                    <button
                        className={`admin-nav-item ${activeSection === "overview" ? "active" : ""}`}
                        onClick={() => setActiveSection("overview")}
                    >
                        <span className="nav-icon">📊</span>
                        <span className="nav-text">Overview</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeSection === "reported-reviews" ? "active" : ""}`}
                        onClick={() => setActiveSection("reported-reviews")}
                    >
                        <span className="nav-icon">🚩</span>
                        <span className="nav-text">Reported Reviews</span>
                        {stats?.pendingReports > 0 && (
                            <span className="nav-badge">{stats.pendingReports}</span>
                        )}
                    </button>
                    <button
                        className={`admin-nav-item ${activeSection === "reported-users" ? "active" : ""}`}
                        onClick={() => setActiveSection("reported-users")}
                    >
                        <span className="nav-icon">⚠️</span>
                        <span className="nav-text">Reported Users</span>
                        {stats?.totalReportedUsers > 0 && (
                            <span className="nav-badge">{stats.totalReportedUsers}</span>
                        )}
                    </button>
                    <button
                        className={`admin-nav-item ${activeSection === "banned-users" ? "active" : ""}`}
                        onClick={() => setActiveSection("banned-users")}
                    >
                        <span className="nav-icon">🚫</span>
                        <span className="nav-text">Banned Users</span>
                        {stats?.bannedUsers > 0 && (
                            <span className="nav-badge">{stats.bannedUsers}</span>
                        )}
                    </button>
                    <button
                        className={`admin-nav-item ${activeSection === "search-users" ? "active" : ""}`}
                        onClick={() => setActiveSection("search-users")}
                    >
                        <span className="nav-icon">🔍</span>
                        <span className="nav-text">Search Users</span>
                    </button>
                </nav>

                <div className="admin-sidebar-footer">
                    <button className="admin-logout-btn" onClick={handleLogout}>
                        <span className="nav-icon">🚪</span>
                        <span className="nav-text">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main-content">
                <div className="admin-content-header">
                    <h1>{getSectionTitle(activeSection)}</h1>
                </div>

                <div className="admin-content-body">
                    {activeSection === "overview" && (
                        <OverviewSection stats={stats} />
                    )}

                    {activeSection === "reported-reviews" && (
                        <ReportedReviewsSection
                            reports={reports}
                            onUpdateStatus={handleUpdateReportStatus}
                            onDeleteReview={handleDeleteReview}
                        />
                    )}

                    {activeSection === "reported-users" && (
                        <ReportedUsersSection
                            reportedUsers={reportedUsers}
                            selectedUser={selectedReportedUser}
                            onViewDetails={handleViewReportedUserDetails}
                            onBanUser={handleBanUser}
                            onUpdateReportStatus={handleUpdateReportStatus}
                            onClose={() => setSelectedReportedUser(null)}
                        />
                    )}

                    {activeSection === "banned-users" && (
                        <BannedUsersSection
                            bannedUsers={bannedUsers}
                            onUnbanUser={handleUnbanUser}
                        />
                    )}

                    {activeSection === "search-users" && (
                        <SearchUsersSection
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            searchResults={searchResults}
                            selectedUser={selectedUser}
                            onSearch={handleSearch}
                            onViewDetails={handleViewUserDetails}
                            onBanUser={handleBanUser}
                            onUnbanUser={handleUnbanUser}
                            onClose={() => setSelectedUser(null)}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

const getSectionTitle = (section) => {
    const titles = {
        "overview": "Dashboard Overview",
        "reported-reviews": "Reported Reviews",
        "reported-users": "Reported Users",
        "banned-users": "Banned Users",
        "search-users": "Search Users"
    };
    return titles[section] || "Dashboard";
};

// Overview Section Component
const OverviewSection = ({ stats }) => (
    <div className="overview-stats">
        <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
                <div className="stat-value">{stats?.totalUsers || 0}</div>
                <div className="stat-label">Total Users</div>
            </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
                <div className="stat-value">{stats?.totalReviews || 0}</div>
                <div className="stat-label">Total Reviews</div>
            </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon">🚩</div>
            <div className="stat-content">
                <div className="stat-value">{stats?.pendingReports || 0}</div>
                <div className="stat-label">Pending Reports</div>
            </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon">🚫</div>
            <div className="stat-content">
                <div className="stat-value">{stats?.bannedUsers || 0}</div>
                <div className="stat-label">Banned Users</div>
            </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
                <div className="stat-value">{stats?.totalReportedUsers || 0}</div>
                <div className="stat-label">Reported Users</div>
            </div>
        </div>
        <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
                <div className="stat-value">{stats?.totalWarnings || 0}</div>
                <div className="stat-label">Active Warnings</div>
            </div>
        </div>
    </div>
);

// ============================================
// FIXED: Reported Reviews Section Component
// ============================================
const ReportedReviewsSection = ({ reports, onUpdateStatus, onDeleteReview }) => (
    <div className="reported-reviews-container">
        {reports.length === 0 ? (
            <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>No Reported Reviews</h3>
                <p>All clear! There are no reported reviews at the moment.</p>
            </div>
        ) : (
            <div className="reports-list">
                {reports.map((report) => (
                    <div key={report._id} className="report-card">
                        <div className="report-header">
                            <div className="report-meta">
                                <span className={`report-status status-${report.status}`}>
                                    {report.status}
                                </span>
                                <span className="report-reason">{report.reason}</span>
                                <span className="report-date">
                                    {new Date(report.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="report-review-content">
                            {/* FIXED: Added null safety with ? */}
                            <div className="review-author">
                                <strong>Review by:</strong> {report.reviewContent?.username || "Unknown"}
                            </div>
                            {/* FIXED: Added null safety with ? and default value */}
                            <div className="review-rating">
                                {'★'.repeat(report.reviewContent?.rating || 0)}
                                {'☆'.repeat(5 - (report.reviewContent?.rating || 0))}
                            </div>
                            {/* FIXED: Added null safety with ? */}
                            <div className="review-text">
                                {report.reviewContent?.reviewText || "(No text provided)"}
                            </div>
                            {/* FIXED: Added null safety with ? */}
                            <div className="review-target">
                                <strong>Content:</strong> {report.reviewContent?.contentName || "Unknown"}
                            </div>
                        </div>

                        <div className="report-details">
                            <div className="report-reporter">
                                <strong>Reported by:</strong> {report.reportedUsername}
                            </div>
                            {report.comment && (
                                <div className="report-comment">
                                    <strong>Comment:</strong> {report.comment}
                                </div>
                            )}
                        </div>

                        <div className="report-actions">
                            {/* FIXED: Added "Invalid" option */}
                            <select
                                value={report.status}
                                onChange={(e) => onUpdateStatus(report._id, e.target.value)}
                                className="status-select"
                            >
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="resolved">Resolved</option>
                                <option value="dismissed">Dismissed</option>
                                <option value="invalid">Invalid</option>
                            </select>
                            <button
                                className="delete-review-btn"
                                onClick={() => onDeleteReview(report.reviewId)}
                            >
                                Delete Review
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

// Reported Users Section Component
const ReportedUsersSection = ({ reportedUsers, selectedUser, onViewDetails, onBanUser, onUpdateReportStatus, onClose }) => {
    if (selectedUser) {
        return (
            <div className="user-details-modal">
                <div className="modal-header">
                    <h2>Reports for {selectedUser.username}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-content">
                    <div className="user-stats-grid">
                        <div className="stat-item">
                            <strong>Total Reports:</strong> {selectedUser.stats.totalReports}
                        </div>
                        <div className="stat-item">
                            <strong>Pending:</strong> {selectedUser.stats.pendingReports}
                        </div>
                        <div className="stat-item">
                            <strong>Resolved:</strong> {selectedUser.stats.resolvedReports}
                        </div>
                        <div className="stat-item">
                            <strong>Total Reviews:</strong> {selectedUser.stats.totalReviews}
                        </div>
                    </div>

                    {selectedUser.user && (
                        <div className="user-info-section">
                            <p><strong>Email:</strong> {selectedUser.user.email}</p>
                            <p><strong>Joined:</strong> {new Date(selectedUser.user.createdAt).toLocaleDateString()}</p>
                            {selectedUser.user.isBanned && (
                                <div className="ban-alert">
                                    ⚠️ This user is currently banned
                                </div>
                            )}
                        </div>
                    )}

                    <div className="reports-list">
                        <h3>Reports:</h3>
                        {selectedUser.reports.map((report) => (
                            <div key={report._id} className="report-card">
                                <div className="report-meta">
                                    <span className={`report-status status-${report.status}`}>{report.status}</span>
                                    <span className="report-reason">{report.reason}</span>
                                    <span className="report-date">{new Date(report.createdAt).toLocaleDateString()}</span>
                                </div>
                                {/* FIXED: Added null safety */}
                                <div className="review-text">{report.reviewContent?.reviewText || "(No text)"}</div>
                                {report.comment && <div className="report-comment"><strong>Comment:</strong> {report.comment}</div>}
                                {/* FIXED: Added "Invalid" option */}
                                <select
                                    value={report.status}
                                    onChange={(e) => onUpdateReportStatus(report._id, e.target.value)}
                                    className="status-select"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="reviewed">Reviewed</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="dismissed">Dismissed</option>
                                    <option value="invalid">Invalid</option>
                                </select>
                            </div>
                        ))}
                    </div>

                    {selectedUser.user && !selectedUser.user.isBanned && (
                        <button className="ban-user-btn" onClick={() => onBanUser(selectedUser.user._id)}>
                            Ban User
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="reported-users-container">
            {reportedUsers.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    <h3>No Reported Users</h3>
                    <p>No users have been reported yet.</p>
                </div>
            ) : (
                <div className="reported-users-list">
                    {reportedUsers.map((user, index) => (
                        <div key={index} className="reported-user-card">
                            <div className="reported-user-header">
                                <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
                                <div className="user-info">
                                    <div className="user-name">{user.username}</div>
                                    {user.email && <div className="user-email">{user.email}</div>}
                                </div>
                                <div className="report-counts">
                                    <span className="total-reports">{user.totalReports} reports</span>
                                    {user.pendingReports > 0 && (
                                        <span className="pending-reports">{user.pendingReports} pending</span>
                                    )}
                                </div>
                            </div>
                            <div className="reported-user-actions">
                                <button className="view-details-btn" onClick={() => onViewDetails(user.username)}>
                                    View Details
                                </button>
                                {user.userExists && (
                                    <button className="ban-btn" onClick={() => onBanUser(user.userId)}>
                                        Ban User
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Banned Users Section Component
const BannedUsersSection = ({ bannedUsers, onUnbanUser }) => (
    <div className="banned-users-container">
        {bannedUsers.length === 0 ? (
            <div className="empty-state">
                <div className="empty-icon">✅</div>
                <h3>No Banned Users</h3>
                <p>No users are currently banned.</p>
            </div>
        ) : (
            <div className="banned-users-list">
                {bannedUsers.map((banned) => (
                    <div key={banned._id} className="banned-user-card">
                        <div className="banned-user-header">
                            <div className="user-avatar">{banned.username.charAt(0).toUpperCase()}</div>
                            <div className="banned-user-info">
                                <div className="banned-user-name">{banned.username}</div>
                                <div className="banned-user-email">{banned.email}</div>
                            </div>
                            <span className={`ban-type ${banned.duration}`}>
                                {banned.duration}
                            </span>
                        </div>
                        <div className="banned-user-details">
                            <div className="ban-reason">
                                <strong>Reason:</strong> {banned.reason}
                            </div>
                            <div className="ban-meta">
                                <span>Banned by: {banned.bannedByUsername}</span>
                                <span>Date: {new Date(banned.bannedAt).toLocaleDateString()}</span>
                                {banned.expiresAt && (
                                    <span>Expires: {new Date(banned.expiresAt).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                        <button className="unban-btn" onClick={() => onUnbanUser(banned.userId)}>
                            Unban User
                        </button>
                    </div>
                ))}
            </div>
        )}
    </div>
);

// ============================================
// FIXED: Search Users Section Component
// ============================================
const SearchUsersSection = ({ searchQuery, setSearchQuery, searchResults, selectedUser, onSearch, onViewDetails, onBanUser, onUnbanUser, onClose }) => {
    if (selectedUser) {
        return (
            <div className="user-details-modal">
                <div className="modal-header">
                    <h2>User Details: {selectedUser.username}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-content">
                    <div className="user-info-grid">
                        <p><strong>Email:</strong> {selectedUser.email}</p>
                        <p><strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                        <p><strong>Reviews:</strong> {selectedUser.reviewsCount}</p>
                        <p><strong>Reports:</strong> {selectedUser.reportsCount}</p>
                    </div>

                    {selectedUser.isBanned && selectedUser.bannedInfo && (
                        <div className="ban-info">
                            <h3>⚠️ User is Banned</h3>
                            <p><strong>Reason:</strong> {selectedUser.bannedInfo.reason}</p>
                            <p><strong>Banned by:</strong> {selectedUser.bannedInfo.bannedByUsername}</p>
                            <p><strong>Date:</strong> {new Date(selectedUser.bannedInfo.bannedAt).toLocaleDateString()}</p>
                            <button className="unban-btn" onClick={() => { onUnbanUser(selectedUser._id); onClose(); }}>
                                Unban User
                            </button>
                        </div>
                    )}

                    {!selectedUser.isBanned && (
                        <button className="ban-user-btn" onClick={() => { onBanUser(selectedUser._id); onClose(); }}>
                            Ban User
                        </button>
                    )}

                    <div className="user-reviews-section">
                        <h3>Recent Reviews:</h3>
                        {selectedUser.reviews && selectedUser.reviews.length > 0 ? (
                            selectedUser.reviews.map((review) => (
                                <div key={review._id} className="review-item">
                                    <div className="review-rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                                    <div className="review-content">{review.contentName}</div>
                                    <div className="review-text">{review.reviewText}</div>
                                    <div className="review-date">{new Date(review.createdAt).toLocaleDateString()}</div>
                                </div>
                            ))
                        ) : (
                            <p>No reviews yet</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="search-users-container">
            <form className="search-form" onSubmit={onSearch}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by username or email..."
                    className="search-input"
                />
                {/* FIXED: Changed class from "search-btn" to "admin-search-btn" */}
                <button type="submit" className="admin-search-btn">
                    Search
                </button>
            </form>

            {searchResults.length > 0 ? (
                <div className="search-results">
                    {searchResults.map((user) => (
                        <div key={user._id} className="user-result-card" onClick={() => onViewDetails(user._id)}>
                            <div className="user-result-avatar">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-result-info">
                                <div className="user-result-name">
                                    {user.username}
                                    {user.isBanned && <span className="banned-badge">BANNED</span>}
                                </div>
                                <div className="user-result-email">{user.email}</div>
                                <div className="user-result-meta">
                                    {user.reviewsCount} reviews • {user.reportsCount} reports • Joined: {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : searchQuery ? (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No Results Found</h3>
                    <p>Try searching with a different username or email.</p>
                </div>
            ) : (
                <div className="placeholder-section">
                    <div className="placeholder-icon">🔍</div>
                    <h2>Search Users</h2>
                    <p>Enter a username or email to search for users in the system.</p>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;