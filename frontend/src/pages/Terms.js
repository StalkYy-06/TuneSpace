import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import "../styles/legal.css";

export default function Terms() {
    const lastUpdated = "February 6, 2025";

    const sections = [
        {
            title: "Acceptance of Terms",
            content: [
                {
                    subtitle: "",
                    text: "By accessing or using TuneSpace, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using TuneSpace."
                }
            ]
        },
        {
            title: "User Accounts",
            content: [
                {
                    subtitle: "Account Creation",
                    text: "To use certain features of TuneSpace, you must create an account. You must provide accurate, complete, and current information. You are responsible for maintaining the confidentiality of your account credentials."
                },
                {
                    subtitle: "Account Security",
                    text: "You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use of your account or any other security breach."
                },
                {
                    subtitle: "Account Termination",
                    text: "We reserve the right to suspend or terminate your account at any time for any reason, including violation of these Terms. You may also delete your account at any time through your profile settings."
                }
            ]
        },
        {
            title: "User Content",
            content: [
                {
                    subtitle: "Your Content",
                    text: "You retain ownership of content you post on TuneSpace, including reviews, ratings, comments, and profile information. By posting content, you grant TuneSpace a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content on the platform."
                },
                {
                    subtitle: "Content Guidelines",
                    text: "You agree not to post content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, invasive of privacy, hateful, or racially, ethnically, or otherwise objectionable."
                },
                {
                    subtitle: "Content Moderation",
                    text: "We reserve the right to remove any content that violates these Terms or is otherwise objectionable. We may also ban users who repeatedly violate our content guidelines."
                },
                {
                    subtitle: "Copyright",
                    text: "Do not post content that infringes on others' intellectual property rights. If you believe content on TuneSpace infringes your copyright, contact us at legal@tunespace.com."
                }
            ]
        },
        {
            title: "Acceptable Use",
            content: [
                {
                    subtitle: "Prohibited Activities",
                    text: "You may not: (a) use TuneSpace for any illegal purpose; (b) attempt to gain unauthorized access to our systems; (c) interfere with or disrupt TuneSpace or servers; (d) create multiple accounts to manipulate ratings or reviews; (e) use automated systems (bots) without permission; (f) harvest or collect user data; (g) impersonate others; (h) spam users or post unsolicited commercial content."
                },
                {
                    subtitle: "Review Integrity",
                    text: "Reviews must be honest and based on your genuine experience. Do not post fake reviews, manipulate ratings, or accept compensation for biased reviews."
                }
            ]
        },
        {
            title: "Third-Party Services",
            content: [
                {
                    subtitle: "External Links",
                    text: "TuneSpace may contain links to third-party websites or services (e.g., Spotify, Deezer). We are not responsible for the content or practices of these third parties."
                },
                {
                    subtitle: "Music Data",
                    text: "Music information, album covers, and artist data are provided by third-party APIs (primarily Deezer). We do not guarantee the accuracy or availability of this data."
                }
            ]
        },
        {
            title: "Intellectual Property",
            content: [
                {
                    subtitle: "TuneSpace Rights",
                    text: "TuneSpace, including its design, logo, features, and functionality, is owned by TuneSpace and protected by copyright, trademark, and other intellectual property laws."
                },
                {
                    subtitle: "Limited License",
                    text: "We grant you a limited, non-exclusive, non-transferable license to access and use TuneSpace for personal, non-commercial purposes."
                }
            ]
        },
        {
            title: "Disclaimers",
            content: [
                {
                    subtitle: "As-Is Service",
                    text: "TuneSpace is provided 'as is' without warranties of any kind, either express or implied. We do not guarantee that TuneSpace will be uninterrupted, secure, or error-free."
                },
                {
                    subtitle: "User Content",
                    text: "We are not responsible for user-generated content. Reviews and ratings represent the opinions of individual users and do not reflect the views of TuneSpace."
                },
                {
                    subtitle: "Music Availability",
                    text: "We do not host music files. Links to external streaming services may become unavailable without notice."
                }
            ]
        },
        {
            title: "Limitation of Liability",
            content: [
                {
                    subtitle: "",
                    text: "To the maximum extent permitted by law, TuneSpace shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from: (a) your use or inability to use TuneSpace; (b) unauthorized access to or alteration of your content; (c) any conduct or content of third parties on TuneSpace."
                }
            ]
        },
        {
            title: "Indemnification",
            content: [
                {
                    subtitle: "",
                    text: "You agree to indemnify and hold harmless TuneSpace and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from: (a) your use of TuneSpace; (b) your violation of these Terms; (c) your violation of any rights of another party; (d) content you post on TuneSpace."
                }
            ]
        },
        {
            title: "Changes to Terms",
            content: [
                {
                    subtitle: "",
                    text: "We reserve the right to modify these Terms at any time. We will notify users of significant changes by email or through a notice on TuneSpace. Your continued use of TuneSpace after changes constitutes acceptance of the modified Terms."
                }
            ]
        },
        {
            title: "Governing Law",
            content: [
                {
                    subtitle: "",
                    text: "These Terms shall be governed by and construed in accordance with the laws of Nepal, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of TuneSpace shall be subject to the exclusive jurisdiction of the courts of Nepal."
                }
            ]
        },
        {
            title: "Contact Information",
            content: [
                {
                    subtitle: "",
                    text: "If you have any questions about these Terms of Service, please contact us at legal@tunespace.com or through our contact page."
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
                            <span>Terms of Service</span>
                        </div>
                        <h1>Terms of Service</h1>
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
                                <p>Need clarification?</p>
                                <Link to="/contact" className="sidebar-btn">Contact Us</Link>
                            </div>
                        </div>
                    </div>

                    <div className="legal-content">
                        <div className="intro-section">
                            <p className="intro-text">
                                Welcome to TuneSpace! These Terms of Service govern your use of our platform.
                                Please read them carefully before using TuneSpace.
                            </p>
                            <p className="intro-text">
                                By creating an account or using TuneSpace, you acknowledge that you have read,
                                understood, and agree to be bound by these Terms.
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
                                These Terms of Service constitute the entire agreement between you and TuneSpace
                                regarding your use of the platform. If any provision of these Terms is found to be
                                unenforceable, the remaining provisions will continue in full force and effect.
                            </p>
                            <p className="effective-date">
                                Effective Date: {lastUpdated}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <BottomBar />
        </div>
    );
}