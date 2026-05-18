"use client";

import React, { useEffect } from "react";

// Shadcn-style button (square-ish, border-radius: 6px, matching your dashboard style)
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "outline" | "ghost";
    children?: React.ReactNode;
    className?: string;
};

function Button({
    children,
    variant = "default",
    className = "",
    ...props
}: ButtonProps) {
    const base: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        borderRadius: 6,
        padding: "8px 16px",
        transition: "all 0.15s ease",
        border: "1px solid transparent",
        outline: "none",
        whiteSpace: "nowrap",
    };
    const variants: Record<
        "default" | "outline" | "ghost",
        { background: string; color: string; borderColor: string }
    > = {
        default: {
            background: "#2D6A56",
            color: "#fff",
            borderColor: "#2D6A56",
        },
        outline: {
            background: "transparent",
            color: "#1A2E28",
            borderColor: "#D1D5DB",
        },
        ghost: {
            background: "transparent",
            color: "#4A5568",
            borderColor: "transparent",
        },
    };
    return (
        <button
            style={{ ...base, ...variants[variant] }}
            className={`shadcn-btn ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

// Shadcn-style card
type CardProps = React.HTMLAttributes<HTMLDivElement> & {
    style?: React.CSSProperties;
    children?: React.ReactNode;
};

function Card({ children, style = {}, ...rest }: CardProps) {
    return (
        <div
            style={{
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                ...style,
            }}
            {...rest}
        >
            {children}
        </div>
    );
}

// Badge — pill style used in shadcn
type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
    style?: React.CSSProperties;
    children?: React.ReactNode;
};

function Badge({ children, style = {}, ...rest }: BadgeProps) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#F0FDF9",
                color: "#2D6A56",
                border: "1px solid #BBF0DF",
                borderRadius: 99,
                padding: "3px 10px",
                fontSize: 12,
                fontWeight: 500,
                ...style,
            }}
            {...rest}
        >
            {children}
        </span>
    );
}

// Floating document bot
function BotIllustration() {
    return (
        <div
            style={{
                position: "relative",
                width: 280,
                height: 300,
                margin: "0 auto",
            }}
        >
            {/* subtle glow */}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%,-50%)",
                    width: 200,
                    height: 200,
                    background:
                        "radial-gradient(circle, rgba(45,106,86,0.12) 0%, transparent 70%)",
                    borderRadius: "50%",
                }}
            />

            {/* Bot body */}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 110,
                    height: 130,
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "55px 55px 44px 44px",
                    boxShadow:
                        "0 8px 32px rgba(45,106,86,0.14), 0 1px 4px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "docFloat 3.2s ease-in-out infinite",
                }}
            >
                <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                    {[0, 1].map((i) => (
                        <div
                            key={i}
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: "#2D6A56",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <div
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    background: "#9DDECE",
                                }}
                            />
                        </div>
                    ))}
                </div>
                <div
                    style={{
                        width: 26,
                        height: 9,
                        borderRadius: "0 0 13px 13px",
                        border: "1.5px solid #2D6A56",
                        borderTop: "none",
                    }}
                />
                <div
                    style={{
                        marginTop: 10,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#BBF0DF",
                    }}
                />
            </div>

            {/* Floating cards */}
            {[
                { label: "RESUME.pdf", top: "8%", left: "-4%", delay: "0s" },
                {
                    label: "CONTRACT.docx",
                    top: "14%",
                    right: "-6%",
                    delay: "0.7s",
                },
                {
                    label: "REPORT.pdf",
                    bottom: "12%",
                    left: "2%",
                    delay: "1.3s",
                },
            ].map((c, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        ...c,
                        background: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: 8,
                        padding: "6px 11px",
                        boxShadow: "0 2px 10px rgba(45,106,86,0.1)",
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#374151",
                        animation: `docFloat 3.2s ease-in-out ${c.delay} infinite`,
                        whiteSpace: "nowrap",
                    }}
                >
                    <svg width="13" height="14" viewBox="0 0 13 14" fill="none">
                        <path
                            d="M2 1h7l3 3v9H2V1z"
                            stroke="#2D6A56"
                            strokeWidth="1.2"
                            fill="none"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M9 1v3h3"
                            stroke="#2D6A56"
                            strokeWidth="1.2"
                            fill="none"
                        />
                        <path
                            d="M4 7h5M4 9.5h3.5"
                            stroke="#9DDECE"
                            strokeWidth="1"
                            strokeLinecap="round"
                        />
                    </svg>
                    {c.label}
                </div>
            ))}

            {/* Chat bubble */}
            <div
                style={{
                    position: "absolute",
                    bottom: "6%",
                    right: "-2%",
                    background: "#2D6A56",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px 10px 3px 10px",
                    padding: "7px 12px",
                    fontSize: 11,
                    fontWeight: 500,
                    boxShadow: "0 4px 14px rgba(45,106,86,0.28)",
                    animation: "docFloat 3.2s ease-in-out 1s infinite",
                    whiteSpace: "nowrap",
                }}
            >
                Ask me anything ✨
            </div>
        </div>
    );
}

// Mini feature card preview components
function ChatPreview() {
    return (
        <div
            style={{
                padding: "10px 12px",
                background: "#F9FAFB",
                borderRadius: 6,
                border: "1px solid #F3F4F6",
            }}
        >
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <div
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "#2D6A56",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        color: "#fff",
                        fontWeight: 700,
                    }}
                >
                    AI
                </div>
                <div
                    style={{
                        background: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: 6,
                        padding: "5px 10px",
                        fontSize: 11,
                        color: "#374151",
                        flex: 1,
                    }}
                >
                    What are the key findings?
                </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div
                    style={{
                        background: "#2D6A56",
                        color: "#fff",
                        borderRadius: 6,
                        padding: "5px 10px",
                        fontSize: 11,
                        maxWidth: "80%",
                    }}
                >
                    34% growth in Q3, led by...
                </div>
            </div>
        </div>
    );
}

function SummaryPreview() {
    return (
        <div
            style={{
                padding: "10px 12px",
                background: "#F9FAFB",
                borderRadius: 6,
                border: "1px solid #F3F4F6",
            }}
        >
            {[
                "Introduction & Background",
                "Key Findings",
                "Recommendations",
            ].map((item, i) => (
                <div
                    key={i}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: i < 2 ? 7 : 0,
                    }}
                >
                    <div
                        style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: i === 0 ? "#2D6A56" : "#9DDECE",
                            flexShrink: 0,
                        }}
                    />
                    <div
                        style={{
                            height: 7,
                            background: i === 0 ? "#D1FAE5" : "#F3F4F6",
                            borderRadius: 4,
                            flex: 1,
                        }}
                    />
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>
                        {item}
                    </span>
                </div>
            ))}
        </div>
    );
}

function ProjectsPreview() {
    return (
        <div
            style={{
                padding: "10px 12px",
                background: "#F9FAFB",
                borderRadius: 6,
                border: "1px solid #F3F4F6",
                display: "flex",
                flexDirection: "column",
                gap: 6,
            }}
        >
            {[
                { name: "Q3 Report", docs: 4, tag: "General Purpose" },
                { name: "Legal Docs", docs: 7, tag: "Legal" },
                { name: "HR Files", docs: 2, tag: "HR" },
            ].map((p, i) => (
                <div
                    key={i}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#fff",
                        border: "1px solid #E5E7EB",
                        borderRadius: 6,
                        padding: "5px 9px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                        }}
                    >
                        <svg
                            width="13"
                            height="14"
                            viewBox="0 0 13 14"
                            fill="none"
                        >
                            <path
                                d="M2 3h4l1.5 1.5H11V12H2V3z"
                                stroke="#2D6A56"
                                strokeWidth="1.1"
                                fill="none"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 500,
                                color: "#374151",
                            }}
                        >
                            {p.name}
                        </span>
                    </div>
                    <span
                        style={{
                            fontSize: 10,
                            color: "#6B7280",
                            background: "#F3F4F6",
                            padding: "2px 7px",
                            borderRadius: 4,
                        }}
                    >
                        {p.docs} docs
                    </span>
                </div>
            ))}
        </div>
    );
}

const FEATURE_CARDS = [
    {
        icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                    d="M3 2h9l4 4v10H3V2z"
                    stroke="#2D6A56"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinejoin="round"
                />
                <path
                    d="M12 2v4h4"
                    stroke="#2D6A56"
                    strokeWidth="1.4"
                    fill="none"
                />
                <path
                    d="M6 10h6M6 12.5h4"
                    stroke="#9DDECE"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                />
            </svg>
        ),
        title: "Chat with any Document",
        subtitle: "Instant answers from your files",
        preview: <ChatPreview />,
    },
    {
        icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="3" y="4" width="12" height="2" rx="1" fill="#2D6A56" />
                <rect
                    x="3"
                    y="8"
                    width="9"
                    height="2"
                    rx="1"
                    fill="#2D6A56"
                    opacity="0.7"
                />
                <rect
                    x="3"
                    y="12"
                    width="6"
                    height="2"
                    rx="1"
                    fill="#2D6A56"
                    opacity="0.4"
                />
                <circle cx="13.5" cy="12.5" r="3" fill="#2D6A56" />
                <path
                    d="M12.2 12.5l1 1 1.8-1.8"
                    stroke="#fff"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        ),
        title: "Smart Summarization",
        subtitle: "Condense long docs in seconds",
        preview: <SummaryPreview />,
    },
    {
        icon: (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect
                    x="2"
                    y="6"
                    width="14"
                    height="10"
                    rx="2"
                    stroke="#2D6A56"
                    strokeWidth="1.4"
                    fill="none"
                />
                <path
                    d="M6 6V4h3l2 2"
                    stroke="#2D6A56"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinejoin="round"
                />
                <path
                    d="M6 11h6M6 13.5h4"
                    stroke="#9DDECE"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                />
            </svg>
        ),
        title: "Multi-Project Workspace",
        subtitle: "Organize docs by project",
        preview: <ProjectsPreview />,
    },
];

const STATS = [
    { value: "10K+", label: "Active Users" },
    { value: "2M+", label: "Documents Processed" },
    { value: "96%", label: "Accuracy Rate" },
    { value: "24/7", label: "Availability" },
];

export default function HeroSection() {
    useEffect(() => {
        const style = document.createElement("style");
        style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap');
      @keyframes docFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.35} }
      .shadcn-btn:hover { filter: brightness(0.94); }
      .shadcn-btn.outline:hover { background: #F9FAFB !important; }
      .feat-card { transition: box-shadow 0.2s, transform 0.2s; }
      .feat-card:hover { box-shadow: 0 8px 28px rgba(45,106,86,0.14) !important; transform: translateY(-3px); }
    `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <main
            style={{
                fontFamily: "'Geist', sans-serif",
                background: "#F2F4F3",
                color: "#1A2E28",
            }}
        >
            {/* ── Hero ── */}
            <section
                style={{
                    maxWidth: 1140,
                    margin: "0 auto",
                    padding: "48px 40px 56px",
                }}
            >
                {/* Badge */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: 28,
                        animation: "fadeUp 0.5s ease both",
                    }}
                >
                    <Badge>
                        <span
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#2D6A56",
                                animation: "blink 1.6s ease infinite",
                                display: "inline-block",
                            }}
                        />
                        Highly Demanded · 50,000+ teams worldwide
                    </Badge>
                </div>

                {/* 3-col layout */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "180px 1fr 220px",
                        gap: 32,
                        alignItems: "center",
                    }}
                >
                    {/* Left */}
                    <div style={{ animation: "fadeUp 0.6s ease 0.1s both" }}>
                        <div
                            style={{
                                fontFamily: "'Geist', sans-serif",
                                fontSize: 44,
                                fontWeight: 800,
                                color: "#1A2E28",
                                lineHeight: 1,
                                letterSpacing: "-1px",
                            }}
                        >
                            50K+
                        </div>
                        <div
                            style={{
                                fontSize: 13,
                                color: "#6B7280",
                                marginTop: 3,
                                marginBottom: 18,
                            }}
                        >
                            Active Users
                        </div>
                        {/* Download button — shadcn icon button */}
                        <button
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 6,
                                background: "#2D6A56",
                                border: "1px solid #2D6A56",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(45,106,86,0.25)",
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                            >
                                <path
                                    d="M8 3v8M4 8l4 4 4-4"
                                    stroke="#fff"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                        {/* Dashed arrow */}
                        <svg
                            width="64"
                            height="52"
                            viewBox="0 0 64 52"
                            fill="none"
                            style={{ marginTop: 6, opacity: 0.35 }}
                        >
                            <path
                                d="M8 8 Q32 2 56 32"
                                stroke="#2D6A56"
                                strokeWidth="1.4"
                                strokeDasharray="4 3"
                                fill="none"
                            />
                            <path
                                d="M52 28l4 4-5 1"
                                stroke="#2D6A56"
                                strokeWidth="1.4"
                                strokeLinecap="round"
                                fill="none"
                            />
                        </svg>
                    </div>

                    {/* Center */}
                    <div
                        style={{
                            textAlign: "center",
                            animation: "fadeUp 0.6s ease 0.15s both",
                        }}
                    >
                        <h1
                            style={{
                                fontFamily: "'Geist', sans-serif",
                                fontSize: 48,
                                fontWeight: 800,
                                color: "#1A2E28",
                                lineHeight: 1.1,
                                letterSpacing: "-1.8px",
                                margin: "0 0 14px",
                            }}
                        >
                            Document Intelligence,{" "}
                            <span style={{ color: "#2D6A56" }}>
                                Simplified.
                            </span>{" "}
                            <span style={{ fontSize: 40 }}>📄</span>
                        </h1>
                        <p
                            style={{
                                fontSize: 16,
                                color: "#6B7280",
                                lineHeight: 1.65,
                                maxWidth: 440,
                                margin: "0 auto 24px",
                            }}
                        >
                            Smart, instant, 24/7 AI to extract insights and
                            answers from your documents
                        </p>
                        {/* Shadcn-style CTA buttons */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 10,
                            }}
                        >
                            <Button>
                                Try For Free
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                >
                                    <path
                                        d="M2.5 7h9M7.5 3l4 4-4 4"
                                        stroke="#fff"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </Button>
                            <Button variant="outline">View Dashboard</Button>
                        </div>
                        {/* Bot illustration */}
                        <div style={{ marginTop: 36 }}>
                            <BotIllustration />
                        </div>
                    </div>

                    {/* Right — review card */}
                    <div style={{ animation: "fadeUp 0.6s ease 0.2s both" }}>
                        <Card style={{ padding: "16px 18px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    marginBottom: 10,
                                }}
                            >
                                <div
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: "50%",
                                        background: "#2D6A56",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#fff",
                                        fontWeight: 700,
                                        fontSize: 14,
                                    }}
                                >
                                    J
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            fontSize: 13.5,
                                            color: "#1A2E28",
                                        }}
                                    >
                                        Jahangir
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: "#9CA3AF",
                                        }}
                                    >
                                        Product Manager
                                    </div>
                                </div>
                            </div>
                            <p
                                style={{
                                    fontSize: 13,
                                    color: "#4A5568",
                                    lineHeight: 1.55,
                                    margin: 0,
                                }}
                            >
                                "Tried many, but Documind stands out! Our team
                                saves hours every week." 🔥
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ── Feature Cards ── */}
            <section
                style={{
                    maxWidth: 1140,
                    margin: "0 auto",
                    padding: "0 40px 64px",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 16,
                    }}
                >
                    {FEATURE_CARDS.map((card, i) => (
                        <Card
                            key={i}
                            className="feat-card"
                            style={{
                                padding: 20,
                                cursor: "pointer",
                                animation: `fadeUp 0.6s ease ${0.1 + i * 0.12}s both`,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    marginBottom: 14,
                                }}
                            >
                                <div
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 6,
                                        background: "#F0FDF9",
                                        border: "1px solid #BBF0DF",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    {card.icon}
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            fontSize: 14,
                                            color: "#1A2E28",
                                        }}
                                    >
                                        {card.title}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: "#9CA3AF",
                                            marginTop: 1,
                                        }}
                                    >
                                        {card.subtitle}
                                    </div>
                                </div>
                            </div>
                            {card.preview}
                        </Card>
                    ))}
                </div>
            </section>

            {/* ── Stats Bar ── */}
            <section
                style={{
                    maxWidth: 1140,
                    margin: "0 auto",
                    padding: "0 40px 72px",
                }}
            >
                <Card
                    style={{
                        background: "#1E4D3F",
                        border: "1px solid #2D6A56",
                        padding: "36px 48px",
                        display: "flex",
                        justifyContent: "space-around",
                        alignItems: "center",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* subtle grid texture */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundImage:
                                "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                            backgroundSize: "32px 32px",
                        }}
                    />
                    {STATS.map((s, i) => (
                        <div
                            key={i}
                            style={{
                                textAlign: "center",
                                position: "relative",
                            }}
                        >
                            <div
                                style={{
                                    fontFamily: "'Geist', sans-serif",
                                    fontSize: 36,
                                    fontWeight: 800,
                                    color: "#fff",
                                    letterSpacing: "-1px",
                                    lineHeight: 1,
                                }}
                            >
                                {s.value}
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    color: "rgba(255,255,255,0.55)",
                                    marginTop: 5,
                                }}
                            >
                                {s.label}
                            </div>
                        </div>
                    ))}
                </Card>
            </section>
        </main>
    );
}
