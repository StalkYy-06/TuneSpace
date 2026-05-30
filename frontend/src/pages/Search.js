import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import "../styles/search.css";
import { API_URL } from "../config/api";

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

    // Discovery data
    const [trendingAlbums, setTrendingAlbums] = useState([]);
    const [popularArtists, setPopularArtists] = useState([]);
    const [homeLoading, setHomeLoading] = useState(true);

    // "See more" toggles
    const [showAllAlbums, setShowAllAlbums] = useState(false);
    const [showAllArtists, setShowAllArtists] = useState(false);

    const INITIAL_COUNT = 10;
    const MAX_COUNT = 50;

    useEffect(() => {
        const q = searchParams.get("q");
        const t = searchParams.get("type") || "all";
        if (q) { setQuery(q); setType(t); doSearch(q, t); }
        inputRef.current?.focus();
        fetchHomeData();
    }, []);

    const fetchHomeData = async () => {
        setHomeLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/music/home`);
            const data = await res.json();
            if (data.success) {
                setTrendingAlbums(data.trendingAlbums || []);
                setPopularArtists(data.popularArtists || []);
            }
        } catch (err) {
            console.error("Home data error:", err);
        } finally {
            setHomeLoading(false);
        }
    };

    const doSearch = async (q, t) => {
        if (!q.trim()) return;
        setLoading(true);
        setError(null);
        setResults([]);
        try {
            const params = new URLSearchParams({ q: q.trim(), type: t });
            const res = await fetch(`${API_URL}/api/music/search?${params}`);
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

    const fmtNumber = (n) =>
        n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
            n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n || 0);

    const visibleAlbums = showAllAlbums
        ? trendingAlbums.slice(0, MAX_COUNT)
        : trendingAlbums.slice(0, INITIAL_COUNT);

    const visibleArtists = showAllArtists
        ? popularArtists.slice(0, MAX_COUNT)
        : popularArtists.slice(0, INITIAL_COUNT);

    const showDiscovery = !query && !loading;

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

                {/* ── Loading skeletons for search ── */}
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
                                        {(result.cover_url || result.thumb_url || result.image_url) ? (
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

                {/* ── Discovery: shown when no search query ── */}
                {showDiscovery && (
                    <div className="search-discovery">

                        {/* Trending Albums */}
                        <div className="discovery-section">
                            <div className="discovery-header">
                                <h2 className="discovery-title">🔥 Trending Albums</h2>
                                {trendingAlbums.length > INITIAL_COUNT && (
                                    <button
                                        className="discovery-see-more"
                                        onClick={() => setShowAllAlbums(v => !v)}
                                    >
                                        {showAllAlbums ? "Show Less" : `See More (${Math.min(trendingAlbums.length, MAX_COUNT)})`}
                                    </button>
                                )}
                            </div>

                            {homeLoading ? (
                                <div className="discovery-scroll-row">
                                    {[...Array(10)].map((_, i) => (
                                        <div key={i} className="disc-album-card disc-skeleton-card">
                                            <div className="disc-album-cover disc-skeleton" />
                                            <div className="disc-skeleton disc-skeleton-text" style={{ width: "80%", marginTop: 10 }} />
                                            <div className="disc-skeleton disc-skeleton-text" style={{ width: "55%", marginTop: 6 }} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={showAllAlbums ? "discovery-wrap-row" : "discovery-scroll-row"}>
                                    {visibleAlbums.map(album => (
                                        <div
                                            key={album.lastfm_key}
                                            className="disc-album-card"
                                            onClick={() => navigate(`/album/${encodeURIComponent(album.lastfm_key)}`)}
                                        >
                                            <div className="disc-album-cover">
                                                {album.cover_url || album.thumb_url ? (
                                                    <>
                                                        <img
                                                            src={album.cover_url || album.thumb_url}
                                                            alt={album.title}
                                                            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                                                        />
                                                        <div className="disc-cover-fallback" style={{ display: "none" }}>💿</div>
                                                    </>
                                                ) : (
                                                    <div className="disc-cover-fallback">💿</div>
                                                )}
                                                {album.avgRating && (
                                                    <div className="disc-rating-badge">★ {album.avgRating}</div>
                                                )}
                                            </div>
                                            <div className="disc-album-info">
                                                <div className="disc-album-title">{album.title}</div>
                                                <div className="disc-album-artist">{album.artist}</div>
                                                {album.lastfm_listeners > 0 && (
                                                    <div className="disc-album-meta">
                                                        👥 {fmtNumber(album.lastfm_listeners)}
                                                    </div>
                                                )}
                                                {album.lastfm_tags?.length > 0 && (
                                                    <div className="disc-tags">
                                                        {album.lastfm_tags.slice(0, 2).map(tag => (
                                                            <span key={tag} className="disc-tag">{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Popular Artists */}
                        <div className="discovery-section">
                            <div className="discovery-header">
                                <h2 className="discovery-title">🎤 Popular Artists</h2>
                                {popularArtists.length > INITIAL_COUNT && (
                                    <button
                                        className="discovery-see-more"
                                        onClick={() => setShowAllArtists(v => !v)}
                                    >
                                        {showAllArtists ? "Show Less" : `See More (${Math.min(popularArtists.length, MAX_COUNT)})`}
                                    </button>
                                )}
                            </div>

                            {homeLoading ? (
                                <div className="discovery-scroll-row">
                                    {[...Array(10)].map((_, i) => (
                                        <div key={i} className="disc-artist-card disc-skeleton-card">
                                            <div className="disc-artist-img disc-skeleton" style={{ borderRadius: "50%" }} />
                                            <div className="disc-skeleton disc-skeleton-text" style={{ width: "70%", marginTop: 10 }} />
                                            <div className="disc-skeleton disc-skeleton-text" style={{ width: "50%", marginTop: 6 }} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={showAllArtists ? "discovery-wrap-row" : "discovery-scroll-row"}>
                                    {visibleArtists.map(artist => (
                                        <div
                                            key={artist.lastfm_key}
                                            className="disc-artist-card"
                                            onClick={() => navigate(`/artist/${encodeURIComponent(artist.lastfm_key)}`)}
                                        >
                                            <div className="disc-artist-img">
                                                {artist.image_url || artist.thumb_url ? (
                                                    <>
                                                        <img
                                                            src={artist.image_url || artist.thumb_url}
                                                            alt={artist.name}
                                                            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                                                        />
                                                        <div className="disc-artist-fallback" style={{ display: "none" }}>
                                                            {artist.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="disc-artist-fallback">
                                                        {artist.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="disc-artist-name">{artist.name}</div>
                                            {artist.lastfm_listeners > 0 && (
                                                <div className="disc-artist-fans">{fmtNumber(artist.lastfm_listeners)} listeners</div>
                                            )}
                                            {artist.lastfm_tags?.length > 0 && (
                                                <div className="disc-artist-genre">{artist.lastfm_tags[0]}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick search suggestions */}
                        <div className="search-suggestions-section">
                            <p className="search-suggestions-label">Try searching for</p>
                            <div className="search-suggestions">
                                {["Dark Side of the Moon", "Miles Davis", "Radiohead", "Blonde", "Led Zeppelin", "Kendrick Lamar"].map(s => (
                                    <button key={s} className="search-suggestion"
                                        onClick={() => { setQuery(s); doSearch(s, type); }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                )}
            </main>
            <BottomBar />
        </div>
    );
}