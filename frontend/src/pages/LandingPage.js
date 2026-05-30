import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/landing.css";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";

import { API_URL } from "../config/api";

const FEATURES = [
  {
    icon: "🎵",
    title: "Discover New Music",
    desc: "Explore a vast catalogue of albums and artists. Search by genre, mood, or era to find your next obsession.",
  },
  {
    icon: "⭐",
    title: "Rate & Review",
    desc: "Share your take on any album with in-depth reviews. Build your critical voice and help others find great music.",
  },
  {
    icon: "❤️",
    title: "Save Favourites",
    desc: "Curate your personal collection of all-time favourites. Your taste, showcased beautifully on your profile.",
  },
  {
    icon: "👥",
    title: "Connect & Follow",
    desc: "Follow friends and fellow listeners. See what people you trust are discovering, reviewing, and loving.",
  },
  {
    icon: "🏆",
    title: "Climb the Leaderboard",
    desc: "Earn recognition for your contributions. Top reviewers get featured and build a presence on the platform.",
  },
  {
    icon: "📣",
    title: "Share Reviews",
    desc: "Post your reviews to the community feed and see what others are listening to and rating.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const featuresRef = useRef(null);

  // If already logged in, redirect to /home automatically
  useEffect(() => {
    axios
      .get(`${API_URL}/api/auth/me`, { withCredentials: true })
      .then((res) => {
        if (res.data.success) navigate("/home");
      })
      .catch(() => { });
  }, [navigate]);

  // Scroll reveal for feature cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.15 }
    );

    const cards = featuresRef.current?.querySelectorAll(".feature-card");
    cards?.forEach((card, i) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(40px)";
      card.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`;
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-root">
      {/* ── SHARED NAVBAR ── */}
      <Navbar />

      {/* ── HERO ── */}
      <section className="landing-hero" id="hero">
        <div className="hero-badge">
          <span className="badge-dot" /> Now live — join the community
        </div>

        <h1>
          Your music,<br />
          <span className="hero-gradient-text">your story.</span>
        </h1>

        <p>
          TuneSpace is the social platform for music lovers. Discover albums,
          share honest reviews, and connect with people who hear what you hear.
        </p>

        <div className="hero-cta-group">
          <Link to="/register" className="hero-cta-primary">
            Start for free →
          </Link>
          <Link to="/login" className="hero-cta-secondary">
            Sign in
          </Link>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="landing-features" id="features" ref={featuresRef}>
        <div className="section-header">

          <h2>Built for real music lovers</h2>
          <p>
            All the tools to track, rate, and share your relationship with music
            — beautifully packaged in one place.
          </p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACTIVITY PREVIEW ── */}
      <section className="landing-preview" id="preview">
        <div className="landing-preview-inner">
          <div className="preview-text">
            <div className="section-eyebrow">Your music journal</div>
            <h2>Everything in one beautiful place</h2>
            <p>
              Rate albums, write reviews, and keep track of everything you have
              listened to. Your profile becomes a living record of your musical
              journey.
            </p>
            <ul className="preview-checklist">
              <li>Discover albums across all genres and decades</li>
              <li>Write reviews and share your perspective</li>
              <li>Favourite albums to your personal collection</li>
              <li>Follow others and see what they're loving</li>
              <li>Compete on the community leaderboard</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <h2>
          Ready to find your<br />
          <span className="hero-gradient-text">sound space?</span>
        </h2>
        <p>
          Join thousands of music lovers already sharing their taste, building
          their collection, and discovering new favourites every day.
        </p>
        <div className="cta-btn-group">
          <Link to="/register" className="cta-primary">
            Create free account →
          </Link>
          <Link to="/login" className="cta-secondary">
            Log in instead
          </Link>
        </div>
      </section>

      {/* ── SHARED BOTTOM BAR ── */}
      <BottomBar />
    </div>
  );
}
