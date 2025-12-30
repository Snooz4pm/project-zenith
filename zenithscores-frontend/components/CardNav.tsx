'use client';

import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight, TrendingUp, Bitcoin, Newspaper,
  GraduationCap, BarChart3, User, Home, Zap,
  ChevronLeft, ChevronRight
} from 'lucide-react';

/**
 * CardNav - GSAP-powered animated navigation with Zenith theme
 * Adapted from reactbits.dev CardNav component
 */

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
  icon?: React.ReactNode;
}

interface CardNavProps {
  className?: string;
  ease?: string;
}

// Zenith navigation items
const ZENITH_NAV_ITEMS: NavItem[] = [
  {
    label: "Markets",
    bgColor: "rgba(0, 240, 255, 0.1)",
    textColor: "#00f0ff",
    icon: <TrendingUp size={20} />,
    links: [
      { label: "Stocks", href: "/stocks", ariaLabel: "Stock Market", icon: <TrendingUp size={14} /> },
      { label: "Crypto", href: "/crypto", ariaLabel: "Cryptocurrency", icon: <Bitcoin size={14} /> },
      { label: "Forex", href: "/forex", ariaLabel: "Forex Trading", icon: <TrendingUp size={14} /> },
    ]
  },
  {
    label: "Trading",
    bgColor: "rgba(168, 85, 247, 0.1)",
    textColor: "#a855f7",
    icon: <BarChart3 size={20} />,
    links: [
      { label: "Signals", href: "/signals", ariaLabel: "Trading Signals", icon: <Zap size={14} /> },
      { label: "Portfolio", href: "/trading", ariaLabel: "Portfolio", icon: <TrendingUp size={14} /> },
      { label: "Community", href: "/community", ariaLabel: "Community", icon: <User size={14} /> },
    ]
  },
  {
    label: "Learn",
    bgColor: "rgba(16, 185, 129, 0.1)",
    textColor: "#10b981",
    icon: <GraduationCap size={20} />,
    links: [
      { label: "Academy", href: "/learning", ariaLabel: "Learning Academy", icon: <GraduationCap size={14} /> },
      { label: "News", href: "/news", ariaLabel: "Market News", icon: <Newspaper size={14} /> },
      { label: "Profile", href: "/profile", ariaLabel: "Your Profile", icon: <User size={14} /> },
    ]
  }
];

export default function CardNav({ className = '', ease = 'power3.out' }: CardNavProps) {
  const pathname = usePathname();
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const collapseTlRef = useRef<gsap.core.Timeline | null>(null);

  // Market data state for dynamic indicators
  const [marketState, setMarketState] = useState<{
    stocks: 'up' | 'down' | 'neutral';
    crypto: 'up' | 'down' | 'neutral';
    portfolio: 'up' | 'down' | 'neutral';
  }>({ stocks: 'neutral', crypto: 'neutral', portfolio: 'neutral' });

  useEffect(() => {
    setMounted(true);

    // Fetch market data to determine colors
    const fetchMarketData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';

        // Fetch stocks data
        const stocksRes = await fetch(`${apiUrl}/api/v1/stocks/top?limit=5`);
        const stocksData = await stocksRes.json();

        // Fetch crypto data
        const cryptoRes = await fetch(`${apiUrl}/api/v1/crypto/top?limit=5`);
        const cryptoData = await cryptoRes.json();

        // Calculate average market movement for stocks
        if (stocksData?.data?.length) {
          const avgChange = stocksData.data.reduce((sum: number, s: { price_change_24h?: number }) =>
            sum + (s.price_change_24h || 0), 0) / stocksData.data.length;
          setMarketState(prev => ({
            ...prev,
            stocks: avgChange > 0.5 ? 'up' : avgChange < -0.5 ? 'down' : 'neutral'
          }));
        }

        // Calculate average market movement for crypto
        if (cryptoData?.data?.length) {
          const avgChange = cryptoData.data.reduce((sum: number, c: { price_change_24h?: number }) =>
            sum + (c.price_change_24h || 0), 0) / cryptoData.data.length;
          setMarketState(prev => ({
            ...prev,
            crypto: avgChange > 1 ? 'up' : avgChange < -1 ? 'down' : 'neutral'
          }));
        }

        // Portfolio defaults to combined sentiment
        setMarketState(prev => ({
          ...prev,
          portfolio: prev.stocks === 'up' && prev.crypto === 'up' ? 'up'
            : prev.stocks === 'down' && prev.crypto === 'down' ? 'down'
              : 'neutral'
        }));

      } catch (error) {
        console.log('Market data fetch error, using defaults');
      }
    };

    fetchMarketData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Collapse/Expand animation
  const toggleCollapse = () => {
    if (!containerRef.current || !navRef.current) return;

    if (!isCollapsed) {
      // Close expanded menu first if open
      if (isExpanded) {
        setIsHamburgerOpen(false);
        setIsExpanded(false);
        tlRef.current?.progress(0);
      }

      // Collapse - animate to left circle
      gsap.to(containerRef.current, {
        left: '1rem',
        transform: 'translateX(0)',
        width: '60px',
        duration: 0.4,
        ease: 'power3.out'
      });
      gsap.to(navRef.current, {
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        duration: 0.4,
        ease: 'power3.out'
      });
      setIsCollapsed(true);
    } else {
      // Expand - animate back to center
      gsap.to(containerRef.current, {
        left: '50%',
        transform: 'translateX(-50%)',
        width: '94%',
        duration: 0.4,
        ease: 'power3.out'
      });
      gsap.to(navRef.current, {
        borderRadius: '1rem',
        width: '100%',
        height: '60px', // Reset to default height
        duration: 0.4,
        ease: 'power3.out'
      });
      setIsCollapsed(false);
    }
  };

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 280;

    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      return 400; // Taller on mobile for stacked cards
    }
    return 280;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl || !mounted) return null;

    const validCards = cardsRef.current.filter(Boolean);

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(validCards, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease
    });

    tl.to(validCards, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');

    return tl;
  };

  useLayoutEffect(() => {
    if (!mounted) return;

    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, [ease, mounted]);

  useLayoutEffect(() => {
    if (!mounted) return;

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
  }, [isExpanded, mounted]);

  // Close menu on navigation
  useEffect(() => {
    if (isExpanded) {
      setIsHamburgerOpen(false);
      setIsExpanded(false);
      tlRef.current?.reverse();
    }
  }, [pathname]);

  // Hover handlers - only close on mouse leave (users click to open)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // Clear any pending close timeout when mouse enters
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (isCollapsed) return;
    // Delay close to prevent accidental closures
    hoverTimeoutRef.current = setTimeout(() => {
      if (isExpanded && tlRef.current) {
        setIsHamburgerOpen(false);
        tlRef.current.eventCallback('onReverseComplete', () => setIsExpanded(false));
        tlRef.current.reverse();
      }
    }, 500); // 500ms delay before closing
  };

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
    cardsRef.current[i] = el;
  };

  if (!mounted) {
    return null; // Prevent SSR issues
  }

  return (
    <div
      ref={containerRef}
      className={`card-nav-container ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'absolute',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '94%',
        maxWidth: '900px',
        zIndex: 9999,
      }}
    >
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? 'open' : ''}`}
        style={{
          display: 'block',
          height: '60px',
          background: 'rgba(10, 10, 18, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: isCollapsed ? '50%' : '1rem',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 240, 255, 0.05)',
          position: 'relative',
          overflow: 'hidden',
          willChange: 'height, width, border-radius',
        }}
      >
        {/* Collapsed State - Just expand button */}
        {isCollapsed ? (
          <button
            onClick={toggleCollapse}
            aria-label="Expand navigation"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#00f0ff',
            }}
          >
            <ChevronRight size={24} />
          </button>
        ) : (
          <>
            {/* Top Bar */}
            <div className="card-nav-top">
              {/* Hamburger Menu */}
              <button
                className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
                onClick={toggleMenu}
                aria-label={isExpanded ? 'Close menu' : 'Open menu'}
              >
                <div className="hamburger-line" />
                <div className="hamburger-line" />
              </button>

              {/* Logo */}
              <Link href="/" className="logo-container">
                <span className="logo-text">
                  <span className="logo-zenith">ZENITH</span>
                  <span className="logo-scores">SCORES</span>
                </span>
              </Link>

              {/* Right side: Trade + Collapse */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link href="/trading" className="card-nav-cta-button">
                  <Zap size={14} />
                  Trade
                </Link>

                {/* Collapse Button */}
                <button
                  onClick={toggleCollapse}
                  aria-label="Collapse navigation"
                  style={{
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    color: '#00f0ff',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            </div>

            {/* Navigation Cards */}
            <div className="card-nav-content" aria-hidden={!isExpanded}>
              {ZENITH_NAV_ITEMS.map((item, idx) => {
                return (
                  <div
                    key={`${item.label}-${idx}`}
                    className="nav-card"
                    ref={setCardRef(idx)}
                    style={{
                      backgroundColor: item.bgColor,
                      borderColor: item.textColor,
                    }}
                  >
                    <div className="nav-card-label" style={{ color: item.textColor }}>
                      {item.icon}
                      {item.label}
                    </div>
                    <div className="nav-card-links">
                      {item.links.map((lnk, i) => {
                        // Determine market indicator for specific links
                        const getIndicator = () => {
                          if (lnk.label === 'Stocks') {
                            const state = marketState.stocks;
                            return state !== 'neutral' ? (
                              <span
                                className="market-indicator"
                                style={{
                                  backgroundColor: state === 'up' ? '#10b981' : '#ef4444',
                                  boxShadow: `0 0 8px ${state === 'up' ? '#10b981' : '#ef4444'}`,
                                }}
                                title={`Market ${state === 'up' ? '↑ Up' : '↓ Down'}`}
                              />
                            ) : null;
                          }
                          if (lnk.label === 'Crypto') {
                            const state = marketState.crypto;
                            return state !== 'neutral' ? (
                              <span
                                className="market-indicator"
                                style={{
                                  backgroundColor: state === 'up' ? '#10b981' : '#ef4444',
                                  boxShadow: `0 0 8px ${state === 'up' ? '#10b981' : '#ef4444'}`,
                                }}
                                title={`Market ${state === 'up' ? '↑ Up' : '↓ Down'}`}
                              />
                            ) : null;
                          }
                          if (lnk.label === 'Portfolio') {
                            const state = marketState.portfolio;
                            return state !== 'neutral' ? (
                              <span
                                className="market-indicator"
                                style={{
                                  backgroundColor: state === 'up' ? '#10b981' : '#ef4444',
                                  boxShadow: `0 0 8px ${state === 'up' ? '#10b981' : '#ef4444'}`,
                                }}
                                title={`Portfolio ${state === 'up' ? '↑ Up' : '↓ Down'}`}
                              />
                            ) : null;
                          }
                          return null;
                        };

                        return (
                          <Link
                            key={`${lnk.label}-${i}`}
                            className="nav-card-link"
                            href={lnk.href}
                            aria-label={lnk.ariaLabel}
                            style={{ color: item.textColor }}
                            onClick={() => {
                              setIsHamburgerOpen(false);
                              tlRef.current?.reverse();
                            }}
                          >
                            <ArrowUpRight size={14} className="nav-card-link-icon" />
                            {lnk.label}
                            {getIndicator()}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* Inline Styles */}
      <style jsx>{`
        .card-nav-container {
          /* Positioning handled by inline styles */
        }

        .card-nav {
          /* Base styles handled by inline styles */
        }

        .card-nav-top {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.75rem;
          z-index: 2;
        }

        .hamburger-menu {
          height: 44px;
          width: 44px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          transition: all 0.2s ease;
        }

        .hamburger-menu:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(0, 240, 255, 0.3);
        }

        .hamburger-line {
          width: 20px;
          height: 2px;
          background: #00f0ff;
          transition: transform 0.25s ease, opacity 0.2s ease;
          transform-origin: 50% 50%;
        }

        .hamburger-menu.open .hamburger-line:first-child {
          transform: translateY(4px) rotate(45deg);
        }

        .hamburger-menu.open .hamburger-line:last-child {
          transform: translateY(-4px) rotate(-45deg);
        }

        .logo-container {
          display: flex;
          align-items: center;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          text-decoration: none;
        }

        .logo-text {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-weight: 800;
          font-size: 18px;
          letter-spacing: -0.5px;
        }

        .logo-zenith {
          color: #00f0ff;
        }

        .logo-scores {
          color: #fff;
          opacity: 0.7;
          font-size: 14px;
        }

        .card-nav-cta-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #00f0ff 0%, #a855f7 100%);
          color: #0a0a12;
          border: none;
          border-radius: 0.75rem;
          padding: 0 1rem;
          height: 44px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .card-nav-cta-button:hover {
          transform: scale(1.02);
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.4);
        }

        .card-nav-content {
          position: absolute;
          left: 0;
          right: 0;
          top: 68px;
          bottom: 0;
          padding: 0.5rem;
          display: flex;
          gap: 0.5rem;
          visibility: hidden;
          pointer-events: none;
          z-index: 1;
        }

        .card-nav.open .card-nav-content {
          visibility: visible;
          pointer-events: auto;
        }

        .nav-card {
          flex: 1;
          min-width: 0;
          border-radius: 0.75rem;
          border: 1px solid currentColor;
          display: flex;
          flex-direction: column;
          padding: 1rem;
          gap: 0.75rem;
          transition: all 0.2s ease;
        }

        .nav-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .nav-card-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: -0.3px;
        }

        .nav-card-links {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-card-link {
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          opacity: 0.8;
          transition: opacity 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .nav-card-link:hover {
          opacity: 1;
        }

        .market-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-left: 6px;
          display: inline-block;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        @media (max-width: 768px) {
          .card-nav-container {
            width: 94%;
            top: 0.75rem;
          }

          .card-nav-content {
            flex-direction: column;
            gap: 0.5rem;
            top: 68px;
          }

          .nav-card {
            padding: 0.75rem 1rem;
          }

          .nav-card-label {
            font-size: 14px;
          }

          .nav-card-link {
            font-size: 13px;
          }

          .card-nav-cta-button {
            padding: 0 0.75rem;
            font-size: 12px;
          }

          .logo-text {
            font-size: 16px;
          }

          .logo-scores {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
