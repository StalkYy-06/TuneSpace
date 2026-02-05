import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import "../styles/legal.css";

export default function Privacy() {
    const lastUpdated = "February 6, 2025";

    const sections = [
        {
            title: "Information We Collect",
            content: [
                {
                    subtitle: "Account Information",
                    text: "When you create an account, we collect your username, email address, and password (encrypted). If you sign up with Google OAuth, we collect your email and display name."
                },
                {
                    subtitle: "Profile Information",
                    text: "You may optionally provide a profile picture, bio, and other profile details. This information is publicly visible on your profile."
                },
                {
                    subtitle: "Content You Create",
                    text: "We store reviews, ratings, comments, and other content you create on TuneSpace. This content is publicly visible unless you delete it."
                },
                {
                    subtitle: "Usage Data",
                    text: "We collect information about how you use TuneSpace, including pages visited, features used, and actions taken. This helps us improve our service."
                }
            ]
        },
        {
            title: "How We Use Your Information",
            content: [
                {
                    subtitle: "To Provide Our Service",
                    text: "We use your information to operate TuneSpace, including authenticating your account, displaying your profile and content, and enabling features like following other users."
                },
                {
                    subtitle: "To Improve TuneSpace",
                    text: "We analyze usage patterns to understand what features are popular, identify bugs, and plan improvements."
                },
                {
                    subtitle: "To Communicate With You",
                    text: "We may send you emails about your account, security updates, or important service changes. You can opt out of non-essential emails."
                },
                {
                    subtitle: "To Ensure Security",
                    text: "We use your information to detect and prevent fraud, abuse, and security incidents."
                }
            ]
        },
        {
            title: "Information Sharing",
            content: [
                {
                    subtitle: "Public Information",
                    text: "Your username, profile picture, bio, reviews, and ratings are publicly visible. Anyone can see this information, whether or not they have a TuneSpace account."
                },
                {
                    subtitle: "Third-Party Services",
                    text: "We do not sell your personal information. We may share data with service providers who help us operate TuneSpace (e.g., hosting, email delivery), but only to the extent necessary."
                },
                {
                    subtitle: "Legal Requirements",
                    text: "We may disclose information if required by law, court order, or to protect our rights and safety."
                }
            ]
        },
        {
            title: "Data Storage and Security",
            content: [
                {
                    subtitle: "Where We Store Data",
                    text: "Your data is stored on secure servers provided by MongoDB Atlas. We use industry-standard encryption for data in transit and at rest."
                },
                {
                    subtitle: "How Long We Keep Data",
                    text: "We retain your account information as long as your account is active. If you delete your account, we remove your personal information within 30 days, though some public content may remain in backups."
                },
                {
                    subtitle: "Security Measures",
                    text: "We implement security measures including password hashing, JWT authentication, rate limiting, and regular security audits. However, no method is 100% secure."
                }
            ]
        },
        {
            title: "Your Rights and Choices",
            content: [
                {
                    subtitle: "Access and Update",
                    text: "You can access and update your profile information at any time through your account settings."
                },
                {
                    subtitle: "Delete Your Account",
                    text: "You can delete your account from your profile settings. This permanently removes your personal information, though public reviews may be retained anonymously."
                },
                {
                    subtitle: "Export Your Data",
                    text: "Contact us at privacy@tunespace.com to request an export of your personal data."
                },
                {
                    subtitle: "Opt-Out of Emails",
                    text: "You can unsubscribe from non-essential emails using the link in any email we send you."
                }
            ]
        },
        {
            title: "Cookies and Tracking",
            content: [
                {
                    subtitle: "Essential Cookies",
                    text: "We use cookies to keep you logged in and remember your preferences. These are necessary for TuneSpace to function."
                },
                {
                    subtitle: "Analytics",
                    text: "We may use analytics tools to understand how TuneSpace is used. You can disable tracking through your browser settings."
                },
                {
                    subtitle: "Third-Party Cookies",
                    text: "We do not use third-party advertising cookies or trackers."
                }
            ]
        },
        {
            title: "Children's Privacy",
            content: [
                {
                    subtitle: "",
                    text: "TuneSpace is not intended for users under 13 years old. We do not knowingly collect information from children under 13. If you believe we have collected such information, please contact us immediately."
                }
            ]
        },
        {
            title: "Changes to This Policy",
            content: [
                {
                    subtitle: "",
                    text: "We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a notice on TuneSpace. Continued use of TuneSpace after changes constitutes acceptance of the updated policy."
                }
            ]
        },
        {
            title: "Contact Us",
            content: [
                {
                    subtitle: "",
                    text: "If you have questions about this Privacy Policy or how we handle your data, please contact us at privacy@tunespace.com or through our contact page."
                }
            ]
        }
    ];

    return (
        <div className="legal-wrapper">
            <Navbar />

            <div className="legal-page">
                <div className="legal-header">
                    <div className="legal-header-content">
                        <div className="breadcrumb">
                            <Link to="/">Home</Link>
                            <span>/</span>
                            <span>Privacy Policy</span>
                        </div>
                        <h1>Privacy Policy</h1>
                        <p className="last-updated">Last updated: {lastUpdated}</p>
                    </div>
                </div>

                <div className="legal-container">
                    <div className="legal-sidebar">
                        <div className="sidebar-sticky">
                            <h3>Quick Navigation</h3>
                            <nav className="legal-nav">
                                {sections.map((section, index) => (
                                    <a
                                        key={index}
                                        href={`#section-${index}`}
                                        className="nav-link"
                                    >
                                        {section.title}
                                    </a>
                                ))}
                            </nav>
                            <div className="sidebar-cta">
                                <p>Questions about privacy?</p>
                                <Link to="/contact" className="sidebar-btn">Contact Us</Link>
                            </div>
                        </div>
                    </div>

                    <div className="legal-content">
                        <div className="intro-section">
                            <p className="intro-text">
                                At TuneSpace, we take your privacy seriously. This Privacy Policy explains how we
                                collect, use, share, and protect your personal information when you use our service.
                            </p>
                            <p className="intro-text">
                                By using TuneSpace, you agree to the collection and use of information in accordance
                                with this policy.
                            </p>
                        </div>

                        {sections.map((section, index) => (
                            <section key={index} id={`section-${index}`} className="legal-section">
                                <h2>{section.title}</h2>
                                {section.content.map((item, itemIndex) => (
                                    <div key={itemIndex} className="content-block">
                                        {item.subtitle && <h3>{item.subtitle}</h3>}
                                        <p>{item.text}</p>
                                    </div>
                                ))}
                            </section>
                        ))}

                        <div className="legal-footer">
                            <p>
                                This Privacy Policy is effective as of {lastUpdated} and will remain in effect
                                except with respect to any changes in its provisions in the future, which will be
                                in effect immediately after being posted on this page.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <BottomBar />
        </div>
    );
}