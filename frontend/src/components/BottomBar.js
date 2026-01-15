import React from "react";
import { Link } from "react-router-dom";
import "../styles/bottombar.css";

export default function BottomBar() {
    return (
        <footer className="bottom-bar">
            <div className="bottom-bar-container">
                <div className="footer-brand">
                    <span className="footer-logo">TuneSpace</span>
                    <p className="copyright">© 2025 TuneSpace. All rights reserved.</p>
                </div>

                <div className="footer-links">
                    <Link to="/about" className="footer-link">About Us</Link>
                    <Link to="/contact" className="footer-link">Contact Us</Link>
                    <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                    <Link to="/terms" className="footer-link">Terms of Service</Link>
                </div>

                <div className="footer-social">
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">𝕏</a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">📷</a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">📘</a>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon">▶️</a>
                </div>
            </div>
        </footer>
    );
}