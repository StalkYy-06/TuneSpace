// src/pages/ArtistDetail.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import "../styles/artistDetail.css";

export default function ArtistDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [artist, setArtist] = useState(null);
    const [topTracks, setTopTracks] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [relatedArtists, setRelatedArtists] = useState([]);
    const [loading, setLoading] = useState(true);

    // Placeholder artists data
    const artistsData = {
        artist1: {
            id: "artist1",
            name: "The Neon Waves",
            images: [{ url: "https://via.placeholder.com/600x600/1db954/ffffff?text=Neon+Waves" }],
            genres: ["Electronic", "Synthwave", "Indie"],
            followers: { total: 1250000 },
            popularity: 85,
            topTracks: [
                { id: "t1", name: "Starlight Boulevard", duration_ms: 245000, explicit: false, popularity: 88, album: { name: "Midnight Echoes", images: [{ url: "https://via.placeholder.com/64x64/1db954/ffffff" }] } },
                { id: "t2", name: "Digital Dreams", duration_ms: 198000, explicit: false, popularity: 85, album: { name: "Midnight Echoes", images: [{ url: "https://via.placeholder.com/64x64/1db954/ffffff" }] } },
                { id: "t3", name: "Neon Nights", duration_ms: 312000, explicit: true, popularity: 92, album: { name: "Midnight Echoes", images: [{ url: "https://via.placeholder.com/64x64/1db954/ffffff" }] } },
                { id: "t4", name: "Electric Soul", duration_ms: 267000, explicit: false, popularity: 79, album: { name: "Midnight Echoes", images: [{ url: "https://via.placeholder.com/64x64/1db954/ffffff" }] } },
                { id: "t5", name: "City Lights", duration_ms: 289000, explicit: false, popularity: 83, album: { name: "Serenity", images: [{ url: "https://via.placeholder.com/64x64/4caf50/ffffff" }] } },
                { id: "t6", name: "Wavelength", duration_ms: 234000, explicit: false, popularity: 77, album: { name: "Midnight Echoes", images: [{ url: "https://via.placeholder.com/64x64/1db954/ffffff" }] } },
                { id: "t7", name: "Midnight Drive", duration_ms: 298000, explicit: false, popularity: 81, album: { name: "Midnight Echoes", images: [{ url: "https://via.placeholder.com/64x64/1db954/ffffff" }] } },
                { id: "t8", name: "Echoes in the Dark", duration_ms: 276000, explicit: false, popularity: 75, album: { name: "Midnight Echoes", images: [{ url: "https://via.placeholder.com/64x64/1db954/ffffff" }] } },
                { id: "t9", name: "Sunset Memories", duration_ms: 254000, explicit: false, popularity: 78, album: { name: "Midnight Echoes", images: [{ url: "https://via.placeholder.com/64x64/1db954/ffffff" }] } },
                { id: "t10", name: "Aurora", duration_ms: 318000, explicit: false, popularity: 86, album: { name: "Midnight Echoes", images: [{ url: "https://via.placeholder.com/64x64/1db954/ffffff" }] } }
            ],
            albums: [
                { id: "album1", name: "Midnight Echoes", release_date: "2024-01-15", total_tracks: 12, album_type: "album", images: [{ url: "https://via.placeholder.com/300x300/1db954/ffffff?text=Midnight+Echoes" }] },
                { id: "album8", name: "Serenity", release_date: "2024-02-14", total_tracks: 10, album_type: "album", images: [{ url: "https://via.placeholder.com/300x300/4caf50/ffffff?text=Serenity" }] },
                { id: "album1_single1", name: "Starlight Boulevard", release_date: "2023-12-01", total_tracks: 1, album_type: "single", images: [{ url: "https://via.placeholder.com/300x300/1db954/ffffff?text=Single" }] },
                { id: "album1_ep1", name: "Night Sessions EP", release_date: "2023-08-20", total_tracks: 5, album_type: "single", images: [{ url: "https://via.placeholder.com/300x300/1db954/ffffff?text=EP" }] }
            ],
            relatedArtists: [
                { id: "artist2", name: "Luna Sky", images: [{ url: "https://via.placeholder.com/200x200/e91e63/ffffff?text=Luna+Sky" }], genres: ["Dream Pop"] },
                { id: "artist6", name: "Silk Road", images: [{ url: "https://via.placeholder.com/200x200/673ab7/ffffff?text=Silk+Road" }], genres: ["R&B"] },
                { id: "artist8", name: "Electric Hearts", images: [{ url: "https://via.placeholder.com/200x200/ff5722/ffffff?text=Electric" }], genres: ["Synthpop"] },
                { id: "artist9", name: "Crystal Vision", images: [{ url: "https://via.placeholder.com/200x200/3f51b5/ffffff?text=Crystal" }], genres: ["Dream Pop"] }
            ]
        },
        artist2: {
            id: "artist2",
            name: "Luna Sky",
            images: [{ url: "https://via.placeholder.com/600x600/e91e63/ffffff?text=Luna+Sky" }],
            genres: ["Dream Pop", "Indie Pop"],
            followers: { total: 890000 },
            popularity: 78
        },
        artist3: {
            id: "artist3",
            name: "Metro Pulse",
            images: [{ url: "https://via.placeholder.com/600x600/9c27b0/ffffff?text=Metro+Pulse" }],
            genres: ["Hip Hop", "Urban"],
            followers: { total: 2100000 },
            popularity: 92
        },
        artist4: {
            id: "artist4",
            name: "Coastal Breeze",
            images: [{ url: "https://via.placeholder.com/600x600/00bcd4/ffffff?text=Coastal+Breeze" }],
            genres: ["Chill", "Ambient"],
            followers: { total: 675000 },
            popularity: 71
        },
        artist5: {
            id: "artist5",
            name: "Sunset Collective",
            images: [{ url: "https://via.placeholder.com/600x600/ff9800/ffffff?text=Sunset" }],
            genres: ["Indie Rock", "Alternative"],
            followers: { total: 1450000 },
            popularity: 88
        },
        artist6: {
            id: "artist6",
            name: "Silk Road",
            images: [{ url: "https://via.placeholder.com/600x600/673ab7/ffffff?text=Silk+Road" }],
            genres: ["R&B", "Soul"],
            followers: { total: 980000 },
            popularity: 82
        },
        artist7: {
            id: "artist7",
            name: "Storm Chasers",
            images: [{ url: "https://via.placeholder.com/600x600/f44336/ffffff?text=Storm+Chasers" }],
            genres: ["Rock", "Alternative Rock"],
            followers: { total: 1600000 },
            popularity: 90
        },
        artist8: {
            id: "artist8",
            name: "Electric Hearts",
            images: [{ url: "https://via.placeholder.com/600x600/ff5722/ffffff?text=Electric+Hearts" }],
            genres: ["Synthpop", "Electronic"],
            followers: { total: 540000 },
            popularity: 73
        },
        artist9: {
            id: "artist9",
            name: "Starlight Band",
            images: [{ url: "https://via.placeholder.com/600x600/2196f3/ffffff?text=Starlight+Band" }],
            genres: ["Pop", "Electronic"],
            followers: { total: 820000 },
            popularity: 80
        },
        artist10: {
            id: "artist10",
            name: "Voltage",
            images: [{ url: "https://via.placeholder.com/600x600/ff5722/ffffff?text=Voltage" }],
            genres: ["Electronic", "EDM"],
            followers: { total: 1100000 },
            popularity: 85
        },
        artist11: {
            id: "artist11",
            name: "Echo Valley",
            images: [{ url: "https://via.placeholder.com/600x600/795548/ffffff?text=Echo+Valley" }],
            genres: ["Folk", "Acoustic"],
            followers: { total: 450000 },
            popularity: 73
        },
        artist12: {
            id: "artist12",
            name: "Cyber City",
            images: [{ url: "https://via.placeholder.com/600x600/ff4081/ffffff?text=Cyber+City" }],
            genres: ["Cyberpunk", "Electronic"],
            followers: { total: 950000 },
            popularity: 87
        },
        artist13: {
            id: "artist13",
            name: "Maple Grove",
            images: [{ url: "https://via.placeholder.com/600x600/ff6f00/ffffff?text=Maple+Grove" }],
            genres: ["Folk", "Indie"],
            followers: { total: 380000 },
            popularity: 75
        },
        artist14: {
            id: "artist14",
            name: "Blue Note Trio",
            images: [{ url: "https://via.placeholder.com/600x600/3f51b5/ffffff?text=Blue+Note+Trio" }],
            genres: ["Jazz", "Blues"],
            followers: { total: 620000 },
            popularity: 82
        },
        artist15: {
            id: "artist15",
            name: "Beach Boys Revival",
            images: [{ url: "https://via.placeholder.com/600x600/ffc107/ffffff?text=Beach+Boys" }],
            genres: ["Surf Rock", "Pop"],
            followers: { total: 1200000 },
            popularity: 89
        },
        artist16: {
            id: "artist16",
            name: "Cosmic Explorers",
            images: [{ url: "https://via.placeholder.com/600x600/7c4dff/ffffff?text=Cosmic+Explorers" }],
            genres: ["Space Rock", "Progressive"],
            followers: { total: 710000 },
            popularity: 84
        }
    };

    // Add default data for artists that don't have full details
    Object.keys(artistsData).forEach(key => {
        const artist = artistsData[key];
        if (!artist.topTracks) {
            artist.topTracks = Array.from({ length: 10 }, (_, i) => ({
                id: `${artist.id}_t${i + 1}`,
                name: `Popular Track ${i + 1}`,
                duration_ms: 180000 + Math.random() * 120000,
                explicit: false,
                popularity: 90 - i * 5,
                album: { name: "Album Name", images: [{ url: `https://via.placeholder.com/64x64/${artist.id.slice(-6)}/ffffff` }] }
            }));
        }
        if (!artist.albums) {
            artist.albums = Array.from({ length: 6 }, (_, i) => ({
                id: `${artist.id}_album${i + 1}`,
                name: `Album ${i + 1}`,
                release_date: `202${3 - Math.floor(i / 3)}-0${(i % 12) + 1}-01`,
                total_tracks: 10,
                album_type: i < 4 ? "album" : "single",
                images: [{ url: `https://via.placeholder.com/300x300/${artist.id.slice(-6)}/ffffff?text=Album+${i + 1}` }]
            }));
        }
        if (!artist.relatedArtists) {
            artist.relatedArtists = [];
        }
    });

    useEffect(() => {
        // Simulate API call delay
        setTimeout(() => {
            const artistData = artistsData[id];
            setArtist(artistData);
            setTopTracks(artistData?.topTracks || []);
            setAlbums(artistData?.albums || []);
            setRelatedArtists(artistData?.relatedArtists || []);
            setLoading(false);
        }, 300);
    }, [id]);

    const formatDuration = (milliseconds) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="artist-detail-wrapper">
                <Navbar />
                <div className="artist-loading">Loading artist...</div>
                <BottomBar />
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="artist-detail-wrapper">
                <Navbar />
                <div className="artist-error">Artist not found</div>
                <BottomBar />
            </div>
        );
    }

    return (
        <div className="artist-detail-wrapper">
            <Navbar />

            <div className="artist-detail">
                {/* Artist Header */}
                <div className="artist-header">
                    <div className="artist-image-large">
                        {artist.images && artist.images[0] && (
                            <img src={artist.images[0].url} alt={artist.name} />
                        )}
                    </div>
                    <div className="artist-info">
                        <div className="artist-type">Artist</div>
                        <h1>{artist.name}</h1>
                        <div className="artist-stats">
                            {artist.followers?.total && (
                                <div className="stat">
                                    <div className="stat-value">
                                        {artist.followers.total.toLocaleString()}
                                    </div>
                                    <div className="stat-label">Followers</div>
                                </div>
                            )}
                            {artist.popularity !== undefined && (
                                <div className="stat">
                                    <div className="stat-value">{artist.popularity}</div>
                                    <div className="stat-label">Popularity</div>
                                </div>
                            )}
                        </div>
                        {artist.genres && artist.genres.length > 0 && (
                            <div className="artist-genres">
                                {artist.genres.map((genre, index) => (
                                    <span key={index} className="genre-tag">
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Tracks */}
                {topTracks.length > 0 && (
                    <div className="artist-section">
                        <h2>Popular Tracks</h2>
                        <div className="top-tracks-list">
                            {topTracks.slice(0, 10).map((track, index) => (
                                <div key={track.id} className="top-track-item">
                                    <div className="track-position">{index + 1}</div>
                                    {track.album?.images?.[0]?.url && (
                                        <img
                                            src={track.album.images[0].url}
                                            alt={track.name}
                                            className="track-cover-small"
                                        />
                                    )}
                                    <div className="track-details">
                                        <div className="track-name">
                                            {track.name}
                                            {track.explicit && (
                                                <span className="explicit-badge">E</span>
                                            )}
                                        </div>
                                        <div className="track-album">{track.album?.name}</div>
                                    </div>
                                    <div className="track-popularity">
                                        {track.popularity && `${track.popularity}%`}
                                    </div>
                                    <div className="track-duration">
                                        {formatDuration(track.duration_ms)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Albums */}
                {albums.length > 0 && (
                    <div className="artist-section">
                        <h2>Albums & Singles</h2>
                        <div className="albums-grid">
                            {albums.map((album) => (
                                <div
                                    key={album.id}
                                    className="album-card"
                                    onClick={() => navigate(`/album/${album.id}`)}
                                >
                                    <div className="album-cover">
                                        {album.images && album.images[0] && (
                                            <img
                                                src={album.images[0].url}
                                                alt={album.name}
                                            />
                                        )}
                                    </div>
                                    <div className="album-info-card">
                                        <h3>{album.name}</h3>
                                        <p>{album.release_date && new Date(album.release_date).getFullYear()}</p>
                                        {album.album_type && (
                                            <span className="album-type-badge">
                                                {album.album_type}
                                            </span>
                                        )}
                                        {album.total_tracks && (
                                            <span className="track-count">
                                                {album.total_tracks} tracks
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Related Artists */}
                {relatedArtists.length > 0 && (
                    <div className="artist-section">
                        <h2>Fans Also Like</h2>
                        <div className="related-artists-grid">
                            {relatedArtists.map((relatedArtist) => (
                                <div
                                    key={relatedArtist.id}
                                    className="related-artist-card"
                                    onClick={() => {
                                        navigate(`/artist/${relatedArtist.id}`);
                                        window.scrollTo(0, 0);
                                    }}
                                >
                                    <div className="related-artist-image">
                                        {relatedArtist.images && relatedArtist.images[0] && (
                                            <img
                                                src={relatedArtist.images[0].url}
                                                alt={relatedArtist.name}
                                            />
                                        )}
                                    </div>
                                    <div className="related-artist-info">
                                        <h3>{relatedArtist.name}</h3>
                                        {relatedArtist.genres?.[0] && (
                                            <p>{relatedArtist.genres[0]}</p>
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