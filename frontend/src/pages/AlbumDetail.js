import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import "../styles/albumDetail.css";

export default function AlbumDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [album, setAlbum] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [moreAlbums, setMoreAlbums] = useState([]);
    const [loading, setLoading] = useState(true);

    const [albumStats] = useState({
        listenedCount: 1247,
        inListCount: 856,
        favouritedCount: 392,
    });

    const [userInteraction, setUserInteraction] = useState({
        hasListened: false,
        inListenList: false,
        hasFavourited: false,
    });

    const albumsData = {
        album1: {
            id: "album1",
            name: "Midnight Echoes",
            artists: [{ id: "artist1", name: "The Neon Waves" }],
            images: [{ url: "https://via.placeholder.com/300x300/1db954/ffffff?text=Midnight+Echoes" }],
            release_date: "2024-01-15",
            total_tracks: 12,
            album_type: "album",
            averageRating: 4.5,
            totalRatings: 1250,
            ratingDistribution: { 5: 850, 4: 250, 3: 100, 2: 30, 1: 20 },
            tracks: [
                { id: "t1", track_number: 1, name: "Starlight Boulevard", duration_ms: 245000, explicit: false },
                { id: "t2", track_number: 2, name: "Digital Dreams", duration_ms: 198000, explicit: false },
                { id: "t3", track_number: 3, name: "Neon Nights", duration_ms: 312000, explicit: true },
                { id: "t4", track_number: 4, name: "Electric Soul", duration_ms: 267000, explicit: false },
                { id: "t5", track_number: 5, name: "City Lights", duration_ms: 289000, explicit: false },
                { id: "t6", track_number: 6, name: "Wavelength", duration_ms: 234000, explicit: false },
                { id: "t7", track_number: 7, name: "Midnight Drive", duration_ms: 298000, explicit: false },
                { id: "t8", track_number: 8, name: "Echoes in the Dark", duration_ms: 276000, explicit: false },
                { id: "t9", track_number: 9, name: "Sunset Memories", duration_ms: 254000, explicit: false },
                { id: "t10", track_number: 10, name: "Aurora", duration_ms: 318000, explicit: false },
                { id: "t11", track_number: 11, name: "Cosmic Highway", duration_ms: 301000, explicit: false },
                { id: "t12", track_number: 12, name: "Dream Sequence", duration_ms: 345000, explicit: false }
            ],
            reviews: [
                { id: 1, username: "MusicLover92", rating: 5, content: "Absolutely stunning album! Every track is a masterpiece. The production quality is top-notch and the songwriting is incredible.", date: "2024-02-01", likes: 45 },
                { id: 2, username: "SynthFan", rating: 4, content: "Great synthwave vibes. Some tracks could be shorter but overall a solid album.", date: "2024-01-28", likes: 32 },
                { id: 3, username: "NightListener", rating: 5, content: "Perfect for late night drives. The atmosphere is amazing!", date: "2024-01-25", likes: 28 },
            ],
            moreAlbums: [
                {
                    id: "album2",
                    name: "Dawn Breaks",
                    images: [{ url: "https://via.placeholder.com/300x300/e91e63/ffffff?text=Dawn+Breaks" }],
                    release_date: "2023-06-10",
                    averageRating: 4.2
                },
                {
                    id: "album3",
                    name: "Echoes of Tomorrow",
                    images: [{ url: "https://via.placeholder.com/300x300/9c27b0/ffffff?text=Echoes+Tomorrow" }],
                    release_date: "2022-11-20",
                    averageRating: 4.7
                },
                {
                    id: "album4",
                    name: "Neon Horizon",
                    images: [{ url: "https://via.placeholder.com/300x300/00bcd4/ffffff?text=Neon+Horizon" }],
                    release_date: "2023-03-15",
                    averageRating: 4.0
                },
                {
                    id: "album5",
                    name: "Synthetic Dreams",
                    images: [{ url: "https://via.placeholder.com/300x300/ff9800/ffffff?text=Synthetic+Dreams" }],
                    release_date: "2021-09-05",
                    averageRating: 4.6
                }
            ]
        }
    };

    useEffect(() => {
        setTimeout(() => {
            const albumData = albumsData[id] || {
                id,
                name: "Unknown Album",
                artists: [{ name: "Unknown Artist" }],
                images: [{ url: "https://via.placeholder.com/300x300/607d8b/ffffff?text=?" }],
                release_date: "2024-01-01",
                total_tracks: 10,
                album_type: "album",
                averageRating: 0,
                totalRatings: 0,
                ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                tracks: [],
                reviews: [],
                moreAlbums: []
            };
            setAlbum(albumData);
            setTracks(albumData.tracks || []);
            setReviews(albumData.reviews || []);
            setMoreAlbums(albumData.moreAlbums || []);
            setLoading(false);
        }, 300);
    }, [id]);

    const formatDuration = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    const handleArtistClick = (artistId) => {
        navigate(`/artist/${artistId}`);
    };

    const handleAlbumClick = (albumId) => {
        navigate(`/album/${albumId}`);
        window.scrollTo(0, 0);
    };

    const toggleListened = () => {
        setUserInteraction(prev => ({ ...prev, hasListened: !prev.hasListened }));
    };

    const toggleListenList = () => {
        setUserInteraction(prev => ({ ...prev, inListenList: !prev.inListenList }));
    };

    const toggleFavourite = () => {
        setUserInteraction(prev => ({ ...prev, hasFavourited: !prev.hasFavourited }));
    };

    if (loading) {
        return (
            <div className="album-detail-wrapper">
                <Navbar />
                <div className="album-loading">Loading album...</div>
                <BottomBar />
            </div>
        );
    }

    if (!album) {
        return (
            <div className="album-detail-wrapper">
                <Navbar />
                <div className="album-error">Album not found</div>
                <BottomBar />
            </div>
        );
    }

    return (
        <div className="album-detail-wrapper">
            <Navbar />

            <div className="album-detail">
                <div className="album-header-section">
                    <div className="album-cover-container">
                        {album.images?.[0] && (
                            <img src={album.images[0].url} alt={album.name} className="album-cover-image" />
                        )}
                    </div>

                    <div className="album-info-container">
                        <div className="album-title-section">
                            <h1 className="album-title">{album.name}</h1>
                            <div className="album-artist-names">
                                {album.artists?.map((artist, idx) => (
                                    <React.Fragment key={artist.id || idx}>
                                        <span
                                            className="artist-name-link"
                                            onClick={() => artist.id && handleArtistClick(artist.id)}
                                        >
                                            {artist.name}
                                        </span>
                                        {idx < album.artists.length - 1 && ", "}
                                    </React.Fragment>
                                ))}
                            </div>
                            <div className="album-metadata">
                                {album.album_type && <span className="metadata-item">{album.album_type}</span>}
                                {album.release_date && (
                                    <>
                                        <span className="metadata-separator"> • </span>
                                        <span className="metadata-item">{new Date(album.release_date).getFullYear()}</span>
                                    </>
                                )}
                                {album.total_tracks && (
                                    <>
                                        <span className="metadata-separator"> • </span>
                                        <span className="metadata-item">{album.total_tracks} tracks</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="album-global-stats">
                            <div className="stat-item">

                                <span className="stat-number">{albumStats.listenedCount}</span>
                                <span className="stat-label">Listened</span>
                            </div>
                            <div className="stat-item">

                                <span className="stat-number">{albumStats.inListCount}</span>
                                <span className="stat-label">In List</span>
                            </div>
                            <div className="stat-item">

                                <span className="stat-number">{albumStats.favouritedCount}</span>
                                <span className="stat-label">Favourited</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rating-stats-section">
                    <div className="rating-summary">
                        <div className="average-rating">
                            <div className="rating-number">{album.averageRating}</div>
                            <div className="rating-stars">{'★'.repeat(Math.floor(album.averageRating))}</div>
                            <div className="rating-count">{album.totalRatings} ratings</div>
                        </div>
                    </div>

                    <div className="rating-distribution">
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = album.ratingDistribution[star] || 0;
                            const pct = album.totalRatings > 0 ? (count / album.totalRatings) * 100 : 0;
                            return (
                                <div key={star} className="rating-bar-row">
                                    <span className="star-label">{star} ★</span>
                                    <div className="rating-bar">
                                        <div className="rating-bar-fill" style={{ width: `${pct}%` }}></div>
                                    </div>
                                    <span className="rating-bar-count">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="album-interaction-box">
                    <div className="interaction-row">
                        <div className="interaction-left">
                            <div className="star-rating-interactive">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span key={star} className="star-btn">★</span>
                                ))}
                            </div>
                            <button className="review-btn">Review</button>
                        </div>
                        <div className="interaction-right">
                            <div className="action-list">
                                <div
                                    className={`action-list-item ${userInteraction.hasListened ? "active" : ""}`}
                                    onClick={toggleListened}
                                >
                                    <span className="action-icon">{userInteraction.hasListened ? "✓" : "○"}</span>
                                    {userInteraction.hasListened ? "Listened" : "Listen"}
                                </div>
                                <div
                                    className={`action-list-item ${userInteraction.inListenList ? "active" : ""}`}
                                    onClick={toggleListenList}
                                >
                                    <span className="action-icon">{userInteraction.inListenList ? "✓" : "+"}</span>
                                    Add to listen list
                                </div>
                                <div
                                    className={`action-list-item ${userInteraction.hasFavourited ? "active" : ""}`}
                                    onClick={toggleFavourite}
                                >
                                    <span className="action-icon">{userInteraction.hasFavourited ? "♥" : "♡"}</span>
                                    Fav
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="secondary-actions-container">
                        <button className="secondary-action-btn">Add to album lists</button>
                        <button className="secondary-action-btn">Listen on Spotify</button>
                        <button className="secondary-action-btn">Share</button>
                    </div>
                </div>



                {tracks.length > 0 && (
                    <div className="tracklist-section">
                        <h2>Tracklist</h2>
                        <div className="tracklist">
                            {tracks.map(track => (
                                <div key={track.id} className="track-row">
                                    <span className="track-num">{track.track_number}</span>
                                    <div className="track-main">
                                        <span className="track-name">
                                            {track.name}
                                            {track.explicit && <span className="explicit-tag">E</span>}
                                        </span>
                                    </div>
                                    <span className="track-duration">{formatDuration(track.duration_ms)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="reviews-section">
                    <div className="section-header">
                        <h2>Popular Reviews</h2>
                        <button className="view-all-btn" onClick={() => navigate(`/album/${id}/reviews`)}>
                            View All Reviews
                        </button>
                    </div>

                    {reviews.length > 0 ? (
                        <div className="reviews-grid">
                            {reviews.slice(0, 3).map(review => (
                                <div key={review.id} className="review-card">
                                    <div className="review-card-header">
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
                                    <p className="review-text">{review.content}</p>
                                    <div className="review-footer">
                                        <span className="review-date">{new Date(review.date).toLocaleDateString()}</span>
                                        <span className="review-likes">👍 {review.likes}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-reviews-message">
                            No reviews yet. Be the first to review this album!
                        </div>
                    )}
                </div>

                {moreAlbums.length > 0 && (
                    <div className="more-albums-section">
                        <h2>More Albums by {album.artists?.[0]?.name}</h2>
                        <div className="more-albums-grid">
                            {moreAlbums.map(moreAlbum => (
                                <div
                                    key={moreAlbum.id}
                                    className="album-card-small"
                                    onClick={() => handleAlbumClick(moreAlbum.id)}
                                >
                                    <div className="album-card-cover">
                                        <img src={moreAlbum.images?.[0]?.url} alt={moreAlbum.name} />
                                    </div>
                                    <div className="album-card-info">
                                        <h3 className="album-card-title">{moreAlbum.name}</h3>
                                        <p className="album-card-year">
                                            {new Date(moreAlbum.release_date).getFullYear()}
                                        </p>
                                        {moreAlbum.averageRating > 0 && (
                                            <div className="album-card-rating">
                                                ★ {moreAlbum.averageRating.toFixed(1)}
                                            </div>
                                        )}
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