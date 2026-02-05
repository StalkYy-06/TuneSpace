import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import "../styles/contact.css";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function Contact() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [status, setStatus] = useState({ type: "", message: "" });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: "", message: "" });

        try {
            // Simulate API call - replace with actual endpoint when ready
            await new Promise(resolve => setTimeout(resolve, 1500));

            // TODO: Replace with actual API call
            // await axios.post(`${API_URL}/api/contact`, formData);

            setStatus({
                type: "success",
                message: "Thank you for reaching out! We'll get back to you within 24 hours."
            });
            setFormData({ name: "", email: "", subject: "", message: "" });
        } catch (error) {
            setStatus({
                type: "error",
                message: "Something went wrong. Please try again later."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-wrapper">
            <Navbar />

            <div className="contact-page">
                <div className="contact-hero">
                    <div className="contact-hero-content">
                        <h1 className="contact-hero-title">
                            Get in Touch
                        </h1>
                        <p className="contact-hero-subtitle">
                            Have questions, feedback, or just want to say hi?
                            We'd love to hear from you.
                        </p>
                    </div>
                    <div className="contact-hero-decoration">
                        <div className="sound-wave">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>

                <div className="contact-container">
                    <div className="contact-grid">
                        {/* Contact Form */}
                        <div className="contact-form-section">
                            <div className="form-header">
                                <h2>Send us a message</h2>
                                <p>Fill out the form below and we'll respond as soon as possible</p>
                            </div>

                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="name">Your Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="email">Email Address</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="subject">Subject</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        placeholder="How can we help?"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message">Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows="6"
                                        placeholder="Tell us what's on your mind..."
                                    ></textarea>
                                </div>

                                {status.message && (
                                    <div className={`status-message ${status.type}`}>
                                        {status.message}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={loading}
                                >
                                    {loading ? "Sending..." : "Send Message"}
                                </button>
                            </form>
                        </div>

                        {/* Contact Info */}
                        <div className="contact-info-section">
                            <div className="info-card">
                                <div className="info-icon">✉️</div>
                                <h3>Email Us</h3>
                                <p>support@tunespace.com</p>
                                <p className="info-detail">We typically respond within 24 hours</p>
                            </div>

                            <div className="info-card">
                                <div className="info-icon">💬</div>
                                <h3>Social Media</h3>
                                <div className="social-links">
                                    <a href="#" className="social-link">Twitter</a>
                                    <a href="#" className="social-link">Instagram</a>
                                    <a href="#" className="social-link">Discord</a>
                                </div>
                            </div>

                            <div className="info-card">
                                <div className="info-icon">📍</div>
                                <h3>Location</h3>
                                <p>Kathmandu, Nepal</p>
                                <p className="info-detail">Remote-first team, global community</p>
                            </div>

                            <div className="info-card faq-card">
                                <h3>Quick Links</h3>
                                <div className="quick-links">
                                    <Link to="/about">About Us</Link>
                                    <Link to="/privacy">Privacy Policy</Link>
                                    <Link to="/terms">Terms of Service</Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="faq-section">
                        <h2>Frequently Asked Questions</h2>
                        <div className="faq-grid">
                            <div className="faq-item">
                                <h4>How do I report a bug?</h4>
                                <p>Use the contact form above with "Bug Report" as the subject, or email us directly at support@tunespace.com</p>
                            </div>
                            <div className="faq-item">
                                <h4>Can I suggest new features?</h4>
                                <p>Absolutely! We love hearing from our community. Send us your ideas through the contact form.</p>
                            </div>
                            <div className="faq-item">
                                <h4>How do I delete my account?</h4>
                                <p>You can delete your account from your profile settings, or contact us for assistance.</p>
                            </div>
                            <div className="faq-item">
                                <h4>Is TuneSpace free to use?</h4>
                                <p>Yes! TuneSpace is completely free for all music lovers to review and discover music.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <BottomBar />
        </div>
    );
}