import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import "../styles/about.css";

export default function About() {
    const stats = [
        { number: "10K+", label: "Active Users" },
        { number: "50K+", label: "Albums Reviewed" },
        { number: "100K+", label: "Ratings & Reviews" },
        { number: "24/7", label: "Community Support" }
    ];

    const team = [
        {
            name: "The Developers",
            role: "Building the Platform",
            description: "A passionate team dedicated to creating the best music review experience."
        },
        {
            name: "The Community",
            role: "Heart of TuneSpace",
            description: "Music lovers from around the world sharing their passion and discoveries."
        },
        {
            name: "The Artists",
            role: "Creating the Magic",
            description: "Musicians whose work inspires us to build a better platform every day."
        }
    ];

    const values = [
        {
            icon: "🎵",
            title: "Music First",
            description: "Every feature we build starts with one question: does this help people discover and appreciate great music?"
        },
        {
            icon: "🤝",
            title: "Community Driven",
            description: "Your feedback shapes our roadmap. We build features our community actually wants and needs."
        },
        {
            icon: "🌍",
            title: "Open & Inclusive",
            description: "Music transcends borders. TuneSpace welcomes music lovers from every corner of the globe."
        },
        {
            icon: "🔒",
            title: "Privacy Matters",
            description: "Your data is yours. We don't sell it, we don't track you excessively, and we're transparent about what we do collect."
        }
    ];

    return (
        <div className="about-wrapper">
            <Navbar />

            <div className="about-page">
                {/* Hero Section */}
                <section className="about-hero">
                    <div className="about-hero-background">
                        <div className="vinyl-record"></div>
                        <div className="music-notes">
                            <span>♪</span>
                            <span>♫</span>
                            <span>♪</span>
                            <span>♫</span>
                        </div>
                    </div>
                    <div className="about-hero-content">
                        <h1>About TuneSpace</h1>
                        <p className="hero-tagline">
                            Where music lovers connect, discover, and share their passion for great music.
                        </p>
                    </div>
                </section>

                <div className="about-container">
                    {/* Mission Section */}
                    <section className="mission-section">
                        <div className="section-badge">Our Mission</div>
                        <h2>Building a Home for Music Lovers</h2>
                        <p className="mission-text">
                            TuneSpace was born from a simple idea: music is better when shared. We believe
                            that every album has a story, every artist deserves recognition, and every
                            music lover should have a place to express their passion.
                        </p>
                        <p className="mission-text">
                            We're building more than a review platform – we're creating a community where
                            discovery happens through genuine recommendations, where diverse tastes are
                            celebrated, and where the conversation about music never stops.
                        </p>
                    </section>

                    {/* Stats Section */}
                    <section className="stats-section">
                        <div className="stats-grid">
                            {stats.map((stat, index) => (
                                <div key={index} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
                                    <div className="stat-number">{stat.number}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Values Section */}
                    <section className="values-section">
                        <div className="section-badge">What We Believe</div>
                        <h2>Our Core Values</h2>
                        <div className="values-grid">
                            {values.map((value, index) => (
                                <div key={index} className="value-card">
                                    <div className="value-icon">{value.icon}</div>
                                    <h3>{value.title}</h3>
                                    <p>{value.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Team Section */}
                    <section className="team-section">
                        <div className="section-badge">The Team</div>
                        <h2>Who Makes TuneSpace</h2>
                        <div className="team-grid">
                            {team.map((member, index) => (
                                <div key={index} className="team-card">
                                    <div className="team-avatar">
                                        <span>{member.name.charAt(0)}</span>
                                    </div>
                                    <h3>{member.name}</h3>
                                    <div className="team-role">{member.role}</div>
                                    <p>{member.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Story Section */}
                    <section className="story-section">
                        <div className="story-content">
                            <div className="section-badge">Our Story</div>
                            <h2>How TuneSpace Began</h2>
                            <div className="story-timeline">
                                <div className="timeline-item">
                                    <div className="timeline-marker"></div>
                                    <div className="timeline-content">
                                        <h4>The Idea</h4>
                                        <p>
                                            It started with a conversation between music enthusiasts frustrated
                                            with existing platforms. We wanted something better – a place truly
                                            built for music lovers, by music lovers.
                                        </p>
                                    </div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-marker"></div>
                                    <div className="timeline-content">
                                        <h4>The Build</h4>
                                        <p>
                                            Months of late nights, endless coffee, and passionate debates about
                                            features. Every line of code written with one goal: create the best
                                            music review experience possible.
                                        </p>
                                    </div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-marker"></div>
                                    <div className="timeline-content">
                                        <h4>The Launch</h4>
                                        <p>
                                            TuneSpace went live, and the response was incredible. Music lovers
                                            from around the world joined, shared, and made this platform their own.
                                        </p>
                                    </div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-marker active"></div>
                                    <div className="timeline-content">
                                        <h4>Today & Beyond</h4>
                                        <p>
                                            We're constantly evolving based on your feedback. New features,
                                            improvements, and innovations – all driven by our amazing community.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="cta-section">
                        <div className="cta-content">
                            <h2>Join the TuneSpace Community</h2>
                            <p>
                                Be part of a growing community of music enthusiasts.
                                Share your passion, discover new favorites, and connect with fellow music lovers.
                            </p>
                            <div className="cta-buttons">
                                <Link to="/register" className="cta-btn primary">
                                    Get Started
                                </Link>
                                <Link to="/contact" className="cta-btn secondary">
                                    Contact Us
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <BottomBar />
        </div>
    );
}