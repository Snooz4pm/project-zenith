'use client';

import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ArrowUpRight, TrendingUp, BookOpen, BarChart3, Compass, User, LogOut, Newspaper, LineChart, Wallet } from 'lucide-react';
import './CardNav.css';

interface NavLink {
    label: string;
    href: string;
    ariaLabel: string;
    icon?: React.ReactNode;
}

interface NavItem {
    label: string;
    bgColor: string;
    textColor: string;
    links: NavLink[];
}

interface CardNavProps {
    className?: string;
    ease?: string;
    baseColor?: string;
    menuColor?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
}

const CardNav = ({
    className = '',
    ease = 'power3.out',
    baseColor = '#0a0a0f',
    menuColor = '#fff',
    buttonBgColor = 'linear-gradient(135deg, #00f0ff, #a855f7)',
    buttonTextColor = '#fff'
}: CardNavProps) => {
    const { data: session, status } = useSession();
    const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const navRef = useRef<HTMLElement>(null);
    const cardsRef = useRef<HTMLDivElement[]>([]);
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    // Define navigation items with all site pages
    const items: NavItem[] = [
        {
            label: "Trade",
            bgColor: "#0D1F2D",
            textColor: "#fff",
            links: [
                { label: "Crypto", href: "/crypto", ariaLabel: "View Crypto Assets" },
                { label: "Stocks", href: "/stocks", ariaLabel: "View Stocks" },
                { label: "Forex", href: "/forex", ariaLabel: "View Forex Pairs" },
                { label: "Trading", href: "/trading", ariaLabel: "Open Trading Platform" },
            ]
        },
        {
            label: "Signals",
            bgColor: "#1a1033",
            textColor: "#fff",
            links: [
                { label: "Active Signals", href: "/signals", ariaLabel: "View Active Signals" },
                { label: "News", href: "/news", ariaLabel: "Market News" },
            ]
        },
        {
            label: "Learn",
            bgColor: "#271E37",
            textColor: "#fff",
            links: [
                { label: "Academy", href: "/learning", ariaLabel: "Learning Academy" },
                { label: "Paths", href: "/learn/paths", ariaLabel: "Learning Paths" },
            ]
        }
    ];

    const calculateHeight = () => {
        const navEl = navRef.current;
        if (!navEl) return 280;

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) {
            const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement;
            if (contentEl) {
                const wasVisible = contentEl.style.visibility;
                const wasPointerEvents = contentEl.style.pointerEvents;
                const wasPosition = contentEl.style.position;
                const wasHeight = contentEl.style.height;

                contentEl.style.visibility = 'visible';
                contentEl.style.pointerEvents = 'auto';
                contentEl.style.position = 'static';
                contentEl.style.height = 'auto';

                contentEl.offsetHeight;

                const topBar = 60;
                const padding = 16;
                const contentHeight = contentEl.scrollHeight;

                contentEl.style.visibility = wasVisible;
                contentEl.style.pointerEvents = wasPointerEvents;
                contentEl.style.position = wasPosition;
                contentEl.style.height = wasHeight;

                return topBar + contentHeight + padding;
            }
        }
        return 280;
    };

    const createTimeline = () => {
        const navEl = navRef.current;
        if (!navEl) return null;

        gsap.set(navEl, { height: 60, overflow: 'hidden' });
        gsap.set(cardsRef.current, { y: 50, opacity: 0 });

        const tl = gsap.timeline({ paused: true });

        tl.to(navEl, {
            height: calculateHeight,
            duration: 0.4,
            ease
        });

        tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');

        return tl;
    };

    useLayoutEffect(() => {
        const tl = createTimeline();
        tlRef.current = tl;

        return () => {
            tl?.kill();
            tlRef.current = null;
        };
    }, [ease, items]);

    useLayoutEffect(() => {
        const handleResize = () => {
            if (!tlRef.current) return;

            if (isExpanded) {
                const newHeight = calculateHeight();
                gsap.set(navRef.current, { height: newHeight });

                tlRef.current.kill();
                const newTl = createTimeline();
                if (newTl) {
                    newTl.progress(1);
                    tlRef.current = newTl;
                }
            } else {
                tlRef.current.kill();
                const newTl = createTimeline();
                if (newTl) {
                    tlRef.current = newTl;
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isExpanded]);

    const toggleMenu = () => {
        const tl = tlRef.current;
        if (!tl) return;
        if (!isExpanded) {
            setIsHamburgerOpen(true);
            setIsExpanded(true);
            tl.play(0);
        } else {
            setIsHamburgerOpen(false);
            tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
            tl.reverse();
        }
    };

    const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
        if (el) cardsRef.current[i] = el;
    };

    const handleLinkClick = () => {
        // Close menu when a link is clicked
        if (isExpanded && tlRef.current) {
            setIsHamburgerOpen(false);
            tlRef.current.eventCallback('onReverseComplete', () => setIsExpanded(false));
            tlRef.current.reverse();
        }
    };

    return (
        <div className={`card-nav-container ${className}`}>
            <nav
                ref={navRef}
                className={`card-nav ${isExpanded ? 'open' : ''}`}
                style={{ backgroundColor: baseColor }}
            >
                <div className="card-nav-top">
                    <div
                        className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
                        onClick={toggleMenu}
                        role="button"
                        aria-label={isExpanded ? 'Close menu' : 'Open menu'}
                        tabIndex={0}
                        style={{ color: menuColor }}
                    >
                        <div className="hamburger-line" />
                        <div className="hamburger-line" />
                    </div>

                    <Link href="/" className="logo-container" onClick={handleLinkClick}>
                        <span className="logo-text">
                            <span className="logo-zenith">Zenith</span>
                            <span className="logo-score">Score</span>
                        </span>
                    </Link>

                    {status === 'authenticated' ? (
                        <Link
                            href="/command-center"
                            className="card-nav-cta-button"
                            style={{ background: buttonBgColor, color: buttonTextColor }}
                            onClick={handleLinkClick}
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <Link
                            href="/auth/login"
                            className="card-nav-cta-button"
                            style={{ background: buttonBgColor, color: buttonTextColor }}
                            onClick={handleLinkClick}
                        >
                            Get Started
                        </Link>
                    )}
                </div>

                <div className="card-nav-content" aria-hidden={!isExpanded}>
                    {items.map((item, idx) => (
                        <div
                            key={`${item.label}-${idx}`}
                            className="nav-card"
                            ref={setCardRef(idx)}
                            style={{ backgroundColor: item.bgColor, color: item.textColor }}
                        >
                            <div className="nav-card-label">{item.label}</div>
                            <div className="nav-card-links">
                                {item.links?.map((lnk, i) => (
                                    <Link
                                        key={`${lnk.label}-${i}`}
                                        className="nav-card-link"
                                        href={lnk.href}
                                        aria-label={lnk.ariaLabel}
                                        onClick={handleLinkClick}
                                    >
                                        <ArrowUpRight size={14} className="nav-card-link-icon" aria-hidden="true" />
                                        {lnk.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* User/Auth Card */}
                    <div
                        className="nav-card"
                        ref={setCardRef(items.length)}
                        style={{ backgroundColor: '#1a1a2e', color: '#fff' }}
                    >
                        <div className="nav-card-label">
                            {status === 'authenticated' ? 'Account' : 'Join'}
                        </div>
                        <div className="nav-card-links">
                            {status === 'authenticated' ? (
                                <>
                                    <Link
                                        className="nav-card-link"
                                        href="/profile"
                                        onClick={handleLinkClick}
                                    >
                                        <User size={14} className="nav-card-link-icon" />
                                        Profile
                                    </Link>
                                    <Link
                                        className="nav-card-link"
                                        href="/command-center"
                                        onClick={handleLinkClick}
                                    >
                                        <Compass size={14} className="nav-card-link-icon" />
                                        Command Center
                                    </Link>
                                    <button
                                        className="nav-card-link nav-card-link-button"
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                    >
                                        <LogOut size={14} className="nav-card-link-icon" />
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        className="nav-card-link"
                                        href="/auth/login"
                                        onClick={handleLinkClick}
                                    >
                                        <ArrowUpRight size={14} className="nav-card-link-icon" />
                                        Sign In
                                    </Link>
                                    <Link
                                        className="nav-card-link"
                                        href="/auth/register"
                                        onClick={handleLinkClick}
                                    >
                                        <ArrowUpRight size={14} className="nav-card-link-icon" />
                                        Create Account
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default CardNav;
