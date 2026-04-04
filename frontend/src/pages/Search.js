import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import "../styles/search.css";

const API = "http://localhost:5000";

const TYPE_TABS = [
    { value: "all", label: "All" },
    { value: "album", label: "Albums" },
    { value: "artist", label: "Artists" },
];

export default function Search() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [type, setType] = useState(searchParams.get("type") || "all");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const q = searchParams.get("q");
        const t = searchParams.get("type") || "all";
        if (q) { setQuery(q); setType(t); doSearch(q, t); }
        inputRef.current?.focus();
    }, []);

    const doSearch = async (q, t) => {
        if (!q.trim()) return;
        setLoading(true);
        setError(null);
        setResults([]);
        try {
            const params = new URLSearchParams({ q: q.trim(), type: t });
            const res = await fetch(`${API}/api/music/search?${params}`);
            const data = await res.json();
            if (data.success) {
                setResults(data.results);
                setSearchParams({ q: q.trim(), ...(t !== "all" && { type: t }) });
            } else {
                setError("Search failed.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => { e.preventDefault(); doSearch(query, type); };

    const handleTypeChange = (t) => {
        setType(t);
        if (query.trim()) doSearch(query, t);
    };

    const handleResultClick = (result) => {
        if (result.type === "artist") {
            navigate(`/artist/${result.key}`);
        } else {
            navigate(`/album/${result.key}`);
        }
    };

    return (
        <div className="search-wrapper">
            <Navbar />
            <main className="search-main">

                {/* ── Search bar ── */}
                <div className="search-hero">
                    <h1 className="search-title">Search Music</h1>
                    <form onSubmit={handleSubmit} className="search-form">
                        <div className="search-input-wrap">
                            <span className="search-icon">🔍</span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search albums, artists…"
                                className="search-input"
                            />
                            {query && (
                                <button type="button" className="search-clear"
                                    onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}>
                                    ×
                                </button>
                            )}
                        </div>
                        <button type="submit" className="search-btn" disabled={loading || !query.trim()}>
                            {loading ? "Searching…" : "Search"}
                        </button>
                    </form>

                    <div className="search-type-tabs">
                        {TYPE_TABS.map(tab => (
                            <button key={tab.value}
                                className={`search-type-tab ${type === tab.value ? "active" : ""}`}
                                onClick={() => handleTypeChange(tab.value)}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Error ── */}
                {error && <div className="search-error">{error}</div>}

                {/* ── Loading skeletons ── */}
                {loading && (
                    <div className="search-results-grid">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="search-result-card search-skeleton-card">
                                <div className="src-thumb-wrap">
                                    <div className="src-skeleton src-skeleton-thumb" />
                                </div>
                                <div className="src-info">
                                    <div className="src-skeleton src-skeleton-title" />
                                    <div className="src-skeleton src-skeleton-sub" />
                                    <div className="src-skeleton src-skeleton-sub" style={{ width: "50%" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── No results ── */}
                {!loading && results.length === 0 && query && !error && (
                    <div className="search-empty">
                        <div className="search-empty-icon">🎵</div>
                        <h3>No results found for "{query}"</h3>
                        <p>Try different keywords or check your spelling.</p>
                    </div>
                )}

                {/* ── Results ── */}
                {!loading && results.length > 0 && (
                    <>
                        <div className="search-results-header">
                            <span className="search-result-count">{results.length} results</span>
                        </div>
                        <div className="search-results-grid">
                            {results.map((result, i) => (
                                <div key={`${result.type}-${i}`}
                                    className="search-result-card"
                                    onClick={() => handleResultClick(result)}>
                                    <div className="src-thumb-wrap">
                                        {(result.cover_url || result.thumb_url || result.image_url || result.thumb_url) ? (
                                            <>
                                                <img
                                                    src={result.cover_url || result.thumb_url || result.image_url}
                                                    alt={result.title || result.name}
                                                    className="src-thumb"
                                                    onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                                                    style={{ borderRadius: result.type === "artist" ? "50%" : 10 }}
                                                />
                                                <div className="src-thumb-placeholder" style={{ display: "none" }}>
                                                    {result.type === "artist" ? "🎤" : "💿"}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="src-thumb-placeholder"
                                                style={{ borderRadius: result.type === "artist" ? "50%" : 10 }}>
                                                {result.type === "artist" ? "🎤" : "💿"}
                                            </div>
                                        )}
                                        <div className="src-type-badge">{result.type}</div>
                                    </div>
                                    <div className="src-info">
                                        <div className="src-title">{result.title || result.name}</div>
                                        {result.type === "album" && result.artist && (
                                            <div className="src-artist">{result.artist}</div>
                                        )}
                                        {result.type === "artist" && result.listeners > 0 && (
                                            <div className="src-meta">
                                                <span>👥 {result.listeners.toLocaleString()} listeners</span>
                                            </div>
                                        )}
                                        {result.mbid && (
                                            <div className="src-label">Last.fm</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ── Initial empty state ── */}
                {!loading && results.length === 0 && !query && (
                    <div className="search-start-hint">
                        <div className="search-start-icon">🎸</div>
                        <h3>Search for anything</h3>
                        <p>Albums and artists — powered by Last.fm</p>
                        <div className="search-suggestions">
                            {["Dark Side of the Moon", "Miles Davis", "Radiohead", "Blonde", "Led Zeppelin", "Kendrick Lamar"].map(s => (
                                <button key={s} className="search-suggestion"
                                    onClick={() => { setQuery(s); doSearch(s, type); }}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <BottomBar />
        </div>
    );
}