'use client';

import React from 'react';
import './ProfileCard.css';

export interface ProfileCardProps {
    avatarUrl?: string;
    name?: string;
    handle?: string;
    bio?: string;
    status?: string;
    experience?: 'beginner' | 'intermediate' | 'advanced';
    tradingStyle?: string;
    preferredMarkets?: string[];
    activeRooms?: string[];
    memberSince?: Date | string;
    contactText?: string;
    showUserInfo?: boolean;
    onContactClick?: () => void;
    className?: string;
}

export default function ProfileCard({
    avatarUrl,
    name = 'Trader',
    handle = 'trader',
    bio,
    status = 'Active',
    experience = 'beginner',
    tradingStyle,
    preferredMarkets = [],
    activeRooms = [],
    memberSince,
    contactText = 'Message',
    showUserInfo = true,
    onContactClick,
    className = ''
}: ProfileCardProps) {
    const formatMemberSince = (date: Date | string | undefined) => {
        if (!date) return null;
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const marketIcons: Record<string, string> = {
        forex: '📊',
        crypto: '🪙',
        stocks: '📈'
    };

    return (
        <div className={`pc-card-wrapper ${className}`.trim()}>
            <div className="pc-behind" />
            <div className="pc-card-shell">
                <section className="pc-card">
                    <div className="pc-inside">
                        <div className="pc-shine" />
                        <div className="pc-glare" />

                        <div className="pc-avatar-content">
                            {avatarUrl ? (
                                <img
                                    className="avatar"
                                    src={avatarUrl}
                                    alt={`${name} avatar`}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div
                                    className="avatar"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'linear-gradient(135deg, rgba(20,241,149,0.3), rgba(0,212,255,0.3))',
                                        fontSize: '40px',
                                        fontWeight: 700,
                                        color: 'white'
                                    }}
                                >
                                    {name?.[0]?.toUpperCase() || 'T'}
                                </div>
                            )}
                        </div>

                        <div className="pc-details">
                            <h3>{name}</h3>
                            {tradingStyle && <p>{tradingStyle}</p>}
                            {memberSince && (
                                <span className="pc-member-since">
                                    Member since {formatMemberSince(memberSince)}
                                </span>
                            )}
                        </div>

                        {showUserInfo && (
                            <div className="pc-user-info">
                                <div className="pc-user-header">
                                    <div className="pc-user-text">
                                        <div className="pc-handle">@{handle}</div>
                                        <div className="pc-status">{status}</div>
                                    </div>
                                    <span className={`pc-experience-badge ${experience}`}>
                                        {experience}
                                    </span>
                                </div>

                                {bio && <div className="pc-bio">{bio}</div>}

                                {preferredMarkets.length > 0 && (
                                    <div className="pc-trading-info">
                                        {preferredMarkets.map((market) => (
                                            <span key={market} className="pc-trading-badge">
                                                {marketIcons[market.toLowerCase()] || '📈'} {market}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {activeRooms.length > 0 && (
                                    <div className="pc-rooms-preview">
                                        {activeRooms.slice(0, 3).map((room) => (
                                            <span key={room} className="pc-room-tag">{room}</span>
                                        ))}
                                        {activeRooms.length > 3 && (
                                            <span className="pc-room-tag">+{activeRooms.length - 3}</span>
                                        )}
                                    </div>
                                )}

                                <button
                                    className="pc-contact-btn"
                                    onClick={onContactClick}
                                    type="button"
                                >
                                    {contactText}
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
