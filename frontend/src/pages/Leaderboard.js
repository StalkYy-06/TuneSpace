import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import "../styles/leaderboard.css";
import { API_URL } from "../config/api";

const PERIODS = [
    { value: "weekly", label: "This Week" },
    { value: "monthly", label: "This Month" },
    { value: "yearly", label: "This Year" },
];

const CATEGORIES = [
    {
        key: "mostLiked",
        label: "Most Liked",
        icon: "❤️",
        description: "Users whose reviews received the most likes",
        valueKey: "totalLikes",
        valueLabel: "likes",
        color: "#e74c3c",
    },
    {
        key: "mostReviews",
        label: "Most Reviews",
        icon: "📝",
        description: "Users who wrote the most reviews",
        valueKey: "reviewCount",
        valueLabel: "reviews",
        color: "#1db954",
    },
    {
        key: "mostListened",
        label: "Most Listened",
        icon: "👂",
        description: "Users who listened to the most albums",
        valueKey: "albumCount",
        valueLabel: "albums",
        color: "#f39c12",
    },
];

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

function Avatar({ username, profilePicture, size = 40 }) {
    if (profilePicture) {
        return (
            <img
                src={`${API_URL}${profilePicture}`}
                alt={username}
                className="lb-avatar-img"
                style={{ width: size, height: size }}
                onError={e => { e.target.style.display = "none"; }}
            />
        );
    }
    return (
        <div
            className="lb-avatar-letter"
            style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
            {username?.charAt(0).toUpperCase()}
        </div>
    );
}

function RankBadge({ rank }) {
    if (rank <= 3) {
        return (
            <div className="lb-rank-medal" style={{ color: MEDAL_COLORS[rank - 1] }}>
                {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
            </div>
        );
    }
    return <div className="lb-rank-num">#{rank}</div>;
}

function LeaderboardCard({ category, entries, loading }) {
    const navigate = useNavigate();
    const topValue = entries?.[0]?.[category.valueKey] || 0;

    return (
        <div className="lb-card" style={{ "--cat-color": category.color }}>
            <div className="lb-card-header">
                <div className="lb-card-icon">{category.icon}</div>
                <div>
                    <h2 className="lb-card-title">{category.label}</h2>
                    <p className="lb-card-desc">{category.description}</p>
                </div>
            </div>

            <div className="lb-card-body">
                {loading ? (
                    <div className="lb-loading-rows">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="lb-skeleton-row">
                                <div className="lb-skeleton lb-skeleton-rank" />
                                <div className="lb-skeleton lb-skeleton-avatar" />
                                <div className="lb-skeleton lb-skeleton-name" />
                                <div className="lb-skeleton lb-skeleton-value" />
                            </div>
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="lb-empty">
                        <span className="lb-empty-icon">🎵</span>
                        <p>No activity yet for this period</p>
                    </div>
                ) : (
                    <div className="lb-entries">
                        {entries.map((entry, idx) => (
                            <div
                                key={entry.username}
                                className={`lb-entry ${idx === 0 ? "lb-entry-top" : ""}`}
                                onClick={() => navigate(`/profile/${entry.username}`)}
                            >
                                <div className="lb-entry-rank">
                                    <RankBadge rank={entry.rank} />
                                </div>

                                <div className="lb-entry-user">
                                    <Avatar
                                        username={entry.username}
                                        profilePicture={entry.profilePicture}
                                        size={idx === 0 ? 48 : 38}
                                    />
                                    <span className="lb-entry-username">{entry.username}</span>
                                </div>

                                <div className="lb-entry-bar-wrap">
                                    <div
                                        className="lb-entry-bar"
                                        style={{
                                            width: `${topValue > 0 ? (entry[category.valueKey] / topValue) * 100 : 0}%`
                                        }}
                                    />
                                </div>

                                <div className="lb-entry-value">
                                    <span className="lb-value-num">{(entry[category.valueKey] ?? 0).toLocaleString()}</span>
                                    <span className="lb-value-label">{category.valueLabel}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Leaderboard() {
    const [period, setPeriod] = useState("monthly");
    const [data, setData] = useState({ mostLiked: [], mostReviews: [], mostListened: [] });
    const [periodUsed, setPeriodUsed] = useState("monthly");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLeaderboard();
    }, [period]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/leaderboard?period=${period}`);
            const json = await res.json();
            if (res.ok && json.success) {
                setData(json.leaderboards || { mostLiked: [], mostReviews: [], mostListened: [] });
                setPeriodUsed(json.periodUsed || period);
            } else {
                setError(json.message || "Failed to load leaderboard");
                setData({ mostLiked: [], mostReviews: [], mostListened: [] });
            }
        } catch (err) {
            console.error("Error fetching leaderboard:", err);
            setError("Could not connect to the server. Is the backend running?");
            setData({ mostLiked: [], mostReviews: [], mostListened: [] });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lb-wrapper">
            <Navbar />

            <main className="lb-main">
                {/* Hero */}
                <div className="lb-hero">
                    <div className="lb-hero-content">
                        <h1 className="lb-hero-title">🏆 Leaderboard</h1>
                        <p className="lb-hero-sub">
                            See who's leading the TuneSpace community
                        </p>
                        {!loading && periodUsed === "all-time" && (
                            <p className="lb-hero-sub" style={{ marginTop: 8, color: "#f39c12" }}>
                                No activity for this period. Showing all-time results.
                            </p>
                        )}
                        {error && (
                            <p className="lb-hero-sub" style={{ marginTop: 8, color: "#e74c3c" }}>
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Period Switcher */}
                    <div className="lb-period-tabs">
                        {PERIODS.map(p => (
                            <button
                                key={p.value}
                                className={`lb-period-tab ${period === p.value ? "active" : ""}`}
                                onClick={() => setPeriod(p.value)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Top 3 Podium — Most Liked */}
                {!loading && data?.mostLiked?.length >= 3 && (
                    <div className="lb-podium-section">
                        <h2 className="lb-section-label">❤️ Most Liked — Top 3</h2>
                        <div className="lb-podium">
                            <PodiumSlot entry={data.mostLiked[1]} place={2} valueKey="totalLikes" valueLabel="likes" />
                            <PodiumSlot entry={data.mostLiked[0]} place={1} valueKey="totalLikes" valueLabel="likes" />
                            <PodiumSlot entry={data.mostLiked[2]} place={3} valueKey="totalLikes" valueLabel="likes" />
                        </div>
                    </div>
                )}

                {/* Three leaderboard cards */}
                <div className="lb-cards-grid">
                    {CATEGORIES.map(cat => (
                        <LeaderboardCard
                            key={cat.key}
                            category={cat}
                            entries={data?.[cat.key] || []}
                            loading={loading}
                        />
                    ))}
                </div>
            </main>

            <BottomBar />
        </div>
    );
}

function PodiumSlot({ entry, place, valueKey, valueLabel }) {
    const navigate = useNavigate();
    const heights = { 1: 140, 2: 100, 3: 80 };
    const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
    const colors = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };

    return (
        <div
            className={`lb-podium-slot lb-podium-place-${place}`}
            onClick={() => navigate(`/profile/${entry.username}`)}
        >
            <div className="lb-podium-medal">{medals[place]}</div>
            <Avatar username={entry.username} profilePicture={entry.profilePicture} size={56} />
            <div className="lb-podium-username">{entry.username}</div>
            <div className="lb-podium-value" style={{ color: colors[place] }}>
                {(entry[valueKey] ?? 0).toLocaleString()}
                <span className="lb-podium-label"> {valueLabel}</span>
            </div>
            <div
                className="lb-podium-stand"
                style={{ height: heights[place], background: colors[place] }}
            >
                <span className="lb-podium-place-num">#{place}</span>
            </div>
        </div>
    );
}